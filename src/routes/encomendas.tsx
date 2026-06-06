import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore, formatEUR } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const ESTADO_COR: Record<string, string> = {
  pendente: "bg-amber-500/15 text-amber-700",
  em_producao: "bg-sky-500/15 text-sky-700",
  pronta: "bg-violet-500/15 text-violet-700",
  entregue: "bg-emerald-500/15 text-emerald-700",
  cancelada: "bg-rose-500/15 text-rose-700",
};

export const Route = createFileRoute("/encomendas")({
  head: () => ({ meta: [{ title: "Encomendas" }] }),
  component: () => {
    const { encomendas, clientes, projetos, materiais, add, remove, update } = useStore();
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({ clienteId: "", projetoId: "", descricao: "", estado: "pendente" as const, prazo: "", preco: 0 });
    return (
      <div className="space-y-6">
        <PageHeader title="Encomendas" description="Detalhes de encomendas, incluindo material usado."
          actions={
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button><Plus className="mr-1 h-4 w-4" />Nova encomenda</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Nova encomenda</DialogTitle></DialogHeader>
                <div className="grid gap-3">
                  <div><Label>Cliente</Label>
                    <Select value={form.clienteId} onValueChange={(v) => setForm({ ...form, clienteId: v })}>
                      <SelectTrigger><SelectValue placeholder="Escolher" /></SelectTrigger>
                      <SelectContent>{clientes.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Projeto associado</Label>
                    <Select value={form.projetoId} onValueChange={(v) => setForm({ ...form, projetoId: v })}>
                      <SelectTrigger><SelectValue placeholder="(opcional)" /></SelectTrigger>
                      <SelectContent>{projetos.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Descrição</Label><Input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Prazo</Label><Input type="date" value={form.prazo} onChange={(e) => setForm({ ...form, prazo: e.target.value })} /></div>
                    <div><Label>Preço</Label><Input type="number" value={form.preco} onChange={(e) => setForm({ ...form, preco: +e.target.value })} /></div>
                  </div>
                  <Button onClick={() => { if (!form.descricao) return toast.error("Descrição obrigatória"); add("encomendas", { ...form, criadoEm: new Date().toISOString() }); setForm({ clienteId: "", projetoId: "", descricao: "", estado: "pendente", prazo: "", preco: 0 }); setOpen(false); toast.success("Encomenda criada"); }}>Guardar</Button>
                </div>
              </DialogContent>
            </Dialog>
          }
        />
        <Card><CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Descrição</TableHead><TableHead>Cliente</TableHead><TableHead>Materiais</TableHead><TableHead>Prazo</TableHead><TableHead>Preço</TableHead><TableHead>Estado</TableHead><TableHead></TableHead></TableRow></TableHeader>
            <TableBody>
              {encomendas.map((e) => {
                const c = clientes.find((x) => x.id === e.clienteId);
                const p = projetos.find((x) => x.id === e.projetoId);
                const mats = p ? p.materiais.map((mu) => {
                  const m = materiais.find((x) => x.id === mu.materialId);
                  return `${m?.nome ?? "?"} × ${mu.quantidade}`;
                }).join(", ") : "—";
                return (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.descricao}</TableCell>
                    <TableCell>{c?.nome ?? "—"}</TableCell>
                    <TableCell className="max-w-xs truncate text-xs text-muted-foreground">{mats}</TableCell>
                    <TableCell>{e.prazo ?? "—"}</TableCell>
                    <TableCell className="font-display">{formatEUR(e.preco)}</TableCell>
                    <TableCell>
                      <Select value={e.estado} onValueChange={(v: any) => update("encomendas", e.id, { estado: v })}>
                        <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["pendente", "em_producao", "pronta", "entregue", "cancelada"].map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => remove("encomendas", e.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent></Card>
      </div>
    );
  },
});
export { ESTADO_COR };