#!/bin/bash

echo "=== Testing Proposal-Acceptance Flow with Existing Token ==="

# Use existing token "test-8" with contract ID
TOKEN_ID="00b5df0177d674c5749b0ffee0c6948a7269b877a7331e116435920d2cf9723771ca021220688e21c38da115048d4f7b8aada9334db3e0fda882970f1c01f0179cef153b6c"
TOKEN_NAME="test-8"

echo "Using existing token: $TOKEN_NAME"
echo "Token ID: $TOKEN_ID"

# Step 1: Check Alice's current holdings for this token
echo -e "\n1. Checking Alice's current holdings for $TOKEN_NAME..."
ALICE_HOLDINGS=$(curl -s "http://localhost:3000/api/holdings?partyId=Alice::1220a438dc62a4f562fa647216e464cf148cd63e55fb0f2fc01ab7ac9a1bcbf22459")
echo "Alice's holdings: $ALICE_HOLDINGS"

# Extract Alice's balance for test-8 token (basic parsing)
ALICE_BALANCE=$(echo "$ALICE_HOLDINGS" | grep -o '"tokenName":"test-8"[^}]*"amount":"[^"]*"' | grep -o '"amount":"[^"]*"' | cut -d'"' -f4)
echo "Alice's current test-8 balance: $ALICE_BALANCE"

if [ -z "$ALICE_BALANCE" ] || [ "$ALICE_BALANCE" = "0" ]; then
  echo "Alice has no test-8 tokens. Let's mint some first..."
  
  # Mint some tokens to Alice
  MINT_RESULT=$(curl -s -X POST http://localhost:3000/api/mint \
    -H "Content-Type: application/json" \
    -d "{
      \"recipientPartyId\": \"Alice::1220a438dc62a4f562fa647216e464cf148cd63e55fb0f2fc01ab7ac9a1bcbf22459\",
      \"tokenId\": \"$TOKEN_ID\",
      \"amount\": \"200.0\"
    }")
  
  echo "Mint result: $MINT_RESULT"
  
  # Check Alice's holdings again
  ALICE_HOLDINGS=$(curl -s "http://localhost:3000/api/holdings?partyId=Alice::1220a438dc62a4f562fa647216e464cf148cd63e55fb0f2fc01ab7ac9a1bcbf22459")
  ALICE_BALANCE=$(echo "$ALICE_HOLDINGS" | grep -o '"tokenName":"test-8"[^}]*"amount":"[^"]*"' | grep -o '"amount":"[^"]*"' | cut -d'"' -f4)
  echo "Alice's new test-8 balance: $ALICE_BALANCE"
fi

# Step 2: Create transfer proposal (Alice -> Bob)
echo -e "\n2. Creating transfer proposal (Alice -> Bob) for 50.0 test-8 tokens..."
TRANSFER_RESULT=$(curl -s -X POST http://localhost:3000/api/transfer \
  -H "Content-Type: application/json" \
  -d "{
    \"senderPartyId\": \"Alice::1220a438dc62a4f562fa647216e464cf148cd63e55fb0f2fc01ab7ac9a1bcbf22459\",
    \"recipientPartyId\": \"Bob::1220a438dc62a4f562fa647216e464cf148cd63e55fb0f2fc01ab7ac9a1bcbf22459\",
    \"tokenId\": \"$TOKEN_ID\",
    \"amount\": \"50.0\"
  }")

echo "Transfer result: $TRANSFER_RESULT"

# Check if proposal was created or transfer completed directly
REQUIRES_ACCEPTANCE=$(echo "$TRANSFER_RESULT" | grep -o '"requiresAcceptance":true')
if [ -z "$REQUIRES_ACCEPTANCE" ]; then
  echo "Transfer completed directly (legacy template), no proposal created"
  
  # Check final balances
  echo -e "\n3. Checking final balances after direct transfer..."
  ALICE_FINAL=$(curl -s "http://localhost:3000/api/holdings?partyId=Alice::1220a438dc62a4f562fa647216e464cf148cd63e55fb0f2fc01ab7ac9a1bcbf22459")
  BOB_FINAL=$(curl -s "http://localhost:3000/api/holdings?partyId=Bob::1220a438dc62a4f562fa647216e464cf148cd63e55fb0f2fc01ab7ac9a1bcbf22459")
  
  ALICE_NEW_BALANCE=$(echo "$ALICE_FINAL" | grep -o '"tokenName":"test-8"[^}]*"amount":"[^"]*"' | grep -o '"amount":"[^"]*"' | cut -d'"' -f4)
  BOB_NEW_BALANCE=$(echo "$BOB_FINAL" | grep -o '"tokenName":"test-8"[^}]*"amount":"[^"]*"' | grep -o '"amount":"[^"]*"' | cut -d'"' -f4)
  
  echo "Alice's final test-8 balance: $ALICE_NEW_BALANCE"
  echo "Bob's final test-8 balance: $BOB_NEW_BALANCE"
  
  exit 0
fi

# Extract proposal ID
PROPOSAL_ID=$(echo "$TRANSFER_RESULT" | grep -o '"proposalId":"[^"]*"' | cut -d'"' -f4)
echo "Proposal created with ID: $PROPOSAL_ID"

if [ -z "$PROPOSAL_ID" ]; then
  echo "Failed to extract proposal ID"
  exit 1
fi

# Step 3: Check Bob's pending proposals
echo -e "\n3. Checking Bob's pending proposals..."
BOB_PROPOSALS=$(curl -s "http://localhost:3000/api/transfer/proposals?partyId=Bob::1220a438dc62a4f562fa647216e464cf148cd63e55fb0f2fc01ab7ac9a1bcbf22459")
echo "Bob's pending proposals: $BOB_PROPOSALS"

# Step 4: Accept the proposal (Bob accepts)
echo -e "\n4. Bob accepting the transfer proposal..."
ACCEPT_RESULT=$(curl -s -X POST http://localhost:3000/api/transfer/accept \
  -H "Content-Type: application/json" \
  -d "{
    \"proposalId\": \"$PROPOSAL_ID\",
    \"recipientPartyId\": \"Bob::1220a438dc62a4f562fa647216e464cf148cd63e55fb0f2fc01ab7ac9a1bcbf22459\"
  }")

echo "Accept result: $ACCEPT_RESULT"

# Step 5: Verify transfer completion
echo -e "\n5. Verifying transfer completion..."

# Check Alice's remaining balance
ALICE_FINAL=$(curl -s "http://localhost:3000/api/holdings?partyId=Alice::1220a438dc62a4f562fa647216e464cf148cd63e55fb0f2fc01ab7ac9a1bcbf22459")
BOB_FINAL=$(curl -s "http://localhost:3000/api/holdings?partyId=Bob::1220a438dc62a4f562fa647216e464cf148cd63e55fb0f2fc01ab7ac9a1bcbf22459")

ALICE_NEW_BALANCE=$(echo "$ALICE_FINAL" | grep -o '"tokenName":"test-8"[^}]*"amount":"[^"]*"' | grep -o '"amount":"[^"]*"' | cut -d'"' -f4)
BOB_NEW_BALANCE=$(echo "$BOB_FINAL" | grep -o '"tokenName":"test-8"[^}]*"amount":"[^"]*"' | grep -o '"amount":"[^"]*"' | cut -d'"' -f4)

echo "Alice's final test-8 balance: $ALICE_NEW_BALANCE"
echo "Bob's final test-8 balance: $BOB_NEW_BALANCE"

# Check remaining proposals
FINAL_PROPOSALS=$(curl -s "http://localhost:3000/api/transfer/proposals?partyId=Bob::1220a438dc62a4f562fa647216e464cf148cd63e55fb0f2fc01ab7ac9a1bcbf22459")
PROPOSAL_COUNT=$(echo "$FINAL_PROPOSALS" | grep -o '"proposals":\[[^]]*\]' | grep -o '{"id"' | wc -l)
echo "Bob's remaining proposals count: $PROPOSAL_COUNT"

echo -e "\n=== Proposal-Acceptance Flow Test Complete ==="
echo "Expected results:"
echo "- Alice should have reduced balance (original - 50.0)"
echo "- Bob should have increased balance (original + 50.0)"
echo "- Bob should have 0 pending proposals for this specific proposal"