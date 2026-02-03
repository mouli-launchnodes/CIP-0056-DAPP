import { NextResponse } from 'next/server'
import { damlClient } from '@/lib/daml-client'

export async function GET() {
  try {
    console.log('Debug: Fetching all tokens from DAML ledger')
    
    // Get all tokens directly from the DAML ledger (no mock database)
    const damlTokens = await damlClient.getAllTokens()
    
    console.log('Debug: All tokens from DAML ledger:', damlTokens)
    
    // Check if DAML ledger is available
    const isLedgerAvailable = await damlClient.isLedgerAvailable()
    
    return NextResponse.json({
      success: true,
      debug: {
        source: 'DAML Ledger',
        ledgerAvailable: isLedgerAvailable,
        tokenCount: damlTokens.length,
        tokens: damlTokens.map(({ contractId, metadata }) => ({
          contractId,
          tokenName: metadata.tokenName,
          issuer: metadata.issuer,
          currency: metadata.currency,
          totalSupply: metadata.totalSupply,
          description: metadata.description
        }))
      },
      message: 'Debug data from real DAML ledger (no mock data)'
    })
    
  } catch (error) {
    console.error('Debug API error:', error)
    
    return NextResponse.json({
      success: false,
      debug: {
        source: 'DAML Ledger (unavailable)',
        ledgerAvailable: false,
        tokenCount: 0,
        tokens: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      message: 'DAML ledger not available for debug information'
    })
  }
}