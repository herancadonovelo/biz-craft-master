/**
 * Fase 19 — Timeline de trajeto e screenshot 3D.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  drawFaux3D, drawStitchPath, downloadCanvasPng, flattenBlocks,
} from "@/lib/embroidery-phase19";
import type { BlockLite } from "@/lib/embroidery-phase18";

interface Phase19PanelProps {
  blocks: BlockLite[];
}

export function Phase19Panel({ blocks }: Phase19PanelProps) {
  const pathRef = useRef<HTMLCanvasElement>(null);
  const threeRef = useRef<HTMLCanvasElement>(null);
  const total = useMemo(() => flattenBlocks(blocks).length, [blocks]);
  const [progress, setProgress] = useState(total);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(80); // pontos/frame
  const [showJumps, setShowJumps] = useState(true);

  // manter progress em sincronia quando total muda
  useEffect(() => { setProgress(total); }, [total]);

  // desenhar path
  useEffect(() => {
    const c = pathRef.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    drawStitchPath(ctx, blocks, {
      width: c.width, height: c.height,
      progress, showJumps, background: "#0b0b0f",
    });
  }, [blocks, progress, showJumps]);

  // desenhar 3D quando blocks mudam
  useEffect(() => {
    const c = threeRef.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    drawFaux3D(ctx, blocks, { width: c.width, height: c.height });
  }, [blocks]);

  // animação da timeline
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    const step = () => {
      setProgress((p) => {
        const next = Math.min(total, p + speed);
        if (next >= total) { setPlaying(false); return total; }
        return next;
      });
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed, total]);

  const downloadPath = () => {
    if (!pathRef.current) return;
    downloadCanvasPng(pathRef.current, `stitch-path-${Date.now()}.png`);
    toast.success("Trajeto exportado como PNG.");
  };
  const download3D = () => {
    if (!threeRef.current) return;
    downloadCanvasPng(threeRef.current, `stitch-3d-${Date.now()}.png`);
    toast.success("Screenshot 3D exportado.");
  };

  return (
    <Card className="bg-card">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Trajeto &amp; pré-visualização 3D</p>
            <p className="text-xs text-muted-foreground">
              Fase 19 · timeline de pontos, jumps a tracejado e screenshot 3D
            </p>
          </div>
          <div className="text-xs text-muted-foreground">
            {progress.toLocaleString()} / {total.toLocaleString()} pts
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <canvas ref={pathRef} width={520} height={320}
              className="w-full h-auto rounded border bg-[#0b0b0f]" />
            <Button size="sm" variant="secondary" className="w-full" onClick={downloadPath}>
              Exportar trajeto (PNG)
            </Button>
          </div>
          <div className="space-y-2">
            <canvas ref={threeRef} width={520} height={320}
              className="w-full h-auto rounded border bg-[#1a1a20]" />
            <Button size="sm" variant="secondary" className="w-full" onClick={download3D}>
              Screenshot 3D (PNG)
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => setPlaying((p) => !p)} disabled={total < 2}>
              {playing ? "Pausar" : "Reproduzir"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setProgress(0)}>Início</Button>
            <Button size="sm" variant="ghost" onClick={() => setProgress(total)}>Fim</Button>
            <div className="ml-auto flex items-center gap-2">
              <Label htmlFor="jumps" className="text-xs">Mostrar jumps</Label>
              <Switch id="jumps" checked={showJumps} onCheckedChange={setShowJumps} />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Timeline</Label>
            <Slider min={0} max={Math.max(1, total)} step={1}
              value={[progress]} onValueChange={([v]) => setProgress(v)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Velocidade ({speed} pts/frame)</Label>
            <Slider min={5} max={500} step={5}
              value={[speed]} onValueChange={([v]) => setSpeed(v)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
