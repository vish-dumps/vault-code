# Quick Start Guide

## 🚀 Start the Application

### 1. Start MongoDB (if not running as service)
```bash
mongod
```

### 2. Start the Development Server
```bash
npm run dev
```

### 3. Open the Application
Navigate to: **http://localhost:5001**

## 🔐 First Time Setup

1. **Create an Account**
   - Click "Sign Up" or "Register"
   - Fill in: Username, Email, Password
   - Click "Create Account"
   - You'll be automatically logged in

2. **Verify Login**
   - Open DevTools (F12)
   - Go to: Application → Local Storage
   - Check for `authToken` key

## ✅ Test Features

### Add a Question
1. Go to **Questions** → **Add Question**
2. Fill in the form
3. Click **Save Question**
4. Should redirect to questions list

### Save a Snippet
1. Go to **Workspace**
2. Write some code
3. Add title and notes
4. Click **Save Snippet**
5. Check **Snippets** page to verify

### Delete a Snippet
1. Go to **Snippets**
2. Click trash icon on any snippet
3. Confirm deletion

## 🐛 Troubleshooting

### "Access token required" error
- **Solution:** Logout and login again
- Token may have expired or not saved properly

### "Failed to connect to MongoDB"
- **Solution:** Make sure MongoDB is running
- Check: `mongod` is running in terminal
- Or: MongoDB service is started

### Questions/Snippets not saving
1. Check browser console for errors (F12)
2. Check Network tab for failed requests
3. Verify `Authorization` header is present in requests
4. Check server terminal for error messages

## 📝 Notes

- JWT tokens expire after **7 days**
- All data is stored **locally** in MongoDB
- Database name: **codevault**
- Server port: **5001**
