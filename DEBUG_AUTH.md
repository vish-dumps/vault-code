# 🔍 Authentication Debug Guide

## Current Error
```
POST /api/questions 401 in 1ms :: {"error":"Access token required"}
POST /api/snippets 401 in 0ms :: {"error":"Access token required"}
```

## ✅ Solution: You Need to Login First!

The authentication token is missing because you're not logged in. Here's how to fix it:

### Step 1: Check if You're Logged In

1. Open the app: **http://localhost:5001**
2. Press **F12** to open DevTools
3. Go to **Application** tab → **Local Storage** → **http://localhost:5001**
4. Look for `authToken` key

**If `authToken` is missing or empty:**
- You are NOT logged in
- You need to login/register first

### Step 2: Login or Register

#### Option A: Use Demo Account (if seeded)
- **Email:** `demo@example.com`
- **Password:** `password123`

#### Option B: Create New Account
1. Click "Sign Up" or "Register"
2. Fill in:
   - Username: `yourname`
   - Email: `your@email.com`
   - Password: `yourpassword`
3. Click "Create Account"

### Step 3: Verify Token is Saved

After login, check DevTools again:
- **Application** → **Local Storage**
- `authToken` should have a long string (JWT token)
- Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### Step 4: Test Saving

Now try:
1. **Add Question** → Fill form → Save
2. **Workspace** → Write code → Save Snippet

Both should work now! ✅

## 🐛 Still Getting 401 Error?

### Check 1: Token Exists
```javascript
// Open browser console (F12 → Console tab)
localStorage.getItem('authToken')
// Should return a long string, not null
```

### Check 2: Token is Valid
```javascript
// In browser console
const token = localStorage.getItem('authToken');
console.log('Token:', token ? 'EXISTS' : 'MISSING');
console.log('Length:', token?.length);
```

### Check 3: Clear and Re-login
```javascript
// In browser console
localStorage.clear();
// Then login again
```

## 📝 How Authentication Works

1. **Login/Register** → Server generates JWT token
2. **Token Saved** → Stored in `localStorage.authToken`
3. **API Requests** → Token sent in `Authorization: Bearer <token>` header
4. **Server Validates** → Checks token, extracts user ID
5. **Data Saved** → Associated with your user ID

## 🔐 Token Expiration

- Tokens expire after **7 days**
- If expired, you'll get 401 error
- Solution: Logout and login again

## 🎯 Quick Test Commands

Open browser console (F12) and run:

```javascript
// Check if logged in
console.log('Logged in:', !!localStorage.getItem('authToken'));

// Test API with token
fetch('/api/questions', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
  }
}).then(r => r.json()).then(console.log);
```

## ✅ Expected Behavior After Login

1. **Dashboard loads** with your data
2. **Questions page** shows your questions
3. **Add Question** → Saves successfully
4. **Workspace** → Snippets save successfully
5. **No 401 errors** in Network tab
