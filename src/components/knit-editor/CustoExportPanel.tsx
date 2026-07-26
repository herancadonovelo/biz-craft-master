// Fase 7 — Painel Custo, Stock & Exportação avançada.
// Consome o gráfico e a tensão actuais para produzir um mapa cor→material,
// alertas de stock, breakdown financeiro completo (fio, mão-de-obra, extras,
// overhead, margem, IVA) e várias exportações (CSV BOM, JSON, PNG, PDF).

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { AlertTriangle, Download, FileText, Image as ImageIcon, Package, Plus } from "lucide-react";
import { useStore, formatCurrency } from "@/lib/store";
import type { Chart, Gauge } from "@/lib/knit/engine";
import { chartToSvg } from "@/lib/knit/engine";
import {
  calcularLinhasCusto, calcularBreakdown, linhasParaCsvBom,
  svgToPngDataUrl, baixarBlob, baixarDataUrl,
  type LinhaCusto, type MaterialLite,
} from "@/lib/knit/custo";

const STORAGE_KEY = "cbm:knit-editor:custo:v1";

interface PanelState {
  mapCorMaterial: Record<string, string>;
  bufferPct: number;
  horas: number;
  precoHora: number;
  precoFioGramaFallback: number;
  overheadPct: number;
  margemPct: number;
  ivaPct: number;
  extras: { nome: string; valor: number }[];
  nomeProjeto: string;
}

function loadPanel(): PanelState {
  if (typeof window === "undefined") return defaultPanel();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultPanel(), ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return defaultPanel();
}
function defaultPanel(): PanelState {
  return {
    mapCorMaterial: {},
    bufferPct: 15,
    horas: 20,
    precoHora: 8,
    precoFioGramaFallback: 0.15,
    overheadPct: 10,
    margemPct: 40,
    ivaPct: 23,
    extras: [],
    nomeProjeto: "Peça de tricô",
  };
}

export interface CustoExportPanelProps {
  chart: Chart;
  gauge: Gauge;
  gramasPor100m: number;
  floatMultiplier: number;
  darkMode?: boolean;
  textoReceita: string[];
}

export function CustoExportPanel({
  chart, gauge, gramasPor100m, floatMultiplier, darkMode, textoReceita,
}: CustoExportPanelProps) {
  const [p, setP] = React.useState<PanelState>(loadPanel);
  const patch = React.useCallback((n: Partial<PanelState>) => setP((s) => ({ ...s, ...n })), []);
  React.useEffect(() => {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch { /* ignore */ }
  }, [p]);

  const materiais = useStore((s) => s.materiais);
  const addStore = useStore((s) => s.add);

  const fios = React.useMemo<MaterialLite[]>(
    () => materiais.filter((m) => !m.categoria || m.categoria === "fios" || m.categoria === "meadas"),
    [materiais],
  );

  const linhas = React.useMemo<LinhaCusto[]>(
    () => calcularLinhasCusto({
      chart, gauge, gramasPor100m, floatMultiplier,
      bufferPct: p.bufferPct,
      mapCorMaterial: p.mapCorMaterial,
      materiais: fios,
    }),
    [chart, gauge, gramasPor100m, floatMultiplier, p.bufferPct, p.mapCorMaterial, fios],
  );

  const breakdown = React.useMemo(
    () => calcularBreakdown({
      linhas,
      horas: p.horas,
      precoHora: p.precoHora,
      precoFioGramaFallback: p.precoFioGramaFallback,
      extras: p.extras,
      overheadPct: p.overheadPct,
      margemPct: p.margemPct,
      ivaPct: p.ivaPct,
    }),
    [linhas, p.horas, p.precoHora, p.precoFioGramaFallback, p.extras, p.overheadPct, p.margemPct, p.ivaPct],
  );

  const faltas = linhas.filter((l) => l.material && l.falta > 0);
  const semMap = linhas.filter((l) => !l.material);

  // ---------- Acções ----------
  const exportarCsv = () => {
    if (linhas.length === 0) return toast.error("Grelha vazia — sem BOM para exportar.");
    baixarBlob(`bom-tricot-${chart.cols}x${chart.rows}.csv`, new Blob([linhasParaCsvBom(linhas)], { type: "text/csv;charset=utf-8" }));
    toast.success("BOM CSV exportado.");
  };
  const exportarJson = () => {
    const payload = {
      formato: "cbm-knit-custo", versao: 1,
      chart: { cols: chart.cols, rows: chart.rows }, gauge,
      parametros: p, linhas, breakdown,
    };
    baixarBlob(`custo-tricot-${chart.cols}x${chart.rows}.json`, new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
    toast.success("JSON de custo exportado.");
  };
  const exportarPng = async () => {
    try {
      const svg = chartToSvg(chart, { darkMode });
      const dataUrl = await svgToPngDataUrl(svg, 3);
      baixarDataUrl(`grafico-tricot-${chart.cols}x${chart.rows}.png`, dataUrl);
      toast.success("PNG de alta resolução exportado.");
    } catch (e) {
      toast.error(`Falha ao gerar PNG: ${e instanceof Error ? e.message : String(e)}`);
    }
  };
  const exportarPdf = () => {
    const w = window.open("", "_blank");
    if (!w) return toast.error("Bloqueio de pop-ups impede a impressão.");
    const linhasHtml = linhas.map((l) => `<tr>
      <td><span style="display:inline-block;width:14px;height:14px;background:${l.cor};border:1px solid #999;vertical-align:middle;margin-right:6px"></span>${l.material?.nome ?? "(sem material)"}</td>
      <td style="text-align:right">${l.gramasComBuffer.toFixed(1)} g</td>
      <td style="text-align:right">${l.novelos}</td>
      <td style="text-align:right">${formatCurrency(l.custo)}</td>
    </tr>`).join("");
    w.document.write(`<html><head><title>${p.nomeProjeto}</title>
      <style>body{font-family:serif;padding:2cm;line-height:1.5}
      h1{margin-top:0}table{width:100%;border-collapse:collapse;margin:1em 0}
      th,td{border:1px solid #ccc;padding:6px}pre{white-space:pre-wrap;font-family:monospace;font-size:11pt}
      .tot{font-weight:bold;background:#f4f4f4}</style></head><body>
      <h1>${p.nomeProjeto}</h1>
      <p><b>Tensão:</b> ${gauge.pontos} pts × ${gauge.carreiras} car / ${gauge.cm} cm · gráfico ${chart.cols}×${chart.rows}</p>
      <h2>Lista de fios (BOM)</h2>
      <table><thead><tr><th>Cor / material</th><th>Estimado</th><th>Novelos</th><th>Custo</th></tr></thead>
      <tbody>${linhasHtml}</tbody></table>
      <h2>Preçário</h2>
      <table>
        <tr><td>Fio mapeado</td><td style="text-align:right">${formatCurrency(breakdown.custoFioMapeado)}</td></tr>
        <tr><td>Fio estimado</td><td style="text-align:right">${formatCurrency(breakdown.custoFioEstimado)}</td></tr>
        <tr><td>Mão de obra (${p.horas}h × ${formatCurrency(p.precoHora)})</td><td style="text-align:right">${formatCurrency(breakdown.custoMaoObra)}</td></tr>
        <tr><td>Extras</td><td style="text-align:right">${formatCurrency(breakdown.custoExtras)}</td></tr>
        <tr><td>Overhead ${p.overheadPct}%</td><td style="text-align:right">${formatCurrency(breakdown.overhead)}</td></tr>
        <tr class="tot"><td>Custo total</td><td style="text-align:right">${formatCurrency(breakdown.custoTotal)}</td></tr>
        <tr><td>Margem ${p.margemPct}%</td><td style="text-align:right">${formatCurrency(breakdown.margem)}</td></tr>
        <tr><td>Preço sem IVA</td><td style="text-align:right">${formatCurrency(breakdown.precoSemIva)}</td></tr>
        <tr><td>IVA ${p.ivaPct}%</td><td style="text-align:right">${formatCurrency(breakdown.iva)}</td></tr>
        <tr class="tot"><td>Preço com IVA</td><td style="text-align:right">${formatCurrency(breakdown.precoComIva)}</td></tr>
      </table>
      <h2>Instruções</h2><pre>${textoReceita.join("\n")}</pre>
      ${chartToSvg(chart)}
      </body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 300);
  };

  const criarProjetoBom = () => {
    const materiaisUsados = linhas
      .filter((l) => l.material)
      .map((l) => ({ materialId: l.material!.id, quantidade: l.novelos }));
    if (materiaisUsados.length === 0) return toast.error("Mapeia pelo menos uma cor a um material antes de criar o projeto.");
    addStore("projetos", {
      nome: p.nomeProjeto,
      materiais: materiaisUsados,
      horasTrabalhadas: p.horas,
      precoHora: p.precoHora,
      margemProfit: p.margemPct / 100,
      estado: "rascunho",
      criadoEm: new Date().toISOString(),
    });
    toast.success(`Projeto "${p.nomeProjeto}" criado com BOM (${materiaisUsados.length} materiais).`);
  };

  const registarDespesaFio = () => {
    const total = breakdown.custoFioMapeado + breakdown.custoFioEstimado;
    if (total <= 0) return toast.error("Sem custo de fio para registar.");
    addStore("despesas", { nome: `Fios — ${p.nomeProjeto}`, valor: total, periodicidade: "mensal" });
    toast.success(`Despesa de ${formatCurrency(total)} registada.`);
  };

  return (
    <div className="space-y-4" data-testid="knit-custo-panel">
      <Card>
        <CardHeader><CardTitle className="text-base">Parâmetros globais</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div><Label>Nome do projeto</Label><Input value={p.nomeProjeto} onChange={(e) => patch({ nomeProjeto: e.target.value })} /></div>
          <div><Label>Buffer segurança %</Label><Input type="number" value={p.bufferPct} onChange={(e) => patch({ bufferPct: Number(e.target.value) })} /></div>
          <div><Label>Horas de trabalho</Label><Input type="number" value={p.horas} onChange={(e) => patch({ horas: Number(e.target.value) })} /></div>
          <div><Label>€/hora</Label><Input type="number" value={p.precoHora} onChange={(e) => patch({ precoHora: Number(e.target.value) })} /></div>
          <div><Label>€/g (fallback)</Label><Input type="number" step="0.01" value={p.precoFioGramaFallback} onChange={(e) => patch({ precoFioGramaFallback: Number(e.target.value) })} /></div>
          <div><Label>Overhead %</Label><Input type="number" value={p.overheadPct} onChange={(e) => patch({ overheadPct: Number(e.target.value) })} /></div>
          <div><Label>Margem %</Label><Input type="number" value={p.margemPct} onChange={(e) => patch({ margemPct: Number(e.target.value) })} /></div>
          <div><Label>IVA %</Label><Input type="number" value={p.ivaPct} onChange={(e) => patch({ ivaPct: Number(e.target.value) })} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Package className="h-4 w-4" />BOM por cor</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {linhas.length === 0 ? (
            <p className="text-sm text-muted-foreground">A grelha está vazia — pinta cores no separador 1 para calcular consumo.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Cor</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead className="text-right">Estim. (g)</TableHead>
                  <TableHead className="text-right">Com buffer</TableHead>
                  <TableHead className="text-right">Novelos</TableHead>
                  <TableHead className="text-right">Custo</TableHead>
                  <TableHead>Stock</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {linhas.map((l) => (
                    <TableRow key={l.cor}>
                      <TableCell>
                        <span className="inline-block h-4 w-4 rounded-sm border align-middle mr-2" style={{ background: l.cor === "default" ? "transparent" : l.cor }} />
                        <span className="font-mono text-xs">{l.cor}</span>
                      </TableCell>
                      <TableCell>
                        <Select value={p.mapCorMaterial[l.cor] ?? ""} onValueChange={(v) => patch({ mapCorMaterial: { ...p.mapCorMaterial, [l.cor]: v } })}>
                          <SelectTrigger className="h-8 w-[220px]"><SelectValue placeholder="Escolher material…" /></SelectTrigger>
                          <SelectContent>
                            {fios.length === 0 && <SelectItem value="__none" disabled>Sem fios no inventário</SelectItem>}
                            {fios.map((m) => (
                              <SelectItem key={m.id} value={m.id}>
                                {m.nome}{m.marca ? ` · ${m.marca}` : ""}{m.codigoCor ? ` #${m.codigoCor}` : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">{l.gramasBase.toFixed(1)}</TableCell>
                      <TableCell className="text-right">{l.gramasComBuffer.toFixed(1)}</TableCell>
                      <TableCell className="text-right">{l.novelos}</TableCell>
                      <TableCell className="text-right">{l.material ? formatCurrency(l.custo) : <span className="text-muted-foreground">—</span>}</TableCell>
                      <TableCell>
                        {l.material ? (
                          l.falta > 0
                            ? <Badge variant="destructive">Falta {l.falta}</Badge>
                            : <Badge variant="secondary">{l.stockNovelos} em stock</Badge>
                        ) : <span className="text-xs text-muted-foreground">sem mapa</span>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {(faltas.length > 0 || semMap.length > 0) && (
            <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
              <div className="flex items-center gap-2 font-medium"><AlertTriangle className="h-4 w-4" />Alertas</div>
              {faltas.length > 0 && <div>Faltam novelos para {faltas.length} cor(es).</div>}
              {semMap.length > 0 && <div>{semMap.length} cor(es) sem material mapeado — a usar fallback €/g.</div>}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Extras e taxas fixas</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {p.extras.map((e, i) => (
            <div key={i} className="flex gap-2">
              <Input value={e.nome} placeholder="Descrição (agulhas, embalagem…)" onChange={(ev) => patch({ extras: p.extras.map((x, j) => j === i ? { ...x, nome: ev.target.value } : x) })} />
              <Input type="number" step="0.01" className="w-32" value={e.valor} onChange={(ev) => patch({ extras: p.extras.map((x, j) => j === i ? { ...x, valor: Number(ev.target.value) } : x) })} />
              <Button size="sm" variant="ghost" onClick={() => patch({ extras: p.extras.filter((_, j) => j !== i) })}>Remover</Button>
            </div>
          ))}
          <Button size="sm" variant="outline" onClick={() => patch({ extras: [...p.extras, { nome: "", valor: 0 }] })}>
            <Plus className="mr-1 h-4 w-4" />Adicionar extra
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Preçário detalhado</CardTitle></CardHeader>
        <CardContent>
          <ul className="grid gap-1 text-sm md:grid-cols-2">
            <li>Fio mapeado <span className="float-right">{formatCurrency(breakdown.custoFioMapeado)}</span></li>
            <li>Fio estimado (fallback) <span className="float-right">{formatCurrency(breakdown.custoFioEstimado)}</span></li>
            <li>Mão de obra <span className="float-right">{formatCurrency(breakdown.custoMaoObra)}</span></li>
            <li>Extras <span className="float-right">{formatCurrency(breakdown.custoExtras)}</span></li>
            <li>Overhead ({p.overheadPct}%) <span className="float-right">{formatCurrency(breakdown.overhead)}</span></li>
            <li className="md:col-span-2 border-t pt-1 font-semibold">Custo total <span className="float-right">{formatCurrency(breakdown.custoTotal)}</span></li>
            <li>Margem ({p.margemPct}%) <span className="float-right">{formatCurrency(breakdown.margem)}</span></li>
            <li>Preço sem IVA <span className="float-right">{formatCurrency(breakdown.precoSemIva)}</span></li>
            <li>IVA ({p.ivaPct}%) <span className="float-right">{formatCurrency(breakdown.iva)}</span></li>
            <li className="md:col-span-2 border-t pt-1 text-primary font-semibold">Preço com IVA <span className="float-right">{formatCurrency(breakdown.precoComIva)}</span></li>
            <li className="md:col-span-2 text-xs text-muted-foreground">Consumo total estimado: {breakdown.gramasTotais} g</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Exportar & integrar</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button onClick={exportarCsv}><Download className="mr-1 h-4 w-4" />CSV BOM</Button>
          <Button variant="outline" onClick={exportarJson}><Download className="mr-1 h-4 w-4" />JSON completo</Button>
          <Button variant="outline" onClick={exportarPng}><ImageIcon className="mr-1 h-4 w-4" />PNG (alta res.)</Button>
          <Button variant="outline" onClick={exportarPdf}><FileText className="mr-1 h-4 w-4" />PDF (imprimir)</Button>
          <Button variant="secondary" onClick={criarProjetoBom}>Criar projeto c/ BOM</Button>
          <Button variant="secondary" onClick={registarDespesaFio}>Registar despesa de fio</Button>
        </CardContent>
      </Card>
    </div>
  );
}