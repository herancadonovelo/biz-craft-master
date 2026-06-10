import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Mail, MessageCircle, Check } from "lucide-react";
import { toast } from "sonner";

const ESTADOS = ["em_producao", "pronta", "entregue", "cancelada"];

export const Route = createFileRoute("/notificacoes")({
  head: () => ({ meta: [{ title: "Notificações automáticas" }] }),
  component: () => {
    const { gatilhos, notificacoes, setGatilho, update, clientes } = useStore();
    return (
      <div className="space-y-6">
        <PageHeader title="Gatilhos de notificação" description="Quando o estado de uma encomenda muda, a app gera uma mensagem pronta para enviar." />

        <div className="grid gap-3 md:grid-cols-2">
          {ESTADOS.map((estado) => {
            const g = gatilhos.find((x) => x.estado === estado) || { estado, ativo: false, canal: "whatsapp" as const, template: "" };
            return (
              <Card key={estado}><CardContent className="space-y-2 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-semibold capitalize">{estado.replace("_", " ")}</h3>
                  <Switch checked={g.ativo} onCheckedChange={(v) => setGatilho(estado, { ativo: v })} />
                </div>
                <div><Label>Canal</Label>
                  <Select value={g.canal} onValueChange={(v: any) => setGatilho(estado, { canal: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="ambos">Ambos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Textarea rows={3} placeholder="Olá {cliente}, a tua encomenda {encomenda}…" value={g.template} onChange={(e) => setGatilho(estado, { template: e.target.value })} />
              </CardContent></Card>
            );
          })}
        </div>

        <Card><CardContent className="space-y-2 p-4">
          <h3 className="font-display font-semibold">Fila de notificações</h3>
          {notificacoes.length === 0 && <p className="text-sm text-muted-foreground">Sem notificações pendentes.</p>}
          {notificacoes.map((n) => {
            const c = clientes.find((x) => x.id === n.clienteId);
            return (
              <div key={n.id} className="flex items-start justify-between gap-3 rounded border border-border p-3 text-sm">
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {n.canal === "whatsapp" ? <MessageCircle className="h-3 w-3" /> : <Mail className="h-3 w-3" />}
                    <span>{c?.nome ?? "—"} · {n.estadoAlvo} · {new Date(n.data).toLocaleString()}</span>
                    {n.enviada && <span className="text-emerald-600">enviada</span>}
                  </div>
                  <div>{n.texto}</div>
                </div>
                {!n.enviada && (
                  <Button size="sm" variant="outline" onClick={() => { update("notificacoes", n.id, { enviada: true } as any); toast.success("Marcada como enviada"); }}>
                    <Check className="mr-1 h-4 w-4" />Enviar
                  </Button>
                )}
              </div>
            );
          })}
        </CardContent></Card>
      </div>
    );
  },
});