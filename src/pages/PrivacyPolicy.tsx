import { Link } from "react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { Prose, ProseSection } from "@/components/Prose";

const SECTIONS = {
  overview: "1. Overview",
  "in-your-browser": "2. What runs in your browser",
  "leaves-your-browser": "3. What leaves your browser",
  permissions: "4. Permissions",
  retention: "5. Retention",
  children: "6. Children",
  "your-rights": "7. Your rights",
  changes: "8. Changes",
  contact: "9. Contact",
} as const;

const TOC = Object.entries(SECTIONS).map(([id, title]) => ({ id, title }));

const EMAIL = "contact@nishantjoshi.me";
const external = { target: "_blank", rel: "noopener" } as const;

export default function PrivacyPolicy() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main id="main">
        <Prose
          title="Privacy"
          meta={
            <>
              Last updated <time dateTime="2026-10-10">10 October 2026</time>
            </>
          }
          toc={TOC}
        >
          <ProseSection id="overview" title={SECTIONS.overview}>
            <p>
              Automailr is a mail merge for Gmail that runs in your browser. The site is a set of static files: there is
              no Automailr server, database or account. Apart from messages sent through the contact form, which reach
              the maintainer by email, nothing you do is collected or stored by Automailr.
            </p>
            <p>This page explains what stays in your browser, what goes to other services, and when it is removed.</p>
          </ProseSection>

          <ProseSection id="in-your-browser" title={SECTIONS["in-your-browser"]}>
            <ul>
              <li>
                <strong>Your Google profile.</strong> After you sign in, your name, email address and profile picture are
                shown in the app bar.
              </li>
              <li>
                <strong>Your sign-in token.</strong> The Google access token is encrypted with AES-256-GCM and kept in
                this tab&rsquo;s sessionStorage, with the encryption key in IndexedDB. It lasts{" "}
                <span className="num whitespace-nowrap">55&#8239;minutes</span>, and signing out or closing the tab
                removes it.
              </li>
              <li>
                <strong>Your work.</strong> Your CSV rows, subject, message and send results are encrypted the same way,
                in sessionStorage for this tab only. They are removed when you sign out or start a new batch.
              </li>
              <li>
                <strong>Attachments.</strong> Files you attach are held in memory only.
              </li>
            </ul>
            <p>None of this is written to a server.</p>
          </ProseSection>

          <ProseSection id="leaves-your-browser" title={SECTIONS["leaves-your-browser"]}>
            <p>Automailr talks to these services, and only these:</p>
            <dl>
              <dt>Google sign-in and the Gmail API</dt>
              <dd>
                You sign in with Google, which asks you to grant <code>gmail.send</code>, plus your basic profile (name,
                email address and picture) so the app can show who is signed in. The emails you send go from your
                browser straight to the Gmail API. Google handles them under the{" "}
                <a href="https://policies.google.com/privacy" {...external}>
                  Google Privacy Policy
                </a>
                .
              </dd>
              <dt>Google Gemini, only if you press &ldquo;Polish with AI&rdquo;</dt>
              <dd>
                Your subject and message, with the <code>{"{{fields}}"}</code> still in place, are sent to Google&rsquo;s
                Gemini API to be rewritten. Your recipient list is never sent. Google processes the text under the{" "}
                <a href="https://ai.google.dev/gemini-api/terms" {...external}>
                  Gemini API terms
                </a>
                .
              </dd>
              <dt>Vercel</dt>
              <dd>
                Vercel hosts the site&rsquo;s files. Vercel Web Analytics counts page views without cookies or personal
                identifiers.
              </dd>
              <dt>Formspark, only if you use the contact form</dt>
              <dd>Your name, email address and message are sent to Formspark, which emails them to the maintainer.</dd>
            </dl>
          </ProseSection>

          <ProseSection id="permissions" title={SECTIONS.permissions}>
            <p>
              Automailr asks for <code>gmail.send</code>, plus your basic Google profile (name, email address and
              picture) so it can show who is signed in. <code>gmail.send</code> lets Automailr send email from your
              account. It can&rsquo;t read, search or delete anything in your mailbox.
            </p>
            <p>
              Automailr is verified by Google, so there is no &ldquo;unverified app&rdquo; screen when you sign in.
              Signing out destroys the encrypted token and its key in this browser. It does not revoke the grant at
              Google: the token simply expires within the hour. You can revoke Automailr&rsquo;s access at any time at{" "}
              <a href="https://myaccount.google.com/permissions" {...external}>
                myaccount.google.com/permissions
              </a>
              .
            </p>
          </ProseSection>

          <ProseSection id="retention" title={SECTIONS.retention}>
            <p>
              Signing out destroys the encrypted sign-in token and its key in this browser, and closing the tab removes
              the token too. This does not revoke the grant at Google: the token simply expires within the hour, and
              Automailr stops using it after <span className="num whitespace-nowrap">55&#8239;minutes</span>. To revoke
              the grant, use{" "}
              <a href="https://myaccount.google.com/permissions" {...external}>
                myaccount.google.com/permissions
              </a>
              . Your CSV rows, message and send results
              are removed when you sign out or start a new batch. Attachments are gone when the page reloads or closes.
              Automailr keeps no copies anywhere else.
            </p>
          </ProseSection>

          <ProseSection id="children" title={SECTIONS.children}>
            <p>Automailr is not meant for anyone under 13.</p>
          </ProseSection>

          <ProseSection id="your-rights" title={SECTIONS["your-rights"]}>
            <p>
              Laws such as the GDPR and the CCPA give you the right to access, correct and delete personal data held
              about you. Automailr holds none on a server, so there is nothing there to access or delete; signing out
              removes what is stored in your tab. Data handled by Google, Vercel or Formspark is covered by their own policies.
              For anything else, including a message you sent through the contact form, write to{" "}
              <a href={`mailto:${EMAIL}`}>{EMAIL}</a>.
            </p>
          </ProseSection>

          <ProseSection id="changes" title={SECTIONS.changes}>
            <p>
              If this policy changes, this page is updated and the date at the top changes with it. The{" "}
              <Link to="/terms">Terms of use</Link> cover the rest of how Automailr may be used.
            </p>
          </ProseSection>

          <ProseSection id="contact" title={SECTIONS.contact}>
            <p>
              Questions about privacy: email <a href={`mailto:${EMAIL}`}>{EMAIL}</a>, or open an issue on{" "}
              <a href="https://github.com/nishantjoshi-007/Automailr/issues" {...external}>
                GitHub
              </a>
              .
            </p>
          </ProseSection>
        </Prose>
      </main>
      <Footer />
    </div>
  );
}
