# Email Features in the Event Management Platform

## Overview

The platform uses email functionality for authentication, notifications, and user communications. Emails are sent through two systems:

1. **Direct Email Service** - For critical authentication emails
2. **Queue-based System** - For notifications and bulk communications

---

## 1. Authentication & Security Emails

### 📧 Email Verification
**File**: `api/src/auth/auth.service.ts:427-458`

**Trigger**: User registers or requests email verification

**Endpoint**:
```http
POST /api/auth/email/verify/request
{
  "email": "user@example.com"
}
```

**Email Content**:
- Subject: "Verify your email"
- Body: Token for email verification
- Valid for: 24 hours

**Code**:
```typescript
await this.mailer.sendMail({
  to: user.email,
  subject: 'Verify your email',
  text: `Use this token to verify your email: ${token}`,
});
```

### 🔒 Password Reset
**File**: `api/src/auth/auth.service.ts:487-514`

**Trigger**: User requests password reset

**Endpoint**:
```http
POST /api/auth/password/forgot
{
  "email": "user@example.com"
}
```

**Email Content**:
- Subject: "Reset your password"
- Body: Token for password reset
- Valid for: 1 hour

**Code**:
```typescript
await this.mailer.sendMail({
  to: user.email,
  subject: 'Reset your password',
  text: `Use this token to reset your password: ${token}`,
});
```

### 🔐 Two-Factor Authentication (2FA) Codes
**File**: `api/src/auth/auth.service.ts:555-591`

**Trigger**: User enables/disables 2FA

**Endpoint**:
```http
POST /api/auth/2fa/request
Authorization: Bearer <token>
{
  "purpose": "enable" // or "disable"
}
```

**Email Content**:
- Subject: "Your 2FA code"
- Body: 6-digit verification code
- Valid for: 10 minutes

**Code**:
```typescript
await this.mailer.sendMail({
  to: user.email,
  subject: 'Your 2FA code',
  text: `Code: ${code}`,
});
```

---

## 2. Notification System Emails

### 📬 Multi-Channel Notifications
**File**: `api/src/queues/processors/notification.processor.ts:92-122`

The notification system can send emails through a queue for various events:

**Supported Notification Types**:
- `info` - General information
- `success` - Success messages
- `warning` - Warnings
- `error` - Error notifications

**Channels**:
- `in_app` - In-app notification
- `email` - Email notification ✉️
- `push` - Push notification (planned)
- `sms` - SMS notification (planned)

**Example Usage**:
```typescript
await queuesService.addJob(
  QueueName.NOTIFICATION,
  'send-notification',
  {
    userId: 'user-id',
    type: 'info',
    title: 'Order Confirmation',
    message: 'Your order has been confirmed',
    channels: ['in_app', 'email'],
    emailData: {
      template: 'order-confirmation',
      context: {
        orderId: '12345',
        eventName: 'Concert Event',
      },
    },
  },
);
```

---

## 3. Potential Email Use Cases (To Be Implemented)

Based on the codebase structure, here are potential email features that could be implemented:

### 🎫 Order & Ticketing Emails

#### Order Confirmation
**When**: After successful payment
**Content**: Order details, ticket information, event details
**Status**: ⚠️ Not yet implemented

#### Ticket Delivery
**When**: Tickets are generated after payment
**Content**: QR codes, ticket PDFs, event access information
**Status**: ⚠️ Not yet implemented

#### Ticket Transfer Notification
**When**: User receives a transferred ticket
**Content**: Transfer details, acceptance link
**Status**: ⚠️ Not yet implemented

### 📅 Event Management Emails

#### Event Reminder
**When**: 24 hours before event
**Content**: Event details, venue information, parking info
**Status**: ⚠️ Not yet implemented

#### Event Update/Cancellation
**When**: Organizer updates or cancels event
**Content**: Updated details, refund information
**Status**: ⚠️ Not yet implemented

#### Event Announcement
**When**: Organizer creates announcement
**Content**: Announcement text, event details
**Status**: ⚠️ Not yet implemented

### 💰 Payment & Refund Emails

#### Refund Confirmation
**When**: Refund is processed
**Content**: Refund amount, processing time, order details
**Status**: ⚠️ Not yet implemented

#### Payout Notification
**When**: Organizer receives payout
**Content**: Payout amount, transfer details, fee breakdown
**Status**: ⚠️ Not yet implemented

### 👥 Organization & User Management

#### Organization Verification
**When**: Organization is approved/rejected
**Content**: Verification status, next steps
**Status**: ⚠️ Not yet implemented

#### New Member Invitation
**When**: User is invited to organization
**Content**: Invitation link, organization details
**Status**: ⚠️ Not yet implemented

---

## Implementation Status

### ✅ Currently Working

| Feature | Status | File Location |
|---------|--------|---------------|
| Email Verification | ✅ Active | `auth.service.ts:427-458` |
| Password Reset | ✅ Active | `auth.service.ts:487-514` |
| 2FA Codes | ✅ Active | `auth.service.ts:555-591` |
| Queue-based Emails | ✅ Active | `notification.processor.ts:92-122` |

### ⚠️ Planned/Not Yet Implemented

| Feature | Priority | Complexity |
|---------|----------|------------|
| Order Confirmation | High | Medium |
| Ticket Delivery | High | Medium |
| Event Reminders | Medium | Low |
| Refund Notifications | Medium | Low |
| Event Updates | Medium | Low |
| Organization Verification | Low | Low |
| Ticket Transfers | Low | Medium |

---

## How to Trigger Emails for Testing

### 1. Email Verification
```bash
# Register a new user
POST http://localhost:3000/api/auth/register
{
  "email": "test@example.com",
  "password": "Password123!",
  "name": "Test User"
}

# Request verification email
POST http://localhost:3000/api/auth/email/verify/request
{
  "email": "test@example.com"
}

# Check Mailtrap inbox for email
```

### 2. Password Reset
```bash
# Request password reset
POST http://localhost:3000/api/auth/password/forgot
{
  "email": "test@example.com"
}

# Check Mailtrap inbox for reset token
```

### 3. 2FA Code
```bash
# First, login and get access token
POST http://localhost:3000/api/auth/login
{
  "email": "test@example.com",
  "password": "Password123!"
}

# Request 2FA code
POST http://localhost:3000/api/auth/2fa/request
Authorization: Bearer <your-access-token>
{
  "purpose": "enable"
}

# Check Mailtrap inbox for 6-digit code
```

---

## Email Queue System

### How It Works

1. **Job Creation**: Events trigger notification jobs
   ```typescript
   await queuesService.addJob(QueueName.NOTIFICATION, 'send-notification', {...});
   ```

2. **Notification Processing**: `NotificationProcessor` handles the job
   - Creates in-app notification
   - Enqueues email job if email channel is enabled

3. **Email Processing**: `EmailProcessor` sends the actual email
   - Uses MailerService
   - Handles retries on failure
   - Logs success/failure

### Queue Configuration

**Redis-based queues** using BullMQ:
- `notification` queue - Handles all notifications
- `email` queue - Handles email delivery

**Retry Logic**:
- Attempts: 3
- Backoff: Exponential

---

## Email Templates (To Be Added)

Currently, emails use plain text. For production, consider adding HTML templates:

### Recommended Templates

1. **welcome.hbs** - Welcome email after registration
2. **email-verification.hbs** - Email verification with styled button
3. **password-reset.hbs** - Password reset with secure link
4. **order-confirmation.hbs** - Order details with ticket info
5. **ticket-delivery.hbs** - Ticket with QR code
6. **event-reminder.hbs** - Event reminder 24h before
7. **refund-confirmation.hbs** - Refund processing notification

### Template Engine Setup

Consider using Handlebars with nodemailer:

```typescript
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

// Load template
const templatePath = path.join(__dirname, 'templates', 'order-confirmation.hbs');
const templateSource = fs.readFileSync(templatePath, 'utf8');
const template = handlebars.compile(templateSource);

// Render with data
const html = template({
  orderNumber: '12345',
  eventName: 'Concert',
  totalAmount: '$50.00',
});

// Send email
await this.mailer.sendMail({
  to: user.email,
  subject: 'Order Confirmation',
  html,
});
```

---

## Testing Recommendations

### 1. Test Each Email Type
- [ ] Email verification
- [ ] Password reset
- [ ] 2FA codes

### 2. Test Different Scenarios
- [ ] Valid email address
- [ ] Non-existent user
- [ ] Expired tokens
- [ ] Already verified email

### 3. Test Email Delivery
- [ ] Check Mailtrap inbox
- [ ] Verify email format
- [ ] Check links work
- [ ] Verify token expiration

### 4. Test Queue System
- [ ] Verify jobs are created
- [ ] Check job processing
- [ ] Test retry logic
- [ ] Monitor failed jobs

---

## Monitoring & Logs

### What to Monitor

1. **Email Sending Success Rate**
   ```
   Email sent successfully to user@example.com: Subject (Message ID: ...)
   ```

2. **SMTP Connection Status**
   ```
   Mailer configured with SMTP transport (host:port, SSL/STARTTLS)
   SMTP connection verified successfully
   ```

3. **Failed Sends**
   ```
   Failed to send email to user@example.com: Error message
   ```

4. **Queue Health**
   - Notification queue depth
   - Email queue depth
   - Failed job count

---

## Configuration

### Current Setup

```env
SMTP_HOST="sandbox.smtp.mailtrap.io"
SMTP_PORT=2525
SMTP_USER="86769155f59a99"
SMTP_PASS="52fc8c07fbe1db"
SMTP_FROM="EventFlow <noreply@eventflow.dev>"
```

### Production Recommendations

For production, use a reliable email service:

**SendGrid** (Recommended)
```env
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT=587
SMTP_USER="apikey"
SMTP_PASS="SG.xxxxx"
SMTP_FROM="EventFlow <noreply@yourdomain.com>"
```

**AWS SES**
```env
SMTP_HOST="email-smtp.us-east-1.amazonaws.com"
SMTP_PORT=587
SMTP_USER="AKIAXXXXXXXXXX"
SMTP_PASS="your-smtp-password"
SMTP_FROM="EventFlow <verified@yourdomain.com>"
```

---

## Summary

**Currently Active Email Features:**
1. ✅ Email Verification (auth)
2. ✅ Password Reset (auth)
3. ✅ 2FA Codes (auth)
4. ✅ Queue-based Notifications (infrastructure ready)

**To Be Implemented:**
1. ⚠️ Order confirmations
2. ⚠️ Ticket delivery
3. ⚠️ Event reminders
4. ⚠️ Refund notifications
5. ⚠️ Organization verifications

**Email System Status:** ✅ Fully operational with Mailtrap for testing

---

**Last Updated**: November 26, 2025
**Mailer Version**: 1.0.0 with STARTTLS support
