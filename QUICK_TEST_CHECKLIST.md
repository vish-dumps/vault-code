# Quick Test Checklist - Meet Rooms Fixes

## ✅ Before Testing
- Make sure React fixes from earlier are applied (dependencies reinstalled)
- Start your dev server: `npm run dev`
- Open room in **two separate browsers** (e.g., Chrome and Edge, or two incognito windows)

---

## Test 1: Canvas Stability ✅
**Expected:** Canvas should stay stable, no toggling

- [ ] Open room in Browser A and Browser B
- [ ] Draw a circle in Browser A
- [ ] **Check:** Browser B should see the circle appear smoothly
- [ ] Draw a square in Browser B
- [ ] **Check:** Browser A should see the square appear smoothly
- [ ] Draw simultaneously in both browsers
- [ ] **Check:** No flickering or toggling between views

**Status:** Should be smooth and stable now

---

## Test 2: Cursor Visibility ✅
**Expected:** See other users' colored cursors

- [ ] Move mouse over canvas in Browser A
- [ ] **Check:** Browser B should show a colored cursor with username
- [ ] Move mouse in Browser B
- [ ] **Check:** Browser A should show a different colored cursor
- [ ] **Check:** Cursors move smoothly and are clearly visible

**Status:** Cursors now visible with proper positioning

---

## Test 3: Code Editor Independence ✅
**Expected:** Each user opens editor independently

- [ ] In Browser A: Click "Code" button to open editor
- [ ] **Check:** Editor opens in Browser A only
- [ ] **Check:** Browser B should NOT automatically open editor
- [ ] In Browser B: Manually click "Code" button
- [ ] **Check:** Editor now open in both browsers
- [ ] Type code in Browser A
- [ ] **Check:** Browser B sees the code update (content is shared)
- [ ] **Check:** See cursor positions of other users in the code

**Status:** Editor state is individual, content is shared (as designed)

---

## Test 4: Canvas vs Editor Layering ✅
**Expected:** No interference between canvas and code editor

- [ ] Open code editor
- [ ] Try drawing on canvas
- [ ] **Check:** Canvas drawing works normally
- [ ] **Check:** Code editor doesn't block canvas interaction
- [ ] Resize the code editor panel
- [ ] **Check:** Both panels resize smoothly

**Status:** Proper z-index layering applied

---

## Test 5: Invite Validation ✅
**Expected:** Clear error when no friends selected

- [ ] Click "Invite" button
- [ ] **Don't select any friends**
- [ ] Click "Send invite" button
- [ ] **Check:** See error toast: "No friends selected"
- [ ] **Check:** Dialog stays open
- [ ] Select at least one friend
- [ ] Click "Send invite"
- [ ] **Check:** Success message appears
- [ ] **Check:** Dialog closes

**Status:** Validation now works correctly

---

## Test 6: Member List ✅
**Expected:** Clear way to see who's in the room

- [ ] Look at top bar
- [ ] **Check:** Button shows "X online" (e.g., "2 online")
- [ ] Click the "X online" button
- [ ] **Check:** Panel slides in from left
- [ ] **Check:** See all members with:
  - Colored avatars matching their cursor colors
  - "Host" badge on first member
  - Green pulse indicator showing "Active now"
- [ ] Click "X online" button again
- [ ] **Check:** Panel closes smoothly

**Status:** Member list now visible and informative

---

## 🚨 Known Console Messages (Safe to Ignore)

### Expected Warnings:
1. ✅ `ws://localhost:undefined` - Vite HMR issue, doesn't affect functionality
2. ✅ `Download React DevTools` - Standard React suggestion
3. ✅ `Panel id and order props recommended` - React-resizable-panels warning
4. ✅ `Unload event listeners deprecated` - Browser warning, not critical
5. ✅ CSP warnings from Excalidraw - Expected behavior

### What to Watch For (Real Issues):
❌ `Room error` messages
❌ `Failed to join room`
❌ Actual WebSocket disconnections (not the Vite warning)

---

## ✅ Success Criteria

**All tests passed if:**
- ✅ Canvas collaboration is smooth without toggling
- ✅ Cursors are visible and track properly
- ✅ Code editor state is individual per user
- ✅ Code content is shared between users
- ✅ Code editor doesn't block canvas
- ✅ Invite validation prevents empty submissions
- ✅ Member list is accessible and informative

**If any test fails:** Check the `MEET_ROOMS_FIXES_COMPLETE.md` file for detailed technical information.

---

## 🎉 Ready for Use!

Once all tests pass, your meet rooms are production-ready for real-time collaboration!
