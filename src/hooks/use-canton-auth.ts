'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@auth0/nextjs-auth0/client'
import { cantonAuth } from '@/lib/canton-auth'
import { toast } from 'sonner'

interface CantonAuthState {
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  tokenExpiresAt: number | null
}

export function useCantonAuth() {
  const { user, isLoading: auth0Loading } = useUser()
  const [cantonState, setCantonState] = useState<CantonAuthState>({
    isAuthenticated: false,
    isLoading: false,
    error: null,
    tokenExpiresAt: null
  })

  const updateCantonState = () => {
    const isAuthenticated = cantonAuth.isAuthenticated()
    const tokenInfo = cantonAuth.getTokenInfo()
    
    setCantonState(prev => ({
      ...prev,
      isAuthenticated,
      tokenExpiresAt: tokenInfo.expiresAt,
      error: null
    }))
  }

  const initializeCantonAuth = async () => {
    if (!user || auth0Loading) return

    setCantonState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      console.log('Initializing Canton authentication for user:', user.email)
      
      const token = await cantonAuth.getAdminToken()
      
      if (token) {
        console.log('Canton authentication successful')
        updateCantonState()
        toast.success('Connected to Canton Network')
      } else {
        throw new Error('Failed to obtain Canton admin token')
      }
    } catch (error) {
      console.error('Canton authentication failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      setCantonState(prev => ({
        ...prev,
        isAuthenticated: false,
        error: errorMessage
      }))
      
      toast.error(`Canton Network connection failed: ${errorMessage}`)
    } finally {
      setCantonState(prev => ({ ...prev, isLoading: false }))
    }
  }

  const refreshCantonAuth = async () => {
    setCantonState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      // Clear existing token to force refresh
      cantonAuth.logout()
      
      const token = await cantonAuth.getAdminToken()
      
      if (token) {
        updateCantonState()
        toast.success('Canton Network token refreshed')
      } else {
        throw new Error('Failed to refresh Canton admin token')
      }
    } catch (error) {
      console.error('Canton token refresh failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      setCantonState(prev => ({
        ...prev,
        isAuthenticated: false,
        error: errorMessage
      }))
      
      toast.error(`Token refresh failed: ${errorMessage}`)
    } finally {
      setCantonState(prev => ({ ...prev, isLoading: false }))
    }
  }

  const logoutCanton = () => {
    cantonAuth.logout()
    setCantonState({
      isAuthenticated: false,
      isLoading: false,
      error: null,
      tokenExpiresAt: null
    })
    console.log('Canton authentication cleared')
  }

  // Initialize Canton auth when user is authenticated
  useEffect(() => {
    if (user && !auth0Loading && !cantonState.isAuthenticated && !cantonState.isLoading) {
      initializeCantonAuth()
    }
  }, [user, auth0Loading, cantonState.isAuthenticated, cantonState.isLoading])

  // Check token expiry periodically
  useEffect(() => {
    if (!cantonState.isAuthenticated) return

    const checkTokenExpiry = () => {
      const tokenInfo = cantonAuth.getTokenInfo()
      
      if (tokenInfo.expiresAt) {
        const now = Date.now()
        const timeLeft = tokenInfo.expiresAt - now
        const fiveMinutes = 5 * 60 * 1000
        
        // Auto-refresh if token expires in less than 5 minutes
        if (timeLeft < fiveMinutes && timeLeft > 0) {
          console.log('Canton token expires soon, auto-refreshing...')
          refreshCantonAuth()
        } else if (timeLeft <= 0) {
          console.log('Canton token has expired')
          updateCantonState()
        }
      }
    }

    // Check every minute
    const interval = setInterval(checkTokenExpiry, 60000)
    
    return () => clearInterval(interval)
  }, [cantonState.isAuthenticated])

  // Cleanup on user logout
  useEffect(() => {
    if (!user && !auth0Loading && cantonState.isAuthenticated) {
      logoutCanton()
    }
  }, [user, auth0Loading, cantonState.isAuthenticated])

  return {
    ...cantonState,
    auth0User: user,
    auth0Loading,
    refreshCantonAuth,
    logoutCanton,
    initializeCantonAuth
  }
}