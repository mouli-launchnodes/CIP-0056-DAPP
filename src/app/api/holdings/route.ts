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
      console.log(`\n=== Balance Check Request ===`)
      console.log(`Party ID: ${partyId}`)
      console.log(`Token ID: ${tokenId}`)

      try {
        // Get holdings for this party first
        const holdings = await damlClient.getHoldings(partyId)
        console.log(`Found ${holdings.length} holdings for party ${partyId.substring(0, 30)}...`)

        if (holdings.length > 0) {
          console.log('Holdings for this party:')
          holdings.forEach(h => {
            console.log(`  - ${h.holding.tokenName}: ${h.holding.amount}`)
          })
        } else {
          console.log('No holdings found for this party')
        }

        // Try to find the token to get its name
        // tokenId could be either a contractId or a tokenName
        let targetTokenName = tokenId

        // First, try to get tokens to resolve contractId -> tokenName
        try {
          const allTokens = await damlClient.getAllTokens(partyId)
          console.log(`Found ${allTokens.length} tokens in the system`)

          const token = allTokens.find(t => t.contractId === tokenId || t.metadata.tokenName === tokenId)
          if (token) {
            targetTokenName = token.metadata.tokenName
            console.log(`Resolved token: ${targetTokenName}`)
          } else {
            console.log(`Token not found by contractId, will try direct tokenName match`)
          }
        } catch (tokenError) {
          console.log('Could not fetch tokens, will try direct tokenName match')
        }

        // Find the specific token holding by tokenName
        let tokenHolding = holdings.find(h => h.holding.tokenName === targetTokenName)

        // If not found by resolved name, try matching the raw tokenId as tokenName
        if (!tokenHolding && targetTokenName !== tokenId) {
          tokenHolding = holdings.find(h => h.holding.tokenName === tokenId)
          if (tokenHolding) {
            targetTokenName = tokenId
            console.log(`Found holding by raw tokenId match: ${targetTokenName}`)
          }
        }

        // If still not found, try partial match (tokenName contains or starts with)
        if (!tokenHolding && holdings.length > 0) {
          // Try to find by tokenId being a prefix of holding's tokenName or vice versa
          tokenHolding = holdings.find(h =>
            h.holding.tokenName.includes(tokenId) ||
            tokenId.includes(h.holding.tokenName)
          )
          if (tokenHolding) {
            targetTokenName = tokenHolding.holding.tokenName
            console.log(`Found holding by partial match: ${targetTokenName}`)
          }
        }

        if (tokenHolding) {
          console.log(`=== Found holding: ${targetTokenName} = ${tokenHolding.holding.amount} ===`)
          return NextResponse.json({
            success: true,
            balance: {
              available: tokenHolding.holding.amount,
              token: tokenHolding.holding.tokenName
            }
          })
        }

        // No holding found - check if user has any holdings at all
        if (holdings.length > 0) {
          console.log(`Token "${targetTokenName}" not found in holdings.`)
          console.log(`Available tokens for this party: ${holdings.map(h => h.holding.tokenName).join(', ')}`)
        }

        return NextResponse.json({
          success: true,
          balance: {
            available: '0',
            token: targetTokenName
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
          success: false,
          error: 'DAML ledger is required for holdings data but is not available. Please ensure DAML is running.',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 503 })
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
        success: false,
        error: 'DAML ledger is required for holdings data but is not available. Please ensure DAML is running.',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 503 })
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