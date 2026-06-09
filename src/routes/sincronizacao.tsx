import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Globe, Instagram, Mail, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/sincronizacao")({
  head: () => ({ meta: [{ title: "Sincronização" }] }),
  component: () => {
    const s = useStore((x) => x.sincronizacao);
    const setSync = useStore((x) => x.setSync);
    const audit = useStore((x) => x.audit);
    const sincronizar = (canal: string) => {
      setSync({ ultimaSync: new Date().toISOString() });
      audit("sincronização manual", canal);
      toast.success(`Sincronização ${canal} executada (manual)`);
    };
    return (
      <div className="space-y-6">
        <PageHeader title="Sincronização" description="Liga o teu website, Instagram e e-mail. Sincronização manual sempre que precisares." />
        <div className="grid gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 font-display"><Globe className="h-4 w-4" />Website</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between"><Label>Ativo</Label><Switch checked={s.websiteAtivo} onCheckedChange={(v) => setSync({ websiteAtivo: v })} /></div>
              <div><Label>URL</Label><Input value={s.websiteUrl} onChange={(e) => setSync({ websiteUrl: e.target.value })} placeholder="https://o-meu-site.pt" /></div>
              <div><Label>API key / Token</Label><Input type="password" value={s.websiteApiKey} onChange={(e) => setSync({ websiteApiKey: e.target.value })} /></div>
              <Button className="w-full" disabled={!s.websiteAtivo} onClick={() => sincronizar("website")}><RefreshCw className="mr-1 h-4 w-4" />Sincronizar agora</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 font-display"><Instagram className="h-4 w-4" />Instagram</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between"><Label>Ativo</Label><Switch checked={s.instagramAtivo} onCheckedChange={(v) => setSync({ instagramAtivo: v })} /></div>
              <div><Label>@handle</Label><Input value={s.instagramHandle} onChange={(e) => setSync({ instagramHandle: e.target.value })} placeholder="@atelier" /></div>
              <div><Label>Token de acesso</Label><Input type="password" value={s.instagramToken} onChange={(e) => setSync({ instagramToken: e.target.value })} /></div>
              <Button className="w-full" disabled={!s.instagramAtivo} onClick={() => sincronizar("instagram")}><RefreshCw className="mr-1 h-4 w-4" />Sincronizar agora</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 font-display"><Mail className="h-4 w-4" />E-mail</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between"><Label>Ativo</Label><Switch checked={s.emailAtivo} onCheckedChange={(v) => setSync({ emailAtivo: v })} /></div>
              <div><Label>Servidor (IMAP)</Label><Input value={s.emailServidor} onChange={(e) => setSync({ emailServidor: e.target.value })} placeholder="imap.gmail.com" /></div>
              <div><Label>Utilizador</Label><Input value={s.emailUtilizador} onChange={(e) => setSync({ emailUtilizador: e.target.value })} /></div>
              <Button className="w-full" disabled={!s.emailAtivo} onClick={() => sincronizar("email")}><RefreshCw className="mr-1 h-4 w-4" />Sincronizar agora</Button>
            </CardContent>
          </Card>
        </div>
        {s.ultimaSync && <p className="text-xs text-muted-foreground">Última sincronização: {new Date(s.ultimaSync).toLocaleString("pt-PT")}</p>}
      </div>
    );
  },
});