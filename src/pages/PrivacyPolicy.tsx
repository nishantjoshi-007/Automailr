import { Footer } from "@/components/Footer";
import { PageTransition } from "@/components/PageTransition";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <PageTransition className="min-h-screen flex flex-col bg-background relative">
      {/* Subtle background */}
      <AuroraBackground className="fixed inset-0 z-0 opacity-10 pointer-events-none" showRadialGradient={false} />
      <div className="min-h-screen flex flex-col">
        <nav className="glass sticky top-0 z-50 flex items-center px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Automailr" className="h-9 w-9 rounded-lg" />
            <span className="text-lg font-bold tracking-tight text-foreground hidden sm:inline">Automailr</span>
          </Link>
        </nav>

        <div className="mx-auto max-w-3xl px-4 py-8 flex-1">
          <article className="glass rounded-2xl p-6 sm:p-10 space-y-8 text-sm text-muted-foreground leading-relaxed">
            <header>
              <h1 className="text-2xl font-extrabold text-foreground mb-2">Privacy Policy</h1>
              <p className="text-xs">Effective Date: March 3, 2026 &middot; Last Updated: March 3, 2026</p>
            </header>

            <section className="space-y-3">
              <p>
                This Privacy Policy describes how <strong className="text-foreground">Automailr</strong> ("we," "us,"
                or "our") handles information when you use the Automailr web application (the "Service"). By accessing
                or using the Service, you acknowledge that you have read and understood this Privacy Policy.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">1. Overview</h2>
              <p>
                Automailr is a fully <strong className="text-foreground">client-side</strong> web application. It runs
                entirely in your web browser. We do <strong className="text-foreground">not</strong> operate any
                backend servers, databases, or cloud infrastructure that stores, processes, or transmits your data.
                All data you provide or generate while using the Service remains on your local device and is processed
                exclusively within your browser session.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">2. Information We Do Not Collect</h2>
              <p>
                Because Automailr has no backend, we do <strong className="text-foreground">not</strong> collect,
                store, transmit, receive, or have access to any of the following:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Your name, email address, or Google account profile information.</li>
                <li>Your Google OAuth access tokens or refresh tokens.</li>
                <li>The contents of any CSV files you upload.</li>
                <li>Email addresses, names, or any other personal data of your recipients.</li>
                <li>The subject lines, body content, or attachments of any emails you compose or send.</li>
                <li>Your IP address, device identifiers, browser fingerprint, or any analytics or telemetry data.</li>
                <li>Cookies or tracking identifiers for advertising, profiling, or cross-site tracking purposes.</li>
              </ul>
              <p>
                We do not use any third-party analytics services (e.g., Google Analytics, Mixpanel, Segment, or
                similar), advertising networks, or tracking pixels.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">3. Data Processed Locally in Your Browser</h2>
              <p>
                The following data is processed entirely within your browser's runtime environment and is never
                transmitted to any server operated by us:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  <strong className="text-foreground">Google Account Information:</strong> When you sign in with
                  Google, your name, email address, and profile picture are fetched directly from Google's API by your
                  browser and stored in your browser's{" "}
                  <code className="text-primary font-mono text-xs">localStorage</code>. This data is used solely to
                  display your identity within the application and to set the "From" address when sending emails.
                </li>
                <li>
                  <strong className="text-foreground">Google OAuth Access Token:</strong> Your access token is stored
                  in your browser's <code className="text-primary font-mono text-xs">localStorage</code> and is used
                  exclusively to authenticate requests to the Gmail API on your behalf. The token is automatically
                  cleared after approximately 55 minutes or when you log out.
                </li>
                <li>
                  <strong className="text-foreground">CSV Data:</strong> Any CSV file you upload is parsed entirely in
                  your browser using the PapaParse library. The parsed data (column headers and row values) is held in
                  browser memory (React state) for the duration of your session. It is never written to disk,
                  transmitted over the network to us, or persisted beyond the browser session.
                </li>
                <li>
                  <strong className="text-foreground">Email Content:</strong> The subject line, body, and template
                  selections you compose are held in browser memory. Placeholder replacement and MIME message
                  construction occur entirely in your browser.
                </li>
                <li>
                  <strong className="text-foreground">Attachments:</strong> Any files you attach are held as File
                  objects in browser memory and converted to Base64 encoding in-browser at send time. They are never
                  uploaded to any server operated by us.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">4. Third-Party Services</h2>
              <p>Automailr interacts directly with the following third-party services from your browser:</p>

              <h3 className="text-base font-medium text-foreground mt-4">4.1 Google OAuth 2.0 &amp; Gmail API</h3>
              <p>
                When you sign in, your browser communicates directly with Google's OAuth 2.0 authorization servers and
                the Gmail API (<code className="text-primary font-mono text-xs">gmail.googleapis.com</code>). The
                Service requests the <code className="text-primary font-mono text-xs">https://mail.google.com/</code>{" "}
                OAuth scope, which grants the ability to send emails on your behalf, read your email, and manage your
                mailbox.
              </p>
              <p>
                <strong className="text-foreground">Important:</strong> While the requested scope technically provides
                broad Gmail access, Automailr only uses it to send emails via the{" "}
                <code className="text-primary font-mono text-xs">messages.send</code> endpoint. We do not read, list,
                modify, or delete any of your existing emails. You can review Google's privacy policy at{" "}
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  https://policies.google.com/privacy
                </a>
                . You may revoke Automailr's access at any time from your{" "}
                <a
                  href="https://myaccount.google.com/permissions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  Google Account permissions page
                </a>
                .
              </p>

              <h3 className="text-base font-medium text-foreground mt-4">4.2 Google Fonts</h3>
              <p>
                The Service loads the "Plus Jakarta Sans" typeface from Google Fonts. When you load the application,
                your browser makes a request to Google's font servers. Google may collect your IP address and browser
                metadata in connection with this request. Refer to Google's{" "}
                <a
                  href="https://developers.google.com/fonts/faq/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  Fonts Privacy FAQ
                </a>{" "}
                for details.
              </p>

              <h3 className="text-base font-medium text-foreground mt-4">4.3 Hosting Provider</h3>
              <p>
                The static files that comprise Automailr (HTML, CSS, JavaScript) are served by a hosting provider.
                Your hosting provider may log standard HTTP request metadata (IP address, user-agent, timestamps) in
                accordance with its own privacy policy. We do not control or have access to those logs.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">5. Local Storage</h2>
              <p>
                Automailr uses your browser's <code className="text-primary font-mono text-xs">localStorage</code> to
                persist the following items between page reloads:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  <code className="text-primary font-mono text-xs">automailr_token</code> — Your Google OAuth access
                  token (cleared on logout or after expiry).
                </li>
                <li>
                  <code className="text-primary font-mono text-xs">automailr_token_ts</code> — A timestamp recording
                  when the token was issued (used for automatic expiry).
                </li>
                <li>
                  <code className="text-primary font-mono text-xs">automailr_user</code> — A JSON object containing
                  your name, email, and avatar URL (cleared on logout).
                </li>
              </ul>
              <p>
                This data is stored only on your device and is never transmitted to us. You can clear it at any time
                by logging out of the application, clearing your browser's storage, or using your browser's developer
                tools.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">6. Data Retention</h2>
              <p>
                Because we do not collect any data, there is no data retained by us. Data stored in your browser's{" "}
                <code className="text-primary font-mono text-xs">localStorage</code> persists until you log out, clear
                your browser storage, or the access token expires (approximately 55 minutes). All in-memory data (CSV
                rows, email content, attachments) is discarded when you close the browser tab or navigate away.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">7. Data Security</h2>
              <p>
                All communication between your browser and Google's servers occurs over HTTPS/TLS encryption. Your
                OAuth access token is stored only in your browser's{" "}
                <code className="text-primary font-mono text-xs">localStorage</code> and is transmitted only in
                Authorization headers to Google's API endpoints.
              </p>
              <p>
                While we have designed the Service to minimize data exposure, no method of electronic storage or
                transmission is 100% secure. You are responsible for maintaining the security of your device, browser,
                and Google account credentials.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">8. Children's Privacy</h2>
              <p>
                The Service is not directed to individuals under the age of 13 (or the applicable age of digital
                consent in your jurisdiction). We do not knowingly collect personal information from children. If you
                believe a child has provided personal information through the Service, please contact us so we can
                take appropriate action.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">9. International Users</h2>
              <p>
                Because all data processing occurs in your browser, your data does not cross international borders
                through our infrastructure. However, your interactions with Google's OAuth and Gmail API are governed
                by Google's own data processing terms and infrastructure, which may involve international data
                transfers. Please refer to Google's privacy policy for details.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">10. Your Rights</h2>
              <p>Depending on your jurisdiction (e.g., GDPR, CCPA, PIPEDA), you may have rights including:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>The right to access, correct, or delete your personal data.</li>
                <li>The right to restrict or object to processing.</li>
                <li>The right to data portability.</li>
                <li>The right to withdraw consent.</li>
              </ul>
              <p>
                Since we do not collect or store any personal data on our servers, these rights are inherently
                satisfied. You may clear any locally stored data at any time by logging out or clearing your browser
                storage. To manage the data Google holds about you, visit your{" "}
                <a
                  href="https://myaccount.google.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  Google Account settings
                </a>
                .
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">11. Changes to This Privacy Policy</h2>
              <p>
                We reserve the right to update this Privacy Policy from time to time. If we make material changes, we
                will update the "Last Updated" date at the top of this page. Your continued use of the Service after
                any such changes constitutes your acceptance of the updated Privacy Policy.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">12. Contact</h2>
              <p>
                If you have questions or concerns about this Privacy Policy, please open an issue on the{" "}
                <a
                  href="https://github.com/nishantjoshi-007/Automailr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  Automailr GitHub repository
                </a>
                .
              </p>
            </section>
          </article>
        </div>

        <div className="sticky bottom-0 glass flex items-center px-4 py-3 sm:px-6">
          <Button variant="ghost" onClick={() => navigate(-1)} className="gap-1">
            <ChevronLeft className="h-4 w-4" /> Back
          </Button>
        </div>
        <Footer />
      </div>
    </PageTransition>
  );
}
