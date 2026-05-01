# Render Setup for KUAC

This project is set up for Render's **Static Site** plan.

The callback form posts directly to FormSubmit from the browser, so no Node server or paid backend is required for the live site.

## Service Type

- Type: `Static Site`
- Build command: `echo "Static site ready"`
- Publish directory: `.`

## Required Render Settings

No runtime environment variables are needed for the static deployment.

If you change the site domain, update the form `_next` URL in [`index.html`](./index.html) so the redirect comes back to the right page.

## Callback Flow

- Fill in the client's name, email, phone, and note.
- Attach a photo or document if it helps explain the request.
- Press `Send to KUAC` to submit the callback form.
- FormSubmit emails the submission to `kua.center@gmail.com`.
- The `_autoresponse` field sends the confirmation email to the client's email address.
- The client email field is the only address used for the auto-reply.
- The support inbox is already the recipient via the form `action`.

## Attachment Notes

- The form uses normal browser form submission, so FormSubmit can receive file uploads.
- Keep the total file size under FormSubmit's 10 MB limit.
- Good formats for this workflow are `pdf`, `png`, `jpg`, `jpeg`, `webp`, `doc`, and `docx`.

## First-Time Activation

The first submission usually triggers a FormSubmit activation message to the recipient inbox. Confirm that email once, then later submissions should deliver normally.

## Quick Test

1. Open the live site.
2. Fill in the callback form with a test name, client email, and phone number.
3. Click `Send to KUAC`.
4. Check `kua.center@gmail.com` for the submission email.
5. Check the client inbox for the autoresponse message.
