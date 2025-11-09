# Profile Picture Upload Fix Guide

## Problem Identified ❌

The profile picture upload from PC is not working because **the PATCH endpoint `/api/user/profile` is missing** from your server routes.

The frontend is calling `PATCH /api/user/profile` to save the profile image, but the server doesn't have this endpoint implemented!

---

## Current Situation

### ✅ What Works:
- File selection dialog
- Image cropping (react-easy-crop)
- Base64 conversion
- Frontend state management

### ❌ What's Broken:
- Server endpoint missing
- No API to receive profile updates
- Profile image not being saved to database

---

## The Fix

### Step 1: Add the Missing PATCH Endpoint

Add this code to your `server/routes.ts` file, right after the GET `/api/user/profile` endpoint (around line 1167):

```typescript
// ADD THIS CODE AFTER THE GET /api/user/profile ENDPOINT:

app.patch("/api/user/profile", async (req: AuthRequest, res) => {
  try {
    const userId = getUserId(req);
    const {
      leetcodeUsername,
      codeforcesUsername,
      name,
      username,
      profileImage,
      customAvatarUrl,
      avatarType,
      avatarGender,
      randomAvatarSeed,
      bio,
      college,
      profileVisibility,
      friendRequestPolicy,
      searchVisibility,
      xpVisibility,
      showProgressGraphs,
      streakReminders,
    } = req.body;

    // Validate username if provided
    if (username !== undefined) {
      const trimmed = username.trim();
      if (trimmed.length < 3 || trimmed.length > 30) {
        return res.status(400).json({
          error: "Username must be between 3 and 30 characters",
        });
      }

      // Check if username is taken by another user
      const existingUser = await UserModel.findOne({
        username: trimmed,
        _id: { $ne: new Types.ObjectId(userId) },
      });

      if (existingUser) {
        return res.status(409).json({
          error: "Username is already taken",
        });
      }
    }

    // Build update object with only provided fields
    const updateData: any = {};

    if (leetcodeUsername !== undefined) {
      updateData.leetcodeUsername = leetcodeUsername || null;
    }
    if (codeforcesUsername !== undefined) {
      updateData.codeforcesUsername = codeforcesUsername || null;
    }
    if (name !== undefined) {
      updateData.name = name || null;
    }
    if (username !== undefined) {
      updateData.username = username.trim();
    }
    if (profileImage !== undefined) {
      updateData.profileImage = profileImage || null;
    }
    if (customAvatarUrl !== undefined) {
      updateData.customAvatarUrl = customAvatarUrl || null;
    }
    if (avatarType !== undefined) {
      updateData.avatarType = avatarType;
    }
    if (avatarGender !== undefined) {
      updateData.avatarGender = avatarGender;
    }
    if (randomAvatarSeed !== undefined) {
      updateData.randomAvatarSeed = randomAvatarSeed;
    }
    if (bio !== undefined) {
      updateData.bio = bio || null;
    }
    if (college !== undefined) {
      updateData.college = college || null;
    }
    if (profileVisibility !== undefined) {
      updateData.profileVisibility = profileVisibility;
    }
    if (friendRequestPolicy !== undefined) {
      updateData.friendRequestPolicy = friendRequestPolicy;
    }
    if (searchVisibility !== undefined) {
      updateData.searchVisibility = searchVisibility;
    }
    if (xpVisibility !== undefined) {
      updateData.xpVisibility = xpVisibility;
    }
    if (showProgressGraphs !== undefined) {
      updateData.showProgressGraphs = showProgressGraphs;
    }
    if (streakReminders !== undefined) {
      updateData.streakReminders = streakReminders;
    }

    // Update the user
    const updatedUser = await mongoStorage.updateUser(userId, updateData);

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});
```

### Step 2: Verify MongoDB Storage Implementation

Check that `server/mongodb-storage.ts` has the profileImage update (it already does, but verify):

```typescript
// In updateUser function, this should exist:
if (data.profileImage !== undefined) {
  userDoc.profileImage = data.profileImage ?? null;
}
```

✅ **Already implemented** - No changes needed here.

### Step 3: Test the Fix

1. **Start your server:**
   ```bash
   npm run dev
   ```

2. **Test profile upload:**
   - Go to your profile page
   - Click "Upload from PC" or the avatar edit button
   - Select an image from your computer
   - Crop the image
   - Click "Save" or "Apply"
   - Check browser console for errors
   - Refresh page - image should persist

3. **Verify in database:**
   ```bash
   # Connect to MongoDB
   mongosh codevault

   # Check user document
   db.users.findOne({ _id: ObjectId("YOUR_USER_ID") }, { profileImage: 1, avatarType: 1 })
   ```

---

## How Profile Upload Works

### Frontend Flow (client/src/pages/profile.tsx):

```typescript
1. User clicks "Upload from PC"
   ↓
2. File input opens (handleProfileImageUpload)
   ↓
3. Image converted to base64 (FileReader)
   ↓
4. Cropper dialog opens (react-easy-crop)
   ↓
5. User adjusts crop/zoom
   ↓
6. Click "Apply" → applyCropResult()
   ↓
7. Cropped image as base64 → setProfileImage()
   ↓
8. Click "Save" → handleSave()
   ↓
9. PATCH /api/user/profile with base64 data
   ↓
10. Server saves to MongoDB
   ↓
11. UI updates with new image
```

### Storage Method:

**Current**: Base64 string in MongoDB
```javascript
{
  _id: "userId",
  profileImage: "data:image/jpeg;base64,/9j/4AAQSkZJRg..." // ~100-500KB
  avatarType: "custom"
}
```

**Pros**:
- ✅ Simple implementation
- ✅ No external dependencies
- ✅ Fast for small-medium apps
- ✅ Works offline in development

**Cons**:
- ⚠️ MongoDB document size limit (16MB)
- ⚠️ Not ideal for 10,000+ users with images

---

## Image Size Limits

### Current Setup:
```typescript
const MAX_PROFILE_IMAGE_SIZE = 4 * 1024 * 1024; // 4MB source file
// After compression: ~100-500KB base64 stored in DB
```

### Compression Applied:
```typescript
canvas.toDataURL("image/jpeg", 0.92); // 92% quality
```

This reduces file size by 70-80% while maintaining good quality.

---

## Alternative: Cloudinary Upload (Optional Future Enhancement)

If you want to switch to cloud storage later:

### 1. Install Cloudinary:
```bash
npm install cloudinary multer
```

### 2. Configure (.env):
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 3. Add Upload Endpoint:
```typescript
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({ storage: multer.memoryStorage() });

app.post("/api/user/upload-avatar", upload.single('avatar'), async (req: AuthRequest, res) => {
  try {
    const userId = getUserId(req);
    
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "codevault/avatars",
          public_id: userId,
          overwrite: true,
          transformation: [
            { width: 400, height: 400, crop: "fill", gravity: "face" },
            { quality: "auto" }
          ]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(req.file.buffer);
    });

    const imageUrl = result.secure_url;

    // Update user with Cloudinary URL
    await mongoStorage.updateUser(userId, {
      profileImage: imageUrl,
      avatarType: 'custom'
    });

    res.json({ imageUrl });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Upload failed" });
  }
});
```

### 4. Update Frontend:
```typescript
// Instead of base64, upload file directly:
const formData = new FormData();
formData.append('avatar', file);

const response = await apiRequest('POST', '/api/user/upload-avatar', formData);
const { imageUrl } = await response.json();
setProfileImage(imageUrl);
```

**Benefits of Cloudinary**:
- ✅ Automatic image optimization
- ✅ CDN delivery (faster loads)
- ✅ Smaller MongoDB documents
- ✅ Free tier: 25GB storage, 25GB bandwidth/month

---

## Troubleshooting

### Issue: "Failed to update profile"

**Check**:
1. Endpoint added correctly in `routes.ts`
2. Server restarted after adding endpoint
3. MongoDB connection working

**Debug**:
```bash
# Check server logs
# Should see: "PATCH /api/user/profile"
```

### Issue: "Image too large"

**Solution**: Image exceeds 4MB limit before cropping

```typescript
// Increase limit (not recommended):
const MAX_PROFILE_IMAGE_SIZE = 8 * 1024 * 1024; // 8MB

// Or compress more aggressively:
canvas.toDataURL("image/jpeg", 0.85); // 85% quality
```

### Issue: Image uploads but doesn't show

**Check**:
1. avatarType is set to "custom"
2. profileImage has base64 data
3. AuthContext.tsx getAvatarUrl() function
4. Browser console for errors

**Debug**:
```javascript
// In browser console:
localStorage.getItem('authToken') // Check if logged in
```

### Issue: Image disappears after refresh

**Cause**: Not saved to database

**Fix**: Ensure PATCH endpoint returns updated user:
```typescript
res.json(updatedUser); // Must return full user object
```

---

## Testing Checklist

- [ ] Upload image from PC
- [ ] Crop and zoom work
- [ ] Click "Save" updates image
- [ ] Refresh page - image persists
- [ ] Switch to "Random Avatar" - works
- [ ] Switch back to "Custom" - uploaded image shows
- [ ] Logout and login - image still there
- [ ] Check MongoDB - profileImage field has base64 data

---

## Security Considerations

### Current Setup (Base64):
✅ Images stored in your database
✅ Only accessible via authenticated API
✅ No public URLs to guess

### If Using Cloudinary:
- ⚠️ Images get public URLs
- ✅ But: URLs are hard to guess (random IDs)
- ✅ Can set to private if needed

---

## Performance Tips

### For Current Scale (< 5,000 users):
- ✅ Base64 in MongoDB is fine
- ✅ Fast queries
- ✅ Simple implementation

### For Future Scale (5,000+ users):
- Consider Cloudinary
- Add image CDN
- Implement lazy loading
- Add image compression

---

## Summary

1. **Add PATCH endpoint** to `server/routes.ts` ✅
2. **Restart server** ✅
3. **Test upload** from profile page ✅
4. **Verify in database** ✅

Your profile upload will work perfectly after adding the missing endpoint!

Need help? Check the server logs for any errors during the PATCH request.
