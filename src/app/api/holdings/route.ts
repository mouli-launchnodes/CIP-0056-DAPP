import { NextRequest, NextResponse } from 'next/server'
import { mockDb } from '@/lib/mock-db'

// Import the holdings array directly for now
const getHoldings = () => {
  // This is a workaround to access the internal holdings array
  return (mockDb as any).holding._holdings || []
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const partyId = searchParams.get('partyId')
    const tokenId = searchParams.get('tokenId')
    const systemWide = searchParams.get('systemWide') === 'true'
    
    console.log('Holdings API called with:', { partyId, tokenId, systemWide })
    
    // If specific balance check
    if (partyId && tokenId) {
      const user = await mockDb.user.findUnique({
        where: { partyId }
      })
      
      console.log('Found user for balance check:', user)
      
      if (!user) {
        // Return zero balance instead of 404 for non-existent users
        return NextResponse.json({
          success: true,
          balance: {
            available: '0',
            token: 'No holdings'
          }
        })
      }
      
      const holding = await mockDb.holding.findUnique({
        where: {
          userId_tokenId: {
            userId: user.id,
            tokenId: tokenId
          }
        }
      })
      
      console.log('Found holding for balance check:', holding)
      
      if (!holding) {
        // Return zero balance instead of null for non-existent holdings
        const token = await mockDb.token.findUnique({ where: { id: tokenId } })
        return NextResponse.json({
          success: true,
          balance: {
            available: '0',
            token: token?.name || 'Unknown'
          }
        })
      }
      
      const token = await mockDb.token.findUnique({ where: { id: tokenId } })
      
      return NextResponse.json({
        success: true,
        balance: {
          available: holding.freeCollateral.toString(),
          token: token?.name || 'Unknown'
        }
      })
    }
    
    // Handle system-wide holdings request (for dashboard stats)
    if (systemWide) {
      console.log('Fetching system-wide holdings for dashboard stats')
      
      const allHoldings = await mockDb.holding.findMany()
      
      const formattedHoldings = await Promise.all(
        allHoldings.map(async (holding: any) => {
          const token = await mockDb.token.findUnique({ where: { id: holding.tokenId } })
          const user = await mockDb.user.findUnique({ where: { id: holding.userId } })
          
          return {
            id: holding.id,
            partyId: user?.partyId || 'Unknown',
            tokenName: token?.name || 'Unknown Token',
            currency: token?.currency || 'Unknown',
            totalBalance: holding.totalBalance.toString(),
            freeCollateral: holding.freeCollateral.toString(),
            lockedCollateral: holding.lockedCollateral.toString(),
            contractAddress: token?.contractAddress || 'Unknown'
          }
        })
      )
      
      console.log('System-wide holdings:', formattedHoldings)
      
      return NextResponse.json({
        success: true,
        holdings: formattedHoldings,
        systemWide: true
      })
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

    // Find the user by party ID
    const user = await mockDb.user.findUnique({
      where: { partyId }
    })
    
    if (!user) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Party ID not found' 
        },
        { status: 404 }
      )
    }

    // Get holdings only for this specific user
    const userHoldings = await mockDb.holding.findMany({
      where: { userId: user.id }
    })
    
    const formattedHoldings = await Promise.all(
      userHoldings.map(async (holding: any) => {
        const token = await mockDb.token.findUnique({ where: { id: holding.tokenId } })
        
        return {
          id: holding.id,
          partyId: user.partyId,
          tokenName: token?.name || 'Unknown Token',
          currency: token?.currency || 'Unknown',
          totalBalance: holding.totalBalance.toString(),
          freeCollateral: holding.freeCollateral.toString(),
          lockedCollateral: holding.lockedCollateral.toString(),
          contractAddress: token?.contractAddress || 'Unknown',
          recentTransactions: [] // We'll add this later if needed
        }
      })
    )
    
    console.log(`Formatted holdings for ${partyId}:`, formattedHoldings)
    
    return NextResponse.json({
      success: true,
      holdings: formattedHoldings,
      partyId: user.partyId
    })
    
  } catch (error) {
    console.error('Error fetching holdings:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}