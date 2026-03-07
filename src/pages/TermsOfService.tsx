import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { PageTransition } from "@/components/PageTransition";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { ChevronLeft } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";

export default function TermsOfService() {
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
              <h1 className="text-2xl font-extrabold text-foreground mb-2">Terms of Service</h1>
              <p className="text-xs">Effective Date: March 3, 2026 &middot; Last Updated: March 6, 2026</p>
            </header>

            <section className="space-y-3">
              <p>
                These Terms of Service ("Terms") govern your access to and use of the{" "}
                <strong className="text-foreground">Automailr</strong> web application (the "Service"). By accessing
                or using the Service, you agree to be bound by these Terms. If you do not agree, do not use the
                Service.
              </p>
            </section>

            {/* 1 */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">1. Description of the Service</h2>
              <p>
                Automailr is a free, open-source, <strong className="text-foreground">non-commercial</strong>, fully
                client-side web application that enables users to perform mail merge operations — composing
                personalized emails from CSV data and sending them through the Gmail API using the user's own Google
                account. The Service has no backend server, no database, and no cloud processing. All computation,
                data parsing, email composition, and API communication occurs exclusively within the user's web
                browser.
              </p>
              <p>
                The Service is released under the{" "}
                <strong className="text-foreground">MIT Non-Commercial License</strong> and is provided for{" "}
                <strong className="text-foreground">personal, educational, and research use only</strong>. Commercial
                and business use of any kind is strictly prohibited. See Sections 4 and 10 for complete details on
                prohibited uses and licensing terms.
              </p>
            </section>

            {/* 2 */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">2. Eligibility</h2>
              <p>
                You must be at least 13 years of age (or the minimum age of digital consent in your jurisdiction) to
                use the Service. By using the Service, you represent and warrant that you meet this age requirement
                and that you have the legal capacity to enter into these Terms.
              </p>
            </section>

            {/* 3 */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">3. Account &amp; Authentication</h2>
              <p>
                The Service uses Google OAuth 2.0 for authentication. By signing in with Google, you authorize
                Automailr to receive a temporary access token that permits the application to send emails on your
                behalf via the Gmail API. You are solely responsible for:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Maintaining the security of your Google account and device.</li>
                <li>All activity that occurs under your authenticated session.</li>
                <li>Logging out when you are finished or when using a shared or public device.</li>
              </ul>
              <p>
                You may revoke Automailr's access at any time from your{" "}
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
            </section>

            {/* 4 */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">4. Acceptable Use</h2>
              <p>
                You agree that you will <strong className="text-foreground">not</strong> use the Service to:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  Send unsolicited bulk email, spam, phishing messages, or any communication that violates the{" "}
                  <a
                    href="https://support.google.com/a/answer/174124"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline"
                  >
                    Google Workspace Acceptable Use Policy
                  </a>{" "}
                  or the CAN-SPAM Act, GDPR, CASL, or any other applicable anti-spam or data protection legislation.
                </li>
                <li>Send emails containing malicious content, malware, viruses, or harmful code.</li>
                <li>Impersonate any person or entity, or misrepresent your affiliation with any person or entity.</li>
                <li>
                  Harvest, scrape, or collect email addresses or other personal data for the purpose of sending
                  unsolicited communications.
                </li>
                <li>
                  Violate any applicable local, state, national, or international law, regulation, or ordinance.
                </li>
                <li>
                  Interfere with, disrupt, or place an undue burden on the Service or the networks and servers
                  connected to the Service (including Google's infrastructure).
                </li>
                <li>
                  Attempt to reverse-engineer, decompile, or extract the source code of the Service for malicious
                  purposes (note: the Service is open source, and its source code is publicly available).
                </li>
                <li>
                  Use the Service to exceed Gmail's sending limits or otherwise abuse the Gmail API rate limits.
                </li>
                <li>
                  Use the Service for any <strong className="text-foreground">commercial purpose</strong>, including
                  but not limited to selling, licensing, or sublicensing the Software; offering paid services that
                  incorporate the Software; or using the Software in a product or service that is sold or offered for
                  a fee.
                </li>
                <li>
                  Use the Service on behalf of, for the benefit of, or in association with any{" "}
                  <strong className="text-foreground">
                    business, company, corporation, partnership, organization, non-profit, government entity, or team
                  </strong>{" "}
                  — even as an internal tool, workflow aid, or operational resource, regardless of whether such use is
                  customer-facing or revenue-generating. If your use of the Service can be associated with any entity
                  other than yourself as a private individual, it is prohibited.
                </li>
                <li>
                  Use the Service to send emails in any professional, corporate, organizational, or business capacity.
                  The Service is intended exclusively for individuals acting in a{" "}
                  <strong className="text-foreground">purely personal capacity</strong>.
                </li>
              </ul>
            </section>

            {/* 5 */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">5. Email Content &amp; Recipient Data</h2>
              <p>
                You are solely and entirely responsible for the content of all emails you compose and send using the
                Service. This includes, without limitation:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>The accuracy and legality of all recipient email addresses.</li>
                <li>
                  Ensuring that you have obtained all necessary consents from recipients to send them email
                  communications, in compliance with applicable laws (including GDPR, CAN-SPAM, CASL, and similar
                  regulations).
                </li>
                <li>The subject line, body content, and any attachments included in your emails.</li>
                <li>
                  Compliance with all applicable email marketing laws, including providing a valid physical postal
                  address, a clear unsubscribe mechanism, and honest subject lines where required.
                </li>
              </ul>
              <p>
                We do not review, moderate, screen, or filter the content of any emails sent through the Service. We
                have no visibility into the emails you send.
              </p>
            </section>

            {/* 6 */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">6. Google API &amp; Gmail Usage</h2>
              <p>
                Your use of the Gmail API through the Service is subject to{" "}
                <a
                  href="https://developers.google.com/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  Google's API Terms of Service
                </a>{" "}
                and the{" "}
                <a
                  href="https://developers.google.com/terms/api-services-user-data-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  Google API Services User Data Policy
                </a>
                . You acknowledge that:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  Gmail imposes sending limits (typically 500 emails/day for consumer accounts, 2,000/day for Google
                  Workspace). The Service does not guarantee delivery within these limits and is not responsible if
                  your account is rate-limited or suspended by Google.
                </li>
                <li>
                  Access tokens expire approximately every 60 minutes. You may need to re-authenticate if your session
                  expires.
                </li>
                <li>
                  Google may modify, restrict, or discontinue its APIs at any time. We are not responsible for any
                  service interruptions caused by changes to Google's infrastructure.
                </li>
              </ul>
            </section>

            {/* 7 */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">7. No Warranty &amp; "As Is" Provision</h2>
              <p>
                THE SERVICE IS PROVIDED ON AN <strong className="text-foreground">"AS IS"</strong> AND{" "}
                <strong className="text-foreground">"AS AVAILABLE"</strong> BASIS, WITHOUT WARRANTIES OF ANY KIND,
                EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS
                FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.
              </p>
              <p>Without limiting the foregoing, we do not warrant that:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>The Service will be uninterrupted, timely, secure, or error-free.</li>
                <li>Emails sent through the Service will be delivered to their intended recipients.</li>
                <li>The Service will be compatible with all browsers, devices, or operating systems.</li>
                <li>
                  Any data processed by the Service (CSV parsing, placeholder replacement, MIME encoding) will be free
                  of errors or inaccuracies.
                </li>
                <li>The Service will meet your specific requirements or expectations.</li>
              </ul>
            </section>

            {/* 8 */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">8. Limitation of Liability</h2>
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL AUTOMAILR, ITS CREATORS,
                CONTRIBUTORS, MAINTAINERS, OR LICENSORS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
                CONSEQUENTIAL, PUNITIVE, OR EXEMPLARY DAMAGES, INCLUDING BUT NOT LIMITED TO DAMAGES FOR LOSS OF
                PROFITS, GOODWILL, DATA, OR OTHER INTANGIBLE LOSSES, ARISING OUT OF OR IN CONNECTION WITH:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Your use of or inability to use the Service.</li>
                <li>
                  Any emails sent, received, or not delivered through the Service, including any damages caused by the
                  content of those emails.
                </li>
                <li>Unauthorized access to or alteration of your data, transmissions, or Google account.</li>
                <li>
                  Any suspension, limitation, or termination of your Google account or Gmail access as a result of
                  your use of the Service.
                </li>
                <li>Any third-party actions, services, or policies (including Google's).</li>
                <li>Any bugs, defects, viruses, or errors in the Service.</li>
              </ul>
              <p>
                In jurisdictions that do not allow the exclusion or limitation of certain damages, our liability shall
                be limited to the maximum extent permitted by law.
              </p>
            </section>

            {/* 9 */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">9. Indemnification</h2>
              <p>
                You agree to defend, indemnify, and hold harmless Automailr, its creators, contributors, and
                maintainers from and against any and all claims, liabilities, damages, losses, costs, and expenses
                (including reasonable attorneys' fees) arising out of or related to:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Your use of or conduct in connection with the Service.</li>
                <li>Your violation of these Terms or any applicable law or regulation.</li>
                <li>
                  The content of any emails you send using the Service, including claims of spam, harassment,
                  defamation, infringement, or privacy violations.
                </li>
                <li>
                  Your violation of any third party's rights, including intellectual property or privacy rights.
                </li>
              </ul>
            </section>

            {/* 10 */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">10. Intellectual Property &amp; License</h2>
              <p>
                Automailr is open-source software released under the{" "}
                <strong className="text-foreground">MIT Non-Commercial License</strong>. The full text of the license
                is available in the project's{" "}
                <a
                  href="https://github.com/nishantjoshi-007/Automailr/blob/main/LICENSE"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  GitHub repository
                </a>
                . By using the Service, you agree to comply with all terms of that license, which include the
                following key provisions:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  <strong className="text-foreground">Permitted Use:</strong> You may use, copy, modify, merge,
                  publish, and distribute the Software for personal, educational, research, and non-commercial
                  open-source purposes only.
                </li>
                <li>
                  <strong className="text-foreground">Prohibited Commercial Use:</strong> The Software shall not be
                  used for any commercial purpose. "Commercial purpose" means any use intended for or directed toward
                  commercial advantage or monetary compensation, including selling the Software, offering paid
                  services that incorporate the Software, or using the Software in a product or service that is sold
                  or offered for a fee.
                </li>
                <li>
                  <strong className="text-foreground">Prohibited Business &amp; Organizational Use:</strong> The
                  Software shall not be used by, on behalf of, or in association with any business, company,
                  corporation, partnership, organization, non-profit, government entity, or team. This includes use as
                  an internal tool, workflow aid, or operational resource within any organization — regardless of
                  whether such use is customer-facing, revenue-generating, or otherwise externally visible. If your
                  use can be associated with any entity other than yourself as a private individual, it is prohibited.
                </li>
                <li>
                  <strong className="text-foreground">Personal Use Only:</strong> The Service is intended exclusively
                  for natural persons acting in a purely personal, individual capacity. Any use in a professional,
                  corporate, organizational, or team context is a violation of these Terms and the project license.
                </li>
              </ul>
              <p>Additionally:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  The "Automailr" name, logo, and visual design are the property of the project maintainers and may
                  not be used to endorse or promote derivative works without prior written consent.
                </li>
                <li>
                  You retain full ownership of all data you provide to the Service (CSV files, email content,
                  attachments). We claim no rights to your data.
                </li>
                <li>
                  The copyright notice and license terms must be included in all copies or substantial portions of the
                  Software.
                </li>
              </ul>
            </section>

            {/* 11 */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">11. Attachments</h2>
              <p>The Service allows you to attach files to emails. You are solely responsible for ensuring that:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>You have the legal right to send each attachment.</li>
                <li>Attachments do not contain malicious software, viruses, or harmful content.</li>
                <li>Attachments do not infringe any third party's intellectual property or other rights.</li>
                <li>
                  Total attachment size complies with Gmail's per-message size limits (currently 25 MB). The Service
                  provides a warning but does not enforce this limit.
                </li>
              </ul>
            </section>

            {/* 12 */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">12. Service Availability &amp; Modifications</h2>
              <p>
                We do not guarantee that the Service will be available at all times. We reserve the right to modify,
                suspend, or discontinue the Service (or any part thereof) at any time, with or without notice. We
                shall not be liable to you or any third party for any modification, suspension, or discontinuation of
                the Service.
              </p>
            </section>

            {/* 13 */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">13. Termination</h2>
              <p>
                These Terms are effective until terminated. You may terminate your use of the Service at any time by
                closing the application and clearing your browser's local storage. We may restrict or terminate access
                to the Service at our discretion if we believe you are violating these Terms or using the Service in a
                manner that could create liability.
              </p>
              <p>
                Upon termination, Sections 7 (No Warranty), 8 (Limitation of Liability), 9 (Indemnification), and 15
                (Governing Law) shall survive.
              </p>
            </section>

            {/* 14 */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">14. Severability</h2>
              <p>
                If any provision of these Terms is held to be invalid, illegal, or unenforceable, the remaining
                provisions shall continue in full force and effect. The invalid provision shall be modified to the
                minimum extent necessary to make it valid and enforceable while preserving its original intent.
              </p>
            </section>

            {/* 15 */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">15. Governing Law &amp; Dispute Resolution</h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in
                which the project maintainer resides, without regard to its conflict of law provisions. Any disputes
                arising under or in connection with these Terms shall be resolved through good-faith negotiation. If a
                resolution cannot be reached, disputes shall be submitted to the competent courts of the
                aforementioned jurisdiction.
              </p>
            </section>

            {/* 16 */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">16. Entire Agreement</h2>
              <p>
                These Terms, together with the{" "}
                <a href="/privacy" className="text-primary underline">
                  Privacy Policy
                </a>
                , constitute the entire agreement between you and Automailr regarding the use of the Service and
                supersede any prior agreements, understandings, or representations.
              </p>
            </section>

            {/* 17 */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">17. Changes to These Terms</h2>
              <p>
                We reserve the right to update these Terms at any time. If we make material changes, we will update
                the "Last Updated" date above. Your continued use of the Service after any changes constitutes
                acceptance of the revised Terms.
              </p>
            </section>

            {/* 18 */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">18. Contact</h2>
              <p>
                If you have questions about these Terms, please open an issue on the{" "}
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
