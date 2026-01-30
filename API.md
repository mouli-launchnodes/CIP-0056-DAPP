# API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication
Currently, the API uses simple validation. In production, implement proper authentication and authorization.

## Endpoints

### 1. User Onboarding

**POST** `/onboard`

Generate a Canton Network Party ID for a user.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "partyId": "party-1234567890-abc123def",
  "message": "User onboarded successfully"
}
```

**Error Response:**
```json
{
  "error": "User already exists",
  "partyId": "existing-party-id"
}
```

### 2. Token Management

**GET** `/tokens`

Retrieve all available tokens.

**Response:**
```json
{
  "success": true,
  "tokens": [
    {
      "id": "token-id-123",
      "name": "MyToken",
      "currency": "USD",
      "contractAddress": "0x1234567890abcdef",
      "totalSupply": "1000.00",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**POST** `/tokens`

Create a new token contract.

**Request Body:**
```json
{
  "tokenName": "MyToken",
  "currency": "USD",
  "quantityPrecision": 2,
  "pricePrecision": 2
}
```

**Response:**
```json
{
  "success": true,
  "contract": {
    "contractId": "contract-123",
    "contractAddress": "0x1234567890abcdef",
    "owner": "system-owner-party-id",
    "tokenName": "MyToken",
    "currency": "USD"
  },
  "message": "Token contract deployed successfully"
}
```

### 3. Token Minting

**POST** `/mint`

Mint tokens to a recipient's Party ID.

**Request Body:**
```json
{
  "recipientPartyId": "party-recipient-123",
  "tokenId": "token-id-123",
  "amount": "100.50"
}
```

**Response:**
```json
{
  "success": true,
  "transaction": {
    "transactionHash": "0xabcdef1234567890",
    "status": "confirmed",
    "blockNumber": 123456
  },
  "message": "Tokens minted successfully"
}
```

### 4. Token Transfer

**POST** `/transfer`

Transfer tokens between Party IDs.

**Request Body:**
```json
{
  "senderPartyId": "party-sender-123",
  "recipientPartyId": "party-recipient-456",
  "tokenId": "token-id-123",
  "amount": "50.25"
}
```

**Response:**
```json
{
  "success": true,
  "transaction": {
    "transactionHash": "0xfedcba0987654321",
    "status": "confirmed",
    "blockNumber": 123457
  },
  "message": "Tokens transferred successfully"
}
```

**Error Response:**
```json
{
  "error": "Insufficient balance"
}
```

### 5. Holdings Query

**GET** `/holdings`

Get token holdings for all users or a specific Party ID.

**Query Parameters:**
- `partyId` (optional): Filter by specific Party ID
- `tokenId` (optional): Used with partyId for balance check

**Response:**
```json
{
  "success": true,
  "holdings": [
    {
      "id": "holding-123",
      "partyId": "party-123",
      "tokenName": "MyToken",
      "currency": "USD",
      "totalBalance": "150.75",
      "freeCollateral": "150.75",
      "lockedCollateral": "0.00",
      "contractAddress": "0x1234567890abcdef",
      "recentTransactions": [
        {
          "id": "tx-123",
          "type": "MINT",
          "amount": "100.00",
          "toPartyId": "party-123",
          "status": "CONFIRMED",
          "transactionHash": "0xabc123",
          "createdAt": "2024-01-01T00:00:00.000Z"
        }
      ]
    }
  ]
}
```

**Balance Check Response (with partyId and tokenId):**
```json
{
  "success": true,
  "balance": {
    "available": "150.75",
    "token": "MyToken"
  }
}
```

### 6. Token Burning

**POST** `/burn`

Permanently destroy tokens from a Party ID.

**Request Body:**
```json
{
  "partyId": "party-123",
  "tokenId": "token-id-123",
  "amount": "25.00"
}
```

**Response:**
```json
{
  "success": true,
  "transaction": {
    "transactionHash": "0x9876543210fedcba",
    "status": "confirmed",
    "blockNumber": 123458
  },
  "message": "Tokens burned successfully"
}
```

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200`: Success
- `400`: Bad Request (validation errors)
- `404`: Not Found (resource doesn't exist)
- `409`: Conflict (resource already exists)
- `500`: Internal Server Error

Error responses follow this format:
```json
{
  "error": "Error message description"
}
```

## Validation Rules

### Email Validation
- Must be a valid email format
- Required for onboarding

### Token Creation
- `tokenName`: 1-50 characters, required
- `currency`: Must be USD, EUR, or GBP
- `quantityPrecision`: 0-18 decimal places
- `pricePrecision`: 0-18 decimal places

### Amount Validation
- Must be a positive number
- Supports decimal values based on token precision
- String format to preserve precision

### Party ID Validation
- Must exist in the system for operations
- Generated during onboarding process
- Used as unique identifier for users

## Rate Limiting

Currently not implemented. In production, consider:
- Rate limiting per IP address
- Rate limiting per user/Party ID
- Different limits for different operations

## Security Considerations

1. **Input Validation**: All inputs are validated using Zod schemas
2. **SQL Injection**: Prevented by using Prisma ORM
3. **Balance Verification**: Checked before transfers and burns
4. **Transaction Integrity**: Database transactions ensure consistency
5. **Error Handling**: Sensitive information not exposed in error messages

## Testing

Use tools like Postman, curl, or any HTTP client to test the API:

```bash
# Onboard a user
curl -X POST http://localhost:3000/api/onboard \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Create a token
curl -X POST http://localhost:3000/api/tokens \
  -H "Content-Type: application/json" \
  -d '{"tokenName":"TestToken","currency":"USD","quantityPrecision":2,"pricePrecision":2}'

# Get all tokens
curl http://localhost:3000/api/tokens

# Check holdings
curl "http://localhost:3000/api/holdings?partyId=your-party-id"
```