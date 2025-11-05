## Auto-Tracking Troubleshooting Log

### 2024-XX-XX – LeetCode slug regression

- **Symptoms**: Extension auto-tracker stopped firing for LeetCode even though submissions were accepted. No API requests were sent from the background service worker.
- **Root cause**: `getLeetCodeSlug` stopped defaulting to the active `window.location.href`. `triggerLeetCodeDetection` called the helper without arguments, so the slug resolver always returned `null` unless a fallback attribute happened to exist. With a missing slug, the detection bailed out before sending `AUTO_TRACK_VERDICT`.
- **Fix**: Restore the default argument (`url = window.location.href`) while keeping the newer fallbacks (Next.js data, `data-question-title-slug`, etc.).
- **Verification**:
  1. Load a LeetCode problem, submit a solution, and watch DevTools → Console for `CodeVault auto-track` logs.
  2. Confirm `chrome://extensions` background page shows a POST to `/api/user/solved`.
  3. Ensure the XP pill in the app updates after a refresh and the new solve appears in “Recent activity”.

> Keep this file updated with future regressions/fixes so anyone can cross-check the known failure modes before debugging auto-tracking again.
