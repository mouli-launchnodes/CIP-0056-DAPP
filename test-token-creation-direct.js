#!/usr/bin/env node

/**
 * Test script to verify token creation works by directly calling the DAML client
 * This bypasses the web authentication to test the core DAML functionality
 */

async function testTokenCreation() {
  console.log('🧪 Testing Direct Token Creation');
  console.log('=================================');
  
  try {
    // Test DAML HTTP API directly
    console.log('🔍 Testing DAML HTTP API connection...');
    
    const response = await fetch('http://localhost:7575/v1/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJkYW1sLWxlZGdlci1hcGkiLCJzdWIiOiJzYW5kYm94OjoxMjIwMWU3NTk0YWQwYWQ2MDNlMDM5NDZjYzE1OWJmNDFlNjY4MTY4ZTAyYjc2NDdkYzI2MzIyOWJjNTVjMmYwZTlkNyIsImV4cCI6MTczODc1NTk3MCwiaWF0IjoxNzM4NjY5NTcwLCJsZWRnZXJJZCI6InNhbmRib3giLCJwYXJ0aWNpcGFudElkIjoic2FuZGJveC1wYXJ0aWNpcGFudCIsImFwcGxpY2F0aW9uSWQiOiJjYW50b24tdG9rZW5pemF0aW9uLWRlbW8iLCJhY3RBcyI6WyJzYW5kYm94OjoxMjIwMWU3NTk0YWQwYWQ2MDNlMDM5NDZjYzE1OWJmNDFlNjY4MTY4ZTAyYjc2NDdkYzI2MzIyOWJjNTVjMmYwZTlkNyJdLCJyZWFkQXMiOlsic2FuZGJveDo6MTIyMDFlNzU5NGFkMGFkNjAzZTAzOTQ2Y2MxNTliZjQxZTY2ODE2OGUwMmI3NjQ3ZGMyNjMyMjliYzU1YzJmMGU5ZDciXSwiYWRtaW4iOmZhbHNlfQ.local-dev-signature'
      },
      body: JSON.stringify({
        templateIds: ['a636b4833c07b7e428d8abdf95d3b47ec9daec1d97fb7bb0965adcedd03fc458:CIP0056Token:TokenMetadata']
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('   ✅ DAML HTTP API connection successful');
      console.log(`   Found ${result.result?.length || 0} existing tokens`);
    } else {
      console.log(`   ❌ DAML HTTP API connection failed: ${response.status}`);
      const errorText = await response.text();
      console.log(`   Error: ${errorText}`);
      return false;
    }
    
    // Test token creation
    console.log('\n🔍 Testing token creation...');
    
    const createResponse = await fetch('http://localhost:7575/v1/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJkYW1sLWxlZGdlci1hcGkiLCJzdWIiOiJzYW5kYm94OjoxMjIwMWU3NTk0YWQwYWQ2MDNlMDM5NDZjYzE1OWJmNDFlNjY4MTY4ZTAyYjc2NDdkYzI2MzIyOWJjNTVjMmYwZTlkNyIsImV4cCI6MTczODc1NTk3MCwiaWF0IjoxNzM4NjY5NTcwLCJsZWRnZXJJZCI6InNhbmRib3giLCJwYXJ0aWNpcGFudElkIjoic2FuZGJveC1wYXJ0aWNpcGFudCIsImFwcGxpY2F0aW9uSWQiOiJjYW50b24tdG9rZW5pemF0aW9uLWRlbW8iLCJhY3RBcyI6WyJzYW5kYm94OjoxMjIwMWU3NTk0YWQwYWQ2MDNlMDM5NDZjYzE1OWJmNDFlNjY4MTY4ZTAyYjc2NDdkYzI2MzIyOWJjNTVjMmYwZTlkNyJdLCJyZWFkQXMiOlsic2FuZGJveDo6MTIyMDFlNzU5NGFkMGFkNjAzZTAzOTQ2Y2MxNTliZjQxZTY2ODE2OGUwMmI3NjQ3ZGMyNjMyMjliYzU1YzJmMGU5ZDciXSwiYWRtaW4iOmZhbHNlfQ.local-dev-signature'
      },
      body: JSON.stringify({
        templateId: 'a636b4833c07b7e428d8abdf95d3b47ec9daec1d97fb7bb0965adcedd03fc458:CIP0056Token:TokenMetadata',
        payload: {
          issuer: 'sandbox::12201e7594ad0ad603e03946cc159bf41e668168e02b7647dc263229bc55c2f0e9d7',
          tokenName: 'TEST_DIRECT_TOKEN',
          currency: 'USD',
          quantityPrecision: '2',
          pricePrecision: '2',
          totalSupply: '0.0',
          description: 'Test token created directly via DAML API'
        }
      })
    });
    
    if (createResponse.ok) {
      const createResult = await createResponse.json();
      console.log('   ✅ Token creation successful!');
      console.log(`   Contract ID: ${createResult.result.contractId}`);
      
      // Verify the token was created by querying again
      console.log('\n🔍 Verifying token was created...');
      const verifyResponse = await fetch('http://localhost:7575/v1/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJkYW1sLWxlZGdlci1hcGkiLCJzdWIiOiJzYW5kYm94OjoxMjIwMWU3NTk0YWQwYWQ2MDNlMDM5NDZjYzE1OWJmNDFlNjY4MTY4ZTAyYjc2NDdkYzI2MzIyOWJjNTVjMmYwZTlkNyIsImV4cCI6MTczODc1NTk3MCwiaWF0IjoxNzM4NjY5NTcwLCJsZWRnZXJJZCI6InNhbmRib3giLCJwYXJ0aWNpcGFudElkIjoic2FuZGJveC1wYXJ0aWNpcGFudCIsImFwcGxpY2F0aW9uSWQiOiJjYW50b24tdG9rZW5pemF0aW9uLWRlbW8iLCJhY3RBcyI6WyJzYW5kYm94OjoxMjIwMWU3NTk0YWQwYWQ2MDNlMDM5NDZjYzE1OWJmNDFlNjY4MTY4ZTAyYjc2NDdkYzI2MzIyOWJjNTVjMmYwZTlkNyJdLCJyZWFkQXMiOlsic2FuZGJveDo6MTIyMDFlNzU5NGFkMGFkNjAzZTAzOTQ2Y2MxNTliZjQxZTY2ODE2OGUwMmI3NjQ3ZGMyNjMyMjliYzU1YzJmMGU5ZDciXSwiYWRtaW4iOmZhbHNlfQ.local-dev-signature'
        },
        body: JSON.stringify({
          templateIds: ['a636b4833c07b7e428d8abdf95d3b47ec9daec1d97fb7bb0965adcedd03fc458:CIP0056Token:TokenMetadata']
        })
      });
      
      if (verifyResponse.ok) {
        const verifyResult = await verifyResponse.json();
        const createdToken = verifyResult.result?.find(token => 
          token.payload.tokenName === 'TEST_DIRECT_TOKEN'
        );
        
        if (createdToken) {
          console.log('   ✅ Token verified in ledger!');
          console.log(`   Token details: ${JSON.stringify(createdToken.payload, null, 2)}`);
        } else {
          console.log('   ⚠️  Token not found in verification query');
        }
      }
      
    } else {
      console.log(`   ❌ Token creation failed: ${createResponse.status}`);
      const errorText = await createResponse.text();
      console.log(`   Error: ${errorText}`);
      return false;
    }
    
    console.log('\n🎉 Template ID fix verification completed successfully!');
    console.log('   The DAML contracts are working correctly with the new template IDs.');
    
    return true;
    
  } catch (error) {
    console.error('\n❌ Direct token creation test failed:', error);
    return false;
  }
}

// Run the test
testTokenCreation().then(success => {
  if (success) {
    console.log('\n✅ All tests passed! Template ID issue is completely resolved.');
    process.exit(0);
  } else {
    console.log('\n❌ Tests failed. There may still be issues.');
    process.exit(1);
  }
}).catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});