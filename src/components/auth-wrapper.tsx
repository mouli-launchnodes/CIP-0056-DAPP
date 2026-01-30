'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from './app-layout'
import { useCantonAuth } from '@/hooks/use-canton-auth'
import { Loader2, AlertTriangle, RefreshCw } from '@/lib/icons'

interface AuthWrapperProps {
  children: React.ReactNode
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const router = useRouter()
  const [userPartyId, setUserPartyId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const cantonAuth = useCantonAuth()

  useEffect(() => {
    // Check if user is onboarded
    const partyId = localStorage.getItem('userPartyId')
    if (!partyId) {
      router.push('/')
      return
    }
    setUserPartyId(partyId)
    setIsLoading(false)
  }, [router])

  if (isLoading || cantonAuth.auth0Loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading...</p>
      </div>
    )
  }

  if (!userPartyId) {
    return null // Will redirect to onboarding
  }

  // Show Canton authentication loading state
  if (cantonAuth.isLoading) {
    return (
      <div className="loading-container">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="loading-text">Connecting to Canton Network...</p>
      </div>
    )
  }

  // Show Canton authentication error state
  if (cantonAuth.error && !cantonAuth.isAuthenticated) {
    return (
      <div className="loading-container">
        <AlertTriangle className="h-8 w-8 text-error mb-4" />
        <h2 className="text-xl font-semibold mb-2">Canton Network Connection Failed</h2>
        <p className="text-muted-foreground mb-4 text-center max-w-md">
          {cantonAuth.error}
        </p>
        <button 
          onClick={cantonAuth.refreshCantonAuth}
          className="btn btn-primary"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry Connection
        </button>
      </div>
    )
  }

  return (
    <AppLayout userPartyId={userPartyId}>
      {children}
    </AppLayout>
  )
}