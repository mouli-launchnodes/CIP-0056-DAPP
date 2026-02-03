import { NextRequest, NextResponse } from 'next/server'
import { damlClient } from '@/lib/daml-client'
import { transferTokensSchema } from '@/lib/validations'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Transfer request body:', body)
    
    // Validate input
    const validatedData = transferTokensSchema.parse(body)
    console.log('Validated transfer data:', validatedData)
    
    // Get all tokens to find the one we want to transfer
    const allTokens = await damlClient.getAllTokens()
    const token = allTokens.find(t => t.contractId === validatedData.tokenId)
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token not found' },
        { status: 404 }
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
    const transferResult = await damlClient.transferTokens({
      from: validatedData.senderPartyId,
      to: validatedData.recipientPartyId,
      tokenName: token.metadata.tokenName,
      amount: validatedData.amount
    })
    
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