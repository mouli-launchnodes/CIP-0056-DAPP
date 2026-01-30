// Mock database for demo purposes
// This replaces Prisma for the MVP demo

import { storage } from './mock-db-storage'

interface User {
  id: string
  email: string
  partyId: string
  auth0UserId?: string
  name?: string
  profilePicture?: string
  createdAt: Date
  updatedAt: Date
}

interface Token {
  id: string
  name: string
  currency: string
  quantityPrecision: number
  pricePrecision: number
  contractAddress: string
  contractOwner: string
  totalSupply: number
  createdAt: Date
  updatedAt: Date
  creatorId: string
}

interface Holding {
  id: string
  totalBalance: number
  freeCollateral: number
  lockedCollateral: number
  createdAt: Date
  updatedAt: Date
  userId: string
  tokenId: string
}

interface Transaction {
  id: string
  type: 'MINT' | 'TRANSFER' | 'BURN'
  amount: number
  fromPartyId?: string
  toPartyId?: string
  transactionHash?: string
  status: 'PENDING' | 'CONFIRMED' | 'FAILED'
  createdAt: Date
  updatedAt: Date
  userId: string
  tokenId: string
}

// Load data from files
let users: User[] = storage.users.load()
let tokens: Token[] = storage.tokens.load()
let holdings: Holding[] = storage.holdings.load()
let transactions: Transaction[] = storage.transactions.load()

// Helper function to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9)

// Initialize system user if needed
const initializeSystemUser = () => {
  console.log('Initializing mock database...')
  console.log('Loaded from storage:')
  console.log('- Users:', users.length)
  console.log('- Tokens:', tokens.length)
  console.log('- Holdings:', holdings.length)
  console.log('- Transactions:', transactions.length)
  
  // Create system user if it doesn't exist
  const existingSystemUser = users.find(u => u.email === 'system@canton-demo.com')
  
  if (!existingSystemUser) {
    const systemUser: User = {
      id: generateId(),
      email: 'system@canton-demo.com',
      partyId: 'system-owner-party-id',
      createdAt: new Date(),
      updatedAt: new Date()
    }
    users.push(systemUser)
    storage.users.save(users)
    console.log('System user created:', systemUser)
  } else {
    console.log('System user already exists:', existingSystemUser)
  }
  
  console.log('Mock database initialized')
}

// Initialize on module load
initializeSystemUser()

export const mockDb = {
  user: {
    findUnique: async ({ where }: { where: { email?: string; partyId?: string; id?: string; auth0UserId?: string } }) => {
      return users.find(u => 
        (where.email && u.email === where.email) ||
        (where.partyId && u.partyId === where.partyId) ||
        (where.id && u.id === where.id) ||
        (where.auth0UserId && u.auth0UserId === where.auth0UserId)
      ) || null
    },

    findFirst: async ({ where }: { where: { OR?: Array<{ email?: string; auth0UserId?: string }> } }) => {
      if (where.OR) {
        return users.find(u => 
          where.OR!.some(condition => 
            (condition.email && u.email === condition.email) ||
            (condition.auth0UserId && u.auth0UserId === condition.auth0UserId)
          )
        ) || null
      }
      return null
    },
    
    create: async ({ data }: { data: Omit<User, 'id'> }) => {
      const user: User = {
        id: generateId(),
        ...data
      }
      users.push(user)
      storage.users.save(users)
      console.log('User created:', user)
      return user
    }
  },

  token: {
    findMany: async ({ select, orderBy }: any = {}) => {
      console.log('findMany called with:', { select, orderBy })
      console.log('Available tokens:', tokens.length)
      
      const result = tokens.map(token => ({
        id: token.id,
        name: token.name,
        currency: token.currency,
        contractAddress: token.contractAddress,
        totalSupply: token.totalSupply.toString(),
        createdAt: token.createdAt
      }))
      
      console.log('Returning tokens:', result)
      return result
    },

    findUnique: async ({ where }: { where: { id: string } }) => {
      console.log('Looking for token with ID:', where.id)
      console.log('Available tokens:', tokens.map(t => ({ id: t.id, name: t.name })))
      
      const token = tokens.find(t => t.id === where.id)
      console.log('Found token:', token)
      
      return token || null
    },

    create: async ({ data }: { data: any }) => {
      console.log('Creating token with data:', data)
      
      const token: Token = {
        id: generateId(),
        name: data.name,
        currency: data.currency,
        quantityPrecision: data.quantityPrecision,
        pricePrecision: data.pricePrecision,
        contractAddress: data.contractAddress,
        contractOwner: data.contractOwner,
        totalSupply: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        creatorId: data.creatorId || 'system'
      }
      
      tokens.push(token)
      storage.tokens.save(tokens)
      console.log('Token created and stored:', token)
      console.log('Total tokens in database:', tokens.length)
      
      return token
    },

    update: async ({ where, data }: { where: { id: string }, data: any }) => {
      const tokenIndex = tokens.findIndex(t => t.id === where.id)
      if (tokenIndex >= 0) {
        if (data.totalSupply?.increment) {
          tokens[tokenIndex].totalSupply += data.totalSupply.increment
        }
        if (data.totalSupply?.decrement) {
          tokens[tokenIndex].totalSupply -= data.totalSupply.decrement
        }
        tokens[tokenIndex].updatedAt = new Date()
        storage.tokens.save(tokens)
        return tokens[tokenIndex]
      }
      return null
    }
  },

  holding: {
    findUnique: async ({ where, include }: any) => {
      const holding = holdings.find(h => 
        where.userId_tokenId && 
        h.userId === where.userId_tokenId.userId && 
        h.tokenId === where.userId_tokenId.tokenId
      )
      
      if (!holding) return null

      if (include?.token) {
        const token = tokens.find(t => t.id === holding.tokenId)
        return {
          ...holding,
          token: token ? {
            id: token.id,
            name: token.name,
            currency: token.currency,
            contractAddress: token.contractAddress,
            transactions: transactions
              .filter(tx => tx.tokenId === token.id)
              .slice(0, 10)
              .map(tx => ({
                ...tx,
                amount: tx.amount.toString()
              }))
          } : null
        }
      }

      return holding
    },

    findMany: async ({ where, include, orderBy }: any = {}) => {
      let filteredHoldings = holdings

      if (where?.userId) {
        filteredHoldings = holdings.filter(h => h.userId === where.userId)
      }

      return filteredHoldings.map(holding => {
        const user = users.find(u => u.id === holding.userId)
        const token = tokens.find(t => t.id === holding.tokenId)
        
        return {
          ...holding,
          user: user ? { partyId: user.partyId, email: user.email } : null,
          token: token ? {
            name: token.name,
            currency: token.currency,
            contractAddress: token.contractAddress,
            transactions: transactions
              .filter(tx => tx.tokenId === token.id && tx.userId === holding.userId)
              .slice(0, 10)
          } : null
        }
      })
    },

    create: async ({ data }: { data: Omit<Holding, 'id' | 'createdAt' | 'updatedAt'> }) => {
      const holding: Holding = {
        id: generateId(),
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      holdings.push(holding)
      storage.holdings.save(holdings)
      return holding
    },

    update: async ({ where, data }: { where: { id: string }, data: any }) => {
      const holdingIndex = holdings.findIndex(h => h.id === where.id)
      if (holdingIndex >= 0) {
        if (data.totalBalance?.increment) {
          holdings[holdingIndex].totalBalance += data.totalBalance.increment
        }
        if (data.totalBalance?.decrement) {
          holdings[holdingIndex].totalBalance -= data.totalBalance.decrement
        }
        if (data.freeCollateral?.increment) {
          holdings[holdingIndex].freeCollateral += data.freeCollateral.increment
        }
        if (data.freeCollateral?.decrement) {
          holdings[holdingIndex].freeCollateral -= data.freeCollateral.decrement
        }
        holdings[holdingIndex].updatedAt = new Date()
        storage.holdings.save(holdings)
        return holdings[holdingIndex]
      }
      return null
    }
  },

  transaction: {
    create: async ({ data }: { data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> }) => {
      const transaction: Transaction = {
        id: generateId(),
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      transactions.push(transaction)
      storage.transactions.save(transactions)
      return transaction
    }
  }
}