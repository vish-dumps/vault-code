# CodeVault Smart Saver Extension

Chrome extension (Manifest V3) companion for CodeVault that scrapes competitive programming problems from LeetCode and Codeforces and sends them straight into your question inventory.

## Contents

- `manifest.json` - Extension manifest configuration.
- `popup.html`, `popup.css`, `popup.js` - Popup UI that handles authentication, scraping preview, difficulty overrides, and submission.
- `background.js` - Service worker that stores auth state and posts data to CodeVault.
- `content.js` - Content script that extracts problem metadata (title, tags, difficulty hints, code) and communicates with the popup.
- `injected.js` - In-page helper injected by the content script to access Monaco/Ace editors reliably.
- `icons/` - Supply `icon16.png`, `icon48.png`, and `icon128.png` before packaging.

## First-Time Setup

1. Generate the three icons and place them in `extension/icons/`.
2. Open Chrome → `chrome://extensions` → enable **Developer mode** → **Load unpacked** → choose the `extension/` folder.
3. Open the popup:
   - **Sign in** with your CodeVault email + password (OTP flow supported), **or**
   - Use **Import from active CodeVault tab** after logging in on the web app (the extension reads `localStorage.authToken` via `chrome.scripting`).
   - The API base URL defaults to `https://your-codevault-api.com`; update it in **Advanced Settings** if you self-host on a different port or domain.

## Daily Flow

1. Browse to a supported problem (LeetCode or Codeforces) and open the extension.
2. The popup auto-fills the title, platform, tags (including Codeforces sidebox tags), detected difficulty, and the full code snippet.
3. Use the **Set Difficulty** selector to override the detected difficulty when a site (like Codeforces) does not expose one.
4. Optionally tweak tags or add personal notes.
5. Click **Save to CodeVault**. The background worker sends a `POST /api/questions` request with tags and a captured solution approach. A success animation confirms the save.

## Troubleshooting & Testing

- Use the **Refresh** button in the popup if the page changed after opening the extension.
- Inspect the popup (right-click → Inspect) for frontend logs, or check the background service worker console from `chrome://extensions`.
- If Monaco/Ace access is unavailable, the content script gracefully falls back to DOM/textarea scraping and still submits metadata.

## Extending Support

- Add additional scrapers in `content.js` and register the hostname in the `SCRAPERS` map.
- Update `manifest.json` `content_scripts.matches` if new sites are included.
- Enhance `background.js::buildQuestionPayload` if your backend schema evolves (for hints, multiple approaches, etc.).
