// Direct test of proposal-acceptance functionality using DAML client
const path = require('path');

// Set up the environment to use the DAML client
process.env.DAML_LEDGER_HTTP_URL = 'http://localhost:7575';

async function testProposalAcceptanceDirect() {
  console.log('=== Testing Proposal-Acceptance Flow Directly ===');
  
  try {
    // Import the DAML client (need to use dynamic import for ES modules)
    const { damlClient } = await import('./src/lib/daml-client.ts');
    
    console.log('DAML client imported successfully');
    
    // Test parties
    const alice = 'Alice::1220a438dc62a4f562fa647216e464cf148cd63e55fb0f2fc01ab7ac9a1bcbf22459';
    const bob = 'Bob::1220a438dc62a4f562fa647216e464cf148cd63e55fb0f2fc01ab7ac9a1bcbf22459';
    
    // Step 1: Create a new token (should use new template)
    console.log('\n1. Creating a new token with new template...');
    const tokenResult = await damlClient.createToken({
      issuer: alice,
      tokenName: 'DirectProposalTest',
      currency: 'USD',
      quantityPrecision: 2,
      pricePrecision: 2,
      description: 'Token for direct proposal testing'
    });
    
    console.log('Token created:', tokenResult);
    const tokenName = 'DirectProposalTest';
    
    // Step 2: Mint tokens to Alice
    console.log('\n2. Minting tokens to Alice...');
    const mintResult = await damlClient.mintTokens({
      issuer: alice,
      recipient: alice,
      tokenName: tokenName,
      amount: '1000.0'
    });
    
    console.log('Mint result:', mintResult);
    
    // Step 3: Check Alice's holdings
    console.log('\n3. Checking Alice\'s holdings...');
    const aliceHoldings = await damlClient.getHoldings(alice);
    const aliceToken = aliceHoldings.find(h => h.holding.tokenName === tokenName);
    console.log('Alice\'s DirectProposalTest holding:', aliceToken);
    
    if (!aliceToken) {
      throw new Error('Alice does not have the DirectProposalTest token');
    }
    
    // Step 4: Create transfer proposal
    console.log('\n4. Creating transfer proposal (Alice -> Bob)...');
    const transferResult = await damlClient.transferTokens({
      from: alice,
      to: bob,
      tokenName: tokenName,
      amount: '250.0'
    });
    
    console.log('Transfer result:', transferResult);
    
    if (!transferResult.requiresAcceptance) {
      console.log('Transfer completed directly (legacy template)');
      return;
    }
    
    // Step 5: Check Bob's pending proposals
    console.log('\n5. Checking Bob\'s pending proposals...');
    const proposals = await damlClient.getPendingTransferProposals(bob);
    console.log('Bob\'s pending proposals:', proposals);
    
    const ourProposal = proposals.find(p => p.proposal.tokenName === tokenName);
    if (!ourProposal) {
      throw new Error('Proposal not found in Bob\'s pending proposals');
    }
    
    // Step 6: Accept the proposal
    console.log('\n6. Bob accepting the transfer proposal...');
    const acceptResult = await damlClient.acceptTransferProposal({
      recipientPartyId: bob,
      proposalId: ourProposal.contractId
    });
    
    console.log('Accept result:', acceptResult);
    
    // Step 7: Verify the transfer
    console.log('\n7. Verifying transfer completion...');
    
    const aliceFinalHoldings = await damlClient.getHoldings(alice);
    const bobFinalHoldings = await damlClient.getHoldings(bob);
    
    const aliceFinalToken = aliceFinalHoldings.find(h => h.holding.tokenName === tokenName);
    const bobFinalToken = bobFinalHoldings.find(h => h.holding.tokenName === tokenName);
    
    console.log('Alice\'s final DirectProposalTest balance:', aliceFinalToken?.holding.amount || '0');
    console.log('Bob\'s final DirectProposalTest balance:', bobFinalToken?.holding.amount || '0');
    
    // Check remaining proposals
    const finalProposals = await damlClient.getPendingTransferProposals(bob);
    const remainingProposals = finalProposals.filter(p => p.proposal.tokenName === tokenName);
    console.log('Remaining proposals for DirectProposalTest:', remainingProposals.length);
    
    console.log('\n=== Direct Proposal-Acceptance Test Complete ===');
    console.log('Expected results:');
    console.log('- Alice should have 750.0 DirectProposalTest (1000 - 250)');
    console.log('- Bob should have 250.0 DirectProposalTest');
    console.log('- No remaining proposals for this token');
    
  } catch (error) {
    console.error('Direct test failed:', error);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }
}

testProposalAcceptanceDirect();