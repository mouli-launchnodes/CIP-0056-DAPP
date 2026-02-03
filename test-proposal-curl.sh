#!/bin/bash

echo "=== Testing Complete Proposal-Acceptance Flow with curl ==="

# Step 1: Create a new token
echo -e "\n1. Creating a new token for proposal testing..."
CREATE_RESULT=$(curl -s -X POST http://localhost:3000/api/tokens \
  -H "Content-Type: application/json" \
  -d '{
    "tokenName": "ProposalTestToken2",
    "currency": "USD",
    "quantityPrecision": 2,
    "pricePrecision": 2,
    "description": "Token for testing proposal-acceptance flow"
  }')

echo "Token creation result: $CREATE_RESULT"

# Extract token ID (basic parsing)
TOKEN_ID=$(echo "$CREATE_RESULT" | grep -o '"contractId":"[^"]*"' | cut -d'"' -f4)
echo "Created token ID: $TOKEN_ID"

if [ -z "$TOKEN_ID" ]; then
  echo "Failed to create token or extract token ID"
  exit 1
fi

# Step 2: Mint tokens to Alice
echo -e "\n2. Minting tokens to Alice..."
MINT_RESULT=$(curl -s -X POST http://localhost:3000/api/mint \
  -H "Content-Type: application/json" \
  -d "{
    \"recipientPartyId\": \"Alice::1220a438dc62a4f562fa647216e464cf148cd63e55fb0f2fc01ab7ac9a1bcbf22459\",
    \"tokenId\": \"$TOKEN_ID\",
    \"amount\": \"500.0\"
  }")

echo "Mint result: $MINT_RESULT"

# Step 3: Check Alice's holdings
echo -e "\n3. Checking Alice's holdings..."
ALICE_HOLDINGS=$(curl -s "http://localhost:3000/api/holdings?partyId=Alice::1220a438dc62a4f562fa647216e464cf148cd63e55fb0f2fc01ab7ac9a1bcbf22459")
echo "Alice's holdings: $ALICE_HOLDINGS"

# Step 4: Create transfer proposal (Alice -> Bob)
echo -e "\n4. Creating transfer proposal (Alice -> Bob)..."
TRANSFER_RESULT=$(curl -s -X POST http://localhost:3000/api/transfer \
  -H "Content-Type: application/json" \
  -d "{
    \"senderPartyId\": \"Alice::1220a438dc62a4f562fa647216e464cf148cd63e55fb0f2fc01ab7ac9a1bcbf22459\",
    \"recipientPartyId\": \"Bob::1220a438dc62a4f562fa647216e464cf148cd63e55fb0f2fc01ab7ac9a1bcbf22459\",
    \"tokenId\": \"$TOKEN_ID\",
    \"amount\": \"100.0\"
  }")

echo "Transfer result: $TRANSFER_RESULT"

# Check if proposal was created
REQUIRES_ACCEPTANCE=$(echo "$TRANSFER_RESULT" | grep -o '"requiresAcceptance":true')
if [ -z "$REQUIRES_ACCEPTANCE" ]; then
  echo "Transfer completed directly (legacy template), no proposal created"
  exit 0
fi

# Extract proposal ID
PROPOSAL_ID=$(echo "$TRANSFER_RESULT" | grep -o '"proposalId":"[^"]*"' | cut -d'"' -f4)
echo "Proposal created with ID: $PROPOSAL_ID"

if [ -z "$PROPOSAL_ID" ]; then
  echo "Failed to extract proposal ID"
  exit 1
fi

# Step 5: Check Bob's pending proposals
echo -e "\n5. Checking Bob's pending proposals..."
BOB_PROPOSALS=$(curl -s "http://localhost:3000/api/transfer/proposals?partyId=Bob::1220a438dc62a4f562fa647216e464cf148cd63e55fb0f2fc01ab7ac9a1bcbf22459")
echo "Bob's pending proposals: $BOB_PROPOSALS"

# Step 6: Accept the proposal (Bob accepts)
echo -e "\n6. Bob accepting the transfer proposal..."
ACCEPT_RESULT=$(curl -s -X POST http://localhost:3000/api/transfer/accept \
  -H "Content-Type: application/json" \
  -d "{
    \"proposalId\": \"$PROPOSAL_ID\",
    \"recipientPartyId\": \"Bob::1220a438dc62a4f562fa647216e464cf148cd63e55fb0f2fc01ab7ac9a1bcbf22459\"
  }")

echo "Accept result: $ACCEPT_RESULT"

# Step 7: Verify transfer completion
echo -e "\n7. Verifying transfer completion..."

# Check Alice's remaining balance
ALICE_FINAL=$(curl -s "http://localhost:3000/api/holdings?partyId=Alice::1220a438dc62a4f562fa647216e464cf148cd63e55fb0f2fc01ab7ac9a1bcbf22459")
echo "Alice's final holdings: $ALICE_FINAL"

# Check Bob's new balance
BOB_FINAL=$(curl -s "http://localhost:3000/api/holdings?partyId=Bob::1220a438dc62a4f562fa647216e464cf148cd63e55fb0f2fc01ab7ac9a1bcbf22459")
echo "Bob's final holdings: $BOB_FINAL"

# Check remaining proposals
FINAL_PROPOSALS=$(curl -s "http://localhost:3000/api/transfer/proposals?partyId=Bob::1220a438dc62a4f562fa647216e464cf148cd63e55fb0f2fc01ab7ac9a1bcbf22459")
echo "Bob's remaining proposals: $FINAL_PROPOSALS"

echo -e "\n=== Proposal-Acceptance Flow Test Complete ==="
echo "Expected results:"
echo "- Alice should have 400.0 ProposalTestToken2 (500 - 100)"
echo "- Bob should have 100.0 ProposalTestToken2"
echo "- Bob should have 0 pending proposals"