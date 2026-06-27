import { useEffect, useState } from "react";
import logo from "@/assets/craft-business-master-splash.png.asset.json";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { useNavigate, useRouterState } from "@tanstack/react-router";

const MAX_ATTEMPTS = 4;
const BASE_DELAY = 500; // ms — backoff: 500, 1000, 2000, 4000

export function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const navigate = useNavigate();
  const currentPath = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    let cancelled = false;
    const start = Date.now();
    const MIN = 5000;

    const finish = (user: { id: string } | null) => {
      if (cancelled) return;
      const elapsed = Date.now() - start;
      const wait = Math.max(0, MIN - elapsed);
      window.setTimeout(() => {
        if (cancelled) return;
        // Redirect to /auth when no session and we're on a protected/home route
        if (!user && !currentPath.startsWith("/auth")) {
          navigate({ to: "/auth", replace: true });
        }
        setFading(true);
        window.setTimeout(() => !cancelled && setVisible(false), 700);
      }, wait);
    };

    const sleep = (ms: number) =>
      new Promise<void>((res) => window.setTimeout(res, ms));

    (async () => {
      let lastErr: any = null;
      for (let i = 1; i <= MAX_ATTEMPTS; i++) {
        if (cancelled) return;
        setAttempt(i);
        try {
          const { data, error: authErr } = await supabase.auth.getSession();
          if (authErr) throw authErr;
          if (cancelled) return;
          finish(data.session?.user ? { id: data.session.user.id } : null);
          return;
        } catch (e) {
          lastErr = e;
          if (i < MAX_ATTEMPTS) {
            const delay = BASE_DELAY * Math.pow(2, i - 1); // exponential backoff
            await sleep(delay);
          }
        }
      }
      if (cancelled) return;
      const msg = (lastErr as any)?.message;
      setError(
        msg
          ? `Não foi possível iniciar a aplicação após ${MAX_ATTEMPTS} tentativas: ${msg}`
          : `Não foi possível iniciar a aplicação após ${MAX_ATTEMPTS} tentativas. Verifica a tua ligação e tenta novamente.`,
      );
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6">
        <img
          src={logo.url}
          alt="Craft Business Master"
          className="w-96 max-w-[85vw] select-none animate-in fade-in zoom-in-95 duration-700"
          draggable={false}
        />
        {!error ? (
          <div className="flex flex-col items-center gap-2">
            <div
              className="h-1 w-40 overflow-hidden rounded-full bg-foreground/10"
              role="progressbar"
              aria-label="A carregar"
            >
              <div className="h-full w-1/3 animate-[splash-slide_1.2s_ease-in-out_infinite] rounded-full bg-foreground/50" />
            </div>
            {attempt > 1 && (
              <p className="text-[11px] text-foreground/55">
                A tentar novamente… ({attempt}/{MAX_ATTEMPTS})
              </p>
            )}
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