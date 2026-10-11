import { useRef, useState, type FormEvent } from "react";
import { AlertCircle, Check } from "lucide-react";
import { AppNav } from "@/components/AppNav";
import { Footer } from "@/components/Footer";
import { Prose } from "@/components/Prose";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const FORMSPARK_FORM_ID = (import.meta.env.VITE_FORMSPARK_FORM_ID ?? "").trim();
const EMAIL = "contact@nishantjoshi.me";

type Status = "idle" | "sending" | "sent" | "failed";

function ContactForm({ formId }: { formId: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const sentRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const sending = status === "sending";

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (sending) return;
    const fields = Object.fromEntries(new FormData(e.currentTarget));
    setStatus("sending");
    try {
      const res = await fetch("https://submit-form.com/" + formId, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(fields),
      });
      if (!res.ok) throw new Error(`Formspark responded ${res.status}`);
      setStatus("sent");
      requestAnimationFrame(() => sentRef.current?.focus());
    } catch {
      setStatus("failed");
    }
  };

  if (status === "sent") {
    return (
      <div
        ref={sentRef}
        tabIndex={-1}
        role="status"
        className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-3 rounded-md bg-surface-2 p-5 outline-none"
      >
        <p className="flex items-center gap-2.5 text-ink">
          <Check aria-hidden="true" className="size-5 flex-none text-pos" strokeWidth={2.2} />
          Sent. Expect a reply within a few days.
        </p>
        <Button
          type="button"
          variant="outline"
          className="ml-auto"
          onClick={() => {
            setStatus("idle");
            requestAnimationFrame(() => nameRef.current?.focus());
          }}
        >
          Send another
        </Button>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="mt-8 grid gap-5" aria-busy={sending}>
        {/* Honeypot: hidden from people; Formspark drops submissions where a bot filled it in. */}
        <input type="text" name="_honeypot" className="sr-only" tabIndex={-1} autoComplete="off" aria-hidden="true" />
        <div className="grid gap-2">
          <Label htmlFor="contact-name" className="text-[14.5px]">
            Name
          </Label>
          <Input
            ref={nameRef}
            id="contact-name"
            name="name"
            autoComplete="name"
            placeholder="Your name"
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="contact-email" className="text-[14.5px]">
            Email
          </Label>
          <Input
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            spellCheck={false}
            placeholder="you@example.com"
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="contact-message" className="text-[14.5px]">
            Message
          </Label>
          <Textarea
            id="contact-message"
            name="message"
            placeholder="What’s on your mind…"
            required
            className="min-h-[168px] resize-y text-base md:text-[15px]"
          />
        </div>

        {status === "failed" && (
          <p role="alert" className="flex items-start gap-2 text-[15px] text-neg">
            <AlertCircle aria-hidden="true" className="mt-[3px] size-4 flex-none" strokeWidth={2.2} />
            <span>
              That didn&rsquo;t send. Email{" "}
              <a href={`mailto:${EMAIL}`} className="text-neg underline underline-offset-[3px]">
                {EMAIL}
              </a>{" "}
              instead.
            </span>
          </p>
        )}

        <div>
          <Button type="submit" aria-busy={sending} className="max-[460px]:w-full">
            {sending ? "Sending…" : "Send message"}
          </Button>
        </div>
      </form>
      <p className="mt-5 text-[13.5px] text-ink-3">Sent through Formspark, which emails it to me.</p>
    </>
  );
}

export default function Contact() {
  return (
    <div className="flex min-h-dvh flex-col">
      <AppNav />
      <main id="main">
        <Prose title="Contact">
          <p>
            Questions, bugs or ideas: send a message here, or email <a href={`mailto:${EMAIL}`}>{EMAIL}</a>. Bugs are
            easiest to follow as{" "}
            <a href="https://github.com/nishantjoshi-007/Automailr/issues" target="_blank" rel="noopener">
              GitHub issues
            </a>
            .
          </p>
          {FORMSPARK_FORM_ID && (
            <div className="max-w-[560px]">
              <ContactForm formId={FORMSPARK_FORM_ID} />
            </div>
          )}
        </Prose>
      </main>
      <Footer />
    </div>
  );
}
