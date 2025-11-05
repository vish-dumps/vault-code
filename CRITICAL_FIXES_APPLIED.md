# Critical Fixes Applied - Nov 3, 2025

## Issues Fixed

### 1. ✅ Friend Profile 404 Error
**Problem:** Clicking "View Profile" on a friend resulted in 404 page not found

**Root Cause:** Missing route in App.tsx for `/community/friends/:friendId`

**Fix Applied:**
- Added route import: `import FriendProfile from "@/pages/community/friend-profile";`
- Added route definition: `<Route path="/community/friends/:friendId" component={FriendProfile} />`
- Route must be BEFORE the `/community/friends` route for proper matching

**Files Modified:**
- `client/src/App.tsx`

**Test:** Navigate to Friends → Click "View Profile" → Should show full-page friend profile

---

### 2. ✅ Poke Functionality Not Working
**Problem:** Poke button was failing silently

**Root Cause:** Friendship model uses `requesterId`/`recipientId` but poke endpoint was checking for `user1`/`user2`

**Fix Applied:**
- Updated friendship query in poke endpoint to use correct field names
- Changed from `user1`/`user2` to `requesterId`/`recipientId`

**Files Modified:**
- `server/routes.ts` - Line 1476-1481

**Code Change:**
```typescript
// Before (WRONG):
{ user1: new Types.ObjectId(userId), user2: new Types.ObjectId(friendId), status: "accepted" }

// After (CORRECT):
{ requesterId: new Types.ObjectId(userId), recipientId: new Types.ObjectId(friendId), status: "accepted" }
```

**Test:** Go to Friends → Click friend → Click Poke → Friend should receive notification

---

### 3. ✅ XP Not Increasing for Auto-Tracked Questions
**Problem:** XP was being calculated but not reflected in UI immediately

**Root Cause:** 
1. Response didn't include updated profile data
2. Frontend had 60-second refetch interval

**Fix Applied:**
1. **Backend:** Added `updatedProfile` to response with current XP, dailyProgress, and streak
2. **Frontend:** Reduced refetch interval from 60s to 10s for faster updates

**Files Modified:**
- `server/routes.ts` - Line 607-611 (added updatedProfile to response)
- `client/src/pages/dashboard.tsx` - Line 97 (reduced refetch interval)

**Code Change:**
```typescript
// Backend response now includes:
updatedProfile: {
  xp: updatedProfile?.xp ?? 0,
  dailyProgress: updatedProfile?.dailyProgress ?? 0,
  streak: updatedProfile?.streak ?? 0,
}
```

**Test:** 
1. Solve problem on LeetCode/Codeforces
2. Wait 10 seconds
3. Check dashboard - XP should increase

---

### 4. ✅ Daily Goal Card Not Updating for Auto-Tracked Questions
**Problem:** Daily progress counter only showed manual questions, not auto-tracked ones

**Root Cause:** Dashboard was calculating `todaysQuestionsCount` from the `questions` array (manual only) instead of using `dailyProgress` from user profile (includes both)

**Fix Applied:**
- Removed local calculation of `todaysQuestionsCount`
- Now uses `userProfile.dailyProgress` directly which includes both manual and auto-tracked questions
- Server already updates `dailyProgress` correctly for auto-tracked questions (line 522)

**Files Modified:**
- `client/src/pages/dashboard.tsx` - Line 229-230

**Code Change:**
```typescript
// Before (WRONG):
const todaysQuestionsCount = useMemo(() => {
  // Only counted manual questions from /api/questions
}, [questions]);
const dailyProgress = Math.max(userProfile?.dailyProgress ?? 0, todaysQuestionsCount);

// After (CORRECT):
const dailyProgress = userProfile?.dailyProgress ?? 0;
```

**Test:**
1. Note current daily progress
2. Solve problem via extension (auto-tracked)
3. Wait 10 seconds
4. Dashboard should show +1 in daily goal card

---

## Summary of Changes

### Backend Changes (server/routes.ts)
1. **Line 1476-1481:** Fixed poke friendship query field names
2. **Line 607-611:** Added updatedProfile to auto-tracked question response

### Frontend Changes
1. **client/src/App.tsx:**
   - Added FriendProfile import
   - Added route for `/community/friends/:friendId`

2. **client/src/pages/dashboard.tsx:**
   - Line 97: Reduced refetch interval to 10 seconds
   - Line 229-230: Use dailyProgress from user profile instead of calculating locally

---

## How Auto-Tracking Works Now (Complete Flow)

### 1. Extension Detects Solve
- User solves problem on LeetCode/Codeforces
- Extension content script detects submission
- Sends to background script

### 2. Background Script Processes
- Validates problem details
- Sends POST to `/api/user/solved`

### 3. Server Processes (routes.ts line 444-620)
- ✅ Calculates XP with progression and combo bonuses
- ✅ Creates question in database
- ✅ Updates streak (line 511)
- ✅ Increments dailyProgress (line 522)
- ✅ Applies XP to user (line 529-534)
- ✅ Creates activity (line 537-551)
- ✅ Creates notification (line 554-570)
- ✅ Checks daily goal bonus (line 572-594)
- ✅ Returns updated profile data (line 607-611)

### 4. Frontend Updates
- User profile refetches every 10 seconds
- Dashboard shows updated:
  - XP (in header)
  - Daily progress (in goal card)
  - Streak (in streak card)
- Notifications appear
- Activity feed updates

---

## Testing Checklist

### Friend Profile
- [ ] Navigate to Friends page
- [ ] Click "View Profile" on any friend
- [ ] Should see full-page profile (not 404)
- [ ] Can navigate back
- [ ] Can remove friend

### Poke
- [ ] Go to friend's profile
- [ ] Click Poke button (if available)
- [ ] Should see success message
- [ ] Friend should receive notification

### Auto-Tracked XP
- [ ] Note current XP
- [ ] Solve problem on LeetCode/Codeforces
- [ ] Wait 10-15 seconds
- [ ] XP should increase in header
- [ ] Notification should appear

### Daily Goal
- [ ] Note current daily progress (e.g., 2/3)
- [ ] Solve problem via extension
- [ ] Wait 10-15 seconds
- [ ] Daily progress should increment (e.g., 3/3)
- [ ] Goal card should update

---

## Known Limitations

1. **Refetch Delay:** Changes take up to 10 seconds to appear (refetch interval)
   - **Solution:** Could implement WebSocket push notifications for instant updates
   
2. **Extension Separate from Web App:** Extension and web app don't communicate directly
   - **Current:** Web app polls server every 10 seconds
   - **Future:** Could use browser storage events or WebSocket

3. **Lint Errors:** Pre-existing errors for missing about/support pages
   - Not related to these fixes
   - Can be ignored or pages can be created

---

## Performance Impact

- **Reduced refetch interval:** 60s → 10s
  - Impact: 6x more API calls to `/api/user/profile`
  - Mitigation: Endpoint is lightweight (single user lookup)
  - Benefit: Much better UX for auto-tracking

---

## Rollback Instructions

If issues occur:

### Revert Friend Profile Route
```typescript
// In client/src/App.tsx, remove:
import FriendProfile from "@/pages/community/friend-profile";
<Route path="/community/friends/:friendId" component={FriendProfile} />
```

### Revert Poke Fix
```typescript
// In server/routes.ts line 1476-1481, change back to:
{ user1: new Types.ObjectId(userId), user2: new Types.ObjectId(friendId), status: "accepted" }
```

### Revert Dashboard Changes
```typescript
// In client/src/pages/dashboard.tsx:
// Line 97: Change refetchInterval back to 60000
// Line 229-230: Restore todaysQuestionsCount calculation
```

---

## Next Steps

1. **Test all fixes** using the checklist above
2. **Monitor server logs** for any errors
3. **Check browser console** for frontend errors
4. **Verify database** updates are correct

---

## Support

All fixes include error handling and logging. Check:
- Browser console for frontend errors
- Server logs for backend errors
- Network tab for API responses

If XP still doesn't update:
1. Check if `/api/user/solved` returns 201 status
2. Verify response includes `updatedProfile`
3. Check if `/api/user/profile` refetches
4. Verify `dailyProgress` increments in database
