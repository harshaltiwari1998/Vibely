# Vibely End-to-End Testing Guide

## Overview

This guide covers the complete end-to-end testing flow for Vibely.

## Prerequisites

- Backend running on http://localhost:4000
- Web app running on http://localhost:5173
- Database seeded with test data
- Two browser profiles (User A, User B)

## Test Flow 1: Complete User Journey

### Step 1: Registration
```
1. Open http://localhost:5173
2. Click "Sign up"
3. Fill registration form:
   - Username: testuser_a
   - Email: test_a@example.com
   - Password: TestPass123!
   - Date of Birth: 2000-01-01
   - Gender: Male
4. Submit form
5. Expected: Redirect to /home, user created in database
```

### Step 2: Login
```
1. Open incognito window
2. Go to http://localhost:5173/login
3. Fill login form:
   - Email: test_a@example.com
   - Password: TestPass123!
4. Submit form
5. Expected: Redirect to /home
```

### Step 3: Profile Setup
```
1. Click "Profile" in navigation
2. Fill profile details:
   - Bio: "Test user bio"
   - Interests: ["tech", "music"]
3. Click "Save"
4. Expected: Profile saved, success message shown
```

### Step 4: Discovery & Matching
```
1. Click "Discover" in navigation
2. Click "Start Matching"
3. Expected: "Searching..." status shown
4. Open second browser (User B)
5. User B: Login and start matching
6. Expected: Match found notification appears
7. Expected: Both users see match screen
```

### Step 5: WebRTC Call
```
1. Accept match on both browsers
2. Expected: Call screen appears
3. Expected: Video/audio connects
4. Test mute/unmute
5. Test camera on/off
6. Test fullscreen
7. Expected: Both users can see/hear each other
```

### Step 6: Chat
```
1. During or after call, click "Chat"
2. Send message: "Hello from E2E test"
3. Expected: Message appears in both chats
4. Expected: Real-time delivery
5. Test translation (if enabled)
```

### Step 7: Gifts
```
1. Click "Gifts" in navigation
2. Select a gift
3. Send gift to matched user
4. Expected: Gift appears in chat
5. Expected: Coin balance decreases
6. Expected: Receiver gets notification
```

### Step 8: Call End & History
```
1. End the call
2. Click "History"
3. Expected: Call appears in history
4. Expected: Duration and status shown
5. Expected: "Call again" button works
```

### Step 9: Favorites
```
1. Go to matched user's profile
2. Click "Favorite"
3. Expected: User added to favorites
4. Go to "Favorites"
5. Expected: User appears in favorites list
```

### Step 10: Block & Report
```
1. Go to matched user's profile
2. Click "Block"
3. Expected: User blocked
4. Expected: Cannot match/call/message blocked user
5. Click "Report"
6. Select reason: "Spam"
7. Submit report
8. Expected: Report created
9. Expected: Admin can see report
```

### Step 11: Logout
```
1. Click logout
2. Expected: Redirect to login page
3. Expected: Cannot access protected routes
```

## Test Flow 2: Cross-Platform (Web ↔ Android)

### Prerequisites
- Web app running
- Android app installed on device/emulator
- Both users logged in

### Steps
```
1. User A (Web): Start matching
2. User B (Android): Start matching
3. Expected: Match found on both platforms
4. Expected: WebRTC call connects
5. Test: Audio/video works both ways
6. Test: Chat works both ways
7. Test: Gifts work both ways
8. End call
9. Expected: History updated on both platforms
```

## Test Flow 3: Admin Moderation

### Steps
```
1. Login as admin
2. Go to admin dashboard
3. Expected: Stats displayed
4. Go to "Reports"
5. Expected: Reports listed
6. Update report status: "Under Review"
7. Expected: Status updated
8. Go to "Users"
9. Search for test user
10. Ban user
11. Expected: User status changed to BANNED
12. Expected: Banned user cannot login
13. Unban user
14. Expected: User can login again
```

## Test Flow 4: Payment Flow (Test Mode)

### Steps
```
1. Login as test user
2. Go to Wallet
3. Select coin package
4. Click "Buy"
5. Expected: Payment modal appears
6. Complete test payment
7. Expected: Coins added to wallet
8. Expected: Transaction appears in history
9. Expected: Balance updated
```

## Test Flow 5: Push Notifications

### Steps
```
1. Login on Android
2. Grant notification permissions
3. Web user sends gift to Android user
4. Expected: Android receives push notification
5. Tap notification
6. Expected: App opens to chat
```

## Expected Results

All tests should pass with:
- No console errors
- No API errors
- No WebSocket errors
- No WebRTC errors
- Proper error messages for invalid actions
- Smooth user experience

## Troubleshooting

### WebRTC not connecting
- Check TURN server configuration
- Check firewall rules
- Check WebSocket connection
- Review browser console

### Chat not working
- Check WebSocket connection
- Check backend logs
- Verify user is not blocked

### Payments not working
- Check payment provider credentials
- Check webhook configuration
- Verify idempotency keys

## Automated Testing

### Unit Tests
```bash
npm test --workspace=services/backend
npm test --workspace=apps/web
```

### Integration Tests
```bash
npm run test:integration --workspace=services/backend
```

### E2E Tests (Future)
```bash
npm run test:e2e --workspace=apps/web
```

## Performance Benchmarks

| Metric | Target | Acceptable |
|--------|--------|------------|
| API Response Time | <200ms | <500ms |
| WebSocket Latency | <50ms | <100ms |
| WebRTC Connection Time | <2s | <5s |
| Page Load Time | <2s | <3s |
| Database Query Time | <100ms | <200ms |

## Security Tests

- [ ] Cannot access other user's data
- [ ] Cannot bypass ban
- [ ] Cannot access admin APIs as normal user
- [ ] Cannot send messages to blocked users
- [ ] Cannot match with blocked users
- [ ] Cannot modify coin balance
- [ ] Cannot create fake payments
- [ ] Rate limiting enforced
- [ ] Input validation working
