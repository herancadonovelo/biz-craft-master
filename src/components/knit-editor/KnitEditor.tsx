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
import { toast } from "sonner";
import { Grid3x3, Palette, Ruler, Shirt, BookOpen, Timer, Package } from "lucide-react";
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
import { useStore, formatCurrency } from "@/lib/store";

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
  };
}

export function KnitEditor() {
  const [st, setSt] = React.useState<EditorState>(loadState);
  const patch = React.useCallback((p: Partial<EditorState>) => setSt((s) => ({ ...s, ...p })), []);
  React.useEffect(() => {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(st)); } catch { /* ignore */ }
  }, [st]);

  const addInventario = useStore((s) => s.add);
  const projetos = useStore((s) => s.projetos);
  const inventario = useStore((s) => s.inventario);

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
    addInventario("inventario", {
      id: `knit-${Date.now()}`,
      nome: `Fio estimado (gráfico ${st.chart.cols}×${st.chart.rows})`,
      quantidade: Math.ceil(totalG),
      unidade: "g",
      preco: 0,
    } as never);
    toast.success(`Estimado ${totalG.toFixed(1)}g de fio — adicionado ao inventário.`);
  };

  // ================= UI =================
  return (
    <div className="space-y-4" data-testid="knit-editor">
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
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">Tensão / Amostra</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div><Label>Pontos</Label><Input type="number" value={st.gauge.pontos}
                    onChange={(e) => patch({ gauge: { ...st.gauge, pontos: Number(e.target.value) } })} /></div>
                  <div><Label>Carreiras</Label><Input type="number" value={st.gauge.carreiras}
                    onChange={(e) => patch({ gauge: { ...st.gauge, carreiras: Number(e.target.value) } })} /></div>
                  <div><Label>em cm</Label><Input type="number" value={st.gauge.cm}
                    onChange={(e) => patch({ gauge: { ...st.gauge, cm: Number(e.target.value) } })} /></div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Base para escalonamento automático dos tamanhos.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Verificador de múltiplos</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Label>Múltiplo obrigatório (padrão)</Label>
                <Input type="number" value={st.multiplo}
                  onChange={(e) => patch({ multiplo: Number(e.target.value) })} />
                <p className="text-sm">Malhas na carreira 1: <b>{totalMalhas}</b></p>
                {chkMult.ok
                  ? <p className="text-sm text-green-600">✓ Divisível por {st.multiplo}.</p>
                  : <p className="text-sm text-red-600">
                      ✗ Não divide por {st.multiplo}. Sugestão: {chkMult.sugestao?.[0]} ou {chkMult.sugestao?.[1]}.
                    </p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Escalonamento automático</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Label>Peito no tamanho M (cm)</Label>
                <Input type="number" value={st.peitoCm}
                  onChange={(e) => patch({ peitoCm: Number(e.target.value) })} />
                <table className="w-full text-sm">
                  <thead><tr><th className="text-left">Tamanho</th><th>Δ peito</th><th>Malhas</th></tr></thead>
                  <tbody>
                    {[
                      { t: "XS", d: -10 }, { t: "S", d: -5 }, { t: "M", d: 0 },
                      { t: "L", d: +5 }, { t: "XL", d: +10 }, { t: "XXL", d: +15 },
                    ].map((s) => (
                      <tr key={s.t}>
                        <td>{s.t}</td>
                        <td className="text-center">{s.d > 0 ? `+${s.d}` : s.d} cm</td>
                        <td className="text-right font-mono">
                          {malhasParaCm(st.gauge, st.peitoCm + s.d)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Casas de botão</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Carreiras totais</Label>
                    <Input type="number" value={st.carreirasTotais}
                      onChange={(e) => patch({ carreirasTotais: Number(e.target.value) })} />
                  </div>
                  <div><Label>Nº de botões</Label>
                    <Input type="number" value={st.botoes}
                      onChange={(e) => patch({ botoes: Number(e.target.value) })} />
                  </div>
                </div>
                <p className="text-sm">Fazer casa nas carreiras: <b>{carreirasBotoes.join(", ") || "—"}</b></p>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader><CardTitle className="text-base">Validador de simetria (carreira 1)</CardTitle></CardHeader>
              <CardContent>
                {(() => {
                  const v = validarSimetriaDiminuicoes(st.chart.grid[0]);
                  return v.ok
                    ? <p className="text-sm text-green-600">✓ Simetria de diminuições coerente.</p>
                    : <p className="text-sm text-red-600">⚠ {v.msg}</p>;
                })()}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ================= 3. COLORWORK ================= */}
        <TabsContent value="colorwork" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Paleta de fios</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Label>Marca</Label>
                  <Select value={st.paletaId} onValueChange={(v) => patch({ paletaId: v as PaletaId })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="drops">Drops</SelectItem>
                      <SelectItem value="rowan">Rowan</SelectItem>
                      <SelectItem value="malabrigo">Malabrigo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Máx. float (malhas)</Label>
                  <Input type="number" className="w-24" value={st.maxFloat}
                    onChange={(e) => patch({ maxFloat: Number(e.target.value) })} />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {paleta.map((c) => (
                  <button key={c.id} onClick={() => patch({ activeCor: c.hex })}
                    className={`flex items-center gap-2 rounded border px-3 py-1.5 text-sm
                      ${st.activeCor === c.hex ? "border-primary" : "border-border"}`}>
                    <span className="inline-block h-4 w-4 rounded" style={{ background: c.hex }} />
                    {c.nome}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">Consumo estimado</CardTitle></CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead><tr><th className="text-left">Cor</th><th>Malhas</th><th>Gramas</th></tr></thead>
                  <tbody>
                    {Object.entries(consumo).map(([cor, v]) => (
                      <tr key={cor}>
                        <td className="flex items-center gap-2">
                          <span className="inline-block h-4 w-4 rounded border"
                            style={{ background: cor === "default" ? "transparent" : cor }} />
                          {cor}
                        </td>
                        <td className="text-center">{v.malhas}</td>
                        <td className="text-right font-mono">{v.gramas}g</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Alertas de float</CardTitle></CardHeader>
              <CardContent>
                {floats.length === 0
                  ? <p className="text-sm text-green-600">✓ Todos os floats abaixo de {st.maxFloat} malhas.</p>
                  : <ul className="text-sm space-y-1 max-h-48 overflow-auto">
                      {floats.slice(0, 20).map((f, i) => (
                        <li key={i}>
                          ⚠ C{f.row + 1}, col {f.col + 1}: {f.length} malhas seguidas
                          <span className="inline-block h-3 w-3 ml-2 rounded border align-middle"
                            style={{ background: f.cor === "default" ? "transparent" : f.cor }} />
                        </li>
                      ))}
                    </ul>}
                <Button size="sm" variant="outline" className="mt-3"
                  onClick={() => {
                    const cores = Object.keys(consumo).filter((k) => k !== "default").slice(0, 2);
                    if (cores.length < 2) { toast.error("Precisas de 2 cores para inverter."); return; }
                    patch({ chart: inverterCores(st.chart, cores[0], cores[1]) });
                    toast.success("Cores invertidas.");
                  }}>
                  ↔ Inverter cores dominantes
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ================= 4. CONSTRUÇÃO ================= */}
        <TabsContent value="construcao" className="mt-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">Wizard Top-Down (Raglan)</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Label>Peito (cm)</Label>
                <Input type="number" value={st.peitoCm}
                  onChange={(e) => patch({ peitoCm: Number(e.target.value) })} />
                {(() => {
                  const r = gerarRaglanTopDown({ peitoCm: st.peitoCm, gauge: st.gauge });
                  return (
                    <ul className="text-sm space-y-1">
                      <li>Total peito: <b>{r.totalMalhas}</b> malhas</li>
                      <li>Início da gola: <b>{r.gola}</b> malhas</li>
                      <li>Cada manga: <b>{r.manga}</b> malhas</li>
                      <li>Cada meio-corpo: <b>{r.corpo}</b> malhas</li>
                      <li>Malhas de raglan (×4): <b>{r.raglan}</b></li>
                    </ul>
                  );
                })()}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Sock Wizard</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Label>Comprimento do pé (cm)</Label>
                <Input type="number" value={st.peCm}
                  onChange={(e) => patch({ peCm: Number(e.target.value) })} />
                {(() => {
                  const m = gerarMeia({ peCm: st.peCm, gauge: st.gauge });
                  return (
                    <ul className="text-sm space-y-1">
                      <li>Montar: <b>{m.montar}</b> malhas</li>
                      <li>Calcanhar sobre: <b>{m.calcanhar}</b> malhas</li>
                      <li>Ponte: <b>{m.ponte}</b> malhas</li>
                    </ul>
                  );
                })()}
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader><CardTitle className="text-base">Circular vs Retas & Marcadores</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-3">
                  <Switch checked={st.circular} onCheckedChange={(v) => patch({ circular: v })} />
                  <span className="text-sm">{st.circular ? "Circular (todas as carreiras direito → esquerda)" : "Retas (virar o trabalho a cada carreira)"}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Afecta a tradução automática do gráfico e a exportação Ravelry.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ================= 5. ESCRITA ================= */}
        <TabsContent value="escrita" className="mt-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">Terminologia & agulhas</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Label>Terminologia</Label>
                <Select value={st.terminologia} onValueChange={(v) => patch({ terminologia: v as Terminologia })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pt">Português</SelectItem>
                    <SelectItem value="us">US (knit/purl)</SelectItem>
                    <SelectItem value="uk">UK (cast off)</SelectItem>
                  </SelectContent>
                </Select>
                <div>
                  <Label>Agulha (mm)</Label>
                  <Input type="number" step="0.25" value={st.agulhaMm}
                    onChange={(e) => patch({ agulhaMm: Number(e.target.value) })} />
                  <p className="text-sm mt-2">
                    {agulha.mm}mm ≡ US <b>{agulha.us}</b> ≡ UK <b>{agulha.uk}</b>
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Conversor de expressões</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <ExprConverter term={st.terminologia} />
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader><CardTitle className="text-base">Legenda automática</CardTitle></CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead><tr><th className="text-left">Símbolo</th><th className="text-left">Abrev</th><th className="text-left">Nome</th></tr></thead>
                  <tbody>
                    {PONTOS_TRICOT.map((p) => (
                      <tr key={p.id}><td className="font-mono">{p.simbolo}</td>
                        <td>{p.abrev[st.terminologia]}</td>
                        <td>{p.nome[st.terminologia]}</td></tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ================= 6. TESTADORES ================= */}
        <TabsContent value="tester" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Contador de carreiras</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-4">
                <Button variant="outline" onClick={() => patch({ contador: { ...st.contador, atual: Math.max(1, st.contador.atual - 1) } })}>−</Button>
                <div className="text-4xl font-mono w-24 text-center">{st.contador.atual}</div>
                <Button onClick={() => patch({ contador: { ...st.contador, atual: st.contador.atual + 1 } })}>+</Button>
                <Button size="sm" variant="ghost" onClick={() => patch({ contador: { atual: 1, destaque: 1 } })}>reset</Button>
              </div>
              <div>
                <Label>Destacar carreira (highlighter)</Label>
                <Slider value={[st.contador.destaque]} min={1} max={st.chart.rows}
                  onValueChange={(v) => patch({ contador: { ...st.contador, destaque: v[0] } })} />
              </div>
              <div className="relative border rounded overflow-hidden max-h-64 overflow-y-auto">
                {texto.map((linha, i) => (
                  <div key={i}
                    className={`px-3 py-1 text-sm font-mono ${i + 1 === st.contador.destaque ? "bg-yellow-200/60 dark:bg-yellow-500/20" : ""} ${i + 1 < st.contador.atual ? "opacity-40 line-through" : ""}`}>
                    {linha}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Link para test knitters</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Partilha o JSON exportado abaixo com a tua equipa de testes — quando reenviarem,
                os consumos reais actualizam o cálculo de custo.
              </p>
              <Button variant="outline" onClick={exportRavelry}>Gerar pacote de teste (JSON)</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ================= 7. CUSTO & EXPORT ================= */}
        <TabsContent value="custo" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Preificador automático</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <PreificadorPanel consumoG={Object.values(consumo).reduce((s, v) => s + v.gramas, 0)} inventario={inventario} projetos={projetos} />
              <Button variant="outline" onClick={criarProjetoStock}>+ Adicionar fio estimado ao inventário</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Exportações</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button onClick={exportSvg}>SVG vetorial (zoom infinito)</Button>
              <Button variant="outline" onClick={exportRavelry}>JSON compatível Ravelry</Button>
              <Button variant="outline" onClick={() => {
                const w = window.open("", "_blank");
                if (!w) return;
                w.document.write(`<html><head><title>Receita Tricô</title>
                  <style>body{font-family:serif;font-size:14pt;padding:2cm;line-height:1.5}
                  pre{white-space:pre-wrap;font-family:monospace}</style></head><body>
                  <h1>Receita de Tricô</h1>
                  <p><b>Tensão:</b> ${st.gauge.pontos} pts × ${st.gauge.carreiras} car / ${st.gauge.cm} cm · agulha ${agulha.mm}mm (US ${agulha.us})</p>
                  <h2>Instruções</h2><pre>${texto.join("\n")}</pre>
                  ${chartToSvg(st.chart)}
                  </body></html>`);
                w.document.close();
                setTimeout(() => w.print(), 300);
              }}>Printer-friendly (P&B)</Button>
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

function PreificadorPanel({ consumoG, inventario, projetos }: {
  consumoG: number; inventario: unknown[]; projetos: unknown[];
}) {
  const [horas, setHoras] = React.useState(20);
  const [precoHora, setPrecoHora] = React.useState(8);
  const [precoFioGrama, setPrecoFioGrama] = React.useState(0.15);
  const [margem, setMargem] = React.useState(40);
  const custoFio = consumoG * precoFioGrama;
  const custoMao = horas * precoHora;
  const total = custoFio + custoMao;
  const venda = total * (1 + margem / 100);
  return (
    <>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <div><Label>Horas</Label><Input type="number" value={horas} onChange={(e) => setHoras(Number(e.target.value))} /></div>
        <div><Label>€/hora</Label><Input type="number" value={precoHora} onChange={(e) => setPrecoHora(Number(e.target.value))} /></div>
        <div><Label>€/g fio</Label><Input type="number" step="0.01" value={precoFioGrama} onChange={(e) => setPrecoFioGrama(Number(e.target.value))} /></div>
        <div><Label>Margem %</Label><Input type="number" value={margem} onChange={(e) => setMargem(Number(e.target.value))} /></div>
      </div>
      <ul className="text-sm">
        <li>Fio ({consumoG.toFixed(1)}g): {formatCurrency(custoFio)}</li>
        <li>Mão de obra: {formatCurrency(custoMao)}</li>
        <li><b>Custo total:</b> {formatCurrency(total)}</li>
        <li className="text-primary"><b>Preço de venda sugerido:</b> {formatCurrency(venda)}</li>
      </ul>
      <p className="text-xs text-muted-foreground">
        Inventário: {inventario.length} entradas · Projectos: {projetos.length}
      </p>
    </>
  );
}
