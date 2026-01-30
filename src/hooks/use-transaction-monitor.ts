import { useState, useEffect, useCallback } from 'react'

interface Transaction {
  id: string
  type: 'MINT' | 'TRANSFER' | 'BURN'
  amount: string
  status: 'PENDING' | 'CONFIRMED' | 'FAILED'
  transactionHash?: string
  createdAt: string
  token: {
    name: string
    currency: string
  }
}

interface UseTransactionMonitorOptions {
  partyId?: string
  autoRefresh?: boolean
  refreshInterval?: number
}

export function useTransactionMonitor(options: UseTransactionMonitorOptions = {}) {
  const { partyId, autoRefresh = true, refreshInterval = 30000 } = options
  
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchRecentTransactions = useCallback(async () => {
    if (!partyId) return

    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'subscribe',
          partyId
        })
      })

      const data = await response.json()

      if (data.success) {
        setRecentTransactions(data.recentTransactions)
        setIsConnected(true)
        setLastUpdate(new Date())
        setError(null)
      } else {
        setError(data.error || 'Failed to fetch transactions')
        setIsConnected(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error')
      setIsConnected(false)
    }
  }, [partyId])

  // Initial fetch
  useEffect(() => {
    if (partyId) {
      fetchRecentTransactions()
    }
  }, [partyId, fetchRecentTransactions])

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || !partyId) return

    const interval = setInterval(fetchRecentTransactions, refreshInterval)
    return () => clearInterval(interval)
  }, [autoRefresh, partyId, refreshInterval, fetchRecentTransactions])

  // Simulate real-time updates for new transactions
  const addTransaction = useCallback((transaction: Transaction) => {
    setRecentTransactions(prev => [transaction, ...prev.slice(0, 9)])
    setLastUpdate(new Date())
  }, [])

  return {
    recentTransactions,
    isConnected,
    lastUpdate,
    error,
    refresh: fetchRecentTransactions,
    addTransaction
  }
}

// Hook for monitoring specific transaction status
export function useTransactionStatus(transactionHash?: string) {
  const [status, setStatus] = useState<'PENDING' | 'CONFIRMED' | 'FAILED' | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const checkStatus = useCallback(async () => {
    if (!transactionHash) return

    setIsLoading(true)
    try {
      // In a real Canton implementation, this would query the Canton ledger
      // For now, we'll simulate checking transaction status
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Simulate status check - in reality this would query Canton Network
      const mockStatus = Math.random() > 0.1 ? 'CONFIRMED' : 'PENDING'
      setStatus(mockStatus as any)
    } catch (error) {
      console.error('Error checking transaction status:', error)
      setStatus('FAILED')
    } finally {
      setIsLoading(false)
    }
  }, [transactionHash])

  useEffect(() => {
    if (transactionHash) {
      checkStatus()
      
      // Poll for status updates every 5 seconds for pending transactions
      const interval = setInterval(() => {
        if (status === 'PENDING') {
          checkStatus()
        }
      }, 5000)

      return () => clearInterval(interval)
    }
  }, [transactionHash, status, checkStatus])

  return {
    status,
    isLoading,
    refresh: checkStatus
  }
}

// Hook for Canton Network connection status
export function useCantonConnection() {
  const [isConnected, setIsConnected] = useState(false)
  const [networkInfo, setNetworkInfo] = useState<{
    participantId?: string
    domainId?: string
    blockHeight?: number
    lastBlockTime?: Date
  }>({})
  const [isChecking, setIsChecking] = useState(false)

  const checkConnection = useCallback(async () => {
    setIsChecking(true)
    try {
      // In a real implementation, this would check Canton Network status
      // For now, we'll simulate network connectivity
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setIsConnected(true)
      setNetworkInfo({
        participantId: 'participant-demo',
        domainId: 'canton-testnet',
        blockHeight: Math.floor(Math.random() * 1000000),
        lastBlockTime: new Date()
      })
    } catch (error) {
      console.error('Canton connection error:', error)
      setIsConnected(false)
      setNetworkInfo({})
    } finally {
      setIsChecking(false)
    }
  }, [])

  useEffect(() => {
    checkConnection()
    
    // Check connection every 30 seconds
    const interval = setInterval(checkConnection, 30000)
    return () => clearInterval(interval)
  }, [checkConnection])

  return {
    isConnected,
    networkInfo,
    isChecking,
    refresh: checkConnection
  }
}