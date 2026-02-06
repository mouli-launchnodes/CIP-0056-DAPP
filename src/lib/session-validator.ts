// Session validation utility to handle DAML ledger state changes
import { damlClient } from './daml-client'
import { cantonPartyService } from './canton-party-service'

export interface SessionValidationResult {
  isValid: boolean
  needsReOnboarding: boolean
  currentPartyId?: string
  availableParties?: string[]
  error?: string
}

export async function validateUserSession(
  sessionPartyId: string,
  userEmail: string,
  auth0UserId?: string
): Promise<SessionValidationResult> {
  try {
    // Check if DAML ledger is available
    const isLedgerAvailable = await damlClient.isLedgerAvailable()
    if (!isLedgerAvailable) {
      return {
        isValid: false,
        needsReOnboarding: false,
        error: 'DAML ledger is not available'
      }
    }

    // Try to query tokens with the user's party ID to validate it exists
    try {
      await damlClient.getAllTokens(sessionPartyId)
      // If this succeeds, the party exists and is valid
      return {
        isValid: true,
        needsReOnboarding: false,
        currentPartyId: sessionPartyId
      }
    } catch (error) {
      // If this fails, the party might not exist
      console.log(`Party validation failed for ${sessionPartyId}:`, error)

      // Try to get a new party using Canton Party Service
      if (auth0UserId) {
        try {
          const newPartyResult = await cantonPartyService.allocateParty(
            auth0UserId,
            userEmail.split('@')[0]
          )
          return {
            isValid: false,
            needsReOnboarding: true,
            currentPartyId: newPartyResult.partyId,
            error: 'Your session is outdated. A new Canton party has been allocated for you.'
          }
        } catch (allocateError) {
          console.error('Canton party allocation failed:', allocateError)
        }
      }

      return {
        isValid: false,
        needsReOnboarding: true,
        error: 'Failed to validate or reassign party ID. Please complete onboarding again.'
      }
    }
  } catch (error) {
    return {
      isValid: false,
      needsReOnboarding: false,
      error: `Session validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

export function createSessionValidationResponse(validation: SessionValidationResult) {
  if (validation.needsReOnboarding) {
    return {
      error: validation.error || 'Session expired',
      action: 'refresh_and_onboard',
      details: 'Please refresh the page and complete onboarding again.',
      newPartyId: validation.currentPartyId
    }
  }
  
  if (!validation.isValid) {
    return {
      error: validation.error || 'Session validation failed',
      action: 'retry_or_refresh'
    }
  }
  
  return null // Session is valid
}