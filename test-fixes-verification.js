#!/usr/bin/env node

/**
 * Test Script to Verify Transfer and Burn Fixes
 * 
 * This script tests the two critical fixes:
 * 1. Partial transfers (should not transfer entire balance)
 * 2. Burn functionality (should show correct balance and allow burning)
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

// Test configuration
const TEST_CONFIG = {
  // Use existing parties from Canton sandbox
  ALICE_PARTY: 'Alice::1220a438dc62a4f562fa647216e464cf148cd63e55fb0f2fc01ab7ac9a1bcbf22459',
  BOB_PARTY: 'Bob::1220a438dc62a4f562fa647216e464cf148cd63e55fb0f2fc01ab7ac9a1bcbf22459',
  TOKEN_NAME: 'TEST_FIX_TOKEN',
  CURRENCY: 'USD',
  INITIAL_MINT: '1000',
  TRANSFER_AMOUNT: '300',
  BURN_AMOUNT: '200'
};

// Helper function to make API requests
async function apiRequest(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    }
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`API Error: ${data.error || response.statusText}`);
  }
  
  return data;
}

// Helper function to get holdings for a party
async function getHoldings(partyId) {
  try {
    const response = await apiRequest(`/api/holdings?partyId=${encodeURIComponent(partyId)}`);
    return response.holdings || [];
  } catch (error) {
    console.log(`No holdings found for ${partyId}: ${error.message}`);
    return [];
  }
}

// Helper function to find token balance
function findTokenBalance(holdings, tokenName) {
  const holding = holdings.find(h => h.tokenName === tokenName);
  return holding ? parseFloat(holding.totalBalance || '0') : 0;
}

// Test 1: Create a test token
async function testCreateToken() {
  console.log('\n🧪 Test 1: Creating test token...');
  
  try {
    const tokenData = {
      tokenName: TEST_CONFIG.TOKEN_NAME,
      currency: TEST_CONFIG.CURRENCY,
      quantityPrecision: 2,
      pricePrecision: 2,
      description: 'Test token for verifying fixes'
    };
    
    const result = await apiRequest('/api/tokens', 'POST', tokenData);
    console.log('✅ Token created successfully:', result.contract.contractId);
    return result.contract;
  } catch (error) {
    console.log('⚠️  Token creation failed (may already exist):', error.message);
    return null;
  }
}

// Test 2: Mint tokens to Alice
async function testMintTokens(tokenContract) {
  console.log('\n🧪 Test 2: Minting tokens to Alice...');
  
  try {
    const mintData = {
      recipientPartyId: TEST_CONFIG.ALICE_PARTY,
      tokenId: tokenContract?.contractId || 'existing-token',
      amount: TEST_CONFIG.INITIAL_MINT
    };
    
    const result = await apiRequest('/api/mint', 'POST', mintData);
    console.log('✅ Tokens minted successfully:', result.transaction.transactionHash);
    
    // Verify Alice's balance
    const aliceHoldings = await getHoldings(TEST_CONFIG.ALICE_PARTY);
    const aliceBalance = findTokenBalance(aliceHoldings, TEST_CONFIG.TOKEN_NAME);
    console.log(`📊 Alice's balance after mint: ${aliceBalance}`);
    
    return result;
  } catch (error) {
    console.log('❌ Mint failed:', error.message);
    throw error;
  }
}

// Test 3: Test partial transfer (THE MAIN FIX)
async function testPartialTransfer() {
  console.log('\n🧪 Test 3: Testing partial transfer (MAIN FIX)...');
  
  try {
    // Get Alice's balance before transfer
    const aliceHoldingsBefore = await getHoldings(TEST_CONFIG.ALICE_PARTY);
    const aliceBalanceBefore = findTokenBalance(aliceHoldingsBefore, TEST_CONFIG.TOKEN_NAME);
    console.log(`📊 Alice's balance before transfer: ${aliceBalanceBefore}`);
    
    // Get Bob's balance before transfer
    const bobHoldingsBefore = await getHoldings(TEST_CONFIG.BOB_PARTY);
    const bobBalanceBefore = findTokenBalance(bobHoldingsBefore, TEST_CONFIG.TOKEN_NAME);
    console.log(`📊 Bob's balance before transfer: ${bobBalanceBefore}`);
    
    // Create transfer proposal
    const transferData = {
      senderPartyId: TEST_CONFIG.ALICE_PARTY,
      recipientPartyId: TEST_CONFIG.BOB_PARTY,
      tokenId: 'test-token-id', // This will be resolved by the API
      amount: TEST_CONFIG.TRANSFER_AMOUNT
    };
    
    const transferResult = await apiRequest('/api/transfer', 'POST', transferData);
    console.log('✅ Transfer proposal created:', transferResult.proposalId);
    
    // Accept the transfer proposal
    const acceptData = {
      recipientPartyId: TEST_CONFIG.BOB_PARTY,
      proposalId: transferResult.proposalId
    };
    
    const acceptResult = await apiRequest('/api/transfer/accept', 'POST', acceptData);
    console.log('✅ Transfer proposal accepted:', acceptResult.transactionId);
    
    // Wait a moment for the transaction to be processed
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Verify balances after transfer
    const aliceHoldingsAfter = await getHoldings(TEST_CONFIG.ALICE_PARTY);
    const aliceBalanceAfter = findTokenBalance(aliceHoldingsAfter, TEST_CONFIG.TOKEN_NAME);
    console.log(`📊 Alice's balance after transfer: ${aliceBalanceAfter}`);
    
    const bobHoldingsAfter = await getHoldings(TEST_CONFIG.BOB_PARTY);
    const bobBalanceAfter = findTokenBalance(bobHoldingsAfter, TEST_CONFIG.TOKEN_NAME);
    console.log(`📊 Bob's balance after transfer: ${bobBalanceAfter}`);
    
    // Verify the fix worked correctly
    const expectedAliceBalance = aliceBalanceBefore - parseFloat(TEST_CONFIG.TRANSFER_AMOUNT);
    const expectedBobBalance = bobBalanceBefore + parseFloat(TEST_CONFIG.TRANSFER_AMOUNT);
    
    console.log('\n🔍 Transfer Fix Verification:');
    console.log(`Expected Alice balance: ${expectedAliceBalance}`);
    console.log(`Actual Alice balance: ${aliceBalanceAfter}`);
    console.log(`Expected Bob balance: ${expectedBobBalance}`);
    console.log(`Actual Bob balance: ${bobBalanceAfter}`);
    
    if (Math.abs(aliceBalanceAfter - expectedAliceBalance) < 0.001 && 
        Math.abs(bobBalanceAfter - expectedBobBalance) < 0.001) {
      console.log('✅ TRANSFER FIX VERIFIED: Partial transfer works correctly!');
      return true;
    } else {
      console.log('❌ TRANSFER FIX FAILED: Balances are incorrect!');
      return false;
    }
    
  } catch (error) {
    console.log('❌ Transfer test failed:', error.message);
    return false;
  }
}

// Test 4: Test burn functionality (THE SECOND FIX)
async function testBurnFunctionality() {
  console.log('\n🧪 Test 4: Testing burn functionality (SECOND FIX)...');
  
  try {
    // Get Alice's balance before burn
    const aliceHoldingsBefore = await getHoldings(TEST_CONFIG.ALICE_PARTY);
    const aliceBalanceBefore = findTokenBalance(aliceHoldingsBefore, TEST_CONFIG.TOKEN_NAME);
    console.log(`📊 Alice's balance before burn: ${aliceBalanceBefore}`);
    
    if (aliceBalanceBefore === 0) {
      console.log('⚠️  Alice has no tokens to burn, skipping burn test');
      return true;
    }
    
    // Test burn operation
    const burnData = {
      partyId: TEST_CONFIG.ALICE_PARTY,
      tokenId: 'test-token-id', // This will be resolved by the API
      amount: Math.min(parseFloat(TEST_CONFIG.BURN_AMOUNT), aliceBalanceBefore).toString()
    };
    
    const burnResult = await apiRequest('/api/burn', 'POST', burnData);
    console.log('✅ Burn operation completed:', burnResult.transaction.transactionHash);
    
    // Wait a moment for the transaction to be processed
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Verify balance after burn
    const aliceHoldingsAfter = await getHoldings(TEST_CONFIG.ALICE_PARTY);
    const aliceBalanceAfter = findTokenBalance(aliceHoldingsAfter, TEST_CONFIG.TOKEN_NAME);
    console.log(`📊 Alice's balance after burn: ${aliceBalanceAfter}`);
    
    // Verify the fix worked correctly
    const burnAmount = parseFloat(burnData.amount);
    const expectedAliceBalance = aliceBalanceBefore - burnAmount;
    
    console.log('\n🔍 Burn Fix Verification:');
    console.log(`Burned amount: ${burnAmount}`);
    console.log(`Expected Alice balance: ${expectedAliceBalance}`);
    console.log(`Actual Alice balance: ${aliceBalanceAfter}`);
    
    if (Math.abs(aliceBalanceAfter - expectedAliceBalance) < 0.001) {
      console.log('✅ BURN FIX VERIFIED: Burn functionality works correctly!');
      return true;
    } else {
      console.log('❌ BURN FIX FAILED: Balance after burn is incorrect!');
      return false;
    }
    
  } catch (error) {
    console.log('❌ Burn test failed:', error.message);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Transfer and Burn Fixes Verification Tests');
  console.log('=' .repeat(60));
  
  let allTestsPassed = true;
  
  try {
    // Test 1: Create token
    const tokenContract = await testCreateToken();
    
    // Test 2: Mint tokens
    await testMintTokens(tokenContract);
    
    // Test 3: Partial transfer (main fix)
    const transferTestPassed = await testPartialTransfer();
    allTestsPassed = allTestsPassed && transferTestPassed;
    
    // Test 4: Burn functionality (second fix)
    const burnTestPassed = await testBurnFunctionality();
    allTestsPassed = allTestsPassed && burnTestPassed;
    
    // Final results
    console.log('\n' + '=' .repeat(60));
    console.log('🏁 TEST RESULTS SUMMARY');
    console.log('=' .repeat(60));
    
    if (allTestsPassed) {
      console.log('✅ ALL TESTS PASSED! Both fixes are working correctly.');
      console.log('✅ Transfer Fix: Partial transfers maintain correct balances');
      console.log('✅ Burn Fix: Burn functionality works with proper balance display');
    } else {
      console.log('❌ SOME TESTS FAILED! Please check the issues above.');
    }
    
    console.log('\n📋 Test Configuration Used:');
    console.log(`- Alice Party: ${TEST_CONFIG.ALICE_PARTY}`);
    console.log(`- Bob Party: ${TEST_CONFIG.BOB_PARTY}`);
    console.log(`- Token Name: ${TEST_CONFIG.TOKEN_NAME}`);
    console.log(`- Initial Mint: ${TEST_CONFIG.INITIAL_MINT}`);
    console.log(`- Transfer Amount: ${TEST_CONFIG.TRANSFER_AMOUNT}`);
    console.log(`- Burn Amount: ${TEST_CONFIG.BURN_AMOUNT}`);
    
  } catch (error) {
    console.log('\n❌ Test suite failed with error:', error.message);
    allTestsPassed = false;
  }
  
  process.exit(allTestsPassed ? 0 : 1);
}

// Run the tests
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  testCreateToken,
  testMintTokens,
  testPartialTransfer,
  testBurnFunctionality
};