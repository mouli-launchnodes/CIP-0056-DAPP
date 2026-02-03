import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('Debug: Checking legacy proposals storage')
    
    if (!global.legacyProposals) {
      return NextResponse.json({
        success: true,
        message: 'No legacy proposals storage found',
        proposals: [],
        storageExists: false
      })
    }
    
    const proposals = Array.from(global.legacyProposals.entries()).map(([id, proposal]) => ({
      id,
      ...proposal
    }))
    
    console.log(`Debug: Found ${proposals.length} legacy proposals`)
    
    return NextResponse.json({
      success: true,
      proposals,
      storageExists: true,
      totalCount: global.legacyProposals.size
    })
    
  } catch (error) {
    console.error('Debug API error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}