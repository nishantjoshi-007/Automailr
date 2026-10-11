# Automailr

Automailr is a mail merge for Gmail that runs entirely in the browser. Upload a CSV, write one message with `{{fields}}` taken from its columns, check every recipient's copy, and send from your own Gmail account. There is no server and no database: the site is static files on Vercel, and your browser talks to Google directly.

[![Licence: MIT Non-Commercial](https://img.shields.io/badge/licence-MIT%20Non--Commercial-blue)](LICENSE)

## What it does

1. **Recipients.** Upload a CSV with an `email` column. Every other column becomes a `{{field}}` you can use in the message.
2. **Message.** Write a subject and body in a rich-text editor, insert fields, attach files, and watch the preview for each recipient. Optionally polish the text with AI.
3. **Review & send.** Step through every recipient's email, then send. Messages go out one at a time. You can stop, retry failures, send the ones not yet sent, and download the results as a CSV.

| Limit | Value |
| --- | --- |
| Recipients per batch | 5,000 rows |
| Attachments | 25 MB in total, measured on the raw files |
| Pause between sends | 250 ms |
| Sign-in lifetime | About an hour (Google's own expiry), then sign in again |

If the sign-in runs out partway through a batch, sending pauses, the rest are marked "not sent", and you can sign in again and send them.

## Privacy and permissions

Automailr asks Google for `gmail.send`, plus your basic profile (name, email address and picture) so the app can show who is signed in. It can send email as you. It cannot read, search or delete anything in your mailbox. Signing out destroys the encrypted token and its key in this browser; it does not revoke the grant at Google. The token simply expires within the hour, and you can revoke the grant at <https://myaccount.google.com/permissions>.

Stays in the browser:

- The Google access token is encrypted with AES-256-GCM and kept in `sessionStorage`. The key is a non-extractable `CryptoKey` in IndexedDB. Automailr stops using the token a minute before Google's own expiry (`expires_in`, an hour in practice; 55 minutes if Google gives none).
- Wizard state (CSV rows, subject, body, send results) is encrypted the same way in `sessionStorage`, tagged with the signed-in account so another account never sees it, and cleared on sign-out or when you start a new batch. Attachments stay in memory only.
- The message preview is sanitised with DOMPurify before it is rendered.

Leaves the browser, and when:

| Recipient | What | When |
| --- | --- | --- |
| Google (OAuth and Gmail API) | Sign-in, and each email you send | Signing in and sending |
| Google (Gemini API) | Your subject and message, with `{{fields}}` left in place. Never the recipient list, the CSV or attachments. | Only when you press Polish in the editor |
| Vercel | The site's files, and cookie-free page-view counts through Vercel Web Analytics | Loading the site |
| Formspark | Name, email address and message, plus a hidden honeypot field that bots fill in and people leave empty | Only when you send the contact form |

AI polish runs on a Google Cloud project with billing enabled, so Google treats it as a paid service. Under Google's Gemini API terms for paid use, Google doesn't use the prompts or responses to improve its products; it logs them for a limited time to detect abuse and policy violations and for any required legal disclosures. AI polish is for users aged 18 or over, as those terms require. Treat it like anything you send to a third party: don't polish text you wouldn't want processed by Google.

## Run it locally

Requires Node 20 or later (`package.json` has no `engines` field; the project is developed on Node 24).

```sh
git clone https://github.com/nishantjoshi-007/Automailr.git
cd Automailr
npm install
```

Create `.env` in the project root. `.env.example` has the same variables.

```sh
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
VITE_FORMSPARK_FORM_ID=your-formspark-form-id
VITE_GEMINI_API_KEY=your-gemini-api-key
```

| Variable | Used for | Required |
| --- | --- | --- |
| `VITE_GOOGLE_CLIENT_ID` | Google sign-in. Without it, sign-in is unavailable. | Yes |
| `VITE_GEMINI_API_KEY` | AI polish | No |
| `VITE_FORMSPARK_FORM_ID` | The contact form | No |

Then start the dev server, which listens on http://localhost:8080.

```sh
npm run dev
```

To open it from a phone on the same network, run `npm run dev -- --host` for that session only.

## Google Cloud setup

1. In Google Cloud Console, create or pick a project and enable the Gmail API.
2. Configure the OAuth consent screen and add the `https://www.googleapis.com/auth/gmail.send` scope. Add no other scopes.
3. Under Credentials, create an OAuth 2.0 client ID of type Web application.
4. Add authorised JavaScript origins: `http://localhost:8080` and the origin of your deployment (`https://automailr.nishantjoshi.me` for the production site).
5. Put the client ID in `VITE_GOOGLE_CLIENT_ID`.

The production app is verified by Google, so signing in there shows no "unverified app" screen. A client ID you create yourself is not verified until you submit it for review. While it is in testing, only the test users you list on the consent screen can sign in, and they see the warning screen.

## Gemini key

Optional. AI polish is the only feature that uses it.

The key ships in the client bundle by design. There is no server to hold it, and I accept that risk instead of adding a proxy or asking each user for their own key. Anyone can read it from the deployed JavaScript, so restrict it in Google Cloud:

- Application restriction: HTTP referrers, set to the deployed origin (`https://automailr.nishantjoshi.me/*` in production, plus `http://localhost:8080/*` for development).
- API restriction: Generative Language API only.
- A hard daily quota cap on that API, plus a budget alert.

Referrer restrictions stop other websites from using the key in a browser. They do not stop someone who sets the header by hand, so the quota cap is what bounds the damage. The site keeps `Referrer-Policy: strict-origin-when-cross-origin` so the restriction keeps working for the site itself.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server on port 8080 |
| `npm run build` | Production build into `dist` |
| `npm run build:dev` | Build in development mode |
| `npm run preview` | Serve the built `dist` locally |
| `npm run lint` | ESLint over the project |
| `npm test` | Run the Vitest suites once |
| `npm run test:watch` | Vitest in watch mode |

## Deploy

Automailr deploys to Vercel as a static build: build command `npm run build`, output directory `dist`. Set `VITE_GOOGLE_CLIENT_ID`, `VITE_GEMINI_API_KEY` and `VITE_FORMSPARK_FORM_ID` in the project's environment variables; Vite reads them at build time, so redeploy after changing them.

`vercel.json` rewrites every path to `index.html` for the single-page router and sets security headers: `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options: DENY` and `Cross-Origin-Opener-Policy`. It also sets an enforcing `Content-Security-Policy`, so anything outside the policy is blocked. If you change the inline script in `index.html`, update its sha256 in the policy.

## Project layout

```text
src/
  pages/              Landing, SignIn, Wizard, Help, Contact, Privacy, Terms, NotFound
  components/
    wizard/           The three steps, wizard state, sender and constants
    ui/               shadcn/ui primitives
    (top level)       Shell: site header, app nav, footer, theme toggle
  utils/              csvParser, placeholders, gmailSender, geminiClient, secureStorage
  contexts/           AuthContext, ThemeContext
  hooks/              useGoogleSignIn, useAIPolish
  lib/                env and small helpers
design/bakeoff/       The three design directions compared before the redesign
DESIGN.md             The design system
```

Stack: React 19, TypeScript 6, Vite 8, Tailwind CSS 4, React Router 8, Radix UI, TipTap 3, PapaParse, DOMPurify, `@react-oauth/google`, Vitest 5. Fonts (Archivo, Geist, Geist Mono) are self-hosted through Fontsource.

## Design

`DESIGN.md` describes the colour, type and layout rules, and the voice used for interface copy. `design/bakeoff/` holds the three directions that were compared; open `design/bakeoff/compare.html` in a browser to see them side by side.

## Tests

`npm test` runs 154 tests in 5 files with Vitest, happy-dom and fake-indexeddb:

- `csvParser`: the `email` column, row limit, header trimming, invalid addresses.
- `placeholders`: `{{field}}` substitution, escaping, and finding unknown fields.
- `gmailSender`: building the MIME message, headers, attachments and API errors.
- `geminiClient`: requests, error messages and response handling.
- `secureStorage`: AES-GCM round trips, key creation and removal.

## Licence

MIT Non-Commercial License. Free for personal, educational, research and open-source use; not for commercial purposes. See [LICENSE](LICENSE).

## Contact

contact@nishantjoshi.me, or [open an issue on GitHub](https://github.com/nishantjoshi-007/Automailr/issues).
