#!/usr/bin/env node

/**
 * Test script to verify party-specific token synchronization
 * This tests that tokens created by a specific party are visible when querying
 */

async function testPartyTokenSync() {
  console.log('🧪 Testing Party-Specific Token Synchronization');
  console.log('===============================================');

  const baseUrl = 'http://localhost:3000';
  
  try {
    // Import fetch dynamically for Node.js compatibility
    const fetch = (await import('node-fetch')).default;
    
    // Step 1: Check current tokens (should include the newly created one)
    console.log('\n📊 Step 1: Checking current tokens...');
    const tokensResponse = await fetch(`${baseUrl}/api/tokens`, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    if (!tokensResponse.ok) {
      throw new Error(`Failed to fetch tokens: ${tokensResponse.status}`);
    }
    
    const tokensData = await tokensResponse.json();
    const currentTokens = tokensData.tokens || [];
    
    console.log(`   Found ${currentTokens.length} tokens:`);
    currentTokens.forEach((token, index) => {
      console.log(`   ${index + 1}. ${token.name} (${token.currency}) - Issuer: ${token.issuer}`);
      console.log(`      Contract: ${token.contractAddress}`);
    });
    
    // Step 2: Look for the specific token mentioned in the logs
    const targetTokenName = 'mouli test-1';
    const targetToken = currentTokens.find(token => token.name === targetTokenName);
    
    if (targetToken) {
      console.log(`\n✅ SUCCESS: Found target token "${targetTokenName}"!`);
      console.log(`   Token details:`);
      console.log(`   - Name: ${targetToken.name}`);
      console.log(`   - Currency: ${targetToken.currency}`);
      console.log(`   - Contract: ${targetToken.contractAddress}`);
      console.log(`   - Issuer: ${targetToken.issuer}`);
      console.log(`   - Total Supply: ${targetToken.totalSupply}`);
      
      console.log('\n🎉 Token synchronization is working correctly!');
      console.log('   The token should now be available in the mint dropdown.');
      return true;
    } else {
      console.log(`\n❌ ISSUE: Target token "${targetTokenName}" not found`);
      console.log('   This suggests the party mismatch issue still exists.');
      
      if (currentTokens.length > 0) {
        console.log('\n   Available tokens:');
        currentTokens.forEach(token => {
          console.log(`   - ${token.name} by ${token.issuer}`);
        });
      } else {
        console.log('\n   No tokens found at all - check DAML ledger connection.');
      }
      
      return false;
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    return false;
  }
}

// Run the test
testPartyTokenSync().then(success => {
  if (success) {
    console.log('\n✅ All tests passed! Token synchronization is working.');
  } else {
    console.log('\n❌ Tests failed. Check the party ID configuration.');
  }
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});