# Render Setup for KUAC

This project is set up for Render as a static frontend plus a separate API service.

## Live Site

- Canonical URL: `https://kua-center.onrender.com/`
- Use this URL for redirects, bookmarks, and any future deployment notes.
- The callback form falls back to this URL when the site is opened outside a normal HTTP(S) origin.

## Service Type

- Static frontend service name: `kua-center-static`
- Static frontend type: `Static Site`
- API service name: `kua-center-api`
- API service type: `Web Service`
- Build command: `npm run ci:validate`
- Publish path: `.`
- API build command: `npm run ci:validate`
- API start command: `npm start`

## Required Render Settings

The private dashboard login uses the API service when available and falls back to browser session storage if the API is not reachable.
The private dashboard gate is configured in `config.js` through `dashboardAccessCode` for the staff login form.

## Copy-Paste Setup Note

Use this quick note when setting up or updating Render:

```text
Static frontend service name: kua-center-static
Static frontend type: Static Site
API service name: kua-center-api
API service type: Web Service
Branch: main
Publish path: .
Open /agent-login.html to access the private admin dashboard.
The public help page is served as static HTML, the callback form posts through FormSubmit, and the API service stores callbacks for the dashboards.
```

## Reset Admin Access

To rotate the private dashboard code:

1. Update `dashboardAccessCode` in `config.js`.
2. Redeploy the API service.
3. Share the new code with the KUAC staff who need dashboard access.

## Support Chat

- The public help page is Tawk-backed and is served as static HTML on Render.
- `config.js` supplies the Tawk property ID, widget ID, and direct chat URL used by the help page.
- The client dashboard uses the access code to open the assigned case, while Tawk handles the live help room.
- The agent dashboard still links to the help page, but the live conversation itself is handled by Tawk.

## Callback Flow

- Fill in the client's name, phone, and note.
- Insert your active email in the email field.
- Attach a photo or document if it helps explain the request.
- Press `Submit Request` to submit the callback form.
- The form posts directly to FormSubmit, and `config.js` fills in the endpoint, subject, auto-reply, and redirect target.
- The support inbox receives the email through FormSubmit.
- The requester can receive an autoresponse from FormSubmit when the inbox activation has been completed.

## Attachment Notes

- The form uses normal browser submission and FormSubmit relays the attachment.
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
