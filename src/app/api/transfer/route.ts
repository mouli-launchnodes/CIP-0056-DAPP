import { NextRequest, NextResponse } from 'next/server'
import { damlClient } from '@/lib/daml-client'
import { transferTokensSchema } from '@/lib/validations'
import { validateUserSession, createSessionValidationResponse } from '@/lib/session-validator'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Transfer request body:', body)
    
    // Validate input
    const validatedData = transferTokensSchema.parse(body)
    console.log('Validated transfer data:', validatedData)
    
    // Get authenticated user from session
    const cookieStore = await cookies()
    const userCookie = cookieStore.get('auth0_user')
    
    if (!userCookie) {
      return NextResponse.json(
        { error: 'Authentication required. Please log in first.' },
        { status: 401 }
      )
    }
    
    let sessionUser
    try {
      sessionUser = JSON.parse(userCookie.value)
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid session. Please log in again.' },
        { status: 401 }
      )
    }
    
    const userEmail = sessionUser.email
    const sessionPartyId = sessionUser.partyId
    
    if (!userEmail || !sessionPartyId) {
      return NextResponse.json(
        { error: 'Incomplete session. Please complete onboarding first.' },
        { status: 400 }
      )
    }
    
    // Validate user session and party ID
    console.log(`Validating session for user: ${userEmail} (Party: ${sessionPartyId})`)
    const sessionValidation = await validateUserSession(sessionPartyId, userEmail)
    
    if (!sessionValidation.isValid) {
      const errorResponse = createSessionValidationResponse(sessionValidation)
      return NextResponse.json(errorResponse, { status: 401 })
    }
    
    console.log('Session validation passed, proceeding with transfer')
    
    // Get all tokens to find the one we want to transfer
    const allTokens = await damlClient.getAllTokens(sessionPartyId)
    console.log(`Found ${allTokens.length} tokens for user party`)
    
    // If no tokens found for user's party, try all parties as fallback
    let token = allTokens.find(t => t.contractId === validatedData.tokenId)
    
    if (!token && allTokens.length === 0) {
      console.log('No tokens found for user party, trying all parties as fallback')
      const allPartiesTokens = await damlClient.getAllTokens()
      console.log(`Found ${allPartiesTokens.length} tokens from all parties`)
      token = allPartiesTokens.find(t => t.contractId === validatedData.tokenId)
    }
    
    if (!token) {
      console.log(`Token not found. Looking for tokenId: ${validatedData.tokenId}`)
      return NextResponse.json(
        { 
          error: 'Token not found. Please ensure you have created a token first.',
          details: 'The token you are trying to transfer does not exist or you do not have access to it.'
        },
        { status: 422 } // Changed from 404 to 422 (Unprocessable Entity)
      )
    }
    
    console.log('Found token for transfer:', token)
    
    // Check sender's balance first
    const senderHoldings = await damlClient.getHoldings(validatedData.senderPartyId)
    console.log('Sender holdings:', senderHoldings)
    const senderTokenHolding = senderHoldings.find(h => h.holding.tokenName === token.metadata.tokenName)
    console.log('Sender token holding:', senderTokenHolding)
    
    if (!senderTokenHolding || parseFloat(senderTokenHolding.holding.amount) < parseFloat(validatedData.amount)) {
      console.log('Insufficient balance check:', {
        hasHolding: !!senderTokenHolding,
        holdingAmount: senderTokenHolding?.holding.amount,
        requestedAmount: validatedData.amount,
        sufficientBalance: senderTokenHolding ? parseFloat(senderTokenHolding.holding.amount) >= parseFloat(validatedData.amount) : false
      })
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      )
    }
    
    // Transfer tokens using DAML ledger (creates proposals for new/previous, simulated proposals for legacy)
    console.log('Transferring tokens via DAML ledger...')
    let transferResult
    try {
      transferResult = await damlClient.transferTokens({
        from: validatedData.senderPartyId,
        to: validatedData.recipientPartyId,
        tokenName: token.metadata.tokenName,
        amount: validatedData.amount
      })
    } catch (transferError: any) {
      console.error('DAML transfer error:', transferError)

      // Handle specific DAML errors with user-friendly messages
      const errorMessage = transferError?.message || String(transferError)

      if (errorMessage.includes('UNKNOWN_INFORMEES') || errorMessage.includes('unknownInformees')) {
        // Extract which party is unknown from the error
        const unknownPartyMatch = errorMessage.match(/unknownInformees.*?Set\((.*?)\)/)
        const unknownParty = unknownPartyMatch ? unknownPartyMatch[1] : 'unknown'

        return NextResponse.json(
          {
            error: `Party not found on Canton Network. This usually happens when Canton was restarted. Please ask both sender and recipient to log out, clear browser data, and re-onboard.`,
            details: `Unknown party: ${unknownParty}`,
            code: 'PARTY_NOT_FOUND',
            troubleshooting: [
              '1. Canton may have been restarted - party IDs from previous sessions are invalid',
              '2. Both sender and recipient should: Log out → Clear localStorage → Log in again → Complete onboarding',
              '3. This will allocate fresh party IDs on the current Canton instance'
            ]
          },
          { status: 400 }
        )
      }

      if (errorMessage.includes('CONTRACT_NOT_FOUND') || errorMessage.includes('not found')) {
        return NextResponse.json(
          {
            error: 'The token holding contract was not found. The balance may have changed. Please refresh and try again.',
            code: 'CONTRACT_NOT_FOUND'
          },
          { status: 400 }
        )
      }

      throw transferError
    }

    console.log('DAML transfer result:', transferResult)
    
    // ALL transfers now require acceptance (both DAML proposals and legacy simulated proposals)
    // Create notification for recipient about the proposal
    try {
      await fetch('http://localhost:3000/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partyId: validatedData.recipientPartyId,
          type: 'transfer_proposal',
          from: validatedData.senderPartyId,
          to: validatedData.recipientPartyId,
          tokenName: token.metadata.tokenName,
          amount: validatedData.amount,
          proposalId: transferResult.proposalId || transferResult.transactionId,
          message: `You have received a transfer proposal for ${validatedData.amount} ${token.metadata.tokenName} tokens from ${validatedData.senderPartyId.split('::')[0]}. Please accept or reject this proposal.`
        })
      })
    } catch (notificationError) {
      console.warn('Failed to create notification:', notificationError)
    }
    
    return NextResponse.json({
      success: true,
      requiresAcceptance: true, // ALWAYS true now (both DAML and legacy proposals)
      proposalId: transferResult.proposalId || transferResult.transactionId,
      transaction: {
        transactionHash: transferResult.transactionId,
        status: 'pending_acceptance'
      },
      message: 'Transfer proposal created successfully. Recipient needs to accept the transfer.',
      acceptanceUrl: `/api/transfer/accept`,
      notification: {
        message: `Transfer proposal sent to ${validatedData.recipientPartyId.split('::')[0]}. They will be notified to accept or reject the proposal.`,
        recipientNotified: true
      }
    })
    
  } catch (error) {
    console.error('Transfer error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}