# Code Snippet Auto-Tracking Guide

## Current Status

The CodeVault extension currently tracks:
- ✅ Problem title
- ✅ Platform (LeetCode, Codeforces)
- ✅ Difficulty
- ✅ Solved timestamp
- ✅ Problem link
- ❌ **Code snippets** (not yet implemented)

## Why Code Snippets Aren't Auto-Saved Yet

Capturing code from online coding platforms is challenging because:

1. **Different Editor Implementations**: Each platform uses different editor libraries
   - LeetCode: Monaco Editor (VS Code's editor)
   - Codeforces: CodeMirror or Ace Editor
   - Each requires different DOM access methods

2. **Dynamic Content**: Code editors use complex DOM structures that change frequently

3. **Privacy & Security**: Browser extensions have limited access to page content for security reasons

4. **Timing Issues**: Need to capture code at the exact moment of submission

## Implementation Options

### Option 1: Manual Copy-Paste (Current Workaround)

**How it works:**
1. Solve problem on platform
2. Extension auto-tracks the solve
3. Go to CodeVault solved dashboard
4. Click "Add Code" button on the question
5. Paste your solution manually

**Pros:**
- Works immediately
- No complex implementation
- User has full control

**Cons:**
- Requires manual action
- Easy to forget

### Option 2: Browser Extension Enhancement (Recommended)

Modify the extension to capture code from editors:

#### For LeetCode (Monaco Editor):

```javascript
// Add to content.js
function captureMonacoCode() {
  try {
    // Monaco stores editor instances globally
    if (window.monaco && window.monaco.editor) {
      const editors = window.monaco.editor.getEditors();
      if (editors && editors.length > 0) {
        const code = editors[0].getValue();
        const language = editors[0].getModel()?.getLanguageId() || 'unknown';
        return { code, language };
      }
    }
  } catch (error) {
    console.error('Failed to capture Monaco code:', error);
  }
  return null;
}
```

#### For Codeforces (CodeMirror):

```javascript
// Add to content.js
function captureCodeMirrorCode() {
  try {
    // CodeMirror instances are usually accessible via DOM
    const editorElement = document.querySelector('.CodeMirror');
    if (editorElement && editorElement.CodeMirror) {
      const code = editorElement.CodeMirror.getValue();
      // Try to detect language from dropdown or URL
      const languageSelect = document.querySelector('select[name="programTypeId"]');
      const language = languageSelect?.selectedOptions[0]?.text || 'unknown';
      return { code, language };
    }
  } catch (error) {
    console.error('Failed to capture CodeMirror code:', error);
  }
  return null;
}
```

#### Update Auto-Track Handler:

```javascript
// Modify handleAutoTrackDetection in background.js
async function handleAutoTrackDetection(payload) {
  const { platform, problemId, title, difficulty, link, code, language } = payload;
  
  // ... existing code ...
  
  const requestBody = {
    userId,
    problemId: normalizedProblemId,
    title,
    platform,
    difficulty,
    link,
    solvedAt: new Date().toISOString(),
    tags: []
  };

  // Add code snippet if available
  if (code && language) {
    requestBody.code = code;
    requestBody.language = language;
  }

  // ... rest of the code ...
}
```

#### Update Server to Accept Code:

```typescript
// In server/routes.ts - POST /api/user/solved
const payload = solvedProblemPayloadSchema.parse(req.body);

// After creating the question, add approach if code is provided
if (payload.code && payload.language) {
  await mongoStorage.createApproach(
    question.id,
    userId,
    {
      name: 'Auto-tracked solution',
      language: payload.language,
      code: payload.code,
      notes: 'Automatically captured from submission'
    }
  );
}
```

### Option 3: Platform-Specific Browser Extensions

Create separate extensions for each platform with deep integration:

**Pros:**
- Better code capture
- Platform-specific features

**Cons:**
- Maintain multiple extensions
- More complex

### Option 4: IDE Integration

Create plugins for VS Code, IntelliJ, etc.:

**Pros:**
- Direct code access
- Better user experience

**Cons:**
- Users must code in IDE
- Doesn't work for online platforms

## Recommended Implementation Steps

### Phase 1: Add UI for Manual Code Entry (Immediate)

1. Add "Add Code" button to solved questions dashboard
2. Open modal with code editor (Monaco or CodeMirror)
3. Save as approach to existing question

**Implementation:**
```typescript
// In client/src/pages/solved.tsx
const addCodeMutation = useMutation({
  mutationFn: async ({ questionId, code, language }) => {
    const res = await apiRequest('POST', `/api/questions/${questionId}/approaches`, {
      name: 'Solution',
      language,
      code,
      notes: ''
    });
    return res.json();
  },
  onSuccess: () => {
    toast({ title: 'Code saved successfully' });
    queryClient.invalidateQueries({ queryKey: ['/api/user/solved'] });
  }
});
```

### Phase 2: Extension Code Capture (Next Sprint)

1. Implement platform-specific code capture functions
2. Test on multiple browsers (Chrome, Firefox, Edge)
3. Handle edge cases (multiple editors, iframes, etc.)
4. Add user permission for code access

### Phase 3: Automatic Sync (Future)

1. Capture code on submission
2. Store temporarily in extension
3. Sync to server when online
4. Handle conflicts and duplicates

## Testing Checklist

- [ ] LeetCode: Capture code from Monaco editor
- [ ] Codeforces: Capture code from CodeMirror
- [ ] Handle multiple languages (Python, Java, C++, JavaScript)
- [ ] Handle large code files (>10KB)
- [ ] Handle special characters and Unicode
- [ ] Test on different browsers
- [ ] Test with slow internet connections
- [ ] Handle submission failures gracefully

## Security Considerations

1. **Code Privacy**: User's code is sensitive
   - Store encrypted in transit (HTTPS)
   - Don't share without permission
   - Allow users to delete code

2. **Extension Permissions**: Request minimal permissions
   - Only access specific domains (leetcode.com, codeforces.com)
   - Explain why permissions are needed

3. **Data Storage**: 
   - Don't store code in extension (limited storage)
   - Send directly to server
   - Implement retry mechanism for failed uploads

## Alternative: Manual Workflow Enhancement

Instead of auto-capturing, improve the manual workflow:

1. **Quick Copy Button**: Add button to copy code from platform
2. **Browser Clipboard API**: Auto-paste when adding code
3. **Keyboard Shortcuts**: Ctrl+Shift+S to save code
4. **Browser Action**: Click extension icon to save current code

## Current Workaround for Users

**Step-by-step:**

1. Solve problem on LeetCode/Codeforces
2. Extension auto-tracks the solve ✅
3. Copy your solution code (Ctrl+A, Ctrl+C)
4. Go to CodeVault → Solved Questions
5. Find the auto-tracked question
6. Click "View Details"
7. Click "Add Approach"
8. Paste code and select language
9. Save

**This works today without any code changes!**

## Conclusion

**Immediate Action:** Document the manual workflow for users

**Short-term:** Add better UI for manual code entry

**Long-term:** Implement automatic code capture in extension

The manual workflow is actually quite fast (30 seconds) and gives users full control over what code they save. Consider this the MVP approach while planning the automatic solution.
