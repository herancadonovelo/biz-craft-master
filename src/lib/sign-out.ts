import { QueryClient } from "@tanstack/react-query";
import type { NavigateFn } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { logSessionEvent } from "@/lib/session-telemetry";

/**
 * Event dispatched right before we sign out, so listeners (e.g. SplashScreen)
 * can replay their intro animation and land the user back on /auth.
 */
export const SIGN_OUT_REPLAY_EVENT = "atelier:sign-out-replay";

interface SignOutOpts {
  queryClient?: QueryClient;
  navigate?: NavigateFn;
}

/**
 * Sign-out hygiene per TanStack guide:
 *  1) cancel in-flight queries (avoid 401 flashes)
 *  2) clear cached protected data
 *  3) supabase.auth.signOut()
 *  4) purge lingering sb-*-auth-token entries in localStorage
 *  5) trigger splash replay + navigate to /auth (history replace)
 */
export async function signOutAndReset(opts: SignOutOpts = {}) {
  const { queryClient, navigate } = opts;
  try {
    await queryClient?.cancelQueries();
    queryClient?.clear();
  } catch {
    // non-fatal
  }

  try {
    await supabase.auth.signOut();
  } catch {
    // fall through — we still want to clear local state
  }

  try {
    if (typeof window !== "undefined") {
      Object.keys(window.localStorage)
        .filter((k) => k.startsWith("sb-") && k.endsWith("-auth-token"))
        .forEach((k) => window.localStorage.removeItem(k));
    }
  } catch {
    // ignore
  }

  void logSessionEvent("session_signed_out", { reason: "user_initiated_logout" });

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(SIGN_OUT_REPLAY_EVENT));
  }

  if (navigate) {
    try {
      await navigate({ to: "/auth", replace: true });
    } catch {
      if (typeof window !== "undefined") window.location.replace("/auth");
    }
  } else if (typeof window !== "undefined") {
    window.location.replace("/auth");
  }
}