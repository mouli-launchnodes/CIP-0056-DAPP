// DAML Ledger Client for real Canton Network integration
// Uses DAML HTTP JSON API instead of gRPC for web compatibility

// Global type for legacy proposals storage
declare global {
  var legacyProposals: Map<string, any> | undefined
}

// Import generated DAML templates
let CIP0056Token: any;
try {
  CIP0056Token = require('@daml.js/cip0056-token-1.0.0').CIP0056Token;
} catch (error) {
  console.warn('DAML generated templates not available, using fallback');
  CIP0056Token = null;
}

// DAML template interfaces (generated from DAML contracts)
export interface TokenMetadata {
  issuer: string
  tokenName: string
  currency: string
  quantityPrecision: number
  pricePrecision: number
  totalSupply: string
  description: string
}

export interface TokenHolding {
  issuer: string
  owner: string
  tokenName: string
  amount: string
}

export interface PartyRegistration {
  party: string
  email: string
  displayName: string
  registrationTime: string
}

export interface MintRequest {
  issuer: string
  recipient: string
  tokenName: string
  mintAmount: string
}

// DAML template IDs - Updated with token locking for transfer proposals
// New version (f052740a) has proper token locking; old version (a3c384a3) had stale holdingId issue
export const TEMPLATE_IDS = {
  // New template IDs (used for creating new contracts)
  TokenMetadata: 'f052740a181af047e442276563a56be16cd8d58f9aba61d0d182a3b2a060c329:CIP0056Token:TokenMetadata',
  TokenHolding: 'f052740a181af047e442276563a56be16cd8d58f9aba61d0d182a3b2a060c329:CIP0056Token:TokenHolding',
  TransferProposal: 'f052740a181af047e442276563a56be16cd8d58f9aba61d0d182a3b2a060c329:CIP0056Token:TransferProposal',
  PartyRegistration: 'f052740a181af047e442276563a56be16cd8d58f9aba61d0d182a3b2a060c329:CIP0056Token:PartyRegistration',
  MintRequest: 'f052740a181af047e442276563a56be16cd8d58f9aba61d0d182a3b2a060c329:CIP0056Token:MintRequest'
}

// Legacy template IDs for backward compatibility (query only)
export const LEGACY_TEMPLATE_IDS = {
  TokenMetadata: 'a3c384a38bc5ae48aa8420f8ff6287f583586d2213137889884dce7957905d8c:CIP0056Token:TokenMetadata',
  TokenHolding: 'a3c384a38bc5ae48aa8420f8ff6287f583586d2213137889884dce7957905d8c:CIP0056Token:TokenHolding',
  TransferProposal: 'a3c384a38bc5ae48aa8420f8ff6287f583586d2213137889884dce7957905d8c:CIP0056Token:TransferProposal',
  PartyRegistration: 'a3c384a38bc5ae48aa8420f8ff6287f583586d2213137889884dce7957905d8c:CIP0056Token:PartyRegistration',
  MintRequest: 'a3c384a38bc5ae48aa8420f8ff6287f583586d2213137889884dce7957905d8c:CIP0056Token:MintRequest'
}

// Removed fallback storage - application now requires DAML ledger to be available

class DamlLedgerClient {
  private httpUrl: string
  private isAvailable: boolean

  constructor() {
    // Use DAML HTTP JSON API
    this.httpUrl = process.env.DAML_LEDGER_HTTP_URL || 'http://localhost:7575'
    this.isAvailable = CIP0056Token !== null
    
    console.log(`Initializing DAML HTTP JSON API client with URL: ${this.httpUrl}`)
    console.log(`DAML templates available: ${CIP0056Token !== null}`)
    console.log(`DAML client available: ${this.isAvailable}`)
    
    // STRICT MODE: Fail immediately if DAML templates are not available
    if (!this.isAvailable) {
      throw new Error('DAML templates not available. Please run: daml build && daml codegen js')
    }
  }

  // Check if DAML SDK is available
  private checkAvailability(): void {
    if (!this.isAvailable) {
      throw new Error('DAML templates not available. Please run: daml build && daml codegen js')
    }
  }

  // Create a proper JWT token for DAML ledger authentication (updated format)
  private createJWT(party: string): string {
    const header = {
      "alg": "HS256",
      "typ": "JWT"
    }
    
    const payload = {
      "aud": ["daml-ledger-api"],  // Array format for aud
      "sub": party,
      "exp": Math.floor(Date.now() / 1000) + (60 * 60 * 24), // 24 hours
      "iat": Math.floor(Date.now() / 1000),
      "ledgerId": "sandbox",
      "participantId": "sandbox-participant", 
      "applicationId": "canton-tokenization-demo",
      "actAs": [party],
      "readAs": [party],
      "admin": party === "admin"
    }
    
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url')
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url')
    const signature = Buffer.from('local-dev-signature').toString('base64url')
    
    return `${encodedHeader}.${encodedPayload}.${signature}`
  }

  // Create a multi-party JWT token for operations requiring multiple party authorization (updated format)
  private createMultiPartyJWT(parties: string[]): string {
    const header = {
      "alg": "HS256",
      "typ": "JWT"
    }
    
    const payload = {
      "aud": ["daml-ledger-api"],  // Array format for aud
      "sub": parties[0], // Primary party
      "exp": Math.floor(Date.now() / 1000) + (60 * 60 * 24), // 24 hours
      "iat": Math.floor(Date.now() / 1000),
      "ledgerId": "sandbox",
      "participantId": "sandbox-participant", 
      "applicationId": "canton-tokenization-demo",
      "actAs": parties, // Multiple parties can act
      "readAs": parties, // Multiple parties can read
      "admin": parties.includes("admin")
    }
    
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url')
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url')
    const signature = Buffer.from('local-dev-signature').toString('base64url')
    
    return `${encodedHeader}.${encodedPayload}.${signature}`
  }

  // Make HTTP request to DAML JSON API
  private async makeRequest(endpoint: string, method: string, body: any, party: string): Promise<any> {
    const token = this.createJWT(party)
    
    const response = await fetch(`${this.httpUrl}/v1/${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`DAML API error (${response.status}): ${errorText}`)
    }

    return await response.json()
  }

  // Register a new party (assign unique existing parties to different users)
  async registerParty(email: string, displayName: string): Promise<{ party: string; partyId: string }> {
    try {
      console.log(`Registering new party for email: ${email}`)
      
      // STRICT MODE: No fallback - require DAML ledger
      this.checkAvailability()

      try {
        // Get existing parties from DAML sandbox
        const response = await fetch(`${this.httpUrl}/v1/parties`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.createJWT('admin')}`
          }
        })

        if (!response.ok) {
          throw new Error(`DAML ledger not available: HTTP ${response.status}`)
        }

        const result = await response.json()
        console.log('Available parties:', result)
        
        if (result.result && result.result.length > 0) {
          // Create a deterministic mapping from email to party index
          // Use both email hash and domain hash for better distribution
          const emailHash = this.hashString(email)
          const domain = email.split('@')[1] || ''
          const domainHash = this.hashString(domain)
          
          // Combine both hashes for better distribution
          const combinedHash = (emailHash ^ (domainHash << 16)) >>> 0
          const partyIndex = combinedHash % result.result.length
          const assignedParty = result.result[partyIndex].identifier
          
          console.log(`Assigned party ${assignedParty} to user ${email} (combined hash: ${combinedHash}, index: ${partyIndex})`)
          return { party: assignedParty, partyId: assignedParty }
        }
        
        throw new Error('No parties available in DAML ledger')
        
      } catch (damlError) {
        console.error('DAML party lookup failed:', damlError)
        throw new Error(`DAML ledger connection failed: ${damlError instanceof Error ? damlError.message : 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Failed to register party:', error)
      throw new Error(`Failed to register party: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Auto-detect available template IDs from the ledger
  private async detectAvailableTemplateIds(party: string): Promise<string[]> {
    try {
      console.log('Auto-detecting available template IDs from ledger...')
      
      // Try to query with a broad template search
      const response = await fetch(`${this.httpUrl}/v1/packages`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.createJWT(party)}`
        }
      })

      if (response.ok) {
        const packages = await response.json()
        console.log('Available packages:', packages)
        
        // Extract template IDs that match our CIP0056Token templates
        const availableTemplateIds: string[] = []
        
        if (packages.result) {
          for (const pkg of packages.result) {
            const packageId = pkg.packageId
            // Construct template IDs for this package
            const templateIds = [
              `${packageId}:CIP0056Token:TokenMetadata`,
              `${packageId}:CIP0056Token:TokenHolding`,
              `${packageId}:CIP0056Token:TransferProposal`,
              `${packageId}:CIP0056Token:PartyRegistration`,
              `${packageId}:CIP0056Token:MintRequest`
            ]
            availableTemplateIds.push(...templateIds)
          }
        }
        
        console.log('Detected template IDs:', availableTemplateIds)
        return availableTemplateIds
      }
    } catch (error) {
      console.log('Template ID detection failed:', error)
    }
    
    return []
  }

  // Improved hash function with better distribution for party assignment
  private hashString(str: string): number {
    // Use FNV-1a hash algorithm for better distribution
    let hash = 2166136261 // FNV offset basis
    
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i)
      hash = (hash * 16777619) >>> 0 // FNV prime, keep as 32-bit unsigned
    }
    
    // Additional mixing to improve distribution
    hash ^= hash >>> 16
    hash *= 0x7feb352d
    hash ^= hash >>> 15
    hash *= 0x846ca68b
    hash ^= hash >>> 16
    
    return hash >>> 0 // Ensure unsigned 32-bit integer
  }

  // Create a new token - OPTIMIZED SINGLE TEMPLATE APPROACH
  async createToken(params: {
    issuer: string
    tokenName: string
    currency: string
    quantityPrecision: number
    pricePrecision: number
    description: string
  }): Promise<{ contractId: string; metadata: TokenMetadata }> {
    try {
      console.log('Creating token with current template:', params)
      
      this.checkAvailability()
      
      const metadata: TokenMetadata = {
        issuer: params.issuer,
        tokenName: params.tokenName,
        currency: params.currency,
        quantityPrecision: params.quantityPrecision,
        pricePrecision: params.pricePrecision,
        totalSupply: '0',
        description: params.description
      }
      
      const createRequest = {
        templateId: TEMPLATE_IDS.TokenMetadata,
        payload: {
          issuer: params.issuer,
          tokenName: params.tokenName,
          currency: params.currency,
          quantityPrecision: params.quantityPrecision.toString(),
          pricePrecision: params.pricePrecision.toString(),
          totalSupply: "0.0",
          description: params.description
        }
      }

      console.log('Creating token with template:', TEMPLATE_IDS.TokenMetadata)
      const result = await this.makeRequest('create', 'POST', createRequest, params.issuer)
      console.log('✅ Token created successfully:', result)
      
      return {
        contractId: result.result.contractId,
        metadata
      }
      
    } catch (error) {
      console.error('Failed to create token:', error)
      throw new Error(`Failed to create token: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Get all tokens - Query both new and legacy templates for backward compatibility
  async getAllTokens(party?: string): Promise<Array<{ contractId: string; metadata: TokenMetadata }>> {
    try {
      console.log('Getting all token metadata (new + legacy templates)')

      this.checkAvailability()

      // Query both new and legacy template IDs for backward compatibility
      const queryRequest = {
        templateIds: [TEMPLATE_IDS.TokenMetadata, LEGACY_TEMPLATE_IDS.TokenMetadata]
      }

      // If no specific party is provided, try to get tokens from all known parties
      if (!party) {
        const allTokens: Array<{ contractId: string; metadata: TokenMetadata }> = []
        const knownParties = [
          'Alice::12201e7594ad0ad603e03946cc159bf41e668168e02b7647dc263229bc55c2f0e9d7',
          'sandbox::12201e7594ad0ad603e03946cc159bf41e668168e02b7647dc263229bc55c2f0e9d7'
        ]
        
        // Query each party's tokens and combine results
        for (const queryParty of knownParties) {
          try {
            const result = await this.makeRequest('query', 'POST', queryRequest, queryParty)
            if (result.result && result.result.length > 0) {
              const partyTokens = result.result.map((contract: any) => ({
                contractId: contract.contractId,
                metadata: {
                  issuer: contract.payload.issuer,
                  tokenName: contract.payload.tokenName,
                  currency: contract.payload.currency,
                  quantityPrecision: parseInt(contract.payload.quantityPrecision),
                  pricePrecision: parseInt(contract.payload.pricePrecision),
                  totalSupply: contract.payload.totalSupply,
                  description: contract.payload.description
                } as TokenMetadata
              }))
              allTokens.push(...partyTokens)
            }
          } catch (error) {
            console.log(`Could not query tokens for party ${queryParty}:`, error)
          }
        }
        
        // Remove duplicates based on contractId
        const uniqueTokens = allTokens.filter((token, index, self) => 
          index === self.findIndex(t => t.contractId === token.contractId)
        )
        
        console.log(`Found ${uniqueTokens.length} unique tokens`)
        return uniqueTokens
      }

      // Query as the specific requesting party
      const result = await this.makeRequest('query', 'POST', queryRequest, party)
      
      console.log(`Found ${result.result?.length || 0} tokens from DAML ledger`)
      
      if (!result.result) {
        return []
      }
      
      return result.result.map((contract: any) => ({
        contractId: contract.contractId,
        metadata: {
          issuer: contract.payload.issuer,
          tokenName: contract.payload.tokenName,
          currency: contract.payload.currency,
          quantityPrecision: parseInt(contract.payload.quantityPrecision),
          pricePrecision: parseInt(contract.payload.pricePrecision),
          totalSupply: contract.payload.totalSupply,
          description: contract.payload.description
        } as TokenMetadata
      }))
      
    } catch (error) {
      console.error('Failed to get tokens:', error)
      throw new Error(`Failed to get tokens: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Check if DAML ledger is available
  async isLedgerAvailable(): Promise<boolean> {
    if (!this.isAvailable) {
      return false
    }
    
    try {
      // Try to make a simple query to test connectivity
      // Use a valid template ID to avoid the "requires at least one item" error
      const response = await fetch(`${this.httpUrl}/v1/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.createJWT('admin')}`
        },
        body: JSON.stringify({
          templateIds: [TEMPLATE_IDS.TokenMetadata]
        })
      })
      
      return response.ok
    } catch (error) {
      console.log('DAML ledger not available:', error)
      return false
    }
  }

  // Check if a party is registered on the Canton Network
  async getPartyRegistration(partyId: string): Promise<PartyRegistration | null> {
    try {
      console.log(`Checking party registration for: ${partyId}`)

      this.checkAvailability()

      // Query PartyRegistration contract for this party
      const queryRequest = {
        templateIds: [TEMPLATE_IDS.PartyRegistration, LEGACY_TEMPLATE_IDS.PartyRegistration],
        query: {
          party: partyId
        }
      }

      // We need a valid party to make the request - use the party we're looking up
      const result = await this.makeRequest('query', 'POST', queryRequest, partyId)

      if (result.result && result.result.length > 0) {
        const registration = result.result[0].payload
        return {
          party: registration.party,
          email: registration.email,
          displayName: registration.displayName,
          registrationTime: registration.registrationTime
        }
      }

      return null
    } catch (error) {
      console.log(`Party registration not found for ${partyId}:`, error)
      return null
    }
  }

  // Get holdings for a party - Query both new and legacy templates for backward compatibility
  async getHoldings(party: string): Promise<Array<{ contractId: string; holding: TokenHolding }>> {
    try {
      console.log(`Getting holdings for party: ${party}`)

      this.checkAvailability()

      // Query both new and legacy template IDs for backward compatibility
      const queryRequest = {
        templateIds: [TEMPLATE_IDS.TokenHolding, LEGACY_TEMPLATE_IDS.TokenHolding],
        query: {
          owner: party
        }
      }

      const result = await this.makeRequest('query', 'POST', queryRequest, party)
      
      console.log(`Found ${result.result?.length || 0} holdings for party: ${party}`)
      
      if (!result.result) {
        return []
      }
      
      const holdings = result.result.map((contract: any) => ({
        contractId: contract.contractId,
        holding: {
          issuer: contract.payload.issuer,
          owner: contract.payload.owner,
          tokenName: contract.payload.tokenName,
          amount: contract.payload.amount
        } as TokenHolding
      }))
      
      // Log holdings for debugging
      holdings.forEach((h: { contractId: string; holding: TokenHolding }) => {
        console.log(`  - ${h.holding.tokenName}: ${h.holding.amount} (Contract: ${h.contractId})`)
      })
      
      return holdings
      
    } catch (error) {
      console.error('Failed to get holdings:', error)
      throw new Error(`Failed to get holdings: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Mint tokens - OPTIMIZED SINGLE TEMPLATE APPROACH
  async mintTokens(params: {
    issuer: string
    recipient: string
    tokenName: string
    amount: string
  }): Promise<{ contractId: string; transactionId: string }> {
    try {
      console.log('Minting tokens via DAML ledger:', params)
      
      this.checkAvailability()

      // Step 1: Create a MintRequest contract
      const mintRequestPayload = {
        templateId: TEMPLATE_IDS.MintRequest,
        payload: {
          issuer: params.issuer,
          recipient: params.recipient,
          tokenName: params.tokenName,
          mintAmount: params.amount
        }
      }

      console.log('Creating MintRequest contract:', mintRequestPayload)
      const mintRequestResult = await this.makeRequest('create', 'POST', mintRequestPayload, params.issuer)
      
      console.log('MintRequest created:', mintRequestResult)
      
      // Step 2: Exercise the ExecuteMint choice
      const exercisePayload = {
        templateId: TEMPLATE_IDS.MintRequest,
        contractId: mintRequestResult.result.contractId,
        choice: 'ExecuteMint',
        argument: {}
      }

      console.log('Exercising ExecuteMint choice:', exercisePayload)
      const mintResult = await this.makeRequest('exercise', 'POST', exercisePayload, params.issuer)
      
      console.log('Mint executed successfully:', mintResult)
      
      return {
        contractId: mintResult.result.exerciseResult,
        transactionId: mintRequestResult.result.contractId
      }
      
    } catch (error) {
      console.error('Failed to mint tokens:', error)
      throw new Error(`Failed to mint tokens: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Transfer tokens - OPTIMIZED SINGLE TEMPLATE APPROACH
  async transferTokens(params: {
    from: string
    to: string
    tokenName: string
    amount: string
  }): Promise<{ transactionId: string; proposalId?: string; requiresAcceptance?: boolean }> {
    try {
      console.log('Transferring tokens via DAML ledger:', params)
      
      this.checkAvailability()

      // Find the sender's token holding
      const holdings = await this.getHoldings(params.from)
      const tokenHolding = holdings.find(h => h.holding.tokenName === params.tokenName)
      
      if (!tokenHolding) {
        throw new Error(`No holdings found for token ${params.tokenName}`)
      }
      
      if (parseFloat(tokenHolding.holding.amount) < parseFloat(params.amount)) {
        throw new Error(`Insufficient balance. Available: ${tokenHolding.holding.amount}, Requested: ${params.amount}`)
      }
      
      console.log('Creating transfer proposal with current template')
      
      const proposePayload = {
        templateId: TEMPLATE_IDS.TokenHolding,
        contractId: tokenHolding.contractId,
        choice: 'ProposeTransfer',
        argument: {
          newOwner: params.to,
          transferAmount: params.amount
        }
      }

      console.log('Creating transfer proposal:', proposePayload)
      const proposalResult = await this.makeRequest('exercise', 'POST', proposePayload, params.from)
      console.log('Transfer proposal created successfully:', proposalResult)
      
      const proposalContractId = proposalResult.result.exerciseResult
      console.log(`Proposal created. Proposal ID: ${proposalContractId}`)
      
      return {
        transactionId: proposalContractId,
        proposalId: proposalContractId,
        requiresAcceptance: true
      }
      
    } catch (error) {
      console.error('Failed to transfer tokens:', error)
      throw new Error(`Failed to transfer tokens: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // All contracts now use the current template - no detection needed
  private async detectTemplateType(contractId: string, party: string): Promise<'new'> {
    console.log(`Using current template for contract: ${contractId}`)
    return 'new'
  }

  // Direct transfer using current template only
  private async transferViaIssuerDirectTransfer(
    params: { from: string; to: string; tokenName: string; amount: string },
    issuer: string,
    tokenHolding: { contractId: string; holding: any }
  ): Promise<{ transactionId: string }> {
    try {
      console.log('Executing issuer-mediated direct transfer')
      
      // Use current template only
      const templateId = TEMPLATE_IDS.TokenHolding
      
      console.log(`Using current template ID: ${templateId} for contract: ${tokenHolding.contractId}`)
      
      const transferPayload = {
        templateId: templateId,
        contractId: tokenHolding.contractId,
        choice: 'IssuerTransfer',
        argument: {
          newOwner: params.to,
          transferAmount: params.amount
        }
      }

      console.log('Exercising IssuerTransfer choice:', transferPayload)
      
      // Use multi-party JWT since issuer needs to authorize the transfer
      const multiPartyJWT = this.createMultiPartyJWT([issuer, params.from])
      
      const transferResponse = await fetch(`${this.httpUrl}/v1/exercise`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${multiPartyJWT}`
        },
        body: JSON.stringify(transferPayload)
      })

      if (!transferResponse.ok) {
        const errorText = await transferResponse.text()
        throw new Error(`Failed to execute issuer transfer: ${errorText}`)
      }

      const transferResult = await transferResponse.json()
      console.log('IssuerTransfer executed successfully:', transferResult)
      
      // The transfer result contains (newHolding, Optional remainingHolding)
      const exerciseResult = transferResult.result?.exerciseResult
      
      if (exerciseResult && Array.isArray(exerciseResult) && exerciseResult.length === 2) {
        const [newHoldingId, remainingHoldingId] = exerciseResult
        console.log('Transfer completed:')
        console.log('- New holding for recipient:', newHoldingId)
        console.log('- Remaining holding for sender:', remainingHoldingId || 'None (full transfer)')
      }
      
      return {
        transactionId: tokenHolding.contractId
      }
      
    } catch (error) {
      console.error('Issuer-mediated direct transfer failed:', error)
      throw error
    }
  }

  // Create a transfer notification for manual handling
  private async createTransferNotification(
    params: { from: string; to: string; tokenName: string; amount: string },
    issuer: string,
    tokenHolding: { contractId: string; holding: any }
  ): Promise<{ transactionId: string }> {
    try {
      console.log('Creating transfer notification for manual processing')
      
      const notificationId = `transfer-notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      console.log(`Transfer notification created: ${notificationId}`)
      console.log(`From: ${params.from}`)
      console.log(`To: ${params.to}`)
      console.log(`Token: ${params.tokenName}`)
      console.log(`Amount: ${params.amount}`)
      
      return {
        transactionId: notificationId
      }
      
    } catch (error) {
      console.error('Failed to create transfer notification:', error)
      throw error
    }
  }

  // Mint tokens with current template only
  private async mintTokensWithTemplate(params: {
    issuer: string
    recipient: string
    tokenName: string
    amount: string
  }): Promise<{ contractId: string; transactionId: string }> {
    try {
      console.log('Minting tokens with current template:', params)
      
      const mintRequestTemplateId = TEMPLATE_IDS.MintRequest
      const mintRequestPayload = {
        templateId: mintRequestTemplateId,
        payload: {
          issuer: params.issuer,
          recipient: params.recipient,
          tokenName: params.tokenName,
          mintAmount: params.amount
        }
      }

      console.log('Creating MintRequest contract:', mintRequestPayload)
      const mintRequestResult = await this.makeRequest('create', 'POST', mintRequestPayload, params.issuer)
      console.log('MintRequest created:', mintRequestResult)
      
      const exercisePayload = {
        templateId: mintRequestTemplateId,
        contractId: mintRequestResult.result.contractId,
        choice: 'ExecuteMint',
        argument: {}
      }

      console.log('Exercising ExecuteMint choice:', exercisePayload)
      const mintResult = await this.makeRequest('exercise', 'POST', exercisePayload, params.issuer)
      
      console.log('Mint executed successfully:', mintResult)
      
      return {
        contractId: mintResult.result.exerciseResult,
        transactionId: mintRequestResult.result.contractId
      }
      
    } catch (error) {
      console.error('Failed to mint tokens:', error)
      throw error
    }
  }

  // Transfer using proposal-acceptance pattern with current template only
  private async transferViaProposalAcceptance(
    params: { from: string; to: string; tokenName: string; amount: string },
    issuer: string,
    tokenHolding: { contractId: string; holding: any }
  ): Promise<{ transactionId: string; proposalId: string; requiresAcceptance: boolean }> {
    try {
      console.log('Executing transfer via proposal-acceptance pattern')
      
      const proposePayload = {
        templateId: TEMPLATE_IDS.TokenHolding,
        contractId: tokenHolding.contractId,
        choice: 'ProposeTransfer',
        argument: {
          newOwner: params.to,
          transferAmount: params.amount
        }
      }

      console.log('Creating transfer proposal:', proposePayload)
      const proposalResult = await this.makeRequest('exercise', 'POST', proposePayload, params.from)
      console.log('Transfer proposal created successfully:', proposalResult)
      
      const proposalContractId = proposalResult.result.exerciseResult
      console.log(`Proposal created. Proposal ID: ${proposalContractId}`)
      
      return {
        transactionId: proposalContractId,
        proposalId: proposalContractId,
        requiresAcceptance: true
      }
      
    } catch (error) {
      console.error('Proposal-acceptance transfer failed:', error)
      throw error
    }
  }

  // Get pending transfer proposals - Query both new and legacy templates
  async getPendingTransferProposals(party: string): Promise<Array<{ contractId: string; proposal: any; isLegacy?: boolean }>> {
    try {
      console.log(`Getting pending transfer proposals for party: ${party}`)

      this.checkAvailability()

      // Query both new and legacy template IDs
      const queryRequest = {
        templateIds: [TEMPLATE_IDS.TransferProposal, LEGACY_TEMPLATE_IDS.TransferProposal],
        query: {
          newOwner: party
        }
      }

      const result = await this.makeRequest('query', 'POST', queryRequest, party)

      if (result.result && result.result.length > 0) {
        const proposals = result.result.map((contract: any) => {
          // Detect if this is a legacy proposal (has holdingId instead of senderRemainingAmount)
          const isLegacy = contract.payload.holdingId !== undefined

          return {
            contractId: contract.contractId,
            proposal: {
              issuer: contract.payload.issuer,
              currentOwner: contract.payload.currentOwner,
              newOwner: contract.payload.newOwner,
              tokenName: contract.payload.tokenName,
              transferAmount: contract.payload.transferAmount,
              senderRemainingAmount: contract.payload.senderRemainingAmount,
              holdingId: contract.payload.holdingId // Legacy field
            },
            isLegacy
          }
        })

        console.log(`Found ${proposals.length} transfer proposals for party: ${party}`)
        const legacyCount = proposals.filter((p: { isLegacy?: boolean }) => p.isLegacy).length
        if (legacyCount > 0) {
          console.log(`  - ${legacyCount} legacy proposals (may be stale)`)
        }
        return proposals
      }

      console.log(`No transfer proposals found for party: ${party}`)
      return []

    } catch (error) {
      console.error('Failed to get transfer proposals:', error)
      return []
    }
  }

  // Accept a transfer proposal - Handles both new and legacy templates
  // New proposals have locked tokens; legacy proposals may have stale holdingId
  async acceptTransferProposal(params: {
    recipientPartyId: string
    proposalId: string
  }): Promise<{ transactionId: string, method?: string, message?: string }> {
    try {
      console.log('Accepting transfer proposal via DAML ledger:', params)

      this.checkAvailability()

      // First, try with new template ID
      try {
        const acceptPayload = {
          templateId: TEMPLATE_IDS.TransferProposal,
          contractId: params.proposalId,
          choice: 'AcceptTransfer',
          argument: {}
        }

        console.log('Trying to accept with new template:', acceptPayload)
        const acceptResult = await this.makeRequest('exercise', 'POST', acceptPayload, params.recipientPartyId)
        console.log('Transfer accepted successfully with new template:', acceptResult)

        return {
          transactionId: params.proposalId,
          method: 'proposal_acceptance',
          message: 'Transfer proposal accepted successfully'
        }
      } catch (newTemplateError) {
        const newErrorMsg = newTemplateError instanceof Error ? newTemplateError.message : 'Unknown error'
        console.log('New template failed, trying legacy template:', newErrorMsg)

        // If new template fails with contract type mismatch, try legacy template
        if (newErrorMsg.includes('NOT_FOUND') || newErrorMsg.includes('INVALID_ARGUMENT') || newErrorMsg.includes('WRONGLY_TYPED_CONTRACT')) {
          try {
            const legacyPayload = {
              templateId: LEGACY_TEMPLATE_IDS.TransferProposal,
              contractId: params.proposalId,
              choice: 'AcceptTransfer',
              argument: {}
            }

            console.log('Trying to accept with legacy template:', legacyPayload)
            const legacyResult = await this.makeRequest('exercise', 'POST', legacyPayload, params.recipientPartyId)
            console.log('Transfer accepted successfully with legacy template:', legacyResult)

            return {
              transactionId: params.proposalId,
              method: 'legacy_proposal_acceptance',
              message: 'Transfer proposal accepted successfully (legacy contract)'
            }
          } catch (legacyError) {
            const legacyErrorMsg = legacyError instanceof Error ? legacyError.message : 'Unknown error'
            console.error('Legacy template also failed:', legacyErrorMsg)

            // If legacy also fails with CONTRACT_NOT_FOUND, it's a stale proposal
            if (legacyErrorMsg.includes('CONTRACT_NOT_FOUND')) {
              return {
                transactionId: params.proposalId,
                method: 'stale_proposal_cleanup',
                message: 'This is a stale transfer proposal. The referenced tokens no longer exist. Please ask the sender to create a new transfer proposal.'
              }
            }
            throw legacyError
          }
        }
        throw newTemplateError
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('Failed to accept transfer proposal:', errorMessage)

      // Handle stale proposal (CONTRACT_NOT_FOUND)
      if (errorMessage.includes('CONTRACT_NOT_FOUND')) {
        console.log('Detected stale proposal - referenced contract no longer exists')
        return {
          transactionId: params.proposalId,
          method: 'stale_proposal_cleanup',
          message: 'This is a stale transfer proposal. The referenced tokens no longer exist. Please ask the sender to create a new transfer proposal.'
        }
      }

      throw new Error(`Failed to accept transfer proposal: ${errorMessage}`)
    }
  }

  // Helper method for direct transfer using current template only
  private async executeDirectTransfer(params: {
    fromPartyId: string,
    toPartyId: string,
    tokenName: string,
    amount: string,
    issuerPartyId: string
  }) {
    console.log('Executing direct transfer:', params)
    
    // Find the sender's token holding
    const fromHoldings = await this.getHoldings(params.fromPartyId)
    const senderHolding = fromHoldings.find(h => 
      h.holding.tokenName === params.tokenName && 
      parseFloat(h.holding.amount) >= parseFloat(params.amount)
    )
    
    if (!senderHolding) {
      throw new Error(`Sender does not have sufficient ${params.tokenName} tokens`)
    }
    
    // Use current template only
    const templateId = TEMPLATE_IDS.TokenHolding
    
    console.log(`Using current template ID: ${templateId} for direct transfer`)
    
    const transferAmount = parseFloat(params.amount)
    
    const transferPayload = {
      templateId: templateId,
      contractId: senderHolding.contractId,
      choice: 'IssuerTransfer',
      argument: {
        newOwner: params.toPartyId,
        transferAmount: transferAmount.toString()
      }
    }
    
    console.log('Executing issuer transfer:', transferPayload)
    const result = await this.makeRequest('exercise', 'POST', transferPayload, params.issuerPartyId)
    
    return {
      transactionId: `direct-transfer-${Date.now()}`,
      result
    }
  }

  // Reject a transfer proposal - Handles both new and legacy templates
  // New RejectTransfer returns tokens back to sender; legacy just archives
  async rejectTransferProposal(params: {
    recipientPartyId: string
    proposalId: string
  }): Promise<{ transactionId: string; returnedHoldingId?: string; isLegacy?: boolean }> {
    try {
      console.log('Rejecting transfer proposal via DAML ledger:', params)

      this.checkAvailability()

      // First, try with new template ID
      try {
        const rejectPayload = {
          templateId: TEMPLATE_IDS.TransferProposal,
          contractId: params.proposalId,
          choice: 'RejectTransfer',
          argument: {}
        }

        console.log('Trying to reject with new template:', rejectPayload)
        const rejectResult = await this.makeRequest('exercise', 'POST', rejectPayload, params.recipientPartyId)
        console.log('Transfer rejected successfully, tokens returned to sender:', rejectResult)

        return {
          transactionId: params.proposalId,
          returnedHoldingId: rejectResult.result?.exerciseResult,
          isLegacy: false
        }
      } catch (newTemplateError) {
        const newErrorMsg = newTemplateError instanceof Error ? newTemplateError.message : 'Unknown error'
        console.log('New template failed, trying legacy template:', newErrorMsg)

        // If new template fails with contract type mismatch, try legacy template
        if (newErrorMsg.includes('NOT_FOUND') || newErrorMsg.includes('INVALID_ARGUMENT') || newErrorMsg.includes('WRONGLY_TYPED_CONTRACT')) {
          const legacyPayload = {
            templateId: LEGACY_TEMPLATE_IDS.TransferProposal,
            contractId: params.proposalId,
            choice: 'RejectTransfer',
            argument: {}
          }

          console.log('Trying to reject with legacy template:', legacyPayload)
          const legacyResult = await this.makeRequest('exercise', 'POST', legacyPayload, params.recipientPartyId)
          console.log('Transfer rejected successfully with legacy template (no tokens returned):', legacyResult)

          return {
            transactionId: params.proposalId,
            returnedHoldingId: undefined, // Legacy RejectTransfer doesn't return tokens
            isLegacy: true
          }
        }
        throw newTemplateError
      }

    } catch (error) {
      console.error('Failed to reject transfer proposal:', error)
      throw new Error(`Failed to reject transfer proposal: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Transfer method for legacy contracts using issuer mediation
  private async transferViaIssuerMediation(
    params: { from: string; to: string; tokenName: string; amount: string },
    issuer: string,
    tokenHolding: { contractId: string; holding: any }
  ): Promise<{ transactionId: string }> {
    try {
      console.log('Executing issuer-mediated transfer using ProposeTransfer choice')
      
      // Use NEW template ID since all current contracts are cb35be90
      const templateId = TEMPLATE_IDS.TokenHolding
      
      console.log(`Using template ID: ${templateId} for contract: ${tokenHolding.contractId}`)
      
      // Step 1: Sender creates a transfer proposal using ProposeTransfer choice
      const proposePayload = {
        templateId: templateId,
        contractId: tokenHolding.contractId,
        choice: 'ProposeTransfer',
        argument: {
          newOwner: params.to,
          transferAmount: params.amount
        }
      }

      console.log('Step 1: Creating transfer proposal:', proposePayload)
      const proposalResult = await this.makeRequest('exercise', 'POST', proposePayload, params.from)
      console.log('Transfer proposal created:', proposalResult)
      
      const proposalContractId = proposalResult.result.exerciseResult
      
      // Step 2: Recipient accepts the transfer
      const acceptPayload = {
        templateId: TEMPLATE_IDS.TransferProposal,
        contractId: proposalContractId,
        choice: 'AcceptTransfer',
        argument: {}
      }

      console.log('Step 2: Accepting transfer proposal:', acceptPayload)
      const acceptResult = await this.makeRequest('exercise', 'POST', acceptPayload, params.to)
      console.log('Transfer accepted successfully:', acceptResult)
      
      return {
        transactionId: proposalContractId
      }
      
    } catch (error) {
      console.error('Issuer-mediated transfer failed:', error)
      throw error
    }
  }

  // Burn tokens - OPTIMIZED SINGLE TEMPLATE APPROACH
  async burnTokens(params: {
    owner: string
    tokenName: string
    amount: string
  }): Promise<{ transactionId: string }> {
    try {
      console.log('Burning tokens via DAML ledger:', params)
      
      this.checkAvailability()

      // Find the user's token holding
      const holdings = await this.getHoldings(params.owner)
      console.log(`Found ${holdings.length} holdings for owner ${params.owner}`)
      
      // Log all holdings for debugging
      holdings.forEach(h => {
        console.log(`  - Holding: ${h.holding.tokenName} = ${h.holding.amount} (Contract: ${h.contractId})`)
      })
      
      const tokenHolding = holdings.find(h => h.holding.tokenName === params.tokenName)
      
      if (!tokenHolding) {
        throw new Error(`No holdings found for token ${params.tokenName}. Available tokens: ${holdings.map(h => h.holding.tokenName).join(', ')}`)
      }
      
      const availableAmount = parseFloat(tokenHolding.holding.amount)
      const burnAmount = parseFloat(params.amount)
      
      console.log(`Burn validation: Available=${availableAmount}, Requested=${burnAmount}`)
      
      if (availableAmount < burnAmount) {
        throw new Error(`Insufficient balance. Available: ${availableAmount}, Requested: ${burnAmount}`)
      }
      
      // Use regular Burn choice with current template
      const burnPayload = {
        templateId: TEMPLATE_IDS.TokenHolding,
        contractId: tokenHolding.contractId,
        choice: 'Burn',
        argument: {
          burnAmount: params.amount
        }
      }

      console.log('Exercising Burn choice:', burnPayload)
      const burnResult = await this.makeRequest('exercise', 'POST', burnPayload, params.owner)
      
      console.log('Burn executed successfully:', burnResult)
      
      return {
        transactionId: tokenHolding.contractId
      }
      
    } catch (error) {
      console.error('Failed to burn tokens:', error)
      throw new Error(`Failed to burn tokens: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getPartyInfo(party: string): Promise<PartyRegistration | null> {
    console.log(`Getting party info for: ${party} - simplified implementation for demo`)
    return null
  }

  // Close connection (no-op for HTTP API)
  async close(): Promise<void> {
    console.log('DAML HTTP client closed')
  }
}

// Export singleton instance
export const damlClient = new DamlLedgerClient()
export default DamlLedgerClient