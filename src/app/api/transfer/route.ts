import { NextRequest, NextResponse } from 'next/server'
import { mockDb } from '@/lib/mock-db'
import { cantonSDK } from '@/lib/canton'
import { transferTokensSchema } from '@/lib/validations'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Transfer request body:', body)
    
    // Validate input
    const validatedData = transferTokensSchema.parse(body)
    console.log('Validated transfer data:', validatedData)
    
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
    
    // Verify sender exists, create if not
    let sender = await mockDb.user.findUnique({
      where: { partyId: validatedData.senderPartyId }
    })
    
    if (!sender) {
      // Create a new user for the sender Party ID
      sender = await mockDb.user.create({
        data: {
          email: `${validatedData.senderPartyId}@canton-demo.com`,
          partyId: validatedData.senderPartyId,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })
    }
    
    // Verify recipient exists, create if not
    let recipient = await mockDb.user.findUnique({
      where: { partyId: validatedData.recipientPartyId }
    })
    
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
    }
    
    // Check sender's balance
    const senderHolding = await mockDb.holding.findUnique({
      where: {
        userId_tokenId: {
          userId: sender.id,
          tokenId: token.id
        }
      }
    })
    
    if (!senderHolding || senderHolding.freeCollateral < parseFloat(validatedData.amount)) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      )
    }
    
    // Transfer tokens using Canton SDK
    const transactionResult = await cantonSDK.transferTokens({
      contractId: token.id,
      fromPartyId: validatedData.senderPartyId,
      toPartyId: validatedData.recipientPartyId,
      amount: validatedData.amount
    })
    
    // Create transaction record
    const transaction = await mockDb.transaction.create({
      data: {
        type: 'TRANSFER',
        amount: parseFloat(validatedData.amount),
        fromPartyId: validatedData.senderPartyId,
        toPartyId: validatedData.recipientPartyId,
        transactionHash: transactionResult.transactionHash,
        status: transactionResult.status === 'confirmed' ? 'CONFIRMED' : 'PENDING',
        userId: sender.id,
        tokenId: token.id
      }
    })
    
    // Update sender's holding
    await mockDb.holding.update({
      where: { id: senderHolding.id },
      data: {
        totalBalance: {
          decrement: parseFloat(validatedData.amount)
        },
        freeCollateral: {
          decrement: parseFloat(validatedData.amount)
        }
      }
    })
    
    // Update or create recipient's holding
    const recipientHolding = await mockDb.holding.findUnique({
      where: {
        userId_tokenId: {
          userId: recipient.id,
          tokenId: token.id
        }
      }
    })
    
    if (recipientHolding) {
      await mockDb.holding.update({
        where: { id: recipientHolding.id },
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
    
    return NextResponse.json({
      success: true,
      transaction: {
        transactionHash: transactionResult.transactionHash,
        status: transactionResult.status,
        blockNumber: transactionResult.blockNumber
      },
      message: 'Tokens transferred successfully'
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