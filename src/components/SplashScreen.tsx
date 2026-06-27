import { useEffect, useState } from "react";
import logo from "@/assets/craft-business-master-logo.png.asset.json";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, RefreshCw } from "lucide-react";

export function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const start = Date.now();
    const MIN = 5000;
    const MAX = 7000;

    const finish = () => {
      if (cancelled) return;
      const elapsed = Date.now() - start;
      const wait = Math.max(0, MIN - elapsed);
      window.setTimeout(() => {
        if (cancelled) return;
        setFading(true);
        window.setTimeout(() => !cancelled && setVisible(false), 700);
      }, wait);
    };

    const hardCap = window.setTimeout(() => {
      if (cancelled) return;
      // Timed out — surface friendly error unless already done
      setError("Demorou mais do que o esperado a carregar. Verifica a tua ligação e tenta novamente.");
    }, MAX);

    (async () => {
      try {
        const { error: authErr } = await supabase.auth.getSession();
        if (authErr) throw authErr;
        if (cancelled) return;
        window.clearTimeout(hardCap);
        finish();
      } catch (e: any) {
        if (cancelled) return;
        window.clearTimeout(hardCap);
        setError(
          e?.message
            ? `Não foi possível iniciar a aplicação: ${e.message}`
            : "Não foi possível iniciar a aplicação. Verifica a tua ligação e tenta novamente.",
        );
      }
    })();

    return () => {
      cancelled = true;
      window.clearTimeout(hardCap);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-hidden
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background transition-opacity duration-700 ease-out ${
        fading ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      style={{ backgroundColor: "oklch(0.985 0.005 95)" }}
    >
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6">
        <img
          src={logo.url}
          alt="Craft Business Master"
          className="w-56 max-w-[70vw] select-none animate-in fade-in zoom-in-95 duration-700"
          draggable={false}
        />
        {!error ? (
          <div
            className="h-1 w-40 overflow-hidden rounded-full bg-foreground/10"
            role="progressbar"
            aria-label="A carregar"
          >
            <div className="h-full w-1/3 animate-[splash-slide_1.2s_ease-in-out_infinite] rounded-full bg-foreground/50" />
          </div>
        ) : (
          <div className="mx-auto max-w-sm rounded-xl border border-foreground/10 bg-background/60 p-5 text-center shadow-sm">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-foreground">Ups, algo correu mal</p>
            <p className="mt-1 text-xs text-foreground/70">{error}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background transition hover:opacity-90"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Tentar novamente
            </button>
          </div>
        )}
      </div>
      <footer className="pb-[max(1.25rem,env(safe-area-inset-bottom))] px-6 text-center">
        <p className="font-display text-[11px] tracking-wide text-foreground/55">
          © 2026 Crafts Business Master. All rights reserved to Craft Mistress.
        </p>
      </footer>
      <style>{`
        @keyframes splash-slide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </div>
  );
}