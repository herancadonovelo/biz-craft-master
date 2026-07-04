import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Globe, Instagram, Mail, RefreshCw, ShoppingBag, Store, Package, ShoppingCart } from "lucide-react";
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
        <PageHeader title="Sincronização" description="Liga o teu website, redes sociais, e-mail e as tuas lojas online (Shopify, WooCommerce, Squarespace, Jumpseller)." />
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
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 font-display"><ShoppingBag className="h-4 w-4" />Shopify</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between"><Label>Ativo</Label><Switch checked={!!s.shopifyAtivo} onCheckedChange={(v) => setSync({ shopifyAtivo: v })} /></div>
              <div><Label>Domínio da loja</Label><Input value={s.shopifyUrl || ""} onChange={(e) => setSync({ shopifyUrl: e.target.value })} placeholder="a-minha-loja.myshopify.com" /></div>
              <div><Label>Admin API access token</Label><Input type="password" value={s.shopifyToken || ""} onChange={(e) => setSync({ shopifyToken: e.target.value })} /></div>
              <Button className="w-full" disabled={!s.shopifyAtivo} onClick={() => sincronizar("shopify")}><RefreshCw className="mr-1 h-4 w-4" />Sincronizar agora</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 font-display"><ShoppingCart className="h-4 w-4" />WooCommerce</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between"><Label>Ativo</Label><Switch checked={!!s.wooAtivo} onCheckedChange={(v) => setSync({ wooAtivo: v })} /></div>
              <div><Label>URL da loja</Label><Input value={s.wooUrl || ""} onChange={(e) => setSync({ wooUrl: e.target.value })} placeholder="https://a-minha-loja.pt" /></div>
              <div><Label>Consumer key</Label><Input value={s.wooKey || ""} onChange={(e) => setSync({ wooKey: e.target.value })} placeholder="ck_..." /></div>
              <div><Label>Consumer secret</Label><Input type="password" value={s.wooSecret || ""} onChange={(e) => setSync({ wooSecret: e.target.value })} placeholder="cs_..." /></div>
              <Button className="w-full" disabled={!s.wooAtivo} onClick={() => sincronizar("woocommerce")}><RefreshCw className="mr-1 h-4 w-4" />Sincronizar agora</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 font-display"><Store className="h-4 w-4" />Squarespace</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between"><Label>Ativo</Label><Switch checked={!!s.squarespaceAtivo} onCheckedChange={(v) => setSync({ squarespaceAtivo: v })} /></div>
              <div><Label>URL do site</Label><Input value={s.squarespaceUrl || ""} onChange={(e) => setSync({ squarespaceUrl: e.target.value })} placeholder="https://o-meu-site.squarespace.com" /></div>
              <div><Label>API key</Label><Input type="password" value={s.squarespaceToken || ""} onChange={(e) => setSync({ squarespaceToken: e.target.value })} /></div>
              <Button className="w-full" disabled={!s.squarespaceAtivo} onClick={() => sincronizar("squarespace")}><RefreshCw className="mr-1 h-4 w-4" />Sincronizar agora</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 font-display"><Package className="h-4 w-4" />Jumpseller</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between"><Label>Ativo</Label><Switch checked={!!s.jumpsellerAtivo} onCheckedChange={(v) => setSync({ jumpsellerAtivo: v })} /></div>
              <div><Label>URL da loja</Label><Input value={s.jumpsellerUrl || ""} onChange={(e) => setSync({ jumpsellerUrl: e.target.value })} placeholder="https://a-minha-loja.jumpseller.com" /></div>
              <div><Label>Login</Label><Input value={s.jumpsellerLogin || ""} onChange={(e) => setSync({ jumpsellerLogin: e.target.value })} placeholder="email@dominio.pt" /></div>
              <div><Label>Auth token</Label><Input type="password" value={s.jumpsellerToken || ""} onChange={(e) => setSync({ jumpsellerToken: e.target.value })} /></div>
              <Button className="w-full" disabled={!s.jumpsellerAtivo} onClick={() => sincronizar("jumpseller")}><RefreshCw className="mr-1 h-4 w-4" />Sincronizar agora</Button>
            </CardContent>
          </Card>
        </div>
        {s.ultimaSync && <p className="text-xs text-muted-foreground">Última sincronização: {new Date(s.ultimaSync).toLocaleString("pt-PT")}</p>}
      </div>
    );
  },
});