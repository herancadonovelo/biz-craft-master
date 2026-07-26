/**
 * Fase 18 — Calibração de escala, estimador de linha (com custo) e
 * consumo automático de inventário para o Editor de Padrões: Bordado.
 */
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useStore, formatCurrency } from "@/lib/store";
import {
  DEFAULT_CALIBRATION, DEFAULT_THREAD_OPTS,
  buildConsumption, calibrateFromMeasurement, estimateThread,
  loadCalibration, loadThreadOpts, mmPerPxFromDpi, pxToMm,
  saveCalibration, saveThreadOpts, totalCost,
  type BlockLite, type ScaleCalibration, type ThreadEstimateOptions,
} from "@/lib/embroidery-phase18";

interface Phase18PanelProps {
  blocks: BlockLite[];
  projectId?: string;
}

export function Phase18Panel({ blocks, projectId }: Phase18PanelProps) {
  const materiais = useStore((s) => s.materiais);
  const update = useStore((s) => s.update);
  const audit = useStore((s) => s.audit);

  const [cal, setCal] = useState<ScaleCalibration>(() => loadCalibration(projectId));
  const [opts, setOpts] = useState<ThreadEstimateOptions>(() => loadThreadOpts(projectId));
  const [measPx, setMeasPx] = useState<number>(100);
  const [measMm, setMeasMm] = useState<number>(20);

  useEffect(() => { saveCalibration(cal, projectId); }, [cal, projectId]);
  useEffect(() => { saveThreadOpts(opts, projectId); }, [opts, projectId]);

  const estimates = useMemo(() => estimateThread(blocks, cal, opts), [blocks, cal, opts]);
  const consumption = useMemo(
    () => buildConsumption(estimates, materiais.map((m) => ({
      id: m.id, nome: m.nome, unidade: m.unidade, stock: m.stock,
      precoCompra: m.precoCompra, marca: m.marca, codigoCor: m.codigoCor,
    }))),
    [estimates, materiais],
  );
  const cost = useMemo(() => totalCost(consumption), [consumption]);

  const applyCalibration = () => {
    const mmPerPx = calibrateFromMeasurement(measPx, measMm);
    setCal((c) => ({ ...c, mmPerPx }));
    toast.success(`Escala: 1px = ${mmPerPx.toFixed(4)} mm`);
  };

  const consumeInventory = () => {
    let touched = 0;
    for (const row of consumption) {
      if (!row.matched || !row.material || row.units <= 0) continue;
      const novo = Math.max(0, row.material.stock - row.units);
      update("materiais", row.material.id, { stock: Number(novo.toFixed(3)) });
      touched++;
    }
    audit("consumo automático de linha (bordado)", "materiais", undefined,
      `${touched} materiais · custo ≈ ${formatCurrency(cost)}`);
    toast.success(touched
      ? `Inventário atualizado: ${touched} materiais.`
      : "Nenhuma cor encontrou material equivalente.");
  };

  return (
    <Card className="bg-card">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Calibração de escala &amp; consumo</p>
            <p className="text-xs text-muted-foreground">
              Fase 18 · mm/px, estimador de linha e desconto automático de stock
            </p>
          </div>
          <Button size="sm" variant="ghost" onClick={() => {
            setCal(DEFAULT_CALIBRATION); setOpts(DEFAULT_THREAD_OPTS);
          }}>Restaurar</Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <Label className="text-xs">Medido no canvas (px)</Label>
            <Input type="number" min={1} value={measPx}
              onChange={(e) => setMeasPx(Number(e.target.value) || 0)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Corresponde a (mm)</Label>
            <Input type="number" min={1} value={measMm}
              onChange={(e) => setMeasMm(Number(e.target.value) || 0)} />
          </div>
          <div className="flex items-end">
            <Button className="w-full" onClick={applyCalibration}>Calibrar</Button>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">DPI de SVG</Label>
            <Input type="number" min={72} value={cal.svgDpi ?? 96}
              onChange={(e) => {
                const dpi = Number(e.target.value) || 96;
                setCal((c) => ({ ...c, svgDpi: dpi, mmPerPx: mmPerPxFromDpi(dpi) }));
              }} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Bastidor L×A (mm)</Label>
            <div className="flex gap-1">
              <Input type="number" value={cal.hoopWidthMm ?? 100}
                onChange={(e) => setCal((c) => ({ ...c, hoopWidthMm: Number(e.target.value) || 0 }))} />
              <Input type="number" value={cal.hoopHeightMm ?? 100}
                onChange={(e) => setCal((c) => ({ ...c, hoopHeightMm: Number(e.target.value) || 0 }))} />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Escala atual</Label>
            <p className="text-xs px-2 py-1 rounded bg-muted">
              1px ≈ {cal.mmPerPx.toFixed(4)} mm · 10px = {pxToMm(10, cal).toFixed(2)} mm
            </p>
          </div>
        </div>

        <Separator />

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <Label className="text-xs">Puxa (pull)</Label>
            <Input type="number" step="0.01" min={1} max={2} value={opts.pullFactor}
              onChange={(e) => setOpts((o) => ({ ...o, pullFactor: Number(e.target.value) || 1 }))} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Fios (strands)</Label>
            <Input type="number" min={1} max={12} value={opts.strands}
              onChange={(e) => setOpts((o) => ({ ...o, strands: Number(e.target.value) || 1 }))} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Reserva (%)</Label>
            <Input type="number" step="1" min={0} max={50}
              value={Math.round(opts.waste * 100)}
              onChange={(e) => setOpts((o) => ({ ...o, waste: (Number(e.target.value) || 0) / 100 }))} />
          </div>
        </div>

        <div className="rounded border overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-muted/50">
              <tr className="text-left">
                <th className="px-2 py-1">Cor</th>
                <th className="px-2 py-1">Linha</th>
                <th className="px-2 py-1">Material</th>
                <th className="px-2 py-1 text-right">Consumo</th>
                <th className="px-2 py-1 text-right">Custo</th>
              </tr>
            </thead>
            <tbody>
              {consumption.length === 0 && (
                <tr><td colSpan={5} className="px-2 py-3 text-center text-muted-foreground">
                  Sem cores no padrão.
                </td></tr>
              )}
              {consumption.map((r) => (
                <tr key={r.color} className="border-t">
                  <td className="px-2 py-1">
                    <span className="inline-flex items-center gap-2">
                      <span className="inline-block w-3 h-3 rounded-sm border"
                        style={{ background: r.color }} />
                      {r.color}
                    </span>
                  </td>
                  <td className="px-2 py-1">{(r.lengthMm / 1000).toFixed(2)} m</td>
                  <td className="px-2 py-1">
                    {r.matched
                      ? <span>{r.material!.nome}<span className="text-muted-foreground"> · {r.material!.unidade}</span></span>
                      : <span className="text-amber-600">sem match</span>}
                  </td>
                  <td className="px-2 py-1 text-right">
                    {r.matched ? `${r.units.toFixed(3)} ${r.material!.unidade}` : "—"}
                  </td>
                  <td className="px-2 py-1 text-right">
                    {r.matched ? formatCurrency(r.cost) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm">
            Custo total estimado: <span className="font-semibold">{formatCurrency(cost)}</span>
          </p>
          <Button size="sm" onClick={consumeInventory}
            disabled={consumption.every((c) => !c.matched)}>
            Descontar do inventário
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
