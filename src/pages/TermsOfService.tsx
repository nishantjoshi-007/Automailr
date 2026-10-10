import { Link } from "react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { Prose, ProseSection } from "@/components/Prose";

const SECTIONS = {
  "what-it-is": "1. What Automailr is",
  "who-can-use-it": "2. Who can use it",
  "google-account": "3. Your Google account",
  "acceptable-use": "4. Acceptable use",
  "your-content": "5. Your content and recipients",
  "google-services": "6. Google services",
  "ai-polish": "7. AI polish",
  "no-warranty": "8. No warranty",
  liability: "9. Limitation of liability",
  indemnity: "10. Indemnity",
  licence: "11. Licence",
  attachments: "12. Attachments",
  availability: "13. Availability and changes",
  termination: "14. Termination",
  "governing-law": "15. Governing law",
  "entire-agreement": "16. Entire agreement and severability",
  changes: "17. Changes to these terms",
  contact: "18. Contact",
} as const;

const TOC = Object.entries(SECTIONS).map(([id, title]) => ({ id, title }));

const EMAIL = "contact@nishantjoshi.me";
const external = { target: "_blank", rel: "noopener" } as const;

export default function TermsOfService() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main id="main">
        <Prose
          title="Terms of use"
          meta={
            <>
              Last updated <time dateTime="2026-10-10">10 October 2026</time>
            </>
          }
          toc={TOC}
        >
          <ProseSection id="what-it-is" title={SECTIONS["what-it-is"]}>
            <p>
              Automailr is a free mail merge for Gmail, run by me, Nishant Joshi, an individual based in New Jersey, USA.
              It is a static website that runs in your browser and sends email through your own Gmail account, with
              send-only access. There is no Automailr server, account or subscription, and the source code is public
              under the licence in section 11. By using Automailr you agree to these terms; if you don&rsquo;t agree,
              don&rsquo;t use it.
            </p>
          </ProseSection>

          <ProseSection id="who-can-use-it" title={SECTIONS["who-can-use-it"]}>
            <p>
              Automailr is offered to anyone, anywhere, with no geographic restriction. You must be 13 or older, or the
              minimum age of digital consent where you live if that is higher. You need a Google account that you are
              allowed to use for sending email, and if it belongs to an employer or a school, their rules apply as well.
              It is your responsibility to follow the laws on bulk email that apply to you, such as CAN-SPAM in the
              United States, the GDPR in the European Union, PECR in the United Kingdom, CASL in Canada and the Spam Act
              in Australia, including where they require the recipient&rsquo;s consent.
            </p>
          </ProseSection>

          <ProseSection id="google-account" title={SECTIONS["google-account"]}>
            <p>
              When you sign in with Google, Automailr receives an access token that lets it send email as you. The token
              is encrypted in your browser, stops being used a minute before Google&rsquo;s own expiry (usually an hour
              after you sign in) and is removed when you sign out. Everything sent from your account through Automailr is sent by you, and you are
              responsible for it.
            </p>
          </ProseSection>

          <ProseSection id="acceptable-use" title={SECTIONS["acceptable-use"]}>
            <p>
              Don&rsquo;t use Automailr to send spam or unsolicited bulk email, and follow the email laws that apply to
              you (section 2). Don&rsquo;t use it to send malware, phishing,
              harassment or anything else unlawful. Follow Google&rsquo;s{" "}
              <a href="https://www.google.com/gmail/about/policy/" {...external}>
                Gmail Program Policies
              </a>{" "}
              and sending limits. Google may suspend accounts that break its rules; that is Google&rsquo;s decision, not
              mine.
            </p>
          </ProseSection>

          <ProseSection id="your-content" title={SECTIONS["your-content"]}>
            <p>
              Your CSV, messages and attachments are yours, and you are responsible for them. I never see them: they stay
              in your browser and go from there to Google, through Gmail when you send and, for your subject and message
              only, through Gemini when you use AI polish. By sending, you confirm that you have the right to email the
              people on your list and to use their details in your messages.
            </p>
          </ProseSection>

          <ProseSection id="google-services" title={SECTIONS["google-services"]}>
            <p>
              Sending uses the Gmail API, so Google&rsquo;s{" "}
              <a href="https://policies.google.com/terms" {...external}>
                terms
              </a>
              , policies and quotas apply, including its daily sending limits. I can&rsquo;t raise those limits or
              control how Google handles your mail.
            </p>
          </ProseSection>

          <ProseSection id="ai-polish" title={SECTIONS["ai-polish"]}>
            <p>
              AI polish is optional. If you use it, your subject and message are sent to Google&rsquo;s Gemini API as a
              paid service, and the{" "}
              <a href="https://ai.google.dev/gemini-api/terms" {...external}>
                Gemini API Additional Terms
              </a>{" "}
              apply to that text. AI polish is for users aged 18 or over, which Google&rsquo;s Gemini terms require; if
              you are younger, send your message as you wrote it. I don&rsquo;t control or warrant what Gemini writes
              back: it can be wrong, change your meaning or drop a detail. Review the rewritten version before you send
              it, because once you send it, it is your message.
            </p>
          </ProseSection>

          <ProseSection id="no-warranty" title={SECTIONS["no-warranty"]}>
            <p>
              Automailr is provided &ldquo;as is&rdquo;. There is no promise that it suits your purpose, works without
              errors or is available when you need it.
            </p>
            <p className="text-[14.5px]">
              THE SOFTWARE IS PROVIDED &ldquo;AS IS&rdquo;, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
              BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
            </p>
          </ProseSection>

          <ProseSection id="liability" title={SECTIONS.liability}>
            <p>
              To the fullest extent the law allows, I am not liable for any indirect, incidental or consequential
              damages arising from your use of Automailr. That includes lost or misdirected email, suspended accounts,
              bugs, text rewritten by AI polish, and failures of Google or other third-party services. Where the law
              does not allow these exclusions, my liability is limited to the extent the law permits.
            </p>
          </ProseSection>

          <ProseSection id="indemnity" title={SECTIONS.indemnity}>
            <p>
              You agree to indemnify me against any claim, loss or cost arising from your use of Automailr or the email
              you send with it.
            </p>
          </ProseSection>

          <ProseSection id="licence" title={SECTIONS.licence}>
            <p>
              The code is released under the MIT Non-Commercial License, Copyright &copy; 2026 Nishant Joshi. You may
              use, copy, modify, merge, publish and distribute it for personal, educational, research and open-source
              purposes that are non-commercial. You may not use it for any commercial purpose, such as selling it,
              offering paid services that include it, or using it in a product or service sold for a fee. The full text
              is in the{" "}
              <a href="https://github.com/nishantjoshi-007/Automailr/blob/main/LICENSE" {...external}>
                LICENSE file on GitHub
              </a>
              .
            </p>
          </ProseSection>

          <ProseSection id="attachments" title={SECTIONS.attachments}>
            <p>
              Each message can carry up to <span className="num whitespace-nowrap">25&#8239;MB</span> of attachments in
              total, and Automailr enforces that limit. Every recipient gets the same files. You are responsible for what
              you attach, including having the right to share it.
            </p>
          </ProseSection>

          <ProseSection id="availability" title={SECTIONS.availability}>
            <p>
              Automailr may change, stop working or be taken down at any time, with or without notice. Features may be
              added or removed.
            </p>
          </ProseSection>

          <ProseSection id="termination" title={SECTIONS.termination}>
            <p>
              You can stop using Automailr at any time: sign out, and revoke its access in your Google account at{" "}
              <a href="https://myaccount.google.com/permissions" {...external}>
                myaccount.google.com/permissions
              </a>
              . If you break these terms, you must stop using it.
            </p>
          </ProseSection>

          <ProseSection id="governing-law" title={SECTIONS["governing-law"]}>
            <p>
              These terms are governed by the laws of the State of New Jersey, USA, without regard to its
              conflict-of-law rules. If a dispute comes up, you and I will first try to resolve it through good-faith
              negotiation. If that fails, it goes to the state or federal courts located in New Jersey. This does not
              take away any protection that the consumer laws where you live give you and that can&rsquo;t be waived.
            </p>
          </ProseSection>

          <ProseSection id="entire-agreement" title={SECTIONS["entire-agreement"]}>
            <p>
              These terms and the <Link to="/privacy">Privacy</Link> page are the whole agreement between you and me
              about Automailr. If any part is found unenforceable, the rest still applies, and not enforcing
              a term is not a waiver of it.
            </p>
          </ProseSection>

          <ProseSection id="changes" title={SECTIONS.changes}>
            <p>
              I may update these terms. The date at the top shows the current version, and using Automailr after a
              change means you accept the updated terms.
            </p>
          </ProseSection>

          <ProseSection id="contact" title={SECTIONS.contact}>
            <p>
              Questions about these terms: email <a href={`mailto:${EMAIL}`}>{EMAIL}</a>, or open an issue on{" "}
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
