# Canton Network OIDC Integration

This document describes the integration of Canton Network OIDC authentication with the tokenization demo application.

## Overview

The application now implements a two-step authentication flow:

1. **Auth0 Authentication**: Users authenticate with Auth0 for application access
2. **Canton Network Authentication**: The application automatically obtains a Canton Network admin token using OIDC client credentials flow

## Architecture

### Authentication Flow

```
User Login (Auth0) → Application Access → Canton OIDC Token → Canton Network API Access
```

### Components

1. **Canton Auth Service** (`src/lib/canton-auth.ts`)
   - Manages Canton Network OIDC token lifecycle
   - Handles token refresh and expiry
   - Provides authenticated API request methods

2. **Canton Auth API** (`src/app/api/canton/auth/route.ts`)
   - Server-side OIDC token exchange
   - Securely handles client credentials
   - Returns access tokens to the client

3. **Canton SDK Integration** (`src/lib/canton.ts`)
   - Updated to use OIDC authentication
   - All Canton operations now require valid tokens
   - Automatic token validation before API calls

4. **UI Components**
   - `CantonAuthStatus`: Shows real-time authentication status
   - `useCantonAuth`: React hook for authentication state management
   - `AuthWrapper`: Enhanced to handle Canton authentication

## Configuration

### Environment Variables

Add the following to your `.env.local` file:

```bash
# Canton Network OIDC Configuration
OIDC_TOKEN_URL=https://dev-wt87n4dmuf1i5x0w.us.auth0.com/oauth/token
OIDC_CLIENT_ID=f6rUdaltxJ3H3t2vQHoLlcAZ28o4S46s
OIDC_CLIENT_SECRET=cJ3gxnrJ6IZgSPHuIDNB1K79QddWx1ipqKdWSsgm3M67vAN-3h6jd-sJX--6ljfd
OIDC_AUDIENCE=https://canton.network.global
```

### OIDC Client Credentials

The application uses the following OIDC configuration:

- **Token URL**: `https://dev-wt87n4dmuf1i5x0w.us.auth0.com/oauth/token`
- **Client ID**: `f6rUdaltxJ3H3t2vQHoLlcAZ28o4S46s`
- **Client Secret**: `cJ3gxnrJ6IZgSPHuIDNB1K79QddWx1ipqKdWSsgm3M67vAN-3h6jd-sJX--6ljfd`
- **Audience**: `https://canton.network.global`

## Implementation Details

### Token Management

1. **Automatic Token Acquisition**
   - Tokens are automatically obtained when users log in
   - No manual intervention required

2. **Token Storage**
   - Tokens are stored in localStorage with expiry timestamps
   - Automatic cleanup on expiry

3. **Token Refresh**
   - Automatic refresh when tokens expire in < 5 minutes
   - Manual refresh option available in UI

4. **Token Validation**
   - All Canton API calls validate token before execution
   - Automatic retry with fresh token on 401 errors

### Security Features

1. **Client Credentials Flow**
   - Secure server-side token exchange
   - Client secrets never exposed to browser

2. **Token Expiry Handling**
   - Proactive token refresh
   - Graceful handling of expired tokens

3. **Error Handling**
   - Comprehensive error messages
   - Fallback authentication retry mechanisms

## API Endpoints

### Canton Authentication

- `POST /api/canton/auth` - Get Canton admin token
- `GET /api/canton/auth` - Check Canton OIDC configuration

### Canton Testing

- `GET /api/canton/test` - Test Canton authentication status
- `POST /api/canton/test` - Test Canton operations (party generation, token deployment)

## Usage Examples

### Getting Canton Admin Token

```typescript
import { cantonAuth } from '@/lib/canton-auth'

// Get current token (automatically refreshes if needed)
const token = await cantonAuth.getAdminToken()

// Make authenticated request
const response = await cantonAuth.makeAuthenticatedRequest('/api/canton/endpoint', {
  method: 'POST',
  body: JSON.stringify(data)
})
```

### Using Canton SDK

```typescript
import { cantonSDK } from '@/lib/canton'

// All operations automatically handle authentication
const partyInfo = await cantonSDK.generatePartyId('user@example.com')
const tokenContract = await cantonSDK.deployTokenContract(params)
const result = await cantonSDK.mintTokens(params)
```

### React Hook Usage

```typescript
import { useCantonAuth } from '@/hooks/use-canton-auth'

function MyComponent() {
  const { 
    isAuthenticated, 
    isLoading, 
    error, 
    refreshCantonAuth 
  } = useCantonAuth()

  if (isLoading) return <div>Connecting to Canton...</div>
  if (error) return <div>Error: {error}</div>
  if (!isAuthenticated) return <div>Not connected to Canton</div>

  return <div>Connected to Canton Network!</div>
}
```

## Testing

### Manual Testing

1. **Authentication Status**
   ```bash
   curl http://localhost:3000/api/canton/auth
   ```

2. **Token Acquisition**
   ```bash
   curl -X POST http://localhost:3000/api/canton/auth \
     -H "Content-Type: application/json" \
     -d '{"action":"get_admin_token"}'
   ```

3. **Canton Operations**
   ```bash
   curl http://localhost:3000/api/canton/test
   ```

### UI Testing

1. Login to the application
2. Navigate to the dashboard
3. Check the Canton authentication status indicator
4. Verify automatic token acquisition and refresh

## Troubleshooting

### Common Issues

1. **Missing Environment Variables**
   - Ensure all OIDC_* variables are set in `.env.local`
   - Check that values match the provided credentials

2. **Token Acquisition Failures**
   - Verify OIDC client credentials are correct
   - Check network connectivity to Auth0 token endpoint
   - Review server logs for detailed error messages

3. **Token Expiry Issues**
   - Tokens automatically refresh, but manual refresh is available
   - Check browser localStorage for token storage issues

### Debug Logging

Enable debug logging by checking browser console and server logs:

```typescript
// Client-side logging
console.log('Canton auth status:', cantonAuth.isAuthenticated())
console.log('Token info:', cantonAuth.getTokenInfo())

// Server-side logging is automatically enabled
```

## Security Considerations

1. **Client Secret Protection**
   - Client secrets are only used server-side
   - Never exposed to browser or client-side code

2. **Token Storage**
   - Tokens stored in localStorage with expiry validation
   - Automatic cleanup prevents stale token usage

3. **API Security**
   - All Canton API calls require valid authentication
   - Automatic token validation and refresh

4. **Error Handling**
   - Graceful degradation on authentication failures
   - Clear error messages without exposing sensitive information

## Future Enhancements

1. **Token Caching**
   - Server-side token caching for improved performance
   - Shared token pool for multiple users

2. **Advanced Error Recovery**
   - Retry mechanisms with exponential backoff
   - Circuit breaker patterns for API failures

3. **Monitoring and Analytics**
   - Authentication success/failure metrics
   - Token usage and refresh patterns

4. **Multi-Environment Support**
   - Different OIDC configurations for dev/staging/prod
   - Environment-specific Canton Network endpoints