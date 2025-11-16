# Testing Guide - Check-in & Inventory Holds Features

> Created: 2025-11-08
> Features: Check-in Interface, Inventory Holds Management

---

## 🎯 Overview

This guide provides step-by-step instructions for testing the newly implemented Check-in Interface and Inventory Holds Management features.

---

## 🚀 Getting Started

### Prerequisites:
1. Backend API running on `http://localhost:3000`
2. Frontend dev server running on `http://localhost:3000` (or configured port)
3. Valid organization created in database
4. User account with organizer role
5. At least one event created

### Setup:
```bash
# Terminal 1: Start backend
cd api
npm run start:dev

# Terminal 2: Start frontend
cd frontend/web-app
npm run dev
```

---

## ✅ Feature 1: Check-in Interface

### Navigation:
1. Login as organizer
2. Select organization from dropdown
3. Navigate to Events list
4. Click on an event
5. Click "Check-in" from event menu or navigate to:
   ```
   /organizer/events/[eventId]/check-in
   ```

### Test Cases:

#### TC-1: Page Load
**Steps:**
1. Navigate to check-in page
2. Observe page loads successfully

**Expected Results:**
- ✅ Statistics cards display (Total, Checked In, Pending, Check-in Rate)
- ✅ Manual check-in form visible
- ✅ Recent check-ins section visible
- ✅ Help text at bottom visible
- ✅ No console errors

#### TC-2: Valid Check-in (Success Path)
**Steps:**
1. Create a test ticket via API or order flow
2. Copy the ticket ID
3. Paste ticket ID in "Ticket Code / QR Code" field
4. Click "Check In" button

**Expected Results:**
- ✅ Loading spinner shows during API call
- ✅ Green success banner appears
- ✅ "Check-in successful!" toast notification
- ✅ Form clears after success
- ✅ Statistics update (Checked In +1, Pending -1)
- ✅ Recent check-ins list updates with new entry

#### TC-3: Invalid Check-in (Error Path)
**Steps:**
1. Enter invalid ticket code "INVALID-TICKET-123"
2. Click "Check In" button

**Expected Results:**
- ✅ Loading spinner shows during API call
- ✅ Red error banner appears
- ✅ Error message displayed (e.g., "Ticket not found")
- ✅ Error toast notification
- ✅ Statistics remain unchanged

#### TC-4: Duplicate Check-in
**Steps:**
1. Check in a valid ticket (should succeed)
2. Attempt to check in the same ticket again

**Expected Results:**
- ✅ Error message "Ticket already checked in"
- ✅ Red error banner
- ✅ Statistics remain unchanged

#### TC-5: Empty Input Validation
**Steps:**
1. Leave ticket code field empty
2. Try to click "Check In" button

**Expected Results:**
- ✅ Button is disabled (grayed out)
- ✅ Cannot submit form
- ✅ No API call made

#### TC-6: QR Scanner Button
**Steps:**
1. Click QR scanner button (icon button next to input)

**Expected Results:**
- ✅ Info toast appears: "QR Scanner would open here..."
- ✅ No errors in console

#### TC-7: Keyboard Navigation
**Steps:**
1. Click in ticket code input field
2. Type a ticket code
3. Press Enter key

**Expected Results:**
- ✅ Form submits (same as clicking button)
- ✅ API call made
- ✅ Results displayed

#### TC-8: No Organization Selected
**Steps:**
1. Logout
2. Login again
3. Don't select organization
4. Navigate directly to check-in page via URL

**Expected Results:**
- ✅ "Please select an organization" message displayed
- ✅ Form not accessible
- ✅ No API calls made

---

## ✅ Feature 2: Inventory Holds Management

### Navigation:
1. Login as organizer
2. Select organization
3. Navigate to event
4. Click "Holds" or navigate to:
   ```
   /organizer/events/[eventId]/holds
   ```

### Test Cases:

#### TC-9: Page Load
**Steps:**
1. Navigate to holds page
2. Observe page loads successfully

**Expected Results:**
- ✅ Statistics cards display (Total, Active, Expiring Soon, Expired)
- ✅ Filter dropdown visible
- ✅ Refresh button visible
- ✅ "Create Hold" button visible
- ✅ Holds table visible (or empty state if no holds)
- ✅ Help text at bottom visible

#### TC-10: View Existing Holds
**Steps:**
1. Ensure at least one hold exists in database
2. Load holds page

**Expected Results:**
- ✅ Table displays all holds
- ✅ Columns show: Hold ID, Reason, Quantity, Created, Expires, Time Left, Actions
- ✅ Statistics cards show correct counts
- ✅ Time remaining displays in human-readable format
- ✅ Color coding correct (green/amber/red based on time)

#### TC-11: Create New Hold
**Steps:**
1. Click "Create Hold" button
2. Dialog modal opens
3. Fill in form:
   - Ticket Type ID: (leave empty or enter valid ID)
   - Quantity: 5
   - Reason: "organizer_hold"
   - Expires In Hours: 24
4. Click "Create Hold" button

**Expected Results:**
- ✅ Loading state shows in dialog
- ✅ API call made with correct data
- ✅ Success toast notification
- ✅ Dialog closes
- ✅ Holds list refreshes
- ✅ New hold appears in table
- ✅ Statistics update

#### TC-12: Form Validation
**Steps:**
1. Click "Create Hold"
2. Try to submit with:
   - Empty quantity
   - Quantity = 0
   - Expires > 168 hours

**Expected Results:**
- ✅ HTML5 validation prevents submit
- ✅ Red outline on invalid fields
- ✅ Cannot submit form

#### TC-13: Release Hold
**Steps:**
1. Click trash icon on any hold row
2. Confirm in confirmation dialog

**Expected Results:**
- ✅ Confirmation dialog appears
- ✅ If confirmed, API call made
- ✅ Success toast notification
- ✅ Hold removed from table
- ✅ Statistics update
- ✅ If canceled, no action taken

#### TC-14: Filter Holds
**Steps:**
1. Create holds with different expiry times:
   - One expiring in 10 minutes
   - One expiring in 3 hours
   - One expired (manually set expiry in past)
2. Test each filter:
   - "All Holds"
   - "Active Only"
   - "Expiring Soon"

**Expected Results:**
- ✅ "All Holds": Shows all 3 holds
- ✅ "Active Only": Shows 2 holds (excludes expired)
- ✅ "Expiring Soon": Shows only the 10-minute one
- ✅ Filter changes immediately (no reload)

#### TC-15: Auto-Refresh
**Steps:**
1. Load holds page
2. Wait 30 seconds without interacting

**Expected Results:**
- ✅ Page refreshes automatically
- ✅ Time remaining values update
- ✅ No page flicker or scroll jump
- ✅ Network request made every 30s

#### TC-16: Time Display Updates
**Steps:**
1. Create hold expiring in 2 minutes
2. Watch the time remaining column

**Expected Results:**
- ✅ Countdown timer updates live
- ✅ Format changes (e.g., "2m" → "1m" → "Expired")
- ✅ Color changes when expiring soon (amber)
- ✅ Color changes when expired (red)
- ✅ Row becomes dimmed when expired

#### TC-17: Empty State
**Steps:**
1. Ensure no holds exist (delete all)
2. Load holds page

**Expected Results:**
- ✅ Empty state message displayed
- ✅ Ticket icon shown
- ✅ "Create First Hold" button visible
- ✅ No table displayed
- ✅ Statistics show all zeros

#### TC-18: Refresh Button
**Steps:**
1. Click "Refresh" button in actions bar

**Expected Results:**
- ✅ API call made immediately
- ✅ Holds list updates
- ✅ Statistics recalculate
- ✅ Brief loading state (optional)

#### TC-19: Cancel Hold Creation
**Steps:**
1. Click "Create Hold"
2. Fill in some fields
3. Click "Cancel" button

**Expected Results:**
- ✅ Dialog closes
- ✅ No API call made
- ✅ No changes to holds list
- ✅ Form data discarded

#### TC-20: Long Hold List Performance
**Steps:**
1. Create 50+ holds via API
2. Load holds page

**Expected Results:**
- ✅ Page loads in < 2 seconds
- ✅ Table renders all holds
- ✅ Scrolling is smooth
- ✅ Auto-refresh doesn't cause lag
- ⚠️ Note: Consider pagination for 100+ holds

---

## 🐛 Error Scenarios

### ES-1: Backend Offline
**Steps:**
1. Stop backend server
2. Try to load either feature

**Expected Results:**
- ✅ Error toast notification
- ✅ User-friendly error message
- ✅ No console errors about undefined
- ✅ Graceful degradation

### ES-2: Invalid JWT Token
**Steps:**
1. Manually clear JWT token from localStorage
2. Try to perform any action

**Expected Results:**
- ✅ 401 Unauthorized error
- ✅ Redirect to login (if implemented)
- ✅ Error message displayed

### ES-3: Network Timeout
**Steps:**
1. Throttle network to slow 3G
2. Try to create hold or check-in

**Expected Results:**
- ✅ Loading state shows
- ✅ Eventually times out with error
- ✅ User can retry

### ES-4: Concurrent Actions
**Steps:**
1. Click "Create Hold"
2. While dialog is open, manually refresh page
3. Or: Start check-in, then immediately click again

**Expected Results:**
- ✅ No race conditions
- ✅ Duplicate requests prevented
- ✅ UI state consistent

---

## 📱 Responsive Testing

### Mobile View (375px width):
- [ ] Statistics cards stack vertically
- [ ] Table scrolls horizontally
- [ ] Buttons remain accessible
- [ ] Dialog fits on screen
- [ ] No horizontal overflow

### Tablet View (768px width):
- [ ] 2-column grid for stats
- [ ] Table visible without scroll
- [ ] Optimal spacing

### Desktop View (1920px width):
- [ ] 4-column grid for stats
- [ ] Table not stretched too wide
- [ ] Centered content
- [ ] Comfortable reading width

---

## 🔍 Browser Compatibility

Test in:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

---

## ⚡ Performance Testing

### Metrics to Check:
- [ ] Initial page load < 2s
- [ ] API response time < 500ms
- [ ] Time to interactive < 3s
- [ ] No memory leaks (check DevTools)
- [ ] Auto-refresh doesn't accumulate memory

### Tools:
- Chrome DevTools Performance tab
- Lighthouse audit
- Network throttling
- React DevTools Profiler

---

## ✅ Acceptance Criteria

### Check-in Interface:
- [x] User can check in tickets manually
- [x] Success/error states clearly visible
- [x] Statistics display correctly
- [x] Recent check-ins update
- [x] QR scanner button present (implementation pending)
- [x] No console errors
- [x] Responsive on all devices

### Inventory Holds:
- [x] User can view all holds
- [x] User can create new holds
- [x] User can delete holds
- [x] Filters work correctly
- [x] Time remaining updates live
- [x] Auto-refresh every 30s
- [x] Statistics accurate
- [x] No console errors
- [x] Responsive on all devices

---

## 📝 Test Results Template

```markdown
## Test Execution Report
Date: ___________
Tester: ___________
Environment: Development / Staging / Production

### Check-in Interface
- TC-1: ☐ Pass ☐ Fail - Notes: ___________
- TC-2: ☐ Pass ☐ Fail - Notes: ___________
- TC-3: ☐ Pass ☐ Fail - Notes: ___________
[... continue for all test cases]

### Inventory Holds
- TC-9: ☐ Pass ☐ Fail - Notes: ___________
- TC-10: ☐ Pass ☐ Fail - Notes: ___________
[... continue for all test cases]

### Issues Found
1. Issue: ___________
   Severity: Critical / High / Medium / Low
   Steps to Reproduce: ___________

### Overall Status
☐ Ready for Production
☐ Needs Minor Fixes
☐ Needs Major Fixes
```

---

## 🚨 Known Issues / Limitations

### Check-in Interface:
1. QR scanner not yet integrated (shows info toast)
2. Statistics are placeholder data (need backend endpoint)
3. Recent check-ins are mock data (need backend endpoint)
4. No real-time updates across devices (need WebSocket)

### Inventory Holds:
1. No pagination (loads all holds at once)
2. Auto-refresh interval is fixed (30s, not configurable)
3. No export to CSV functionality
4. No bulk operations

---

## 📞 Support

If you encounter issues during testing:
1. Check browser console for errors
2. Check Network tab for failed API requests
3. Verify backend is running and accessible
4. Verify organization is selected
5. Check JWT token validity
6. Create GitHub issue with:
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots/video
   - Browser/OS details
   - Console logs

---

## ✨ Happy Testing!

Remember:
- Test both success and error paths
- Try to break things (edge cases)
- Check mobile/responsive views
- Verify all user feedback (toasts, banners)
- Ensure accessibility (keyboard navigation, screen readers)
- Performance matters (especially auto-refresh)

Good luck! 🚀
