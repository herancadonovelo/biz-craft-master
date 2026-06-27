import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, LogIn, Loader2 } from "lucide-react";

export const Route = createFileRoute("/sessao-expirada")({
  head: () => ({ meta: [{ title: "Sessão expirada — Atelier Tricotin" }] }),
  component: SessionExpired,
});

function SessionExpired() {
  const nav = useNavigate();
  const [cleaning, setCleaning] = useState(true);

  useEffect(() => {
    (async () => {
      try { await supabase.auth.signOut(); } catch {}
      try {
        // Limpa quaisquer resíduos locais da sessão Supabase
        Object.keys(localStorage)
          .filter((k) => k.startsWith("sb-") && k.endsWith("-auth-token"))
          .forEach((k) => localStorage.removeItem(k));
      } catch {}
      setCleaning(false);
    })();
  }, []);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <Clock className="h-5 w-5 text-amber-600" /> Sessão expirada
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            A tua sessão expirou ou foi terminada noutro dispositivo. Por segurança,
            limpámos os dados locais. Volta a entrar para continuar onde estavas.
          </p>
          <Button
            className="w-full"
            onClick={() => nav({ to: "/auth" })}
            disabled={cleaning}
          >
            {cleaning ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> A limpar sessão…</>
            ) : (
              <><LogIn className="mr-2 h-4 w-4" /> Voltar a entrar</>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}