#!/usr/bin/env node

/**
 * Test script to verify token creation and synchronization
 * This tests the flow: Create Token → Check if it appears in mint dropdown
 */

const fetch = require('node-fetch');

async function testTokenSync() {
  console.log('🧪 Testing Token Creation and Synchronization');
  console.log('==============================================');

  const baseUrl = 'http://localhost:3000';
  
  try {
    // Step 1: Get initial token count
    console.log('\n📊 Step 1: Getting initial token count...');
    const initialResponse = await fetch(`${baseUrl}/api/tokens`);
    const initialData = await initialResponse.json();
    const initialCount = initialData.tokens?.length || 0;
    console.log(`   Initial tokens: ${initialCount}`);

    // Step 2: Create a new token
    console.log('\n🏗️  Step 2: Creating a new test token...');
    const createResponse = await fetch(`${baseUrl}/api/tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tokenName: `TestToken_${Date.now()}`,
        currency: 'USD',
        quantityPrecision: 2,
        pricePrecision: 2,
        description: 'Test token for sync verification'
      })
    });

    if (!createResponse.ok) {
      const errorData = await createResponse.json();
      throw new Error(`Token creation failed: ${errorData.error}`);
    }

    const createData = await createResponse.json();
    console.log(`   ✅ Token created: ${createData.contract.tokenName}`);
    console.log(`   Contract ID: ${createData.contract.contractId}`);

    // Step 3: Wait a moment for propagation
    console.log('\n⏳ Step 3: Waiting for data propagation...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 4: Check if token appears in the list
    console.log('\n🔍 Step 4: Verifying token appears in list...');
    const verifyResponse = await fetch(`${baseUrl}/api/tokens`, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    const verifyData = await verifyResponse.json();
    const newCount = verifyData.tokens?.length || 0;
    
    console.log(`   New token count: ${newCount}`);
    console.log(`   Expected count: ${initialCount + 1}`);

    // Step 5: Verify the specific token exists
    const createdToken = verifyData.tokens?.find(token => 
      token.id === createData.contract.contractId
    );

    if (createdToken) {
      console.log(`   ✅ SUCCESS: Token found in list!`);
      console.log(`   Token details:`);
      console.log(`   - Name: ${createdToken.name}`);
      console.log(`   - Currency: ${createdToken.currency}`);
      console.log(`   - Contract: ${createdToken.contractAddress}`);
    } else {
      console.log(`   ❌ FAIL: Token not found in list`);
      console.log(`   Available tokens:`, verifyData.tokens?.map(t => t.name));
      return false;
    }

    // Step 6: Test the mint endpoint token availability
    console.log('\n🪙 Step 6: Testing mint page token availability...');
    // Since we can't directly test the frontend, we'll verify the API returns the token
    if (newCount > initialCount) {
      console.log(`   ✅ SUCCESS: Token should be available for minting`);
      console.log(`   Mint page will show ${newCount} tokens in dropdown`);
    } else {
      console.log(`   ❌ FAIL: Token count didn't increase`);
      return false;
    }

    console.log('\n🎉 All tests passed!');
    console.log('   The token creation → mint dropdown flow is working correctly');
    return true;

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    return false;
  }
}

// Run the test
testTokenSync().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});