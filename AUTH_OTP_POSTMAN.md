# Email OTP Flow (Postman Guide)

The authentication API uses an email one-time passcode (OTP) before issuing the access token. This guide shows how to exercise the flow entirely from Postman.

## 1. Prerequisites
- Run the API server locally (defaults to `http://localhost:5000`).
- Populate the following environment variables in `.env`:
  - `JWT_SECRET`
  - **Email provider (pick one):**
    - **Gmail / Nodemailer:** set `SMTP_USER` (your Gmail address), `SMTP_PASS` (App Password), and optional overrides such as `SMTP_FROM`. Defaults already target Gmail (`smtp.gmail.com`, port `465`, `SMTP_SERVICE=gmail`).
    - **Resend:** set `RESEND_API_KEY` and `RESEND_FROM`.
  - `OTP_LENGTH` and `OTP_EXPIRY_MINUTES` if you want values different from the defaults.
- Restart the server after changing environment variables.

> **No email provider?**  
> When neither SMTP nor Resend is configured the server prints the OTP to the terminal so you can still complete the flow.

## 2. Register (optional)
If you do not already have an account, create one with a `POST` request:

- **URL:** `http://localhost:5000/api/auth/register`
- **Body (JSON):**
  ```json
  {
    "username": "alice",
    "email": "alice@example.com",
    "password": "password123",
    "avatarGender": "female"
  }
  ```
- The response includes `otpRequired`, `otpSession`, and `expiresIn`. Complete signup by calling `POST /api/auth/register/verify` with:
  ```json
  {
    "email": "alice@example.com",
    "otp": "123456",
    "otpSession": "<session-token>"
  }
  ```
- Need a fresh code? `POST /api/auth/register/resend` with the same email/password to receive a new session id.

## 3. Request OTP (login)
Send the credentials to receive an OTP challenge:

- **URL:** `http://localhost:5000/api/auth/login`
- **Body (JSON):**
  ```json
  {
    "email": "alice@example.com",
    "password": "password123"
  }
  ```
- **Expected response (200):**
  ```json
  {
    "message": "OTP verification required",
    "otpRequired": true,
    "otpSession": "<session-token>",
    "expiresIn": 300000
  }
  ```
  - `otpSession` must be included in the next request.
  - `expiresIn` is the lifetime in milliseconds.
  - Check your inbox (and spam folder if needed) for the OTP email.

## 4. Verify OTP
Submit the OTP code together with the session id:

- **URL:** `http://localhost:5000/api/auth/login/verify`
- **Body (JSON):**
  ```json
  {
    "email": "alice@example.com",
    "otp": "123456",
    "otpSession": "<session-token>"
  }
  ```
- **Expected response (200):**
  ```json
  {
    "message": "Login successful",
    "token": "<jwt-token>",
    "user": { "...": "..." }
  }
  ```

Store the `token` as a Postman environment variable (for example `authToken`). Add the header `Authorization: Bearer {{authToken}}` to authenticated requests against `/api/...`.

## 5. Resending the OTP
Call the login endpoint again with the same credentials. A new code (and session id) is returned. Previous codes become invalid once a new session is issued or their expiry time passes.

## 6. Troubleshooting
- **401 / 400 errors** – confirm the `otpSession` matches the latest value from the login response.
- **Expired code** – request a fresh code when the countdown hits `00:00`.
- **Still no email** – double check the SMTP/Resend configuration and ensure the server logs do not show authentication errors.
