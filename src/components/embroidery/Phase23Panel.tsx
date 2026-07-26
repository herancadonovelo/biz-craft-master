/**
 * Fase 23 — Painel de QA + Export por Máquina + Editor de Camadas.
 *
 * - Relatório QA com alertas e score.
 * - Checklist interativo (persistido).
 * - Editor manual por camada: satim/tatami, underlay, pull-comp,
 *   densidade, cor — com preview vetorial instantâneo.
 * - Exportação para DST/PES/EXP conforme perfil de máquina.
 * - Auditoria de atalhos e funções do editor.
 */
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { StitchBlock } from "@/lib/dst";
import type { BlockLite } from "@/lib/embroidery-phase18";
import { loadCalibration } from "@/lib/embroidery-phase18";
import { getMachineProfile, loadMachineId, MACHINE_PROFILES } from "@/lib/embroidery-phase20";
import { pathsBBox, type SmartLayerRule } from "@/lib/embroidery-phase22";
import {
  qaReport, buildChecklist, machineCompatibility, exportForMachine,
  applyOverrides, loadOverrides, saveOverrides,
  loadChecklistState, saveChecklistState,
  auditEditor, EDITOR_SHORTCUTS,
  type LayerOverride, type LayerOverrideMap,
} from "@/lib/embroidery-phase23";

interface Phase23PanelProps {
  projectId?: string;
  rules: SmartLayerRule[];
  blocks: BlockLite[];
  stitchBlocks: StitchBlock[];
  label?: string;
}

export function Phase23Panel({
  projectId, rules: initialRules, blocks, stitchBlocks, label = "Bordado",
}: Phase23PanelProps) {
  const cal = useMemo(() => loadCalibration(projectId), [projectId]);
  const [overrides, setOverrides] = useState<LayerOverrideMap>(() => loadOverrides(projectId));
  const [checkState, setCheckState] = useState<Record<string, boolean>>(() => loadChecklistState(projectId));
  const [machineId, setMachineId] = useState(() => loadMachineId(projectId));

  useEffect(() => { saveOverrides(overrides, projectId); }, [overrides, projectId]);
  useEffect(() => { saveChecklistState(checkState, projectId); }, [checkState, projectId]);

  const machine = getMachineProfile(machineId) ?? MACHINE_PROFILES[0];
  const rules = useMemo(() => applyOverrides(initialRules, overrides), [initialRules, overrides]);

  const report = useMemo(
    () => qaReport(rules, blocks, machine, cal.mmPerPx),
    [rules, blocks, machine, cal.mmPerPx],
  );
  const checklist = useMemo(() => buildChecklist(report, machine), [report, machine]);
  const compat = useMemo(() => machineCompatibility(machine, rules), [machine, rules]);
  const audit = useMemo(() => auditEditor(rules, blocks), [rules, blocks]);

  const updOv = (i: number, patch: LayerOverride) =>
    setOverrides({ ...overrides, [i]: { ...(overrides[i] ?? {}), ...patch } });
  const resetOv = (i: number) => {
    const cp = { ...overrides }; delete cp[i]; setOverrides(cp);
  };

  const doExport = () => {
    if (!stitchBlocks.length) { toast.error("Sem pontos para exportar."); return; }
    if (!report.ok) { toast.error("Gate QA bloqueou export: corrige erros primeiro."); return; }
    const pxPerMm = cal.mmPerPx > 0 ? 1 / cal.mmPerPx : 4;
    const out = exportForMachine(machine, stitchBlocks, pxPerMm, label);
    const url = URL.createObjectURL(out.blob);
    const a = document.createElement("a");
    a.href = url; a.download = out.filename; a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exportado ${out.filename}${out.note ? ` (${out.note})` : ""}`);
  };

  return (
    <Card className="bg-card">
      <CardContent className="p-4 space-y-5">
        <div>
          <p className="text-sm font-semibold">QA · Export por Máquina · Editor de Camadas</p>
          <p className="text-xs text-muted-foreground">
            Fase 23 · relatório de qualidade, checklist, exportação DST/PES/EXP e edição manual por camada
          </p>
        </div>

        {/* ── Relatório QA ─────────────────────────────── */}
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-xs font-semibold">Relatório QA · Auto-digitize</p>
              <p className="text-[11px] text-muted-foreground">
                {report.designWidthMm.toFixed(1)}×{report.designHeightMm.toFixed(1)} mm ·
                {" "}{report.totalStitches.toLocaleString()} pontos ·
                {" "}{report.colorCount} cores · densidade {report.avgDensity.toFixed(2)} pts/mm²
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Score</span>
              <Progress value={report.score} className="w-32" />
              <Badge variant={report.score >= 80 ? "default" : report.score >= 50 ? "secondary" : "destructive"}>
                {report.score}/100
              </Badge>
            </div>
          </div>

          {(report.issues.length > 0 || report.digitizeAlerts.length > 0) && (
            <div className="space-y-1 text-xs">
              {[...report.issues, ...report.digitizeAlerts].map((it, i) => (
                <div key={i} className="flex gap-2 items-start p-1.5 rounded bg-muted/40">
                  <Badge variant={it.severity === "error" ? "destructive" : it.severity === "warning" ? "secondary" : "outline"}>
                    {it.severity}
                  </Badge>
                  <span className="text-muted-foreground">{it.message}</span>
                </div>
              ))}
            </div>
          )}

          <div className="grid gap-1.5 sm:grid-cols-2">
            {checklist.map((c) => (
              <label key={c.id} className="flex items-center gap-2 text-xs p-1.5 rounded bg-muted/30">
                <Checkbox
                  checked={checkState[c.id] ?? c.ok}
                  onCheckedChange={(v) => setCheckState({ ...checkState, [c.id]: !!v })}
                />
                <span className="flex-1">
                  <span className={c.ok ? "" : "text-destructive"}>{c.label}</span>
                  {c.detail && <span className="text-muted-foreground"> · {c.detail}</span>}
                </span>
                <span aria-hidden>{c.ok ? "✓" : "!"}</span>
              </label>
            ))}
          </div>
        </section>

        <Separator />

        {/* ── Export por Máquina ─────────────────────── */}
        <section className="space-y-3">
          <p className="text-xs font-semibold">Exportação para máquina</p>
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-xs">Perfil</Label>
              <Select value={machineId} onValueChange={(v) => setMachineId(v)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MACHINE_PROFILES.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name} · {m.format} · {m.hoopWidthMm}×{m.hoopHeightMm} mm
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button size="sm" className="w-full" onClick={doExport} disabled={!report.ok}>
                Exportar {compat.fallback ?? machine.format}
              </Button>
            </div>
          </div>
          {compat.warnings.length > 0 && (
            <div className="text-[11px] text-amber-600 dark:text-amber-400 space-y-0.5">
              {compat.warnings.map((w, i) => <div key={i}>· {w}</div>)}
            </div>
          )}
        </section>

        <Separator />

        {/* ── Editor de camadas ─────────────────────── */}
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold">Editor manual por camada</p>
            <Button size="sm" variant="ghost" onClick={() => setOverrides({})}>
              Repor todas
            </Button>
          </div>
          {rules.length === 0 && (
            <p className="text-xs text-muted-foreground">Faz vetorização na Fase 22 para editar camadas aqui.</p>
          )}
          <div className="space-y-2 max-h-[420px] overflow-auto pr-1">
            {rules.map((r, i) => (
              <div key={i} className="p-2 rounded border bg-muted/20 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Input type="color" value={r.hex} className="h-7 w-10 p-0.5"
                    onChange={(e) => updOv(i, { hex: e.target.value })} />
                  <span className="font-mono text-xs">{r.hex}</span>
                  <Badge variant="secondary">{r.stitch}</Badge>
                  <span className="text-[11px] text-muted-foreground">
                    {r.widthMm.toFixed(1)}×{r.heightMm.toFixed(1)} mm · {r.areaMm2.toFixed(0)} mm²
                  </span>
                  {overrides[i] && (
                    <Button size="sm" variant="ghost" className="ml-auto h-7 text-[11px]"
                      onClick={() => resetOv(i)}>Repor</Button>
                  )}
                </div>
                <div className="grid gap-2 sm:grid-cols-4">
                  <div className="space-y-1">
                    <Label className="text-[11px]">Ponto</Label>
                    <Select value={r.stitch}
                      onValueChange={(v) => updOv(i, { stitch: v as SmartLayerRule["stitch"] })}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="satin">Satim</SelectItem>
                        <SelectItem value="tatami">Tatami</SelectItem>
                        <SelectItem value="run">Corrida</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Underlay</Label>
                    <Select value={r.underlay}
                      onValueChange={(v) => updOv(i, { underlay: v as SmartLayerRule["underlay"] })}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhum</SelectItem>
                        <SelectItem value="edge">Edge</SelectItem>
                        <SelectItem value="zigzag">Zigzag</SelectItem>
                        <SelectItem value="double">Duplo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Pull-comp: {r.pullCompMm.toFixed(2)} mm</Label>
                    <Slider min={0} max={1} step={0.05} value={[r.pullCompMm]}
                      onValueChange={(v) => updOv(i, { pullCompMm: v[0] ?? 0 })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Densidade: {r.density.toFixed(1)}</Label>
                    <Slider min={1} max={8} step={0.1} value={[r.density]}
                      onValueChange={(v) => updOv(i, { density: v[0] ?? 4, spacingMm: 1 / Math.max(0.5, v[0] ?? 4) })} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Preview vetorial instantâneo */}
          {rules.length > 0 && (
            <div className="rounded border p-2 bg-slate-900 overflow-hidden">
              <LayersPreview rules={rules} />
            </div>
          )}
        </section>

        <Separator />

        {/* ── Auditoria & atalhos ───────────────────── */}
        <section className="space-y-2">
          <p className="text-xs font-semibold">Auditoria do editor</p>
          <div className="grid gap-1 sm:grid-cols-2 text-[11px]">
            {audit.map((a, i) => (
              <div key={i} className="flex items-center gap-2 p-1 rounded bg-muted/30">
                <span aria-hidden>{a.ok ? "✓" : "✗"}</span>
                <span className="font-medium">{a.area}</span>
                <span className="text-muted-foreground">· {a.item}</span>
                {a.note && <span className="ml-auto text-muted-foreground">{a.note}</span>}
              </div>
            ))}
          </div>
          <details className="text-[11px]">
            <summary className="cursor-pointer">Atalhos suportados ({EDITOR_SHORTCUTS.length})</summary>
            <div className="mt-2 grid gap-1 sm:grid-cols-2">
              {EDITOR_SHORTCUTS.map((s, i) => (
                <div key={i} className="flex items-center gap-2 p-1 rounded bg-muted/30">
                  <kbd className="px-1.5 py-0.5 rounded bg-background border font-mono">{s.keys}</kbd>
                  <span>{s.action}</span>
                  <span className="ml-auto text-muted-foreground">{s.scope}</span>
                </div>
              ))}
            </div>
          </details>
        </section>
      </CardContent>
    </Card>
  );
}

function LayersPreview({ rules }: { rules: SmartLayerRule[] }) {
  // Preview SVG puro para atualização instantânea sem redraw manual.
  const bb = useMemo(() => pathsBBox(rules.flatMap((r) => r.paths)), [rules]);
  if (!bb.w || !bb.h) return null;
  const pad = 8;
  const vb = `${bb.x - pad} ${bb.y - pad} ${bb.w + pad * 2} ${bb.h + pad * 2}`;
  return (
    <svg viewBox={vb} className="w-full h-56">
      {rules.map((r, i) => (
        <g key={i}>
          {r.paths.map((p, j) => (
            <path
              key={j}
              d={p}
              fill={r.stitch === "run" ? "none" : r.hex}
              stroke={r.hex}
              strokeWidth={r.stitch === "run" ? 1.5 : 0.4}
              strokeDasharray={r.stitch === "run" ? "3 2" : undefined}
              opacity={r.stitch === "tatami" ? 0.85 : 1}
            />
          ))}
          {r.underlay !== "none" && r.stitch !== "run" && r.paths.map((p, j) => (
            <path key={`u${j}`} d={p} fill="none"
              stroke="rgba(255,255,255,0.4)" strokeWidth={0.3}
              strokeDasharray={r.underlay === "zigzag" ? "1 1" : r.underlay === "double" ? "2 1" : undefined} />
          ))}
        </g>
      ))}
    </svg>
  );
}