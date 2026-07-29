import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useStore, formatEUR } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Calculator as CalcIcon, Check, FileText, Package } from "lucide-react";
import { toast } from "sonner";

type Linha = { id: string; materialId: string; quantidade: number };

export const Route = createFileRoute("/calculadora")({
  head: () => ({ meta: [{ title: "Calculadora de preço" }] }),
  component: () => {
    const { materiais, design, projetos, cotacoes, faturas, clientes, add: addEntity, update, audit } = useStore();
    const [projetoId, setProjetoId] = useState<string>(projetos[0]?.id ?? "");
    const [linhas, setLinhas] = useState<Linha[]>([]);
    const [horas, setHoras] = useState(4);
    const [precoHora, setPrecoHora] = useState(design.precoHoraBase);
    const [margem, setMargem] = useState(70);
    const [extras, setExtras] = useState(0);
    const [savedAt, setSavedAt] = useState<string | null>(null);

    const custoMat = useMemo(
      () => linhas.reduce((s, l) => {
        const m = materiais.find((x) => x.id === l.materialId);
        return s + (m ? m.precoCompra * l.quantidade : 0);
      }, 0),
      [linhas, materiais],
    );
    const custoHoras = horas * precoHora;
    const base = custoMat + custoHoras + extras;
    const precoFinal = base * (1 + margem / 100);
    const lucro = precoFinal - base;

    // Auto-save como cotação (debounce 800ms) sempre que há projeto + materiais
    const timer = useRef<number | null>(null);
    useEffect(() => {
      if (!projetoId) return;
      const materiaisValidos = linhas.filter((l) => l.materialId && l.quantidade > 0);
      if (materiaisValidos.length === 0) return;
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        addEntity("cotacoes", {
          projetoId,
          materiais: materiaisValidos.map((l) => ({ materialId: l.materialId, quantidade: l.quantidade })),
          horas,
          precoHora,
          extras,
          margem,
          custoMateriais: custoMat,
          custoHoras,
          base,
          precoFinal,
          criadoEm: new Date().toISOString(),
        });
        setSavedAt(new Date().toLocaleTimeString("pt-PT"));
      }, 800);
      return () => { if (timer.current) window.clearTimeout(timer.current); };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projetoId, linhas, horas, precoHora, extras, margem]);

    const cotacoesProjeto = cotacoes.filter((c) => c.projetoId === projetoId).slice(-5).reverse();

    const converterEmFatura = () => {
      const proj = projetos.find((p) => p.id === projetoId);
      if (!proj) return toast.error("Escolhe um projeto");
      if (precoFinal <= 0) return toast.error("Valor inválido");
      if (proj.estado === "concluido") {
        const ok = window.confirm("Este projeto já está concluído. Criar mesmo assim uma nova fatura?");
        if (!ok) return;
      }
      const cliente = clientes.find((c) => c.id === proj.clienteId);
      if (!cliente) {
        const ok = window.confirm("O projeto não tem cliente associado. Criar fatura sem cliente?");
        if (!ok) return;
      }
      const ano = new Date().getFullYear();
      const nDoAno = faturas.filter((f) => f.numero.startsWith(`FT ${ano}/`)).length + 1;
      const numero = `FT ${ano}/${String(nDoAno).padStart(3, "0")}`;
      addEntity("faturas", {
        numero,
        clienteId: proj.clienteId,
        projetoId: proj.id,
        tipo: "projeto",
        valor: Number(precoFinal.toFixed(2)),
        iva: 23,
        estado: "emitida",
        data: new Date().toISOString().slice(0, 10),
      } as any);
      const estadoAntes = proj.estado;
      update("projetos", proj.id, { estado: "concluido" });
      addEntity("vendas", {
        clienteId: proj.clienteId, projetoId: proj.id,
        valor: Number(precoFinal.toFixed(2)),
        data: new Date().toISOString().slice(0, 10),
        notas: `Convertida da cotação · ${numero}`,
      });
      audit("converteu cotação em fatura", "fatura", undefined, `${numero} · ${proj.nome} · ${formatEUR(precoFinal)}`);
      audit("alterou estado do projeto", "projeto", proj.id, `${estadoAntes} → concluido (via fatura ${numero})`);
      toast.success(`Fatura ${numero} criada · projeto marcado como concluído`);
    };

    const addLinha = () => setLinhas((l) => [...l, { id: Math.random().toString(36).slice(2), materialId: materiais[0]?.id ?? "", quantidade: 1 }]);
    const upd = (id: string, p: Partial<Linha>) => setLinhas((l) => l.map((x) => x.id === id ? { ...x, ...p } : x));
    const rm = (id: string) => setLinhas((l) => l.filter((x) => x.id !== id));

    return (
      <div className="space-y-6">
        <PageHeader title="Calculadora de preço" description="Calcula o preço final de uma peça: materiais + horas + margem." />
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="font-display">Materiais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Projeto associado</Label>
                <Select value={projetoId} onValueChange={setProjetoId}>
                  <SelectTrigger><SelectValue placeholder="Escolher projeto…" /></SelectTrigger>
                  <SelectContent>
                    {projetos.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
                {projetos.length === 0 && <p className="mt-1 text-xs text-muted-foreground">Cria um projeto primeiro para guardar cotações.</p>}
              </div>
              {linhas.map((l) => {
                const m = materiais.find((x) => x.id === l.materialId);
                return (
                  <div key={l.id} className="flex flex-wrap items-end gap-2 rounded-md border border-border p-3">
                    <div className="flex-1 min-w-[180px]">
                      <Label>Material</Label>
                      <Select value={l.materialId} onValueChange={(v) => upd(l.id, { materialId: v })}>
                        <SelectTrigger><SelectValue placeholder="Escolher…" /></SelectTrigger>
                        <SelectContent>
                          {materiais.map((mm) => <SelectItem key={mm.id} value={mm.id}>{mm.nome} ({formatEUR(mm.precoCompra)}/{mm.unidade})</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-28">
                      <Label>Qtd ({m?.unidade ?? "un"})</Label>
                      <Input type="number" min={0} step={0.1} value={l.quantidade}
                        onChange={(e) => upd(l.id, { quantidade: Number(e.target.value) || 0 })} />
                    </div>
                    <div className="w-28 text-right">
                      <Label className="block">Subtotal</Label>
                      <span className="font-display">{formatEUR((m?.precoCompra ?? 0) * l.quantidade)}</span>
                    </div>
                    <Button variant="ghost" size="icon" aria-label={`Remover material ${m?.nome ?? ""}`.trim()} onClick={() => rm(l.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                );
              })}
              <Button variant="outline" onClick={addLinha} disabled={materiais.length === 0}>
                <Plus className="mr-1 h-4 w-4" />Adicionar material
              </Button>
              {materiais.length === 0 && <p className="text-sm text-muted-foreground">Adiciona materiais em Stock primeiro.</p>}

              <div className="grid gap-4 pt-4 md:grid-cols-3">
                <div>
                  <Label>Horas trabalhadas</Label>
                  <Input type="number" min={0} step={0.5} value={horas} onChange={(e) => setHoras(Number(e.target.value) || 0)} />
                </div>
                <div>
                  <Label>Preço-hora (€)</Label>
                  <Input type="number" min={0} step={0.5} value={precoHora} onChange={(e) => setPrecoHora(Number(e.target.value) || 0)} />
                </div>
                <div>
                  <Label>Custos extra (€)</Label>
                  <Input type="number" min={0} step={0.5} value={extras} onChange={(e) => setExtras(Number(e.target.value) || 0)} />
                </div>
              </div>
              <div className="pt-2">
                <Label>Margem de lucro: {margem}%</Label>
                <Slider value={[margem]} min={0} max={200} step={5} onValueChange={([v]) => setMargem(v)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display"><CalcIcon className="h-5 w-5" />Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row label="Materiais" value={formatEUR(custoMat)} />
              <Row label={`Horas (${horas}h × ${formatEUR(precoHora)})`} value={formatEUR(custoHoras)} />
              <Row label="Extras" value={formatEUR(extras)} />
              <div className="my-2 border-t border-border" />
              <Row label="Custo base" value={formatEUR(base)} />
              <Row label={`Margem ${margem}%`} value={formatEUR(lucro)} />
              <div className="my-2 border-t border-border" />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Preço final</span>
                <Badge className="text-base font-display">{formatEUR(precoFinal)}</Badge>
              </div>
              <p className="pt-2 text-xs text-muted-foreground">Fórmula: (Materiais + Horas × €/h + Extras) × (1 + margem).</p>
              {savedAt && projetoId && (
                <p className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                  <Check className="h-3 w-3" /> Cotação guardada às {savedAt}
                </p>
              )}
              {cotacoesProjeto.length > 0 && (
                <div className="pt-3">
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Últimas cotações</p>
                  <ul className="space-y-1">
                    {cotacoesProjeto.map((c) => (
                      <li key={c.id} className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{new Date(c.criadoEm).toLocaleString("pt-PT")}</span>
                        <span className="font-display">{formatEUR(c.precoFinal)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <Button className="w-full" onClick={converterEmFatura} disabled={!projetoId || precoFinal <= 0}>
                <FileText className="mr-1 h-4 w-4" />Converter em fatura
              </Button>
              <Button variant="outline" className="w-full" disabled={precoFinal <= 0} onClick={() => {
                const proj = projetos.find((p) => p.id === projetoId);
                addEntity("catalogo", {
                  nome: proj?.nome || "Peça sem nome",
                  descricao: `Materiais ${formatEUR(custoMat)} · ${horas}h × ${formatEUR(precoHora)} · margem ${margem}%`,
                  precoVenda: Number(precoFinal.toFixed(2)),
                  custoMateriais: Number(custoMat.toFixed(2)),
                  custoHoras: Number(custoHoras.toFixed(2)),
                  margem,
                  projetoId: projetoId || undefined,
                  ativo: true,
                  criadoEm: new Date().toISOString(),
                } as any);
                audit("guardou item no catálogo", "catalogo", undefined, `${proj?.nome || ""} · ${formatEUR(precoFinal)}`);
                toast.success("Guardado no Catálogo como preço de venda");
              }}>
                <Package className="mr-1 h-4 w-4" />Guardar no Catálogo
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  },
});

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-display">{value}</span>
    </div>
  );
}