import { NextRequest, NextResponse } from 'next/server'
import { cantonSDK } from '@/lib/canton'

export async function GET() {
  try {
    console.log('Testing Canton Network authentication...')
    
    // Test the authentication status
    const authStatus = cantonSDK.getAuthStatus()
    
    console.log('Canton auth status:', authStatus)
    
    return NextResponse.json({
      success: true,
      message: 'Canton Network authentication test',
      authStatus,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Canton test error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Canton Network test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body
    
    if (action === 'test_party_generation') {
      console.log('Testing Canton party generation...')
      
      const partyInfo = await cantonSDK.generatePartyId('test@example.com')
      
      return NextResponse.json({
        success: true,
        message: 'Party generation test successful',
        partyInfo,
        timestamp: new Date().toISOString()
      })
    }
    
    if (action === 'test_token_deployment') {
      console.log('Testing Canton token deployment...')
      
      const tokenContract = await cantonSDK.deployTokenContract({
        tokenName: 'Test Token',
        currency: 'TEST',
        quantityPrecision: 6,
        pricePrecision: 2,
        owner: 'test-party-id'
      })
      
      return NextResponse.json({
        success: true,
        message: 'Token deployment test successful',
        tokenContract,
        timestamp: new Date().toISOString()
      })
    }
    
    return NextResponse.json(
      { error: 'Invalid test action' },
      { status: 400 }
    )
    
  } catch (error) {
    console.error('Canton test error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Canton Network test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}