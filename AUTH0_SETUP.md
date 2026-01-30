# Auth0 Setup Guide for Canton Network Tokenization Demo

This guide will help you set up Auth0 authentication for the Canton Network tokenization application.

## Prerequisites

- Auth0 account (sign up at [auth0.com](https://auth0.com))
- Node.js 18+ installed
- The Canton tokenization demo application

## Step 1: Create Auth0 Application

1. **Log in to Auth0 Dashboard**
   - Go to [manage.auth0.com](https://manage.auth0.com)
   - Sign in to your Auth0 account

2. **Create a New Application**
   - Click "Applications" in the sidebar
   - Click "Create Application"
   - Choose "Regular Web Applications"
   - Name it "Canton Network Tokenization Demo"
   - Click "Create"

## Step 2: Configure Application Settings

1. **Basic Information**
   - Note down your Domain, Client ID, and Client Secret
   - These will be used in your environment variables

2. **Application URIs**
   Configure the following URLs in your Auth0 application settings:

   **Allowed Callback URLs:**
   ```
   http://localhost:3000/api/auth/callback
   ```

   **Allowed Logout URLs:**
   ```
   http://localhost:3000
   ```

   **Allowed Web Origins:**
   ```
   http://localhost:3000
   ```

3. **Advanced Settings**
   - Go to "Advanced Settings" → "OAuth"
   - Ensure "JsonWebToken Signature Algorithm" is set to `RS256`
   - Ensure "OIDC Conformant" is enabled

## Step 3: Environment Configuration

1. **Copy Environment Template**
   ```bash
   cp .env.local.example .env.local
   ```

2. **Update Environment Variables**
   Edit `.env.local` with your Auth0 credentials:

   ```env
   # Auth0 Configuration
   AUTH0_DOMAIN=your-domain.auth0.com
   AUTH0_CLIENT_ID=your-client-id
   AUTH0_CLIENT_SECRET=your-client-secret
   AUTH0_SECRET=your-32-character-random-secret
   APP_BASE_URL=http://localhost:3000

   # Canton Network Configuration
   CANTON_NETWORK_URL=https://canton-testnet.example.com
   CANTON_API_KEY=your-canton-api-key
   ```

3. **Generate AUTH0_SECRET**
   Generate a secure random secret (32+ characters):
   ```bash
   openssl rand -hex 32
   ```

## Step 4: Test the Integration

1. **Start the Development Server**
   ```bash
   npm run dev
   ```

2. **Test Authentication Flow**
   - Visit `http://localhost:3000`
   - Click "Sign In with Auth0"
   - Complete the Auth0 login process
   - Complete the onboarding form
   - Verify you're redirected to the dashboard

## Step 5: Production Configuration

For production deployment, update the URLs in your Auth0 application:

**Allowed Callback URLs:**
```
https://your-domain.com/api/auth/callback
```

**Allowed Logout URLs:**
```
https://your-domain.com
```

**Allowed Web Origins:**
```
https://your-domain.com
```

Update your production environment variables:
```env
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret
AUTH0_SECRET=your-production-secret
APP_BASE_URL=https://your-domain.com
```

## Features Enabled by Auth0 Integration

### 🔐 **Secure Authentication**
- Enterprise-grade OAuth 2.0 and OpenID Connect
- Multi-factor authentication support
- Social login providers (Google, GitHub, etc.)
- Single Sign-On (SSO) capabilities

### 👤 **User Management**
- Automatic user profile management
- Email verification
- Password reset functionality
- User metadata storage

### 🛡️ **Security Features**
- JWT token-based authentication
- Automatic token refresh
- Session management
- CSRF protection

### 🔗 **Integration Benefits**
- Seamless Canton Network onboarding
- User-specific Party ID generation
- Persistent authentication state
- Secure API access

## Troubleshooting

### Common Issues

1. **"Invalid Callback URL" Error**
   - Ensure callback URLs match exactly in Auth0 settings
   - Check for trailing slashes or protocol mismatches

2. **"Invalid Client" Error**
   - Verify AUTH0_CLIENT_ID and AUTH0_CLIENT_SECRET are correct
   - Ensure the application type is "Regular Web Application"

3. **Session Issues**
   - Verify AUTH0_SECRET is at least 32 characters
   - Clear browser cookies and localStorage
   - Restart the development server

4. **CORS Errors**
   - Ensure Allowed Web Origins includes your domain
   - Check that APP_BASE_URL matches your actual URL

### Debug Mode

Enable debug logging by adding to your `.env.local`:
```env
DEBUG=@auth0/nextjs-auth0*
```

## Security Best Practices

1. **Environment Variables**
   - Never commit `.env.local` to version control
   - Use different Auth0 applications for development and production
   - Rotate secrets regularly

2. **Auth0 Configuration**
   - Enable MFA for your Auth0 account
   - Use custom domains for production
   - Configure appropriate session timeouts

3. **Application Security**
   - Implement proper RBAC if needed
   - Validate user permissions on API routes
   - Use HTTPS in production

## Support

- **Auth0 Documentation**: [auth0.com/docs](https://auth0.com/docs)
- **Next.js Auth0 SDK**: [github.com/auth0/nextjs-auth0](https://github.com/auth0/nextjs-auth0)
- **Canton Network**: [docs.canton.network](https://docs.canton.network)

For issues specific to this integration, check the application logs and Auth0 dashboard for detailed error messages.