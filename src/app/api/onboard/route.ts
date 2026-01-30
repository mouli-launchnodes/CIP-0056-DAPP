import { NextRequest, NextResponse } from 'next/server'
import { mockDb } from '@/lib/mock-db'
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
    
    // Check if user already exists by Auth0 ID or email
    console.log('Checking for existing user...')
    const existingUser = await mockDb.user.findFirst({
      where: {
        OR: [
          { email: validatedData.email },
          { auth0UserId: sessionUser.sub }
        ]
      }
    })
    
    if (existingUser) {
      console.log('Existing user found:', existingUser.email)
      return NextResponse.json(
        { 
          success: true,
          partyId: existingUser.partyId,
          message: 'User already onboarded',
          isExisting: true
        },
        { status: 200 }
      )
    }
    
    console.log('No existing user found, generating new Party ID...')
    
    // Generate Party ID using Canton SDK
    try {
      const partyInfo = await cantonSDK.generatePartyId(validatedData.email)
      console.log('Party ID generated:', partyInfo.partyId)
      
      // Store user in database with Auth0 information
      const user = await mockDb.user.create({
        data: {
          email: validatedData.email,
          partyId: partyInfo.partyId,
          auth0UserId: sessionUser.sub,
          name: validatedData.name || sessionUser.name || null,
          profilePicture: sessionUser.picture || null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })
      
      console.log('User created successfully:', user.email)
      
      return NextResponse.json({
        success: true,
        partyId: user.partyId,
        message: 'User onboarded successfully',
        isExisting: false,
        user: {
          email: user.email,
          name: user.name,
          partyId: user.partyId
        }
      })
    } catch (cantonError) {
      console.error('Canton SDK error:', cantonError)
      return NextResponse.json(
        { error: `Canton Network error: ${cantonError instanceof Error ? cantonError.message : 'Unknown error'}` },
        { status: 500 }
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