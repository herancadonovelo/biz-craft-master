import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-state";
import { consumeIntendedPath } from "@/components/AuthGate";
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
      if (oauthError) {
        toast.error(`Falha no login com Google: ${oauthError}`);
        nav({ to: "/auth" });
        return;
      }

      if (loading) return;

      if (user) {
        void logSessionEvent("session_signed_in", {
          reason: "google_oauth_callback_user_ready",
          path: "/auth/callback",
        });
        const target = consumeIntendedPath();
        nav({ to: (target as any) || "/" });
        return;
      }

      setMessage("A ativar a sessão…");
      for (let i = 0; i < 16; i += 1) {
        const { data } = await supabase.auth.getSession();
        if (cancelled) return;
        if (data.session) {
          void logSessionEvent("session_signed_in", {
            reason: "google_oauth_callback_session_ready",
            path: "/auth/callback",
          });
          const target = consumeIntendedPath();
          nav({ to: (target as any) || "/" });
          return;
        }
        await new Promise((resolve) => window.setTimeout(resolve, 250));
      }

      toast.error("Não foi possível ativar a sessão Google. Tenta entrar novamente.");
      nav({ to: "/auth" });
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