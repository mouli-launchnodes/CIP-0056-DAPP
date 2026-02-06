import { NextRequest, NextResponse } from 'next/server'
import { damlClient } from '@/lib/daml-client'
import { burnTokensSchema } from '@/lib/validations'
import { validateUserSession, createSessionValidationResponse } from '@/lib/session-validator'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Burn request body:', body)
    
    // Validate input
    const validatedData = burnTokensSchema.parse(body)
    console.log('Validated burn data:', validatedData)
    
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
    
    console.log('Session validation passed, proceeding with burn')
    
    // Get all tokens to find the one we want to burn
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
          details: 'The token you are trying to burn does not exist or you do not have access to it.'
        },
        { status: 422 } // Changed from 404 to 422
      )
    }
    
    console.log('Found token for burning:', token)
    
    // Check user's balance first
    const userHoldings = await damlClient.getHoldings(sessionPartyId)
    const userTokenHolding = userHoldings.find(h => h.holding.tokenName === token.metadata.tokenName)
    
    const requestedAmount = parseFloat(validatedData.amount)
    const availableBalance = userTokenHolding ? parseFloat(userTokenHolding.holding.amount) : 0
    
    if (!userTokenHolding || availableBalance < requestedAmount) {
      console.log('Insufficient balance check failed:', {
        hasHolding: !!userTokenHolding,
        availableBalance: availableBalance,
        requestedAmount: requestedAmount
      })
      
      return NextResponse.json(
        { 
          error: `Insufficient balance. Available: ${availableBalance}, Requested: ${requestedAmount}` 
        },
        { status: 400 }
      )
    }
    
    // Burn tokens using DAML ledger
    console.log('Burning tokens via DAML ledger...')
    const burnResult = await damlClient.burnTokens({
      owner: sessionPartyId,
      tokenName: token.metadata.tokenName,
      amount: validatedData.amount
    })
    
    console.log('DAML burn result:', burnResult)
    
    return NextResponse.json({
      success: true,
      transaction: {
        transactionHash: burnResult.transactionId,
        status: 'confirmed'
      },
      message: 'Tokens burned successfully on DAML ledger'
    })
    
  } catch (error) {
    console.error('Burn error:', error)
    
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