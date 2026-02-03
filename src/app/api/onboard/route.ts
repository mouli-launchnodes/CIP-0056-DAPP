import { NextRequest, NextResponse } from 'next/server'
import { damlClient } from '@/lib/daml-client'
import { cantonSDK } from '@/lib/canton'
import { cookies } from 'next/headers'
import { z } from 'zod'

// Updated schema to include Auth0 user data
const auth0OnboardingSchema = z.object({
  email: z.string().email(),
  auth0UserId: z.string().optional(),
  name: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Onboard request body:', body)
    
    // Validate input
    const validatedData = auth0OnboardingSchema.parse(body)
    console.log('Validated data:', validatedData)
    
    // Get user session from cookies
    const cookieStore = await cookies()
    const userCookie = cookieStore.get('auth0_user')
    
    console.log('User cookie exists:', !!userCookie)
    
    if (!userCookie) {
      console.log('No auth0_user cookie found')
      return NextResponse.json(
        { error: 'Authentication required' },
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
        { error: 'Invalid session' },
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
        { error: 'User ID mismatch' },
        { status: 403 }
      )
    }
    
    // Generate deterministic party ID from email (no mock database)
    const userEmail = validatedData.email
    const partyId = `party::${userEmail.replace('@', '_at_').replace(/\./g, '_')}`
    
    console.log(`Generated deterministic party ID: ${partyId} for email: ${userEmail}`)
    
    try {
      // Register party with DAML ledger (no mock database)
      console.log('Registering party with DAML ledger...')
      const partyResult = await damlClient.registerParty(userEmail, validatedData.name || sessionUser.name || 'User')
      
      console.log('Party registration result:', partyResult)
      
      // Update session cookie with party information
      cookieStore.set('auth0_user', JSON.stringify({
        ...sessionUser,
        email: userEmail,
        partyId: partyResult.partyId
      }), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      })
      
      return NextResponse.json({
        success: true,
        partyId: partyResult.partyId,
        message: 'User onboarded successfully with real DAML integration',
        isExisting: false,
        damlIntegration: true,
        user: {
          email: userEmail,
          name: validatedData.name || sessionUser.name,
          partyId: partyResult.partyId
        }
      })
      
    } catch (damlError) {
      console.error('DAML integration error:', damlError)
      
      // Provide specific error messages for DAML issues
      if (damlError instanceof Error) {
        if (damlError.message.includes('connect')) {
          return NextResponse.json({
            error: 'Failed to connect to DAML ledger',
            details: 'Please ensure DAML sandbox is running with: daml start',
            troubleshooting: {
              step1: 'Open terminal in project directory',
              step2: 'Run: daml start',
              step3: 'Wait for "Navigator running on http://localhost:7500"',
              step4: 'Try onboarding again'
            }
          }, { status: 503 })
        }
      }
      
      // Fallback: still create party ID but without DAML registration
      console.warn('DAML registration failed, using fallback party ID generation')
      
      // Update session cookie with fallback party information
      cookieStore.set('auth0_user', JSON.stringify({
        ...sessionUser,
        email: userEmail,
        partyId: partyId
      }), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      })
      
      return NextResponse.json({
        success: true,
        partyId: partyId,
        message: 'User onboarded with fallback party ID (DAML ledger not available)',
        isExisting: false,
        damlIntegration: false,
        user: {
          email: userEmail,
          name: validatedData.name || sessionUser.name,
          partyId: partyId
        },
        warning: 'DAML ledger not available, using fallback implementation'
      })
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