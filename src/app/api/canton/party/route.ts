import { NextRequest, NextResponse } from 'next/server'
import { cantonPartyService } from '@/lib/canton-party-service'
import { cookies } from 'next/headers'
import { z } from 'zod'

// Schema for party allocation request
const partyAllocationSchema = z.object({
  auth0UserId: z.string().min(1, 'Auth0 User ID is required'),
  displayName: z.string().optional(),
  email: z.string().email().optional()
})

/**
 * POST /api/canton/party
 *
 * Allocate or retrieve a Canton party for the authenticated user
 *
 * Flow:
 * 1. Validate the request (must be authenticated via Auth0)
 * 2. Get Canton OIDC token (client_credentials grant)
 * 3. Call Canton Party Allocation with Auth0 ID as hint
 * 4. Canton returns existing party or creates new one
 * 5. Return Party ID to the application
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Party allocation request:', body)

    // Validate input
    const validatedData = partyAllocationSchema.parse(body)

    // Verify the user is authenticated via Auth0
    const cookieStore = await cookies()
    const userCookie = cookieStore.get('auth0_user')

    if (!userCookie) {
      return NextResponse.json(
        { error: 'Authentication required. Please log in first.' },
        { status: 401 }
      )
    }

    let sessionUser
    try {
      sessionUser = JSON.parse(userCookie.value)
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid session. Please log in again.' },
        { status: 401 }
      )
    }

    // Verify the Auth0 user ID matches the session
    if (validatedData.auth0UserId !== sessionUser.sub) {
      console.log('Auth0 user ID mismatch:', {
        provided: validatedData.auth0UserId,
        session: sessionUser.sub
      })
      return NextResponse.json(
        { error: 'User ID mismatch. Please log in again.' },
        { status: 403 }
      )
    }

    // Get display name from request or session
    const displayName = validatedData.displayName ||
      sessionUser.name ||
      validatedData.email?.split('@')[0] ||
      'User'

    console.log(`Allocating party for Auth0 user: ${validatedData.auth0UserId}`)

    // Allocate or retrieve party using Canton Party Service
    const partyResult = await cantonPartyService.allocateParty(
      validatedData.auth0UserId,
      displayName
    )

    console.log('Party allocation result:', partyResult)

    // Update the session cookie with the party ID
    const updatedSessionUser = {
      ...sessionUser,
      partyId: partyResult.partyId,
      partyDisplayName: partyResult.displayName,
      partyAllocatedAt: partyResult.allocatedAt,
      isNewParty: partyResult.isNewParty
    }

    cookieStore.set('auth0_user', JSON.stringify(updatedSessionUser), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    return NextResponse.json({
      success: true,
      party: {
        partyId: partyResult.partyId,
        displayName: partyResult.displayName,
        isNewParty: partyResult.isNewParty,
        allocatedAt: partyResult.allocatedAt
      },
      message: partyResult.isNewParty
        ? 'New party allocated successfully'
        : 'Existing party retrieved successfully'
    })

  } catch (error) {
    console.error('Party allocation error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.issues },
        { status: 400 }
      )
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error during party allocation' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/canton/party
 *
 * Get the current user's party information
 */
export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user from session
    const cookieStore = await cookies()
    const userCookie = cookieStore.get('auth0_user')

    if (!userCookie) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    let sessionUser
    try {
      sessionUser = JSON.parse(userCookie.value)
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      )
    }

    // Check if party is already allocated
    if (sessionUser.partyId) {
      return NextResponse.json({
        success: true,
        party: {
          partyId: sessionUser.partyId,
          displayName: sessionUser.partyDisplayName || sessionUser.name,
          allocatedAt: sessionUser.partyAllocatedAt
        },
        isAllocated: true
      })
    }

    // Check cache for this user
    const cachedParty = cantonPartyService.getCachedParty(sessionUser.sub)

    if (cachedParty) {
      return NextResponse.json({
        success: true,
        party: {
          partyId: cachedParty.partyId,
          displayName: cachedParty.displayName,
          allocatedAt: cachedParty.allocatedAt
        },
        isAllocated: true,
        fromCache: true
      })
    }

    return NextResponse.json({
      success: true,
      party: null,
      isAllocated: false,
      message: 'No party allocated yet. Call POST /api/canton/party to allocate.'
    })

  } catch (error) {
    console.error('Get party error:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
