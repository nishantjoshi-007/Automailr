import { AppNav } from "@/components/AppNav";
import { Footer } from "@/components/Footer";
import { WizardShell } from "@/components/wizard/WizardShell";

/** /app/* — the mail-merge wizard (renamed to Wizard in 5f). */
export default function Dashboard() {
  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <AppNav />
      <WizardShell />
      <Footer compact />
    </div>
  );
}
