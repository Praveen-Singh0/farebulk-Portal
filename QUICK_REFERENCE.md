# Phone Auto-Login - Quick Reference Guide

## For Agents: How to Use

1. **Log in to CRM** with your credentials
2. **That's it!** Your phone will automatically register
3. Check Call Dashboard to see your status
4. You're ready to receive calls

## For Admins: How to Set Up

### Create New Agent with Phone Extension

```bash
# Via API
curl -X POST http://localhost:3022/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "agent@company.com",
    "password": "secure_password",
    "userName": "Agent Full Name",
    "role": "travel",
    "phoneExtension": "105"
  }'
```

### Update Existing Agent's Phone Extension

```bash
curl -X POST http://localhost:3022/api/auth/assign-extension \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_object_id",
    "phoneExtension": "106"
  }'
```

### Check Agent's Phone Status

```bash
curl http://localhost:3022/api/auth/phone-status/user_object_id
```

Response shows if phone is `registered` or `not_registered`

## Phone Extension Details

| Extension | Status | Agent |
|-----------|--------|-------|
| 101-110   | Available for assignment | Any agent |

**Auto-generated Password Format:** `Farebulk@{extension}!`
- Example: Extension 104 → Password: `Farebulk@104!`

## Troubleshooting

### Phone Not Registering?
1. Check Asterisk status: `asterisk -rx "pjsip show endpoints"`
2. Verify extension is configured: `asterisk -rx "pjsip show endpoint 104"`
3. Check agent's assigned extension in CRM

### Agent Login Succeeds but Phone Doesn't Ring?
1. Phone might not be registered yet - give it 5-10 seconds
2. Check phone is on the network and running
3. Verify firewall isn't blocking SIP (port 5060, 8089)

### How to Manually Test Phone Registration
```bash
# Check specific extension
asterisk -rx "pjsip show endpoint 104"

# Check all extensions
asterisk -rx "pjsip show endpoints"

# View contact info
asterisk -rx "pjsip show contacts"
```

## Important Notes

- ✅ Phone registration is **automatic** on CRM login
- ✅ Works with **WebRTC** phones (Linphone, ZOIPER, Bria, etc.)
- ✅ **Graceful degradation** - CRM login works even if phone fails
- ⚠️ Agent must be **logged in to CRM** for phone to stay registered
- ⚠️ Logging out of CRM doesn't log out the phone (separate systems)

## Common Phone Apps

These are known to work with the auto-login feature:
- **Linphone** (open-source, free)
- **ZOIPER** (mobile & desktop)
- **Bria** (professional, paid)
- **SJphone** (lightweight)
- Any SIP client supporting WebRTC over WSS

## Need Help?

**Backend logs:**
```bash
pm2 logs 5 | grep "Phone\|Extension"
```

**Documentation:**
- Full details: `PHONE_AUTO_LOGIN_SUMMARY.md`
- User guide: `PHONE_AUTO_LOGIN.md`
- This file: `QUICK_REFERENCE.md`
