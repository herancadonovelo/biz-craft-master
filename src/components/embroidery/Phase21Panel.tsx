/**
 * Fase 21 — Painel de relatórios e PDF configurável.
 *
 * Cruza os dados do Fase 18 (calibração + estimador de linha) com o
 * inventário do utilizador para gerar: PDF configurável, CSV de compras
 * e checklist de preparação.
 */
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { loadCalibration } from "@/lib/embroidery-phase18";
import type { BlockLite, MaterialLite } from "@/lib/embroidery-phase18";
import {
  buildProductionReport, buildInventoryCsv, buildPrepChecklist,
  buildConfigurablePdf, loadPdfLayout, savePdfLayout, loadSpm, saveSpm,
  downloadBlob, type PdfLayout, type PageFormat, type PageOrientation,
} from "@/lib/embroidery-phase21";
import { useStore } from "@/lib/store";
import { buildConsumption, estimateThread } from "@/lib/embroidery-phase18";

interface Phase21PanelProps {
  blocks: BlockLite[];
  projectId?: string;
  hoopMm?: { w: number; h: number };
  designMm?: { w: number; h: number };
  chartPngDataUrl?: string;
}

function dataUrlToBytes(url: string): Uint8Array | undefined {
  const i = url.indexOf(",");
  if (i < 0) return undefined;
  try {
    const bin = atob(url.slice(i + 1));
    const bytes = new Uint8Array(bin.length);
    for (let k = 0; k < bin.length; k++) bytes[k] = bin.charCodeAt(k);
    return bytes;
  } catch { return undefined; }
}

export function Phase21Panel({
  blocks, projectId, hoopMm, designMm, chartPngDataUrl,
}: Phase21PanelProps) {
  const materials = useStore((s) => s.materiais);
  const [layout, setLayout] = useState<PdfLayout>(() => loadPdfLayout(projectId));
  const [spm, setSpm] = useState<number>(() => loadSpm(projectId));

  const cal = useMemo(() => loadCalibration(projectId), [projectId]);
  const report = useMemo(() => buildProductionReport(blocks, cal, spm), [blocks, cal, spm]);
  const mats: MaterialLite[] = useMemo(
    () => materials.map((m) => ({
      id: m.id, nome: m.nome, unidade: m.unidade, stock: m.stock,
      precoCompra: m.precoCompra, marca: m.marca, codigoCor: m.codigoCor,
    })),
    [materials],
  );
  const shopping = useMemo(() => {
    const est = estimateThread(blocks, cal);
    return buildConsumption(est, mats).map((r) => ({
      hex: r.color,
      nome: r.material?.nome,
      codigo: r.material?.codigoCor,
      stitches: 0,
      units: r.units,
      unidade: r.material?.unidade ?? "m",
      cost: r.cost,
      stock: r.material?.stock ?? 0,
    }));
  }, [blocks, cal, mats]);
  const checklist = useMemo(() => buildPrepChecklist(report, hoopMm), [report, hoopMm]);

  const update = (patch: Partial<PdfLayout>) => {
    const next = { ...layout, ...patch };
    setLayout(next); savePdfLayout(next, projectId);
  };
  const updateSpm = (v: number) => { setSpm(v); saveSpm(v, projectId); };

  const exportPdf = async () => {
    try {
      const bytes = await buildConfigurablePdf({
        layout, report, hoopMm, designMm,
        chartPng: chartPngDataUrl ? dataUrlToBytes(chartPngDataUrl) : undefined,
        shoppingRows: shopping, checklist,
      });
      downloadBlob(bytes, `${(layout.title || "padrao").replace(/[^a-z0-9-_]/gi, "_")}.pdf`, "application/pdf");
      toast.success("PDF gerado.");
    } catch (e) {
      console.error(e); toast.error("Falha a gerar PDF.");
    }
  };

  const exportCsv = () => {
    const csv = buildInventoryCsv(report, mats, cal);
    downloadBlob(csv, `inventario-${Date.now()}.csv`, "text/csv;charset=utf-8");
    toast.success("CSV exportado.");
  };

  return (
    <Card className="bg-card">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Relatórios &amp; PDF configurável</p>
            <p className="text-xs text-muted-foreground">
              Fase 21 · produção, timeline, PDF por atelier e CSV de inventário
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={exportCsv}>CSV</Button>
            <Button size="sm" onClick={exportPdf}>PDF</Button>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-4 text-xs">
          <div className="p-2 rounded bg-muted/40">
            <div className="text-muted-foreground">Pontos</div>
            <div className="font-medium">{report.totalStitches.toLocaleString()}</div>
          </div>
          <div className="p-2 rounded bg-muted/40">
            <div className="text-muted-foreground">Comprimento</div>
            <div className="font-medium">{(report.totalLengthMm / 1000).toFixed(2)} m</div>
          </div>
          <div className="p-2 rounded bg-muted/40">
            <div className="text-muted-foreground">Tempo</div>
            <div className="font-medium">{(report.totalMinutes / 60).toFixed(2)} h</div>
          </div>
          <div className="p-2 rounded bg-muted/40">
            <div className="text-muted-foreground">Trocas de cor</div>
            <div className="font-medium">{report.colorChanges}</div>
          </div>
        </div>

        <Separator />

        <div className="grid gap-3 md:grid-cols-4">
          <div className="space-y-1 md:col-span-2">
            <Label className="text-xs">Título</Label>
            <Input value={layout.title} onChange={(e) => update({ title: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Autor</Label>
            <Input value={layout.author ?? ""} onChange={(e) => update({ author: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Pontos/minuto</Label>
            <Input type="number" min={100} max={2000} step={50}
              value={spm}
              onChange={(e) => updateSpm(Math.max(100, Number(e.target.value) || 800))} />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Formato</Label>
            <Select value={layout.format} onValueChange={(v) => update({ format: v as PageFormat })}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="A4">A4</SelectItem>
                <SelectItem value="A3">A3</SelectItem>
                <SelectItem value="Letter">Letter</SelectItem>
                <SelectItem value="Legal">Legal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Orientação</Label>
            <Select value={layout.orientation} onValueChange={(v) => update({ orientation: v as PageOrientation })}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="portrait">Retrato</SelectItem>
                <SelectItem value="landscape">Paisagem</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Margem (mm)</Label>
            <Input type="number" min={5} max={40} step={1}
              value={layout.marginMm}
              onChange={(e) => update({ marginMm: Math.max(5, Number(e.target.value) || 15) })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Escala %</Label>
            <Input type="number" min={10} max={400} step={5}
              value={layout.scalePercent}
              onChange={(e) => update({ scalePercent: Math.max(10, Number(e.target.value) || 100) })} />
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <div className="flex items-center justify-between p-2 rounded bg-muted/30">
            <Label className="text-xs">Grelha</Label>
            <Switch checked={layout.showGrid} onCheckedChange={(v) => update({ showGrid: v })} />
          </div>
          <div className="flex items-center justify-between p-2 rounded bg-muted/30">
            <Label className="text-xs">Estatísticas</Label>
            <Switch checked={layout.showStats} onCheckedChange={(v) => update({ showStats: v })} />
          </div>
          <div className="flex items-center justify-between p-2 rounded bg-muted/30">
            <Label className="text-xs">Legenda de cores</Label>
            <Switch checked={layout.showLegend} onCheckedChange={(v) => update({ showLegend: v })} />
          </div>
          <div className="flex items-center justify-between p-2 rounded bg-muted/30">
            <Label className="text-xs">Cotas (larg/alt)</Label>
            <Switch checked={layout.showAnnotations} onCheckedChange={(v) => update({ showAnnotations: v })} />
          </div>
        </div>

        {layout.showGrid && (
          <div className="space-y-1">
            <Label className="text-xs">Passo da grelha: {layout.gridStepMm} mm</Label>
            <Slider min={2} max={50} step={1}
              value={[layout.gridStepMm]}
              onValueChange={(v) => update({ gridStepMm: v[0] ?? 10 })} />
          </div>
        )}

        <div className="space-y-1">
          <Label className="text-xs">Notas para o atelier</Label>
          <Textarea rows={2} value={layout.notes ?? ""}
            onChange={(e) => update({ notes: e.target.value })}
            placeholder="Ex: usar estabilizador de recorte, tensão 4, agulha 75/11..." />
        </div>

        <Separator />

        <div>
          <p className="text-xs font-semibold mb-2">Checklist de preparação ({checklist.length})</p>
          <ul className="text-xs space-y-1 max-h-32 overflow-auto pr-1">
            {checklist.map((c) => (
              <li key={c.id} className="flex items-start gap-2">
                <span className={`mt-0.5 h-3 w-3 rounded border ${c.suggested ? "border-emerald-500" : "border-muted-foreground"}`} />
                <span className={c.suggested ? "" : "text-muted-foreground"}>{c.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}