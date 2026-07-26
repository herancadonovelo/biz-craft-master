/**
 * Fase 22 — Auto-digitize inteligente (foto → vetor + regras) e painel
 * de Monograma (iniciais + moldura + preview 2D).
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { autoDigitize, type DigitizedLayer } from "@/lib/auto-digitize";
import { LETTERING_FONTS, MOTIF_PRESETS } from "@/lib/lettering";
import { loadCalibration } from "@/lib/embroidery-phase18";
import {
  analyzeLayers, monogramSvg, pathsBBox,
  loadDigitize, saveDigitize, loadMonogram, saveMonogram,
  type SmartLayerRule, type MonogramOptions, type FrameShape,
} from "@/lib/embroidery-phase22";

interface Phase22PanelProps {
  projectId?: string;
  onDigitized?: (layers: DigitizedLayer[], rules: SmartLayerRule[]) => void;
  onMonogramReady?: (svg: string) => void;
}

export function Phase22Panel({ projectId, onDigitized, onMonogramReady }: Phase22PanelProps) {
  const [digi, setDigi] = useState(() => loadDigitize(projectId));
  const [mono, setMono] = useState<MonogramOptions>(() => loadMonogram(projectId));
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [layers, setLayers] = useState<DigitizedLayer[]>([]);
  const [rules, setRules] = useState<SmartLayerRule[]>([]);
  const previewRef = useRef<HTMLCanvasElement>(null);

  const cal = useMemo(() => loadCalibration(projectId), [projectId]);

  useEffect(() => { saveDigitize(digi, projectId); }, [digi, projectId]);
  useEffect(() => { saveMonogram(mono, projectId); }, [mono, projectId]);

  const upload = (file: File) => {
    const r = new FileReader();
    r.onload = () => setImgUrl(String(r.result));
    r.readAsDataURL(file);
  };

  const runDigitize = async () => {
    if (!imgUrl) return;
    setBusy(true);
    try {
      const outWidthPx = cal.mmPerPx > 0 ? digi.widthMm / cal.mmPerPx : 400;
      const ls = await autoDigitize(imgUrl, {
        colors: digi.colors,
        targetWidthPx: 220,
        simplifyPx: digi.simplifyPx,
        minRegionPx: digi.minRegionPx,
        originX: 0, originY: 0,
        outWidthPx,
      });
      const rs = analyzeLayers(ls, cal.mmPerPx);
      setLayers(ls); setRules(rs);
      onDigitized?.(ls, rs);
      toast.success(`${ls.length} camada(s) vetorizada(s).`);
    } catch (e) {
      console.error(e); toast.error("Falha na vetorização.");
    } finally { setBusy(false); }
  };

  // Preview vetorial pós-digitize
  useEffect(() => {
    const c = previewRef.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    ctx.fillStyle = "#0f172a"; ctx.fillRect(0, 0, c.width, c.height);
    if (!layers.length) return;
    const bb = pathsBBox(layers.flatMap((l) => l.paths));
    if (!bb.w || !bb.h) return;
    const s = Math.min((c.width - 20) / bb.w, (c.height - 20) / bb.h);
    const ox = (c.width - bb.w * s) / 2 - bb.x * s;
    const oy = (c.height - bb.h * s) / 2 - bb.y * s;
    const rx = /-?\d+\.?\d*/g;
    for (const l of layers) {
      ctx.fillStyle = l.hex;
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.lineWidth = 0.5;
      for (const p of l.paths) {
        const nums = p.match(rx); if (!nums) continue;
        ctx.beginPath();
        for (let i = 0; i < nums.length - 1; i += 2) {
          const x = ox + Number(nums[i]) * s;
          const y = oy + Number(nums[i + 1]) * s;
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill(); ctx.stroke();
      }
    }
  }, [layers]);

  // Preview do monograma (svg → img)
  const monoSvgStr = useMemo(() => monogramSvg(mono), [mono]);
  useEffect(() => { onMonogramReady?.(monoSvgStr); }, [monoSvgStr, onMonogramReady]);

  const downloadMonogramSvg = () => {
    const blob = new Blob([monoSvgStr], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `monograma-${mono.initials || "abc"}.svg`;
    a.click(); URL.revokeObjectURL(url);
  };

  const updM = (patch: Partial<MonogramOptions>) => setMono({ ...mono, ...patch });

  return (
    <Card className="bg-card">
      <CardContent className="p-4 space-y-4">
        <div>
          <p className="text-sm font-semibold">Auto-digitize inteligente &amp; Monograma</p>
          <p className="text-xs text-muted-foreground">
            Fase 22 · foto → vetor com regras satim/tatami e compositor de monograma
          </p>
        </div>

        {/* Auto-digitize */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Input type="file" accept="image/*"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }} />
            <Button size="sm" onClick={runDigitize} disabled={!imgUrl || busy}>
              {busy ? "A vetorizar..." : "Vetorizar"}
            </Button>
          </div>
          <div className="grid gap-2 sm:grid-cols-4">
            <div>
              <Label className="text-xs">Cores: {digi.colors}</Label>
              <Slider min={2} max={12} step={1} value={[digi.colors]}
                onValueChange={(v) => setDigi({ ...digi, colors: v[0] ?? 5 })} />
            </div>
            <div>
              <Label className="text-xs">Largura (mm): {digi.widthMm}</Label>
              <Slider min={20} max={300} step={5} value={[digi.widthMm]}
                onValueChange={(v) => setDigi({ ...digi, widthMm: v[0] ?? 80 })} />
            </div>
            <div>
              <Label className="text-xs">Simplificação: {digi.simplifyPx.toFixed(1)}</Label>
              <Slider min={0.2} max={3} step={0.1} value={[digi.simplifyPx]}
                onValueChange={(v) => setDigi({ ...digi, simplifyPx: v[0] ?? 0.8 })} />
            </div>
            <div>
              <Label className="text-xs">Min. região: {digi.minRegionPx}</Label>
              <Slider min={5} max={400} step={5} value={[digi.minRegionPx]}
                onValueChange={(v) => setDigi({ ...digi, minRegionPx: v[0] ?? 40 })} />
            </div>
          </div>

          <canvas ref={previewRef} width={640} height={280}
            className="w-full h-auto rounded border bg-slate-900" />

          {rules.length > 0 && (
            <div className="space-y-1 max-h-40 overflow-auto text-xs">
              {rules.map((r, i) => (
                <div key={i} className="flex items-center gap-2 p-1.5 rounded bg-muted/40">
                  <span className="w-4 h-4 rounded" style={{ background: r.hex }} />
                  <span className="font-mono w-16">{r.hex}</span>
                  <Badge variant="secondary">{r.stitch}</Badge>
                  <span className="text-muted-foreground">underlay: {r.underlay}</span>
                  <span className="text-muted-foreground">
                    · {r.widthMm.toFixed(1)}×{r.heightMm.toFixed(1)} mm
                  </span>
                  <span className="text-muted-foreground">
                    · pull {r.pullCompMm.toFixed(2)} mm
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Monograma */}
        <div className="space-y-3">
          <p className="text-xs font-semibold">Monograma</p>
          <div className="grid gap-3 md:grid-cols-4">
            <div className="space-y-1 md:col-span-2">
              <Label className="text-xs">Iniciais (1-3)</Label>
              <Input maxLength={3} value={mono.initials}
                onChange={(e) => updM({ initials: e.target.value.toUpperCase() })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Tamanho: {mono.sizePx}px</Label>
              <Slider min={40} max={180} step={2} value={[mono.sizePx]}
                onValueChange={(v) => updM({ sizePx: v[0] ?? 90 })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Margem: {mono.frameMarginPx}px</Label>
              <Slider min={0} max={80} step={2} value={[mono.frameMarginPx]}
                onValueChange={(v) => updM({ frameMarginPx: v[0] ?? 20 })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Fonte</Label>
              <Select value={mono.fontFamily} onValueChange={(v) => updM({ fontFamily: v })}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LETTERING_FONTS.map((f) => (
                    <SelectItem key={f.id} value={f.family}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Moldura</Label>
              <Select value={mono.frame} onValueChange={(v) => updM({ frame: v as FrameShape })}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem moldura</SelectItem>
                  {MOTIF_PRESETS.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Espessura: {mono.frameStrokePx}px</Label>
              <Slider min={1} max={12} step={0.5} value={[mono.frameStrokePx]}
                onValueChange={(v) => updM({ frameStrokePx: v[0] ?? 3 })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Cor</Label>
              <Input type="color" value={mono.color}
                onChange={(e) => updM({ color: e.target.value })} />
            </div>
          </div>

          <div
            className="w-full aspect-square max-w-[320px] mx-auto rounded border bg-white overflow-hidden"
            dangerouslySetInnerHTML={{ __html: monoSvgStr }}
          />

          <div className="flex justify-end">
            <Button size="sm" variant="secondary" onClick={downloadMonogramSvg}>
              Descarregar SVG
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}