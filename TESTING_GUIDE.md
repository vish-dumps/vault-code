# Testing Guide for All Fixes

## Quick Test Checklist

### 1. Profile Picture Upload ⏱️ 5 min
**Setup Required:** Firebase or Cloudinary credentials

1. Follow `FIREBASE_SETUP_GUIDE.md`
2. Add credentials to `.env`
3. Restart server
4. Go to Settings → Profile Picture
5. Upload an image
6. Verify it displays in profile dropdown

**Expected:** Image uploads and displays correctly

---

### 2. Profile Dropdown Stats ⏱️ 1 min
**No setup required**

1. Click profile icon in top-right
2. Check dropdown menu

**Expected:** No XP, Max Streak, or Current Streak cards visible

---

### 3. LinkedIn Link ⏱️ 1 min
**No setup required**

1. Go to Support page
2. Scroll to "Connect with the Creator" section
3. Click "Connect on LinkedIn" button

**Expected:** Opens LinkedIn profile in new tab

---

### 4. Feedback System ⏱️ 2 min
**Already configured** (SMTP credentials in .env)

1. Go to Feedback page
2. Fill out feedback form
3. Submit
4. Check `codevault.updates@gmail.com` inbox

**Expected:** 
- Success message in UI
- Email received with feedback details

---

### 5. Initial Streak ⏱️ 3 min
**Test with new user or reset existing user**

1. Create new account OR reset progress
2. Add first question
3. Check profile page

**Expected:** Streak shows "1 day" (not 0)

---

### 6. Auto-Tracked Questions ⏱️ 5 min
**Extension must be installed**

1. Solve a problem on LeetCode/Codeforces
2. Extension auto-tracks it
3. Check:
   - Dashboard shows +1 daily problems
   - Notifications show "Problem Solved! 🎉"
   - Activity feed shows the solve
   - XP increased

**Expected:** All counts and XP update correctly

---

### 7. Activity Heatmap ⏱️ 3 min
**Requires some solved questions**

1. Solve problems (manual + auto-tracked)
2. Go to Profile page
3. Scroll to Activity Heatmap

**Expected:** 
- Shows both manual and auto-tracked questions
- Dates match when problems were solved
- Hover shows correct count

---

### 8. Code Snippet Saving ⏱️ 3 min
**Manual process** (see guide for future auto-capture)

1. Solve problem on platform
2. Copy your solution code
3. Go to Solved Questions
4. Click question → View Details
5. Click "Add Approach"
6. Paste code, select language
7. Save

**Expected:** Code saved and displays in question details

---

### 9. Friend Poke ⏱️ 3 min
**Requires 2 accounts with friendship**

1. Go to Friends page
2. Click on a friend
3. Click "Poke" button (if available)
4. Check friend's notifications

**Expected:** 
- Success message
- Friend receives "Streak Reminder! 🔥" notification

---

### 10. Forgot Password ⏱️ 5 min
**Email must be configured**

1. Logout
2. Click "Forgot Password" on login page
3. Enter email
4. Check email for OTP
5. Enter OTP and new password
6. Login with new password

**Expected:** 
- OTP received via email
- Password reset successfully
- Can login with new password

---

### 11. Full-Page Friend Profile ⏱️ 3 min
**Requires at least 1 friend**

1. Go to Friends page
2. Click "View Profile" on any friend
3. Verify all sections display:
   - Profile header with avatar
   - XP, Streak, Max Streak, Total Solved cards
   - Daily goal progress
   - Weekly progress
   - Recently solved questions
   - Platform breakdown
   - Remove friend button

**Expected:** 
- Full-page view loads
- All data displays correctly
- Can navigate back to friends list
- Remove friend works

---

## Automated Testing Script

Run this to test backend endpoints:

```bash
# Test forgot password
curl -X POST http://localhost:5001/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Test feedback submission (requires auth token)
curl -X POST http://localhost:5001/api/feedback \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "rating": 5,
    "feedbackText": "Great app!",
    "category": "general"
  }'

# Test poke (requires auth token and friend ID)
curl -X POST http://localhost:5001/api/friends/FRIEND_ID/poke \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"message":"Keep your streak going!"}'
```

---

## Common Issues & Solutions

### Issue: Feedback email not sending
**Solution:** 
- Check `SMTP_PASS` in `.env`
- Verify Gmail app password is correct
- Check server logs for email errors

### Issue: Heatmap not showing auto-tracked questions
**Solution:**
- Clear browser cache
- Check if `/api/user/solved` returns data
- Verify `solvedAt` dates are set

### Issue: Poke not working
**Solution:**
- Verify users are friends (status: "accepted")
- Check server logs for errors
- Ensure Notification model is imported

### Issue: Forgot password OTP not received
**Solution:**
- Check spam folder
- Verify email credentials
- Check server logs for email sending errors
- In development, OTP is logged to console

### Issue: Friend profile page not loading
**Solution:**
- Verify route is registered
- Check if friend ID is valid
- Ensure user has permission to view profile

---

## Performance Testing

### Load Test Auto-Tracking
1. Solve 10 problems quickly
2. Check if all are tracked
3. Verify no duplicates
4. Check XP calculations

### Load Test Heatmap
1. Add 100+ questions (mix of manual and auto)
2. Check heatmap loads within 2 seconds
3. Verify all dates are correct

---

## Browser Compatibility

Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Edge (latest)
- [ ] Safari (if on Mac)

---

## Mobile Responsiveness

Test on mobile:
- [ ] Profile dropdown
- [ ] Friend profile page
- [ ] Heatmap display
- [ ] Support page

---

## Security Testing

### Forgot Password
- [ ] Cannot reset without valid OTP
- [ ] OTP expires after 5 minutes
- [ ] Cannot reuse OTP
- [ ] Doesn't reveal if email exists

### Poke
- [ ] Can only poke friends
- [ ] Cannot poke yourself
- [ ] Requires authentication

### Friend Profile
- [ ] Respects privacy settings
- [ ] Cannot view if not friends (if private)
- [ ] Cannot remove non-friends

---

## Database Verification

After testing, verify in MongoDB:

```javascript
// Check activities for auto-tracked questions
db.activities.find({ type: 'question_solved' }).sort({ createdAt: -1 }).limit(5)

// Check notifications
db.notifications.find({ type: 'achievement' }).sort({ createdAt: -1 }).limit(5)

// Check feedback
db.feedbacks.find().sort({ createdAt: -1 }).limit(5)

// Check streaks
db.users.find({ streak: { $gt: 0 } }).limit(5)
```

---

## Final Checklist

Before marking as complete:

- [ ] All 11 fixes tested
- [ ] No console errors
- [ ] No server errors
- [ ] Email system working
- [ ] Database updates correct
- [ ] UI displays properly
- [ ] Mobile responsive
- [ ] Performance acceptable
- [ ] Security verified
- [ ] Documentation complete

---

## Rollback Plan

If issues occur:

1. **Backend issues:** 
   - Revert `server/routes.ts`
   - Revert `server/auth-routes.ts`
   - Restart server

2. **Frontend issues:**
   - Clear browser cache
   - Revert specific component files
   - Rebuild client

3. **Database issues:**
   - No migrations were run
   - Data is backward compatible
   - No rollback needed

---

## Support

If you find any bugs:
1. Check server logs
2. Check browser console
3. Verify environment variables
4. Review `FIXES_SUMMARY.md` for details
5. Test with development mode logging enabled

All fixes include error handling and detailed logging for debugging.
