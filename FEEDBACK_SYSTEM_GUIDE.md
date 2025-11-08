# Feedback System Guide

## How the Feedback System Works

The feedback system in CodeVault allows users to submit feedback, bug reports, feature requests, and general comments. Here's how it works:

### 1. Frontend (Feedback Page)
- Located at: `client/src/pages/feedback.tsx`
- Users can:
  - Rate their experience (1-5 stars)
  - Select a category (General, Feature Request, Bug Report, Improvement)
  - Provide detailed feedback text
  - Optionally add feature suggestions
  - Optionally report bugs
  - Optionally add a personal note for the creator

### 2. Backend Processing
- Endpoint: `POST /api/feedback`
- Located in: `server/routes.ts` (lines 1351-1408)
- The system:
  1. Validates the user is authenticated
  2. Saves feedback to MongoDB (Feedback collection)
  3. Sends an email notification to you (the creator)

### 3. Email Notifications
- Uses **nodemailer** with Gmail
- Sends formatted emails from: `codevault.updates@gmail.com` to: `vishwasthesoni@gmail.com`
- Email includes:
  - User's username and email
  - Rating (with star emojis)
  - Category
  - All feedback fields
  - Timestamp

## Setting Up Email Notifications

### Current Issue
The feedback system is failing because the `EMAIL_PASSWORD` environment variable is not set.

### Solution: Set Up Gmail App Password

1. **Enable 2-Factor Authentication on Gmail**
   - Go to your Google Account settings
   - Security → 2-Step Verification
   - Enable it if not already enabled

2. **Generate App Password**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" as the app
   - Select "Other" as the device and name it "CodeVault"
   - Click "Generate"
   - Copy the 16-character password (format: xxxx xxxx xxxx xxxx)

3. **Add to Environment Variables**

Add to your `.env` file:

```env
# Email Configuration for Feedback System
EMAIL_USER=codevault.updates@gmail.com
EMAIL_PASSWORD=your_16_character_app_password_here
```

**Important**: 
- Remove spaces from the app password
- Never commit the `.env` file to git
- The app password is different from your regular Gmail password

### Alternative: Use a Different Email Service

If you prefer not to use Gmail, you can use other services:

#### SendGrid (Recommended for production)
```bash
npm install @sendgrid/mail
```

```typescript
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendFeedbackEmail(feedback: any) {
  const msg = {
    to: 'codevault.updates@gmail.com',
    from: 'noreply@yourdomain.com', // Must be verified in SendGrid
    subject: `CodeVault Feedback - ${feedback.rating} Stars`,
    html: `...` // Same HTML template
  };
  
  await sgMail.send(msg);
}
```

#### Resend (Modern alternative)
```bash
npm install resend
```

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendFeedbackEmail(feedback: any) {
  await resend.emails.send({
    from: 'CodeVault <noreply@yourdomain.com>',
    to: 'codevault.updates@gmail.com',
    subject: `CodeVault Feedback - ${feedback.rating} Stars`,
    html: `...` // Same HTML template
  });
}
```

## How to Receive Feedback

### Option 1: Email Notifications (Current Setup)
- Feedback is sent to `codevault.updates@gmail.com`
- You receive an email for each submission
- Feedback is also stored in MongoDB

### Option 2: Admin Dashboard (Future Enhancement)
You could create an admin page to view all feedback:

```typescript
// Add to routes.ts
app.get("/api/admin/feedback", async (req: AuthRequest, res) => {
  // Add admin authentication check
  const feedbacks = await Feedback.find()
    .sort({ createdAt: -1 })
    .populate('userId', 'username email')
    .limit(100);
  
  res.json(feedbacks);
});
```

### Option 3: MongoDB Direct Access
You can query feedback directly from MongoDB:

```bash
# Connect to MongoDB
mongosh "your_mongodb_connection_string"

# View all feedback
use codevault
db.feedbacks.find().sort({createdAt: -1}).pretty()

# View feedback by rating
db.feedbacks.find({rating: 5}).pretty()

# View feedback by category
db.feedbacks.find({category: "bug"}).pretty()
```

## Testing the Feedback System

1. **Set up email credentials** (see above)
2. **Restart your server** to load new environment variables
3. **Submit test feedback** through the UI
4. **Check your email** for the notification
5. **Verify in MongoDB** that feedback was saved

## Troubleshooting

### Error: "Failed to submit feedback"
- Check that `EMAIL_USER` and `EMAIL_PASSWORD` are set in `.env`
- Verify Gmail app password is correct (no spaces)
- Check server logs for detailed error messages

### Email not received
- Check spam/junk folder
- Verify email address in routes.ts (line 109)
- Test with a different email service (SendGrid/Resend)

### MongoDB not saving feedback
- Check MongoDB connection
- Verify Feedback model is imported in routes.ts
- Check server logs for database errors

## Current Status

✅ **Working:**
- Feedback form UI
- Data validation
- MongoDB storage
- Email template

❌ **Needs Setup:**
- Gmail app password (EMAIL_PASSWORD environment variable)
- Server restart after adding credentials

## Quick Fix

1. Add to `.env`:
```env
EMAIL_PASSWORD=your_gmail_app_password
```

2. Restart server:
```bash
npm run dev
```

3. Test feedback submission

That's it! The feedback system should now work perfectly.
