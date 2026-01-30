import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');
    
    if (error) {
      console.error('Auth0 callback error:', error);
      return NextResponse.redirect(new URL(`/?error=${error}`, request.url));
    }
    
    if (!code) {
      return NextResponse.redirect(new URL('/?error=missing_code', request.url));
    }
    
    // Exchange code for tokens
    const domain = process.env.AUTH0_DOMAIN;
    const clientId = process.env.AUTH0_CLIENT_ID;
    const clientSecret = process.env.AUTH0_CLIENT_SECRET;
    const redirectUri = `${process.env.APP_BASE_URL}/auth/callback`;
    
    if (!domain || !clientId || !clientSecret) {
      throw new Error('Auth0 configuration missing');
    }
    
    const tokenResponse = await fetch(`https://${domain}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        redirect_uri: redirectUri,
      }),
    });
    
    if (!tokenResponse.ok) {
      throw new Error('Token exchange failed');
    }
    
    const tokens = await tokenResponse.json();
    
    // Get user info
    const userResponse = await fetch(`https://${domain}/userinfo`, {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });
    
    if (!userResponse.ok) {
      throw new Error('Failed to get user info');
    }
    
    const user = await userResponse.json();
    
    // Create response with user data
    const response = NextResponse.redirect(new URL('/?auth=success', request.url));
    
    // Set secure HTTP-only cookies
    response.cookies.set('auth0_user', JSON.stringify(user), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    
    return response;
  } catch (error) {
    console.error('Callback error:', error);
    return NextResponse.redirect(new URL('/?error=callback_failed', request.url));
  }
}