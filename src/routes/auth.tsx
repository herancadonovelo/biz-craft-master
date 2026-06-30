import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/lib/auth-state";
import { consumeIntendedPath } from "@/components/AuthGate";
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

  useEffect(() => {
    if (!loading && user) {
      const target = consumeIntendedPath();
      nav({ to: (target as any) || "/" });
    }
  }, [user, loading, nav]);

  const signIn = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) toast.error(error.message);
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
    if (error) toast.error(error.message); else toast.success("Conta criada — verifica o teu email se necessário");
  };
  const signInGoogle = async () => {
    setBusy(true);
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    setBusy(false);
    if (r.error) toast.error("Falha no login com Google");
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
          <Button variant="outline" className="w-full" onClick={signInGoogle} disabled={busy}>
            Continuar com Google
          </Button>
          <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> ou email <div className="h-px flex-1 bg-border" />
          </div>
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="login">Entrar</TabsTrigger><TabsTrigger value="signup">Registar</TabsTrigger></TabsList>
            <TabsContent value="login" className="space-y-3 pt-3">
              <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div><Label>Palavra-passe</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
              <Button className="w-full" onClick={signIn} disabled={busy}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Entrar</Button>
            </TabsContent>
            <TabsContent value="signup" className="space-y-3 pt-3">
              <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div><Label>Palavra-passe</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" /></div>
              <Button className="w-full" onClick={signUp} disabled={busy}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Criar conta</Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}