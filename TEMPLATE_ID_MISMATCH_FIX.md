# Template ID Mismatch Fix

## Issue Identified
```
DAML API error (400): Cannot resolve template ID, given: ContractTypeId(Some(cb35be9090c18b08e25f727a8b6c06623386042b84ecb3e07f7638610d1ace5d),CIP0056Token,TokenHolding)
```

## Root Cause
The system was trying to use an old template ID (`cb35be90...`) that no longer exists in the current DAML ledger. This happens when:

1. DAML contracts were created with an older version
2. The ledger was restarted with new template IDs
3. The template detection logic incorrectly identified contracts as using old templates

## Fix Applied

### 1. Updated Template Detection Logic
- Removed problematic "previous" template ID (`cb35be90...`) from detection
- Now only tries "new" (`a636b483...`) and "legacy" (`ac3a226c...`) templates
- Defaults to "new" template for all current contracts

### 2. Updated Transfer Logic
- Skips the problematic "previous" template entirely
- Uses only "new" and "legacy" template configurations
- More robust error handling for template mismatches

### 3. Updated Query Methods
- `getAllTokens()` - Only queries new and legacy templates
- `getHoldings()` - Only queries new and legacy templates
- Faster queries with fewer template ID attempts

## Expected Result

✅ **Before:** Transfer fails with template ID resolution error  
✅ **After:** Transfer uses correct template ID and succeeds

## How to Test

1. **Refresh the transfer page** to get the updated code
2. **Try the transfer again** with the correct Party ID
3. **Should now work** without template ID errors

## Technical Details

The fix removes the problematic template ID from all queries:
```typescript
// OLD (causing errors)
const templateIds = [TEMPLATE_IDS.TokenHolding, PREVIOUS_TEMPLATE_IDS.TokenHolding, LEGACY_TEMPLATE_IDS.TokenHolding]

// NEW (fixed)
const templateIds = [TEMPLATE_IDS.TokenHolding, LEGACY_TEMPLATE_IDS.TokenHolding]
```

This ensures the system only tries template IDs that actually exist in the current DAML ledger.