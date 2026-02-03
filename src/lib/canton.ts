// Canton Network SDK Integration with Real DAML Ledger
// This implementation connects to a real DAML ledger running locally

import { damlClient } from './daml-client'

export interface CantonConfig {
  ledgerUrl: string;
  adminToken: string;
  participantId: string;
}

export interface PartyInfo {
  partyId: string;
  displayName: string;
}

export interface TokenContract {
  contractId: string;
  contractAddress: string;
  owner: string;
  tokenName: string;
  currency: string;
  totalSupply: string;
}

export interface TransactionResult {
  transactionHash: string;
  status: 'pending' | 'confirmed' | 'failed';
  blockNumber?: number;
}

class CantonSDK {
  private config: CantonConfig;

  constructor(config: CantonConfig) {
    this.config = config;
  }

  // Generate a new Party ID for user onboarding (real DAML integration)
  async generatePartyId(email: string): Promise<PartyInfo> {
    try {
      console.log(`Generating Party ID for email: ${email}`)
      
      // Register party with DAML ledger
      const { party, partyId } = await damlClient.registerParty(
        email,
        email.split('@')[0] // Use email prefix as display name
      )
      
      console.log(`Generated Party ID: ${partyId}`)
      
      return {
        partyId,
        displayName: email.split('@')[0]
      };
    } catch (error) {
      console.error('Failed to generate Party ID:', error)
      throw new Error(`Failed to generate Party ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Deploy a new CIP0056 token contract (real DAML integration)
  async deployTokenContract(params: {
    tokenName: string;
    currency: string;
    quantityPrecision: number;
    pricePrecision: number;
    owner: string;
    description?: string;
  }): Promise<TokenContract> {
    try {
      console.log('Deploying token contract with params:', params)
      
      // Create token on DAML ledger
      const result = await damlClient.createToken({
        issuer: params.owner,
        tokenName: params.tokenName,
        currency: params.currency,
        quantityPrecision: params.quantityPrecision,
        pricePrecision: params.pricePrecision,
        description: params.description || `${params.tokenName} token`
      })
      
      const contract: TokenContract = {
        contractId: result.contractId,
        contractAddress: result.contractId, // In DAML, contract ID serves as address
        owner: params.owner,
        tokenName: params.tokenName,
        currency: params.currency,
        totalSupply: result.metadata.totalSupply
      }
      
      console.log('Token contract deployed:', contract)
      
      return contract;
    } catch (error) {
      console.error('Failed to deploy token contract:', error)
      throw new Error(`Failed to deploy token contract: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Mint tokens to a recipient (real DAML integration)
  async mintTokens(params: {
    contractId: string;
    issuer: string;
    recipientPartyId: string;
    tokenName: string;
    amount: string;
  }): Promise<TransactionResult> {
    try {
      console.log('Minting tokens with params:', params)
      
      // Mint tokens on DAML ledger
      const result = await damlClient.mintTokens({
        issuer: params.issuer,
        recipient: params.recipientPartyId,
        tokenName: params.tokenName,
        amount: params.amount
      })
      
      const transactionResult: TransactionResult = {
        transactionHash: result.transactionId,
        status: 'confirmed',
        blockNumber: Math.floor(Date.now() / 1000) // Use timestamp as block number for demo
      }
      
      console.log('Tokens minted successfully:', transactionResult)
      
      return transactionResult;
    } catch (error) {
      console.error('Failed to mint tokens:', error)
      throw new Error(`Failed to mint tokens: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Transfer tokens between parties (real DAML integration)
  async transferTokens(params: {
    contractId: string;
    fromPartyId: string;
    toPartyId: string;
    tokenName: string;
    amount: string;
  }): Promise<TransactionResult> {
    try {
      console.log('Transferring tokens with params:', params)
      
      // Transfer tokens on DAML ledger
      const result = await damlClient.transferTokens({
        from: params.fromPartyId,
        to: params.toPartyId,
        tokenName: params.tokenName,
        amount: params.amount
      })
      
      const transactionResult: TransactionResult = {
        transactionHash: result.transactionId,
        status: 'confirmed',
        blockNumber: Math.floor(Date.now() / 1000)
      }
      
      console.log('Tokens transferred successfully:', transactionResult)
      
      return transactionResult;
    } catch (error) {
      console.error('Failed to transfer tokens:', error)
      throw new Error(`Failed to transfer tokens: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Burn tokens (real DAML integration)
  async burnTokens(params: {
    contractId: string;
    partyId: string;
    tokenName: string;
    amount: string;
  }): Promise<TransactionResult> {
    try {
      console.log('Burning tokens with params:', params)
      
      // Burn tokens on DAML ledger
      const result = await damlClient.burnTokens({
        owner: params.partyId,
        tokenName: params.tokenName,
        amount: params.amount
      })
      
      const transactionResult: TransactionResult = {
        transactionHash: result.transactionId,
        status: 'confirmed',
        blockNumber: Math.floor(Date.now() / 1000)
      }
      
      console.log('Tokens burned successfully:', transactionResult)
      
      return transactionResult;
    } catch (error) {
      console.error('Failed to burn tokens:', error)
      throw new Error(`Failed to burn tokens: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get token holdings for a party (real DAML integration)
  async getHoldings(partyId: string): Promise<any[]> {
    try {
      console.log(`Getting holdings for party: ${partyId}`)
      
      // Get holdings from DAML ledger
      const holdings = await damlClient.getHoldings(partyId)
      
      // Transform DAML holdings to API format
      const formattedHoldings = holdings.map(h => ({
        id: h.contractId,
        partyId: h.holding.owner,
        tokenName: h.holding.tokenName,
        currency: h.holding.tokenName, // Use token name as currency for now
        totalBalance: h.holding.amount,
        freeCollateral: h.holding.amount, // All balance is free for now
        lockedCollateral: '0',
        contractAddress: h.contractId,
        recentTransactions: [] // Would need separate transaction tracking
      }))
      
      console.log(`Holdings retrieved successfully: ${formattedHoldings.length} holdings`)
      
      return formattedHoldings;
    } catch (error) {
      console.error('Failed to get holdings:', error)
      throw new Error(`Failed to get holdings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get all available tokens (real DAML integration)
  async getAllTokens(): Promise<any[]> {
    try {
      console.log('Getting all available tokens')
      
      // Get all tokens from DAML ledger
      const tokens = await damlClient.getAllTokens()
      
      // Transform DAML tokens to API format
      const formattedTokens = tokens.map(t => ({
        id: t.contractId,
        name: t.metadata.tokenName,
        currency: t.metadata.currency,
        issuer: t.metadata.issuer,
        totalSupply: t.metadata.totalSupply,
        quantityPrecision: t.metadata.quantityPrecision,
        pricePrecision: t.metadata.pricePrecision,
        description: t.metadata.description,
        contractAddress: t.contractId
      }))
      
      console.log(`Tokens retrieved successfully: ${formattedTokens.length} tokens`)
      
      return formattedTokens;
    } catch (error) {
      console.error('Failed to get tokens:', error)
      throw new Error(`Failed to get tokens: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get party information (real DAML integration)
  async getPartyInfo(partyId: string): Promise<PartyInfo | null> {
    try {
      console.log(`Getting party info for: ${partyId}`)
      
      const partyInfo = await damlClient.getPartyInfo(partyId)
      
      if (!partyInfo) {
        return null
      }
      
      return {
        partyId: partyInfo.party,
        displayName: partyInfo.displayName
      }
    } catch (error) {
      console.error('Failed to get party info:', error)
      return null
    }
  }

  // Check if DAML ledger is connected
  async isConnected(): Promise<boolean> {
    try {
      // Try to connect and query - if successful, we're connected
      return await damlClient.isLedgerAvailable()
    } catch (error) {
      console.log('DAML ledger not connected:', error)
      return false
    }
  }

  // Close DAML connection
  async close(): Promise<void> {
    await damlClient.close()
  }
}

// Initialize Canton SDK with environment variables for local DAML development
export const cantonSDK = new CantonSDK({
  ledgerUrl: process.env.DAML_LEDGER_URL || 'http://localhost:7575',
  adminToken: process.env.DAML_ADMIN_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJkYW1sLWxlZGdlci1hcGkiLCJzdWIiOiJhZG1pbiIsImV4cCI6MTk5OTk5OTk5OX0.1HKhGlFuBP8yUFNJkbWaZvhl3ycyYaspAx8dGM5HMEI',
  participantId: process.env.DAML_PARTICIPANT_ID || 'sandbox-participant'
});

export default CantonSDK;