import { NextRequest, NextResponse } from 'next/server'
import { damlClient } from '@/lib/daml-client'
import { burnTokensSchema } from '@/lib/validations'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Burn request body:', body)
    
    // Validate input
    const validatedData = burnTokensSchema.parse(body)
    console.log('Validated burn data:', validatedData)
    
    // Get all tokens to find the one we want to burn
    const allTokens = await damlClient.getAllTokens()
    const token = allTokens.find(t => t.contractId === validatedData.tokenId)
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token not found' },
        { status: 404 }
      )
    }
    
    console.log('Found token for burning:', token)
    
    // Check user's balance first
    const userHoldings = await damlClient.getHoldings(validatedData.partyId)
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
      owner: validatedData.partyId,
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