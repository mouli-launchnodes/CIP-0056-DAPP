#!/bin/bash

echo "=== Testing Legacy Template Transfer Fix ==="

# Use Alice's test-8 token metadata contract ID (not holding contract ID)
TOKEN_ID="00146e34fe1bdea03aef2ab9855f513af08ac142393e02974eaf75841974358b3fca02122070aa8e9b7d241daa9eec2fb9fca56e5d0f381ccacd4c919f7ba6ca977e9ac8ee"
TOKEN_NAME="test-8"

echo "Testing transfer of $TOKEN_NAME token (legacy template)"
echo "Token ID: $TOKEN_ID"

# Step 1: Check Alice's current balance
echo -e "\n1. Checking Alice's current balance..."
ALICE_HOLDINGS=$(curl -s "http://localhost:3000/api/holdings?partyId=Alice::1220a438dc62a4f562fa647216e464cf148cd63e55fb0f2fc01ab7ac9a1bcbf22459")
ALICE_BALANCE=$(echo "$ALICE_HOLDINGS" | grep -o '"tokenName":"test-8"[^}]*"totalBalance":"[^"]*"' | grep -o '"totalBalance":"[^"]*"' | cut -d'"' -f4)
echo "Alice's current test-8 balance: $ALICE_BALANCE"

# Step 2: Check Bob's current balance
echo -e "\n2. Checking Bob's current balance..."
BOB_HOLDINGS=$(curl -s "http://localhost:3000/api/holdings?partyId=Bob::1220a438dc62a4f562fa647216e464cf148cd63e55fb0f2fc01ab7ac9a1bcbf22459")
BOB_BALANCE=$(echo "$BOB_HOLDINGS" | grep -o '"tokenName":"test-8"[^}]*"totalBalance":"[^"]*"' | grep -o '"totalBalance":"[^"]*"' | cut -d'"' -f4)
echo "Bob's current test-8 balance: ${BOB_BALANCE:-0}"

# Step 3: Attempt transfer (should now work with burn-and-mint approach)
echo -e "\n3. Attempting transfer of 25.0 test-8 tokens from Alice to Bob..."
TRANSFER_RESULT=$(curl -s -X POST http://localhost:3000/api/transfer \
  -H "Content-Type: application/json" \
  -d "{
    \"senderPartyId\": \"Alice::1220a438dc62a4f562fa647216e464cf148cd63e55fb0f2fc01ab7ac9a1bcbf22459\",
    \"recipientPartyId\": \"Bob::1220a438dc62a4f562fa647216e464cf148cd63e55fb0f2fc01ab7ac9a1bcbf22459\",
    \"tokenId\": \"$TOKEN_ID\",
    \"amount\": \"25.0\"
  }")

echo "Transfer result: $TRANSFER_RESULT"

# Check if transfer was successful
SUCCESS=$(echo "$TRANSFER_RESULT" | grep -o '"success":true')
if [ -n "$SUCCESS" ]; then
  echo -e "\n✅ Transfer successful! Legacy template fix is working."
  
  # Step 4: Verify final balances
  echo -e "\n4. Verifying final balances..."
  
  # Wait a moment for the transaction to be processed
  sleep 2
  
  # Check Alice's final balance
  ALICE_FINAL=$(curl -s "http://localhost:3000/api/holdings?partyId=Alice::1220a438dc62a4f562fa647216e464cf148cd63e55fb0f2fc01ab7ac9a1bcbf22459")
  ALICE_FINAL_BALANCE=$(echo "$ALICE_FINAL" | grep -o '"tokenName":"test-8"[^}]*"totalBalance":"[^"]*"' | grep -o '"totalBalance":"[^"]*"' | cut -d'"' -f4)
  echo "Alice's final test-8 balance: $ALICE_FINAL_BALANCE"
  
  # Check Bob's final balance
  BOB_FINAL=$(curl -s "http://localhost:3000/api/holdings?partyId=Bob::1220a438dc62a4f562fa647216e464cf148cd63e55fb0f2fc01ab7ac9a1bcbf22459")
  BOB_FINAL_BALANCE=$(echo "$BOB_FINAL" | grep -o '"tokenName":"test-8"[^}]*"totalBalance":"[^"]*"' | grep -o '"totalBalance":"[^"]*"' | cut -d'"' -f4)
  echo "Bob's final test-8 balance: ${BOB_FINAL_BALANCE:-0}"
  
  # Calculate expected balances
  if [ -n "$ALICE_BALANCE" ]; then
    EXPECTED_ALICE=$(echo "$ALICE_BALANCE - 25.0" | bc -l)
    EXPECTED_BOB=$(echo "${BOB_BALANCE:-0} + 25.0" | bc -l)
    
    echo -e "\nExpected results:"
    echo "- Alice should have: $EXPECTED_ALICE"
    echo "- Bob should have: $EXPECTED_BOB"
  fi
  
else
  echo -e "\n❌ Transfer failed. Error details:"
  ERROR=$(echo "$TRANSFER_RESULT" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)
  echo "Error: $ERROR"
fi

echo -e "\n=== Legacy Template Transfer Test Complete ==="