// Canton Network OIDC Authentication Service

interface CantonTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  scope?: string
}

interface CantonAuthState {
  token: string | null
  expiresAt: number | null
  isAuthenticated: boolean
}

class CantonAuthService {
  private static instance: CantonAuthService
  private authState: CantonAuthState = {
    token: null,
    expiresAt: null,
    isAuthenticated: false
  }
  
  // Server-side token cache (in-memory)
  private static serverTokenCache: CantonAuthState = {
    token: null,
    expiresAt: null,
    isAuthenticated: false
  }

  private constructor() {
    // Load existing token from localStorage on initialization (client-side only)
    if (typeof window !== 'undefined') {
      this.loadTokenFromStorage()
    } else {
      // On server-side, use the static cache
      this.authState = { ...CantonAuthService.serverTokenCache }
    }
  }

  public static getInstance(): CantonAuthService {
    if (!CantonAuthService.instance) {
      CantonAuthService.instance = new CantonAuthService()
    }
    return CantonAuthService.instance
  }

  private loadTokenFromStorage(): void {
    // Only run on client side
    if (typeof window === 'undefined') return
    
    try {
      const storedToken = localStorage.getItem('canton_admin_token')
      const storedExpiry = localStorage.getItem('canton_token_expiry')
      
      if (storedToken && storedExpiry) {
        const expiresAt = parseInt(storedExpiry)
        const now = Date.now()
        
        if (expiresAt > now) {
          this.authState = {
            token: storedToken,
            expiresAt,
            isAuthenticated: true
          }
          console.log('Loaded valid Canton token from storage')
        } else {
          console.log('Stored Canton token has expired')
          this.clearToken()
        }
      }
    } catch (error) {
      console.error('Error loading Canton token from storage:', error)
      this.clearToken()
    }
  }

  private saveTokenToStorage(token: string, expiresIn: number): void {
    const expiresAt = Date.now() + (expiresIn * 1000) - 60000 // Subtract 1 minute for safety
    
    this.authState = {
      token,
      expiresAt,
      isAuthenticated: true
    }
    
    // Save to server-side cache
    CantonAuthService.serverTokenCache = { ...this.authState }
    
    // Only save to localStorage on client side
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('canton_admin_token', token)
        localStorage.setItem('canton_token_expiry', expiresAt.toString())
        console.log('Canton token saved to storage, expires at:', new Date(expiresAt))
      } catch (error) {
        console.error('Error saving Canton token to storage:', error)
      }
    } else {
      console.log('Canton token cached server-side, expires at:', new Date(expiresAt))
    }
  }

  private clearToken(): void {
    this.authState = {
      token: null,
      expiresAt: null,
      isAuthenticated: false
    }
    
    // Clear server-side cache
    CantonAuthService.serverTokenCache = { ...this.authState }
    
    // Only clear localStorage on client side
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('canton_admin_token')
        localStorage.removeItem('canton_token_expiry')
        console.log('Canton token cleared from storage')
      } catch (error) {
        console.error('Error clearing Canton token from storage:', error)
      }
    } else {
      console.log('Canton token cleared from server-side cache')
    }
  }

  public async getAdminToken(): Promise<string | null> {
    // Check if current token is still valid
    if (this.authState.isAuthenticated && this.authState.token && this.authState.expiresAt) {
      const now = Date.now()
      if (this.authState.expiresAt > now) {
        console.log('Using existing valid Canton token')
        return this.authState.token
      } else {
        console.log('Canton token has expired, refreshing...')
      }
    }

    // Fetch new token
    return await this.fetchNewToken()
  }

  private async fetchNewToken(): Promise<string | null> {
    try {
      console.log('Fetching new Canton admin token...')
      
      // On server-side, make direct OIDC request
      if (typeof window === 'undefined') {
        // Server-side: Access environment variables directly
        const tokenUrl = process.env.OIDC_TOKEN_URL
        const clientId = process.env.OIDC_CLIENT_ID
        const clientSecret = process.env.OIDC_CLIENT_SECRET
        const audience = process.env.OIDC_AUDIENCE

        if (!tokenUrl || !clientId || !clientSecret || !audience) {
          throw new Error('Canton OIDC configuration not found')
        }

        // Prepare the token request
        const tokenRequestBody = new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: clientId,
          client_secret: clientSecret,
          audience: audience
        })

        // Make the token request directly to Canton Network
        const tokenResponse = await fetch(tokenUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
          },
          body: tokenRequestBody.toString()
        })

        if (!tokenResponse.ok) {
          const errorText = await tokenResponse.text()
          console.error('Canton token request failed:', {
            status: tokenResponse.status,
            statusText: tokenResponse.statusText,
            error: errorText
          })
          throw new Error(`Failed to obtain Canton admin token: HTTP ${tokenResponse.status}`)
        }

        const data: CantonTokenResponse = await tokenResponse.json()
        
        if (data.access_token) {
          this.saveTokenToStorage(data.access_token, data.expires_in)
          console.log('Successfully obtained Canton admin token')
          return data.access_token
        } else {
          throw new Error('No access token in response')
        }
      } else {
        // Client-side: Use API route
        const response = await fetch('/api/canton/auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action: 'get_admin_token' })
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to get Canton admin token')
        }

        const data: CantonTokenResponse = await response.json()
        
        if (data.access_token) {
          this.saveTokenToStorage(data.access_token, data.expires_in)
          console.log('Successfully obtained Canton admin token')
          return data.access_token
        } else {
          throw new Error('No access token in response')
        }
      }
      
    } catch (error) {
      console.error('Error fetching Canton admin token:', error)
      this.clearToken()
      
      // Only show toast on client side
      if (typeof window !== 'undefined') {
        const { toast } = await import('sonner')
        toast.error('Failed to authenticate with Canton Network')
      }
      
      return null
    }
  }

  public async makeAuthenticatedRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const token = await this.getAdminToken()
    
    if (!token) {
      throw new Error('No valid Canton admin token available')
    }

    const authenticatedOptions: RequestInit = {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    }

    const response = await fetch(url, authenticatedOptions)
    
    // If we get a 401, the token might be invalid, try to refresh once
    if (response.status === 401 && this.authState.isAuthenticated) {
      console.log('Canton API returned 401, attempting token refresh...')
      this.clearToken()
      
      const newToken = await this.getAdminToken()
      if (newToken) {
        authenticatedOptions.headers = {
          ...authenticatedOptions.headers,
          'Authorization': `Bearer ${newToken}`
        }
        return await fetch(url, authenticatedOptions)
      }
    }
    
    return response
  }

  public isAuthenticated(): boolean {
    return this.authState.isAuthenticated && 
           this.authState.token !== null && 
           this.authState.expiresAt !== null && 
           this.authState.expiresAt > Date.now()
  }

  public getTokenInfo(): { token: string | null; expiresAt: number | null } {
    return {
      token: this.authState.token,
      expiresAt: this.authState.expiresAt
    }
  }

  public logout(): void {
    this.clearToken()
    console.log('Canton authentication cleared')
  }
}

// Export singleton instance
export const cantonAuth = CantonAuthService.getInstance()

// Export types for use in other files
export type { CantonTokenResponse, CantonAuthState }