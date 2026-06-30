import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Clock, LogIn, Loader2, AlertTriangle, RotateCcw, ArrowRight } from "lucide-react";
import { logSessionEvent } from "@/lib/session-telemetry";

export const Route = createFileRoute("/sessao-expirada")({
  head: () => ({ meta: [{ title: "Sessão expirada — Atelier Tricotin" }] }),
  component: SessionExpired,
});

function SessionExpired() {
  const nav = useNavigate();
  const [cleaning, setCleaning] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const cleanup = async () => {
    try { await supabase.auth.signOut(); } catch {}
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith("sb-") && k.endsWith("-auth-token"))
        .forEach((k) => localStorage.removeItem(k));
    } catch {}
  };

  useEffect(() => {
    void logSessionEvent("session_expired", {
      reason: "user_landed_on_sessao_expirada",
      path: "/sessao-expirada",
    });
    (async () => { await cleanup(); setCleaning(false); })();
  }, []);

  const retry = async () => {
    setRetrying(true);
    await cleanup();
    const { data } = await supabase.auth.getSession();
    setRetrying(false);
    if (data.session) nav({ to: "/" });
    else nav({ to: "/auth" });
  };

  const goToAuth = async () => {
    await cleanup();
    nav({ to: "/auth" });
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <Clock className="h-5 w-5 text-amber-600" /> Sessão expirada
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert
            variant="destructive"
            className="border-amber-300 bg-amber-50 text-amber-900 [&>svg]:text-amber-700 dark:bg-amber-950/30 dark:text-amber-100"
            style={{
              background: "var(--alert-bg, undefined)",
              color: "var(--alert-fg, undefined)",
              borderColor: "var(--alert-fg, undefined)",
            }}
          >
            <AlertTriangle className="h-4 w-4" style={{ color: "var(--alert-fg, undefined)" }} />
            <AlertTitle>Sessão inválida ou expirada</AlertTitle>
            <AlertDescription className="text-xs">
              O teu acesso terminou — provavelmente porque o token de autenticação
              expirou, a sessão foi encerrada noutro dispositivo ou as credenciais
              guardadas deixaram de ser válidas. Por segurança, removemos a sessão
              e os dados locais associados.
            </AlertDescription>
          </Alert>

          <p className="text-sm text-muted-foreground">
            Podes tentar novamente — se a sessão ainda for válida no servidor,
            entras automaticamente. Caso contrário, serás reencaminhada para o ecrã
            de início de sessão.
          </p>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              className="w-full"
              onClick={retry}
              disabled={cleaning || retrying}
            >
              {retrying ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> A tentar…</>
              ) : (
                <><RotateCcw className="mr-2 h-4 w-4" /> Tentar novamente</>
              )}
            </Button>
            <Button
              className="w-full"
              onClick={() => nav({ to: "/auth" })}
              disabled={cleaning || retrying}
            >
              {cleaning ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> A limpar sessão…</>
              ) : (
                <><LogIn className="mr-2 h-4 w-4" /> Voltar a entrar</>
              )}
            </Button>
          </div>

          <Button
            variant="ghost"
            className="w-full text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setConfirmOpen(true)}
            disabled={retrying}
          >
            <ArrowRight className="mr-2 h-3.5 w-3.5" /> Ir diretamente para o ecrã de início de sessão
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar saída da sessão</AlertDialogTitle>
            <AlertDialogDescription>
              Vamos limpar a sessão atual deste dispositivo e reencaminhar-te para o
              ecrã de início de sessão. Queres continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={goToAuth}>Sim, ir para /auth</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}