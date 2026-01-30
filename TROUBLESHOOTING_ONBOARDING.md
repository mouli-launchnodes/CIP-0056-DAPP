# Troubleshooting Onboarding Issues

## Problem - RESOLVED ✅
Onboarding was failing for new email addresses due to Canton Network authentication issues.

## Root Cause
The Canton authentication service had a circular dependency where it was trying to call its own API endpoint (`/api/canton/auth`) to get tokens, which caused authentication failures on the server side.

## Solution Applied
Modified the Canton authentication service to make OIDC token requests directly to the Canton Network instead of going through the internal API route. This eliminates the circular dependency and allows proper server-side authentication.

## Current Status
- ✅ Canton OIDC authentication working
- ✅ Token acquisition and refresh working  
- ✅ Onboarding working for all email addresses
- ✅ Server-side token caching implemented

## Debugging Steps (for future reference)

### 1. Check Canton Authentication Status

Visit: `http://localhost:3000/api/debug/canton`

This will show:
- Canton OIDC configuration status
- Token acquisition status
- Current authentication state

### 2. Test Canton Token Refresh

```bash
curl -X POST http://localhost:3000/api/debug/canton \
  -H "Content-Type: application/json" \
  -d '{"action":"test_token_refresh"}'
```

### 3. Test Onboarding API Directly

```bash
# Replace with actual auth0_user cookie value from browser
curl -X POST http://localhost:3000/api/onboard \
  -H "Content-Type: application/json" \
  -H "Cookie: auth0_user=YOUR_COOKIE_VALUE" \
  -d '{
    "email": "test@example.com",
    "auth0UserId": "YOUR_AUTH0_USER_ID",
    "name": "Test User"
  }'
```

## Environment Configuration

Ensure these variables are set in `.env.local`:

```bash
# Canton Network OIDC Configuration
OIDC_TOKEN_URL=https://dev-wt87n4dmuf1i5x0w.us.auth0.com/oauth/token
OIDC_CLIENT_ID=f6rUdaltxJ3H3t2vQHoLlcAZ28o4S46s
OIDC_CLIENT_SECRET=cJ3gxnrJ6IZgSPHuIDNB1K79QddWx1ipqKdWSsgm3M67vaN-3h6jd-sJX--6ljfd
OIDC_AUDIENCE=https://canton.network.global
```

## Technical Details

### Changes Made:
1. **Fixed Canton Auth Service**: Modified `canton-auth.ts` to make direct OIDC requests instead of internal API calls
2. **Server-side Token Caching**: Implemented in-memory token caching for server-side operations
3. **Environment Handling**: Proper client/server-side environment detection

### Key Files Modified:
- `src/lib/canton-auth.ts` - Fixed circular dependency and added server-side caching
- `src/app/api/onboard/route.ts` - Enhanced logging for debugging
- `src/app/api/debug/canton/route.ts` - Added comprehensive debugging endpoints

## Expected Behavior

### Successful Onboarding Flow:
1. User authenticates with Auth0
2. Canton OIDC token is acquired automatically
3. Party ID is generated using Canton SDK
4. User is stored in database with Auth0 and Canton information
5. User can access dashboard and perform token operations

### Logs for Successful Onboarding:
```
Onboard request body: { email: "user@example.com", ... }
Session user: { sub: "...", email: "user@example.com", name: "..." }
Generating Party ID for email: user@example.com
Canton token cached server-side, expires at: [timestamp]
Generated Party ID: party-1769771279606-tfy0uf6di
User created successfully: user@example.com
```

## Monitoring

The system now includes comprehensive logging and debugging endpoints:
- `/api/debug/canton` - Check Canton authentication status
- Server console logs - Detailed onboarding flow tracking
- Token refresh testing - Verify OIDC integration

All onboarding issues should now be resolved. Users can onboard with any valid email address.