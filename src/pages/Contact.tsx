import { useForm, ValidationError } from "@formspree/react";
import { useTheme } from "@/contexts/ThemeContext";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Footer } from "@/components/Footer";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { motion } from "framer-motion";
import { ChevronLeft, Sun, Moon, CheckCircle2, MessageSquare, Mail, Send } from "lucide-react";
import { PageTransition } from "@/components/PageTransition";

const FORMSPREE_ID = import.meta.env.VITE_FORMSPREE_ID || "";

export default function Contact() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [state, handleSubmit] = useForm(FORMSPREE_ID);

  return (
    <PageTransition className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <nav className="fixed w-full z-50 top-0 left-0 border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-extrabold text-lg shadow-lg group-hover:scale-105 transition-transform duration-200">
              A
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground hidden sm:inline">Automailr</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="text-muted-foreground hover:text-foreground rounded-full hover:bg-muted/50"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </div>
      </nav>

      {/* Content */}
      <div className="relative flex flex-1 pt-20">
        <AuroraBackground
          className="absolute inset-0 z-0 opacity-50 pointer-events-none"
          showRadialGradient={false}
        />

        <div className="container relative z-10 flex flex-col md:flex-row items-start justify-center gap-12 px-4 py-12 md:py-24 mx-auto max-w-6xl">
          {/* Left Column: Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex-1 space-y-8"
          >
            <div>
              <Link
                to="/"
                className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6 transition-colors"
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Back to Home
              </Link>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-4">
                Get in touch
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-lg">
                Have a question, suggestion, or just want to say hi? We'd love to hear from you. Fill out the form and
                we'll get back to you as soon as possible.
              </p>
            </div>

            <div className="flex flex-col gap-6">
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-muted/40 border border-border/50">
                <div className="bg-primary/10 p-3 rounded-xl text-primary">
                  <Mail className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Email us directly</h3>
                  <p className="text-sm text-muted-foreground mb-1">Prefer to send an email?</p>
                  <a href="mailto:contact@nishantjoshi.me" className="text-primary font-medium hover:underline">
                    contact@nishantjoshi.me
                  </a>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex-1 w-full max-w-lg"
          >
            <div className="bg-card/50 backdrop-blur-xl border border-border/50 shadow-2xl rounded-3xl p-6 sm:p-10 relative overflow-hidden">
              {state.succeeded ? (
                <div className="text-center py-12 flex flex-col items-center justify-center h-full gap-6">
                  <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 mb-2">
                    <CheckCircle2 className="h-10 w-10" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">Message sent!</h2>
                    <p className="text-muted-foreground mt-2">Thanks for reaching out. We'll be in touch shortly.</p>
                  </div>
                  <Button variant="outline" className="mt-4 rounded-full px-8" onClick={() => navigate("/")}>
                    Back to Home
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium ml-1">
                      Name
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Jane Doe"
                      required
                      className="h-12 rounded-xl bg-background/50 border-input/60 focus:bg-background transition-all"
                    />
                    <ValidationError
                      prefix="Name"
                      field="name"
                      errors={state.errors}
                      className="text-xs text-destructive ml-1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium ml-1">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      name="email"
                      placeholder="jane@example.com"
                      required
                      className="h-12 rounded-xl bg-background/50 border-input/60 focus:bg-background transition-all"
                    />
                    <ValidationError
                      prefix="Email"
                      field="email"
                      errors={state.errors}
                      className="text-xs text-destructive ml-1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject" className="text-sm font-medium ml-1">
                      Subject
                    </Label>
                    <Input
                      id="subject"
                      name="subject"
                      placeholder="How can we help?"
                      required
                      className="h-12 rounded-xl bg-background/50 border-input/60 focus:bg-background transition-all"
                    />
                    <ValidationError
                      prefix="Subject"
                      field="subject"
                      errors={state.errors}
                      className="text-xs text-destructive ml-1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-sm font-medium ml-1">
                      Message
                    </Label>
                    <Textarea
                      id="message"
                      name="message"
                      placeholder="Tell us more about your inquiry..."
                      required
                      className="min-h-[150px] rounded-xl bg-background/50 border-input/60 focus:bg-background transition-all resize-y"
                    />
                    <ValidationError
                      prefix="Message"
                      field="message"
                      errors={state.errors}
                      className="text-xs text-destructive ml-1"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={state.submitting}
                    className="w-full h-12 rounded-xl text-base shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform duration-200"
                  >
                    {state.submitting ? (
                      "Sending..."
                    ) : (
                      <>
                        Send Message <Send className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      </div>
      <Footer />
    </PageTransition>
  );
}
