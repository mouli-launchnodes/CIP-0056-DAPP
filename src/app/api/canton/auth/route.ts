import { NextRequest, NextResponse } from 'next/server'

interface CantonTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  scope?: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    if (action !== 'get_admin_token') {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }

    // Get Canton Network OIDC configuration from environment
    const tokenUrl = process.env.OIDC_TOKEN_URL
    const clientId = process.env.OIDC_CLIENT_ID
    const clientSecret = process.env.OIDC_CLIENT_SECRET
    const audience = process.env.OIDC_AUDIENCE

    if (!tokenUrl || !clientId || !clientSecret || !audience) {
      console.error('Missing Canton OIDC configuration:', {
        tokenUrl: !!tokenUrl,
        clientId: !!clientId,
        clientSecret: !!clientSecret,
        audience: !!audience
      })
      
      return NextResponse.json(
        { error: 'Canton OIDC configuration not found' },
        { status: 500 }
      )
    }

    console.log('Requesting Canton admin token from:', tokenUrl)

    // Prepare the token request
    const tokenRequestBody = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      audience: audience
    })

    // Make the token request to Canton Network
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
      
      return NextResponse.json(
        { 
          error: 'Failed to obtain Canton admin token',
          details: `HTTP ${tokenResponse.status}: ${tokenResponse.statusText}`
        },
        { status: 500 }
      )
    }

    const tokenData: CantonTokenResponse = await tokenResponse.json()
    
    console.log('Successfully obtained Canton admin token:', {
      token_type: tokenData.token_type,
      expires_in: tokenData.expires_in,
      scope: tokenData.scope,
      token_length: tokenData.access_token?.length || 0
    })

    // Return the token data (without logging the actual token for security)
    return NextResponse.json({
      access_token: tokenData.access_token,
      token_type: tokenData.token_type,
      expires_in: tokenData.expires_in,
      scope: tokenData.scope
    })

  } catch (error) {
    console.error('Canton authentication error:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error during Canton authentication',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Health check endpoint
export async function GET() {
  const hasConfig = !!(
    process.env.OIDC_TOKEN_URL &&
    process.env.OIDC_CLIENT_ID &&
    process.env.OIDC_CLIENT_SECRET &&
    process.env.OIDC_AUDIENCE
  )

  return NextResponse.json({
    status: 'ok',
    canton_oidc_configured: hasConfig,
    timestamp: new Date().toISOString()
  })
}