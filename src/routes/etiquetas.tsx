import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Printer, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/etiquetas")({
  head: () => ({ meta: [{ title: "Etiquetas de envio" }] }),
  component: () => {
    const { etiquetas, clientes, encomendas, perfilNegocio, add, remove, audit } = useStore();
    const [form, setForm] = useState({ clienteId: "", encomendaId: "", remetente: perfilNegocio.nome ?? "", destinatario: "", morada: "", codigoPostal: "", pais: "Portugal", telefone: "", peso: "", observacoes: "" });

    const preencherCliente = (id: string) => {
      const c = clientes.find((x) => x.id === id);
      if (!c) return;
      setForm((f) => ({ ...f, clienteId: id, destinatario: c.nome, morada: c.morada ?? "", telefone: c.telefone ?? "" }));
    };

    const guardar = () => {
      if (!form.destinatario || !form.morada) return toast.error("Destinatário e morada obrigatórios");
      add("etiquetas", { ...form, criadoEm: new Date().toISOString() });
      audit("criou etiqueta", "etiqueta", undefined, `${form.destinatario} · ${form.morada}`);
      setForm({ clienteId: "", encomendaId: "", remetente: perfilNegocio.nome ?? "", destinatario: "", morada: "", codigoPostal: "", pais: "Portugal", telefone: "", peso: "", observacoes: "" });
      toast.success("Etiqueta guardada");
    };

    const imprimir = (e: typeof etiquetas[number]) => {
      const html = `<!doctype html><html><head><meta charset="utf-8"><title>Etiqueta</title>
<style>body{font-family:sans-serif;margin:24px}.label{border:2px dashed #111;padding:18px;max-width:380px}.from{font-size:11px;color:#444;margin-bottom:12px}.to{font-size:14px;line-height:1.4}.to strong{font-size:18px}</style>
</head><body><div class="label">
<div class="from"><strong>REMETENTE:</strong> ${e.remetente}</div>
<div class="to"><strong>${e.destinatario}</strong><br>${e.morada}<br>${e.codigoPostal} ${e.pais}<br>${e.telefone ?? ""}</div>
${e.peso ? `<div class="from" style="margin-top:10px">Peso: ${e.peso}</div>` : ""}
${e.observacoes ? `<div class="from">Obs: ${e.observacoes}</div>` : ""}
</div><script>window.onload=()=>window.print();</script></body></html>`;
      const w = window.open("", "_blank", "width=600,height=700");
      if (!w) return; w.document.write(html); w.document.close();
    };

    return (
      <div className="space-y-6">
        <PageHeader title="Etiquetas de envio" description="Cria e imprime etiquetas com os dados do cliente." />
        <Card><CardContent className="grid gap-3 p-6 md:grid-cols-3">
          <div><Label>Cliente</Label>
            <Select value={form.clienteId} onValueChange={preencherCliente}>
              <SelectTrigger><SelectValue placeholder="Escolher (opcional)" /></SelectTrigger>
              <SelectContent>{clientes.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Encomenda associada</Label>
            <Select value={form.encomendaId} onValueChange={(v) => setForm({ ...form, encomendaId: v })}>
              <SelectTrigger><SelectValue placeholder="(opcional)" /></SelectTrigger>
              <SelectContent>{encomendas.map((e) => <SelectItem key={e.id} value={e.id}>{e.descricao}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Remetente</Label><Input value={form.remetente} onChange={(e) => setForm({ ...form, remetente: e.target.value })} /></div>
          <div><Label>Destinatário</Label><Input value={form.destinatario} onChange={(e) => setForm({ ...form, destinatario: e.target.value })} /></div>
          <div className="md:col-span-2"><Label>Morada</Label><Input value={form.morada} onChange={(e) => setForm({ ...form, morada: e.target.value })} /></div>
          <div><Label>Código postal</Label><Input value={form.codigoPostal} onChange={(e) => setForm({ ...form, codigoPostal: e.target.value })} /></div>
          <div><Label>País</Label><Input value={form.pais} onChange={(e) => setForm({ ...form, pais: e.target.value })} /></div>
          <div><Label>Telefone</Label><Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} /></div>
          <div><Label>Peso</Label><Input value={form.peso} onChange={(e) => setForm({ ...form, peso: e.target.value })} placeholder="ex.: 0.5 kg" /></div>
          <div className="md:col-span-3"><Label>Observações</Label><Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} /></div>
          <div className="md:col-span-3 flex justify-end"><Button onClick={guardar}><Plus className="mr-1 h-4 w-4" />Criar etiqueta</Button></div>
        </CardContent></Card>

        <Card><CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Destinatário</TableHead><TableHead>Morada</TableHead><TableHead>País</TableHead><TableHead></TableHead></TableRow></TableHeader>
            <TableBody>
              {etiquetas.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{new Date(e.criadoEm).toLocaleDateString("pt-PT")}</TableCell>
                  <TableCell className="font-medium">{e.destinatario}</TableCell>
                  <TableCell>{e.morada} {e.codigoPostal}</TableCell>
                  <TableCell>{e.pais}</TableCell>
                  <TableCell className="space-x-1 text-right">
                    <Button variant="ghost" size="sm" onClick={() => imprimir(e)}><Printer className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => remove("etiquetas", e.id)}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent></Card>
      </div>
    );
  },
});