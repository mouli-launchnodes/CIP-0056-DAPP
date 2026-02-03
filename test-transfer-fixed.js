// Test script to verify transfer functionality with fixed template detection
const fetch = require('node-fetch');

async function testTransfer() {
  try {
    console.log('Testing transfer functionality...');
    
    // Test transfer API call
    const transferResponse = await fetch('http://localhost:3000/api/transfer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'appSession=eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..test-session-token'
      },
      body: JSON.stringify({
        from: 'Alice::1220a438dc62a4f562fa647216e464cf148cd63e55fb0f2fc01ab7ac9a1bcbf22459',
        to: 'Bob::1220a438dc62a4f562fa647216e464cf148cd63e55fb0f2fc01ab7ac9a1bcbf22459',
        tokenName: 'yayayaya',
        amount: '5.0'
      })
    });

    const transferResult = await transferResponse.text();
    console.log('Transfer response status:', transferResponse.status);
    console.log('Transfer response:', transferResult);

    if (transferResponse.ok) {
      console.log('✅ Transfer test PASSED');
    } else {
      console.log('❌ Transfer test FAILED');
    }

  } catch (error) {
    console.error('Transfer test error:', error);
  }
}

testTransfer();