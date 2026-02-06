#!/usr/bin/env node

/**
 * Test script to verify that the template ID issue is resolved
 * This tests the DAML client directly without authentication
 */

const path = require('path');

// Add the src directory to the module path
process.env.NODE_PATH = path.join(__dirname, 'src');
require('module').Module._initPaths();

async function testTemplateIdFix() {
  console.log('🧪 Testing Template ID Fix');
  console.log('===========================');
  
  try {
    // Test DAML package import first
    console.log('🔍 Testing DAML package import...');
    const damlPackage = require('@daml.js/cip0056-token-1.0.0');
    console.log(`   ✅ DAML package imported successfully`);
    console.log(`   Package ID: ${damlPackage.packageId}`);
    console.log(`   TokenMetadata template ID: ${damlPackage.CIP0056Token.TokenMetadata.templateId}`);
    
    // Import the DAML client
    const { DamlLedgerClient } = require('./src/lib/daml-client.ts');
    
    console.log('✅ DAML client imported successfully');
    
    // Create a client instance
    const client = new DamlLedgerClient();
    
    console.log('✅ DAML client instantiated');
    
    // Test ledger availability
    console.log('\n🔍 Testing ledger availability...');
    const isAvailable = await client.isLedgerAvailable();
    console.log(`   Ledger available: ${isAvailable}`);
    
    if (!isAvailable) {
      console.log('❌ DAML ledger is not available. Please ensure DAML is running.');
      return false;
    }
    
    // Test party registration (this will assign an existing party)
    console.log('\n🔍 Testing party registration...');
    const testEmail = 'test@example.com';
    const partyResult = await client.registerParty(testEmail, 'Test User');
    console.log(`   Assigned party: ${partyResult.party}`);
    
    // Test token creation with the assigned party
    console.log('\n🔍 Testing token creation...');
    const tokenParams = {
      issuer: partyResult.party,
      tokenName: 'TEST_FIX_TOKEN',
      currency: 'USD',
      quantityPrecision: 2,
      pricePrecision: 2,
      description: 'Test token to verify template ID fix'
    };
    
    const tokenResult = await client.createToken(tokenParams);
    console.log(`   ✅ Token created successfully!`);
    console.log(`   Contract ID: ${tokenResult.contractId}`);
    console.log(`   Token Name: ${tokenResult.metadata.tokenName}`);
    
    // Test token retrieval
    console.log('\n🔍 Testing token retrieval...');
    const tokens = await client.getAllTokens(partyResult.party);
    console.log(`   Found ${tokens.length} tokens`);
    
    const createdToken = tokens.find(t => t.metadata.tokenName === 'TEST_FIX_TOKEN');
    if (createdToken) {
      console.log(`   ✅ Created token found in ledger`);
      console.log(`   Token details: ${JSON.stringify(createdToken.metadata, null, 2)}`);
    } else {
      console.log(`   ⚠️  Created token not found in query results`);
    }
    
    console.log('\n🎉 Template ID fix verification completed successfully!');
    console.log('   The DAML contracts are now properly deployed and accessible.');
    
    return true;
    
  } catch (error) {
    console.error('\n❌ Template ID fix test failed:', error);
    
    if (error.message && error.message.includes('Cannot resolve template ID')) {
      console.log('\n💡 The template ID issue is still present. This means:');
      console.log('   1. The DAML contracts may not be properly deployed');
      console.log('   2. The ledger may have old contracts with different template IDs');
      console.log('   3. Try restarting the DAML sandbox: npm run daml:start');
    }
    
    return false;
  }
}

// Run the test
testTemplateIdFix().then(success => {
  if (success) {
    console.log('\n✅ All tests passed! Template ID issue is resolved.');
    process.exit(0);
  } else {
    console.log('\n❌ Tests failed. Template ID issue may still exist.');
    process.exit(1);
  }
}).catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});