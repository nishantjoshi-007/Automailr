# Security

Automailr runs entirely in the browser and sends email through the Gmail API with the user's own Google token, so a security bug here can affect people's mail accounts and their recipient lists. I take reports seriously.

## Reporting a vulnerability

Email **contact@nishantjoshi.me** with "Automailr security" in the subject. Please do not open a public issue for anything exploitable.

Include what you can of: the page or feature, steps to reproduce, what an attacker could do with it, and the browser you used. A proof of concept is welcome; a working exploit against other people's accounts is not.

I read every report and will reply when I have confirmed or ruled it out. Fixes are released on `main` and deployed to automailr.nishantjoshi.me; there are no older supported versions.

## In scope

- The app itself: everything under `src/`, `public/`, `index.html`, `vercel.json`.
- How it handles the Google token, the CSV, attachments, the message HTML and the preview.
- The Content-Security-Policy and the other headers in `vercel.json`.

## Out of scope

- Google's own services (Gmail, OAuth, Gemini), Vercel and Formspark. Report those to them.
- The Gemini API key being visible in the client bundle. That is a deliberate decision; the key is restricted by referrer, API and quota. Abuse of it is capped, not prevented.
- Rate limits and daily sending caps, which are Google's.
