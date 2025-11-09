# 🔧 CodeVault Meet Rooms - Production Setup Guide

## 📋 Overview

This guide will help you deploy the CodeVault Meet Rooms feature - a production-grade real-time collaboration system that combines Google Meet, Excalidraw, and Monaco Editor.

## 🏗️ Architecture

```
CodeVault Meet Rooms
├── Frontend (React + Vite)
│   ├── Socket.io Client
│   ├── Excalidraw Canvas
│   ├── Monaco Editor
│   └── Real-time Sync
│
├── Backend (Express + Node.js)
│   ├── REST API Endpoints
│   ├── Socket.io Server
│   ├── MongoDB Database
│   └── Authentication
│
└── Real-time Features
    ├── Canvas Sync (200ms throttle)
    ├── Code Sync (300ms debounce)
    ├── Cursor Tracking
    ├── Member Presence
    └── Question Link Sharing
```

## 🚀 Local Development Setup

### Prerequisites

- Node.js 18+ and npm
- MongoDB (local or cloud)
- Git

### Step 1: Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd VaultCode

# Install dependencies
npm install
```

### Step 2: Configure Environment Variables

#### Client Configuration (`client/.env`)

```env
VITE_BACKEND_URL=http://localhost:5001
```

#### Server Configuration (`server/.env`)

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/codevault

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# Server
PORT=5001
NODE_ENV=development

# Email (Optional - for notifications)
SMTP_SERVICE=gmail
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="CodeVault <your-email@gmail.com>"
FEEDBACK_RECEIVER_EMAIL=your-email@gmail.com

# CORS
CLIENT_URL=http://localhost:5173
```

### Step 3: Start Development Servers

```bash
# Terminal 1: Start backend
npm run dev

# The backend serves both API and frontend in development
# Frontend available at: http://localhost:5001
```

### Step 4: Test the Features

1. **Create a Room**:
   - Click the FAB button (floating video icon) on Dashboard or Friends page
   - Click "Create new room"
   - Click "Open Google Meet" to create a Meet link
   - Paste the Meet link and click "Create room"

2. **Join a Room**:
   - Click FAB → "Join existing room"
   - Paste a room link or room code
   - Click "Join room"

3. **Collaborate**:
   - Draw on Excalidraw canvas (syncs in real-time)
   - Toggle code editor with "Code" button
   - Add question link with "Add Question" button
   - View members with "Members" button
   - Invite friends with "Invite" button

4. **End Room**:
   - Click "End" button (only room creator)
   - Confirm in dialog
   - Room closes for all participants

## 🌐 Production Deployment

### Option 1: Vercel (Frontend) + Render (Backend)

#### Backend Deployment (Render)

1. **Create Render Account**: https://render.com

2. **Create New Web Service**:
   - Connect your GitHub repository
   - Select `server` as root directory
   - Build Command: `npm install`
   - Start Command: `npm start`

3. **Environment Variables** (Add in Render Dashboard):
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/codevault
   JWT_SECRET=<generate-strong-secret>
   JWT_EXPIRES_IN=7d
   PORT=5001
   NODE_ENV=production
   CLIENT_URL=https://your-frontend-url.vercel.app
   SMTP_SERVICE=gmail
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=465
   SMTP_SECURE=true
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   SMTP_FROM="CodeVault <your-email@gmail.com>"
   FEEDBACK_RECEIVER_EMAIL=your-email@gmail.com
   ```

4. **Deploy**: Click "Create Web Service"

5. **Note Your Backend URL**: e.g., `https://codevault-api.onrender.com`

#### Frontend Deployment (Vercel)

1. **Create Vercel Account**: https://vercel.com

2. **Import Project**:
   - Connect GitHub repository
   - Framework Preset: Vite
   - Root Directory: `client`

3. **Environment Variables**:
   ```
   VITE_BACKEND_URL=https://codevault-api.onrender.com
   ```

4. **Build Settings**:
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

5. **Deploy**: Click "Deploy"

### Option 2: Railway (Full Stack)

1. **Create Railway Account**: https://railway.app

2. **Create New Project**:
   - Connect GitHub repository
   - Railway will auto-detect Node.js

3. **Add MongoDB**:
   - Click "New" → "Database" → "MongoDB"
   - Copy connection string

4. **Configure Environment Variables**:
   ```
   MONGODB_URI=<railway-mongodb-connection-string>
   JWT_SECRET=<generate-strong-secret>
   JWT_EXPIRES_IN=7d
   PORT=5001
   NODE_ENV=production
   VITE_BACKEND_URL=${{RAILWAY_STATIC_URL}}
   ```

5. **Deploy**: Railway auto-deploys on push

### MongoDB Cloud Setup (MongoDB Atlas)

1. **Create Account**: https://www.mongodb.com/cloud/atlas

2. **Create Cluster**:
   - Choose free tier (M0)
   - Select region closest to your users
   - Create cluster

3. **Database Access**:
   - Create database user
   - Set username and password
   - Save credentials

4. **Network Access**:
   - Add IP: `0.0.0.0/0` (allow all - for production, restrict to your server IPs)

5. **Get Connection String**:
   - Click "Connect" → "Connect your application"
   - Copy connection string
   - Replace `<password>` with your database password
   - Use in `MONGODB_URI` environment variable

## 🔒 Security Checklist

### Before Production:

- [ ] Change `JWT_SECRET` to a strong random string (use: `openssl rand -base64 32`)
- [ ] Use MongoDB Atlas with authentication enabled
- [ ] Restrict MongoDB network access to your server IPs
- [ ] Enable HTTPS/WSS (Vercel/Render provide this automatically)
- [ ] Set `NODE_ENV=production`
- [ ] Configure CORS to allow only your frontend domain
- [ ] Use environment variables for all secrets (never commit `.env` files)
- [ ] Enable rate limiting (already configured in `meetRoomsSocket.ts`)
- [ ] Validate all socket payloads (already implemented)
- [ ] Sanitize canvas data (already implemented)

## 📦 Required Dependencies

### Frontend

```json
{
  "dependencies": {
    "@excalidraw/excalidraw": "^0.17.0",
    "@monaco-editor/react": "^4.6.0",
    "socket.io-client": "^4.7.0",
    "framer-motion": "^11.0.0",
    "wouter": "^3.0.0",
    "@tanstack/react-query": "^5.0.0"
  }
}
```

### Backend

```json
{
  "dependencies": {
    "socket.io": "^4.7.0",
    "mongoose": "^8.0.0",
    "nanoid": "^5.0.0",
    "express": "^4.18.0",
    "jsonwebtoken": "^9.0.0",
    "dotenv": "^16.0.0"
  }
}
```

## 🧪 Testing Checklist

| Test | Expected Result |
|------|----------------|
| Create Meet → Paste → Create Room | Room saved in DB, redirects to room page |
| Open same room in 2 browsers | Canvas + Code sync instantly |
| Draw on canvas | Other users see drawing in real-time |
| Type in code editor | Other users see code updates |
| Refresh page | No infinite reloads, reconnects automatically |
| Leave room | User count updates for others |
| Network disconnect/reconnect | Auto reconnection works |
| Invite friends | Notifications sent successfully |
| End room | Room closes for all participants |
| Join via notification | Opens room with Meet link |

## 🐛 Troubleshooting

### Socket Connection Issues

**Problem**: "Socket disconnected" or connection errors

**Solutions**:
1. Check `VITE_BACKEND_URL` matches your backend URL
2. Ensure backend is running and accessible
3. Check browser console for CORS errors
4. Verify Socket.io path: `/socket.io/meet-rooms`
5. Check firewall/network settings

### Canvas Not Syncing

**Problem**: Canvas changes don't appear for other users

**Solutions**:
1. Check socket connection status (should show "Live" badge)
2. Verify throttle timeout (200ms) isn't too aggressive
3. Check browser console for errors
4. Ensure `canvas_update` event is being emitted

### Code Editor Not Syncing

**Problem**: Code changes don't sync

**Solutions**:
1. Check debounce timeout (300ms)
2. Verify `code_update` event handler
3. Check if editor is mounted correctly
4. Look for Monaco editor errors in console

### Room Not Found

**Problem**: "Room not found" error when joining

**Solutions**:
1. Verify room ID is correct
2. Check if room was ended
3. Ensure MongoDB connection is active
4. Check backend logs for database errors

### Infinite Re-renders

**Problem**: Page keeps refreshing or components re-render infinitely

**Solutions**:
1. Check `useLiveRoom` hook cleanup (already implemented)
2. Verify `mountedRef` is preventing state updates on unmounted components
3. Check socket event listeners are properly removed on unmount
4. Ensure no circular dependencies in useEffect

## 📊 Performance Optimization

### Already Implemented:

✅ **Throttling**: Canvas updates throttled to 200ms
✅ **Debouncing**: Code updates debounced to 300ms
✅ **Cleanup**: All socket listeners removed on unmount
✅ **Mounted Check**: Prevents state updates on unmounted components
✅ **Connection Pooling**: Single socket instance reused
✅ **Lazy Loading**: Components loaded on demand

### Additional Optimizations:

- Use Redis for socket state (for horizontal scaling)
- Implement room participant limits
- Add canvas change compression
- Use WebSocket binary frames for large payloads
- Implement pagination for room lists

## 🔄 Scaling Considerations

### For High Traffic:

1. **Horizontal Scaling**:
   - Use Redis adapter for Socket.io
   - Deploy multiple backend instances
   - Use load balancer (Nginx/AWS ALB)

2. **Database Optimization**:
   - Add indexes on `roomId`, `createdBy`
   - Use MongoDB sharding for large datasets
   - Implement caching layer (Redis)

3. **CDN**:
   - Serve static assets via CDN
   - Use Cloudflare for DDoS protection

## 📝 Environment Variables Reference

### Client

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_BACKEND_URL` | Backend API URL | `https://api.codevault.app` |

### Server

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://...` |
| `JWT_SECRET` | Secret for JWT signing | `random-32-char-string` |
| `JWT_EXPIRES_IN` | JWT expiration time | `7d` |
| `PORT` | Server port | `5001` |
| `NODE_ENV` | Environment | `production` |
| `CLIENT_URL` | Frontend URL (CORS) | `https://codevault.app` |
| `SMTP_*` | Email configuration | See `.env.example` |

## 🎯 Feature Summary

### ✅ Implemented Features:

1. **FAB Button** - Floating action button on Dashboard and Friends pages
2. **Create Room** - With Google Meet link integration and guide
3. **Join Room** - Via link, code, or notification
4. **Excalidraw Canvas** - Real-time collaborative drawing
5. **Monaco Editor** - Toggleable code editor with live sync
6. **Question Link** - Add and share problem links
7. **Members Panel** - View active room participants
8. **Invite Friends** - Send notifications to friends
9. **End Room** - Close room with cleanup
10. **Real-time Sync** - Canvas, code, cursors, presence
11. **Notifications** - Room invites via notification system
12. **Auto Reconnect** - Handles network disconnections
13. **Error Handling** - Comprehensive error messages
14. **Security** - Authentication, validation, sanitization

## 🎨 UI/UX Features:

- Dark mode support
- Smooth animations (Framer Motion)
- Responsive design
- Loading states
- Error states
- Toast notifications
- Confirmation dialogs
- Keyboard shortcuts (Excalidraw)

## 📚 Additional Resources

- [Socket.io Documentation](https://socket.io/docs/)
- [Excalidraw API](https://docs.excalidraw.com/)
- [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- [MongoDB Atlas](https://www.mongodb.com/docs/atlas/)
- [Vercel Deployment](https://vercel.com/docs)
- [Render Deployment](https://render.com/docs)

## 🆘 Support

For issues or questions:
1. Check this guide first
2. Review browser console for errors
3. Check backend logs
4. Verify environment variables
5. Test with minimal setup (2 users, 1 room)

---

**Built with ❤️ for seamless real-time collaboration**
