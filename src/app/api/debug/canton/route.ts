import { NextRequest, NextResponse } from 'next/server'
import { cantonAuth } from '@/lib/canton-auth'

export async function GET() {
  try {
    console.log('Debug: Checking Canton authentication status...')
    
    // Check if Canton OIDC is configured
    const hasConfig = !!(
      process.env.OIDC_TOKEN_URL &&
      process.env.OIDC_CLIENT_ID &&
      process.env.OIDC_CLIENT_SECRET &&
      process.env.OIDC_AUDIENCE
    )
    
    console.log('Debug: Canton OIDC configured:', hasConfig)
    
    // Try to get a token
    let tokenStatus = 'not_attempted'
    let tokenError = null
    
    try {
      const token = await cantonAuth.getAdminToken()
      if (token) {
        tokenStatus = 'success'
        console.log('Debug: Canton token obtained successfully')
      } else {
        tokenStatus = 'failed'
        console.log('Debug: Canton token is null')
      }
    } catch (error) {
      tokenStatus = 'error'
      tokenError = error instanceof Error ? error.message : 'Unknown error'
      console.log('Debug: Canton token error:', tokenError)
    }
    
    const authInfo = cantonAuth.getTokenInfo()
    
    return NextResponse.json({
      success: true,
      debug: {
        canton_oidc_configured: hasConfig,
        environment_variables: {
          OIDC_TOKEN_URL: !!process.env.OIDC_TOKEN_URL,
          OIDC_CLIENT_ID: !!process.env.OIDC_CLIENT_ID,
          OIDC_CLIENT_SECRET: !!process.env.OIDC_CLIENT_SECRET,
          OIDC_AUDIENCE: !!process.env.OIDC_AUDIENCE
        },
        token_status: tokenStatus,
        token_error: tokenError,
        is_authenticated: cantonAuth.isAuthenticated(),
        token_info: {
          has_token: !!authInfo.token,
          expires_at: authInfo.expiresAt,
          time_until_expiry: authInfo.expiresAt ? authInfo.expiresAt - Date.now() : null
        },
        timestamp: new Date().toISOString()
      }
    })
    
  } catch (error) {
    console.error('Debug Canton error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Debug Canton failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body
    
    if (action === 'test_token_refresh') {
      console.log('Debug: Testing Canton token refresh...')
      
      // Clear existing token
      cantonAuth.logout()
      
      // Try to get a new token
      const token = await cantonAuth.getAdminToken()
      
      return NextResponse.json({
        success: true,
        message: 'Token refresh test completed',
        token_obtained: !!token,
        timestamp: new Date().toISOString()
      })
    }
    
    return NextResponse.json(
      { error: 'Invalid debug action' },
      { status: 400 }
    )
    
  } catch (error) {
    console.error('Debug Canton POST error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Debug Canton POST failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}