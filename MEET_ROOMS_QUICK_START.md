# 🚀 CodeVault Meet Rooms - Quick Start

## 30-Second Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp server/.env.example server/.env
# Edit server/.env with your MongoDB URI

# 3. Start development server
npm run dev

# 4. Open browser
# http://localhost:5001
```

## ✨ Features at a Glance

### 🎯 Access Points

- **Dashboard**: FAB button (bottom-right video icon)
- **Friends Page**: FAB button (bottom-right video icon)

### 🎨 Create a Room

1. Click FAB → "Create new room"
2. Click "Open Google Meet" → Create meeting
3. Copy Meet link and paste
4. Click "Create room"

### 🚪 Join a Room

1. Click FAB → "Join existing room"
2. Paste room link or code
3. Click "Join room"

### 🛠️ Inside the Room

| Feature | Location | Description |
|---------|----------|-------------|
| **Canvas** | Main area | Draw collaboratively with Excalidraw |
| **Code Editor** | "Code" button | Toggle Monaco editor sidebar |
| **Question Link** | "Add Question" | Share problem URL |
| **Members** | "Members" button | View active participants |
| **Invite Friends** | "Invite" button | Send notifications |
| **Join Meet** | "Join Meet" button | Open Google Meet |
| **End Room** | "End" button | Close room (creator only) |

## 🔑 Key Shortcuts

- **Toggle Code Editor**: Click "Code" button or close with `×`
- **Toggle Members**: Click "Members" button
- **Copy Invite**: Click copy icon in top bar
- **Exit Room**: Click "Exit" or browser back

## 🧪 Test Checklist

- [ ] Create room with Meet link
- [ ] Open room in 2 browser tabs
- [ ] Draw on canvas → See in both tabs
- [ ] Type in code editor → See in both tabs
- [ ] Add question link → See in both tabs
- [ ] Invite a friend → Check notifications
- [ ] End room → Both tabs close

## 🐛 Common Issues

**Socket won't connect?**
- Check `VITE_BACKEND_URL` in client/.env
- Ensure backend is running on port 5001

**Canvas not syncing?**
- Verify "Live" badge shows in top bar
- Check browser console for errors

**Can't create room?**
- Ensure MongoDB is running
- Check server logs for errors

## 📦 Required Dependencies

Already included in package.json:
- `socket.io` / `socket.io-client`
- `@excalidraw/excalidraw`
- `@monaco-editor/react`
- `nanoid`
- `mongoose`

## 🌐 Production Deploy

**Quick Deploy to Render + Vercel:**

1. **Backend (Render)**:
   - Connect GitHub
   - Add MongoDB URI
   - Deploy

2. **Frontend (Vercel)**:
   - Connect GitHub
   - Add `VITE_BACKEND_URL`
   - Deploy

See `MEET_ROOMS_PRODUCTION_GUIDE.md` for detailed instructions.

---

**Need help?** Check the full guide: `MEET_ROOMS_PRODUCTION_GUIDE.md`
