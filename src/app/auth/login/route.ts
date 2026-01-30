import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const domain = process.env.AUTH0_DOMAIN;
    const clientId = process.env.AUTH0_CLIENT_ID;
    const redirectUri = `${process.env.APP_BASE_URL}/auth/callback`;
    const scope = 'openid profile email';
    
    if (!domain || !clientId) {
      return NextResponse.redirect(new URL('/?error=auth_config_missing', request.url));
    }
    
    // Generate state parameter for security
    const state = Math.random().toString(36).substring(2, 15);
    
    // Build Auth0 authorization URL
    const authUrl = new URL(`https://${domain}/authorize`);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', scope);
    authUrl.searchParams.set('state', state);
    
    return NextResponse.redirect(authUrl.toString());
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.redirect(new URL('/?error=login_failed', request.url));
  }
}