# Render Setup for KUAC

This project needs a **Render Web Service**, not a static site, because the callback form is handled by `server.js`.

## Service Type

- Type: `Web Service`
- Runtime: `Node`
- Build command: `npm install`
- Start command: `npm start`

## Required Environment Variables

Set these in the Render service settings:

- `CALLBACK_TO_EMAIL=kua.center@gmail.com`
- `FORMSUBMIT_ORIGIN=https://kuac-center.onrender.com`

Optional SMTP fallback:

- `SMTP_HOST=smtp.gmail.com`
- `SMTP_PORT=587`
- `SMTP_SECURE=false`
- `SMTP_USER=kua.center@gmail.com`
- `SMTP_PASS=<Gmail app password>`
- `CALLBACK_FROM_EMAIL=kua.center@gmail.com` or another approved sender address

## Frontend API URL

The frontend uses:

- `https://kua-center.onrender.com/api/callback`

That value is set in [`config.js`](./config.js). If your backend URL changes, update that file and redeploy the frontend.

## Health Check

After deploy, verify:

- `GET /api/health` should return JSON like `{ "ok": true, "status": "healthy" }`
- `POST /api/callback` should accept JSON with `name`, `phone`, and optional `message`
- The first FormSubmit delivery may send an activation email to `kua.center@gmail.com`; confirm it once if prompted

## Quick Test

1. Open the site.
2. Submit the callback form with a test name and phone number.
3. Check the inbox at `kua.center@gmail.com`.
4. If it fails, inspect Render logs for SMTP auth or connection errors.

## Notes

- A plain static deployment cannot send callback emails.
- If you use Gmail SMTP, the password must be a Gmail app password, not your normal Google password.
