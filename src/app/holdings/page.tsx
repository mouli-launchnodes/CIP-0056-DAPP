'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Search, RefreshCw, Plus, Eye, Users, Coins, TrendingUp, X, User, Copy } from '@/lib/icons'
import { AuthWrapper } from '@/components/auth-wrapper'
import Link from 'next/link'
import { Pagination } from '@/components/pagination'
import { LoadingSkeleton } from '@/components/loading-skeleton'

interface Holding {
  id: string
  partyId: string
  tokenName: string
  currency: string
  totalBalance: string
  freeCollateral: string
  lockedCollateral: string
  contractAddress: string
  recentTransactions: Transaction[]
}

interface Transaction {
  id: string
  type: string
  amount: string
  fromPartyId?: string
  toPartyId?: string
  status: string
  transactionHash?: string
  createdAt: string
}

function HoldingsContent() {
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [filteredHoldings, setFilteredHoldings] = useState<Holding[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchPartyId, setSearchPartyId] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [userPartyId, setUserPartyId] = useState<string>('')

  // Get user party ID from localStorage
  useEffect(() => {
    const storedPartyId = localStorage.getItem('userPartyId')
    if (storedPartyId) {
      setUserPartyId(storedPartyId)
      setSearchPartyId(storedPartyId) // Default to user's own party ID
    }
  }, [])

  // Calculate pagination
  const totalItems = filteredHoldings.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedHoldings = filteredHoldings.slice(startIndex, endIndex)

  const fetchHoldings = async (partyId?: string) => {
    setIsLoading(true)
    try {
      // Always filter by party ID - either provided or user's own
      const targetPartyId = partyId || userPartyId
      if (!targetPartyId) {
        toast.error('No Party ID available')
        setIsLoading(false)
        return
      }

      const url = `/api/holdings?partyId=${encodeURIComponent(targetPartyId)}`
      const response = await fetch(url)
      
      if (response.ok) {
        const data = await response.json()
        setHoldings(data.holdings)
        setFilteredHoldings(data.holdings)
      } else {
        const errorData = await response.json()
        if (response.status === 404) {
          // No holdings found for this party ID
          setHoldings([])
          setFilteredHoldings([])
          toast.info(`No holdings found for Party ID: ${targetPartyId}`)
        } else {
          toast.error(errorData.error || 'Failed to fetch holdings')
        }
      }
    } catch (error) {
      console.error('Error fetching holdings:', error)
      toast.error('Error fetching holdings')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Only fetch holdings after we have the user's party ID
    if (userPartyId) {
      fetchHoldings(userPartyId)
    }
  }, [userPartyId])

  const handleSearch = () => {
    setCurrentPage(1) // Reset to first page when searching
    const targetPartyId = searchPartyId.trim() || userPartyId
    if (targetPartyId) {
      fetchHoldings(targetPartyId)
    } else {
      toast.error('Please enter a Party ID to search')
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Calculate summary statistics
  const totalHoldings = filteredHoldings.length
  const uniqueParties = new Set(filteredHoldings.map(h => h.partyId)).size
  const uniqueTokens = new Set(filteredHoldings.map(h => h.tokenName)).size

  return (
    <div className="page-container">
      {/* Professional Page Header */}
      <div className="page-header">
        <h1 className="page-title">Token Holdings</h1>
        <p className="page-description">
          View comprehensive token balances and collateral status across all parties with real-time updates and detailed analytics
        </p>
      </div>

      {/* Enhanced Search Section */}
      <div className="card mb-8 animate-fade-in-up">
        <div className="card-header">
          <h3 className="card-title">Holdings Search</h3>
          <p className="card-description">Search and filter token holdings by Party ID</p>
        </div>
        <div className="card-content">
          <div className="space-y-4">
            {/* Search Input with Enhanced Design */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-muted-foreground" />
              </div>
              <input
                type="text"
                placeholder="Enter Party ID to search holdings..."
                value={searchPartyId}
                onChange={(e) => setSearchPartyId(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="holdings-search-input"
              />
              {searchPartyId && (
                <button
                  onClick={() => setSearchPartyId('')}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={handleSearch} 
                disabled={isLoading || !searchPartyId.trim()} 
                className={`holdings-search-button ${isLoading ? 'btn-loading' : ''}`}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    Search Holdings
                  </>
                )}
              </button>
              
              {userPartyId && (
                <button 
                  onClick={() => {
                    setSearchPartyId(userPartyId)
                    fetchHoldings(userPartyId)
                  }}
                  className="holdings-my-button"
                >
                  <Eye className="h-4 w-4" />
                  My Holdings
                </button>
              )}
            </div>
            
            {/* Current Party ID Display */}
            {userPartyId && (
              <div className="holdings-party-display">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">Your Party ID:</span>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(userPartyId)
                      toast.success('Party ID copied to clipboard!')
                    }}
                    className="holdings-copy-button"
                  >
                    <code className="font-mono">{userPartyId.length > 20 ? `${userPartyId.slice(0, 10)}...${userPartyId.slice(-10)}` : userPartyId}</code>
                    <Copy className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Holdings Table */}
      <div className="table-container mb-8 animate-slide-in-right" style={{ animationDelay: '0.1s' }}>
        <div className="card-header">
          <h3 className="card-title">Holdings Overview</h3>
          <p className="card-description">
            Real-time token balances and collateral information
            {searchPartyId && (
              <span className="ml-2">
                for Party ID: <code className="text-xs bg-muted px-2 py-1 rounded">{searchPartyId}</code>
              </span>
            )}
          </p>
        </div>
        <div className="card-content p-0">
          {isLoading ? (
            <LoadingSkeleton variant="table" rows={5} />
          ) : filteredHoldings.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="h-8 w-8 text-muted" />
              </div>
              <h3 className="text-xl font-semibold mb-3">No holdings found</h3>
              <p className="text-muted mb-6">Try adjusting your search criteria or create some tokens first.</p>
              <Link href="/create-token">
                <button className="btn btn-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Token Contract
                </button>
              </Link>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Party ID</th>
                    <th>Token</th>
                    <th>Total Balance</th>
                    <th>Free Collateral</th>
                    <th>Locked Collateral</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedHoldings.map((holding, index) => (
                    <tr key={holding.id}>
                      <td className="font-mono text-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                          <span className="truncate max-w-32" title={holding.partyId}>
                            {holding.partyId.length > 15 
                              ? `${holding.partyId.substring(0, 15)}...` 
                              : holding.partyId}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-accent text-accent-foreground rounded-xl flex items-center justify-center text-sm font-bold">
                            {holding.currency.substring(0, 2)}
                          </div>
                          <div>
                            <div className="font-semibold">{holding.tokenName}</div>
                            <div className="text-xs text-muted">{holding.currency}</div>
                          </div>
                        </div>
                      </td>
                      <td className="font-bold text-lg">
                        {holding.totalBalance}
                      </td>
                      <td className="font-semibold text-success">
                        {holding.freeCollateral}
                      </td>
                      <td className="font-semibold text-warning">
                        {holding.lockedCollateral}
                      </td>
                      <td>
                        <div className="status-badge">
                          <div className="status-dot"></div>
                          <span>Active</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Pagination */}
        {!isLoading && filteredHoldings.length > itemsPerPage && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
          />
        )}
      </div>

      {/* Enhanced Summary Cards */}
      <div className="stats-grid animate-fade-in-up stagger-children" style={{ animationDelay: '0.2s' }}>
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-title">Total Holdings</div>
            <div className="stat-icon bg-accent">
              <Eye className="h-5 w-5" />
            </div>
          </div>
          <div className="stat-value text-accent">{totalHoldings}</div>
          <div className="stat-change positive">
            <TrendingUp className="h-3 w-3" />
            Active records
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-title">Unique Parties</div>
            <div className="stat-icon bg-success">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="stat-value text-success">{uniqueParties}</div>
          <div className="stat-change positive">
            <TrendingUp className="h-3 w-3" />
            Network participants
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-title">Unique Tokens</div>
            <div className="stat-icon bg-warning">
              <Coins className="h-5 w-5" />
            </div>
          </div>
          <div className="stat-value text-warning">{uniqueTokens}</div>
          <div className="stat-change positive">
            <TrendingUp className="h-3 w-3" />
            Token varieties
          </div>
        </div>
      </div>
    </div>
  )
}

export default function HoldingsPage() {
  return (
    <AuthWrapper>
      <HoldingsContent />
    </AuthWrapper>
  )
}