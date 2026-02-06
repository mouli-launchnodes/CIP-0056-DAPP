// Canton Network Party Allocation Service
// Implements the proper flow: Auth0 login -> Canton OIDC token -> Party Allocation

import { cantonAuth } from './canton-auth'

interface PartyAllocationResult {
  partyId: string
  displayName: string
  isNewParty: boolean
  allocatedAt: string
}

interface CantonPartyResponse {
  identifier: string
  displayName?: string
  isLocal?: boolean
}

class CantonPartyService {
  private static instance: CantonPartyService

  // Cache for party mappings (Auth0 user ID -> Canton Party ID)
  private partyCache: Map<string, PartyAllocationResult> = new Map()

  // Canton Participant Admin API URL (for party allocation)
  private participantApiUrl: string

  // DAML JSON API URL (for ledger operations)
  private jsonApiUrl: string

  private constructor() {
    // Canton Participant Admin API (typically on port 5002 for admin operations)
    this.participantApiUrl = process.env.CANTON_PARTICIPANT_API_URL || 'http://localhost:5002'
    // DAML JSON API (for ledger queries and operations)
    this.jsonApiUrl = process.env.DAML_LEDGER_HTTP_URL || 'http://localhost:7575'
  }

  public static getInstance(): CantonPartyService {
    if (!CantonPartyService.instance) {
      CantonPartyService.instance = new CantonPartyService()
    }
    return CantonPartyService.instance
  }

  /**
   * Allocate or retrieve a party for a given Auth0 user
   *
   * Flow:
   * 1. Get Canton OIDC token (client_credentials grant)
   * 2. Check if party with Auth0 ID hint already exists
   * 3. If exists, return existing party
   * 4. If not, create new party with Auth0 ID as hint
   * 5. Return Party ID
   */
  async allocateParty(auth0UserId: string, displayName: string): Promise<PartyAllocationResult> {
    console.log(`Allocating party for Auth0 user: ${auth0UserId}`)

    // Check cache first
    const cached = this.partyCache.get(auth0UserId)
    if (cached) {
      console.log(`Found cached party for user ${auth0UserId}: ${cached.partyId}`)
      return cached
    }

    try {
      // Step 1: Get Canton OIDC token
      const cantonToken = await cantonAuth.getAdminToken()

      if (!cantonToken) {
        console.log('Could not obtain Canton OIDC token, using DAML JSON API fallback')
        return await this.allocatePartyViaJsonApi(auth0UserId, displayName)
      }

      // Step 2: Try Canton Participant Admin API for party allocation
      const result = await this.allocatePartyViaCanton(auth0UserId, displayName, cantonToken)

      // Cache the result
      this.partyCache.set(auth0UserId, result)

      return result

    } catch (error) {
      console.error('Canton party allocation failed:', error)

      // Fallback to DAML JSON API
      console.log('Falling back to DAML JSON API for party allocation')
      return await this.allocatePartyViaJsonApi(auth0UserId, displayName)
    }
  }

  /**
   * Allocate party via Canton Participant Admin API
   */
  private async allocatePartyViaCanton(
    auth0UserId: string,
    displayName: string,
    cantonToken: string
  ): Promise<PartyAllocationResult> {
    // Create a party hint from Auth0 user ID (sanitize for Canton)
    const partyHint = this.createPartyHint(auth0UserId)

    console.log(`Attempting Canton party allocation with hint: ${partyHint}`)

    // Step 2a: First, check if party already exists
    const existingParty = await this.findExistingParty(partyHint, cantonToken)

    if (existingParty) {
      console.log(`Found existing party: ${existingParty.identifier}`)
      return {
        partyId: existingParty.identifier,
        displayName: existingParty.displayName || displayName,
        isNewParty: false,
        allocatedAt: new Date().toISOString()
      }
    }

    // Step 2b: Create new party
    console.log('No existing party found, creating new party...')

    const newParty = await this.createParty(partyHint, displayName, cantonToken)

    return {
      partyId: newParty.identifier,
      displayName: newParty.displayName || displayName,
      isNewParty: true,
      allocatedAt: new Date().toISOString()
    }
  }

  /**
   * Find existing party by hint via Canton Participant Admin API
   */
  private async findExistingParty(
    partyHint: string,
    cantonToken: string
  ): Promise<CantonPartyResponse | null> {
    try {
      // Query Canton Participant Admin API for parties
      const response = await fetch(`${this.participantApiUrl}/v2/parties`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${cantonToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        // If admin API is not available, try JSON API
        console.log('Participant Admin API not available, trying JSON API...')
        return await this.findExactPartyMatch(partyHint)
      }

      const parties: CantonPartyResponse[] = await response.json()

      // Find party where identifier starts with our hint (exact match)
      const matchingParty = parties.find(p => {
        const partyPrefix = p.identifier.split('::')[0]
        return partyPrefix === partyHint
      })

      return matchingParty || null

    } catch (error) {
      console.log('Error querying Canton parties:', error)
      return await this.findExactPartyMatch(partyHint)
    }
  }


  /**
   * Create new party via Canton Participant Admin API
   */
  private async createParty(
    partyHint: string,
    displayName: string,
    cantonToken: string
  ): Promise<CantonPartyResponse> {
    try {
      // Try Canton Participant Admin API first
      const response = await fetch(`${this.participantApiUrl}/v2/parties`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cantonToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          partyIdHint: partyHint,
          displayName: displayName
        })
      })

      if (response.ok) {
        const newParty: CantonPartyResponse = await response.json()
        console.log('Created party via Canton Admin API:', newParty)
        return newParty
      }

      // Fall back to JSON API party allocation
      console.log('Canton Admin API party creation failed, trying JSON API...')
      return await this.createPartyViaJsonApi(partyHint, displayName)

    } catch (error) {
      console.log('Error creating party via Canton API:', error)
      return await this.createPartyViaJsonApi(partyHint, displayName)
    }
  }

  /**
   * Create party via DAML JSON API (allocate-party endpoint)
   */
  private async createPartyViaJsonApi(
    partyHint: string,
    displayName: string
  ): Promise<CantonPartyResponse> {
    const adminJwt = this.createAdminJwt()

    const response = await fetch(`${this.jsonApiUrl}/v1/parties/allocate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminJwt}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        identifierHint: partyHint,
        displayName: displayName
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to allocate party: ${errorText}`)
    }

    const result = await response.json()

    return {
      identifier: result.result?.identifier || result.identifier,
      displayName: result.result?.displayName || displayName,
      isLocal: true
    }
  }

  /**
   * Allocate party using DAML JSON API
   * This properly creates unique parties for each Auth0 user
   */
  private async allocatePartyViaJsonApi(
    auth0UserId: string,
    displayName: string
  ): Promise<PartyAllocationResult> {
    console.log('Using DAML JSON API for party allocation')
    console.log(`Auth0 User ID: ${auth0UserId}`)

    const partyHint = this.createPartyHint(auth0UserId)
    console.log(`Party hint: ${partyHint}`)

    try {
      // First, try to find an existing party that EXACTLY matches this user's hint
      const existingParty = await this.findExactPartyMatch(partyHint)

      if (existingParty) {
        console.log(`Found existing party for this user: ${existingParty.identifier}`)
        const result: PartyAllocationResult = {
          partyId: existingParty.identifier,
          displayName: existingParty.displayName || displayName,
          isNewParty: false,
          allocatedAt: new Date().toISOString()
        }
        this.partyCache.set(auth0UserId, result)
        return result
      }

      // No existing party found - allocate a NEW party for this user
      console.log(`No existing party found for ${partyHint}, allocating new party...`)
      const newParty = await this.createPartyViaJsonApi(partyHint, displayName)

      const result: PartyAllocationResult = {
        partyId: newParty.identifier,
        displayName: newParty.displayName || displayName,
        isNewParty: true,
        allocatedAt: new Date().toISOString()
      }

      this.partyCache.set(auth0UserId, result)
      console.log(`Allocated new party: ${result.partyId}`)
      return result

    } catch (error) {
      console.error('DAML JSON API party allocation failed:', error)
      throw new Error(`Failed to allocate party: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Find a party that exactly matches the given hint (starts with the hint)
   */
  private async findExactPartyMatch(partyHint: string): Promise<CantonPartyResponse | null> {
    try {
      const adminJwt = this.createAdminJwt()

      const response = await fetch(`${this.jsonApiUrl}/v1/parties`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${adminJwt}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        console.log('Failed to fetch parties:', response.status)
        return null
      }

      const result = await response.json()
      const parties: CantonPartyResponse[] = result.result || []

      console.log(`Searching for party with hint '${partyHint}' among ${parties.length} parties`)

      // Find party where identifier STARTS with our hint (exact match)
      // Party identifiers are in format: "hint::namespace"
      const matchingParty = parties.find(p => {
        const partyPrefix = p.identifier.split('::')[0]
        return partyPrefix === partyHint
      })

      if (matchingParty) {
        console.log(`Found exact match: ${matchingParty.identifier}`)
      } else {
        console.log(`No exact match found for hint: ${partyHint}`)
      }

      return matchingParty || null

    } catch (error) {
      console.error('Error finding exact party match:', error)
      return null
    }
  }


  /**
   * Create a party hint from Auth0 user ID
   * Preserves the Auth0 provider prefix (e.g., google-oauth2) for uniqueness
   */
  private createPartyHint(auth0UserId: string): string {
    // Auth0 user IDs come in formats like:
    // - "google-oauth2|123456789" (Google login)
    // - "auth0|123456789" (Auth0 database)
    // - "github|123456789" (GitHub login)
    //
    // We replace | with _ to make it valid for Canton party hints
    // This preserves the provider info for uniqueness

    const sanitized = auth0UserId
      .replace(/\|/g, '_')  // Replace | with _
      .replace(/[^a-zA-Z0-9_-]/g, '_')  // Replace any other invalid chars
      .substring(0, 63)  // Canton has length limits

    console.log(`Created party hint: ${sanitized} from Auth0 ID: ${auth0UserId}`)
    return sanitized
  }

  /**
   * Create admin JWT for DAML JSON API
   */
  private createAdminJwt(): string {
    const header = {
      "alg": "HS256",
      "typ": "JWT"
    }

    const payload = {
      "aud": ["daml-ledger-api"],
      "sub": "admin",
      "exp": Math.floor(Date.now() / 1000) + (60 * 60 * 24),
      "iat": Math.floor(Date.now() / 1000),
      "ledgerId": "sandbox",
      "participantId": "sandbox-participant",
      "applicationId": "canton-tokenization-demo",
      "actAs": ["admin"],
      "readAs": ["admin"],
      "admin": true
    }

    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url')
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url')
    const signature = Buffer.from('local-dev-signature').toString('base64url')

    return `${encodedHeader}.${encodedPayload}.${signature}`
  }

  /**
   * Get cached party for a user
   */
  getCachedParty(auth0UserId: string): PartyAllocationResult | null {
    return this.partyCache.get(auth0UserId) || null
  }

  /**
   * Clear party cache (e.g., on logout)
   */
  clearCache(auth0UserId?: string): void {
    if (auth0UserId) {
      this.partyCache.delete(auth0UserId)
    } else {
      this.partyCache.clear()
    }
  }
}

// Export singleton instance
export const cantonPartyService = CantonPartyService.getInstance()

// Export types
export type { PartyAllocationResult, CantonPartyResponse }
