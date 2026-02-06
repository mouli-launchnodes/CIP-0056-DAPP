#!/bin/bash

# Upload new contracts to Canton ledger
echo "🚀 Uploading new contracts to Canton ledger..."

# Upload the new DAR file to Canton
curl -X POST \
  http://localhost:7575/v1/packages \
  -H "Content-Type: application/octet-stream" \
  -H "Authorization: Bearer $(echo '{"alg":"HS256","typ":"JWT"}' | base64 -w 0).$(echo '{"aud":["daml-ledger-api"],"sub":"admin","exp":'$(($(date +%s) + 3600))',"iat":'$(date +%s)',"ledgerId":"sandbox","participantId":"sandbox-participant","applicationId":"canton-tokenization-demo","actAs":["admin"],"readAs":["admin"],"admin":true}' | base64 -w 0).$(echo 'local-dev-signature' | base64 -w 0)" \
  --data-binary @.daml/dist/cip0056-token-1.0.0.dar

echo ""
echo "✅ Upload complete!"
echo ""
echo "📋 Verifying uploaded packages..."

# List all packages to verify upload
curl -X GET \
  http://localhost:7575/v1/packages \
  -H "Authorization: Bearer $(echo '{"alg":"HS256","typ":"JWT"}' | base64 -w 0).$(echo '{"aud":["daml-ledger-api"],"sub":"admin","exp":'$(($(date +%s) + 3600))',"iat":'$(date +%s)',"ledgerId":"sandbox","participantId":"sandbox-participant","applicationId":"canton-tokenization-demo","actAs":["admin"],"readAs":["admin"],"admin":true}' | base64 -w 0).$(echo 'local-dev-signature' | base64 -w 0)" \
  | jq '.'

echo ""
echo "🎯 New contracts should now be available!"