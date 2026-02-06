#!/bin/bash

echo "🧪 Testing Token API Synchronization"
echo "===================================="

echo ""
echo "📊 Fetching current tokens from API..."

# Test the tokens API endpoint
response=$(curl -s -H "Cache-Control: no-cache" -H "Pragma: no-cache" http://localhost:3000/api/tokens)

echo "Raw API Response:"
echo "$response" | jq '.' 2>/dev/null || echo "$response"

echo ""
echo "📋 Parsing token information..."

# Extract token count
token_count=$(echo "$response" | jq '.tokens | length' 2>/dev/null || echo "0")
echo "Total tokens found: $token_count"

if [ "$token_count" -gt 0 ]; then
    echo ""
    echo "Token details:"
    echo "$response" | jq -r '.tokens[] | "- \(.name) (\(.currency)) by \(.issuer)"' 2>/dev/null || echo "Could not parse token details"
    
    # Look for the specific token
    target_token=$(echo "$response" | jq -r '.tokens[] | select(.name == "mouli test-1") | .name' 2>/dev/null)
    
    if [ "$target_token" = "mouli test-1" ]; then
        echo ""
        echo "✅ SUCCESS: Found target token 'mouli test-1'!"
        echo "The token should now be available in the mint dropdown."
    else
        echo ""
        echo "❌ Target token 'mouli test-1' not found in the list."
    fi
else
    echo ""
    echo "❌ No tokens found. This indicates:"
    echo "   1. DAML ledger connection issue"
    echo "   2. Party mismatch problem"
    echo "   3. Token query not working correctly"
fi

echo ""
echo "🔍 Debug information:"
debug_info=$(echo "$response" | jq '.debug' 2>/dev/null)
if [ "$debug_info" != "null" ] && [ "$debug_info" != "" ]; then
    echo "$debug_info"
else
    echo "No debug information available"
fi