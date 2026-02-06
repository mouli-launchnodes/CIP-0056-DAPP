#!/usr/bin/env node

/**
 * Simple test to verify the new template ID is working
 */

// Use dynamic import for fetch in Node.js
async function testTemplateId() {
  console.log('🧪 Testing new template ID...');
  
  try {
    // Dynamic import for fetch
    const { default: fetch } = await import('node-fetch');
    
    const BASE_URL = 'http://localhost:3000';
    
    // Try to create a simple test token
    const tokenData = {
      tokenName: 'TEMPLATE_TEST',
      currency: 'USD',
      quantityPrecision: 2,
      pricePrecision: 2,
      description: 'Test token to verify template ID'
    };
    
    console.log('Creating test token with new template ID...');
    
    const response = await fetch(`${BASE_URL}/api/tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tokenData),
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ SUCCESS: New template ID is working!');
      console.log('Contract ID:', result.contract.contractId);
      console.log('Token Name:', result.contract.metadata.tokenName);
      return true;
    } else {
      console.log('❌ FAILED: Template ID issue');
      console.log('Error:', result.error);
      console.log('Details:', result.details);
      return false;
    }
    
  } catch (error) {
    console.log('❌ ERROR:', error.message);
    return false;
  }
}

// Run the test
if (require.main === module) {
  testTemplateId().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { testTemplateId };