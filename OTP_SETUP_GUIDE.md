# OTP Service Setup Guide

## Overview
The OTP (One-Time Password) service supports both **local development** and **production deployment** with automatic endpoint routing.

## Architecture

### 1. **Local Development** (Port 4001)
- Uses Express server: `api/otp-server.js`
- Runs on `http://localhost:4001`
- In-memory OTP storage (Map-based)

### 2. **Production** (Vercel Serverless)
- Individual serverless functions in `/api` folder
- Deployed as Vercel Functions
- Accessible via `/api/*` routes

### 3. **Client Utilities** (`src/utils/otpUtils.js`)
- Automatically routes to correct endpoint based on environment
- Checks `REACT_APP_MAIL_API_BASE` environment variable
- Falls back to hostname detection (localhost vs production)

## Configuration

### Environment Variables (`.env`)

```env
# Mail API Configuration
REACT_APP_MAIL_API_BASE=http://localhost:4001
MAIL_API_PORT=4001

# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=noreplygsd12@gmail.com
SMTP_PASS=ckfo wpow pfmq ziwd
MAIL_FROM=noreplygsd12@gmail.com
```

## Endpoint Routing Logic

The client utilities use this routing pattern:

```javascript
const hostname = typeof window !== "undefined" ? window.location.hostname : "";
const isLocal = /^(localhost|127\.0\.0\.1)$/i.test(hostname);
const baseOverride = process.env.REACT_APP_MAIL_API_BASE;

const endpoint = baseOverride
    ? `${baseOverride.replace(/\/$/, "")}/send-login-otp`  // Use env variable if set
    : isLocal
    ? "http://localhost:4001/send-login-otp"               // Local development
    : "/api/send-login-otp";                               // Production (Vercel)
```

## Available OTP Functions

### 1. Login OTP
- **Send**: `sendLoginOtpMail(user_id, email, fullName)`
- **Validate**: `validateLoginOtp(user_id, otp, email)`
- **Expiration**: 3 minutes
- **Endpoints**: `/send-login-otp`, `/validate-login-otp`

### 2. Password Reset OTP
- **Send**: `sendPasswordResetOtpMail(email, fullName)`
- **Validate**: `validatePasswordResetOtp(email, otp)`
- **Expiration**: 10 minutes
- **Endpoints**: `/send-password-reset-otp`, `/validate-password-reset-otp`

### 3. Two-Factor Authentication (2FA) OTP
- **Send**: `send2FAOtpMail(user_id, email, fullName)`
- **Validate**: `validate2FAOtp(user_id, otp)`
- **Expiration**: 5 minutes
- **Endpoints**: `/send-2fa-otp`, `/validate-2fa-otp`

### 4. Email Verification OTP
- **Send**: `sendEmailVerificationOtp(email, fullName)`
- **Validate**: `validateEmailVerificationOtp(email, otp)`
- **Expiration**: 3 minutes
- **Endpoints**: `/send-email-verification`, `/validate-email-verification`

## Usage Examples

### Import the utilities:
```javascript
import { 
    sendLoginOtpMail, 
    validateLoginOtp,
    sendPasswordResetOtpMail,
    validatePasswordResetOtp,
    send2FAOtpMail,
    validate2FAOtp,
    sendEmailVerificationOtp,
    validateEmailVerificationOtp
} from '../utils/otpUtils';
```

### Send Login OTP:
```javascript
try {
    const response = await sendLoginOtpMail(userId, email, fullName);
    if (response.status === 'success') {
        console.log('OTP sent successfully');
    }
} catch (error) {
    console.error('Failed to send OTP:', error);
}
```

### Validate OTP:
```javascript
try {
    const response = await validateLoginOtp(userId, otpCode, email);
    if (response.status === 'success') {
        console.log('OTP validated successfully');
    }
} catch (error) {
    console.error('Invalid OTP:', error);
}
```

## Running the Local Server

### Start the OTP server:
```bash
cd api
node otp-server.js
```

The server will start on port 4001 (or the port specified in `MAIL_API_PORT`).

### Server endpoints:
- `GET /health` - Health check
- `POST /send-login-otp` - Send login OTP
- `POST /validate-login-otp` - Validate login OTP
- `POST /send-password-reset-otp` - Send password reset OTP
- `POST /validate-password-reset-otp` - Validate password reset OTP
- `POST /send-2fa-otp` - Send 2FA OTP
- `POST /validate-2fa-otp` - Validate 2FA OTP
- `POST /send-email-verification` - Send email verification OTP
- `POST /validate-email-verification` - Validate email verification OTP

## Deployment to Production

### Vercel Deployment:
1. The individual API files in `/api` folder are automatically deployed as serverless functions
2. They are accessible via `/api/*` routes
3. No additional configuration needed - Vercel auto-detects the functions

### Environment Variables in Production:
Make sure to set these in your Vercel project settings:
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `MAIL_FROM`

## Testing

### Local Testing:
1. Start the OTP server: `node api/otp-server.js`
2. Start your React app: `npm start`
3. The app will automatically connect to `http://localhost:4001`

### Production Testing:
1. Deploy to Vercel
2. The app will automatically use `/api/*` endpoints
3. No code changes needed

## Troubleshooting

### OTP not sending:
- Check SMTP credentials in `.env`
- Verify the OTP server is running (for local)
- Check console logs for errors

### Wrong endpoint being called:
- Verify `REACT_APP_MAIL_API_BASE` in `.env`
- Check browser console for endpoint logs
- Ensure hostname detection is working correctly

### CORS errors:
- The OTP server has CORS enabled for all origins
- Vercel functions automatically handle CORS

## Security Notes

1. **OTP Storage**: Currently uses in-memory storage (Map). For production, consider:
   - Redis for distributed systems
   - Database with TTL/expiration
   
2. **Rate Limiting**: Consider implementing rate limiting to prevent abuse

3. **SMTP Credentials**: Never commit `.env` file to version control

4. **OTP Expiration**: Different OTP types have different expiration times:
   - Login: 3 minutes
   - Password Reset: 10 minutes
   - 2FA: 5 minutes
   - Email Verification: 3 minutes

## Files Modified

1. `.env` - Added `REACT_APP_MAIL_API_BASE` and `MAIL_API_PORT`
2. `src/utils/otpUtils.js` - Updated all endpoints to use port 4001 and added 2FA/email verification functions
3. `api/otp-server.js` - Updated default port from 3001 to 4001
