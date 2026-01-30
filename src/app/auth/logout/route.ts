import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const domain = process.env.AUTH0_DOMAIN;
    const clientId = process.env.AUTH0_CLIENT_ID;
    const returnTo = process.env.APP_BASE_URL;
    
    if (!domain || !clientId) {
      return NextResponse.redirect(new URL('/?error=auth_config_missing', request.url));
    }
    
    // Clear the auth cookie
    const response = NextResponse.redirect(new URL(`https://${domain}/v2/logout?client_id=${clientId}&returnTo=${encodeURIComponent(returnTo || 'http://localhost:3000')}`));
    response.cookies.delete('auth0_user');
    
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.redirect(new URL('/?error=logout_failed', request.url));
  }
}