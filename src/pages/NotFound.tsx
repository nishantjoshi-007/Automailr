import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Footer } from "@/components/Footer";
import { PageTransition } from "@/components/PageTransition";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { Button } from "@/components/ui/button";
import { Home, AlertCircle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <PageTransition className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      <AuroraBackground className="fixed inset-0 z-0 opacity-20 pointer-events-none" showRadialGradient={false} />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center p-4">
        <div className="glass max-w-md w-full p-8 rounded-3xl text-center shadow-2xl border-border/50 backdrop-blur-xl">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 text-destructive animate-pulse">
            <AlertCircle className="h-10 w-10" />
          </div>

          <h1 className="mb-2 text-4xl font-extrabold tracking-tight text-foreground">404</h1>
          <h2 className="mb-4 text-xl font-medium text-muted-foreground">Page Not Found</h2>

          <p className="mb-8 text-sm text-muted-foreground/80 leading-relaxed">
            Oops! The page you're looking for doesn't exist or has been moved.
            <br />
            <span className="font-mono text-xs opacity-75 mt-2 block bg-muted/50 p-1 rounded">
              Route: {location.pathname}
            </span>
          </p>

          <Button
            asChild
            className="w-full h-11 rounded-xl shadow-lg hover:shadow-primary/25 transition-all"
            size="lg"
          >
            <Link to="/" className="gap-2">
              <Home className="h-4 w-4" />
              Return Home
            </Link>
          </Button>
        </div>
      </div>

      <Footer className="relative z-10 border-t border-border/40 bg-background/50 backdrop-blur-sm" />
    </PageTransition>
  );
};

export default NotFound;
