// Test script for transfer functionality with new DAML contracts
const { damlClient } = require('./src/lib/daml-client.ts');

async function testTransfer() {
  try {
    console.log('Testing transfer functionality with new DAML contracts...');
    
    // Test parties
    const alice = 'Alice::1220a438dc62a4f562fa647216e464cf148cd63e55fb0f2fc01ab7ac9a1bcbf22459';
    const bob = 'Bob::1220a438dc62a4f562fa647216e464cf148cd63e55fb0f2fc01ab7ac9a1bcbf22459';
    
    console.log('Step 1: Creating a new token with new template...');
    const tokenResult = await damlClient.createToken({
      issuer: alice,
      tokenName: 'NewTransferTest',
      currency: 'USD',
      quantityPrecision: 2,
      pricePrecision: 2,
      description: 'Token for testing transfer with new contracts'
    });
    
    console.log('Token created:', tokenResult);
    
    console.log('Step 2: Minting tokens to Alice...');
    const mintResult = await damlClient.mintTokens({
      issuer: alice,
      recipient: alice,
      tokenName: 'NewTransferTest',
      amount: '100.0'
    });
    
    console.log('Mint result:', mintResult);
    
    console.log('Step 3: Checking Alice holdings...');
    const aliceHoldings = await damlClient.getHoldings(alice);
    console.log('Alice holdings:', aliceHoldings);
    
    console.log('Step 4: Transferring tokens from Alice to Bob...');
    const transferResult = await damlClient.transferTokens({
      from: alice,
      to: bob,
      tokenName: 'NewTransferTest',
      amount: '25.0'
    });
    
    console.log('Transfer result:', transferResult);
    
    console.log('Step 5: Checking final holdings...');
    const aliceHoldingsAfter = await damlClient.getHoldings(alice);
    const bobHoldingsAfter = await damlClient.getHoldings(bob);
    
    console.log('Alice holdings after transfer:', aliceHoldingsAfter);
    console.log('Bob holdings after transfer:', bobHoldingsAfter);
    
    console.log('Transfer test completed successfully!');
    
  } catch (error) {
    console.error('Transfer test failed:', error);
  } finally {
    await damlClient.close();
  }
}

testTransfer();