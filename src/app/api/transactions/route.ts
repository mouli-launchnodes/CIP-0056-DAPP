import { NextRequest, NextResponse } from 'next/server'
import { damlClient } from '@/lib/daml-client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const partyId = searchParams.get('partyId')
    const tokenId = searchParams.get('tokenId')
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    console.log('Transactions request params:', {
      partyId,
      tokenId,
      type,
      status,
      page,
      limit,
      sortBy,
      sortOrder
    })

    // For DAML ledger, we need to query transaction history
    // This implementation shows token creation events and mint transactions
    
    console.log('Fetching transactions from DAML ledger...')

    try {
      // Get all tokens to show token creation transactions
      const allTokens = await damlClient.getAllTokens()
      
      // Convert token creations to transactions
      const tokenCreationTransactions = allTokens.map((token, index) => ({
        id: `create-${token.contractId}`,
        type: 'CREATE' as const,
        amount: '1', // Token creation event
        fromPartyId: 'SYSTEM',
        toPartyId: token.metadata.issuer,
        transactionHash: `daml-create-${token.contractId}`,
        status: 'CONFIRMED' as const,
        createdAt: new Date(Date.now() - (allTokens.length - index) * 60000).toISOString(), // Stagger timestamps
        updatedAt: new Date(Date.now() - (allTokens.length - index) * 60000).toISOString(),
        user: {
          partyId: token.metadata.issuer
        },
        token: {
          name: token.metadata.tokenName,
          currency: token.metadata.currency,
          contractAddress: token.contractId
        },
        description: `Token "${token.metadata.tokenName}" created by ${token.metadata.issuer.split('::')[0]}`
      }))
      
      // If partyId is specified, also get their holdings for mint transactions
      let holdingTransactions: any[] = []
      if (partyId) {
        const holdings = await damlClient.getHoldings(partyId)
        holdingTransactions = holdings.map((holding, index) => ({
          id: `mint-${holding.contractId}-${index}`,
          type: 'MINT' as const,
          amount: holding.holding.amount,
          fromPartyId: holding.holding.issuer,
          toPartyId: holding.holding.owner,
          transactionHash: `daml-mint-${holding.contractId}`,
          status: 'CONFIRMED' as const,
          createdAt: new Date(Date.now() - index * 30000).toISOString(),
          updatedAt: new Date(Date.now() - index * 30000).toISOString(),
          user: {
            partyId: holding.holding.owner
          },
          token: {
            name: holding.holding.tokenName,
            currency: 'USD',
            contractAddress: holding.contractId
          },
          description: `${holding.holding.amount} ${holding.holding.tokenName} minted to ${holding.holding.owner.split('::')[0]}`
        }))
      }
      
      // Combine all transactions
      let allTransactions = [...tokenCreationTransactions, ...holdingTransactions]
      
      // Filter by partyId if specified
      if (partyId) {
        allTransactions = allTransactions.filter(tx => 
          tx.fromPartyId === partyId || tx.toPartyId === partyId
        )
      }

      // Apply filters
      let filteredTransactions = allTransactions

      if (tokenId) {
        filteredTransactions = filteredTransactions.filter(tx => 
          tx.token.name === tokenId || tx.token.contractAddress === tokenId
        )
      }

      if (type) {
        filteredTransactions = filteredTransactions.filter(tx => tx.type === type.toUpperCase())
      }

      if (status) {
        filteredTransactions = filteredTransactions.filter(tx => tx.status === status.toUpperCase())
      }

      // Sort transactions
      filteredTransactions.sort((a, b) => {
        if (sortOrder === 'desc') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        } else {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        }
      })

      // Calculate pagination
      const total = filteredTransactions.length
      const totalPages = Math.ceil(total / limit)
      const skip = (page - 1) * limit
      const paginatedTransactions = filteredTransactions.slice(skip, skip + limit)

      console.log(`Returning ${paginatedTransactions.length} transactions from DAML ledger (page ${page}/${totalPages})`)

      return NextResponse.json({
        success: true,
        transactions: paginatedTransactions,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        filters: {
          partyId,
          tokenId,
          type,
          status
        },
        source: 'DAML Ledger',
        note: 'Transaction history reconstructed from DAML contract holdings'
      })

    } catch (damlError) {
      console.error('DAML transaction query error:', damlError)
      
      // Return empty transactions when DAML is not available
      return NextResponse.json({
        success: true,
        transactions: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false
        },
        filters: {
          partyId,
          tokenId,
          type,
          status
        },
        source: 'DAML Ledger (unavailable)',
        error: 'DAML ledger not available for transaction history'
      })
    }

  } catch (error) {
    console.error('Transactions API error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch transactions from DAML ledger',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Get real-time transaction updates
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, partyId } = body

    if (action === 'subscribe') {
      if (!partyId) {
        return NextResponse.json({
          success: false,
          error: 'Party ID required for transaction subscription'
        }, { status: 400 })
      }

      try {
        // Get recent holdings as a proxy for recent transactions
        const holdings = await damlClient.getHoldings(partyId)
        
        const recentTransactions = holdings.slice(0, 10).map((holding, index) => ({
          id: `tx-${holding.contractId}-${index}`,
          type: 'MINT' as const,
          amount: holding.holding.amount,
          status: 'CONFIRMED' as const,
          transactionHash: `daml-tx-${holding.contractId}`,
          createdAt: new Date().toISOString(),
          token: {
            name: holding.holding.tokenName,
            currency: 'USD'
          }
        }))

        return NextResponse.json({
          success: true,
          action: 'subscribe',
          partyId,
          recentTransactions,
          source: 'DAML Ledger'
        })

      } catch (damlError) {
        console.error('DAML subscription error:', damlError)
        
        return NextResponse.json({
          success: true,
          action: 'subscribe',
          partyId,
          recentTransactions: [],
          source: 'DAML Ledger (unavailable)',
          error: 'DAML ledger not available'
        })
      }
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action'
    }, { status: 400 })

  } catch (error) {
    console.error('Transaction subscription error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to process subscription request'
      },
      { status: 500 }
    )
  }
}