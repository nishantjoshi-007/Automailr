import { AppNav } from "@/components/AppNav";
import { Footer } from "@/components/Footer";
import { WizardShell } from "@/components/wizard/WizardShell";

/** /app/* — the three-step mail merge. */
export default function Wizard() {
  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <AppNav />
      <WizardShell />
      <Footer compact wide />
    </div>
  );
}
