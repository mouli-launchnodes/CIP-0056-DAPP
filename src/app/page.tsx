'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Zap, Shield, Users, ArrowRight } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'

function OnboardingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [isOnboarding, setIsOnboarding] = useState(false)

  useEffect(() => {
    const checkAuthAndOnboarding = async () => {
      try {
        const response = await fetch('/auth/profile')
        if (response.ok) {
          const userData = await response.json()
          setUser(userData)
          setEmail(userData.email || '')

          // Check if this user has a valid party ID
          const userPartyId = localStorage.getItem('userPartyId')
          const storedAuth0Id = localStorage.getItem('auth0UserId')

          // Only redirect if the stored party belongs to THIS user
          if (userPartyId && storedAuth0Id === userData.sub) {
            console.log('Found valid party for current user:', userPartyId)
            router.push('/dashboard')
            return
          } else if (userPartyId && storedAuth0Id !== userData.sub) {
            // Different user logged in - clear old party data
            console.log('Different user detected, clearing old party data')
            localStorage.removeItem('userPartyId')
            localStorage.removeItem('userEmail')
            localStorage.removeItem('auth0UserId')
          }
        }
      } catch (error) {
        console.error('Auth check error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuthAndOnboarding()

    const authSuccess = searchParams.get('auth')
    if (authSuccess === 'success') {
      toast.success('Successfully authenticated with Auth0!')
    }
  }, [router, searchParams])

  const handleOnboarding = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast.error('Please log in first to continue with onboarding')
      return
    }

    setIsOnboarding(true)

    try {
      console.log('Starting onboarding for user:', user.email, 'Auth0 ID:', user.sub)

      // Clear any existing party data to ensure fresh allocation
      localStorage.removeItem('userPartyId')
      localStorage.removeItem('userEmail')

      const response = await fetch('/api/onboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email || email,
          auth0UserId: user.sub,
          name: user.name
        }),
      })

      const result = await response.json()
      console.log('Onboarding response:', result)

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}: Failed to onboard user`)
      }

      // Store the NEW party ID for this specific user
      console.log('Storing party ID:', result.partyId, 'for user:', user.email)
      localStorage.setItem('userPartyId', result.partyId)
      localStorage.setItem('userEmail', user.email || email)
      localStorage.setItem('auth0UserId', user.sub)

      if (result.isExisting) {
        toast.success(`Welcome back! Your Canton Party: ${result.partyId.split('::')[0]}`)
      } else {
        toast.success(`New Canton Party allocated: ${result.partyId.split('::')[0]}`)
      }

      router.push('/dashboard')
    } catch (error) {
      console.error('Onboarding error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      toast.error(`Failed to onboard: ${errorMessage}`)
    } finally {
      setIsOnboarding(false)
    }
  }

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="mt-4 text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header with theme toggle */}
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="mb-16 text-center">
          <div className="mb-6 flex items-center justify-center space-x-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Zap className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">Canton Network</h1>
              <p className="text-xl text-muted-foreground">Tokenization Platform</p>
            </div>
          </div>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Enterprise-grade tokenization on Canton Network with Auth0 security. Create, mint, transfer, and manage digital assets with institutional-level compliance.
          </p>
        </div>

        {/* Features Overview */}
        <div className="mb-16 grid gap-6 sm:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <div className="landing-feature-card">
            <div className="landing-feature-icon bg-blue-100 dark:bg-blue-900">
              <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="mb-3 text-xl font-semibold">Secure Authentication</h3>
            <p className="text-muted-foreground">Enterprise-grade security with Auth0 authentication and multi-factor protection</p>
          </div>
          
          <div className="landing-feature-card">
            <div className="landing-feature-icon bg-green-100 dark:bg-green-900">
              <Zap className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="mb-3 text-xl font-semibold">Canton Network</h3>
            <p className="text-muted-foreground">Built on Canton's privacy-preserving blockchain with institutional compliance</p>
          </div>
          
          <div className="landing-feature-card">
            <div className="landing-feature-icon bg-purple-100 dark:bg-purple-900">
              <Users className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="mb-3 text-xl font-semibold">Multi-Party System</h3>
            <p className="text-muted-foreground">Seamless token operations between multiple parties and organizations</p>
          </div>
        </div>

        {/* Authentication & Onboarding */}
        <div className="mx-auto max-w-lg">
          <div className="card enhanced-auth-card">
            <div className="card-content">
              {!user ? (
                <div className="auth-content">
                  <div className="auth-header">
                    <h2 className="auth-title">Welcome to Canton Network</h2>
                    <p className="auth-description">
                      Sign in with Auth0 to access the enterprise tokenization platform
                    </p>
                  </div>
                  
                  <button 
                    className="btn btn-primary btn-large w-full"
                    onClick={() => window.location.href = '/auth/login'}
                  >
                    <Shield className="mr-2 h-5 w-5" />
                    Sign In with Auth0
                  </button>
                  
                  <p className="auth-footer">
                    Secure authentication powered by Auth0 Enterprise
                  </p>
                </div>
              ) : (
                <div className="onboarding-content">
                  <div className="auth-header">
                    <h2 className="auth-title">Complete Canton Setup</h2>
                    <p className="auth-description">
                      Welcome {user.name}! Connect to Canton Network to get your Party ID
                    </p>
                  </div>

                  <div className="alert-success">
                    <Shield className="h-5 w-5" />
                    <div>
                      <div className="font-medium">Step 1: Auth0 Login Complete</div>
                      <div className="text-sm">Email: {user.email}</div>
                    </div>
                  </div>

                  <div className="my-4 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
                    <h4 className="mb-2 font-medium text-blue-900 dark:text-blue-100">Canton Party Allocation Flow:</h4>
                    <ol className="list-inside list-decimal space-y-1 text-sm text-blue-800 dark:text-blue-200">
                      <li>Get Canton OIDC token (client credentials)</li>
                      <li>Call Canton Party Allocation with your Auth0 ID</li>
                      <li>Receive your unique Canton Party ID</li>
                      <li>Ready for token operations!</li>
                    </ol>
                  </div>

                  <form onSubmit={handleOnboarding} className="onboarding-form">
                    <div className="form-group">
                      <label htmlFor="email" className="form-label">Email Address</label>
                      <input
                        id="email"
                        type="email"
                        value={user.email || email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={!!user.email || isOnboarding}
                        required
                        className="form-input"
                      />
                      <p className="form-help">
                        Your Auth0 ID will be used to allocate your Canton Party
                      </p>
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary btn-large w-full"
                      disabled={isOnboarding}
                    >
                      {isOnboarding ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Allocating Canton Party...
                        </>
                      ) : (
                        <>
                          Connect to Canton Network
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </>
                      )}
                    </button>
                  </form>

                  <div className="text-center">
                    <button
                      onClick={() => window.location.href = '/auth/logout'}
                      className="btn btn-secondary btn-small"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* System Information */}
        <div className="mx-auto mt-16 max-w-4xl">
          <div className="card enhanced-auth-card">
            <div className="card-header text-center">
              <h3 className="card-title text-xl">Platform Information</h3>
            </div>
            <div className="card-content">
              <div className="system-grid">
                <div className="system-item">
                  <span className="system-label">Network Environment</span>
                  <span className="system-value">Canton Testnet</span>
                </div>
                <div className="system-item">
                  <span className="system-label">Token Standard</span>
                  <span className="system-value">CIP0056 Compliant</span>
                </div>
                <div className="system-item">
                  <span className="system-label">Authentication</span>
                  <span className="system-value">Auth0 Enterprise</span>
                </div>
                <div className="system-item">
                  <span className="system-label">Security Level</span>
                  <span className="system-value flex items-center">
                    <div className="mr-2 h-2 w-2 rounded-full bg-green-500"></div>
                    Enterprise Grade
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="mt-4 text-muted-foreground">Loading...</p>
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  )
}