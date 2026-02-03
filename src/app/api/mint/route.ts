import { NextRequest, NextResponse } from 'next/server'
import { damlClient } from '@/lib/daml-client'
import { mintTokensSchema } from '@/lib/validations'
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
    
    // Get all tokens to find the one we want to mint
    const allTokens = await damlClient.getAllTokens()
    const token = allTokens.find(t => t.contractId === validatedData.tokenId)
    
    if (!token) {
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