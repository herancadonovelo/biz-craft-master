// Painel completo da Fase 3 — Colorwork / Fair Isle.
// Consome `src/lib/knit/colorwork.ts` e as paletas de `engine.ts`.

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, ArrowLeftRight, Droplets, Wand2 } from "lucide-react";
import type { Chart, Gauge, PaletaId } from "@/lib/knit/engine";
import { PALETAS } from "@/lib/knit/engine";
import {
  consumoAvancado, estatisticasFloats, contrastRatio,
  trocarCores, aplicarCorFundo, pixelArtFromMatrix, coresDominantes,
} from "@/lib/knit/colorwork";

export interface ColorworkPanelProps {
  chart: Chart;
  gauge: Gauge;
  paletaId: PaletaId;
  activeCor?: string;
  maxFloat: number;
  gramasPor100m: number;
  metrosPorNovelo: number;
  floatMultiplier: number;
  onChange: (partial: Partial<ColorworkPanelProps>) => void;
  onChartChange: (chart: Chart) => void;
}

export function ColorworkPanel(p: ColorworkPanelProps) {
  const paleta = PALETAS[p.paletaId];
  const consumo = React.useMemo(
    () => consumoAvancado(p.chart, p.gauge, {
      gramasPor100m: p.gramasPor100m,
      metrosPorNovelo: p.metrosPorNovelo,
      floatMultiplier: p.floatMultiplier,
    }),
    [p.chart, p.gauge, p.gramasPor100m, p.metrosPorNovelo, p.floatMultiplier],
  );
  const floats = React.useMemo(() => estatisticasFloats(p.chart, p.maxFloat), [p.chart, p.maxFloat]);
  const dominantes = React.useMemo(() => coresDominantes(p.chart, 6), [p.chart]);

  const [swapA, setSwapA] = React.useState<string>("");
  const [swapB, setSwapB] = React.useState<string>("");
  React.useEffect(() => {
    if (!swapA && dominantes[0]) setSwapA(dominantes[0]);
    if (!swapB && dominantes[1]) setSwapB(dominantes[1]);
  }, [dominantes, swapA, swapB]);

  const contraste = swapA && swapB ? contrastRatio(swapA, swapB) : null;
  const contrasteOk = contraste !== null && contraste >= 3;

  const [matrixJson, setMatrixJson] = React.useState("");

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Paleta de fios</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-4">
            <div>
              <Label>Marca</Label>
              <Select value={p.paletaId} onValueChange={(v) => p.onChange({ paletaId: v as PaletaId })}>
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
              <Input type="number" value={p.maxFloat}
                onChange={(e) => p.onChange({ maxFloat: Number(e.target.value) })} />
            </div>
            <div>
              <Label>g / 100m</Label>
              <Input type="number" value={p.gramasPor100m}
                onChange={(e) => p.onChange({ gramasPor100m: Number(e.target.value) })} />
            </div>
            <div>
              <Label>m / novelo</Label>
              <Input type="number" value={p.metrosPorNovelo}
                onChange={(e) => p.onChange({ metrosPorNovelo: Number(e.target.value) })} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {paleta.map((c) => (
              <button key={c.id} onClick={() => p.onChange({ activeCor: c.hex })}
                className={`flex items-center gap-2 rounded border px-3 py-1.5 text-sm ${p.activeCor === c.hex ? "border-primary ring-1 ring-primary" : "border-border"}`}>
                <span className="inline-block h-4 w-4 rounded" style={{ background: c.hex }} />
                {c.nome}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <Label className="mr-2">Multiplicador Fair Isle:</Label>
            <Input type="number" step={0.1} className="w-24" value={p.floatMultiplier}
              onChange={(e) => p.onChange({ floatMultiplier: Number(e.target.value) })} />
            <span className="text-xs text-muted-foreground">Aplicado às cores minoritárias.</span>
            <Button size="sm" variant="outline" className="ml-auto"
              onClick={() => {
                if (!p.activeCor) { toast.error("Escolhe uma cor primeiro."); return; }
                p.onChartChange(aplicarCorFundo(p.chart, p.activeCor));
                toast.success("Fundo aplicado.");
              }}>
              <Droplets className="mr-2 h-4 w-4" /> Pintar fundo com cor activa
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Consumo estimado</CardTitle></CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-auto max-h-72">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="p-2 text-left">Cor</th>
                    <th className="p-2 text-center">Malhas</th>
                    <th className="p-2 text-center">m</th>
                    <th className="p-2 text-center">g</th>
                    <th className="p-2 text-center">Novelos</th>
                  </tr>
                </thead>
                <tbody>
                  {consumo.map((c) => (
                    <tr key={c.cor} className="border-t">
                      <td className="p-2 flex items-center gap-2">
                        <span className="inline-block h-4 w-4 rounded border"
                          style={{ background: c.cor === "default" ? "transparent" : c.cor }} />
                        <code className="text-xs">{c.cor}</code>
                      </td>
                      <td className="p-2 text-center font-mono">{c.malhas}</td>
                      <td className="p-2 text-center font-mono">{c.metros}</td>
                      <td className="p-2 text-center font-mono">{c.gramas}</td>
                      <td className="p-2 text-center font-mono">{c.novelos}</td>
                    </tr>
                  ))}
                  {consumo.length === 0 && (
                    <tr><td colSpan={5} className="p-3 text-center text-muted-foreground">Sem cores no chart.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Alertas de float</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {floats.total === 0 ? (
              <p className="text-sm text-green-600 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" /> Todos os floats ≤ {p.maxFloat} malhas.
              </p>
            ) : (
              <div className="space-y-2 text-sm">
                <p className="text-red-600 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" /> {floats.total} float(s) acima de {p.maxFloat}.
                </p>
                <ul className="text-xs">
                  <li>Pior run: <b>{floats.pior}</b> malhas</li>
                  <li>Média dos runs acima: <b>{floats.media}</b> malhas</li>
                </ul>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(floats.porCor).map(([cor, n]) => (
                    <Badge key={cor} variant="secondary" className="gap-1">
                      <span className="inline-block h-3 w-3 rounded"
                        style={{ background: cor === "default" ? "transparent" : cor }} />
                      {n}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Inversão / Troca de cores</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Cor A</Label>
                <Select value={swapA} onValueChange={setSwapA}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    {dominantes.map((c) => (
                      <SelectItem key={c} value={c}>
                        <span className="inline-flex items-center gap-2">
                          <span className="inline-block h-3 w-3 rounded" style={{ background: c }} />
                          {c}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Cor B</Label>
                <Select value={swapB} onValueChange={setSwapB}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    {dominantes.map((c) => (
                      <SelectItem key={c} value={c}>
                        <span className="inline-flex items-center gap-2">
                          <span className="inline-block h-3 w-3 rounded" style={{ background: c }} />
                          {c}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {contraste !== null && (
              <p className={`text-sm ${contrasteOk ? "text-green-600" : "text-yellow-600"}`}>
                Contraste: <b>{contraste}:1</b> — {contrasteOk ? "legível" : "baixo (arrisca-se a perder o desenho)"}
              </p>
            )}
            <Button size="sm" variant="outline"
              onClick={() => {
                if (!swapA || !swapB || swapA === swapB) { toast.error("Escolhe duas cores diferentes."); return; }
                p.onChartChange(trocarCores(p.chart, swapA, swapB));
                toast.success("Cores trocadas.");
              }}>
              <ArrowLeftRight className="mr-2 h-4 w-4" /> Trocar A ↔ B
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Pixel-art rápida</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Label className="text-xs">Matriz JSON (linhas × colunas com hex ou "")</Label>
            <Textarea rows={5} className="font-mono text-xs" value={matrixJson}
              onChange={(e) => setMatrixJson(e.target.value)}
              placeholder={`[["#000","#fff"],["#fff","#000"]]`} />
            <Button size="sm" variant="outline"
              onClick={() => {
                try {
                  const m = JSON.parse(matrixJson);
                  if (!Array.isArray(m)) throw new Error("Matriz inválida");
                  p.onChartChange(pixelArtFromMatrix(p.chart, m));
                  toast.success("Pixel-art aplicada.");
                } catch (err: unknown) {
                  toast.error((err as Error).message || "JSON inválido");
                }
              }}>
              <Wand2 className="mr-2 h-4 w-4" /> Aplicar matriz
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}