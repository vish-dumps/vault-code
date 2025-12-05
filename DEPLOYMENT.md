# Deployment Guide

This guide provides step-by-step instructions to deploy the application for public use.

## Project Overview
- **Frontend**: React (Vite)
- **Backend**: Node.js (Express)
- **Database**: MongoDB
- **Authentication**: Passport.js / JWT

## Prerequisites
Before deploying, ensure you have the following:
1.  **MongoDB Database**: For production, use a managed service like [MongoDB Atlas](https://www.mongodb.com/atlas/database) (free tier available).
2.  **Email Service**: API keys for [Resend](https://resend.com) or SMTP credentials (Gmail) for sending emails (OTP, notifications).
3.  **Hosting Provider**: A platform to host the Node.js application (e.g., Render, Railway, DigitalOcean).

## Environment Variables
You must configure the following environment variables in your production environment.

| Variable | Description | Example |
| :--- | :--- | :--- |
| `NODE_ENV` | Set to `production` for deployment. | `production` |
| `PORT` | The port the server listens on. | `5000` (or provided by host) |
| `MONGODB_URI` | Connection string for your MongoDB. | `mongodb+srv://user:pass@cluster.mongodb.net/dbname` |
| `JWT_SECRET` | Strong secret key for signing tokens. | `some-very-long-random-string` |
| `JWT_EXPIRES_IN` | Token expiration time. | `7d` |
| `RESEND_API_KEY` | (Optional) API key for Resend emails. | `re_123456789` |
| `SMTP_HOST` | (Optional) SMTP host for email. | `smtp.gmail.com` |
| `SMTP_USER` | (Optional) SMTP username/email. | `user@gmail.com` |
| `SMTP_PASS` | (Optional) SMTP password/app password. | `abcd efgh ijkl mnop` |
| `SMTP_FROM` | Email sender address. | `"My App <noreply@myapp.com>"` |

## Deployment Options

### Option 1: Render (Recommended for Ease of Use)
[Render](https://render.com) is a cloud platform that makes it easy to deploy Node.js apps.

1.  **Push your code to GitHub/GitLab**.
2.  **Create a Web Service** in Render.
3.  **Connect your repository**.
4.  **Configure the service**:
    *   **Runtime**: Node
    *   **Build Command**: `npm install && npm run build`
    *   **Start Command**: `npm start`
5.  **Add Environment Variables**:
    *   Copy the variables from the table above into the "Environment" tab.
    *   Ensure `NODE_ENV` is `production`.
6.  **Deploy**: Click "Create Web Service". Render will build and deploy your app.

### Option 2: Railway
[Railway](https://railway.app) is another excellent option with zero config.

1.  **Login to Railway** and create a new project.
2.  **Deploy from GitHub repo**.
3.  **Variables**: Go to the "Variables" tab and add your `MONGODB_URI`, `JWT_SECRET`, etc.
4.  **Build & Start**: Railway usually detects `package.json` scripts automatically.
    *   It will run `npm install`, `npm run build`, and `npm start`.
5.  **Domain**: Railway assigns a default domain (e.g., `project.up.railway.app`).

### Option 3: VPS (DigitalOcean / Ubuntu)
For full control, you can deploy on a Virtual Private Server.

1.  **Provision a Server**: Ubuntu 20.04/22.04 LTS.
2.  **Install Node.js**:
    ```bash
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
    ```
3.  **Clone Repository**:
    ```bash
    git clone <your-repo-url>
    cd <repo-name>
    ```
4.  **Install Dependencies & Build**:
    ```bash
    npm install
    npm run build
    ```
5.  **Setup Process Manager (PM2)**:
    ```bash
    sudo npm install -g pm2
    pm2 start npm --name "myapp" -- start
    pm2 save
    pm2 startup
    ```
6.  **Configure Nginx (Reverse Proxy)**:
    *   Install Nginx: `sudo apt install nginx`
    *   Configure `/etc/nginx/sites-available/default` to proxy requests to `localhost:5000`.
    *   Enable SSL with Certbot.

## Local Production Test
To verify the production build locally before deploying:

1.  **Build the project**:
    ```bash
    npm run build
    ```
2.  **Run in production mode**:
    ```bash
    # Windows
    set NODE_ENV=production && npm start

    # Linux/Mac
    NODE_ENV=production npm start
    ```
3.  **Access**: Open `http://localhost:5000`.

## Troubleshooting
-   **White Screen / 404**: Ensure `npm run build` completed successfully and the `dist/public` folder exists.
-   **Database Connection Error**: Check your `MONGODB_URI`. Ensure your IP is whitelisted in MongoDB Atlas.
-   **Email Failures**: Verify SMTP credentials or Resend API key. Check spam folders.
