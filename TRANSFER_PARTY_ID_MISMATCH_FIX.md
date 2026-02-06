# Transfer Party ID Mismatch Fix

## Issue Identified
You have tokens showing `2000.0` balance in holdings, but transfer shows `0` available balance.

**Root Cause:** Party ID mismatch between token owner and transfer sender field.

## Quick Diagnosis

### Step 1: Check Your Current Party ID
1. Go to `/api/debug/session` in your browser
2. Note your `partyId` value
3. Compare with the Party ID in your holdings screenshot

### Step 2: Check Token Ownership
From your screenshot, tokens belong to: `Alice::12201e7...`

### Step 3: Verify Transfer Form
The transfer form requires you to manually enter the **Sender Party ID**. If you enter a different Party ID than the token owner, it will show 0 balance.

## Solution Applied

I've updated the transfer page to:

1. **Auto-populate sender field** with your logged-in Party ID
2. **Show debug information** to identify mismatches
3. **Add "Use My ID" button** for easy correction
4. **Better error messages** showing which Party ID is being checked

## How to Fix Right Now

### Option 1: Use the Updated Transfer Page
1. Refresh the transfer page
2. Your Party ID should auto-populate in the sender field
3. If not, click "Use My ID" button

### Option 2: Manual Fix
1. Go to `/api/debug/session` to get your exact Party ID
2. Copy the `partyId` value
3. Paste it exactly in the "Sender Party ID" field on transfer page
4. Make sure it matches the Party ID that owns the tokens

## Expected Behavior After Fix

✅ **Before:** Sender field empty → You enter wrong Party ID → 0 balance  
✅ **After:** Sender field auto-filled → Correct Party ID → Shows actual balance

## Verification Steps

1. **Check debug info** on transfer page shows your correct Party ID
2. **Verify sender field** matches your Party ID exactly
3. **Confirm balance** shows `2000.0` when correct Party ID is used
4. **Transfer should work** once Party IDs match

## Technical Details

The issue was in the UX flow:
- Holdings page shows tokens for your logged-in Party ID
- Transfer page requires manual entry of sender Party ID
- If you enter different Party ID → different holdings → 0 balance

The fix ensures the sender field defaults to your actual Party ID.