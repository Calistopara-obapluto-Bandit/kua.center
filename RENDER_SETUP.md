# Render Setup for KUAC

This project is set up for Render's **Web Service** plan so the email can be sent with a branded sender name.

## Live Site

- Canonical URL: `https://kuac-center.onrender.com/`
- Use this URL for redirects, bookmarks, and any future deployment notes.

## Service Type

- Type: `Web Service`
- Runtime: `Node`
- Build command: `npm install`
- Start command: `npm start`

## Required Render Settings

Required runtime environment variables:

- `CALLBACK_TO_EMAIL=kua.center@gmail.com`
- `SMTP_HOST=...`
- `SMTP_PORT=587`
- `SMTP_SECURE=false`
- `SMTP_USER=...`
- `SMTP_PASS=...`
- `CALLBACK_FROM_NAME=Krains UniAid Center`
- `CALLBACK_FROM_EMAIL=no-reply@kua.center`

## Callback Flow

- Fill in the client's name, phone, and note.
- Put the client's email in the email field, not KUAC's.
- Attach a photo or document if it helps explain the request.
- Press `Send to KUAC` to submit the callback form.
- The form posts to `/api/callback` on the same site.
- The support inbox receives the email from `Krains UniAid Center`.
- The reply-to is the client's email address, so replies go to the right person.

## Attachment Notes

- The form uses normal browser form submission and the backend relays the attachment.
- Keep the total file size under the backend attachment limit you configure.
- Good formats for this workflow are `pdf`, `png`, `jpg`, `jpeg`, `webp`, `doc`, and `docx`.

## First-Time Activation

If you're using Gmail SMTP, create and use an app password instead of your normal Google password.

## Quick Test

1. Open the live site.
2. Fill in the callback form with a test name, the client's email, and phone number.
3. Click `Send to KUAC`.
4. Check `kua.center@gmail.com` for the submission email.
5. Confirm the sender shows as `Krains UniAid Center`.
