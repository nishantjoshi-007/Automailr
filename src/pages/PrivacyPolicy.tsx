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
  international: "7. International users",
  "your-rights": "8. Your rights",
  changes: "9. Changes",
  contact: "10. Contact",
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
              Automailr is a mail merge for Gmail that runs in your browser. I run it myself: I&rsquo;m Nishant Joshi,
              an individual based in New Jersey, USA. The site is a set of static files: there is no Automailr server,
              database or account. Apart from messages you send me through the contact form and cookie-free page-view
              counts, nothing you do in Automailr is collected or stored by me.
            </p>
            <p>This page explains what stays in your browser, what goes to other services, and when it is removed.</p>
          </ProseSection>

          <ProseSection id="in-your-browser" title={SECTIONS["in-your-browser"]}>
            <ul>
              <li>
                <strong>Your Google profile.</strong> After you sign in, your name, email address and profile picture are
                shown in the app bar. They are kept encrypted in this tab&rsquo;s sessionStorage until you sign out.
              </li>
              <li>
                <strong>Your sign-in token.</strong> The Google access token is encrypted with AES-256-GCM and kept in
                this tab&rsquo;s sessionStorage, with the encryption key in IndexedDB. Automailr stops using it a minute
                before Google&rsquo;s own expiry, which is usually an hour after you sign in. It is removed when it
                expires, when you sign out or when you close the tab.
              </li>
              <li>
                <strong>Your work.</strong> Your CSV rows, subject, message, any polished version of it and send results
                are encrypted the same way, in sessionStorage for this tab only. They are tagged with the Google account
                they belong to, so a different account signed in to this tab never sees them. They are removed when you
                sign out, start a new batch or close the tab.
              </li>
              <li>
                <strong>Attachments.</strong> Files you attach are held in memory only. Just their names are saved, so
                after a reload Automailr can tell you which ones to add again.
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
                Gemini API to be rewritten. Nothing else is sent: never your recipient list, your CSV or your
                attachments. Automailr uses the Gemini API as a paid service. Under Google&rsquo;s terms for paid use,
                Google doesn&rsquo;t use your text or its responses to improve its products, but it logs them for a
                limited time to detect abuse and policy violations and for any required legal disclosures. Treat it like
                anything you send to a third party: don&rsquo;t polish text you wouldn&rsquo;t want processed by Google.
                The details are in the{" "}
                <a href="https://ai.google.dev/gemini-api/terms" {...external}>
                  Gemini API Additional Terms
                </a>
                .
              </dd>
              <dt>Vercel</dt>
              <dd>
                Vercel hosts the site and serves it from its global network. Vercel Web Analytics counts page views
                without cookies or personal identifiers.
              </dd>
              <dt>Formspark, only if you use the contact form</dt>
              <dd>
                Your name, email address and message are sent to Formspark, which emails them to me. The form also has a
                hidden field that people never see; Formspark drops any submission where a bot has filled it in.
              </dd>
            </dl>
            <p>Like any web request, each of these reaches the service with your IP address and browser details.</p>
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
              Signing out destroys the encryption key and removes everything Automailr stored in this tab: the token,
              your profile, your CSV rows, message and send results. Closing the tab removes the stored data too, and
              starting a new batch clears the CSV rows, message and results. When the token expires, only the token is
              removed, so you can sign in again and carry on with your work. Attachments are gone when the page reloads
              or closes. Signing out does not revoke the grant at Google: the token simply expires within the hour, and
              you can revoke the grant at{" "}
              <a href="https://myaccount.google.com/permissions" {...external}>
                myaccount.google.com/permissions
              </a>
              . Automailr keeps no copies anywhere else.
            </p>
          </ProseSection>

          <ProseSection id="children" title={SECTIONS.children}>
            <p>
              Automailr is not meant for anyone under 13. AI polish is for users aged 18 or over, as Google&rsquo;s
              Gemini terms require.
            </p>
          </ProseSection>

          <ProseSection id="international" title={SECTIONS.international}>
            <p>
              Anyone, anywhere, may use Automailr. The site is served from Vercel&rsquo;s global network, and I am in
              the United States. Apart from contact-form messages, which reach my email, Automailr holds no personal
              data on any server, so there is nothing on my side to transfer, access, correct or delete. What Google,
              Vercel and Formspark process, they process under their own terms and privacy policies, in their own
              regions.
            </p>
          </ProseSection>

          <ProseSection id="your-rights" title={SECTIONS["your-rights"]}>
            <p>
              Laws such as the GDPR, the UK GDPR and the CCPA give you the right to access, correct and delete personal
              data held about you. I hold none on a server, so there is nothing there to act on; signing out removes
              what is stored in your tab. Requests about Google&rsquo;s processing, including Gmail and Gemini, go to
              Google, and Vercel and Formspark answer for theirs. For anything else, including a message you sent
              through the contact form, write to <a href={`mailto:${EMAIL}`}>{EMAIL}</a>.
            </p>
          </ProseSection>

          <ProseSection id="changes" title={SECTIONS.changes}>
            <p>
              If this policy changes, I update this page and the date at the top changes with it. The{" "}
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
