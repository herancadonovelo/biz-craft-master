// Editor de Gráficos: Tricô (Charts & Lace)
// Cobre as 7 categorias pedidas: grelha visual, matemática/grading, colorwork,
// construção (raglan/meia), escrita/dicionários, contador de carreiras e
// custo/exportação. Mantido num único ficheiro para facilitar manutenção.

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Grid3x3, Palette, Ruler, Shirt, BookOpen, Timer, Package } from "lucide-react";
import { Undo2, Redo2, Trash2, Pencil } from "lucide-react";
import {
  PONTOS_TRICOT, agulhaConverter, converterExpressoes, suggestions, findPonto,
  type Terminologia, type PontoTricot,
} from "@/lib/knit/dicionario";
import {
  emptyChart, chartToText, chartToSvg, malhasPorCarreira, verificarMultiplo,
  espacamentoBotoes, validarSimetriaDiminuicoes, consumoPorCor, detectarFloats,
  inverterCores, gerarRaglanTopDown, gerarMeia, malhasParaCm, PALETAS,
  type Chart, type Cell, type Gauge, type PaletaId,
} from "@/lib/knit/engine";
import { GradingPanel } from "@/components/knit-editor/GradingPanel";
import { ColorworkPanel } from "@/components/knit-editor/ColorworkPanel";
import { ConstructionPanel } from "@/components/knit-editor/ConstructionPanel";
import { WritingPanel } from "@/components/knit-editor/WritingPanel";
import { TesterPanel } from "@/components/knit-editor/TesterPanel";
import { CustoExportPanel } from "@/components/knit-editor/CustoExportPanel";
import type { Marcador } from "@/lib/knit/construction";
import { useStore } from "@/lib/store";

const STORAGE_KEY = "cbm:knit-editor:v1";

interface EditorState {
  chart: Chart;
  activePonto: string;
  activeCor?: string;
  paletaId: PaletaId;
  terminologia: Terminologia;
  gauge: Gauge;
  darkMode: boolean;
  multiplo: number;
  botoes: number;
  carreirasTotais: number;
  peitoCm: number;
  peCm: number;
  agulhaMm: number;
  maxFloat: number;
  customSymbols: { id: string; simbolo: string; nome: string }[];
  contador: { atual: number; destaque: number };
  circular: boolean;
  // Fase 2 — grading avançado
  bordas: number;
  margemBotoesInferior: number;
  margemBotoesSuperior: number;
  cavaCm: number;
  decoteTipo: "V" | "redondo";
  decoteLarguraCm: number;
  decoteProfundidadeCm: number;
  // Fase 3 — colorwork avançado
  gramasPor100m: number;
  metrosPorNovelo: number;
  floatMultiplier: number;
  marcadores: Marcador[];
}

function loadState(): EditorState {
  if (typeof window === "undefined") return defaultState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultState(), ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return defaultState();
}

function defaultState(): EditorState {
  return {
    chart: emptyChart(20, 20),
    activePonto: "meia",
    paletaId: "drops",
    terminologia: "pt",
    gauge: { pontos: 20, carreiras: 28, cm: 10 },
    darkMode: false,
    multiplo: 8,
    botoes: 5,
    carreirasTotais: 100,
    peitoCm: 96,
    peCm: 24,
    agulhaMm: 4.0,
    maxFloat: 5,
    customSymbols: [],
    contador: { atual: 1, destaque: 1 },
    circular: false,
    bordas: 2,
    margemBotoesInferior: 6,
    margemBotoesSuperior: 4,
    cavaCm: 20,
    decoteTipo: "redondo",
    decoteLarguraCm: 18,
    decoteProfundidadeCm: 8,
    gramasPor100m: 50,
    metrosPorNovelo: 200,
    floatMultiplier: 1.8,
    marcadores: [],
  };
}

export function KnitEditor() {
  const [st, setSt] = React.useState<EditorState>(loadState);
  const past = React.useRef<Chart[]>([]);
  const future = React.useRef<Chart[]>([]);
  const [, forceTick] = React.useState(0);
  const patch = React.useCallback((p: Partial<EditorState>) => setSt((s) => {
    if ("chart" in p && p.chart && p.chart !== s.chart) {
      past.current.push(s.chart);
      if (past.current.length > 80) past.current.shift();
      future.current = [];
      forceTick((x) => x + 1);
    }
    return { ...s, ...p };
  }), []);
  const undoChart = React.useCallback(() => {
    const prev = past.current.pop();
    if (!prev) return;
    setSt((s) => { future.current.push(s.chart); forceTick((x) => x + 1); return { ...s, chart: prev }; });
  }, []);
  const redoChart = React.useCallback(() => {
    const nxt = future.current.pop();
    if (!nxt) return;
    setSt((s) => { past.current.push(s.chart); forceTick((x) => x + 1); return { ...s, chart: nxt }; });
  }, []);
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const k = e.key.toLowerCase();
      if (k === "z" && !e.shiftKey) { e.preventDefault(); undoChart(); }
      else if ((k === "z" && e.shiftKey) || k === "y") { e.preventDefault(); redoChart(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undoChart, redoChart]);
  const [manageOpen, setManageOpen] = React.useState(false);
  React.useEffect(() => {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(st)); } catch { /* ignore */ }
  }, [st]);

  const addInventario = useStore((s) => s.add);
  const projetos = useStore((s) => s.projetos);
  const materiais = useStore((s) => s.materiais);

  const texto = React.useDeferredValue(React.useMemo(
    () => chartToText(st.chart, st.terminologia), [st.chart, st.terminologia],
  ));
  const contagens = React.useMemo(() => malhasPorCarreira(st.chart), [st.chart]);
  const totalMalhas = contagens[0] ?? 0;
  const chkMult = verificarMultiplo(totalMalhas, st.multiplo);
  const floats = React.useMemo(() => detectarFloats(st.chart, st.maxFloat), [st.chart, st.maxFloat]);
  const consumo = React.useMemo(() => consumoPorCor(st.chart, st.gauge), [st.chart, st.gauge]);
  const paleta = PALETAS[st.paletaId];
  const agulha = agulhaConverter(st.agulhaMm);
  const carreirasBotoes = espacamentoBotoes(st.carreirasTotais, st.botoes);

  const paintCell = (r: number, c: number) => {
    const chart = st.chart;
    const newGrid = chart.grid.map((row, ri) => row.map((cell, ci) => {
      if (ri !== r || ci !== c) return cell;
      return { pontoId: st.activePonto, cor: st.activeCor } as Cell;
    }));
    patch({ chart: { ...chart, grid: newGrid } });
  };

  const resizeChart = (cols: number, rows: number) => {
    const c = Math.max(4, Math.min(80, cols));
    const r = Math.max(4, Math.min(80, rows));
    const grid: Cell[][] = Array.from({ length: r }, (_, ri) =>
      Array.from({ length: c }, (_, ci) => st.chart.grid[ri]?.[ci] ?? { pontoId: "meia" }),
    );
    patch({ chart: { ...st.chart, cols: c, rows: r, grid } });
  };

  const addCustomSymbol = () => {
    const nome = prompt("Nome do novo símbolo (ex: meu-cabo)");
    if (!nome) return;
    const simbolo = prompt("Símbolo (1-2 caracteres, ex: ✿)") ?? "?";
    patch({ customSymbols: [...st.customSymbols, { id: `custom-${Date.now()}`, simbolo, nome }] });
    toast.success(`Símbolo "${nome}" adicionado à biblioteca.`);
  };

  const exportSvg = () => {
    const svg = chartToSvg(st.chart, { darkMode: st.darkMode });
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "grafico-tricot.svg"; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    toast.success("SVG exportado.");
  };

  const exportRavelry = () => {
    const payload = {
      format: "cbm-knit-chart",
      version: 1,
      terminologia: st.terminologia,
      gauge: st.gauge,
      chart: st.chart,
      texto,
      construcao: st.circular ? "circular" : "reta",
      agulha,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "receita-ravelry.json"; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    toast.success("JSON pronto para Ravelry exportado.");
  };

  const criarProjetoStock = () => {
    // Estimativa simples: soma malhas totais e cria uma entrada no inventário.
    const totalG = Object.values(consumo).reduce((s, v) => s + v.gramas, 0);
    if (totalG <= 0) { toast.error("Grelha vazia — sem consumo estimado."); return; }
    addInventario("materiais", {
      nome: `Fio estimado (gráfico ${st.chart.cols}×${st.chart.rows})`,
      unidade: "g",
      stock: Math.ceil(totalG),
      precoCompra: 0,
      categoria: "fios",
    });
    toast.success(`Estimado ${totalG.toFixed(1)}g de fio — adicionado ao inventário.`);
  };

  // ================= UI =================
  return (
    <div className="space-y-4" data-testid="knit-editor">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" onClick={undoChart} disabled={past.current.length === 0} title="Desfazer (Ctrl+Z)" data-testid="knit-undo">
          <Undo2 className="mr-1 h-4 w-4" />Desfazer
        </Button>
        <Button size="sm" variant="outline" onClick={redoChart} disabled={future.current.length === 0} title="Refazer (Ctrl+Y)" data-testid="knit-redo">
          <Redo2 className="mr-1 h-4 w-4" />Refazer
        </Button>
        <span className="text-xs text-muted-foreground">
          Histórico: {past.current.length} / {past.current.length + future.current.length + 1}
        </span>
      </div>
      <Tabs defaultValue="chart">
        <TabsList className="flex h-auto w-full flex-wrap">
          <TabsTrigger value="chart"><Grid3x3 className="mr-2 h-4 w-4" />1. Gráfico</TabsTrigger>
          <TabsTrigger value="mate"><Ruler className="mr-2 h-4 w-4" />2. Matemática</TabsTrigger>
          <TabsTrigger value="colorwork"><Palette className="mr-2 h-4 w-4" />3. Colorwork</TabsTrigger>
          <TabsTrigger value="construcao"><Shirt className="mr-2 h-4 w-4" />4. Construção</TabsTrigger>
          <TabsTrigger value="escrita"><BookOpen className="mr-2 h-4 w-4" />5. Escrita</TabsTrigger>
          <TabsTrigger value="tester"><Timer className="mr-2 h-4 w-4" />6. Testadores</TabsTrigger>
          <TabsTrigger value="custo"><Package className="mr-2 h-4 w-4" />7. Custo & Export</TabsTrigger>
        </TabsList>

        {/* ================= 1. GRÁFICO ================= */}
        <TabsContent value="chart" className="mt-4 space-y-4">
          <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
            <Card>
              <CardHeader><CardTitle className="text-base">Símbolos</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-4 gap-2">
                  {PONTOS_TRICOT.map((p) => (
                    <button key={p.id} onClick={() => patch({ activePonto: p.id })}
                      className={`h-10 rounded border text-lg font-mono transition
                        ${st.activePonto === p.id ? "border-primary bg-primary/10" : "border-border hover:bg-muted"}`}
                      title={p.nome[st.terminologia]}>
                      {p.simbolo}
                    </button>
                  ))}
                  {st.customSymbols.map((s) => (
                    <button key={s.id} onClick={() => patch({ activePonto: s.id })}
                      className={`h-10 rounded border text-lg font-mono ${st.activePonto === s.id ? "border-primary bg-primary/10" : "border-border hover:bg-muted"}`}
                      title={s.nome}>{s.simbolo}</button>
                  ))}
                </div>
                <Button size="sm" variant="outline" className="w-full" onClick={addCustomSymbol}>
                  + Símbolo personalizado
                </Button>
                {st.customSymbols.length > 0 && (
                  <Button size="sm" variant="ghost" className="w-full" onClick={() => setManageOpen(true)} data-testid="knit-manage-symbols">
                    Gerir símbolos personalizados ({st.customSymbols.length})
                  </Button>
                )}
                <div className="pt-2 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Cor activa</span>
                    <Input type="color" className="h-8 w-16 p-1"
                      value={st.activeCor ?? "#ffffff"}
                      onChange={(e) => patch({ activeCor: e.target.value })} />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Ocultar carreiras WS</span>
                    <Switch checked={!!st.chart.esconderWS}
                      onCheckedChange={(v) => patch({ chart: { ...st.chart, esconderWS: v } })} />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Dark mode</span>
                    <Switch checked={st.darkMode} onCheckedChange={(v) => patch({ darkMode: v })} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-base">Grelha ({st.chart.cols}×{st.chart.rows})</CardTitle>
                <div className="flex gap-2">
                  <Input type="number" className="h-8 w-20" value={st.chart.cols}
                    onChange={(e) => resizeChart(Number(e.target.value), st.chart.rows)} />
                  <Input type="number" className="h-8 w-20" value={st.chart.rows}
                    onChange={(e) => resizeChart(st.chart.cols, Number(e.target.value))} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-auto max-h-[520px] border rounded p-2"
                  style={{ background: st.darkMode ? "#0f172a" : "#fafafa" }}>
                  <div className="inline-grid gap-0"
                    style={{ gridTemplateColumns: `repeat(${st.chart.cols}, 26px)` }}>
                    {Array.from({ length: st.chart.rows }).map((_, rIdx) => {
                      const r = st.chart.rows - 1 - rIdx;
                      return st.chart.grid[r].map((cell, c) => {
                        const p = findPonto(cell.pontoId);
                        const isWSHidden = st.chart.esconderWS && r % 2 === 1;
                        return (
                          <button
                            key={`${r}-${c}`}
                            onClick={() => paintCell(r, c)}
                            className="h-[26px] w-[26px] border border-slate-300 dark:border-slate-600 flex items-center justify-center text-sm font-mono"
                            style={{
                              background: cell.cor ?? (isWSHidden ? (st.darkMode ? "#1e293b" : "#f1f5f9") : (st.darkMode ? "#0f172a" : "#ffffff")),
                              color: st.darkMode ? "#f8fafc" : "#0f172a",
                            }}
                            title={`C${r + 1}, malha ${c + 1}`}
                          >
                            {isWSHidden ? "" : (p?.simbolo ?? "?")}
                          </button>
                        );
                      });
                    })}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Clica para pintar com o símbolo/cor activos. C1 é a carreira do fundo (direito).
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Tradução automática (gráfico → texto)</CardTitle></CardHeader>
            <CardContent>
              <Textarea readOnly value={texto.join("\n")} className="min-h-[200px] font-mono text-sm" />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ================= 2. MATEMÁTICA ================= */}
        <TabsContent value="mate" className="mt-4 space-y-4">
          <GradingPanel
            chart={st.chart}
            gauge={st.gauge}
            peitoBaseCm={st.peitoCm}
            multiplo={st.multiplo}
            bordas={st.bordas}
            carreirasTotais={st.carreirasTotais}
            botoes={st.botoes}
            margemBotoesInferior={st.margemBotoesInferior}
            margemBotoesSuperior={st.margemBotoesSuperior}
            cavaCm={st.cavaCm}
            decoteTipo={st.decoteTipo}
            decoteLarguraCm={st.decoteLarguraCm}
            decoteProfundidadeCm={st.decoteProfundidadeCm}
            onChange={(partial) => patch(partial as Partial<EditorState>)}
          />
        </TabsContent>

        {/* ================= 3. COLORWORK ================= */}
        <TabsContent value="colorwork" className="mt-4 space-y-4">
          <ColorworkPanel
            chart={st.chart}
            gauge={st.gauge}
            paletaId={st.paletaId}
            activeCor={st.activeCor}
            maxFloat={st.maxFloat}
            gramasPor100m={st.gramasPor100m}
            metrosPorNovelo={st.metrosPorNovelo}
            floatMultiplier={st.floatMultiplier}
            onChange={(partial) => patch(partial as Partial<EditorState>)}
            onChartChange={(chart) => patch({ chart })}
          />
        </TabsContent>

        {/* ================= 4. CONSTRUÇÃO ================= */}
        <TabsContent value="construcao" className="mt-4 space-y-4">
          <ConstructionPanel
            gauge={st.gauge}
            peitoCm={st.peitoCm}
            peCm={st.peCm}
            circular={st.circular}
            marcadores={st.marcadores}
            onChange={(partial) => patch(partial as Partial<EditorState>)}
          />
        </TabsContent>

        {/* ================= 5. ESCRITA ================= */}
        <TabsContent value="escrita" className="mt-4 space-y-4">
          <WritingPanel
            terminologia={st.terminologia}
            onChange={(p) => patch(p as Partial<EditorState>)}
          />
          <Card>
            <CardHeader><CardTitle className="text-base">Conversor de expressões (frase completa)</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <ExprConverter term={st.terminologia} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ================= 6. TESTADORES ================= */}
        <TabsContent value="tester" className="mt-4 space-y-4">
          <TesterPanel
            token={`chart-${st.chart.cols}x${st.chart.rows}`}
            linhas={texto}
            packagePayload={{
              titulo: `Gráfico ${st.chart.cols}×${st.chart.rows}`,
              linhas: texto,
              gauge: st.gauge,
              terminologia: st.terminologia,
            }}
          />
        </TabsContent>

        {/* ================= 7. CUSTO & EXPORT ================= */}
        <TabsContent value="custo" className="mt-4 space-y-4">
          <CustoExportPanel
            chart={st.chart}
            gauge={st.gauge}
            gramasPor100m={st.gramasPor100m}
            floatMultiplier={st.floatMultiplier}
            darkMode={st.darkMode}
            textoReceita={texto}
          />

          <Card>
            <CardHeader><CardTitle className="text-base">Exportações rápidas do gráfico</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button onClick={exportSvg}>SVG vetorial</Button>
              <Button variant="outline" onClick={exportRavelry}>JSON Ravelry</Button>
              <Button variant="outline" onClick={criarProjetoStock}>+ fio estimado ao inventário</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Simulador de textura</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Pré-visualização com filtro "mohair" (halo fofinho) aplicado ao SVG do gráfico.
              </p>
              <div className="border rounded p-2 max-h-[400px] overflow-auto"
                style={{ filter: "blur(0.6px) contrast(0.95) saturate(1.05)" }}
                dangerouslySetInnerHTML={{ __html: chartToSvg(st.chart, { darkMode: st.darkMode }) }} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={manageOpen} onOpenChange={setManageOpen}>
        <DialogContent className="max-w-md" data-testid="knit-symbols-manager">
          <DialogHeader><DialogTitle>Símbolos personalizados</DialogTitle></DialogHeader>
          {st.customSymbols.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ainda não criaste nenhum símbolo personalizado.</p>
          ) : (
            <ul className="space-y-2 max-h-[50vh] overflow-auto">
              {st.customSymbols.map((s) => (
                <li key={s.id} className="flex items-center gap-2 rounded border p-2">
                  <span className="grid h-9 w-9 place-items-center rounded border text-lg font-mono">{s.simbolo}</span>
                  <Input
                    value={s.nome}
                    onChange={(e) => patch({ customSymbols: st.customSymbols.map((x) => x.id === s.id ? { ...x, nome: e.target.value } : x) })}
                  />
                  <Input
                    className="w-16 text-center font-mono"
                    value={s.simbolo}
                    maxLength={2}
                    onChange={(e) => patch({ customSymbols: st.customSymbols.map((x) => x.id === s.id ? { ...x, simbolo: e.target.value || "?" } : x) })}
                  />
                  <Button size="icon" variant="ghost" title="Remover" onClick={() => {
                    patch({
                      customSymbols: st.customSymbols.filter((x) => x.id !== s.id),
                      activePonto: st.activePonto === s.id ? "meia" : st.activePonto,
                    });
                    toast.success(`Símbolo "${s.nome}" removido.`);
                  }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setManageOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ExprConverter({ term }: { term: Terminologia }) {
  const [txt, setTxt] = React.useState("Montar 100 malhas. Rematar as últimas 5.");
  const [to, setTo] = React.useState<Terminologia>("us");
  return (
    <>
      <Textarea value={txt} onChange={(e) => setTxt(e.target.value)} className="min-h-[80px]" />
      <div className="flex gap-2 items-center">
        <Label>Para:</Label>
        <Select value={to} onValueChange={(v) => setTo(v as Terminologia)}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="pt">Português</SelectItem>
            <SelectItem value="us">US</SelectItem>
            <SelectItem value="uk">UK</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="rounded border bg-muted/40 p-3 text-sm">
        {converterExpressoes(txt, term, to)}
      </div>
    </>
  );
}
