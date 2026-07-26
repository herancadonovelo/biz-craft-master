/**
 * Fase 20 — Painel de perfis de máquina, validações pré-export e planeador
 * multi-bastidor com marcas de registo.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  MACHINE_PROFILES, getMachineProfile,
  loadMachineId, saveMachineId, loadOverlap, saveOverlap,
  planMultiHoop, validateForMachine, type ValidationReport,
} from "@/lib/embroidery-phase20";
import { loadCalibration } from "@/lib/embroidery-phase18";
import type { BlockLite } from "@/lib/embroidery-phase18";

interface Phase20PanelProps {
  blocks: BlockLite[];
  projectId?: string;
  onGateChange?: (canExport: boolean, report: ValidationReport) => void;
}

export function Phase20Panel({ blocks, projectId, onGateChange }: Phase20PanelProps) {
  const [machineId, setMachineId] = useState<string>(() => loadMachineId(projectId));
  const [overlap, setOverlap] = useState<number>(() => loadOverlap(projectId));
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => { saveMachineId(machineId, projectId); }, [machineId, projectId]);
  useEffect(() => { saveOverlap(overlap, projectId); }, [overlap, projectId]);

  const machine = getMachineProfile(machineId) ?? MACHINE_PROFILES[0];
  const cal = useMemo(() => loadCalibration(projectId), [projectId]);

  const report = useMemo(
    () => validateForMachine(blocks, machine, cal.mmPerPx),
    [blocks, machine, cal.mmPerPx],
  );
  const plan = useMemo(
    () => planMultiHoop(blocks, machine, cal.mmPerPx, overlap),
    [blocks, machine, cal.mmPerPx, overlap],
  );

  useEffect(() => { onGateChange?.(report.ok, report); }, [report, onGateChange]);

  // Render do plano multi-bastidor
  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, c.width, c.height);
    const totalW = Math.max(plan.totalWidthMm, machine.hoopWidthMm);
    const totalH = Math.max(plan.totalHeightMm, machine.hoopHeightMm);
    const scale = Math.min((c.width - 24) / totalW, (c.height - 24) / totalH);
    const ox = (c.width - totalW * scale) / 2;
    const oy = (c.height - totalH * scale) / 2;

    plan.tiles.forEach((t) => {
      const x = ox + t.originMm.x * scale;
      const y = oy + t.originMm.y * scale;
      const w = t.widthMm * scale;
      const h = t.heightMm * scale;
      ctx.strokeStyle = "rgba(96,165,250,0.9)";
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, w, h);
      ctx.fillStyle = "rgba(59,130,246,0.08)";
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = "#e2e8f0";
      ctx.font = "10px system-ui";
      ctx.fillText(`#${t.index + 1} · ${t.stitches} pts`, x + 4, y + 12);
      // marcas
      t.marks.forEach((m) => {
        const mx = ox + m.x * scale;
        const my = oy + m.y * scale;
        ctx.strokeStyle = m.type === "cross" ? "#f472b6" : "#facc15";
        ctx.beginPath();
        ctx.moveTo(mx - 4, my); ctx.lineTo(mx + 4, my);
        ctx.moveTo(mx, my - 4); ctx.lineTo(mx, my + 4);
        ctx.stroke();
      });
    });
  }, [plan, machine]);

  const gateColor = report.ok ? "text-emerald-600" : "text-red-600";

  return (
    <Card className="bg-card">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Máquina, validações &amp; multi-bastidor</p>
            <p className="text-xs text-muted-foreground">
              Fase 20 · perfil, gate pré-export e planeamento com marcas de registo
            </p>
          </div>
          <Badge variant={report.ok ? "default" : "destructive"} className={gateColor}>
            {report.ok ? "Pronto para exportar" : "Bloqueado"}
          </Badge>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-1 md:col-span-2">
            <Label className="text-xs">Perfil de máquina</Label>
            <Select value={machineId} onValueChange={setMachineId}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {MACHINE_PROFILES.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name} · {m.format} · {m.hoopWidthMm}×{m.hoopHeightMm}mm
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Sobreposição (mm)</Label>
            <Input type="number" min={0} max={50} step={1}
              value={overlap}
              onChange={(e) => setOverlap(Math.max(0, Number(e.target.value) || 0))} />
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-4 text-xs">
          <div className="p-2 rounded bg-muted/40">
            <div className="text-muted-foreground">Dimensão</div>
            <div className="font-medium">{report.designWidthMm.toFixed(1)} × {report.designHeightMm.toFixed(1)} mm</div>
          </div>
          <div className="p-2 rounded bg-muted/40">
            <div className="text-muted-foreground">Pontos</div>
            <div className="font-medium">{report.totalStitches.toLocaleString()}</div>
          </div>
          <div className="p-2 rounded bg-muted/40">
            <div className="text-muted-foreground">Cores</div>
            <div className="font-medium">{report.colorCount}</div>
          </div>
          <div className="p-2 rounded bg-muted/40">
            <div className="text-muted-foreground">Saltos longos</div>
            <div className="font-medium">{report.longJumps}</div>
          </div>
        </div>

        <div className="space-y-1">
          {report.issues.length === 0 && (
            <p className="text-xs text-emerald-600">Sem problemas detetados.</p>
          )}
          {report.issues.map((i, k) => (
            <div key={k}
              className={`text-xs px-2 py-1 rounded border ${
                i.severity === "error" ? "border-red-500/60 bg-red-500/5 text-red-600" :
                i.severity === "warning" ? "border-amber-500/60 bg-amber-500/5 text-amber-700" :
                "border-sky-500/60 bg-sky-500/5 text-sky-700"
              }`}>
              <span className="uppercase text-[10px] mr-2">{i.severity}</span>{i.message}
            </div>
          ))}
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <p className="text-sm">
            Multi-bastidor: <span className="font-semibold">{plan.cols}×{plan.rows}</span> ·{" "}
            {plan.tiles.length} tile(s) · sobreposição {plan.overlapMm} mm
          </p>
          <Button size="sm" variant="secondary"
            onClick={() => {
              if (!canvasRef.current) return;
              const a = document.createElement("a");
              a.href = canvasRef.current.toDataURL("image/png");
              a.download = `multi-hoop-plan-${Date.now()}.png`;
              document.body.appendChild(a); a.click(); a.remove();
              toast.success("Plano exportado como PNG.");
            }}>Exportar plano (PNG)</Button>
        </div>

        <canvas ref={canvasRef} width={640} height={320}
          className="w-full h-auto rounded border bg-slate-900" />
      </CardContent>
    </Card>
  );
}
