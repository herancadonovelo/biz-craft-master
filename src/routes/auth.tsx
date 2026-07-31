import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/lib/auth-state";
import { consumeIntendedPath } from "@/components/AuthGate";
import { ensureProfileAndResolveDestination } from "@/lib/post-login";
import { mapOAuthError } from "@/lib/oauth-errors";
import { logSessionEvent } from "@/lib/session-telemetry";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, LogIn } from "lucide-react";
import logoAsset from "@/assets/craft-business-master-logo-transparent.png.asset.json";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.2 17.6 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.1 24.6c0-1.6-.1-3.2-.4-4.6H24v9.1h12.4c-.5 2.9-2.2 5.4-4.7 7l7.6 5.9c4.4-4.1 6.8-10.1 6.8-17.4z" />
      <path fill="#FBBC05" d="M10.4 28.7c-.5-1.5-.8-3-.8-4.7s.3-3.2.8-4.7l-7.8-6.1C.9 16.3 0 20 0 24s.9 7.7 2.6 10.8l7.8-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.8 2.3-8.3 2.3-6.4 0-11.7-3.7-13.6-9.1l-7.8 6.1C6.5 42.6 14.6 48 24 48z" />
    </svg>
  );
}

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Entrar — Atelier Tricotin" }] }),
  component: AuthRoute,
});

// `/auth/verify-2fa` and any future child of /auth is a nested route that
// renders through <Outlet />. The branch lives in this wrapper so the login
// form's hooks never run conditionally (an early return inside AuthPage
// crashed React with "Rendered fewer hooks than expected").
function AuthRoute() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  if (pathname !== "/auth") return <Outlet />;
  return <AuthPage />;
}

function AuthPage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const search = useRouterState({ select: (r) => r.location.search as Record<string, unknown> });
  const showExpiredBanner = search?.expired === "1" || search?.expired === 1 || search?.expired === true;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [googleNotice, setGoogleNotice] = useState<{ text: string; kind: "error" | "info" } | null>(null);
  // Computed after hydration only: reading window during render makes the
  // server and client markup diverge (hydration mismatch).
  const [isInIframe, setIsInIframe] = useState(false);
  useEffect(() => {
    setIsInIframe(window.self !== window.top);
  }, []);

  const openInNewTab = () => {
    if (typeof window === "undefined") return;
    window.open(`${window.location.origin}/auth`, "_blank", "noopener");
  };

  const sendPasswordReset = async () => {
    const target = (resetEmail || email).trim();
    if (!target) {
      toast.error("Introduz o teu email para receberes o link de recuperação.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(target, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) toast.error(mapEmailError(error.message));
    else {
      toast.success("Enviámos-te um email com o link para redefinires a palavra-passe.");
      setShowReset(false);
    }
  };

  const finishAuthenticatedRedirect = async () => {
    void logSessionEvent("oauth_session_ready", {
      reason: "google_oauth_finish_redirect",
      path: window.location.pathname,
    });
    void logSessionEvent("session_signed_in", {
      reason: "google_oauth",
      path: window.location.pathname,
    });
    const target = await ensureProfileAndResolveDestination();
    nav({ to: target as any });
  };

  const waitForSession = async () => {
    for (let i = 0; i < 12; i += 1) {
      const { data } = await supabase.auth.getSession();
      if (data.session) return data.session;
      await new Promise((resolve) => window.setTimeout(resolve, 250));
    }
    return null;
  };

  useEffect(() => {
    if (!loading && user) {
      const target = consumeIntendedPath();
      nav({ to: (target as any) || "/" });
    }
  }, [user, loading, nav]);

  const mapEmailError = (message: string): string => {
    const m = message.toLowerCase();
    if (m.includes("invalid login") || m.includes("invalid credentials")) return "Email ou palavra-passe incorretos.";
    if (m.includes("email not confirmed")) return "Confirma o teu email antes de entrar. Verifica a caixa de entrada.";
    if (m.includes("user already registered")) return "Já existe uma conta com este email. Tenta entrar.";
    if (m.includes("password should be at least")) return "A palavra-passe tem de ter no mínimo 6 caracteres.";
    if (m.includes("rate limit") || m.includes("too many")) return "Demasiadas tentativas. Aguarda alguns minutos e tenta de novo.";
    if (m.includes("network")) return "Falha de rede. Verifica a tua ligação à internet.";
    return message;
  };

  const signIn = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) toast.error(mapEmailError(error.message));
    else {
      toast.success("Sessão iniciada");
      const target = consumeIntendedPath();
      nav({ to: (target as any) || "/" });
    }
  };
  const signInGoogle = async () => {
    setBusy(true);
    setGoogleNotice(null);
    void logSessionEvent("oauth_start", {
      reason: "google_button_clicked",
      path: window.location.pathname,
    });
    try {
      const r = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/auth-callback`,
        extraParams: { prompt: "select_account" },
      });

      if (r.redirected) {
        void logSessionEvent("oauth_redirect_pending", {
          reason: "browser_redirected_to_google",
          path: window.location.pathname,
        });
        return;
      }

      if (r.error) {
        const mapped = mapOAuthError(r.error.message || "");
        void logSessionEvent(mapped.kind === "info" ? "oauth_cancelled" : "oauth_failed", {
          reason: r.error.message || "unknown_provider_error",
          path: window.location.pathname,
        });
        setGoogleNotice(mapped);
        if (mapped.kind === "info") toast.info(mapped.text);
        else toast.error(mapped.text);
        return;
      }

      const session = await waitForSession();
      if (!session) {
        void logSessionEvent("oauth_failed", {
          reason: "session_not_ready_after_oauth",
          path: window.location.pathname,
        });
        const pending = {
          text: "Login com Google concluído, mas a sessão ainda não ficou ativa. Recarrega a página ou tenta novamente.",
          kind: "error" as const,
        };
        setGoogleNotice(pending);
        toast.error(pending.text);
        return;
      }

      toast.success("Sessão iniciada com Google");
      await finishAuthenticatedRedirect();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro inesperado";
      const mapped = mapOAuthError(message);
      void logSessionEvent(mapped.kind === "info" ? "oauth_cancelled" : "oauth_failed", {
        reason: message,
        path: window.location.pathname,
      });
      setGoogleNotice(mapped);
      if (mapped.kind === "info") toast.info(mapped.text);
      else toast.error(mapped.text);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center">
      <div className="mb-6 flex justify-center">
        <img
          src={logoAsset.url}
          alt="Craft Business Master"
          className="h-28 w-auto bg-transparent sm:h-32"
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display"><LogIn className="h-5 w-5" /> Aceder à tua conta</CardTitle>
          <p className="text-sm text-muted-foreground">Os teus dados ficam isolados, privados e sincronizados em qualquer dispositivo.</p>
        </CardHeader>
        <CardContent>
          {showExpiredBanner && (
            <div
              role="status"
              aria-live="polite"
              className="mb-4 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-100"
            >
              A tua sessão expirou ou foi encerrada. Introduz as tuas credenciais para voltar a entrar.
            </div>
          )}
          {isInIframe && (
            <div className="mb-4 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-100">
              Estás a ver esta app dentro da pré-visualização do Lovable. Alguns navegadores bloqueiam cookies de login em janelas incorporadas.
              Se o login falhar, <button type="button" onClick={openInNewTab} className="underline font-medium">abre numa nova janela</button>.
            </div>
          )}
          <Button
            type="button"
            variant="outline"
            className="w-full gap-2"
            onClick={signInGoogle}
            disabled={busy}
            aria-label="Entrar com o Google"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon className="h-4 w-4" />}
            Entrar com o Google
          </Button>
          {googleNotice && (
            <div
              role="alert"
              aria-live="assertive"
              className={
                googleNotice.kind === "error"
                  ? "mt-3 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive"
                  : "mt-3 rounded-md border border-border bg-muted p-3 text-xs text-muted-foreground"
              }
            >
              {googleNotice.text}
            </div>
          )}
          <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> ou email <div className="h-px flex-1 bg-border" />
          </div>
          {showReset ? (
            <div className="space-y-3">
              <div>
                <Label>Email da conta</Label>
                <Input
                  type="email"
                  value={resetEmail || email}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="o-teu-email@exemplo.pt"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Vais receber um email com um link seguro para criares uma nova palavra-passe. O link expira em pouco tempo por segurança.
              </p>
              <div className="flex gap-2">
                <Button className="flex-1" onClick={sendPasswordReset} disabled={busy}>
                  {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Enviar link de recuperação
                </Button>
                <Button variant="ghost" onClick={() => setShowReset(false)} disabled={busy}>Cancelar</Button>
              </div>
            </div>
          ) : (
          <div className="space-y-3">
            <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <div><Label>Palavra-passe</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
            <button
              type="button"
              onClick={() => { setResetEmail(email); setShowReset(true); }}
              className="text-xs text-muted-foreground underline hover:text-foreground"
            >
              Esqueci-me da password de login
            </button>
            <Button className="w-full" onClick={signIn} disabled={busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Entrar
            </Button>
            <p className="pt-2 text-center text-sm text-muted-foreground">
              Ainda não tem conta?{" "}
              <button
                type="button"
                onClick={() => nav({ to: "/registo" })}
                className="font-medium text-primary underline underline-offset-2"
              >
                Registe-se aqui
              </button>
            </p>
          </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}