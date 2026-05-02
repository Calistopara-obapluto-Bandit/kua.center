# Render Setup for KUAC

This project is set up for Render's **Static Site** plan with FormSubmit.

## Live Site

- Canonical URL: `https://kua-center.onrender.com/`
- Use this URL for redirects, bookmarks, and any future deployment notes.

## Service Type

- Type: `Static Site`
- Build command: `echo "Static site ready"`
- Publish directory: `.`

## Required Render Settings

No runtime environment variables are needed for the static site.

## Callback Flow

- Fill in the client's name, phone, and note.
- Put the client's email in the email field, not KUAC's.
- Attach a photo or document if it helps explain the request.
- Press `Send to KUAC` to submit the callback form.
- The form posts directly to FormSubmit.
- The support inbox receives the email through FormSubmit.
- The requester can receive an autoresponse from FormSubmit when the inbox activation has been completed.

## Attachment Notes

- The form uses normal browser form submission and FormSubmit relays the attachment.
- Keep the total file size within FormSubmit's limits.
- Good formats for this workflow are `pdf`, `png`, `jpg`, `jpeg`, `webp`, `doc`, and `docx`.

## First-Time Activation

FormSubmit usually requires a one-time inbox activation before it starts delivering normally.

## Quick Test

1. Open the live site.
2. Fill in the callback form with a test name, the client's email, and phone number.
3. Click `Send to KUAC`.
4. Check `kua.center@gmail.com` for the submission email.
5. Confirm the FormSubmit activation email has been handled if needed.
