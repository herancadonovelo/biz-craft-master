import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/lib/auth-state";
import { consumeIntendedPath } from "@/components/AuthGate";
import { logSessionEvent } from "@/lib/session-telemetry";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, LogIn } from "lucide-react";
import logoAsset from "@/assets/craft-business-master-logo-transparent.png.asset.json";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Entrar — Atelier Tricotin" }] }),
  component: AuthPage,
});

function AuthPage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const isInIframe = typeof window !== "undefined" && window.self !== window.top;

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
    const target = consumeIntendedPath();
    nav({ to: (target as any) || "/" });
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

  const mapOAuthError = (message: string): { text: string; kind: "error" | "info" } => {
    const m = (message || "").toLowerCase();
    if (m.includes("cancel") || m.includes("closed") || m.includes("popup")) {
      return { text: "Login com Google cancelado. Tenta novamente quando quiseres.", kind: "info" };
    }
    if (m.includes("network") || m.includes("failed to fetch")) {
      return { text: "Falha de rede durante o login Google. Verifica a tua ligação e tenta de novo.", kind: "error" };
    }
    if (m.includes("redirect")) {
      return { text: "URL de redirecionamento não autorizado. Contacta o suporte.", kind: "error" };
    }
    if (m.includes("provider is not enabled") || m.includes("unsupported provider")) {
      return { text: "Login Google ainda não está ativado no servidor. Contacta o suporte.", kind: "error" };
    }
    if (m.includes("unauthorized") || m.includes("access_denied")) {
      return { text: "Acesso negado pela conta Google. Verifica as permissões e tenta de novo.", kind: "error" };
    }
    return { text: `Falha no login com Google: ${message || "erro desconhecido"}. Tenta novamente ou usa email/palavra-passe.`, kind: "error" };
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
  const signUp = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: window.location.origin },
    });
    setBusy(false);
    if (error) toast.error(mapEmailError(error.message));
    else toast.success("Conta criada — verifica o teu email se necessário");
  };
  const signInGoogle = async () => {
    setBusy(true);
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
        toast.error("Login Google concluído, mas a sessão ainda não ficou ativa. Tenta recarregar a página.");
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
          {isInIframe && (
            <div className="mb-4 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-100">
              Estás a ver esta app dentro da pré-visualização do Lovable. Alguns navegadores bloqueiam cookies de login em janelas incorporadas.
              Se o login falhar, <button type="button" onClick={openInNewTab} className="underline font-medium">abre numa nova janela</button>.
            </div>
          )}
          <Button variant="outline" className="w-full" onClick={signInGoogle} disabled={busy}>
            Continuar com Google
          </Button>
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
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="login">Entrar</TabsTrigger><TabsTrigger value="signup">Registar</TabsTrigger></TabsList>
            <TabsContent value="login" className="space-y-3 pt-3">
              <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div><Label>Palavra-passe</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
              <button
                type="button"
                onClick={() => { setResetEmail(email); setShowReset(true); }}
                className="text-xs text-muted-foreground underline hover:text-foreground"
              >
                Esqueci-me da password de login
              </button>
              <Button className="w-full" onClick={signIn} disabled={busy}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Entrar</Button>
            </TabsContent>
            <TabsContent value="signup" className="space-y-3 pt-3">
              <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div><Label>Palavra-passe</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" /></div>
              <Button className="w-full" onClick={signUp} disabled={busy}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Criar conta</Button>
            </TabsContent>
          </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}