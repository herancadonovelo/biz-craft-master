import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Send, Trash2, MessageCircle, Link2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/whatsapp")({
  head: () => ({ meta: [{ title: "WhatsApp Business" }] }),
  component: () => {
    const { whatsappTemplates, whatsappMensagens, clientes, encomendas, add, remove, update, sincronizacao, setSync } = useStore();
    const [tpl, setTpl] = useState({ nome: "", texto: "" });
    const [msg, setMsg] = useState({ clienteId: "", encomendaId: "", texto: "" });
    const sendMsg = () => {
      if (!msg.texto) return toast.error("Mensagem vazia");
      add("whatsappMensagens", { clienteId: msg.clienteId, encomendaId: msg.encomendaId, direcao: "out", texto: msg.texto, data: new Date().toISOString() } as any);
      toast.success("Mensagem registada (envio simulado)");
      setMsg({ clienteId: "", encomendaId: "", texto: "" });
    };
    return (
      <div className="space-y-6">
        <PageHeader title="Sincronização WhatsApp" description="Centraliza mensagens, associa-as a clientes/encomendas e usa templates rápidos." />
        <Card><CardContent className="grid gap-3 p-4 md:grid-cols-3">
          <div><Label>WhatsApp Business — Phone ID</Label><Input value={sincronizacao.instagramHandle} onChange={(e) => setSync({ instagramHandle: e.target.value })} placeholder="ex: 123456789" /></div>
          <div><Label>Access Token</Label><Input type="password" value={sincronizacao.instagramToken} onChange={(e) => setSync({ instagramToken: e.target.value })} placeholder="EAAG..." /></div>
          <div className="flex items-end"><Button variant="outline" onClick={() => toast.info("Liga primeiro o WhatsApp Business API em /sincronizacao")}><MessageCircle className="mr-1 h-4 w-4" />Verificar ligação</Button></div>
        </CardContent></Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card><CardContent className="space-y-3 p-4">
            <h3 className="font-display font-semibold">Nova mensagem</h3>
            <div><Label>Cliente</Label>
              <Select value={msg.clienteId} onValueChange={(v) => setMsg({ ...msg, clienteId: v })}>
                <SelectTrigger><SelectValue placeholder="Escolher" /></SelectTrigger>
                <SelectContent>{clientes.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Encomenda (opcional)</Label>
              <Select value={msg.encomendaId} onValueChange={(v) => setMsg({ ...msg, encomendaId: v })}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>{encomendas.map((e) => <SelectItem key={e.id} value={e.id}>{e.descricao}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Templates rápidos</Label>
              <div className="flex flex-wrap gap-1">
                {whatsappTemplates.map((t) => (
                  <Badge key={t.id} variant="secondary" className="cursor-pointer" onClick={() => setMsg({ ...msg, texto: t.texto })}>{t.nome}</Badge>
                ))}
              </div>
            </div>
            <Textarea rows={4} value={msg.texto} onChange={(e) => setMsg({ ...msg, texto: e.target.value })} placeholder="Escreve a mensagem…" />
            <Button onClick={sendMsg}><Send className="mr-1 h-4 w-4" />Registar envio</Button>
          </CardContent></Card>

          <Card><CardContent className="space-y-3 p-4">
            <h3 className="font-display font-semibold">Templates</h3>
            <Input placeholder="Nome do template" value={tpl.nome} onChange={(e) => setTpl({ ...tpl, nome: e.target.value })} />
            <Textarea rows={3} placeholder="Texto. Usa {cliente}, {encomenda}, {estado}." value={tpl.texto} onChange={(e) => setTpl({ ...tpl, texto: e.target.value })} />
            <Button variant="outline" onClick={() => { if (!tpl.nome || !tpl.texto) return; add("whatsappTemplates", tpl as any); setTpl({ nome: "", texto: "" }); }}><Plus className="mr-1 h-4 w-4" />Adicionar</Button>
            <div className="space-y-1">
              {whatsappTemplates.map((t) => (
                <div key={t.id} className="flex items-start justify-between rounded border border-border p-2 text-sm">
                  <div><div className="font-medium">{t.nome}</div><div className="text-xs text-muted-foreground">{t.texto}</div></div>
                  <Button variant="ghost" size="icon" onClick={() => remove("whatsappTemplates", t.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
          </CardContent></Card>
        </div>

        <Card><CardContent className="space-y-2 p-4">
          <h3 className="font-display font-semibold">Histórico de conversas</h3>
          <p className="text-xs text-muted-foreground">Mensagens recebidas tentam associar-se automaticamente ao cliente por telefone e à encomenda mais recente. Sem correspondência, podes associar manualmente abaixo.</p>
          {whatsappMensagens.length === 0 && <p className="text-sm text-muted-foreground">Sem mensagens.</p>}
          {whatsappMensagens.map((m) => {
            const c = clientes.find((x) => x.id === m.clienteId);
            const semCliente = !m.clienteId;
            return (
              <div key={m.id} className="rounded border border-border p-2 text-sm">
                <div className="flex justify-between text-xs text-muted-foreground"><span>{c?.nome ?? "—"} · {m.direcao}</span><span>{new Date(m.data).toLocaleString()}</span></div>
                <div>{m.texto}</div>
                {semCliente && (
                  <div className="mt-2 flex flex-wrap items-center gap-2 rounded bg-amber-50 p-2 text-xs dark:bg-amber-950/30">
                    <Link2 className="h-3 w-3 text-amber-600" />
                    <span>Sem correspondência automática — associar manualmente:</span>
                    <Select onValueChange={(v) => { update("whatsappMensagens", m.id, { clienteId: v } as any); toast.success("Mensagem associada ao cliente"); }}>
                      <SelectTrigger className="h-7 w-48"><SelectValue placeholder="Escolher cliente" /></SelectTrigger>
                      <SelectContent>{clientes.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent></Card>
      </div>
    );
  },
});