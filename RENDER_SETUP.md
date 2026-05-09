# Render Setup for KUAC

This project is set up for Render's **Node web service** plan with FormSubmit and a server-backed chat thread.

## Live Site

- Canonical URL: `https://kua-center.onrender.com/`
- Use this URL for redirects, bookmarks, and any future deployment notes.
- The callback form falls back to this URL when the site is opened outside a normal HTTP(S) origin.

## Service Type

- Type: `Web Service`
- Environment: `Node`
- Build command: `npm run ci:validate`
- Start command: `npm start`

## Required Render Settings

Set `AGENT_DASHBOARD_PASSWORD` in Render if you want the private dashboard login to work against the server-backed session gate.
The private dashboard gate is configured in `config.js` through `dashboardAccessCode` for the static fallback.

## Copy-Paste Setup Note

Use this quick note when setting up or updating Render:

```text
Service type: Web Service
Branch: main
Start command: npm start
Open /agent-login.html to access the private admin dashboard.
The chat thread is server-backed on Render, so the agent and client can see the same messages.
```

## Reset Admin Access

To rotate the private dashboard code:

1. Update `dashboardAccessCode` in `config.js`.
2. Redeploy the web service.
3. Share the new code with the KUAC staff who need dashboard access.

## Support Chat

- The support chat uses the server-backed `/api/chat/messages` thread when the app is running as a web service.
- It still falls back to localStorage when opened as a static preview.
- The agent dashboard links to the same chat room, so the associate and client can communicate in the same thread.

## Callback Flow

- Fill in the client's name, phone, and note.
- Insert your active email in the email field.
- Attach a photo or document if it helps explain the request.
- Press `Submit Request` to submit the callback form.
- The form posts directly to FormSubmit, and `config.js` fills in the endpoint, subject, auto-reply, and redirect target.
- The support inbox receives the email through FormSubmit.
- The requester can receive an autoresponse from FormSubmit when the inbox activation has been completed.

## Attachment Notes

- The form uses normal browser form submission and FormSubmit relays the attachment.
- Keep the total file size within FormSubmit's limits.
- Good formats for this workflow are `pdf`, `png`, `jpg`, `jpeg`, `webp`, `doc`, and `docx`.

## First-Time Activation

FormSubmit usually requires a one-time inbox activation before it starts delivering normally.
- If the site URL changes, update the fallback URL in `config.js` and the default `_next` value in `index.html`.

## Quick Test

1. Open the live site.
2. Fill in the callback form with a test name, your active email, and phone number.
3. Click `Submit Request`.
4. Check `kua.center@gmail.com` for the submission email.
5. Confirm the FormSubmit activation email has been handled if needed.
