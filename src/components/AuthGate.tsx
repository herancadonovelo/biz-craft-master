import { useEffect, useRef } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-state";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { logSessionEvent } from "@/lib/session-telemetry";

// As páginas legais têm de estar acessíveis sem sessão: é um requisito da
// revisão de pagamentos (Paddle) e dos consumidores em geral.
const PUBLIC_ROUTES = [
  "/auth",
  "/auth-callback",
  "/sessao-expirada",
  "/reset-password",
  "/auth/verify-2fa",
  "/registo",
  "/termos",
  "/reembolsos",
  "/privacidade",
];
const E2E_PLAN_OVERRIDE_KEY = "atelier-e2e-plan-override";
const E2E_2FA_BYPASS_KEY = "atelier-e2e-2fa-bypass";
const REVALIDATE_INTERVAL_MS = 5 * 60 * 1000; // 5 min
const REDIRECT_KEY = "cbm:postLoginRedirect";

function canRenderWithoutSession(pathname: string) {
  if (PUBLIC_ROUTES.includes(pathname)) return true;
  if (import.meta.env.DEV && typeof window !== "undefined" && window.localStorage.getItem(E2E_PLAN_OVERRIDE_KEY)) return true;
  // E2E: automated browsers (Playwright/WebDriver) don't carry a Supabase
  // session, but tests still need to hit protected routes to assert paywalls
  // and locked screens. Treat webdriver as "no session, no redirect": pages
  // render, and Premium gating still shows Light users the locked UI.
  if (import.meta.env.DEV && typeof navigator !== "undefined" && (navigator as { webdriver?: boolean }).webdriver) return true;
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
  const twoFaChecked = useRef(false);

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

  // 2FA re-challenge: only enforced for users who have ALREADY enrolled a
  // verified phone and whose last challenge is stale (>24h). Enrollment is
  // opt-in from Settings — we never force new users through SMS setup.
  useEffect(() => {
    if (loading || !user) return;
    if (pathname === "/auth/verify-2fa") return;
    if (canRenderWithoutSession(pathname)) return;
    if (import.meta.env.DEV && typeof window !== "undefined" && window.localStorage.getItem(E2E_2FA_BYPASS_KEY)) return;
    if (twoFaChecked.current) return;
    twoFaChecked.current = true;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("phone_verified, last_2fa_at")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!data || !data.phone_verified) return; // opt-in: no forced enrollment
      const fresh = data.last_2fa_at && new Date(data.last_2fa_at).getTime() > Date.now() - 24 * 60 * 60 * 1000;
      if (!fresh) {
        void logSessionEvent("twofa_rechallenge_triggered", {
          path: pathname,
          metadata: { last_2fa_at: data.last_2fa_at },
        });
        nav({ to: "/auth/verify-2fa" });
      }
    })();
  }, [user, loading, pathname, nav]);

  // Reset the 2FA check flag on sign-out so a new session re-checks.
  useEffect(() => { if (!user) twoFaChecked.current = false; }, [user]);

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
  const isWebdriver =
    typeof navigator !== "undefined" &&
    (navigator as { webdriver?: boolean }).webdriver === true;
  if (loading && !canRenderWithoutSession(pathname) && !isWebdriver) {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-label="A verificar sessão"
        className="pointer-events-none fixed inset-0 z-[90] flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm"
      >
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">A verificar a tua sessão…</p>
      </div>
    );
  }

  return null;
}