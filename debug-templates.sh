#!/bin/bash

echo "🔍 DAML Template Debugging"
echo "========================="

echo ""
echo "📋 Testing template IDs against DAML ledger..."

# DAML HTTP JSON API endpoint
DAML_URL="http://localhost:7575"

# Create a simple JWT for testing
create_jwt() {
    local party="$1"
    local header='{"alg":"HS256","typ":"JWT"}'
    local payload="{\"aud\":\"daml-ledger-api\",\"sub\":\"$party\",\"exp\":$(($(date +%s) + 3600)),\"iat\":$(date +%s),\"ledgerId\":\"sandbox\",\"participantId\":\"sandbox-participant\",\"applicationId\":\"canton-tokenization-demo\",\"actAs\":[\"$party\"],\"readAs\":[\"$party\"],\"admin\":false}"
    
    local header_b64=$(echo -n "$header" | base64 | tr -d '=' | tr '/+' '_-' | tr -d '\n')
    local payload_b64=$(echo -n "$payload" | base64 | tr -d '=' | tr '/+' '_-' | tr -d '\n')
    local signature="local-dev-signature"
    local signature_b64=$(echo -n "$signature" | base64 | tr -d '=' | tr '/+' '_-' | tr -d '\n')
    
    echo "$header_b64.$payload_b64.$signature_b64"
}

# Test party
PARTY="sandbox::1220a438dc62a4f562fa647216e464cf148cd63e55fb0f2fc01ab7ac9a1bcbf22459"
JWT=$(create_jwt "$PARTY")

echo "Using party: $PARTY"
echo ""

# Template IDs to test
declare -a TEMPLATE_IDS=(
    "a636b4833c07b7e428d8abdf95d3b47ec9daec1d97fb7bb0965adcedd03fc458:CIP0056Token:TokenMetadata"
    "cb35be9090c18b08e25f727a8b6c06623386042b84ecb3e07f7638610d1ace5d:CIP0056Token:TokenMetadata"
    "ac3a226c1e1a84ec06dc8438b570386218774432cc00f0f7d08cafeede599283:CIP0056Token:TokenMetadata"
)

declare -a TEMPLATE_NAMES=(
    "NEW"
    "PREVIOUS"
    "LEGACY"
)

# Test each template ID
for i in "${!TEMPLATE_IDS[@]}"; do
    template_id="${TEMPLATE_IDS[$i]}"
    template_name="${TEMPLATE_NAMES[$i]}"
    
    echo "🧪 Testing $template_name template: $template_id"
    
    # Create query request
    query_data="{\"templateIds\":[\"$template_id\"]}"
    
    # Make request
    response=$(curl -s -X POST "$DAML_URL/v1/query" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $JWT" \
        -d "$query_data" \
        -w "HTTP_STATUS:%{http_code}")
    
    # Extract HTTP status
    http_status=$(echo "$response" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
    response_body=$(echo "$response" | sed 's/HTTP_STATUS:[0-9]*$//')
    
    if [ "$http_status" = "200" ]; then
        echo "   ✅ SUCCESS: Template ID is valid"
        # Count results
        result_count=$(echo "$response_body" | jq '.result | length' 2>/dev/null || echo "0")
        echo "   📊 Found $result_count contracts with this template"
    else
        echo "   ❌ FAILED: HTTP $http_status"
        error_msg=$(echo "$response_body" | jq -r '.errors[0]' 2>/dev/null || echo "$response_body")
        echo "   💬 Error: $error_msg"
    fi
    echo ""
done

echo "🎯 Recommendation:"
echo "Use the template ID that shows ✅ SUCCESS for token creation."
echo ""

# Also test if we can get available packages
echo "📦 Checking available packages..."
packages_response=$(curl -s -X GET "$DAML_URL/v1/packages" \
    -H "Authorization: Bearer $JWT" \
    -w "HTTP_STATUS:%{http_code}")

packages_status=$(echo "$packages_response" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
packages_body=$(echo "$packages_response" | sed 's/HTTP_STATUS:[0-9]*$//')

if [ "$packages_status" = "200" ]; then
    echo "   ✅ Packages endpoint accessible"
    package_count=$(echo "$packages_body" | jq '.result | length' 2>/dev/null || echo "unknown")
    echo "   📊 Found $package_count packages"
    
    # Look for CIP0056Token packages
    echo "   🔍 CIP0056Token packages:"
    echo "$packages_body" | jq -r '.result[] | select(contains("CIP0056Token")) | "   - " + .' 2>/dev/null || echo "   No CIP0056Token packages found"
else
    echo "   ❌ Cannot access packages: HTTP $packages_status"
fi