import { NextRequest, NextResponse } from 'next/server'
import { damlClient } from '@/lib/daml-client'
import { mintTokensSchema } from '@/lib/validations'
import { validateUserSession, createSessionValidationResponse } from '@/lib/session-validator'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Mint request body:', body)
    
    // Validate input
    const validatedData = mintTokensSchema.parse(body)
    console.log('Validated data:', validatedData)
    
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
    
    // Get party ID from session (set during onboarding)
    const userEmail = sessionUser.email
    const sessionPartyId = sessionUser.partyId
    
    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email not found in session' },
        { status: 400 }
      )
    }
    
    if (!sessionPartyId) {
      return NextResponse.json(
        { error: 'Party ID not found in session. Please complete onboarding first.' },
        { status: 400 }
      )
    }
    
    console.log(`Minting as authenticated user: ${userEmail} (Party: ${sessionPartyId})`)
    
    // Validate user session and party ID
    console.log(`Validating session for user: ${userEmail} (Party: ${sessionPartyId})`)
    const sessionValidation = await validateUserSession(sessionPartyId, userEmail)
    
    if (!sessionValidation.isValid) {
      const errorResponse = createSessionValidationResponse(sessionValidation)
      return NextResponse.json(errorResponse, { status: 401 })
    }
    
    console.log('Session validation passed, proceeding with mint')
    
    // Get all tokens to find the one we want to mint (use user's party ID for consistency)
    console.log(`Attempting to get tokens for user party: ${sessionPartyId}`)
    const allTokens = await damlClient.getAllTokens(sessionPartyId)
    console.log(`Found ${allTokens.length} tokens for user party: ${sessionPartyId}`)
    
    // If no tokens found for user's party, try all parties as fallback
    let token = allTokens.find(t => t.contractId === validatedData.tokenId)
    
    if (!token && allTokens.length === 0) {
      console.log('No tokens found for user party, trying all parties as fallback')
      const allPartiesTokens = await damlClient.getAllTokens()
      console.log(`Found ${allPartiesTokens.length} tokens from all parties`)
      if (allPartiesTokens.length > 0) {
        console.log('Available tokens from all parties:', allPartiesTokens.map(t => ({ contractId: t.contractId, name: t.metadata.tokenName, issuer: t.metadata.issuer })))
      }
      token = allPartiesTokens.find(t => t.contractId === validatedData.tokenId)
      
      // If we found the token but it belongs to a different party, suggest re-onboarding
      if (token && token.metadata.issuer !== sessionPartyId) {
        return NextResponse.json(
          { 
            error: 'Your session is outdated. Please refresh the page and complete onboarding again.',
            details: 'The DAML ledger was restarted and your party ID is no longer valid.',
            action: 'refresh_and_onboard'
          },
          { status: 401 }
        )
      }
    }
    
    if (!token) {
      console.log(`Token not found. Looking for tokenId: ${validatedData.tokenId}`)
      console.log('Available tokens:', allTokens.map(t => ({ contractId: t.contractId, name: t.metadata.tokenName })))
      return NextResponse.json(
        { error: 'Token not found. Please create a token first.' },
        { status: 404 }
      )
    }
    
    // Verify that the authenticated user is the issuer of this token
    if (token.metadata.issuer !== sessionPartyId) {
      return NextResponse.json(
        { error: 'Unauthorized. You can only mint tokens that you created.' },
        { status: 403 }
      )
    }
    
    console.log('Found token:', token)
    console.log(`Minting as authenticated user: ${userEmail} (Party: ${sessionPartyId})`)
    
    // Mint tokens using DAML ledger
    console.log('Minting tokens via DAML ledger...')
    const mintResult = await damlClient.mintTokens({
      issuer: sessionPartyId,
      recipient: validatedData.recipientPartyId,
      tokenName: token.metadata.tokenName,
      amount: validatedData.amount
    })
    
    console.log('DAML mint result:', mintResult)
    
    return NextResponse.json({
      success: true,
      transaction: {
        transactionHash: mintResult.transactionId,
        contractId: mintResult.contractId,
        status: 'confirmed'
      },
      message: 'Tokens minted successfully on DAML ledger',
      issuer: {
        email: userEmail,
        partyId: sessionPartyId
      },
      recipient: {
        partyId: validatedData.recipientPartyId
      }
    })
    
  } catch (error) {
    console.error('Mint error:', error)
    
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