'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { 
  Activity, 
  Loader2, 
  RefreshCw, 
  ExternalLink, 
  Filter, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  Coins,
  ArrowRightLeft,
  Flame,
  CheckCircle,
  Clock,
  AlertTriangle,
  Eye,
  Copy
} from '@/lib/icons'
import { AuthWrapper } from '@/components/auth-wrapper'
import { BlockExplorerModal } from '@/components/block-explorer-modal'
import Link from 'next/link'

interface Transaction {
  id: string
  type: 'MINT' | 'TRANSFER' | 'BURN'
  amount: string
  fromPartyId?: string
  toPartyId?: string
  transactionHash?: string
  status: 'PENDING' | 'CONFIRMED' | 'FAILED'
  createdAt: string
  updatedAt: string
  user: {
    id: string
    email: string
    partyId: string
  }
  token: {
    id: string
    name: string
    currency: string
    contractAddress: string
  }
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

interface Filters {
  partyId: string
  tokenId: string
  type: string
  status: string
  search: string
}

function TransactionsContent() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  })
  const [filters, setFilters] = useState<Filters>({
    partyId: '',
    tokenId: '',
    type: '',
    status: '',
    search: ''
  })
  const [tokens, setTokens] = useState<any[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [userPartyId, setUserPartyId] = useState<string>('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [showBlockExplorer, setShowBlockExplorer] = useState(false)

  // Get user party ID from localStorage
  useEffect(() => {
    const storedPartyId = localStorage.getItem('userPartyId')
    if (storedPartyId) {
      setUserPartyId(storedPartyId)
      setFilters(prev => ({ ...prev, partyId: storedPartyId }))
    }
  }, [])

  // Fetch available tokens for filtering
  useEffect(() => {
    const fetchTokens = async () => {
      try {
        const response = await fetch('/api/tokens')
        if (response.ok) {
          const data = await response.json()
          setTokens(data.tokens || [])
        }
      } catch (error) {
        console.error('Error fetching tokens:', error)
      }
    }

    fetchTokens()
  }, [])

  // Fetch transactions
  const fetchTransactions = useCallback(async (page = 1, showLoading = true) => {
    if (showLoading) {
      setIsLoading(true)
    } else {
      setIsRefreshing(true)
    }

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        sortBy,
        sortOrder
      })

      // Add filters
      if (filters.partyId) params.append('partyId', filters.partyId)
      if (filters.tokenId) params.append('tokenId', filters.tokenId)
      if (filters.type) params.append('type', filters.type)
      if (filters.status) params.append('status', filters.status)

      const response = await fetch(`/api/transactions?${params}`)
      const data = await response.json()

      if (data.success) {
        setTransactions(data.transactions)
        setPagination(data.pagination)
      } else {
        toast.error(data.error || 'Failed to fetch transactions')
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
      toast.error('Failed to fetch transactions')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [filters, pagination.limit, sortBy, sortOrder])

  // Initial load and when filters change
  useEffect(() => {
    fetchTransactions(1)
  }, [filters, sortBy, sortOrder])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isLoading) {
        fetchTransactions(pagination.page, false)
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [fetchTransactions, isLoading, pagination.page])

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handlePageChange = (newPage: number) => {
    fetchTransactions(newPage)
  }

  const handleRefresh = () => {
    fetchTransactions(pagination.page, false)
  }

  const clearFilters = () => {
    setFilters({
      partyId: userPartyId,
      tokenId: '',
      type: '',
      status: '',
      search: ''
    })
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  const openBlockExplorer = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setShowBlockExplorer(true)
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'MINT': return <Coins className="h-4 w-4 text-green-600" />
      case 'TRANSFER': return <ArrowRightLeft className="h-4 w-4 text-blue-600" />
      case 'BURN': return <Flame className="h-4 w-4 text-red-600" />
      default: return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'PENDING': return <Clock className="h-4 w-4 text-yellow-600" />
      case 'FAILED': return <AlertTriangle className="h-4 w-4 text-red-600" />
      default: return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-950/30'
      case 'PENDING': return 'text-yellow-700 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-950/30'
      case 'FAILED': return 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-950/30'
      default: return 'text-gray-700 bg-gray-100 dark:text-gray-400 dark:bg-gray-950/30'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  const formatAmount = (amount: string, currency: string) => {
    const num = parseFloat(amount)
    return `${num.toLocaleString()} ${currency}`
  }

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Transaction History</h1>
        <p className="page-description">
          View and monitor all token transactions on the Canton Network with real-time updates and comprehensive filtering
        </p>
      </div>

      {/* Controls Section */}
      <div className="card mb-8">
        <div className="card-content">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* Left side - Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="form-input pl-10 w-64"
                />
              </div>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="btn btn-outline"
              >
                <Filter className="h-4 w-4" />
                Filters
              </button>
            </div>

            {/* Right side - Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="btn btn-outline"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Activity className="h-4 w-4" />
                Auto-refresh: 30s
              </div>
            </div>
          </div>

          {/* Expandable Filters */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-border">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="form-group">
                  <label className="form-label">Party ID</label>
                  <input
                    type="text"
                    placeholder={`Filter by Party ID (Current: ${userPartyId || 'Not set'})`}
                    value={filters.partyId}
                    onChange={(e) => handleFilterChange('partyId', e.target.value)}
                    className="form-input"
                  />
                  {userPartyId && filters.partyId !== userPartyId && (
                    <button
                      onClick={() => handleFilterChange('partyId', userPartyId)}
                      className="btn btn-sm btn-outline mt-2"
                    >
                      Use My Party ID
                    </button>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Token</label>
                  <select
                    value={filters.tokenId}
                    onChange={(e) => handleFilterChange('tokenId', e.target.value)}
                    className="form-select"
                  >
                    <option value="">All Tokens</option>
                    {tokens.map((token) => (
                      <option key={token.id} value={token.id}>
                        {token.name} ({token.currency})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select
                    value={filters.type}
                    onChange={(e) => handleFilterChange('type', e.target.value)}
                    className="form-select"
                  >
                    <option value="">All Types</option>
                    <option value="MINT">Mint</option>
                    <option value="TRANSFER">Transfer</option>
                    <option value="BURN">Burn</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="form-select"
                  >
                    <option value="">All Statuses</option>
                    <option value="PENDING">Pending</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="FAILED">Failed</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button onClick={clearFilters} className="btn btn-outline btn-sm">
                  Clear Filters
                </button>
                {userPartyId && (
                  <button 
                    onClick={() => handleFilterChange('partyId', userPartyId)}
                    className="btn btn-primary btn-sm"
                  >
                    Show My Transactions
                  </button>
                )}
              </div>

              {userPartyId && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">
                    <strong>Your Party ID:</strong> <code className="text-xs bg-background px-2 py-1 rounded">{userPartyId}</code>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Recent Transactions</h3>
          <p className="card-description">
            {pagination.total > 0 
              ? `Showing ${((pagination.page - 1) * pagination.limit) + 1}-${Math.min(pagination.page * pagination.limit, pagination.total)} of ${pagination.total} transactions`
              : 'No transactions found'
            }
            {filters.partyId && (
              <span className="ml-2">
                for Party ID: <code className="text-xs bg-muted px-2 py-1 rounded">{filters.partyId}</code>
              </span>
            )}
          </p>
        </div>

        <div className="card-content p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading transactions...</span>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Transactions Found</h3>
              <p className="text-muted-foreground mb-4">
                {Object.values(filters).some(f => f) 
                  ? 'No transactions match your current filters.'
                  : 'No transactions have been recorded yet.'
                }
              </p>
              {Object.values(filters).some(f => f) && (
                <button onClick={clearFilters} className="btn btn-primary">
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="text-left p-4 font-semibold">Type</th>
                    <th className="text-left p-4 font-semibold">Token</th>
                    <th className="text-left p-4 font-semibold">Amount</th>
                    <th className="text-left p-4 font-semibold">From/To</th>
                    <th className="text-left p-4 font-semibold">Status</th>
                    <th className="text-left p-4 font-semibold">Date</th>
                    <th className="text-left p-4 font-semibold">Hash</th>
                    <th className="text-left p-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {getTransactionIcon(tx.type)}
                          <span className="font-medium">{tx.type}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <div className="font-medium">{tx.token.name}</div>
                          <div className="text-sm text-muted-foreground">{tx.token.currency}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-mono font-medium">
                          {formatAmount(tx.amount, tx.token.currency)}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          {tx.type === 'MINT' && (
                            <div>
                              <span className="text-muted-foreground">To:</span>
                              <div className="font-mono text-xs">{tx.toPartyId}</div>
                            </div>
                          )}
                          {tx.type === 'TRANSFER' && (
                            <div>
                              <div>
                                <span className="text-muted-foreground">From:</span>
                                <div className="font-mono text-xs">{tx.fromPartyId}</div>
                              </div>
                              <div className="mt-1">
                                <span className="text-muted-foreground">To:</span>
                                <div className="font-mono text-xs">{tx.toPartyId}</div>
                              </div>
                            </div>
                          )}
                          {tx.type === 'BURN' && (
                            <div>
                              <span className="text-muted-foreground">From:</span>
                              <div className="font-mono text-xs">{tx.user.partyId}</div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(tx.status)}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(tx.status)}`}>
                            {tx.status}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          {formatDate(tx.createdAt)}
                        </div>
                      </td>
                      <td className="p-4">
                        {tx.transactionHash ? (
                          <div className="flex items-center gap-2">
                            <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                              {tx.transactionHash.slice(0, 8)}...
                            </code>
                            <button
                              onClick={() => copyToClipboard(tx.transactionHash!)}
                              className="btn btn-sm btn-outline p-1"
                              title="Copy full hash"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-1">
                          <button
                            onClick={() => openBlockExplorer(tx)}
                            className="btn btn-sm btn-outline p-1"
                            title="View details"
                          >
                            <Eye className="h-3 w-3" />
                          </button>
                          {tx.transactionHash && (
                            <button
                              onClick={() => openBlockExplorer(tx)}
                              className="btn btn-sm btn-outline p-1"
                              title="View on explorer"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </button>
                          )}
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
        {pagination.totalPages > 1 && (
          <div className="card-content border-t border-border">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrev}
                  className="btn btn-outline btn-sm"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>
                
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasNext}
                  className="btn btn-outline btn-sm"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="card mt-8">
        <div className="card-header">
          <h3 className="card-title">Quick Actions</h3>
          <p className="card-description">Perform common token operations</p>
        </div>
        <div className="card-content">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/mint" className="btn btn-outline h-auto p-4 flex flex-col items-center gap-2">
              <Coins className="h-6 w-6 text-green-600" />
              <span className="font-semibold">Mint Tokens</span>
              <span className="text-sm text-muted-foreground">Create new tokens</span>
            </Link>
            
            <Link href="/transfer" className="btn btn-outline h-auto p-4 flex flex-col items-center gap-2">
              <ArrowRightLeft className="h-6 w-6 text-blue-600" />
              <span className="font-semibold">Transfer Tokens</span>
              <span className="text-sm text-muted-foreground">Send to another party</span>
            </Link>
            
            <Link href="/burn" className="btn btn-outline h-auto p-4 flex flex-col items-center gap-2">
              <Flame className="h-6 w-6 text-red-600" />
              <span className="font-semibold">Burn Tokens</span>
              <span className="text-sm text-muted-foreground">Permanently destroy tokens</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Block Explorer Modal */}
      <BlockExplorerModal
        isOpen={showBlockExplorer}
        onClose={() => setShowBlockExplorer(false)}
        transactionHash={selectedTransaction?.transactionHash || ''}
        transaction={selectedTransaction || undefined}
      />
    </div>
  )
}

export default function TransactionsPage() {
  return (
    <AuthWrapper>
      <TransactionsContent />
    </AuthWrapper>
  )
}