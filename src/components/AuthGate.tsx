import { useEffect, useRef } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-state";
import { Loader2 } from "lucide-react";

const PUBLIC_ROUTES = ["/auth", "/sessao-expirada"];
const REDIRECT_KEY = "cbm:postLoginRedirect";

export function saveIntendedPath(path: string) {
  if (typeof window === "undefined") return;
  if (PUBLIC_ROUTES.includes(path) || path === "/") return;
  try { sessionStorage.setItem(REDIRECT_KEY, path); } catch {}
}

export function consumeIntendedPath(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const v = sessionStorage.getItem(REDIRECT_KEY);
    if (v) sessionStorage.removeItem(REDIRECT_KEY);
    return v;
  } catch { return null; }
}

export function AuthGate() {
  const { user, loading } = useAuth();
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const search = useRouterState({ select: (r) => r.location.search });
  const nav = useNavigate();
  const hadUser = useRef(false);

  useEffect(() => {
    if (loading) return;
    if (user) { hadUser.current = true; return; }
    if (PUBLIC_ROUTES.includes(pathname)) return;
    // Session was lost mid-app → treat as expired
    if (hadUser.current) {
      hadUser.current = false;
      saveIntendedPath(pathname + (typeof search === "string" ? search : ""));
      nav({ to: "/sessao-expirada" });
      return;
    }
    saveIntendedPath(pathname + (typeof search === "string" ? search : ""));
    nav({ to: "/auth" });
  }, [user, loading, pathname, search, nav]);

  // Blocking overlay during initial session verification on protected routes
  if (loading && !PUBLIC_ROUTES.includes(pathname)) {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-label="A verificar sessão"
        className="fixed inset-0 z-[90] flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm"
      >
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">A verificar a tua sessão…</p>
      </div>
    );
  }

  return null;
}