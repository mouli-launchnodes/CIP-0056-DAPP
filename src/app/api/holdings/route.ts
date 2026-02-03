import { NextRequest, NextResponse } from 'next/server'
import { damlClient } from '@/lib/daml-client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const partyId = searchParams.get('partyId')
    const tokenId = searchParams.get('tokenId')
    const systemWide = searchParams.get('systemWide') === 'true'
    
    console.log('Holdings API called with:', { partyId, tokenId, systemWide })
    
    // If specific balance check for a party and token
    if (partyId && tokenId) {
      console.log(`Checking balance for party ${partyId} and token ${tokenId}`)
      
      try {
        const holdings = await damlClient.getHoldings(partyId)
        
        // Find the specific token holding by either tokenName or contractId
        const tokenHolding = holdings.find(h => 
          h.holding.tokenName === tokenId || h.contractId === tokenId
        )
        
        if (!tokenHolding) {
          // Also try to find by token name from the tokens list
          const allTokens = await damlClient.getAllTokens()
          const token = allTokens.find(t => t.contractId === tokenId)
          
          if (token) {
            // Look for holding by token name
            const holdingByName = holdings.find(h => h.holding.tokenName === token.metadata.tokenName)
            if (holdingByName) {
              return NextResponse.json({
                success: true,
                balance: {
                  available: holdingByName.holding.amount,
                  token: holdingByName.holding.tokenName
                }
              })
            }
          }
          
          return NextResponse.json({
            success: true,
            balance: {
              available: '0',
              token: token?.metadata.tokenName || tokenId
            }
          })
        }
        
        return NextResponse.json({
          success: true,
          balance: {
            available: tokenHolding.holding.amount,
            token: tokenHolding.holding.tokenName
          }
        })
      } catch (error) {
        console.error('Error fetching specific balance:', error)
        return NextResponse.json({
          success: true,
          balance: {
            available: '0',
            token: tokenId
          }
        })
      }
    }
    
    // Handle system-wide holdings request (for dashboard stats)
    if (systemWide) {
      console.log('Fetching system-wide holdings for dashboard stats')
      
      try {
        // Get all tokens first
        const allTokens = await damlClient.getAllTokens()
        
        // For system-wide view, show all tokens with their current supply
        // In DAML, token creation doesn't automatically create holdings
        // Holdings are created when tokens are minted to specific parties
        const systemHoldings = allTokens.map(token => ({
          id: token.contractId,
          partyId: token.metadata.issuer,
          tokenName: token.metadata.tokenName,
          currency: token.metadata.currency,
          totalBalance: token.metadata.totalSupply,
          freeCollateral: token.metadata.totalSupply,
          lockedCollateral: '0',
          contractAddress: token.contractId,
          recentTransactions: [],
          type: 'TOKEN_CREATED',
          issuer: token.metadata.issuer.split('::')[0]
        }))
        
        console.log('System-wide holdings (token metadata):', systemHoldings)
        
        return NextResponse.json({
          success: true,
          holdings: systemHoldings,
          systemWide: true,
          note: 'Showing created tokens - mint tokens to create actual holdings'
        })
      } catch (error) {
        console.error('Error fetching system-wide holdings:', error)
        return NextResponse.json({
          success: true,
          holdings: [],
          systemWide: true,
          error: 'Failed to fetch system-wide holdings from DAML ledger'
        })
      }
    }
    
    // For user-specific holdings listing, partyId is required
    if (!partyId) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Party ID is required for user-specific holdings lookup. Use systemWide=true for dashboard stats.' 
        },
        { status: 400 }
      )
    }

    console.log(`Fetching holdings for party: ${partyId}`)
    
    try {
      // Get holdings from DAML ledger
      const damlHoldings = await damlClient.getHoldings(partyId)
      
      // Transform DAML holdings to API format
      const formattedHoldings = damlHoldings.map(({ contractId, holding }) => ({
        id: contractId,
        partyId: holding.owner,
        tokenName: holding.tokenName,
        currency: 'USD', // Default currency, could be enhanced
        totalBalance: holding.amount,
        freeCollateral: holding.amount,
        lockedCollateral: '0',
        contractAddress: contractId,
        recentTransactions: []
      }))
      
      console.log(`Formatted holdings for ${partyId}:`, formattedHoldings)
      
      return NextResponse.json({
        success: true,
        holdings: formattedHoldings,
        partyId: partyId
      })
    } catch (error) {
      console.error(`Error fetching holdings for party ${partyId}:`, error)
      
      return NextResponse.json({
        success: true,
        holdings: [],
        partyId: partyId,
        error: 'Failed to fetch holdings from DAML ledger'
      })
    }
    
  } catch (error) {
    console.error('Error in holdings API:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}