import { NextRequest, NextResponse } from 'next/server'
import { mockDb } from '@/lib/mock-db'
import { storage } from '@/lib/mock-db-storage'

interface User {
  id: string
  email: string
  partyId: string
  createdAt: Date | string
  updatedAt: Date | string
}

interface Token {
  id: string
  name: string
  currency: string
  contractAddress: string
  totalSupply: number
  createdAt: Date | string
  updatedAt: Date | string
}

interface Transaction {
  id: string
  type: 'MINT' | 'TRANSFER' | 'BURN'
  amount: number
  fromPartyId?: string
  toPartyId?: string
  transactionHash?: string
  status: 'PENDING' | 'CONFIRMED' | 'FAILED'
  userId: string
  tokenId: string
  createdAt: Date | string
  updatedAt: Date | string
}

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

    // Load all transactions from storage
    const allTransactions: Transaction[] = storage.transactions.load()
    const allUsers: User[] = storage.users.load()
    const allTokens: Token[] = storage.tokens.load()

    console.log('Loaded data:', {
      transactions: allTransactions.length,
      users: allUsers.length,
      tokens: allTokens.length
    })

    // Filter transactions
    let filteredTransactions = allTransactions

    if (partyId) {
      // Find user by partyId first
      const user = allUsers.find(u => u.partyId === partyId)
      
      console.log(`Looking for user with partyId: ${partyId}`, user)
      
      if (user) {
        // Filter transactions for this specific user
        filteredTransactions = filteredTransactions.filter(tx => tx.userId === user.id)
        console.log(`Found ${filteredTransactions.length} transactions for user ${user.id} (${user.partyId})`)
      } else {
        // If user not found, return empty results
        console.log(`No user found with partyId: ${partyId}`)
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
          message: `No transactions found for Party ID: ${partyId}`
        })
      }
    }

    if (tokenId) {
      filteredTransactions = filteredTransactions.filter(tx => tx.tokenId === tokenId)
      console.log(`After token filter (${tokenId}): ${filteredTransactions.length} transactions`)
    }

    if (type) {
      filteredTransactions = filteredTransactions.filter(tx => tx.type === type.toUpperCase())
      console.log(`After type filter (${type}): ${filteredTransactions.length} transactions`)
    }

    if (status) {
      filteredTransactions = filteredTransactions.filter(tx => tx.status === status.toUpperCase())
      console.log(`After status filter (${status}): ${filteredTransactions.length} transactions`)
    }

    console.log('Final filtered transactions:', filteredTransactions.length)

    // Sort transactions
    filteredTransactions.sort((a, b) => {
      let aValue: any
      let bValue: any
      
      if (sortBy === 'createdAt') {
        aValue = new Date(a.createdAt).getTime()
        bValue = new Date(b.createdAt).getTime()
      } else {
        aValue = (a as any)[sortBy]
        bValue = (b as any)[sortBy]
      }
      
      // Handle undefined values
      if (aValue === undefined && bValue === undefined) return 0
      if (aValue === undefined) return 1
      if (bValue === undefined) return -1
      
      if (sortOrder === 'desc') {
        return aValue > bValue ? -1 : 1
      } else {
        return aValue < bValue ? -1 : 1
      }
    })

    // Calculate pagination
    const total = filteredTransactions.length
    const totalPages = Math.ceil(total / limit)
    const skip = (page - 1) * limit
    const paginatedTransactions = filteredTransactions.slice(skip, skip + limit)

    console.log(`Returning ${paginatedTransactions.length} transactions (page ${page}/${totalPages})`)

    // Format transactions for response with user and token data
    const formattedTransactions = paginatedTransactions.map(tx => {
      const user = allUsers.find(u => u.id === tx.userId)
      const token = allTokens.find(t => t.id === tx.tokenId)
      
      return {
        id: tx.id,
        type: tx.type,
        amount: tx.amount.toString(),
        fromPartyId: tx.fromPartyId,
        toPartyId: tx.toPartyId,
        transactionHash: tx.transactionHash,
        status: tx.status,
        createdAt: tx.createdAt instanceof Date ? tx.createdAt.toISOString() : tx.createdAt,
        updatedAt: tx.updatedAt instanceof Date ? tx.updatedAt.toISOString() : tx.updatedAt,
        user: user ? {
          id: user.id,
          email: user.email,
          partyId: user.partyId
        } : null,
        token: token ? {
          id: token.id,
          name: token.name,
          currency: token.currency,
          contractAddress: token.contractAddress
        } : null
      }
    })

    return NextResponse.json({
      success: true,
      transactions: formattedTransactions,
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
      }
    })

  } catch (error) {
    console.error('Transactions API error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch transactions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Get real-time transaction updates (WebSocket simulation)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, partyId } = body

    if (action === 'subscribe') {
      // In a real implementation, this would set up WebSocket connection
      // For now, we'll return the latest transactions
      
      const allUsers: User[] = storage.users.load()
      const allTransactions: Transaction[] = storage.transactions.load()
      const allTokens: Token[] = storage.tokens.load()
      
      const user = allUsers.find(u => u.partyId === partyId)

      if (!user) {
        return NextResponse.json({
          success: false,
          error: 'User not found'
        }, { status: 404 })
      }

      // Get latest 10 transactions for real-time updates
      const recentTransactions = allTransactions
        .filter(tx => tx.userId === user.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10)
        .map(tx => {
          const token = allTokens.find(t => t.id === tx.tokenId)
          return {
            id: tx.id,
            type: tx.type,
            amount: tx.amount.toString(),
            status: tx.status,
            transactionHash: tx.transactionHash,
            createdAt: tx.createdAt instanceof Date ? tx.createdAt.toISOString() : tx.createdAt,
            token: token ? {
              name: token.name,
              currency: token.currency
            } : null
          }
        })

      return NextResponse.json({
        success: true,
        action: 'subscribe',
        partyId,
        recentTransactions
      })
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