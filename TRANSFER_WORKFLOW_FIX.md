# Transfer Workflow Fix

## Issue
User is getting "insufficient balance" error when trying to transfer tokens, even though the token shows `totalSupply: '1000.0'`.

## Root Cause
**Creating a token ≠ Having holdings to transfer**

In DAML tokenization:
1. **Create Token** → Creates token metadata/contract (✅ Done)
2. **Mint Tokens** → Creates actual holdings that can be transferred (❌ Missing)
3. **Transfer Tokens** → Moves holdings between parties

## Current State
- Token `test-3` exists with metadata showing `totalSupply: '1000.0'`
- But no actual holdings exist for any party
- Transfer fails because sender has `0 holdings`

## Solution Steps

### Step 1: Mint Tokens First
Before transferring, you need to mint tokens to create holdings:

1. Go to `/mint` page
2. Select your `test-3` token
3. Enter recipient Party ID (can be yourself initially)
4. Enter amount (e.g., `1000`)
5. Click "Mint Tokens"

This will create actual holdings that can be transferred.

### Step 2: Then Transfer
After minting, you can transfer the holdings:

1. Go to `/transfer` page
2. Select the token
3. Enter sender/recipient details
4. Transfer will work because holdings now exist

## Technical Details

### Token Creation vs Minting
```
Create Token:
- Creates TokenMetadata contract
- Sets totalSupply metadata
- No actual holdings created

Mint Tokens:
- Creates TokenHolding contracts
- Actual transferable assets
- Required for transfers
```

### Holdings Check Logic
The transfer API correctly checks:
```typescript
const senderHoldings = await damlClient.getHoldings(validatedData.senderPartyId)
const senderTokenHolding = senderHoldings.find(h => h.holding.tokenName === token.metadata.tokenName)

if (!senderTokenHolding || parseFloat(senderTokenHolding.holding.amount) < parseFloat(validatedData.amount)) {
  return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })
}
```

This is working correctly - the sender truly has no holdings to transfer.

## UI Improvement Suggestions

### 1. Better Error Messages
Current: "Insufficient balance"
Better: "No holdings found. You need to mint tokens before transferring them."

### 2. Workflow Guidance
Add a notice on transfer page:
"💡 Don't see your tokens? You may need to mint them first after creating the token contract."

### 3. Holdings Display
Show actual holdings vs token metadata separately:
- Token Contracts: Shows created tokens
- Token Holdings: Shows mintable/transferable amounts

## Quick Fix for User

**Immediate solution:**
1. Visit `/mint` page
2. Select `test-3` token  
3. Mint tokens to yourself or intended recipient
4. Then proceed with transfer

The workflow is: **Create → Mint → Transfer**