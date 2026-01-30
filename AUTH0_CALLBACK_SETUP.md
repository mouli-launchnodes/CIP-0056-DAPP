# Auth0 Callback URL Configuration

## ⚠️ IMPORTANT: Update Your Auth0 Dashboard

You need to configure the callback URL in your Auth0 application dashboard:

### 1. Go to Auth0 Dashboard
- Visit: https://manage.auth0.com/dashboard
- Navigate to Applications → Your Application

### 2. Update Application URLs

**Allowed Callback URLs:**
```
http://localhost:3001/auth/callback
```

**Allowed Logout URLs:**
```
http://localhost:3001
```

**Allowed Web Origins:**
```
http://localhost:3001
```

### 3. Save Changes
Click "Save Changes" in your Auth0 dashboard.

### 4. Test the Flow
1. Restart your development server: `npm run dev`
2. Visit: http://localhost:3000
3. Click "Sign In with Auth0"
4. Should redirect to Auth0 login page
5. After login, should redirect back to your app

## Current Auth0 Routes Created:
- ✅ `/auth/login` - Redirects to Auth0 authorization
- ✅ `/auth/logout` - Logs out and redirects to home
- ✅ `/auth/callback` - Handles OAuth callback
- ✅ `/auth/profile` - Returns user profile JSON

## Troubleshooting:

### "Callback URL mismatch" error:
- Ensure the callback URL in Auth0 dashboard exactly matches: `http://localhost:3000/auth/callback`
- No trailing slashes
- Correct protocol (http for localhost)

### Still getting 404 errors:
- Restart the development server
- Check that all environment variables are set in `.env.local`
- Verify Auth0 credentials are correct

### Auth0 login page doesn't appear:
- Check AUTH0_DOMAIN in `.env.local`
- Ensure it's in format: `your-domain.us.auth0.com` (no https://)
- Verify AUTH0_CLIENT_ID is correct