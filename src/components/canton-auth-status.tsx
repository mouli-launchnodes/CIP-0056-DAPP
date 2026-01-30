'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, AlertTriangle, RefreshCw, Shield, Clock } from '@/lib/icons'
import { cantonAuth } from '@/lib/canton-auth'
import { toast } from 'sonner'

interface AuthStatus {
  isAuthenticated: boolean
  tokenInfo: {
    token: string | null
    expiresAt: number | null
  }
}

export function CantonAuthStatus() {
  const [authStatus, setAuthStatus] = useState<AuthStatus>({
    isAuthenticated: false,
    tokenInfo: { token: null, expiresAt: null }
  })
  const [isRefreshing, setIsRefreshing] = useState(false)

  const checkAuthStatus = () => {
    const isAuthenticated = cantonAuth.isAuthenticated()
    const tokenInfo = cantonAuth.getTokenInfo()
    
    setAuthStatus({
      isAuthenticated,
      tokenInfo
    })
  }

  useEffect(() => {
    checkAuthStatus()
    
    // Check auth status every 30 seconds
    const interval = setInterval(checkAuthStatus, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const handleRefreshToken = async () => {
    setIsRefreshing(true)
    try {
      const token = await cantonAuth.getAdminToken()
      if (token) {
        toast.success('Canton Network token refreshed successfully')
        checkAuthStatus()
      } else {
        toast.error('Failed to refresh Canton Network token')
      }
    } catch (error) {
      console.error('Error refreshing token:', error)
      toast.error('Failed to refresh Canton Network token')
    } finally {
      setIsRefreshing(false)
    }
  }

  const formatExpiryTime = (expiresAt: number | null): string => {
    if (!expiresAt) return 'Unknown'
    
    const now = Date.now()
    const timeLeft = expiresAt - now
    
    if (timeLeft <= 0) return 'Expired'
    
    const minutes = Math.floor(timeLeft / (1000 * 60))
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`
    } else {
      return `${minutes}m`
    }
  }

  const getStatusColor = () => {
    if (!authStatus.isAuthenticated) return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-950/30'
    
    const timeLeft = authStatus.tokenInfo.expiresAt ? authStatus.tokenInfo.expiresAt - Date.now() : 0
    const fifteenMinutes = 15 * 60 * 1000
    
    if (timeLeft < fifteenMinutes) {
      return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-950/30'
    }
    
    return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-950/30'
  }

  const getStatusIcon = () => {
    if (!authStatus.isAuthenticated) {
      return <AlertTriangle className="h-4 w-4" />
    }
    
    const timeLeft = authStatus.tokenInfo.expiresAt ? authStatus.tokenInfo.expiresAt - Date.now() : 0
    const fifteenMinutes = 15 * 60 * 1000
    
    if (timeLeft < fifteenMinutes) {
      return <Clock className="h-4 w-4" />
    }
    
    return <CheckCircle className="h-4 w-4" />
  }

  const getStatusText = () => {
    if (!authStatus.isAuthenticated) return 'Not Connected'
    
    const timeLeft = authStatus.tokenInfo.expiresAt ? authStatus.tokenInfo.expiresAt - Date.now() : 0
    const fifteenMinutes = 15 * 60 * 1000
    
    if (timeLeft < fifteenMinutes) return 'Expires Soon'
    
    return 'Connected'
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
      <div className="flex items-center gap-2">
        <Shield className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">Canton Network:</span>
      </div>
      
      <div className="flex items-center gap-2">
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
          {getStatusIcon()}
          <span>{getStatusText()}</span>
        </div>
        
        {authStatus.isAuthenticated && authStatus.tokenInfo.expiresAt && (
          <span className="text-xs text-muted-foreground">
            Expires in {formatExpiryTime(authStatus.tokenInfo.expiresAt)}
          </span>
        )}
      </div>
      
      <button
        onClick={handleRefreshToken}
        disabled={isRefreshing}
        className="btn btn-sm btn-outline p-1"
        title="Refresh Canton Network token"
      >
        <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
      </button>
    </div>
  )
}