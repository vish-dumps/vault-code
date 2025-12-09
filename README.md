# CodeVault

**CodeVault** is a comprehensive platform designed for coding practice, real-time collaboration, and progress tracking. It provides a rich environment for developers to solve problems, manage code snippets, and collaborate with peers in real-time.

## Key Features

### 🤝 Real-Time Collaboration
- **Meet Rooms**: Create instant collaboration spaces with synchronized canvas drawing, real-time cursors, and a shared code editor.
- **Powered by Socket.IO**: Low-latency, seamless synchronization without external dependencies like Firebase.

### 🎮 Gamification System
- **Advanced Streak Tracking**: Keep your momentum going with activity-based streaks (problem solving, snippet creation).
- **Visual Progress**: Fire-themed streak calendar visualization and daily goal tracking with segmented progress bars.
- **Motivation**: Daily coding-themed motivational quotes to keep you inspired.

### 📊 Profile & Analytics
- **Detailed Statistics**: Track your coding journey with interactive line and pie charts showing daily progress and topic distribution.
- **Customizable Profile**: Upload profile pictures, manage connected accounts (LeetCode, Codeforces), and view your achievements.

### 📝 Snippet Management
- **Organized Library**: Save and manage your useful code snippets.
- **Tagging System**: Easily categorize and retrieve snippets using a robust tagging system.

### ✨ Premium UI/UX
- **Modern Aesthetics**: A polished interface featuring glassmorphism effects, smooth transitions, and thoughtful animations.
- **Theme Support**: Beautifully designed Light and Dark modes with premium gradient accents.

## Extension Updates

To release a new version of the extension:

1. **Increment Version**: Update `version` in `extension/manifest.json`.
2. **Repackage**:
   - Go to `chrome://extensions`.
   - Click "Pack extension".
   - Root directory: Select the `extension/` folder in this repo.
   - Private key file: Select `extension/CodeVaultSmartSaver.pem`.
   - This will generate a new `.crx` file.
3. **Update Files**:
   - Move the new `.crx` to `client/public/extension/CodeVaultSmartSaver.crx`.
   - Update `version` in `client/public/extension/update.xml` to match the manifest.
   - **Important**: Ensure `appid` in `update.xml` matches your specific Extension ID (derived from the `.pem`).
4. **Deploy**: Push changes to redeploy the site.

