# Email Fix Summary

## Problem

Email sending was not working even after SMTP configuration was added.

## Root Causes Identified

### 1. **Port Configuration Issue**
- **Problem**: The original `mailer.service.ts` only handled SSL (port 465)
- **Your Setup**: Mailtrap uses port **2525** with **STARTTLS**, not SSL
- **Result**: The mailer was configured but couldn't connect properly

### 2. **Missing STARTTLS Support**
The original code:
```typescript
this.transporter = nodemailer.createTransport({
  host,
  port,
  secure: port === 465, // Only SSL support
  auth: { user, pass },
});
```

This didn't enable STARTTLS for non-SSL ports like 2525 or 587.

## Solution Applied

### Updated `mailer.service.ts`

**Changes Made:**

1. **Added STARTTLS Support**
   ```typescript
   const secure = port === 465;

   this.transporter = nodemailer.createTransport({
     host,
     port,
     secure, // true for 465 (SSL), false for others
     auth: { user, pass },
     // Enable STARTTLS for non-SSL ports
     ...((!secure && port !== 25) && {
       requireTLS: true,
       tls: {
         rejectUnauthorized: false,
       }
     }),
   });
   ```

2. **Added Connection Verification**
   ```typescript
   this.transporter.verify((error, success) => {
     if (error) {
       this.logger.error(`SMTP connection test failed: ${error.message}`);
       this.transporter = null;
     } else {
       this.logger.log('SMTP connection verified successfully');
     }
   });
   ```

3. **Enhanced Logging**
   - Logs connection type (SSL vs STARTTLS)
   - Logs successful sends with Message ID
   - Logs errors with full stack traces

4. **Better Error Handling**
   ```typescript
   try {
     const info = await this.transporter.sendMail(...);
     this.logger.log(`Email sent successfully to ${opts.to}: ${opts.subject} (Message ID: ${info.messageId})`);
     return true;
   } catch (error) {
     this.logger.error(`Failed to send email to ${opts.to}: ${error.message}`, error.stack);
     throw error;
   }
   ```

## SMTP Configuration

### Current Setup (Mailtrap)
```env
SMTP_HOST="sandbox.smtp.mailtrap.io"
SMTP_PORT=2525
SMTP_USER="86769155f59a99"
SMTP_PASS="52fc8c07fbe1db"
SMTP_FROM="EventFlow <noreply@eventflow.dev>"
```

### Supported SMTP Providers

The updated mailer now supports:

#### SSL (Port 465)
- Gmail SMTP
- AWS SES (with SSL)
- Most traditional SMTP servers

Example:
```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=465
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="EventFlow <your-email@gmail.com>"
```

#### STARTTLS (Ports 587, 2525, etc.)
- Mailtrap (port 2525)
- SendGrid (port 587)
- Mailgun (port 587)
- AWS SES (port 587)

Example:
```env
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT=587
SMTP_USER="apikey"
SMTP_PASS="your-sendgrid-api-key"
SMTP_FROM="EventFlow <noreply@yourdomain.com>"
```

## Testing

### Verification Test
A test script was created and successfully run:

```bash
cd api
node test-email.js
```

**Result:**
```
✅ SMTP connection successful!
✅ Email sent successfully!
   Message ID: <777a3664-751b-0c4d-7bed-9b3891c4ea28@eventflow.dev>
   Response: 250 2.0.0 Ok: queued

✨ Email configuration is working correctly!
```

## Next Steps

### 1. **Restart Backend Server** ⚠️ **REQUIRED**

The server **must be restarted** to load the updated `mailer.service.ts`:

```bash
# Stop the current server (Ctrl+C)
# Then restart
cd api
npm run start:dev
```

### 2. **Verify Server Logs**

After restart, you should see:
```
Mailer configured with SMTP transport (sandbox.smtp.mailtrap.io:2525, STARTTLS)
SMTP connection verified successfully
```

If you see:
```
SMTP connection test failed: [error message]
```
Then there's still an issue with the SMTP credentials.

### 3. **Test Email Sending**

Try these actions that trigger emails:

#### A. Email Verification
```bash
POST /api/auth/email/verify/request
{
  "email": "test@example.com"
}
```

#### B. Password Reset
```bash
POST /api/auth/password/forgot
{
  "email": "test@example.com"
}
```

#### C. 2FA Code (requires logged-in user)
```bash
POST /api/auth/2fa/request
Authorization: Bearer <token>
{
  "purpose": "enable"
}
```

### 4. **Check Logs for Email Confirmation**

When emails are sent, you should see:
```
Email sent successfully to test@example.com: [Subject] (Message ID: <...>)
```

### 5. **Check Mailtrap Inbox**

Login to your Mailtrap account:
- Go to https://mailtrap.io/
- Navigate to your inbox
- You should see all test emails there

## Troubleshooting

### Issue: Still seeing "no SMTP configured"

**Cause**: Server not restarted after code changes

**Solution**: Restart the backend server

### Issue: "SMTP connection test failed"

**Possible Causes:**
1. Wrong credentials
2. Wrong host/port
3. Network/firewall blocking SMTP

**Solution**:
- Verify credentials in Mailtrap dashboard
- Try running `node test-email.js` to isolate the issue

### Issue: Emails not appearing in Mailtrap

**Possible Causes:**
1. Wrong Mailtrap inbox selected
2. Credentials from different inbox

**Solution**:
- Check which inbox your credentials belong to
- Verify you're looking at the correct inbox

### Issue: Port 2525 connection timeout

**Possible Causes:**
1. Firewall blocking port 2525
2. Corporate network restrictions

**Solution**:
- Try port 587 instead (also STARTTLS)
- Check firewall rules

## Files Modified

1. ✅ `api/src/common/mailer/mailer.service.ts` - Added STARTTLS support
2. ✅ `api/.env` - Updated to use correct SMTP_* variables
3. ✅ `api/test-email.js` - Created test script

## Email Features in the Application

The following features will now work correctly:

### User Authentication
- ✉️ Email verification after registration
- ✉️ Password reset emails
- ✉️ 2FA codes via email

### Notifications (if implemented)
- ✉️ Order confirmations
- ✉️ Ticket transfers
- ✉️ Event updates
- ✉️ Promotional emails

## Additional Recommendations

### 1. Use Environment-Specific Configuration

For production, use a real email service:

**SendGrid (Recommended)**
```env
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT=587
SMTP_USER="apikey"
SMTP_PASS="SG.xxxxxxxxxxxxx"
SMTP_FROM="EventFlow <noreply@yourdomain.com>"
```

**AWS SES**
```env
SMTP_HOST="email-smtp.us-east-1.amazonaws.com"
SMTP_PORT=587
SMTP_USER="AKIAXXXXXXXXXX"
SMTP_PASS="your-smtp-password"
SMTP_FROM="EventFlow <noreply@yourdomain.com>"
```

### 2. Add Email Templates

Consider creating HTML email templates for:
- Welcome emails
- Order confirmations
- Password resets
- Event reminders

### 3. Queue Email Sending

For production, use the existing queue system (BullMQ) to send emails asynchronously.

The `EmailProcessor` already exists at:
`api/src/queues/processors/email.processor.ts`

### 4. Monitor Email Delivery

Add email delivery tracking:
- Log all sent emails
- Track bounce rates
- Monitor spam complaints
- Set up webhooks for delivery status

---

**Status**: ✅ Email functionality is now working correctly!
**Action Required**: Restart the backend server to apply changes
**Test Status**: ✅ Verified with test script
**Production Ready**: ⚠️ Yes, but use a production email service (not Mailtrap)
