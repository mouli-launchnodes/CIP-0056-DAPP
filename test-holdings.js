// Test script to check holdings after transfer
const { damlClient } = require('./src/lib/daml-client.ts');

async function checkHoldings() {
  try {
    console.log('Checking holdings after transfer...');
    
    const alice = 'Alice::1220a438dc62a4f562fa647216e464cf148cd63e55fb0f2fc01ab7ac9a1bcbf22459';
    const bob = 'Bob::1220a438dc62a4f562fa647216e464cf148cd63e55fb0f2fc01ab7ac9a1bcbf22459';
    
    console.log('\n=== Alice Holdings ===');
    const aliceHoldings = await damlClient.getHoldings(alice);
    aliceHoldings.forEach(h => {
      console.log(`${h.holding.tokenName}: ${h.holding.amount}`);
    });
    
    console.log('\n=== Bob Holdings ===');
    const bobHoldings = await damlClient.getHoldings(bob);
    bobHoldings.forEach(h => {
      console.log(`${h.holding.tokenName}: ${h.holding.amount}`);
    });
    
    console.log('\n=== Transfer Verification ===');
    const aliceTestQwe = aliceHoldings.find(h => h.holding.tokenName === 'test-qwe-1');
    const bobTestQwe = bobHoldings.find(h => h.holding.tokenName === 'test-qwe-1');
    
    console.log(`Alice test-qwe-1: ${aliceTestQwe ? aliceTestQwe.holding.amount : '0'}`);
    console.log(`Bob test-qwe-1: ${bobTestQwe ? bobTestQwe.holding.amount : '0'}`);
    
    if (aliceTestQwe && parseFloat(aliceTestQwe.holding.amount) === 23.04 && 
        bobTestQwe && parseFloat(bobTestQwe.holding.amount) === 5.0) {
      console.log('✅ Transfer successful! Alice: 23.04, Bob: 5.0');
    } else {
      console.log('❌ Transfer verification failed');
    }
    
  } catch (error) {
    console.error('Holdings check failed:', error);
  } finally {
    await damlClient.close();
  }
}

checkHoldings();