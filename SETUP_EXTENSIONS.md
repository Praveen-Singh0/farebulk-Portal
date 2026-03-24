# Setting Up Phone Extensions for Auto-Login

## For Your PBX System (Extensions 1001-2001)

The auto-login feature works with ANY extension numbers. Here's how to set it up for your system:

### Step 1: Create Extensions in Asterisk PJSIP Configuration

Edit `/etc/asterisk/pjsip.conf` and add entries for your extensions:

```ini
; Extension 1001
[1001]
type = aor
max_contacts = 5

[auth1001]
type = auth
auth_type = userpass
username = 1001
password = Farebulk@1001!

[1001]
type = endpoint
aors = 1001
auth = auth1001
callerid = "Agent 1001" <1001>
transport = transport-wss
context = internal
disallow = all
allow = opus,ulaw,alaw

; Extension 1002
[1002]
type = aor
max_contacts = 5

[auth1002]
type = auth
auth_type = userpass
username = 1002
password = Farebulk@1002!

[1002]
type = endpoint
aors = 1002
auth = auth1002
callerid = "Agent 1002" <1002>
transport = transport-wss
context = internal
disallow = all
allow = opus,ulaw,alaw

; ... repeat for 1003-2001 ...
```

### Step 2: Create Agents in CRM with Their Extensions

```bash
# Create agent with extension 1001
curl -X POST http://localhost:3022/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "agent1001@company.com",
    "password": "secure_password",
    "userName": "Agent 1001",
    "role": "travel",
    "phoneExtension": "1001"
  }'

# Create agent with extension 1002
curl -X POST http://localhost:3022/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "agent1002@company.com",
    "password": "secure_password",
    "userName": "Agent 1002",
    "role": "travel",
    "phoneExtension": "1002"
  }'
```

### Step 3: Agent Logs In

```bash
curl -X POST http://localhost:3022/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "agent1001@company.com",
    "password": "secure_password"
  }'
```

Response:
```json
{
  "message": "Login successful",
  "user": {
    "phoneExtension": "1001"
  },
  "phoneLogin": {
    "success": true,
    "extension": "1001",
    "message": "Phone extension 1001 registration triggered successfully"
  }
}
```

### Step 4: Phone Automatically Registers

- Phone receives REGISTER challenge
- Phone uses credentials: `username=1001`, `password=Farebulk@1001!`
- Extension shows in PBX dashboard as registered (green dot)
- Extension available in call queue

---

## Extension Number Format

The auto-login feature supports ANY extension format:
- ✅ 101-110 (small offices)
- ✅ 1001-2001 (large enterprises)
- ✅ 2001-3000 (multi-office systems)
- ✅ Any other format

Just make sure:
1. Extension is configured in Asterisk PJSIP
2. Auth credentials follow format: `Farebulk@{extension}!`
3. Agent assigned the same extension number in CRM

---

## Bulk Create Extensions Script

If you need to create many extensions, use this script:

```bash
#!/bin/bash

# Generate PJSIP config for extensions 1001-1100
for ext in {1001..1100}; do
  cat >> /etc/asterisk/pjsip_extensions.conf << EOF

[$ext]
type = aor
max_contacts = 5

[auth$ext]
type = auth
auth_type = userpass
username = $ext
password = Farebulk@$ext!

[$ext]
type = endpoint
aors = $ext
auth = auth$ext
callerid = "Agent $ext" <$ext>
transport = transport-wss
context = internal
disallow = all
allow = opus,ulaw,alaw

