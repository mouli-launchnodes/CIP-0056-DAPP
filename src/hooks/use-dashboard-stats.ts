'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'

interface SystemStatus {
  tokensCreated: number
  totalMinted: number
  activeTransactions: number
}

interface DashboardStats {
  systemStatus: SystemStatus
  isLoading: boolean
  error: string | null
  refetch: () => void
}

// Memoized stats calculation to prevent unnecessary re-renders
const calculateStats = (tokensData: any[], holdingsData: any[]) => {
  const tokensCreated = tokensData?.length || 0
  const totalMinted = holdingsData?.reduce((sum: number, holding: any) => {
    const balance = parseFloat(holding.totalBalance) || 0
    return sum + balance
  }, 0) || 0
  const activeTransactions = Math.floor(Math.random() * 5) + 1 // Mock data

  return {
    tokensCreated,
    totalMinted: Number(totalMinted),
    activeTransactions
  }
}

export function useDashboardStats(): DashboardStats {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    tokensCreated: 0,
    totalMinted: 0,
    activeTransactions: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tokensData, setTokensData] = useState<any[]>([])
  const [holdingsData, setHoldingsData] = useState<any[]>([])

  // Memoized stats to prevent recalculation on every render
  const memoizedStats = useMemo(() => {
    return calculateStats(tokensData, holdingsData)
  }, [tokensData, holdingsData])

  const fetchSystemData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Fetch tokens and holdings in parallel
      const [tokensResponse, holdingsResponse] = await Promise.all([
        fetch('/api/tokens'),
        fetch('/api/holdings?systemWide=true')
      ])

      if (tokensResponse.ok) {
        const tokensResult = await tokensResponse.json()
        setTokensData(tokensResult.tokens || [])
      }

      if (holdingsResponse.ok) {
        const holdingsResult = await holdingsResponse.json()
        setHoldingsData(holdingsResult.holdings || [])
      }
    } catch (err) {
      console.error('Error fetching system data:', err)
      setError('Failed to fetch system data')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSystemData()
    
    // Set up polling for live updates every 30 seconds
    const interval = setInterval(fetchSystemData, 30000)
    return () => clearInterval(interval)
  }, [fetchSystemData])

  // Update system status when memoized stats change
  useEffect(() => {
    setSystemStatus(memoizedStats)
  }, [memoizedStats])

  return {
    systemStatus,
    isLoading,
    error,
    refetch: fetchSystemData
  }
}