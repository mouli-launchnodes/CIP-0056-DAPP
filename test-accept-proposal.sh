#!/bin/bash

echo "=== Testing Proposal Acceptance ==="

BOB="Bob::1220a438dc62a4f562fa647216e464cf148cd63e55fb0f2fc01ab7ac9a1bcbf22459"

# Get Bob's first proposal (tyty token for 10.0)
PROPOSAL_ID="0049d390a9a41eb809931b9149f384d07d54c3ee72515b8b1189083bc48cef082fca021220fd4bc2d97aaf3d9d1e2d85706b7e658f4d562de20efdf9f16d8762261c94319f"

echo "Bob will accept proposal: $PROPOSAL_ID"
echo "Token: tyty, Amount: 10.0"

# Step 1: Check Bob's current tyty balance
echo -e "\n1. Checking Bob's current tyty balance..."
BOB_HOLDINGS=$(curl -s "http://localhost:3000/api/holdings?partyId=$BOB")
BOB_TYTY_BALANCE=$(echo "$BOB_HOLDINGS" | grep -o '"tokenName":"tyty"[^}]*"totalBalance":"[^"]*"' | grep -o '"totalBalance":"[^"]*"' | cut -d'"' -f4)
echo "Bob's current tyty balance: ${BOB_TYTY_BALANCE:-0}"

# Step 2: Accept the proposal
echo -e "\n2. Bob accepting the tyty proposal..."
ACCEPT_RESULT=$(curl -s -X POST http://localhost:3000/api/transfer/accept \
  -H "Content-Type: application/json" \
  -d "{
    \"proposalId\": \"$PROPOSAL_ID\",
    \"recipientPartyId\": \"$BOB\"
  }")

echo "Accept result: $ACCEPT_RESULT"

# Step 3: Check if acceptance was successful
SUCCESS=$(echo "$ACCEPT_RESULT" | grep -o '"success":true')
if [ -n "$SUCCESS" ]; then
  echo -e "\n✅ Proposal accepted successfully!"
  
  # Wait for transaction to process
  sleep 2
  
  # Step 4: Check Bob's new balance
  echo -e "\n4. Checking Bob's new tyty balance..."
  BOB_FINAL_HOLDINGS=$(curl -s "http://localhost:3000/api/holdings?partyId=$BOB")
  BOB_FINAL_TYTY_BALANCE=$(echo "$BOB_FINAL_HOLDINGS" | grep -o '"tokenName":"tyty"[^}]*"totalBalance":"[^"]*"' | grep -o '"totalBalance":"[^"]*"' | cut -d'"' -f4)
  echo "Bob's new tyty balance: ${BOB_FINAL_TYTY_BALANCE:-0}"
  
  # Step 5: Check remaining proposals
  echo -e "\n5. Checking remaining proposals..."
  REMAINING_PROPOSALS=$(curl -s "http://localhost:3000/api/transfer/proposals?partyId=$BOB")
  PROPOSAL_COUNT=$(echo "$REMAINING_PROPOSALS" | grep -o '"proposals":\[[^]]*\]' | grep -o '{"id"' | wc -l)
  echo "Bob's remaining proposals: $PROPOSAL_COUNT"
  
  echo -e "\nExpected results:"
  echo "- Bob should have received 10.0 tyty tokens"
  echo "- Bob should have 4 remaining proposals (5 - 1 accepted)"
  
else
  echo -e "\n❌ Proposal acceptance failed"
  ERROR=$(echo "$ACCEPT_RESULT" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)
  echo "Error: $ERROR"
fi

echo -e "\n=== Proposal Acceptance Test Complete ==="