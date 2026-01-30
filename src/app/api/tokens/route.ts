import { NextRequest, NextResponse } from 'next/server'
import { mockDb } from '@/lib/mock-db'
import { cantonSDK } from '@/lib/canton'
import { tokenCreationSchema } from '@/lib/validations'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validatedData = tokenCreationSchema.parse(body)
    
    // For demo purposes, we'll use a system-generated owner
    // In a real app, this would come from the authenticated user
    const systemOwner = 'system-owner-party-id'
    
    // Deploy token contract using Canton SDK
    const contractInfo = await cantonSDK.deployTokenContract({
      tokenName: validatedData.tokenName,
      currency: validatedData.currency,
      quantityPrecision: validatedData.quantityPrecision,
      pricePrecision: validatedData.pricePrecision,
      owner: systemOwner
    })
    
    // Ensure system user exists
    let systemUser = await mockDb.user.findUnique({
      where: { email: 'system@canton-demo.com' }
    })
    
    if (!systemUser) {
      systemUser = await mockDb.user.create({
        data: {
          email: 'system@canton-demo.com',
          partyId: systemOwner,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })
    }
    
    console.log('System user for token creation:', systemUser)
    
    // Store token in database
    const token = await mockDb.token.create({
      data: {
        name: validatedData.tokenName,
        currency: validatedData.currency,
        quantityPrecision: validatedData.quantityPrecision,
        pricePrecision: validatedData.pricePrecision,
        contractAddress: contractInfo.contractAddress,
        contractOwner: contractInfo.owner,
        creatorId: systemUser.id
      }
    })
    
    console.log('Created token:', token)
    
    return NextResponse.json({
      success: true,
      contract: {
        contractId: token.id,
        contractAddress: token.contractAddress,
        owner: token.contractOwner,
        tokenName: token.name,
        currency: token.currency
      },
      message: 'Token contract deployed successfully'
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
    console.log('GET /api/tokens - Fetching all tokens')
    
    const tokens = await mockDb.token.findMany({
      select: {
        id: true,
        name: true,
        currency: true,
        contractAddress: true,
        totalSupply: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    console.log('Found tokens:', tokens)
    
    return NextResponse.json({
      success: true,
      tokens
    })
    
  } catch (error) {
    console.error('Error fetching tokens:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}