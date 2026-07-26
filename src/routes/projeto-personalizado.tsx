import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useStore, formatEUR, type MaterialUsado } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/projeto-personalizado")({
  head: () => ({ meta: [{ title: "Iniciar Projeto Personalizado" }] }),
  component: ProjetoPersonalizadoContent,
});

export function ProjetoPersonalizadoContent() {
    const { materiais, add, receitasEditor } = useStore();
    const [nome, setNome] = useState("Peça personalizada");
    const [selected, setSelected] = useState<Record<string, number>>({});
    const [horas, setHoras] = useState(8);
    const [precoHora, setPrecoHora] = useState(12);
    const [margem, setMargem] = useState(70);
    const [receitaId, setReceitaId] = useState<string>("");

    const importarReceita = (rid: string) => {
      setReceitaId(rid);
      const rec = receitasEditor.find((x) => x.id === rid);
      if (!rec) return;
      setNome(rec.nome || nome);
      if (typeof rec.horasEstimadas === "number") setHoras(rec.horasEstimadas);
      const next: Record<string, number> = {};
      // 1) associação directa por materiaisRef
      (rec.materiaisRef ?? []).forEach((mr) => { next[mr.materialId] = mr.quantidade; });
      // 2) fallback: match por nome (case-insensitive), quantidade numérica se possível
      rec.materiais.forEach((m) => {
        const match = materiais.find((x) => x.nome.toLowerCase().trim() === m.nome.toLowerCase().trim());
        if (match && next[match.id] === undefined) {
          const num = parseFloat(String(m.quantidade).replace(",", "."));
          next[match.id] = Number.isFinite(num) && num > 0 ? num : 1;
        }
      });
      setSelected(next);
      const encontrados = Object.keys(next).length;
      const total = rec.materiais.length;
      toast.success(
        `Receita importada · ${encontrados}/${total} materiais reconhecidos${
          encontrados < total ? " (ajusta os restantes manualmente)" : ""
        }`,
      );
    };

    const itens = Object.entries(selected).filter(([, q]) => q > 0);
    const custoMat = useMemo(() =>
      itens.reduce((s, [id, q]) => {
        const m = materiais.find((x) => x.id === id);
        return s + (m ? m.precoCompra * q : 0);
      }, 0), [itens, materiais]);
    const custoHoras = horas * precoHora;
    const final = (custoMat + custoHoras) * (1 + margem / 100);

    const guardar = () => {
      const mats: MaterialUsado[] = itens.map(([materialId, quantidade]) => ({ materialId, quantidade }));
      add("projetos", {
        nome, materiais: mats, horasTrabalhadas: horas, precoHora,
        margemProfit: margem / 100, estado: "rascunho", criadoEm: new Date().toISOString(),
        receitaId: receitaId || undefined,
      });
      toast.success("Projeto personalizado guardado");
    };

    return (
      <div className="space-y-6">
        <PageHeader title="Iniciar Projeto Personalizado" description="Seleciona materiais, horas e margem para obter o preço final." />
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="font-display">Materiais</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div><Label>Nome do projeto</Label><Input value={nome} onChange={(e) => setNome(e.target.value)} /></div>
              <div className="rounded-md border border-dashed border-violet-300 bg-violet-50/40 p-3">
                <Label className="flex items-center gap-1"><Sparkles className="h-3.5 w-3.5" />Importar de receita</Label>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Select value={receitaId} onValueChange={importarReceita}>
                    <SelectTrigger className="min-w-56 flex-1"><SelectValue placeholder="Escolher receita…" /></SelectTrigger>
                    <SelectContent>
                      {receitasEditor.length === 0 && (
                        <div className="p-2 text-xs text-muted-foreground">Sem receitas guardadas.</div>
                      )}
                      {receitasEditor.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.nome} {r.tags?.length ? `· ${r.tags.slice(0, 2).join(", ")}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {receitaId && (
                    <Badge variant="secondary">Vinculada · horas e materiais pré-preenchidos</Badge>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                {materiais.map((m) => {
                  const q = selected[m.id] ?? 0;
                  const on = q > 0;
                  return (
                    <div key={m.id} className="flex items-center justify-between rounded-md border border-border p-3">
                      <div className="flex items-center gap-3">
                        <Checkbox checked={on} onCheckedChange={(c) => setSelected({ ...selected, [m.id]: c ? 1 : 0 })} />
                        <div>
                          <div className="font-medium">{m.nome}</div>
                          <div className="text-xs text-muted-foreground">{formatEUR(m.precoCompra)}/{m.unidade} · stock {m.stock}</div>
                        </div>
                      </div>
                      {on && (
                        <Input type="number" className="h-8 w-24" value={q} onChange={(e) => setSelected({ ...selected, [m.id]: +e.target.value })} />
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="font-display">Cálculo</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Horas: {horas}h</Label><Slider value={[horas]} max={120} step={1} onValueChange={([v]) => setHoras(v)} /></div>
              <div><Label>€ / hora</Label><Input type="number" value={precoHora} onChange={(e) => setPrecoHora(+e.target.value)} /></div>
              <div><Label>Margem: {margem}%</Label><Slider value={[margem]} max={200} step={5} onValueChange={([v]) => setMargem(v)} /></div>
              <div className="space-y-1 border-t border-border pt-3 text-sm text-muted-foreground">
                <div className="flex justify-between"><span>Materiais</span><span className="font-display text-foreground">{formatEUR(custoMat)}</span></div>
                <div className="flex justify-between"><span>Mão de obra</span><span className="font-display text-foreground">{formatEUR(custoHoras)}</span></div>
                <div className="flex justify-between"><span>Lucro</span><span className="font-display text-foreground">{formatEUR(final - custoMat - custoHoras)}</span></div>
                <div className="flex items-center justify-between border-t border-border pt-2 text-base">
                  <span className="font-display text-foreground">Total</span>
                  <span className="font-display text-xl font-semibold text-foreground">{formatEUR(final)}</span>
                </div>
              </div>
              <Button className="w-full" onClick={guardar}>Guardar como projeto</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
}