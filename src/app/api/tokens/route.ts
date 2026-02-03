import { NextRequest, NextResponse } from 'next/server'
import { damlClient } from '@/lib/daml-client'
import { tokenCreationSchema } from '@/lib/validations'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validatedData = tokenCreationSchema.parse(body)
    
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
    
    console.log(`Creating token for authenticated user: ${userEmail} (Party: ${sessionPartyId})`)
    
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

export async function GET() {
  try {
    console.log('GET /api/tokens - Fetching all tokens from DAML ledger')
    
    // Get all tokens from DAML ledger (no mock data)
    const damlTokens = await damlClient.getAllTokens()
    
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
    
    console.log(`Found ${tokens.length} tokens from DAML ledger:`, tokens)
    
    return NextResponse.json({
      success: true,
      tokens
    })
    
  } catch (error) {
    console.error('Error fetching tokens from DAML ledger:', error)
    
    // Return empty array instead of mock data when DAML is not available
    console.log('DAML ledger not available, returning empty token list')
    return NextResponse.json({
      success: true,
      tokens: []
    })
  }
}