import { useNavigate, Link } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/Footer";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import { PageTransition } from "@/components/PageTransition";
import { motion } from "framer-motion";
import {
  Mail,
  Upload,
  Zap,
  ArrowRight,
  Sun,
  Moon,
  Lock,
  Sparkles,
  FileSpreadsheet,
  Send,
  Eye,
  CheckCircle,
  ShieldCheck,
} from "lucide-react";

const features = [
  {
    icon: <Lock className="h-6 w-6 text-neutral-500" />,
    title: "100% Client-Side",
    description:
      "Your data never leaves your browser. No servers, no databases — everything runs locally in your device.",
    header: (
      <div className="flex flex-1 w-full h-full min-h-[6rem] items-center justify-center rounded-xl bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-900 dark:to-neutral-800 border border-neutral-200 dark:border-neutral-800">
        <div className="flex flex-col items-center gap-2">
          <div className="rounded-full bg-green-500/10 p-4">
            <ShieldCheck className="h-8 w-8 text-green-500" />
          </div>
          <div className="text-xs font-medium text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">Secure</div>
        </div>
      </div>
    ),
    className: "md:col-span-1",
  },
  {
    icon: <FileSpreadsheet className="h-6 w-6 text-neutral-500" />,
    title: "CSV-Powered",
    description:
      "Upload a CSV with recipient data and use dynamic placeholders to personalize every email completely.",
    header: (
      <div className="flex flex-1 w-full h-full min-h-[6rem] items-center justify-center rounded-xl bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-900 dark:to-neutral-800 border border-neutral-200 dark:border-neutral-800 overflow-hidden relative p-4">
        <div className="grid grid-cols-3 gap-2 w-full opacity-50">
          {[...Array(9)].map((_, i) => (
            <div
              key={i}
              className="h-4 bg-foreground/10 rounded animate-pulse"
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-background/80 backdrop-blur-sm p-3 rounded-xl border border-border shadow-sm">
            <FileSpreadsheet className="h-6 w-6 text-primary" />
          </div>
        </div>
      </div>
    ),
    className: "md:col-span-1",
  },
  {
    icon: <Mail className="h-6 w-6 text-neutral-500" />,
    title: "Gmail Integration",
    description:
      "Authenticate with Google and send directly through the Gmail API — emails come from your real address.",
    header: (
      <div className="flex flex-1 w-full h-full min-h-[6rem] items-center justify-center rounded-xl bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-900 dark:to-neutral-800 border border-neutral-200 dark:border-neutral-800">
        <div className="relative">
          <div className="absolute -inset-1 rounded-full bg-red-500/20 blur-lg animate-pulse"></div>
          <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-border relative z-10 shadow-lg">
            <Mail className="h-8 w-8 text-red-500" />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-1 border-2 border-background z-20">
            <CheckCircle className="h-3 w-3 text-white" />
          </div>
        </div>
      </div>
    ),
    className: "md:col-span-1",
  },
  {
    icon: <Zap className="h-6 w-6 text-neutral-500" />,
    title: "Built-In Rate Limiting",
    description:
      "Smart throttling ensures your emails are spaced out to respect Gmail's sending limits automatically.",
    header: (
      <div className="flex flex-1 w-full h-full min-h-[6rem] items-center justify-center rounded-xl bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-900 dark:to-neutral-800 border border-neutral-200 dark:border-neutral-800 p-6">
        <div className="w-full flex items-end justify-between gap-2 h-16">
          <div className="w-full bg-primary/20 rounded-t-md h-[40%]" />
          <div className="w-full bg-primary/40 rounded-t-md h-[70%]" />
          <div className="w-full bg-primary/60 rounded-t-md h-[50%]" />
          <div className="w-full bg-primary/80 rounded-t-md h-[90%]" />
          <div className="w-full bg-primary rounded-t-md h-[60%]" />
        </div>
      </div>
    ),
    className: "md:col-span-2",
  },
  {
    icon: <Eye className="h-6 w-6 text-neutral-500" />,
    title: "Live Preview",
    description: "Preview every personalized email before sending. See exactly what each recipient will receive.",
    header: (
      <div className="flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-900 dark:to-neutral-800 border border-neutral-200 dark:border-neutral-800 p-4 flex flex-col gap-2 relative overflow-hidden group">
        <div className="h-2 w-1/3 bg-foreground/10 rounded-full" />
        <div className="h-2 w-2/3 bg-foreground/10 rounded-full" />
        <div className="h-16 w-full bg-foreground/5 rounded-lg mt-2 p-2">
          <div className="h-full w-full bg-background/50 rounded flex items-center justify-center text-xs text-muted-foreground">
            Hello {"{{name}}"}
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-background/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    ),
    className: "md:col-span-1",
  },
];

const steps = [
  {
    num: 1,
    icon: Upload,
    title: "Upload CSV",
    description: "Drop in a spreadsheet with an email column and any personalization fields you need.",
  },
  {
    num: 2,
    icon: Sparkles,
    title: "Compose",
    description: "Write your email with a rich text editor. Insert {{placeholders}} from your CSV columns.",
  },
  {
    num: 3,
    icon: Send,
    title: "Preview & Send",
    description: "Review every personalized email, attach files, then send — all from your browser.",
  },
];

export default function Home() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  return (
    <PageTransition className="flex min-h-screen flex-col bg-background selection:bg-primary/10">
      {/* Header */}
      <nav className="fixed w-full z-50 top-0 left-0 border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2 group">
            <img
              src="/logo.png"
              alt="Automailr"
              className="h-9 w-9 rounded-xl shadow-lg group-hover:scale-105 transition-transform duration-200"
            />
            <span className="text-xl font-bold tracking-tight text-foreground hidden sm:inline">Automailr</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/contact")}
              className="text-muted-foreground hover:text-foreground text-sm font-medium hidden sm:inline-flex"
            >
              Contact
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="text-muted-foreground hover:text-foreground rounded-full hover:bg-muted/50"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Button onClick={() => navigate("/login")} className="shadow-lg shadow-primary/20 rounded-full px-6">
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <AuroraBackground className="min-h-[90vh] flex flex-col items-center justify-center pt-20 pb-10">
        <motion.div
          initial={{ opacity: 0.0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          className="relative flex flex-col gap-4 items-center justify-center px-4 max-w-5xl mx-auto text-center z-10"
        >
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary backdrop-blur-sm mb-6">
            <Sparkles className="mr-2 h-3.5 w-3.5" />
            <span>Now with Smart Throttling</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-foreground leading-[1.1]">
            Send Personalized Emails <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-500 to-pink-500 animate-gradient bg-[length:200%_auto]">
              At Scale, For Free.
            </span>
          </h1>

          <p className="font-normal text-muted-foreground text-lg sm:text-xl md:text-2xl max-w-2xl mx-auto mt-4 leading-relaxed">
            Automate your Gmail workflows directly from your browser. No servers, no hidden fees. Just you and your
            data.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <Button
              size="lg"
              onClick={() => navigate("/login")}
              className="h-12 px-8 text-base rounded-full shadow-xl shadow-primary/20 hover:scale-105 transition-transform duration-200"
            >
              Launch App
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
              className="h-12 px-8 text-base rounded-full bg-background/50 backdrop-blur-sm border-primary/20 hover:bg-background/80"
            >
              Learn More
            </Button>
          </div>

          <div className="mt-12 flex items-center justify-center gap-8 text-muted-foreground/60">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">No Credit Card</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Open Source</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Secure</span>
            </div>
          </div>
        </motion.div>
      </AuroraBackground>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02] -z-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight sm:text-5xl mb-4">
              Everything you need. Nothing you don't.
            </h2>
            <p className="text-lg text-muted-foreground">
              Built focused on privacy, speed, and simplicity. We stripped away the complexity so you can focus on
              your message.
            </p>
          </div>

          <BentoGrid className="max-w-6xl mx-auto">
            {features.map((item, i) => (
              <BentoGridItem
                key={i}
                title={item.title}
                description={item.description}
                header={item.header}
                icon={item.icon}
                className={item.className}
              />
            ))}
          </BentoGrid>
        </div>
      </section>

      {/* How it Works / Steps */}
      <section className="py-24 bg-muted/30 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">How it works</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Three simple steps to supercharge your email workflow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-[25%] left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-transparent via-border to-transparent -z-10" />

            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.2, duration: 0.5 }}
                viewport={{ once: true }}
                className="relative bg-background p-8 rounded-3xl border shadow-sm flex flex-col items-center text-center group hover:-translate-y-1 transition-transform duration-300"
              >
                <div className="absolute top-0 right-0 p-4 opacity-5 text-4xl font-black">{step.num}</div>
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform duration-300">
                  <step.icon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto rounded-[2.5rem] bg-gradient-to-br from-indigo-500 via-primary to-purple-600 p-1 sm:p-12 overflow-hidden shadow-2xl relative">
          <div className="absolute inset-0 bg-grid-white/[0.2] [mask-image:linear-gradient(to_bottom,transparent,black,transparent)]" />
          <div className="relative bg-background/10 backdrop-blur-xl rounded-[2rem] p-8 sm:p-12 text-center border border-white/20">
            <h2 className="text-3xl sm:text-5xl font-bold text-white mb-6">Ready to send smarter emails?</h2>
            <p className="text-lg sm:text-xl text-white/90 max-w-2xl mx-auto mb-10">
              Join thousands of users who trust Automailr for their daily communication needs. It's free and open
              source.
            </p>
            <Button
              size="lg"
              onClick={() => navigate("/login")}
              className="bg-white text-primary hover:bg-white/90 font-bold text-lg h-14 px-10 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
            >
              Get Started for Free
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </PageTransition>
  );
}
