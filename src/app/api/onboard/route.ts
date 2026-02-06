import { NextRequest, NextResponse } from 'next/server'
import { cantonPartyService } from '@/lib/canton-party-service'
import { cookies } from 'next/headers'
import { z } from 'zod'

// Updated schema to include Auth0 user data
const auth0OnboardingSchema = z.object({
  email: z.string().email(),
  auth0UserId: z.string().optional(),
  name: z.string().optional()
})

/**
 * POST /api/onboard
 *
 * Onboard a user to the Canton Network
 *
 * New Flow:
 * 1. User logs in with Auth0 (already done - session exists)
 * 2. Get Auth0 User ID from session
 * 3. Get Canton OIDC Token (client_credentials grant)
 * 4. Call Canton Party Allocation API with Auth0 ID as hint
 * 5. Canton checks its internal DB:
 *    - If party with that hint exists → return existing party
 *    - If not → create new party + store in Canton DB
 * 6. Return Party ID to the application
 * 7. Use Party ID for all token operations
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Onboard request body:', body)

    // Validate input
    const validatedData = auth0OnboardingSchema.parse(body)
    console.log('Validated data:', validatedData)

    // Get user session from cookies (Auth0 login must have happened)
    const cookieStore = await cookies()
    const userCookie = cookieStore.get('auth0_user')

    console.log('User cookie exists:', !!userCookie)

    if (!userCookie) {
      console.log('No auth0_user cookie found - user must log in first')
      return NextResponse.json(
        { error: 'Authentication required. Please log in with Auth0 first.' },
        { status: 401 }
      )
    }

    let sessionUser
    try {
      sessionUser = JSON.parse(userCookie.value)
      console.log('Session user:', {
        sub: sessionUser.sub,
        email: sessionUser.email,
        name: sessionUser.name
      })
    } catch (error) {
      console.log('Failed to parse user cookie:', error)
      return NextResponse.json(
        { error: 'Invalid session. Please log in again.' },
        { status: 401 }
      )
    }

    // Verify the Auth0 user ID matches the session
    if (validatedData.auth0UserId && validatedData.auth0UserId !== sessionUser.sub) {
      console.log('User ID mismatch:', {
        provided: validatedData.auth0UserId,
        session: sessionUser.sub
      })
      return NextResponse.json(
        { error: 'User ID mismatch. Please log in again.' },
        { status: 403 }
      )
    }

    // Get Auth0 User ID (step 2 of the flow)
    const auth0UserId = sessionUser.sub
    const userEmail = validatedData.email || sessionUser.email
    const displayName = validatedData.name || sessionUser.name || userEmail.split('@')[0]

    console.log(`Starting Canton party allocation for Auth0 user: ${auth0UserId}`)

    try {
      // Steps 3-5: Canton OIDC token + Party Allocation
      // The cantonPartyService handles:
      // - Getting Canton OIDC token (client_credentials grant)
      // - Calling Canton Party Allocation API with Auth0 ID as hint
      // - Canton checks DB: returns existing or creates new party
      const partyResult = await cantonPartyService.allocateParty(auth0UserId, displayName)

      console.log('Canton party allocation result:', partyResult)

      // Step 6: Update session cookie with party information
      const updatedSession = {
        ...sessionUser,
        email: userEmail,
        partyId: partyResult.partyId,
        partyDisplayName: partyResult.displayName,
        partyAllocatedAt: partyResult.allocatedAt,
        isNewParty: partyResult.isNewParty
      }

      cookieStore.set('auth0_user', JSON.stringify(updatedSession), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      })

      // Step 7: Return Party ID - ready for token operations
      return NextResponse.json({
        success: true,
        partyId: partyResult.partyId,
        message: partyResult.isNewParty
          ? 'New Canton party created and user onboarded successfully'
          : 'User onboarded successfully with existing Canton party',
        isExisting: !partyResult.isNewParty,
        cantonIntegration: true,
        user: {
          email: userEmail,
          name: displayName,
          partyId: partyResult.partyId,
          auth0UserId: auth0UserId
        },
        party: {
          partyId: partyResult.partyId,
          displayName: partyResult.displayName,
          allocatedAt: partyResult.allocatedAt,
          isNewParty: partyResult.isNewParty
        }
      })

    } catch (cantonError) {
      console.error('Canton party allocation error:', cantonError)

      // Provide specific error messages
      if (cantonError instanceof Error) {
        if (cantonError.message.includes('connect') || cantonError.message.includes('ECONNREFUSED')) {
          return NextResponse.json({
            error: 'Failed to connect to Canton Network',
            details: 'Please ensure Canton sandbox or Canton Network is running',
            troubleshooting: {
              step1: 'Open terminal in project directory',
              step2: 'Run: daml start (for local sandbox)',
              step3: 'Or connect to Canton Network with proper OIDC credentials',
              step4: 'Try onboarding again'
            }
          }, { status: 503 })
        }

        if (cantonError.message.includes('No parties available')) {
          return NextResponse.json({
            error: 'No parties available in Canton',
            details: 'The Canton ledger has no parties. Please initialize the ledger first.',
            troubleshooting: {
              step1: 'Restart daml sandbox',
              step2: 'Or run the demo setup script'
            }
          }, { status: 503 })
        }
      }

      return NextResponse.json(
        {
          success: false,
          error: 'Canton party allocation failed. Please try again.',
          details: cantonError instanceof Error ? cantonError.message : 'Unknown error'
        },
        { status: 503 }
      )
    }

  } catch (error) {
    console.error('Onboarding error:', error)

    if (error instanceof z.ZodError) {
      console.log('Validation error:', error.issues)
      return NextResponse.json(
        { error: 'Invalid input data', details: error.issues },
        { status: 400 }
      )
    }

    if (error instanceof Error) {
      console.log('General error:', error.message)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}