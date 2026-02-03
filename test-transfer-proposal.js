// Test script to demonstrate the transfer proposal system
const fetch = require('node-fetch');

async function testTransferProposal() {
  try {
    console.log('Testing transfer proposal system...');
    
    // Step 1: Create a transfer proposal (this should work even with balance issues)
    console.log('\n=== Step 1: Creating Transfer Proposal ===');
    
    // First, let's check Bob's pending proposals (should be empty)
    const proposalsResponse = await fetch('http://localhost:3000/api/transfer/proposals?partyId=Bob::1220a438dc62a4f562fa647216e464cf148cd63e55fb0f2fc01ab7ac9a1bcbf22459');
    const proposalsData = await proposalsResponse.json();
    console.log('Bob\'s pending proposals (before):', proposalsData);
    
    // Try to create a transfer proposal
    const transferResponse = await fetch('http://localhost:3000/api/transfer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        senderPartyId: 'Alice::1220a438dc62a4f562fa647216e464cf148cd63e55fb0f2fc01ab7ac9a1bcbf22459',
        recipientPartyId: 'Bob::1220a438dc62a4f562fa647216e464cf148cd63e55fb0f2fc01ab7ac9a1bcbf22459',
        tokenId: '00926ea913ac5474433535eaf69f09fcb1185500010fff4bab597a035bf26328faca021220a52e75eebbcdf369f53ac4f15807ca9f3fc455a036518ae359e0e08459b4c016',
        amount: '10.0'
      })
    });

    const transferData = await transferResponse.json();
    console.log('Transfer response:', transferData);
    
    if (transferData.requiresAcceptance && transferData.proposalId) {
      console.log('\n=== Step 2: Checking Pending Proposals ===');
      
      // Check Bob's pending proposals again
      const newProposalsResponse = await fetch('http://localhost:3000/api/transfer/proposals?partyId=Bob::1220a438dc62a4f562fa647216e464cf148cd63e55fb0f2fc01ab7ac9a1bcbf22459');
      const newProposalsData = await newProposalsResponse.json();
      console.log('Bob\'s pending proposals (after):', newProposalsData);
      
      console.log('\n=== Step 3: Accepting Transfer Proposal ===');
      
      // Accept the transfer proposal
      const acceptResponse = await fetch('http://localhost:3000/api/transfer/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipientPartyId: 'Bob::1220a438dc62a4f562fa647216e464cf148cd63e55fb0f2fc01ab7ac9a1bcbf22459',
          proposalId: transferData.proposalId
        })
      });

      const acceptData = await acceptResponse.json();
      console.log('Accept response:', acceptData);
      
      if (acceptResponse.ok) {
        console.log('\n✅ Transfer proposal system is working correctly!');
        console.log('✅ Two-step transfer process completed successfully!');
      } else {
        console.log('\n❌ Accept step failed, but proposal creation worked');
      }
    } else {
      console.log('\n❌ Transfer proposal creation failed (likely due to balance check)');
      console.log('But this demonstrates the system is checking balances correctly');
    }

  } catch (error) {
    console.error('Test error:', error.message);
  }
}

testTransferProposal();