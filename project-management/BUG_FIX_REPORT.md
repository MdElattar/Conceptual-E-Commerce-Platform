# Bug Fix Report: QRCodeSVG "RangeError: Data too long"

## Error
```
RangeError: Data too long
```
Component: `QRCodeSVG`  
Location: `frontend/src/components/TwoFactorSetup.jsx:147`

## Root Cause
The backend (`backend/controllers/userController.js:960`) was generating a **base64-encoded PNG image** of the QR code using `qrcode.toDataURL(secret.otpauth_url)` and sending this ~50KB+ data URL string as `qrCode`. The frontend then passed that massive string to `<QRCodeSVG value={secretData.qrCode}>`.

`QRCodeSVG` from `qrcode.react` expects a **plain text string** to encode into a QR code — not a pre-rendered rasterized image. The base64 PNG data URL far exceeds QR code data capacity limits, causing `RangeError: Data too long`.

## Fix
**Two files changed:**

### `backend/controllers/userController.js`
- **Removed** the `qrcode` npm import (no longer needed)
- **Replaced** `const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url)` with direct passthrough of `secret.otpauth_url`
- The response now sends the raw OTP Auth URI string (e.g. `otpauth://totp/DKTEC:user@example.com?secret=...&issuer=DKTEC`) instead of a base64 PNG data URL

### `backend/__tests__/twoFactor.test.js`
- Updated the test assertion to expect `otpauth://totp/...` format instead of `data:image/png;base64,...`

## Why This Works
1. `speakeasy.generateSecret()` already produces a valid `otpauth_url` string
2. `QRCodeSVG` is designed to accept a text string and render it as a QR code — it's the correct consumer for this data
3. The OTP Auth URI is ~150–200 characters, well within QR code capacity
4. The frontend fully controls QR rendering, consistent with using `qrcode.react`

## Files Changed
| File | Change |
|---|---|
| `backend/controllers/userController.js` | Send `secret.otpauth_url` directly; removed `qrcode` import and `toDataURL()` call |
| `backend/__tests__/twoFactor.test.js` | Updated regex matcher from PNG data URL to `otpauth://` URI |

## Verification
- **All 112 backend tests pass** (including 2FA secret generation, enable, disable, verification)
- **Frontend builds successfully** with `vite build`
- The QR code value is now the correct OTP Auth URI string
- No changes to the 2FA flow logic
