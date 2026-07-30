import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-state";
import { ensureProfileAndResolveDestination } from "@/lib/post-login";
import { mapOAuthError } from "@/lib/oauth-errors";
import { logSessionEvent } from "@/lib/session-telemetry";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export const Route = createFileRoute("/auth-callback")({
  head: () => ({ meta: [{ title: "A concluir login — Atelier Tricotin" }] }),
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [message, setMessage] = useState("A validar a tua conta Google…");

  useEffect(() => {
    let cancelled = false;

    const finish = async () => {
      const params = new URLSearchParams(window.location.search || window.location.hash.replace(/^#/, ""));
      const oauthError = params.get("error_description") || params.get("error");
      void logSessionEvent("oauth_callback_received", {
        reason: oauthError ? `provider_error:${oauthError}` : "callback_reached",
        path: "/auth-callback",
      });
      if (oauthError) {
        const mapped = mapOAuthError(oauthError);
        void logSessionEvent(mapped.kind === "info" ? "oauth_cancelled" : "oauth_failed", {
          reason: oauthError,
          path: "/auth-callback",
        });
        if (mapped.kind === "info") toast.info(mapped.text);
        else toast.error(mapped.text);
        setMessage(mapped.text);
        // Nunca terminamos a sessão existente: se já havia login válido,
        // o utilizador continua dentro da app; caso contrário volta ao /auth.
        const { data: current } = await supabase.auth.getSession();
        nav({ to: current.session ? "/" : "/auth" });
        return;
      }

      if (loading) return;

      if (user) {
        void logSessionEvent("oauth_session_ready", {
          reason: "user_ready_on_callback",
          path: "/auth-callback",
        });
        void logSessionEvent("session_signed_in", {
          reason: "google_oauth_callback_user_ready",
          path: "/auth-callback",
        });
        setMessage("A preparar a tua conta…");
        const target = await ensureProfileAndResolveDestination();
        if (cancelled) return;
        nav({ to: target as any });
        return;
      }

      setMessage("A ativar a sessão…");
      for (let i = 0; i < 16; i += 1) {
        const { data } = await supabase.auth.getSession();
        if (cancelled) return;
        if (data.session) {
          void logSessionEvent("oauth_session_ready", {
            reason: "session_ready_after_polling",
            path: "/auth-callback",
            metadata: { attempts: i + 1 },
          });
          void logSessionEvent("session_signed_in", {
            reason: "google_oauth_callback_session_ready",
            path: "/auth-callback",
          });
          setMessage("A preparar a tua conta…");
          const target = await ensureProfileAndResolveDestination();
          if (cancelled) return;
          nav({ to: target as any });
          return;
        }
        await new Promise((resolve) => window.setTimeout(resolve, 250));
      }

      void logSessionEvent("oauth_failed", {
        reason: "session_never_activated_after_callback",
        path: "/auth-callback",
      });
      const fallback = mapOAuthError("timeout");
      setMessage(fallback.text);
      toast.error(fallback.text);
      const { data: current } = await supabase.auth.getSession();
      nav({ to: current.session ? "/" : "/auth" });
    };

    void finish();
    return () => { cancelled = true; };
  }, [user, loading, nav]);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <Loader2 className="h-5 w-5 animate-spin text-primary" /> Login Google
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{message}</p>
        </CardContent>
      </Card>
    </div>
  );
}