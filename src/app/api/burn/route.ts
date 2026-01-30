import { NextRequest, NextResponse } from 'next/server'
import { mockDb } from '@/lib/mock-db'
import { cantonSDK } from '@/lib/canton'
import { burnTokensSchema } from '@/lib/validations'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Burn request body:', body)
    
    // Validate input
    const validatedData = burnTokensSchema.parse(body)
    console.log('Validated burn data:', validatedData)
    
    // Get token information
    const token = await mockDb.token.findUnique({
      where: { id: validatedData.tokenId }
    })
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token not found' },
        { status: 404 }
      )
    }
    
    // Verify user exists, create if not
    let user = await mockDb.user.findUnique({
      where: { partyId: validatedData.partyId }
    })
    
    console.log('Looking for user with partyId:', validatedData.partyId)
    console.log('Found user:', user)
    
    if (!user) {
      // Create a new user for the Party ID
      user = await mockDb.user.create({
        data: {
          email: `${validatedData.partyId}@canton-demo.com`,
          partyId: validatedData.partyId,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })
      console.log('Created new user:', user)
    }
    
    // Check user's balance
    const userHolding = await mockDb.holding.findUnique({
      where: {
        userId_tokenId: {
          userId: user.id,
          tokenId: token.id
        }
      }
    })
    
    console.log('User holding found:', userHolding)
    console.log('Requested burn amount:', validatedData.amount)
    console.log('Available balance:', userHolding?.freeCollateral)
    
    const requestedAmount = parseFloat(validatedData.amount)
    const availableBalance = userHolding?.freeCollateral || 0
    
    if (!userHolding || availableBalance < requestedAmount) {
      console.log('Insufficient balance check failed:', {
        hasHolding: !!userHolding,
        freeCollateral: availableBalance,
        requestedAmount: requestedAmount,
        comparison: availableBalance < requestedAmount,
        difference: availableBalance - requestedAmount
      })
      
      return NextResponse.json(
        { 
          error: `Insufficient balance. Available: ${availableBalance}, Requested: ${requestedAmount}` 
        },
        { status: 400 }
      )
    }
    
    // Burn tokens using Canton SDK
    const transactionResult = await cantonSDK.burnTokens({
      contractId: token.id,
      partyId: validatedData.partyId,
      amount: validatedData.amount
    })
    
    // Create transaction record
    const transaction = await mockDb.transaction.create({
      data: {
        type: 'BURN',
        amount: parseFloat(validatedData.amount),
        fromPartyId: validatedData.partyId,
        transactionHash: transactionResult.transactionHash,
        status: transactionResult.status === 'confirmed' ? 'CONFIRMED' : 'PENDING',
        userId: user.id,
        tokenId: token.id
      }
    })
    
    // Update user's holding
    await mockDb.holding.update({
      where: { id: userHolding.id },
      data: {
        totalBalance: {
          decrement: parseFloat(validatedData.amount)
        },
        freeCollateral: {
          decrement: parseFloat(validatedData.amount)
        }
      }
    })
    
    // Update token total supply
    await mockDb.token.update({
      where: { id: token.id },
      data: {
        totalSupply: {
          decrement: parseFloat(validatedData.amount)
        }
      }
    })
    
    return NextResponse.json({
      success: true,
      transaction: {
        transactionHash: transactionResult.transactionHash,
        status: transactionResult.status,
        blockNumber: transactionResult.blockNumber
      },
      message: 'Tokens burned successfully'
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