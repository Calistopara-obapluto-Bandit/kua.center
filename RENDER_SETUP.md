# Render Setup for KUAC

This project can be deployed as a **static site** for the callback form, because the form now sends through FormSubmit.

If you still want to keep the Node server for the `/api/health` route or other app behavior, Render can run it as a Web Service too.

## Service Type

- Type: `Web Service`
- Runtime: `Node`
- Build command: `npm install`
- Start command: `npm start`

## Required Environment Variables

If you keep the Node service, set these in the Render service settings:

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

- `GET /api/health` should return JSON like `{ "ok": true, "status": "healthy" }` if you keep the Node service
- The callback form should post to FormSubmit and may send an activation email to `kua.center@gmail.com` the first time

## Quick Test

1. Open the site.
2. Submit the callback form with a test name and phone number.
3. Check the inbox at `kua.center@gmail.com`.
4. If it fails, inspect Render logs for SMTP auth or connection errors.

## Notes

- A plain static deployment is now enough for the callback form.
- If you use Gmail SMTP, the password must be a Gmail app password, not your normal Google password.
