// Use built-in fetch (Node.js 18+) or fallback to node-fetch
let fetch;
try {
  fetch = globalThis.fetch;
  if (!fetch) {
    fetch = require('node-fetch');
  }
} catch (e) {
  console.log('Using curl for HTTP requests');
}

async function testProposalAcceptanceFlow() {
  console.log('=== Testing Complete Proposal-Acceptance Flow ===');
  
  try {
    // Step 1: Create a new token with current template (should use new template)
    console.log('\n1. Creating a new token for proposal testing...');
    const createTokenResponse = await fetch('http://localhost:3000/api/tokens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tokenName: 'ProposalTestToken',
        currency: 'USD',
        quantityPrecision: 2,
        pricePrecision: 2,
        description: 'Token for testing proposal-acceptance flow'
      })
    });
    
    const createResult = await createTokenResponse.json();
    console.log('Token creation result:', createResult);
    
    if (!createResult.success) {
      throw new Error('Failed to create token: ' + createResult.error);
    }
    
    const tokenId = createResult.token.contractId;
    console.log('Created token ID:', tokenId);
    
    // Step 2: Mint some tokens to Alice
    console.log('\n2. Minting tokens to Alice...');
    const mintResponse = await fetch('http://localhost:3000/api/mint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipientPartyId: 'Alice::1220a438dc62a4f562fa647216e464cf148cd63e55fb0f2fc01ab7ac9a1bcbf22459',
        tokenId: tokenId,
        amount: '500.0'
      })
    });
    
    const mintResult = await mintResponse.json();
    console.log('Mint result:', mintResult);
    
    if (!mintResult.success) {
      throw new Error('Failed to mint tokens: ' + mintResult.error);
    }
    
    // Step 3: Check Alice's holdings
    console.log('\n3. Checking Alice\'s holdings...');
    const holdingsResponse = await fetch('http://localhost:3000/api/holdings?partyId=Alice::1220a438dc62a4f562fa647216e464cf148cd63e55fb0f2fc01ab7ac9a1bcbf22459');
    const holdingsResult = await holdingsResponse.json();
    console.log('Alice\'s holdings:', holdingsResult.holdings?.filter(h => h.tokenName === 'ProposalTestToken'));
    
    // Step 4: Create a transfer proposal (Alice -> Bob)
    console.log('\n4. Creating transfer proposal (Alice -> Bob)...');
    const transferResponse = await fetch('http://localhost:3000/api/transfer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderPartyId: 'Alice::1220a438dc62a4f562fa647216e464cf148cd63e55fb0f2fc01ab7ac9a1bcbf22459',
        recipientPartyId: 'Bob::1220a438dc62a4f562fa647216e464cf148cd63e55fb0f2fc01ab7ac9a1bcbf22459',
        tokenId: tokenId,
        amount: '100.0'
      })
    });
    
    const transferResult = await transferResponse.json();
    console.log('Transfer result:', transferResult);
    
    if (!transferResult.success) {
      throw new Error('Failed to create transfer proposal: ' + transferResult.error);
    }
    
    if (!transferResult.requiresAcceptance) {
      console.log('Transfer completed directly (legacy template), no proposal created');
      return;
    }
    
    const proposalId = transferResult.proposalId;
    console.log('Proposal created with ID:', proposalId);
    
    // Step 5: Check Bob's pending proposals
    console.log('\n5. Checking Bob\'s pending proposals...');
    const proposalsResponse = await fetch('http://localhost:3000/api/transfer/proposals?partyId=Bob::1220a438dc62a4f562fa647216e464cf148cd63e55fb0f2fc01ab7ac9a1bcbf22459');
    const proposalsResult = await proposalsResponse.json();
    console.log('Bob\'s pending proposals:', proposalsResult.proposals);
    
    // Step 6: Accept the proposal (Bob accepts)
    console.log('\n6. Bob accepting the transfer proposal...');
    const acceptResponse = await fetch('http://localhost:3000/api/transfer/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        proposalId: proposalId,
        recipientPartyId: 'Bob::1220a438dc62a4f562fa647216e464cf148cd63e55fb0f2fc01ab7ac9a1bcbf22459'
      })
    });
    
    const acceptResult = await acceptResponse.json();
    console.log('Accept result:', acceptResult);
    
    if (!acceptResult.success) {
      throw new Error('Failed to accept proposal: ' + acceptResult.error);
    }
    
    // Step 7: Verify the transfer completed
    console.log('\n7. Verifying transfer completion...');
    
    // Check Alice's remaining balance
    const aliceHoldingsResponse = await fetch('http://localhost:3000/api/holdings?partyId=Alice::1220a438dc62a4f562fa647216e464cf148cd63e55fb0f2fc01ab7ac9a1bcbf22459');
    const aliceHoldingsResult = await aliceHoldingsResponse.json();
    const aliceProposalTestToken = aliceHoldingsResult.holdings?.find(h => h.tokenName === 'ProposalTestToken');
    console.log('Alice\'s remaining ProposalTestToken balance:', aliceProposalTestToken?.amount || '0');
    
    // Check Bob's new balance
    const bobHoldingsResponse = await fetch('http://localhost:3000/api/holdings?partyId=Bob::1220a438dc62a4f562fa647216e464cf148cd63e55fb0f2fc01ab7ac9a1bcbf22459');
    const bobHoldingsResult = await bobHoldingsResponse.json();
    const bobProposalTestToken = bobHoldingsResult.holdings?.find(h => h.tokenName === 'ProposalTestToken');
    console.log('Bob\'s new ProposalTestToken balance:', bobProposalTestToken?.amount || '0');
    
    // Check that no pending proposals remain
    const finalProposalsResponse = await fetch('http://localhost:3000/api/transfer/proposals?partyId=Bob::1220a438dc62a4f562fa647216e464cf148cd63e55fb0f2fc01ab7ac9a1bcbf22459');
    const finalProposalsResult = await finalProposalsResponse.json();
    console.log('Bob\'s remaining pending proposals:', finalProposalsResult.proposals?.length || 0);
    
    console.log('\n=== Proposal-Acceptance Flow Test Complete ===');
    console.log('Expected results:');
    console.log('- Alice should have 400.0 ProposalTestToken (500 - 100)');
    console.log('- Bob should have 100.0 ProposalTestToken');
    console.log('- Bob should have 0 pending proposals');
    
  } catch (error) {
    console.error('Test failed:', error.message);
    console.error('Full error:', error);
  }
}

testProposalAcceptanceFlow();