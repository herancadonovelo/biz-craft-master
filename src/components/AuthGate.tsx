import { useEffect, useRef } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-state";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { logSessionEvent } from "@/lib/session-telemetry";
import { requiredPlanFor } from "@/lib/access-control";

const PUBLIC_ROUTES = ["/auth", "/auth/callback", "/sessao-expirada"];
const INLINE_PREMIUM_LOCK_ROUTES = new Set([
  "/ferramentas-tecnicas",
  "/editor-moodboards",
  "/editor-receita",
  "/conversor-cores",
  "/contador",
  "/atelier-sounds",
]);
const E2E_PLAN_OVERRIDE_KEY = "atelier-e2e-plan-override";
const REVALIDATE_INTERVAL_MS = 5 * 60 * 1000; // 5 min
const REDIRECT_KEY = "cbm:postLoginRedirect";

function canRenderWithoutSession(pathname: string) {
  if (PUBLIC_ROUTES.includes(pathname)) return true;
  if (requiredPlanFor(pathname) === "light") return true;
  if (INLINE_PREMIUM_LOCK_ROUTES.has(pathname)) return true;
  if (import.meta.env.DEV && typeof window !== "undefined" && window.localStorage.getItem(E2E_PLAN_OVERRIDE_KEY)) return true;
  return false;
}

export function saveIntendedPath(path: string) {
  if (typeof window === "undefined") return;
  if (canRenderWithoutSession(path) || path === "/") return;
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
    if (canRenderWithoutSession(pathname)) return;
    // Session was lost mid-app → treat as expired
    if (hadUser.current) {
      hadUser.current = false;
      saveIntendedPath(pathname + (typeof search === "string" ? search : ""));
      void logSessionEvent("session_expired", {
        reason: "user_disappeared_mid_session",
        path: pathname,
      });
      nav({ to: "/sessao-expirada" });
      return;
    }
    saveIntendedPath(pathname + (typeof search === "string" ? search : ""));
    void logSessionEvent("session_invalid", {
      reason: "no_session_on_protected_route",
      path: pathname,
    });
    nav({ to: "/auth" });
  }, [user, loading, pathname, search, nav]);

  // Periodic revalidation on protected routes — catches server-side revoked
  // sessions (logout in another device) before the user hits a 401.
  useEffect(() => {
    if (!user) return;
    if (canRenderWithoutSession(pathname)) return;

    let cancelled = false;
    const revalidate = async () => {
      if (document.hidden) return;
      const { data, error } = await supabase.auth.getUser();
      if (cancelled) return;
      if (error || !data.user) {
        void logSessionEvent("session_revoked_remote", {
          reason: error?.message ?? "getUser_returned_no_user",
          path: pathname,
        });
        saveIntendedPath(pathname + (typeof search === "string" ? search : ""));
        await supabase.auth.signOut().catch(() => {});
        nav({ to: "/sessao-expirada" });
      } else {
        void logSessionEvent("session_revalidate_ok", { path: pathname });
      }
    };

    const id = window.setInterval(revalidate, REVALIDATE_INTERVAL_MS);
    const onFocus = () => revalidate();
    window.addEventListener("focus", onFocus);
    return () => {
      cancelled = true;
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [user, pathname, search, nav]);

  // Blocking overlay during initial session verification on protected routes
  if (loading && !canRenderWithoutSession(pathname)) {
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