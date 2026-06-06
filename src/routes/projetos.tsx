import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore, formatEUR, precoProjeto, custoMateriais, type MaterialUsado } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/projetos")({
  head: () => ({ meta: [{ title: "Criar projeto" }] }),
  component: () => {
    const { projetos, clientes, materiais, add, remove, update } = useStore();
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({
      nome: "", clienteId: "", precoHora: 12, margemProfit: 0.7, horasTrabalhadas: 0, estado: "rascunho" as const, materiais: [] as MaterialUsado[],
    });
    const [matSel, setMatSel] = useState({ materialId: "", quantidade: 1 });

    const submit = () => {
      if (!form.nome) return toast.error("Nome obrigatório");
      add("projetos", { ...form, criadoEm: new Date().toISOString() });
      setForm({ nome: "", clienteId: "", precoHora: 12, margemProfit: 0.7, horasTrabalhadas: 0, estado: "rascunho", materiais: [] });
      setOpen(false);
      toast.success("Projeto criado");
    };

    return (
      <div className="space-y-6">
        <PageHeader title="Projetos" description="Custo de materiais + horas × preço/hora + margem (default 70%)."
          actions={
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button><Plus className="mr-1 h-4 w-4" />Novo projeto</Button></DialogTrigger>
              <DialogContent className="max-w-xl">
                <DialogHeader><DialogTitle>Novo projeto</DialogTitle></DialogHeader>
                <div className="grid gap-3">
                  <div><Label>Nome</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Cliente</Label>
                      <Select value={form.clienteId} onValueChange={(v) => setForm({ ...form, clienteId: v })}>
                        <SelectTrigger><SelectValue placeholder="Escolher" /></SelectTrigger>
                        <SelectContent>{clientes.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div><Label>Estado</Label>
                      <Select value={form.estado} onValueChange={(v: any) => setForm({ ...form, estado: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="rascunho">Rascunho</SelectItem>
                          <SelectItem value="em_curso">Em curso</SelectItem>
                          <SelectItem value="concluido">Concluído</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div><Label>Horas</Label><Input type="number" value={form.horasTrabalhadas} onChange={(e) => setForm({ ...form, horasTrabalhadas: +e.target.value })} /></div>
                    <div><Label>€/hora</Label><Input type="number" value={form.precoHora} onChange={(e) => setForm({ ...form, precoHora: +e.target.value })} /></div>
                    <div><Label>Margem %</Label><Input type="number" value={form.margemProfit * 100} onChange={(e) => setForm({ ...form, margemProfit: +e.target.value / 100 })} /></div>
                  </div>
                  <div className="space-y-2 rounded-md border border-border p-3">
                    <Label>Materiais usados</Label>
                    <div className="flex gap-2">
                      <Select value={matSel.materialId} onValueChange={(v) => setMatSel({ ...matSel, materialId: v })}>
                        <SelectTrigger className="flex-1"><SelectValue placeholder="Material" /></SelectTrigger>
                        <SelectContent>{materiais.map((m) => <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>)}</SelectContent>
                      </Select>
                      <Input type="number" className="w-24" value={matSel.quantidade} onChange={(e) => setMatSel({ ...matSel, quantidade: +e.target.value })} />
                      <Button type="button" variant="secondary" onClick={() => { if (!matSel.materialId) return; setForm({ ...form, materiais: [...form.materiais, matSel] }); setMatSel({ materialId: "", quantidade: 1 }); }}>Adicionar</Button>
                    </div>
                    <ul className="space-y-1 text-sm">
                      {form.materiais.map((mu, i) => {
                        const m = materiais.find((x) => x.id === mu.materialId);
                        return (
                          <li key={i} className="flex items-center justify-between rounded bg-muted px-2 py-1">
                            <span>{m?.nome} × {mu.quantidade} {m?.unidade}</span>
                            <button onClick={() => setForm({ ...form, materiais: form.materiais.filter((_, j) => j !== i) })}><X className="h-3 w-3" /></button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                  <Button onClick={submit}>Guardar projeto</Button>
                </div>
              </DialogContent>
            </Dialog>
          }
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projetos.map((p) => {
            const cMat = custoMateriais(p, materiais);
            const cHoras = p.horasTrabalhadas * p.precoHora;
            const total = precoProjeto(p, materiais);
            const cliente = clientes.find((c) => c.id === p.clienteId);
            return (
              <Card key={p.id}>
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <CardTitle className="font-display">{p.nome}</CardTitle>
                    <p className="text-sm text-muted-foreground">{cliente?.nome ?? "Sem cliente"}</p>
                  </div>
                  <Badge variant="outline">{p.estado.replace("_", " ")}</Badge>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <Row label="Materiais" value={formatEUR(cMat)} />
                  <Row label={`Horas (${p.horasTrabalhadas}h × ${formatEUR(p.precoHora)})`} value={formatEUR(cHoras)} />
                  <Row label={`Margem ${(p.margemProfit * 100).toFixed(0)}%`} value={formatEUR(total - cMat - cHoras)} />
                  <div className="flex items-center justify-between border-t border-border pt-2">
                    <span className="font-display text-base">Preço final</span>
                    <span className="font-display text-lg font-semibold">{formatEUR(total)}</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <Select value={p.estado} onValueChange={(v: any) => update("projetos", p.id, { estado: v })}>
                      <SelectTrigger className="h-8 w-40"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rascunho">Rascunho</SelectItem>
                        <SelectItem value="em_curso">Em curso</SelectItem>
                        <SelectItem value="concluido">Concluído</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" onClick={() => remove("projetos", p.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  },
});

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-muted-foreground">
      <span>{label}</span><span className="font-display text-foreground">{value}</span>
    </div>
  );
}