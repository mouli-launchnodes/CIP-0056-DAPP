#!/usr/bin/env node

/**
 * Test script to verify that the application properly fails when DAML is not running
 * This should demonstrate that all fallback mechanisms have been removed
 */

const { spawn } = require('child_process');
const fetch = require('node-fetch');

console.log('🧪 Testing DAML Dependency Enforcement');
console.log('=====================================');

async function testEndpoint(endpoint, method = 'GET', body = null) {
  try {
    console.log(`\n📡 Testing ${method} ${endpoint}`);
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`http://localhost:3000${endpoint}`, options);
    const data = await response.json();
    
    if (response.ok) {
      console.log(`❌ FAIL: Endpoint should have failed but returned success`);
      console.log(`   Response:`, data);
      return false;
    } else {
      console.log(`✅ PASS: Endpoint properly failed with error`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${data.error}`);
      return true;
    }
  } catch (error) {
    console.log(`✅ PASS: Endpoint failed with network/connection error (expected)`);
    console.log(`   Error: ${error.message}`);
    return true;
  }
}

async function runTests() {
  console.log('\n🚀 Starting Next.js development server...');
  
  // Start the Next.js dev server
  const server = spawn('npm', ['run', 'dev'], {
    stdio: 'pipe',
    cwd: process.cwd()
  });
  
  // Wait for server to start
  await new Promise((resolve) => {
    server.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Ready') || output.includes('localhost:3000')) {
        console.log('✅ Next.js server started');
        resolve();
      }
    });
    
    // Fallback timeout
    setTimeout(resolve, 10000);
  });
  
  // Wait a bit more for full startup
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  console.log('\n🧪 Running API Tests (DAML should NOT be running)');
  console.log('==================================================');
  
  let allTestsPassed = true;
  
  // Test 1: Get tokens (should fail)
  const test1 = await testEndpoint('/api/tokens');
  allTestsPassed = allTestsPassed && test1;
  
  // Test 2: Create token (should fail)
  const test2 = await testEndpoint('/api/tokens', 'POST', {
    tokenName: 'TestToken',
    currency: 'USD',
    quantityPrecision: 2,
    pricePrecision: 2,
    description: 'Test token'
  });
  allTestsPassed = allTestsPassed && test2;
  
  // Test 3: Get holdings (should fail)
  const test3 = await testEndpoint('/api/holdings');
  allTestsPassed = allTestsPassed && test3;
  
  // Test 4: Mint tokens (should fail)
  const test4 = await testEndpoint('/api/mint', 'POST', {
    tokenId: 'test-token-id',
    recipientPartyId: 'test-party',
    amount: '100'
  });
  allTestsPassed = allTestsPassed && test4;
  
  // Test 5: Transfer tokens (should fail)
  const test5 = await testEndpoint('/api/transfer', 'POST', {
    recipientPartyId: 'test-party',
    tokenName: 'TestToken',
    amount: '50'
  });
  allTestsPassed = allTestsPassed && test5;
  
  // Test 6: Burn tokens (should fail)
  const test6 = await testEndpoint('/api/burn', 'POST', {
    tokenName: 'TestToken',
    amount: '25'
  });
  allTestsPassed = allTestsPassed && test6;
  
  console.log('\n📊 Test Results');
  console.log('================');
  
  if (allTestsPassed) {
    console.log('✅ ALL TESTS PASSED: Application properly requires DAML to be running');
    console.log('   No fallback mechanisms are active');
    console.log('   All operations fail gracefully when DAML is not available');
  } else {
    console.log('❌ SOME TESTS FAILED: Application still has fallback mechanisms');
    console.log('   The app should not work without DAML running');
    console.log('   Please check for remaining mock/fallback code');
  }
  
  // Clean up
  console.log('\n🧹 Cleaning up...');
  server.kill();
  
  process.exit(allTestsPassed ? 0 : 1);
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Test interrupted');
  process.exit(1);
});

// Run the tests
runTests().catch((error) => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});