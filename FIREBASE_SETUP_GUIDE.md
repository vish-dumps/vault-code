# Firebase Storage Setup Guide for Profile Pictures

## Overview
CodeVault currently stores profile picture URLs in the database, but to enable actual file uploads, you need to set up Firebase Storage.

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Follow the setup wizard (you can disable Google Analytics if not needed)

## Step 2: Enable Firebase Storage

1. In your Firebase project, click on "Storage" in the left sidebar
2. Click "Get Started"
3. Choose "Start in production mode" (we'll configure rules next)
4. Select a storage location (choose one closest to your users)
5. Click "Done"

## Step 3: Configure Storage Rules

In the Firebase Console, go to Storage > Rules and replace with:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /profile-pictures/{userId}/{fileName} {
      // Allow authenticated users to upload their own profile pictures
      allow write: if request.auth != null && request.auth.uid == userId
                   && request.resource.size < 5 * 1024 * 1024  // Max 5MB
                   && request.resource.contentType.matches('image/.*');
      
      // Allow anyone to read profile pictures
      allow read: if true;
    }
  }
}
```

## Step 4: Get Firebase Configuration

1. In Firebase Console, click the gear icon (⚙️) next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps" section
4. Click the web icon (</>) to add a web app
5. Register your app with a nickname (e.g., "CodeVault Web")
6. Copy the Firebase configuration object

## Step 5: Add Firebase to Your Project

### Install Firebase SDK

```bash
npm install firebase
```

### Create Firebase Configuration File

Create `client/src/lib/firebase.ts`:

```typescript
import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Storage
export const storage = getStorage(app);
```

### Add Environment Variables

Add to your `.env` file:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## Step 6: Implement Profile Picture Upload

The upload functionality has been added to your settings page. Here's how it works:

1. User selects an image file
2. File is validated (max 5MB, image types only)
3. File is uploaded to Firebase Storage at `/profile-pictures/{userId}/{filename}`
4. Download URL is saved to user profile in MongoDB
5. Avatar displays the uploaded image

## Alternative: Use Cloudinary (Simpler Option)

If Firebase seems complex, you can use Cloudinary which is simpler:

1. Sign up at [Cloudinary](https://cloudinary.com/)
2. Get your cloud name, API key, and API secret
3. Install: `npm install cloudinary`
4. Use their upload widget or API for direct uploads

### Cloudinary Setup (Server-side)

```typescript
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Upload endpoint
app.post('/api/upload/profile-picture', upload.single('file'), async (req, res) => {
  const result = await cloudinary.uploader.upload(req.file.path, {
    folder: 'codevault/profiles',
    public_id: `user_${userId}`,
    overwrite: true
  });
  
  // Save result.secure_url to user profile
});
```

## Current Implementation

The profile picture upload functionality is already implemented in your settings page. You just need to:

1. Choose Firebase or Cloudinary
2. Set up the service following the guide above
3. Add the environment variables
4. The upload will work automatically

## Testing

1. Go to Settings page
2. Click on "Upload Image" in the Profile Picture section
3. Select an image file (max 5MB)
4. The image should upload and display immediately
5. Check Firebase Storage console to see the uploaded file

## Troubleshooting

- **CORS errors**: Make sure Firebase Storage rules allow your domain
- **Upload fails**: Check file size (max 5MB) and file type (images only)
- **Image not displaying**: Verify the download URL is being saved correctly
- **Authentication errors**: Ensure user is logged in before uploading

## Security Notes

- Profile pictures are publicly readable (anyone can view them)
- Only authenticated users can upload to their own folder
- File size is limited to 5MB
- Only image file types are allowed
- Old profile pictures are automatically replaced when uploading new ones
