import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userCookie = cookieStore.get('auth0_user');
    
    if (userCookie) {
      try {
        const user = JSON.parse(userCookie.value);
        return NextResponse.json(user);
      } catch (error) {
        return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
      }
    }
    
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  } catch (error) {
    console.error('Profile error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}