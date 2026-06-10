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
import { Plus, Trash2, Search, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import { useTT } from "@/lib/i18n";

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
    const { encomendas, clientes, projetos, materiais, add, remove, update, audit, dispararGatilho, gatilhos } = useStore();
    const tt = useTT();
    const [open, setOpen] = useState(false);
    const [q, setQ] = useState("");
    const [form, setForm] = useState({ clienteId: "", projetoId: "", descricao: "", estado: "pendente" as const, prazo: "", preco: 0 });
    const onImg = (id: string, campo: "imagemEmbalagem" | "imagemEtiqueta", file?: File) => {
      if (!file) return;
      const r = new FileReader();
      r.onload = () => { update("encomendas", id, { [campo]: r.result as string } as any); audit("anexou imagem", "encomenda", id, campo); };
      r.readAsDataURL(file);
    };
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
        <div className="relative max-w-md">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Pesquisar encomenda ou cliente…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Card><CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Descrição</TableHead><TableHead>Cliente</TableHead><TableHead>Materiais</TableHead><TableHead>Imagens</TableHead><TableHead>Prazo</TableHead><TableHead>Preço</TableHead><TableHead>Estado</TableHead><TableHead></TableHead></TableRow></TableHeader>
            <TableBody>
              {encomendas.filter((e) => {
                const cc = clientes.find((x) => x.id === e.clienteId);
                return (e.descricao + " " + (cc?.nome ?? "")).toLowerCase().includes(q.toLowerCase());
              }).map((e) => {
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
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {e.imagemEmbalagem ? <img src={e.imagemEmbalagem} alt="" className="h-8 w-8 rounded object-cover" title="Embalagem" /> : (
                          <label className="grid h-8 w-8 cursor-pointer place-items-center rounded border border-dashed text-muted-foreground" title="Embalagem">
                            <ImagePlus className="h-3 w-3" /><input type="file" accept="image/*" className="hidden" onChange={(ev) => onImg(e.id, "imagemEmbalagem", ev.target.files?.[0])} />
                          </label>
                        )}
                        {e.imagemEtiqueta ? <img src={e.imagemEtiqueta} alt="" className="h-8 w-8 rounded object-cover" title="Etiqueta" /> : (
                          <label className="grid h-8 w-8 cursor-pointer place-items-center rounded border border-dashed text-muted-foreground" title="Etiqueta">
                            <ImagePlus className="h-3 w-3" /><input type="file" accept="image/*" className="hidden" onChange={(ev) => onImg(e.id, "imagemEtiqueta", ev.target.files?.[0])} />
                          </label>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{e.prazo ?? "—"}</TableCell>
                    <TableCell className="font-display">{formatEUR(e.preco)}</TableCell>
                    <TableCell>
                      <Select value={e.estado} onValueChange={(v: any) => {
                        audit("alterou estado da encomenda", "encomenda", e.id, `${e.estado} → ${v}`);
                        update("encomendas", e.id, { estado: v });
                        const g = gatilhos.find((x) => x.estado === v && x.ativo);
                        if (g) {
                          dispararGatilho(e.id, v);
                          toast.success(`Notificação preparada (${g.canal}) — vê em /notificacoes`);
                        }
                      }}>
                        <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["pendente", "em_producao", "pronta", "entregue", "cancelada"].map((s) => <SelectItem key={s} value={s}>{tt(s).replace("_", " ")}</SelectItem>)}
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