#!/bin/bash

echo "🚀 Uploading new DAR file to Canton ledger..."

# Use DAML SDK to upload the DAR file
daml ledger upload-dar \
  --host localhost \
  --port 6865 \
  .daml/dist/cip0056-token-1.0.0.dar

echo "✅ DAR upload complete!"

# List packages to verify
echo "📋 Listing packages to verify upload..."
daml ledger list-parties \
  --host localhost \
  --port 6865

echo "🎯 New contracts should now be available!"