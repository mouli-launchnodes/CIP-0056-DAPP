# DAML Integration Setup Guide

This guide will help you set up the real DAML integration for the Canton Network Tokenization Platform.

## Prerequisites

Before starting, ensure you have:

1. **DAML SDK** installed (version 2.8.0 or higher)
2. **Node.js** (version 18 or higher)
3. **npm** or **yarn** package manager

## Installing DAML SDK

### macOS
```bash
curl -sSL https://get.daml.com/ | sh
```

### Linux
```bash
curl -sSL https://get.daml.com/ | sh
```

### Windows
Download and run the installer from: https://github.com/digital-asset/daml/releases

### Verify Installation
```bash
daml version
```

## Project Setup

### 1. Install Dependencies

```bash
npm install
```

This will install the DAML JavaScript SDK and other required dependencies.

### 2. Build DAML Contracts

```bash
npm run daml:build
```

This compiles the DAML contracts in the `contracts/` directory.

### 3. Generate JavaScript Bindings (Optional)

```bash
npm run daml:codegen
```

This generates TypeScript/JavaScript bindings for the DAML contracts.

## Running the Application

### Option 1: Start DAML and Next.js Together

```bash
npm run dev:full
```

This starts both the DAML sandbox and the Next.js development server concurrently.

### Option 2: Start Services Separately

**Terminal 1 - Start DAML Sandbox:**
```bash
npm run daml:start
# or
daml start
```

**Terminal 2 - Start Next.js:**
```bash
npm run dev
```

## DAML Sandbox Information

When you run `daml start`, the following services will be available:

- **DAML Ledger API**: `http://localhost:7575`
- **Navigator (Web UI)**: `http://localhost:7500`
- **JSON API**: `http://localhost:7575/v1/`

## Testing the Integration

### 1. Access the Application

Open your browser and navigate to `http://localhost:3000`

### 2. Authenticate with Auth0

Log in using your Auth0 credentials.

### 3. Onboard to Canton Network

Click "Get Started" to onboard. You should see:
- Real Party ID generation via DAML ledger
- Success message indicating DAML integration
- Party registration stored on the ledger

### 4. Verify in Navigator

1. Open `http://localhost:7500` in another tab
2. Select your party from the dropdown
3. View the `PartyRegistration` contract created during onboarding

## Real DAML Operations

The application now performs real DAML operations:

### Party Registration
- Creates actual Party IDs on the DAML ledger
- Stores party information in `PartyRegistration` contracts

### Token Operations
- **Create Token**: Deploys `TokenMetadata` contracts
- **Mint Tokens**: Creates `TokenHolding` contracts
- **Transfer Tokens**: Exercises `Transfer` choice on holdings
- **Burn Tokens**: Exercises `Burn` choice on holdings

### Data Queries
- **Holdings**: Queries actual `TokenHolding` contracts
- **Tokens**: Queries actual `TokenMetadata` contracts
- **Transactions**: Tracks real DAML transaction IDs

## Environment Variables

Add these to your `.env.local` file:

```env
# DAML Ledger Configuration
DAML_LEDGER_URL=http://localhost:7575
DAML_LEDGER_WS_URL=ws://localhost:7575
DAML_ADMIN_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJkYW1sLWxlZGdlci1hcGkiLCJzdWIiOiJhZG1pbiIsImV4cCI6MTk5OTk5OTk5OX0.1HKhGlFuBP8yUFNJkbWaZvhl3ycyYaspAx8dGM5HMEI
DAML_PARTICIPANT_ID=sandbox-participant
```

## Troubleshooting

### DAML Sandbox Not Starting

**Issue**: `daml start` fails or hangs

**Solutions**:
1. Check if port 7575 is already in use:
   ```bash
   lsof -i :7575
   ```
2. Clean and rebuild:
   ```bash
   npm run daml:clean
   npm run daml:build
   ```
3. Check DAML version compatibility:
   ```bash
   daml version
   ```

### Connection Errors

**Issue**: "DAML ledger not available" error during onboarding

**Solutions**:
1. Ensure DAML sandbox is running:
   ```bash
   curl http://localhost:7575/v1/packages
   ```
2. Check the console logs for connection errors
3. Verify environment variables are set correctly

### Party ID Generation Fails

**Issue**: Onboarding fails with DAML errors

**Solutions**:
1. Check DAML sandbox logs for errors
2. Verify the DAML contracts compiled successfully
3. Ensure the admin token is valid

### Navigator Not Loading

**Issue**: Navigator at `http://localhost:7500` doesn't load

**Solutions**:
1. Ensure you started with `daml start` (not just the ledger)
2. Check if port 7500 is available
3. Try refreshing the page after a few seconds

## Development Workflow

### 1. Making Changes to DAML Contracts

1. Edit contracts in `contracts/CIP0056Token.daml`
2. Rebuild: `npm run daml:build`
3. Restart DAML sandbox: `npm run daml:start`
4. Test changes in the application

### 2. Debugging DAML Operations

1. Use Navigator to inspect contracts and transactions
2. Check browser console for DAML client errors
3. Monitor DAML sandbox logs for ledger errors

### 3. Resetting the Ledger

To start with a clean ledger:
```bash
# Stop the sandbox (Ctrl+C)
# Remove the ledger database
rm -rf .daml/
# Restart
npm run daml:start
```

## Production Considerations

For production deployment:

1. **Use Canton Network**: Replace local sandbox with Canton Network participant
2. **Secure Tokens**: Use proper authentication tokens (not the demo admin token)
3. **Error Handling**: Implement robust error handling for network issues
4. **Monitoring**: Add monitoring for DAML operations and ledger health

## Next Steps

1. **Explore Navigator**: Use the web UI to inspect contracts and transactions
2. **Test Token Operations**: Create, mint, transfer, and burn tokens
3. **Monitor Real Data**: See actual DAML contracts instead of mock data
4. **Customize Contracts**: Modify DAML contracts for your specific use case

## Support

- **DAML Documentation**: https://docs.daml.com/
- **Canton Network**: https://www.canton.network/
- **GitHub Issues**: Report issues in the project repository

---

**🎉 Congratulations!** You now have a fully functional DAML-integrated tokenization platform running on real Canton Network technology.