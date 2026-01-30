# Quick Start Guide - Auth0 Integration

## Current Status
✅ Auth0 SDK installed and configured
✅ Middleware set up for route handling
✅ Environment template created

## Next Steps Required

### 1. Configure Auth0 Application
You need to set up an Auth0 application to get the required credentials:

1. **Create Auth0 Account**: Go to [auth0.com](https://auth0.com) and sign up
2. **Create Application**: 
   - Go to Auth0 Dashboard → Applications → Create Application
   - Choose "Regular Web Application"
   - Name it "Canton Network Demo"

3. **Configure URLs**:
   - **Allowed Callback URLs**: `http://localhost:3000/auth/callback`
   - **Allowed Logout URLs**: `http://localhost:3000`
   - **Allowed Web Origins**: `http://localhost:3000`

### 2. Update Environment Variables
Edit the `.env.local` file with your actual Auth0 credentials:

```env
AUTH0_DOMAIN=your-domain.us.auth0.com
AUTH0_CLIENT_ID=your-actual-client-id
AUTH0_CLIENT_SECRET=your-actual-client-secret
AUTH0_SECRET=generate-a-32-character-random-string
APP_BASE_URL=http://localhost:3000
```

**Generate AUTH0_SECRET**:
```bash
openssl rand -hex 32
```

### 3. Restart Development Server
After updating the environment variables:

```bash
npm run dev
```

### 4. Test Authentication
1. Visit `http://localhost:3000`
2. Click "Sign In with Auth0"
3. You should be redirected to Auth0 login
4. After login, complete the onboarding process

## Auth0 Routes (Handled by Middleware)
The following routes are automatically created:
- `/auth/login` - Login page
- `/auth/logout` - Logout
- `/auth/callback` - OAuth callback
- `/auth/profile` - User profile
- `/auth/access-token` - Access token endpoint

## Troubleshooting

### "404 Not Found" on /auth/login
- Ensure `.env.local` has valid Auth0 credentials
- Restart the development server after updating environment variables
- Check that middleware.ts is in the root directory

### "Invalid Client" Error
- Verify AUTH0_CLIENT_ID and AUTH0_CLIENT_SECRET are correct
- Ensure the Auth0 application type is "Regular Web Application"

### Environment Variables Not Loading
- Ensure `.env.local` is in the project root (same level as package.json)
- Restart the development server
- Check for typos in variable names

## Current File Structure
```
canton-tokenization-demo/
├── .env.local                 # Auth0 credentials (update required)
├── middleware.ts              # Auth0 route handling
├── src/
│   ├── lib/auth0.ts          # Auth0 client configuration
│   └── app/
│       ├── layout.tsx        # Auth0Provider wrapper
│       ├── page.tsx          # Landing page with Auth0 login
│       └── api/onboard/      # Updated for Auth0 integration
└── AUTH0_SETUP.md            # Detailed setup guide
```

## Need Help?
- Check `AUTH0_SETUP.md` for detailed configuration steps
- Ensure all environment variables are set correctly
- Restart the development server after any configuration changes