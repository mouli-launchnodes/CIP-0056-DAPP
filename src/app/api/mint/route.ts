import { NextRequest, NextResponse } from 'next/server'
import { mockDb } from '@/lib/mock-db'
import { cantonSDK } from '@/lib/canton'
import { mintTokensSchema } from '@/lib/validations'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Mint request body:', body)
    
    // Validate input
    const validatedData = mintTokensSchema.parse(body)
    console.log('Validated data:', validatedData)
    
    // Get token information
    const token = await mockDb.token.findUnique({
      where: { id: validatedData.tokenId }
    })
    
    console.log('Found token:', token)
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token not found. Please create a token first.' },
        { status: 404 }
      )
    }
    
    // Check if recipient Party ID exists, if not create a user for it
    let recipient = await mockDb.user.findUnique({
      where: { partyId: validatedData.recipientPartyId }
    })
    
    console.log('Found recipient:', recipient)
    
    if (!recipient) {
      // Create a new user for the recipient Party ID
      recipient = await mockDb.user.create({
        data: {
          email: `${validatedData.recipientPartyId}@canton-demo.com`,
          partyId: validatedData.recipientPartyId,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })
      console.log('Created new recipient:', recipient)
    }
    
    // Mint tokens using Canton SDK
    console.log('Minting tokens with Canton SDK...')
    const transactionResult = await cantonSDK.mintTokens({
      contractId: token.id,
      recipientPartyId: validatedData.recipientPartyId,
      amount: validatedData.amount
    })
    
    console.log('Canton SDK result:', transactionResult)
    
    // Create transaction record
    const transaction = await mockDb.transaction.create({
      data: {
        type: 'MINT',
        amount: parseFloat(validatedData.amount),
        toPartyId: validatedData.recipientPartyId,
        transactionHash: transactionResult.transactionHash,
        status: transactionResult.status === 'confirmed' ? 'CONFIRMED' : 'PENDING',
        userId: recipient.id,
        tokenId: token.id
      }
    })
    
    console.log('Created transaction:', transaction)
    
    // Update or create holding
    const existingHolding = await mockDb.holding.findUnique({
      where: {
        userId_tokenId: {
          userId: recipient.id,
          tokenId: token.id
        }
      }
    })
    
    console.log('Existing holding:', existingHolding)
    
    if (existingHolding) {
      await mockDb.holding.update({
        where: { id: existingHolding.id },
        data: {
          totalBalance: {
            increment: parseFloat(validatedData.amount)
          },
          freeCollateral: {
            increment: parseFloat(validatedData.amount)
          }
        }
      })
    } else {
      await mockDb.holding.create({
        data: {
          userId: recipient.id,
          tokenId: token.id,
          totalBalance: parseFloat(validatedData.amount),
          freeCollateral: parseFloat(validatedData.amount),
          lockedCollateral: 0
        }
      })
    }
    
    // Update token total supply
    await mockDb.token.update({
      where: { id: token.id },
      data: {
        totalSupply: {
          increment: parseFloat(validatedData.amount)
        }
      }
    })
    
    console.log('Mint operation completed successfully')
    
    return NextResponse.json({
      success: true,
      transaction: {
        transactionHash: transactionResult.transactionHash,
        status: transactionResult.status,
        blockNumber: transactionResult.blockNumber
      },
      message: 'Tokens minted successfully'
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