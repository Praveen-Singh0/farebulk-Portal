# Phone Auto-Login Feature

## Overview
Agents are now **automatically logged into their phone extensions** when they log into the CRM system.

## How It Works

### 1. User Registration
When creating a new agent in the CRM, assign them a phone extension (101-110):
```bash
POST /api/auth/register
{
  "email": "agent@example.com",
  "password": "secure_password",
  "userName": "Agent Name",
  "role": "agent",
  "phoneExtension": "101"  // New field: 3-digit extension
}
```

### 2. User Login
When an agent logs in to the CRM:
```bash
POST /api/auth/login
{
  "email": "agent@example.com",
  "password": "secure_password"
}
```

**What happens automatically:**
- Agent's CRM account is authenticated
- If a phone extension is assigned, the system sends an auto-registration command to Asterisk
- The phone will receive a REGISTER challenge and can automatically re-authenticate
- The agent's phone becomes "active" in the call queue

### 3. Response Format
Login response includes phone status:
```json
{
  "message": "Login successful",
  "user": {
    "id": "user_id",
    "email": "agent@example.com",
    "role": "agent",
    "userName": "Agent Name",
    "phoneExtension": "101"
  },
  "phoneLogin": {
    "success": true,
    "extension": "101",
    "username": "101",
    "message": "Phone extension 101 will prompt registration on the next REGISTER request",
    "timestamp": "2026-03-02T14:30:00.000Z"
  }
}
```

## API Endpoints

### Assign Phone Extension to User
```bash
POST /api/auth/assign-extension
Content-Type: application/json

{
  "userId": "user_id",
  "phoneExtension": "101"
}
```

### Check Phone Status
```bash
GET /api/auth/phone-status/:userId
```

Response:
```json
{
  "message": "Phone status retrieved",
  "user": "agent@example.com",
  "phoneExtension": "101",
  "status": "registered",
  "isRegistered": true
}
```

## Database Schema

### User Model Addition
```javascript
{
  ...existing fields...
  phoneExtension: {
    type: String,
    description: 'SIP extension number (e.g., 101-110)'
  }
}
```

## Implementation Details

### Files Modified/Created

1. **Backend/models/User.js**
   - Added `phoneExtension` field to User schema

2. **Backend/services/phoneAutoLogin.js** (NEW)
   - `autoLoginPhone(extension, username, password)` - Triggers phone registration
   - `getExtensionStatus(extension)` - Checks if extension is registered

3. **Backend/controllers/authController.js**
   - Updated `login()` function to call auto-login when user has phoneExtension
   - Added `assignPhoneExtension()` - Assign/update extension for a user
   - Added `getUserPhoneStatus()` - Check phone registration status

4. **Backend/routes/authRoutes.js**
   - Added `POST /api/auth/assign-extension`
   - Added `GET /api/auth/phone-status/:userId`

## Phone Registration Process

1. Agent logs into CRM with assigned extension (e.g., 101)
2. Backend sends command to Asterisk: `pjsip send notify phone-register`
3. Phone receives REGISTER challenge with password: `Farebulk@101!`
4. Phone auto-completes registration using stored credentials
5. Extension becomes available in the inbound call queue

## Testing

### Test 1: Create user with extension
```bash
curl -X POST http://localhost:3022/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "agent1@test.com",
    "password": "Test@1234",
    "userName": "Test Agent 1",
    "role": "agent",
    "phoneExtension": "104"
  }'
```

### Test 2: Login and trigger auto-registration
```bash
curl -X POST http://localhost:3022/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "agent1@test.com",
    "password": "Test@1234"
  }'
```

### Test 3: Check phone status
```bash
curl http://localhost:3022/api/auth/phone-status/[USER_ID]
```

## Error Handling

- If phone auto-login fails, the CRM login still succeeds (graceful degradation)
- User can manually log in their phone if auto-login fails
- If no phone extension is assigned, login proceeds normally

## Next Steps

- Monitor Asterisk logs to verify phone registration
- Test with actual SIP phones on the network
- Configure phones to use WebRTC transport for remote agents
