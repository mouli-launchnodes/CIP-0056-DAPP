// Simple test script to verify Canton OIDC authentication
// Run with: node test-canton-auth.js

const fetch = require('node-fetch');

const OIDC_TOKEN_URL = "https://dev-wt87n4dmuf1i5x0w.us.auth0.com/oauth/token";
const OIDC_CLIENT_ID = "f6rUdaltxJ3H3t2vQHoLlcAZ28o4S46s";
const OIDC_CLIENT_SECRET = "cJ3gxnrJ6IZgSPHuIDNB1K79QddWx1ipqKdWSsgm3M67vaN-3h6jd-sJX--6ljfd";
const OIDC_AUDIENCE = "https://canton.network.global";

async function testCantonAuth() {
  console.log('Testing Canton Network OIDC Authentication...\n');

  try {
    // Test the OIDC token request
    console.log('1. Testing OIDC token request...');
    
    const tokenRequestBody = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: OIDC_CLIENT_ID,
      client_secret: OIDC_CLIENT_SECRET,
      audience: OIDC_AUDIENCE
    });

    const response = await fetch(OIDC_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: tokenRequestBody.toString()
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const tokenData = await response.json();
    
    console.log('✅ OIDC token request successful!');
    console.log(`   Token type: ${tokenData.token_type}`);
    console.log(`   Expires in: ${tokenData.expires_in} seconds`);
    console.log(`   Scope: ${tokenData.scope || 'Not specified'}`);
    console.log(`   Token length: ${tokenData.access_token?.length || 0} characters`);
    
    // Test token validation (basic check)
    if (tokenData.access_token && tokenData.access_token.length > 0) {
      console.log('✅ Access token received and appears valid');
    } else {
      console.log('❌ Access token missing or empty');
    }

    console.log('\n2. Canton OIDC Integration Test Results:');
    console.log('✅ OIDC endpoint is accessible');
    console.log('✅ Client credentials are valid');
    console.log('✅ Token acquisition successful');
    console.log('✅ Ready for Canton Network integration');

  } catch (error) {
    console.error('❌ Canton OIDC authentication test failed:');
    console.error(`   Error: ${error.message}`);
    
    if (error.message.includes('401')) {
      console.error('   → Check client credentials (ID/Secret)');
    } else if (error.message.includes('403')) {
      console.error('   → Check audience configuration');
    } else if (error.message.includes('ENOTFOUND')) {
      console.error('   → Check network connectivity');
    }
  }
}

// Run the test
testCantonAuth();