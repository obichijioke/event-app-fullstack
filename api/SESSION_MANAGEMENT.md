# Session Management Guide

## Overview

The event management platform uses a robust session management system to handle user authentication and track active sessions across multiple devices.

## Key Features

### 1. Session Lifecycle

- **Creation**: A session is created when a user logs in
- **Extension**: Sessions are extended (not recreated) on token refresh
- **Expiration**: Sessions expire after 7 days of inactivity
- **Revocation**: Sessions can be manually revoked by users or admins

### 2. Session Limits

- **Maximum Sessions Per User**: 10 active sessions
- **Auto-Cleanup**: When a user reaches the limit, the oldest active session is automatically revoked
- **Purpose**: Prevents session explosion and improves security

### 3. Token Refresh Strategy

The system uses a **session-extending** strategy instead of creating new sessions on every refresh:

```typescript
// On token refresh:
// - Session ID remains the same
// - expiresAt is extended by 7 days
// - Metadata (userAgent, IP) is optionally updated
```

**Benefits**:
- One session per device/browser
- Stable session IDs for better tracking
- Reduced database growth
- Improved audit trail

## Automatic Cleanup Jobs

The system runs scheduled cleanup jobs to maintain database health:

### Daily Cleanup (2 AM)
- Deletes expired sessions
- Removes revoked sessions older than 30 days

### Weekly Cleanup (Sunday 3 AM)
- Removes orphaned sessions (sessions for deleted users)

### Hourly Monitoring
- Logs session statistics
- Warns if active sessions exceed 1000

## Session Management API

### User Endpoints

#### List Sessions
```bash
GET /api/auth/sessions
Authorization: Bearer <access_token>
```

Returns all sessions for the current user.

#### Revoke Session
```bash
DELETE /api/auth/sessions/:sessionId
Authorization: Bearer <access_token>
```

Revokes a specific session.

#### Logout All Devices
```bash
POST /api/auth/logout-all
Authorization: Bearer <access_token>
```

Revokes all active sessions for the current user.

### Admin Endpoints

#### Manual Cleanup
```bash
POST /api/auth/admin/sessions/cleanup?olderThanDays=30&includeActive=false
Authorization: Bearer <admin_access_token>
```

**Query Parameters**:
- `olderThanDays`: Age threshold in days (default: 30)
- `includeActive`: Whether to include active sessions (default: false)

**Response**:
```json
{
  "deletedCount": 150,
  "timestamp": "2025-11-26T19:00:00.000Z"
}
```

#### Get Session Statistics
```bash
GET /api/auth/admin/sessions/stats
Authorization: Bearer <admin_access_token>
```

Logs current session statistics to server logs.

## Database Schema

### UserSession Table

```prisma
model UserSession {
  id        String    @id @default(cuid())
  userId    String
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Metadata
  userAgent String?
  ipAddr    String?

  // Lifecycle
  createdAt DateTime  @default(now())
  expiresAt DateTime
  revokedAt DateTime?

  @@index([userId])
  @@index([expiresAt])
  @@index([revokedAt])
}
```

## Utility Scripts

The following scripts are available for manual session management:

### Check Sessions
```bash
node check-sessions.js
```

Displays:
- Last 30 sessions with details
- Total, active, and revoked session counts
- Sessions grouped by user

### Cleanup Revoked Sessions
```bash
node cleanup-revoked-sessions.js
```

Deletes all revoked sessions, keeping only active ones.

### Cleanup Old Sessions
```bash
node cleanup-old-sessions.js
```

Deletes revoked sessions older than 30 days.

## Configuration

### Environment Variables

```env
# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-super-secret-refresh-key"
JWT_EXPIRES_IN="60m"           # Access token expiry
JWT_REFRESH_EXPIRES_IN="7d"    # Refresh token expiry
```

### Constants

```typescript
// In auth.service.ts
const MAX_SESSIONS_PER_USER = 10;  // Maximum active sessions

// In session-cleanup.service.ts
const REVOKED_SESSION_RETENTION = 30; // Days to keep revoked sessions
```

## Security Best Practices

### 1. Session Monitoring
- Regularly check for unusual session patterns
- Monitor the hourly session statistics logs
- Alert on rapid session creation

### 2. User Education
- Encourage users to revoke unknown sessions
- Provide clear device/browser information in session list
- Show last activity timestamps

### 3. Session Hygiene
- Run cleanup jobs regularly
- Keep revoked sessions for audit (30 days)
- Delete expired sessions promptly

### 4. Rate Limiting
- Consider adding rate limits on login endpoints
- Throttle token refresh requests if needed
- Block excessive session creation attempts

## Troubleshooting

### Problem: Too Many Sessions Created

**Symptoms**: Hundreds of sessions for one user

**Cause**: Token refresh creating new sessions instead of extending

**Solution**: Ensure `auth.service.ts` uses the session-extending strategy (already implemented)

### Problem: Sessions Not Cleaning Up

**Symptoms**: Database growing with old sessions

**Cause**: Cleanup job not running or failing

**Solution**:
1. Check if `SessionCleanupService` is registered in `AuthModule`
2. Verify `@nestjs/schedule` is properly configured
3. Check server logs for cleanup errors

### Problem: Users Logged Out Unexpectedly

**Symptoms**: Frequent re-authentication required

**Cause**: Sessions being revoked prematurely

**Solution**:
1. Check if session limit (10) is being hit
2. Verify token refresh is working correctly
3. Ensure clock sync between client/server

## Migration Guide

If upgrading from the old session-recreation strategy:

### 1. Cleanup Existing Sessions
```bash
node cleanup-revoked-sessions.js
```

### 2. Update Code
The fix is already applied in `auth.service.ts:142-153`

### 3. Restart Server
```bash
npm run start:dev
```

### 4. Verify
```bash
# Login with a browser
# Wait for token refresh
node check-sessions.js
# Verify no new sessions created
```

## Performance Considerations

### Database Indexes

Ensure these indexes exist:
```sql
CREATE INDEX idx_user_sessions_userId ON UserSession(userId);
CREATE INDEX idx_user_sessions_expiresAt ON UserSession(expiresAt);
CREATE INDEX idx_user_sessions_revokedAt ON UserSession(revokedAt);
```

### Query Optimization

- Use `revokedAt IS NULL` for active session queries
- Combine `expiresAt > NOW()` with `revokedAt IS NULL`
- Limit results when listing sessions

### Cleanup Timing

- Schedule cleanup during low-traffic hours (2-4 AM)
- Run weekly cleanup on weekends
- Monitor cleanup duration and adjust if needed

## Monitoring and Alerts

### Recommended Metrics

1. **Active Sessions Count**: Should grow linearly with users
2. **Revoked Sessions Count**: Should decrease after cleanup
3. **Session Creation Rate**: Spikes may indicate issues
4. **Cleanup Job Duration**: Should be consistent

### Alert Thresholds

- Active sessions > 1000: Review growth pattern
- Cleanup failures: Immediate investigation
- Session creation > 100/minute: Possible attack

## Future Enhancements

### Planned Features

1. **Session Fingerprinting**: Detect session hijacking
2. **Geo-Location Tracking**: Show login locations
3. **Device Management**: Name and manage devices
4. **Session Insights**: Show session activity patterns
5. **Configurable Limits**: Per-plan session limits

### Under Consideration

- Redis-based session store for high-traffic scenarios
- Real-time session notifications
- Session analytics dashboard
- Automatic suspicious session detection

---

**Last Updated**: November 26, 2025
**Version**: 1.0.0
**Author**: Claude Code
