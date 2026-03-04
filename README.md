# Automailr 

**Send personalized emails at scale, for free.**

Automailr is a 100 % client-side Gmail mail-merge tool. Upload a CSV, compose a rich-text email with `{{placeholder}}` variables, attach files, preview every message, and send — all from your browser. No servers, no databases, no data leaves your machine except the Gmail API calls you initiate.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white)
![License](https://img.shields.io/badge/License-Non--Commercial-blue)

---

## Features

- **CSV Upload** — Drag-and-drop or file picker; validates for an `email` column; up to 5 000 rows; warns on invalid addresses; downloadable sample CSV.
- **Rich-Text Composer** — TipTap WYSIWYG editor with clickable `{{placeholder}}` badges sourced from your CSV headers.
- **Email Templates** — 4 built-in templates (Cold Outreach, Follow-Up, Event Invite, Job Application) with one-click apply.
- **File Attachments** — Drag-and-drop with image/PDF preview; 25 MB total limit (Gmail cap).
- **Live Preview** — Navigate through each recipient to see exactly what they'll receive, with warnings for unresolved placeholders.
- **Bulk Send with Rate Limiting** — 250 ms delay between sends; real-time progress bar; abort support; retry failed only.
- **Google OAuth** — Minimal scope (`gmail.send` only — no read access).
- **Encrypted Session Storage** — AES-256-GCM encryption of tokens and PII via the Web Crypto API; forward secrecy on logout.
- **Auto-Logout** — Tokens expire after 55 min (ahead of Google's 60-min window).
- **Dark / Light Theme** — Persisted toggle.
- **Animated Transitions** — Framer Motion page and route transitions with an aurora background effect.
- **Fully Client-Side** — Zero backend; all processing happens locally.

---

## Tech Stack

| Category         | Technology                                                               |
| ---------------- | ------------------------------------------------------------------------ |
| Framework        | React 18 · TypeScript 5                                                  |
| Build            | Vite 7 (SWC)                                                             |
| Styling          | Tailwind CSS 3 · tailwindcss-animate · @tailwindcss/typography           |
| UI Components    | shadcn/ui (Radix primitives · class-variance-authority · tailwind-merge) |
| Rich-Text Editor | TipTap 3                                                                 |
| Animations       | Framer Motion 12                                                         |
| Routing          | React Router 6                                                           |
| CSV Parsing      | PapaParse 5                                                              |
| Auth             | @react-oauth/google (implicit token flow)                                |
| Encryption       | Web Crypto API (AES-256-GCM)                                             |
| Forms            | react-hook-form · Zod                                                    |
| Icons            | Lucide React                                                             |
| Toasts           | Sonner · Radix Toast                                                     |
| Testing          | Vitest · jsdom · @testing-library/react                                  |

---

## Getting Started

### Prerequisites

- **Node.js ≥ 18** (or Bun)
- A **Google Cloud project** with the Gmail API enabled and an OAuth 2.0 Client ID configured for a web application.

### 1. Clone & install

```bash
git clone https://github.com/nishantjoshi-007/Automailr.git
cd Automailr
npm install        # or: bun install
```

### 2. Configure environment variables

Create a `.env` file in the project root:

```env
# Required — Google OAuth 2.0 Client ID
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com

# Optional — Formspree form ID for the /contact page
VITE_FORMSPREE_ID=your-formspree-id
```

> **Tip:** In the Google Cloud Console, add `http://localhost:8080` to the list of authorized JavaScript origins for local development.

### 3. Start the dev server

```bash
npm run dev        # or: bun dev
```

The app will be available at **http://localhost:8080**.

---

## Available Scripts

| Script               | Description                                   |
| -------------------- | --------------------------------------------- |
| `npm run dev`        | Start the Vite dev server (port 8080, HMR)    |
| `npm run build`      | Production build                              |
| `npm run build:dev`  | Development build (includes component tagger) |
| `npm run preview`    | Preview the production build locally          |
| `npm run lint`       | Lint with ESLint                              |
| `npm test`           | Run tests once (Vitest)                       |
| `npm run test:watch` | Run tests in watch mode                       |

---

## Project Structure

```
src/
├── main.tsx                     # Entry point
├── App.tsx                      # Root: providers (OAuth, Query, Theme, Auth, Router)
├── AnimatedRoutes.tsx           # Routes with auth guards + animated transitions
├── index.css                    # Tailwind directives & global styles
│
├── pages/                       # Full-page views
│   ├── Home.tsx                 #   / — Marketing landing page
│   ├── Landing.tsx              #   /login — Google sign-in
│   ├── Dashboard.tsx            #   /app/:session/:step — Mail-merge wizard
│   ├── Help.tsx                 #   /help — FAQ (protected)
│   ├── Contact.tsx              #   /contact — Formspree contact form
│   ├── PrivacyPolicy.tsx        #   /privacy
│   ├── TermsOfService.tsx       #   /terms
│   └── NotFound.tsx             #   404
│
├── components/
│   ├── AppNav.tsx               # Authenticated nav bar
│   ├── Footer.tsx               # Global footer
│   ├── Stepper.tsx              # 4-step progress indicator
│   ├── PageTransition.tsx       # Framer Motion wrapper
│   ├── steps/                   # Wizard step components
│   │   ├── CSVUpload.tsx        #   Step 1 — Upload & validate CSV
│   │   ├── Compose.tsx          #   Step 2 — Subject + body + templates
│   │   ├── Attachments.tsx      #   Step 3 — File attachments
│   │   └── PreviewSend.tsx      #   Step 4 — Preview + send + retry
│   └── ui/                      # ~50 shadcn/ui primitives
│
├── contexts/
│   ├── AuthContext.tsx           # OAuth state, encrypted persistence, auto-logout
│   └── ThemeContext.tsx          # Dark/light theme
│
├── constants/
│   └── templates.ts             # 4 built-in email templates
│
├── hooks/
│   ├── use-mobile.tsx           # Mobile breakpoint hook
│   └── use-toast.ts             # Toast hook
│
├── utils/
│   ├── csvParser.ts             # PapaParse wrapper + validation
│   ├── gmailSender.ts           # MIME builder + Gmail API sender
│   ├── placeholders.ts          # {{placeholder}} replacement (XSS-safe)
│   └── secureStorage.ts         # AES-256-GCM encrypted storage
│
├── lib/
│   └── utils.ts                 # cn() helper (clsx + tailwind-merge)
│
└── test/
    └── setup.ts                 # Vitest setup
```

---

## How It Works

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  1. Upload   │ ──► │  2. Compose  │ ──► │ 3. Attach    │ ──► │ 4. Preview   │
│     CSV      │     │    Email     │     │    Files     │     │   & Send     │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

1. **Upload CSV** — Parse and validate your recipient list (must contain an `email` column).
2. **Compose** — Write your email using the rich-text editor with `{{column_name}}` placeholders, or pick a template.
3. **Attach Files** — Optionally add attachments (up to 25 MB total).
4. **Preview & Send** — Review each personalized email, then send all. Track progress in real time, and retry any failures.

---

## Security

Automailr takes security seriously despite being a client-side app:

| Layer                   | Detail                                                                                                                                                                                                                                   |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Encrypted storage**   | OAuth tokens and user PII are encrypted with **AES-256-GCM** before being placed in `sessionStorage`. The encryption key is a **non-extractable** `CryptoKey` stored in IndexedDB — raw key bytes can never be read, even by JavaScript. |
| **Unique IV per write** | Every value is encrypted with a fresh random 96-bit IV so identical data produces different ciphertext.                                                                                                                                  |
| **Forward secrecy**     | On logout, the encryption key is deleted from IndexedDB, making old ciphertext permanently unrecoverable.                                                                                                                                |
| **Token lifecycle**     | Access tokens auto-expire after 55 minutes (ahead of Google's 60-min window) and are cleared from storage.                                                                                                                               |
| **Minimal OAuth scope** | Only `gmail.send` is requested — no read access to your inbox.                                                                                                                                                                           |
| **XSS prevention**      | All CSV values are HTML-escaped (`& < > " '`) before template injection.                                                                                                                                                                 |
| **MIME safety**         | Attachment filenames are sanitized to prevent header injection.                                                                                                                                                                          |
| **No server**           | Data never touches a third-party server. Gmail API calls go directly from your browser to Google.                                                                                                                                        |

---

## Environment Variables

| Variable                | Required | Description                            |
| ----------------------- | -------- | -------------------------------------- |
| `VITE_GOOGLE_CLIENT_ID` | **Yes**  | Google OAuth 2.0 Client ID             |
| `VITE_FORMSPREE_ID`     | No       | Formspree form ID for the contact page |

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m "Add my feature"`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

---

## License

This project is licensed under a **Non-Commercial** license — free for personal, educational, and open-source use. Commercial use is not permitted. See [LICENSE](LICENSE) for details.
