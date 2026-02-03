#!/bin/bash

echo "=== Debugging Transfer Proposals ==="

BOB="Bob::1220a438dc62a4f562fa647216e464cf148cd63e55fb0f2fc01ab7ac9a1bcbf22459"

echo "Bob: $BOB"

# Step 1: Get detailed proposal information
echo -e "\n1. Getting Bob's detailed proposal information..."
PROPOSALS=$(curl -s "http://localhost:3000/api/transfer/proposals?partyId=$BOB")
echo "Proposals response: $PROPOSALS"

# Step 2: Get Bob's notifications to see the proposals
echo -e "\n2. Getting Bob's notifications..."
NOTIFICATIONS=$(curl -s "http://localhost:3000/api/notifications?partyId=$BOB")
echo "Notifications response: $NOTIFICATIONS"

# Step 3: Try to query the DAML ledger directly for TransferProposal contracts
echo -e "\n3. Checking what templates are available in the DAML ledger..."
DEBUG_INFO=$(curl -s "http://localhost:3000/api/debug")
echo "Debug info (token count): $(echo "$DEBUG_INFO" | jq '.debug.tokenCount')"

# Step 4: Let's try to create a new token and test the proposal flow with it
echo -e "\n4. Let's test with a token that should use the new template..."
echo "We need to create a new token to test the proposal-acceptance flow properly."
echo "The existing proposals might be from an older version of the system."

echo -e "\n=== Analysis ==="
echo "The error suggests that:"
echo "1. The proposals exist in the DAML ledger"
echo "2. But they were created with a template that doesn't match our current template IDs"
echo "3. We need to either:"
echo "   a) Fix the template ID detection, or"
echo "   b) Create new proposals with the current template system"

echo -e "\n=== Recommendation ==="
echo "Let's create a new token and test the complete proposal-acceptance flow:"
echo "1. Create new token (will use current template)"
echo "2. Mint tokens to Alice"
echo "3. Alice creates transfer proposal to Bob"
echo "4. Bob accepts/rejects the proposal"