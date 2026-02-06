import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userCookie = cookieStore.get('auth0_user')
    
    if (!userCookie) {
      return NextResponse.json({
        hasSession: false,
        error: 'No auth0_user cookie found'
      })
    }
    
    let sessionUser
    try {
      sessionUser = JSON.parse(userCookie.value)
    } catch (error) {
      return NextResponse.json({
        hasSession: true,
        error: 'Failed to parse session cookie',
        rawCookie: userCookie.value.substring(0, 100) + '...'
      })
    }
    
    return NextResponse.json({
      hasSession: true,
      session: {
        email: sessionUser.email,
        partyId: sessionUser.partyId,
        name: sessionUser.name,
        sub: sessionUser.sub
      },
      cookieLength: userCookie.value.length
    })
    
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to check session',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}