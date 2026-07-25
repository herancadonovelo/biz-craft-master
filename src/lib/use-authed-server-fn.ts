import { useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-state";
import { toast } from "sonner";
import { saveIntendedPath } from "@/components/AuthGate";

/**
 * Wrap a TanStack server function so it only fires when a Supabase session
 * exists. Otherwise it shows a friendly toast, saves the current path, and
 * redirects the user to /auth — avoiding the raw
 * "Unauthorized: No authorization header provided" error.
 */
export function useAuthedServerFn<Args extends any[], R>(
  fn: (...args: Args) => Promise<R>,
  opts: { silent?: boolean } = {},
) {
  const call = useServerFn(fn as any);
  const { user, loading } = useAuth();
  const nav = useNavigate();
  return useCallback(
    async (...args: Args): Promise<R | null> => {
      if (loading) return null;
      if (!user) {
        if (!opts.silent) {
          toast.error("Precisas de iniciar sessão para continuar.");
        }
        try {
          if (typeof window !== "undefined") {
            saveIntendedPath(window.location.pathname + window.location.search);
          }
        } catch {}
        nav({ to: "/auth" });
        return null;
      }
      return (call as any)(...args) as Promise<R>;
    },
    [call, user, loading, nav, opts.silent],
  );
}