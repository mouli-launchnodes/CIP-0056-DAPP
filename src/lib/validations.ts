import { z } from 'zod'

// Onboarding validation
export const onboardingSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

// Token creation validation
export const tokenCreationSchema = z.object({
  tokenName: z.string().min(1, 'Token name is required').max(50, 'Token name must be less than 50 characters'),
  currency: z.enum(['USD', 'EUR', 'GBP'], {
    message: 'Please select a currency',
  }),
  quantityPrecision: z.number().min(0).max(18, 'Quantity precision must be between 0 and 18'),
  pricePrecision: z.number().min(0).max(18, 'Price precision must be between 0 and 18'),
})

// Mint tokens validation
export const mintTokensSchema = z.object({
  recipientPartyId: z.string().min(1, 'Recipient Party ID is required'),
  tokenId: z.string().min(1, 'Please select a token'),
  amount: z.string().refine((val) => {
    const num = parseFloat(val)
    return !isNaN(num) && num > 0
  }, 'Amount must be a positive number'),
})

// Transfer tokens validation
export const transferTokensSchema = z.object({
  senderPartyId: z.string().min(1, 'Sender Party ID is required'),
  recipientPartyId: z.string().min(1, 'Recipient Party ID is required'),
  tokenId: z.string().min(1, 'Please select a token'),
  amount: z.string().refine((val) => {
    const num = parseFloat(val)
    return !isNaN(num) && num > 0
  }, 'Amount must be a positive number'),
})

// Burn tokens validation
export const burnTokensSchema = z.object({
  partyId: z.string().min(1, 'Party ID is required'),
  tokenId: z.string().min(1, 'Please select a token'),
  amount: z.string().refine((val) => {
    const num = parseFloat(val)
    return !isNaN(num) && num > 0
  }, 'Amount must be a positive number'),
})

export type OnboardingFormData = z.infer<typeof onboardingSchema>
export type TokenCreationFormData = z.infer<typeof tokenCreationSchema>
export type MintTokensFormData = z.infer<typeof mintTokensSchema>
export type TransferTokensFormData = z.infer<typeof transferTokensSchema>
export type BurnTokensFormData = z.infer<typeof burnTokensSchema>