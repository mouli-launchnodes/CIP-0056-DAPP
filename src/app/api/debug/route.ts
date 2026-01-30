import { NextResponse } from 'next/server'
import { mockDb } from '@/lib/mock-db'

export async function GET() {
  try {
    // Get all tokens directly from the mock database
    const tokens = await mockDb.token.findMany()
    
    console.log('Debug: All tokens in database:', tokens)
    
    return NextResponse.json({
      success: true,
      debug: {
        tokensCount: tokens.length,
        tokens: tokens
      }
    })
    
  } catch (error) {
    console.error('Debug error:', error)
    
    return NextResponse.json(
      { error: 'Debug error' },
      { status: 500 }
    )
  }
}