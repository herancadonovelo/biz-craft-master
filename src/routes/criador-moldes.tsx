import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Undo2, Redo2, Trash2, Printer, Image as ImageIcon, MousePointer, PenLine } from "lucide-react";

export const Route = createFileRoute("/criador-moldes")({
  component: CriadorMoldes,
});

// 1 cm = 37.795275591 px @ 96dpi (CSS reference). Print uses CSS mm units so 1:1 is exact.
const MM_PER_CM = 10;

type Pt = { x: number; y: number };
type Path = { id: string; points: Pt[]; closed: boolean };

function CriadorMoldes() {
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
  const [gridCm, setGridCm] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [continuous, setContinuous] = useState(true);
  const [mode, setMode] = useState<"draw" | "edit">("draw");
  const [bg, setBg] = useState<string | null>(null);
  const [bgOpacity, setBgOpacity] = useState(0.4);
  const [snap, setSnap] = useState(true);
  const [snapStepCm, setSnapStepCm] = useState(0.5);

  const [paths, setPaths] = useState<Path[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [history, setHistory] = useState<Path[][]>([[]]);
  const [hIdx, setHIdx] = useState(0);
  const [hover, setHover] = useState<Pt | null>(null);
  const draggingRef = useRef<{ pathId: string; idx: number } | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // A4 in mm
  const wMm = orientation === "portrait" ? 210 : 297;
  const hMm = orientation === "portrait" ? 297 : 210;

  function commit(next: Path[]) {
    setPaths(next);
    const trimmed = history.slice(0, hIdx + 1);
    trimmed.push(next);
    setHistory(trimmed);
    setHIdx(trimmed.length - 1);
  }

  function undo() {
    if (hIdx <= 0) return;
    setHIdx(hIdx - 1);
    setPaths(history[hIdx - 1]);
  }
  function redo() {
    if (hIdx >= history.length - 1) return;
    setHIdx(hIdx + 1);
    setPaths(history[hIdx + 1]);
  }
  function clearAll() {
    commit([]);
    setActiveId(null);
  }

  function svgPoint(evt: React.MouseEvent): Pt | null {
    const svg = svgRef.current;
    if (!svg) return null;
    const pt = svg.createSVGPoint();
    pt.x = evt.clientX;
    pt.y = evt.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const loc = pt.matrixTransform(ctm.inverse());
    let x = loc.x;
    let y = loc.y;
    if (snap) {
      const s = snapStepCm * MM_PER_CM;
      x = Math.round(x / s) * s;
      y = Math.round(y / s) * s;
    }
    return { x, y };
  }

  function onSvgClick(evt: React.MouseEvent) {
    if (mode !== "draw") return;
    if ((evt.target as Element).getAttribute("data-handle") === "1") return;
    const p = svgPoint(evt);
    if (!p) return;
    if (continuous && activeId) {
      const next = paths.map((pa) =>
        pa.id === activeId ? { ...pa, points: [...pa.points, p] } : pa,
      );
      commit(next);
    } else {
      const id = crypto.randomUUID();
      const np: Path = { id, points: [p], closed: false };
      commit([...paths, np]);
      setActiveId(id);
    }
  }

  function startNewPath() {
    const id = crypto.randomUUID();
    commit([...paths, { id, points: [], closed: false }]);
    setActiveId(id);
  }

  function closeActivePath() {
    if (!activeId) return;
    commit(paths.map((p) => (p.id === activeId ? { ...p, closed: true } : p)));
    setActiveId(null);
  }

  function onHandleDown(pathId: string, idx: number, e: React.MouseEvent) {
    e.stopPropagation();
    draggingRef.current = { pathId, idx };
  }
  function onSvgMove(e: React.MouseEvent) {
    const p = svgPoint(e);
    if (!p) return;
    setHover(p);
    if (!draggingRef.current) return;
    const { pathId, idx } = draggingRef.current;
    setPaths((prev) =>
      prev.map((pa) =>
        pa.id === pathId
          ? { ...pa, points: pa.points.map((pt, i) => (i === idx ? p : pt)) }
          : pa,
      ),
    );
  }
  function onSvgUp() {
    if (draggingRef.current) {
      draggingRef.current = null;
      // snapshot in history
      commit(paths);
    }
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.shiftKey && e.key === "Z"))) { e.preventDefault(); redo(); }
      if (e.key === "Escape") setActiveId(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => setBg(String(r.result));
    r.readAsDataURL(f);
  }

  function pathD(pa: Path): string {
    if (pa.points.length === 0) return "";
    const [h, ...rest] = pa.points;
    return `M ${h.x} ${h.y} ` + rest.map((p) => `L ${p.x} ${p.y}`).join(" ") + (pa.closed ? " Z" : "");
  }

  // Grid lines (in mm coords)
  const gridLines: React.ReactNode[] = [];
  if (showGrid) {
    for (let x = 0; x <= wMm; x += gridCm * MM_PER_CM) {
      gridLines.push(<line key={`vx${x}`} x1={x} y1={0} x2={x} y2={hMm} stroke="hsl(var(--border))" strokeWidth={x % (5 * MM_PER_CM) === 0 ? 0.25 : 0.1} />);
    }
    for (let y = 0; y <= hMm; y += gridCm * MM_PER_CM) {
      gridLines.push(<line key={`hy${y}`} x1={0} y1={y} x2={wMm} y2={y} stroke="hsl(var(--border))" strokeWidth={y % (5 * MM_PER_CM) === 0 ? 0.25 : 0.1} />);
    }
  }

  function doPrint() {
    window.print();
  }

  return (
    <div className="space-y-6">
      <div className="no-print">
        <PageHeader
          title="Criador de Moldes"
          description="Desenho vetorial em escala 1:1 para tricotin e peças de arame. Folha A4 real."
          actions={
            <>
              <Button variant="outline" size="sm" onClick={undo} disabled={hIdx <= 0}><Undo2 className="h-4 w-4" /></Button>
              <Button variant="outline" size="sm" onClick={redo} disabled={hIdx >= history.length - 1}><Redo2 className="h-4 w-4" /></Button>
              <Button variant="outline" size="sm" onClick={clearAll}><Trash2 className="h-4 w-4 mr-1" />Limpar</Button>
              <Button size="sm" onClick={doPrint}><Printer className="h-4 w-4 mr-1" />Exportar A4</Button>
            </>
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr] no-print-grid">
        <aside className="no-print space-y-4 rounded-lg border border-border bg-card p-4">
          <div className="space-y-2">
            <Label>Modo</Label>
            <div className="flex gap-2">
              <Button size="sm" variant={mode === "draw" ? "default" : "outline"} onClick={() => setMode("draw")}><PenLine className="h-4 w-4 mr-1" />Desenhar</Button>
              <Button size="sm" variant={mode === "edit" ? "default" : "outline"} onClick={() => setMode("edit")}><MousePointer className="h-4 w-4 mr-1" />Editar</Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="cont">Linha contínua</Label>
            <Switch id="cont" checked={continuous} onCheckedChange={setContinuous} />
          </div>

          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={startNewPath} className="flex-1">Nova linha</Button>
            <Button size="sm" variant="outline" onClick={closeActivePath} className="flex-1" disabled={!activeId}>Fechar</Button>
          </div>

          <div className="space-y-2">
            <Label>Orientação</Label>
            <div className="flex gap-2">
              <Button size="sm" variant={orientation === "portrait" ? "default" : "outline"} onClick={() => setOrientation("portrait")} className="flex-1">Retrato</Button>
              <Button size="sm" variant={orientation === "landscape" ? "default" : "outline"} onClick={() => setOrientation("landscape")} className="flex-1">Paisagem</Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="grid">Grelha</Label>
            <Switch id="grid" checked={showGrid} onCheckedChange={setShowGrid} />
          </div>
          <div className="space-y-2">
            <Label>Espaçamento grelha (cm)</Label>
            <Input type="number" min={0.5} step={0.5} value={gridCm} onChange={(e) => setGridCm(Math.max(0.5, Number(e.target.value) || 1))} />
          </div>

          <div className="flex items-center justify-between border-t border-border pt-4">
            <Label htmlFor="snap">Snap à grelha</Label>
            <Switch id="snap" checked={snap} onCheckedChange={setSnap} />
          </div>
          <div className="space-y-2">
            <Label>Passo de snap</Label>
            <div className="flex gap-2">
              <Button size="sm" variant={snapStepCm === 0.5 ? "default" : "outline"} onClick={() => setSnapStepCm(0.5)} className="flex-1" disabled={!snap}>0,5 cm</Button>
              <Button size="sm" variant={snapStepCm === 1 ? "default" : "outline"} onClick={() => setSnapStepCm(1)} className="flex-1" disabled={!snap}>1 cm</Button>
            </div>
          </div>

          <div className="space-y-2 border-t border-border pt-4">
            <Label className="flex items-center gap-2"><ImageIcon className="h-4 w-4" />Imagem de fundo (decalque)</Label>
            <Input type="file" accept="image/*" onChange={onUpload} />
            {bg && (
              <>
                <Label>Opacidade {(bgOpacity * 100).toFixed(0)}%</Label>
                <Input type="range" min={0} max={1} step={0.05} value={bgOpacity} onChange={(e) => setBgOpacity(Number(e.target.value))} />
                <Button size="sm" variant="ghost" onClick={() => setBg(null)}>Remover imagem</Button>
              </>
            )}
          </div>

          <p className="text-xs text-muted-foreground border-t border-border pt-3">
            Dica: ao imprimir, escolha "Tamanho real" (100%) e desative "Ajustar à página" para manter a escala 1:1.
          </p>
        </aside>

        <div className="print-area flex justify-center">
          <div
            className="a4-sheet bg-white shadow-lg"
            style={{
              width: `${wMm}mm`,
              height: `${hMm}mm`,
            }}
          >
            <svg
              ref={svgRef}
              xmlns="http://www.w3.org/2000/svg"
              viewBox={`0 0 ${wMm} ${hMm}`}
              width="100%"
              height="100%"
              onClick={onSvgClick}
              onMouseMove={onSvgMove}
              onMouseUp={onSvgUp}
              onMouseLeave={onSvgUp}
              style={{ cursor: mode === "draw" ? "crosshair" : "default", display: "block" }}
            >
              {bg && (
                <image
                  href={bg}
                  x={0}
                  y={0}
                  width={wMm}
                  height={hMm}
                  preserveAspectRatio="xMidYMid meet"
                  opacity={bgOpacity}
                  className="no-print-bg"
                />
              )}
              {gridLines}

              {paths.map((pa) => (
                <g key={pa.id}>
                  <path d={pathD(pa)} fill={pa.closed ? "rgba(100,116,139,0.08)" : "none"} stroke="#0f172a" strokeWidth={0.4} strokeLinejoin="round" strokeLinecap="round" />
                  {mode === "edit" && pa.points.map((pt, i) => (
                    <circle
                      key={i}
                      cx={pt.x}
                      cy={pt.y}
                      r={1.2}
                      fill="#ef4444"
                      data-handle="1"
                      onMouseDown={(e) => onHandleDown(pa.id, i, e)}
                      style={{ cursor: "grab" }}
                      className="no-print-handle"
                    />
                  ))}
                </g>
              ))}

              {/* Calibration square 5x5 cm */}
              <g transform={`translate(${wMm - 60}, ${hMm - 60})`}>
                <rect x={0} y={0} width={50} height={50} fill="none" stroke="#0f172a" strokeWidth={0.4} />
                <text x={25} y={22} textAnchor="middle" fontSize={2.4} fill="#0f172a" fontFamily="sans-serif">Controlo de Escala</text>
                <text x={25} y={27} textAnchor="middle" fontSize={2} fill="#0f172a" fontFamily="sans-serif">Meça com régua física</text>
                <text x={25} y={32} textAnchor="middle" fontSize={2} fill="#0f172a" fontFamily="sans-serif">após imprimir</text>
                <text x={25} y={40} textAnchor="middle" fontSize={3} fill="#0f172a" fontFamily="sans-serif" fontWeight="bold">5cm × 5cm</text>
              </g>

              {snap && hover && (mode === "draw" || draggingRef.current) && (
                <g className="no-print-handle" pointerEvents="none">
                  <line x1={hover.x - 3} y1={hover.y} x2={hover.x + 3} y2={hover.y} stroke="#10b981" strokeWidth={0.3} />
                  <line x1={hover.x} y1={hover.y - 3} x2={hover.x} y2={hover.y + 3} stroke="#10b981" strokeWidth={0.3} />
                  <circle cx={hover.x} cy={hover.y} r={1.6} fill="none" stroke="#10b981" strokeWidth={0.35} />
                  <circle cx={hover.x} cy={hover.y} r={0.5} fill="#10b981" />
                </g>
              )}
            </svg>
          </div>
        </div>
      </div>

      <style>{`
        .a4-sheet { box-sizing: border-box; }
        @media print {
          @page { size: ${orientation === "portrait" ? "A4 portrait" : "A4 landscape"}; margin: 0; }
          html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
          body * { visibility: hidden !important; }
          .print-area, .print-area * { visibility: visible !important; }
          .print-area { position: absolute; inset: 0; display: block !important; }
          .a4-sheet { box-shadow: none !important; width: ${wMm}mm !important; height: ${hMm}mm !important; }
          .no-print, .no-print * { display: none !important; }
          .no-print-bg, .no-print-handle { display: none !important; }
        }
      `}</style>
    </div>
  );
}
