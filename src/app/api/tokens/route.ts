import { NextRequest, NextResponse } from 'next/server'
import { damlClient } from '@/lib/daml-client'
import { tokenCreationSchema } from '@/lib/validations'
import { validateUserSession, createSessionValidationResponse } from '@/lib/session-validator'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Token creation request body:', body)
    
    // Validate input
    const validatedData = tokenCreationSchema.parse(body)
    console.log('Token creation validated data:', validatedData)
    
    // Get authenticated user from session
    const cookieStore = await cookies()
    const userCookie = cookieStore.get('auth0_user')
    
    console.log('User cookie exists:', !!userCookie)
    
    if (!userCookie) {
      console.log('No auth0_user cookie found')
      return NextResponse.json(
        { error: 'Authentication required. Please log in first.' },
        { status: 401 }
      )
    }
    
    let sessionUser
    try {
      sessionUser = JSON.parse(userCookie.value)
      console.log('Session user parsed:', { email: sessionUser.email, partyId: sessionUser.partyId })
    } catch (error) {
      console.log('Failed to parse user cookie:', error)
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
    
    console.log(`Creating token for authenticated user: ${userEmail} (Party: ${sessionPartyId})`)
    
    // Validate user session and party ID
    console.log(`Validating session for user: ${userEmail} (Party: ${sessionPartyId})`)
    const sessionValidation = await validateUserSession(sessionPartyId, userEmail)
    
    if (!sessionValidation.isValid) {
      const errorResponse = createSessionValidationResponse(sessionValidation)
      return NextResponse.json(errorResponse, { status: 401 })
    }
    
    console.log('Session validation passed, proceeding with token creation')
    
    // Create token using DAML ledger with real user as issuer
    const result = await damlClient.createToken({
      issuer: sessionPartyId,
      tokenName: validatedData.tokenName,
      currency: validatedData.currency,
      quantityPrecision: validatedData.quantityPrecision,
      pricePrecision: validatedData.pricePrecision,
      description: validatedData.description || `${validatedData.tokenName} token`
    })
    
    console.log('Created token via DAML:', result)
    
    return NextResponse.json({
      success: true,
      contract: {
        contractId: result.contractId,
        contractAddress: result.contractId, // Use contractId as address for DAML
        owner: result.metadata.issuer,
        tokenName: result.metadata.tokenName,
        currency: result.metadata.currency,
        totalSupply: result.metadata.totalSupply
      },
      message: 'Token contract created successfully on DAML ledger',
      issuer: {
        email: userEmail,
        partyId: sessionPartyId
      }
    })
    
  } catch (error) {
    console.error('Token creation error:', error)
    
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

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/tokens - Fetching all tokens from DAML ledger')
    
    // Get authenticated user from session to use their party ID
    const cookieStore = await cookies()
    const userCookie = cookieStore.get('auth0_user')
    
    let userPartyId: string | undefined
    
    if (userCookie) {
      try {
        const sessionUser = JSON.parse(userCookie.value)
        userPartyId = sessionUser.partyId
        console.log(`Fetching tokens for authenticated user party: ${userPartyId}`)
      } catch (error) {
        console.log('Could not parse user session, fetching all tokens')
      }
    }
    
    // Try multiple approaches to get tokens
    let damlTokens: any[] = []
    
    // Approach 1: Query with specific user party if available
    if (userPartyId) {
      try {
        console.log(`Attempting to fetch tokens for specific party: ${userPartyId}`)
        damlTokens = await damlClient.getAllTokens(userPartyId)
        console.log(`Found ${damlTokens.length} tokens for specific party`)
      } catch (error) {
        console.log(`Failed to fetch tokens for specific party: ${error}`)
      }
    }
    
    // Approach 2: If no tokens found with specific party, try all parties
    if (damlTokens.length === 0) {
      try {
        console.log('Attempting to fetch tokens from all parties')
        damlTokens = await damlClient.getAllTokens()
        console.log(`Found ${damlTokens.length} tokens from all parties`)
      } catch (error) {
        console.log(`Failed to fetch tokens from all parties: ${error}`)
      }
    }
    
    // Transform DAML tokens to API format
    const tokens = damlTokens.map(({ contractId, metadata }) => ({
      id: contractId,
      name: metadata.tokenName,
      currency: metadata.currency,
      contractAddress: contractId,
      totalSupply: metadata.totalSupply,
      createdAt: new Date().toISOString(), // DAML doesn't store creation time in this example
      quantityPrecision: metadata.quantityPrecision,
      pricePrecision: metadata.pricePrecision,
      description: metadata.description,
      issuer: metadata.issuer
    }))
    
    console.log(`Returning ${tokens.length} tokens to client`)
    if (tokens.length > 0) {
      console.log('Token details:', tokens.map(t => ({ name: t.name, issuer: t.issuer, contractId: t.id })))
    }
    
    return NextResponse.json({
      success: true,
      tokens,
      debug: {
        userPartyId,
        tokenCount: tokens.length,
        fetchMethod: userPartyId ? 'specific_party' : 'all_parties'
      }
    })
    
  } catch (error) {
    console.error('Error fetching tokens from DAML ledger:', error)
    
    // STRICT MODE: No fallback - throw error when DAML is not available
    return NextResponse.json({
      success: false,
      error: 'DAML ledger is required but not available. Please ensure DAML is running.',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 503 })
  }
}