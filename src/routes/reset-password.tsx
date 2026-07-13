import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, KeyRound } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Redefinir palavra-passe — Craft Business Master" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const nav = useNavigate();
  const [ready, setReady] = useState(false);
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Supabase reset flow lands with a `type=recovery` token in the hash.
    // The client picks it up automatically and emits PASSWORD_RECOVERY.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => { if (data.session) setReady(true); });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async () => {
    if (pwd.length < 6) return toast.error("A palavra-passe tem de ter no mínimo 6 caracteres.");
    if (pwd !== pwd2) return toast.error("As palavras-passe não coincidem.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pwd });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Palavra-passe atualizada. Já podes entrar.");
    await supabase.auth.signOut().catch(() => {});
    nav({ to: "/auth" });
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <KeyRound className="h-5 w-5" /> Redefinir palavra-passe
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!ready ? (
            <p className="text-sm text-muted-foreground">
              A validar o link de recuperação… Se esta mensagem persistir, o link pode ter expirado. Pede um novo em <b>Entrar → Esqueci-me da password</b>.
            </p>
          ) : (
            <>
              <div>
                <Label>Nova palavra-passe</Label>
                <Input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} placeholder="Mínimo 6 caracteres" />
              </div>
              <div>
                <Label>Confirmar palavra-passe</Label>
                <Input type="password" value={pwd2} onChange={(e) => setPwd2(e.target.value)} />
              </div>
              <Button className="w-full" onClick={submit} disabled={busy}>
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Guardar nova palavra-passe
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}