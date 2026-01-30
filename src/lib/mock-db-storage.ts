// File-based storage for mock database persistence during development
import fs from 'fs'
import path from 'path'

const STORAGE_DIR = path.join(process.cwd(), '.mock-db')
const USERS_FILE = path.join(STORAGE_DIR, 'users.json')
const TOKENS_FILE = path.join(STORAGE_DIR, 'tokens.json')
const HOLDINGS_FILE = path.join(STORAGE_DIR, 'holdings.json')
const TRANSACTIONS_FILE = path.join(STORAGE_DIR, 'transactions.json')

// Ensure storage directory exists
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true })
}

export function loadData<T>(filename: string, defaultValue: T[]): T[] {
  try {
    if (fs.existsSync(filename)) {
      const data = fs.readFileSync(filename, 'utf8')
      return JSON.parse(data, (key, value) => {
        // Convert date strings back to Date objects
        if (key === 'createdAt' || key === 'updatedAt') {
          return new Date(value)
        }
        return value
      })
    }
  } catch (error) {
    console.error(`Error loading ${filename}:`, error)
  }
  return defaultValue
}

export function saveData<T>(filename: string, data: T[]): void {
  try {
    fs.writeFileSync(filename, JSON.stringify(data, null, 2))
  } catch (error) {
    console.error(`Error saving ${filename}:`, error)
  }
}

export const storage = {
  users: {
    load: () => loadData(USERS_FILE, []),
    save: (data: any[]) => saveData(USERS_FILE, data)
  },
  tokens: {
    load: () => loadData(TOKENS_FILE, []),
    save: (data: any[]) => saveData(TOKENS_FILE, data)
  },
  holdings: {
    load: () => loadData(HOLDINGS_FILE, []),
    save: (data: any[]) => saveData(HOLDINGS_FILE, data)
  },
  transactions: {
    load: () => loadData(TRANSACTIONS_FILE, []),
    save: (data: any[]) => saveData(TRANSACTIONS_FILE, data)
  }
}