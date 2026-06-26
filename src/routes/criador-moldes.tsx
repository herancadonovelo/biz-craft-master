import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import { useSubscription } from "@/lib/subscription";
import {
  Undo2, Redo2, Trash2, Printer, Image as ImageIcon, MousePointer, PenLine,
  Copy, FlipHorizontal2, FlipVertical2, RotateCw, ZoomIn, ZoomOut, Type,
  Save, FolderOpen, Eye, EyeOff, Lock, Unlock, Plus, Move, Ruler,
} from "lucide-react";

export const Route = createFileRoute("/criador-moldes")({ component: CriadorMoldes });

const MM_PER_CM = 10;
type Pt = { x: number; y: number };
type Dash = "none" | "dashed" | "dotted";
type PathShape = {
  id: string; kind: "path"; name: string; visible: boolean; locked: boolean;
  points: Pt[]; closed: boolean; smooth: boolean;
  stroke: string; strokeWidth: number; dash: Dash; fill: string;
};
type TextShape = {
  id: string; kind: "text"; name: string; visible: boolean; locked: boolean;
  x: number; y: number; text: string; fontSize: number; stroke: string;
};
type Shape = PathShape | TextShape;

const COLORS = ["#0f172a", "#ef4444", "#0ea5e9", "#16a34a", "#a855f7", "#f59e0b"];

function smoothPathD(pts: Pt[], closed: boolean): string {
  if (pts.length < 2) return pts[0] ? `M ${pts[0].x} ${pts[0].y}` : "";
  const n = pts.length;
  const get = (i: number) => closed ? pts[((i % n) + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
  let d = `M ${pts[0].x} ${pts[0].y}`;
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
    const c1x = p1.x + (p2.x - p0.x) / 6, c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6, c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  if (closed) d += " Z";
  return d;
}
function straightPathD(pts: Pt[], closed: boolean): string {
  if (pts.length === 0) return "";
  return `M ${pts[0].x} ${pts[0].y} ` + pts.slice(1).map((p) => `L ${p.x} ${p.y}`).join(" ") + (closed ? " Z" : "");
}
function pathD(s: PathShape): string {
  return s.smooth ? smoothPathD(s.points, s.closed) : straightPathD(s.points, s.closed);
}

function project(p: Pt, a: Pt, b: Pt): { pt: Pt; dist: number } {
  const dx = b.x - a.x, dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  let t = len2 ? ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2 : 0;
  t = Math.max(0, Math.min(1, t));
  const pt = { x: a.x + dx * t, y: a.y + dy * t };
  return { pt, dist: Math.hypot(pt.x - p.x, pt.y - p.y) };
}
function nearestSegment(pts: Pt[], p: Pt, closed: boolean) {
  let best = { idx: 0, dist: Infinity, pt: p };
  const n = pts.length;
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const r = project(p, pts[i], pts[(i + 1) % n]);
    if (r.dist < best.dist) best = { idx: i, dist: r.dist, pt: r.pt };
  }
  return best;
}
function centroid(pts: Pt[]): Pt {
  if (!pts.length) return { x: 0, y: 0 };
  const s = pts.reduce((a, p) => ({ x: a.x + p.x, y: a.y + p.y }), { x: 0, y: 0 });
  return { x: s.x / pts.length, y: s.y / pts.length };
}
function transformPts(pts: Pt[], fn: (p: Pt) => Pt): Pt[] {
  return pts.map(fn);
}

function pathMetrics(d: string, closed: boolean) {
  if (!d || typeof document === "undefined") return { length: 0, area: 0 };
  const el = document.createElementNS("http://www.w3.org/2000/svg", "path");
  el.setAttribute("d", d);
  let length = 0;
  try { length = el.getTotalLength(); } catch { length = 0; }
  let area = 0;
  if (closed && length > 0) {
    const N = 240;
    const pts: Pt[] = [];
    for (let i = 0; i < N; i++) {
      const p = el.getPointAtLength((i / N) * length);
      pts.push({ x: p.x, y: p.y });
    }
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      area += a.x * b.y - b.x * a.y;
    }
    area = Math.abs(area / 2);
  }
  return { length, area };
}

function CriadorMoldes() {
  const { requireAccess } = useSubscription();
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
  const [gridCm, setGridCm] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [showRulers, setShowRulers] = useState(true);
  const [showMeasurements, setShowMeasurements] = useState(false);
  const [continuous, setContinuous] = useState(true);
  const [mode, setMode] = useState<"draw" | "edit" | "insert" | "text">("draw");
  const [bg, setBg] = useState<string | null>(null);
  const [bgOpacity, setBgOpacity] = useState(0.4);
  const [snap, setSnap] = useState(true);
  const [snapStepCm, setSnapStepCm] = useState(0.5);
  const [zoom, setZoom] = useState(1);
  const [moldeNome, setMoldeNome] = useState("");
  const [linkProjetoId, setLinkProjetoId] = useState<string>("");
  const [linkReceitaId, setLinkReceitaId] = useState<string>("");

  const [shapes, setShapes] = useState<Shape[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [history, setHistory] = useState<Shape[][]>([[]]);
  const [hIdx, setHIdx] = useState(0);
  const [hover, setHover] = useState<Pt | null>(null);
  const draggingPt = useRef<{ shapeId: string; idx: number } | null>(null);
  const draggingShape = useRef<{ shapeId: string; startMouse: Pt; startPts: Pt[] } | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const projetos = useStore((s) => s.projetos);
  const receitas = useStore((s) => s.receitasEditor);
  const add = useStore((s) => s.add);
  const biblioteca = useStore((s) => s.biblioteca);
  const remove = useStore((s) => s.remove);

  const wMm = orientation === "portrait" ? 210 : 297;
  const hMm = orientation === "portrait" ? 297 : 210;

  function commit(next: Shape[]) {
    setShapes(next);
    const trimmed = history.slice(0, hIdx + 1);
    trimmed.push(next);
    setHistory(trimmed);
    setHIdx(trimmed.length - 1);
  }
  function undo() { if (hIdx > 0) { setHIdx(hIdx - 1); setShapes(history[hIdx - 1]); } }
  function redo() { if (hIdx < history.length - 1) { setHIdx(hIdx + 1); setShapes(history[hIdx + 1]); } }
  function clearAll() { commit([]); setActiveId(null); }

  function svgPoint(evt: React.MouseEvent): Pt | null {
    const svg = svgRef.current;
    if (!svg) return null;
    const pt = svg.createSVGPoint();
    pt.x = evt.clientX; pt.y = evt.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const loc = pt.matrixTransform(ctm.inverse());
    let x = loc.x, y = loc.y;
    if (snap) {
      const s = snapStepCm * MM_PER_CM;
      x = Math.round(x / s) * s;
      y = Math.round(y / s) * s;
    }
    return { x, y };
  }

  function activeShape() { return shapes.find((s) => s.id === activeId); }

  function newPathShape(firstPt?: Pt): PathShape {
    return {
      id: crypto.randomUUID(),
      kind: "path",
      name: `Molde ${shapes.filter((s) => s.kind === "path").length + 1}`,
      visible: true, locked: false,
      points: firstPt ? [firstPt] : [],
      closed: false, smooth: false,
      stroke: COLORS[shapes.length % COLORS.length],
      strokeWidth: 0.4, dash: "none",
      fill: "rgba(100,116,139,0.06)",
    };
  }

  function onSvgClick(evt: React.MouseEvent) {
    const target = evt.target as Element;
    if (target.getAttribute("data-handle") === "1") return;
    const p = svgPoint(evt);
    if (!p) return;

    if (mode === "text") {
      const txt = window.prompt("Texto da anotação:");
      if (!txt) return;
      const t: TextShape = {
        id: crypto.randomUUID(), kind: "text",
        name: `Texto: ${txt.slice(0, 18)}`,
        visible: true, locked: false,
        x: p.x, y: p.y, text: txt, fontSize: 4,
        stroke: COLORS[shapes.length % COLORS.length],
      };
      commit([...shapes, t]);
      setActiveId(t.id);
      return;
    }

    if (mode === "insert") {
      const a = activeShape();
      if (!a || a.kind !== "path" || a.points.length < 2) return;
      const seg = nearestSegment(a.points, p, a.closed);
      if (seg.dist > 5) { toast.error("Clica mais perto da linha do molde"); return; }
      const newPts = [...a.points];
      newPts.splice(seg.idx + 1, 0, seg.pt);
      commit(shapes.map((s) => (s.id === a.id ? { ...a, points: newPts } : s)));
      return;
    }

    if (mode === "draw") {
      const a = activeShape();
      if (continuous && a && a.kind === "path" && !a.closed && !a.locked) {
        commit(shapes.map((s) => (s.id === a.id ? { ...a, points: [...a.points, p] } : s)));
      } else {
        const np = newPathShape(p);
        commit([...shapes, np]);
        setActiveId(np.id);
      }
    }
  }

  function startNewPath() {
    const np = newPathShape();
    commit([...shapes, np]);
    setActiveId(np.id);
  }
  function closeActivePath() {
    const a = activeShape();
    if (!a || a.kind !== "path") return;
    commit(shapes.map((s) => (s.id === a.id ? { ...a, closed: true } : s)));
  }

  function onHandleDown(shapeId: string, idx: number, e: React.MouseEvent) {
    e.stopPropagation();
    const sh = shapes.find((x) => x.id === shapeId);
    if (!sh || sh.locked) return;
    setActiveId(shapeId);
    draggingPt.current = { shapeId, idx };
  }
  function onHandleContext(shapeId: string, idx: number, e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation();
    const sh = shapes.find((x) => x.id === shapeId);
    if (!sh || sh.kind !== "path" || sh.locked) return;
    if (sh.points.length <= 1) { commit(shapes.filter((s) => s.id !== shapeId)); return; }
    const newPts = sh.points.filter((_, i) => i !== idx);
    commit(shapes.map((s) => (s.id === shapeId ? { ...sh, points: newPts } : s)));
  }
  function onShapeDown(shapeId: string, e: React.MouseEvent) {
    if (mode !== "edit" && mode !== "insert") return;
    if ((e.target as Element).getAttribute("data-handle") === "1") return;
    const sh = shapes.find((x) => x.id === shapeId);
    if (!sh || sh.kind !== "path" || sh.locked) return;
    setActiveId(shapeId);
    if (mode === "insert") return;
    e.stopPropagation();
    const p = svgPoint(e);
    if (!p) return;
    draggingShape.current = { shapeId, startMouse: p, startPts: sh.points };
  }
  function onSvgMove(e: React.MouseEvent) {
    const p = svgPoint(e);
    if (!p) return;
    setHover(p);
    if (draggingPt.current) {
      const { shapeId, idx } = draggingPt.current;
      setShapes((prev) => prev.map((s) =>
        s.id === shapeId && s.kind === "path"
          ? { ...s, points: s.points.map((pt, i) => (i === idx ? p : pt)) } : s));
      return;
    }
    if (draggingShape.current) {
      const { shapeId, startMouse, startPts } = draggingShape.current;
      const dx = p.x - startMouse.x, dy = p.y - startMouse.y;
      setShapes((prev) => prev.map((s) =>
        s.id === shapeId && s.kind === "path"
          ? { ...s, points: startPts.map((q) => ({ x: q.x + dx, y: q.y + dy })) } : s));
    }
  }
  function onSvgUp() {
    if (draggingPt.current || draggingShape.current) {
      draggingPt.current = null;
      draggingShape.current = null;
      commit(shapes);
    }
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.shiftKey && e.key === "Z"))) { e.preventDefault(); redo(); }
      if (e.key === "Escape") setActiveId(null);
      if (e.key === "Delete" && activeId) {
        commit(shapes.filter((s) => s.id !== activeId));
        setActiveId(null);
      }
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

  // Layer ops
  function setActiveProp<T extends keyof PathShape>(key: T, val: PathShape[T]) {
    const a = activeShape();
    if (!a || a.kind !== "path") return;
    commit(shapes.map((s) => (s.id === a.id ? { ...a, [key]: val } as PathShape : s)));
  }
  function setTextProp<T extends keyof TextShape>(key: T, val: TextShape[T]) {
    const a = activeShape();
    if (!a || a.kind !== "text") return;
    commit(shapes.map((s) => (s.id === a.id ? { ...a, [key]: val } as TextShape : s)));
  }
  function transformActive(fn: (p: Pt, c: Pt) => Pt) {
    const a = activeShape();
    if (!a || a.kind !== "path") return;
    const c = centroid(a.points);
    commit(shapes.map((s) => (s.id === a.id ? { ...a, points: transformPts(a.points, (p) => fn(p, c)) } : s)));
  }
  function mirrorH() { transformActive((p, c) => ({ x: 2 * c.x - p.x, y: p.y })); }
  function mirrorV() { transformActive((p, c) => ({ x: p.x, y: 2 * c.y - p.y })); }
  function rotateBy(deg: number) {
    const r = (deg * Math.PI) / 180, cos = Math.cos(r), sin = Math.sin(r);
    transformActive((p, c) => ({ x: c.x + (p.x - c.x) * cos - (p.y - c.y) * sin, y: c.y + (p.x - c.x) * sin + (p.y - c.y) * cos }));
  }
  function scaleBy(f: number) { transformActive((p, c) => ({ x: c.x + (p.x - c.x) * f, y: c.y + (p.y - c.y) * f })); }
  function duplicateActive() {
    const a = activeShape();
    if (!a) return;
    if (a.kind === "path") {
      const copy: PathShape = { ...a, id: crypto.randomUUID(), name: a.name + " (cópia)", points: a.points.map((p) => ({ x: p.x + 10, y: p.y + 10 })) };
      commit([...shapes, copy]); setActiveId(copy.id);
    } else {
      const copy: TextShape = { ...a, id: crypto.randomUUID(), name: a.name + " (cópia)", x: a.x + 10, y: a.y + 10 };
      commit([...shapes, copy]); setActiveId(copy.id);
    }
  }

  // Save / load library
  function saveToLibrary() {
    const nome = moldeNome.trim() || `Molde ${new Date().toLocaleDateString("pt-PT")}`;
    const payload = { v: 1, orientation, shapes };
    const json = JSON.stringify(payload);
    const base64 = btoa(unescape(encodeURIComponent(json)));
    const descricao = [
      linkProjetoId ? `projeto:${linkProjetoId}` : null,
      linkReceitaId ? `receita:${linkReceitaId}` : null,
    ].filter(Boolean).join(" | ") || undefined;
    add("biblioteca", {
      titulo: nome,
      categoria: "Moldes",
      tipo: "molde",
      descricao,
      ficheiroBase64: base64,
      tamanhoKb: Math.round(json.length / 1024),
      criadoEm: new Date().toISOString(),
    });
    toast.success("Molde guardado na biblioteca");
    setMoldeNome("");
  }
  function loadFromLibrary(id: string) {
    const item = biblioteca.find((b) => b.id === id);
    if (!item?.ficheiroBase64) return;
    try {
      const json = decodeURIComponent(escape(atob(item.ficheiroBase64)));
      const data = JSON.parse(json);
      if (data?.shapes) {
        if (data.orientation) setOrientation(data.orientation);
        commit(data.shapes);
        toast.success("Molde carregado");
      }
    } catch { toast.error("Não foi possível abrir esse molde"); }
  }

  // Grid + rulers (mm)
  const gridLines: React.ReactNode[] = [];
  if (showGrid) {
    for (let x = 0; x <= wMm; x += gridCm * MM_PER_CM)
      gridLines.push(<line key={`vx${x}`} x1={x} y1={0} x2={x} y2={hMm} stroke="hsl(var(--border))" strokeWidth={x % (5 * MM_PER_CM) === 0 ? 0.25 : 0.1} />);
    for (let y = 0; y <= hMm; y += gridCm * MM_PER_CM)
      gridLines.push(<line key={`hy${y}`} x1={0} y1={y} x2={wMm} y2={y} stroke="hsl(var(--border))" strokeWidth={y % (5 * MM_PER_CM) === 0 ? 0.25 : 0.1} />);
  }

  // Active metrics
  const metrics = useMemo(() => {
    const a = activeShape();
    if (!a || a.kind !== "path" || a.points.length < 2) return { lenCm: 0, areaCm2: 0 };
    const m = pathMetrics(pathD(a), a.closed);
    return { lenCm: m.length / MM_PER_CM, areaCm2: m.area / (MM_PER_CM * MM_PER_CM) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shapes, activeId]);

  function doPrint() {
    if (!requireAccess("premium", "Exportação A4 do molde")) return;
    window.print();
  }

  const active = activeShape();
  const activePath = active?.kind === "path" ? active : null;
  const activeText = active?.kind === "text" ? active : null;

  const dashFor = (d: Dash, sw: number) => d === "dashed" ? `${sw * 6} ${sw * 4}` : d === "dotted" ? `${sw} ${sw * 2}` : undefined;

  return (
    <div className="space-y-6">
      <div className="no-print">
        <PageHeader
          title="Criador de Moldes"
          description="Desenho vetorial em escala 1:1 para tricotin e peças de arame."
          actions={
            <>
              <Button variant="outline" size="sm" onClick={undo} disabled={hIdx <= 0}><Undo2 className="h-4 w-4" /></Button>
              <Button variant="outline" size="sm" onClick={redo} disabled={hIdx >= history.length - 1}><Redo2 className="h-4 w-4" /></Button>
              <Button variant="outline" size="sm" onClick={clearAll}><Trash2 className="h-4 w-4 mr-1" />Limpar</Button>
              <Button variant="outline" size="sm" onClick={() => setZoom((z) => Math.max(0.4, z - 0.1))}><ZoomOut className="h-4 w-4" /></Button>
              <span className="text-xs text-muted-foreground w-12 text-center">{Math.round(zoom * 100)}%</span>
              <Button variant="outline" size="sm" onClick={() => setZoom((z) => Math.min(2.5, z + 0.1))}><ZoomIn className="h-4 w-4" /></Button>
              <Button size="sm" onClick={doPrint}><Printer className="h-4 w-4 mr-1" />Exportar A4</Button>
            </>
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr_280px] no-print-grid">
        {/* LEFT: Ferramentas */}
        <aside className="no-print space-y-4 rounded-lg border border-border bg-card p-4 max-h-[calc(100vh-160px)] overflow-auto">
          <div className="space-y-2">
            <Label>Modo</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" variant={mode === "draw" ? "default" : "outline"} onClick={() => setMode("draw")}><PenLine className="h-4 w-4 mr-1" />Desenhar</Button>
              <Button size="sm" variant={mode === "edit" ? "default" : "outline"} onClick={() => setMode("edit")}><MousePointer className="h-4 w-4 mr-1" />Editar</Button>
              <Button size="sm" variant={mode === "insert" ? "default" : "outline"} onClick={() => setMode("insert")}><Plus className="h-4 w-4 mr-1" />Inserir pt.</Button>
              <Button size="sm" variant={mode === "text" ? "default" : "outline"} onClick={() => setMode("text")}><Type className="h-4 w-4 mr-1" />Texto</Button>
            </div>
            <p className="text-[11px] text-muted-foreground">Editar: arrasta pontos, clique-direito apaga, arrasta a linha para mover o molde inteiro.</p>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="cont">Linha contínua</Label>
            <Switch id="cont" checked={continuous} onCheckedChange={setContinuous} />
          </div>

          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={startNewPath} className="flex-1">Nova linha</Button>
            <Button size="sm" variant="outline" onClick={closeActivePath} className="flex-1" disabled={!activePath}>Fechar</Button>
          </div>

          <div className="space-y-2 border-t border-border pt-4">
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
            <Label>Espaçamento (cm)</Label>
            <Input type="number" min={0.5} step={0.5} value={gridCm} onChange={(e) => setGridCm(Math.max(0.5, Number(e.target.value) || 1))} />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="rul"><Ruler className="h-4 w-4 inline mr-1" />Réguas cm</Label>
            <Switch id="rul" checked={showRulers} onCheckedChange={setShowRulers} />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="meas">Medidas nos segmentos</Label>
            <Switch id="meas" checked={showMeasurements} onCheckedChange={setShowMeasurements} />
          </div>

          <div className="flex items-center justify-between border-t border-border pt-4">
            <Label htmlFor="snap">Snap à grelha</Label>
            <Switch id="snap" checked={snap} onCheckedChange={setSnap} />
          </div>
          <div className="space-y-2">
            <Label>Passo snap</Label>
            <div className="flex gap-2">
              <Button size="sm" variant={snapStepCm === 0.5 ? "default" : "outline"} onClick={() => setSnapStepCm(0.5)} className="flex-1" disabled={!snap}>0,5 cm</Button>
              <Button size="sm" variant={snapStepCm === 1 ? "default" : "outline"} onClick={() => setSnapStepCm(1)} className="flex-1" disabled={!snap}>1 cm</Button>
            </div>
          </div>

          <div className="space-y-2 border-t border-border pt-4">
            <Label className="flex items-center gap-2"><ImageIcon className="h-4 w-4" />Imagem de fundo</Label>
            <Input type="file" accept="image/*" onChange={onUpload} />
            {bg && (
              <>
                <Label>Opacidade {(bgOpacity * 100).toFixed(0)}%</Label>
                <Input type="range" min={0} max={1} step={0.05} value={bgOpacity} onChange={(e) => setBgOpacity(Number(e.target.value))} />
                <Button size="sm" variant="ghost" onClick={() => setBg(null)}>Remover</Button>
              </>
            )}
          </div>

          <p className="text-[11px] text-muted-foreground border-t border-border pt-3">
            Ao imprimir: "Tamanho real" (100%), desativar "Ajustar à página".
          </p>
        </aside>

        {/* MIDDLE: Canvas */}
        <div className="print-area flex justify-center overflow-auto">
          <div className="stage relative" style={{ transform: `scale(${zoom})`, transformOrigin: "top center", padding: showRulers ? "12mm 0 0 12mm" : "0" }}>
            {showRulers && (
              <>
                <div className="no-print absolute left-[12mm] top-0 h-[12mm] bg-muted/40 border-b border-border" style={{ width: `${wMm}mm` }}>
                  {Array.from({ length: Math.floor(wMm / 10) + 1 }, (_, i) => (
                    <div key={i} className="absolute top-0 h-full text-[8px] text-muted-foreground" style={{ left: `${i * 10}mm`, transform: "translateX(-50%)" }}>
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-px bg-foreground/40" style={{ height: i % 5 === 0 ? "6mm" : "3mm" }} />
                      {i % 5 === 0 && <span className="absolute bottom-[7mm] left-1/2 -translate-x-1/2">{i}</span>}
                    </div>
                  ))}
                </div>
                <div className="no-print absolute top-[12mm] left-0 w-[12mm] bg-muted/40 border-r border-border" style={{ height: `${hMm}mm` }}>
                  {Array.from({ length: Math.floor(hMm / 10) + 1 }, (_, i) => (
                    <div key={i} className="absolute left-0 w-full text-[8px] text-muted-foreground" style={{ top: `${i * 10}mm`, transform: "translateY(-50%)" }}>
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 h-px bg-foreground/40" style={{ width: i % 5 === 0 ? "6mm" : "3mm" }} />
                      {i % 5 === 0 && <span className="absolute right-[7mm] top-1/2 -translate-y-1/2">{i}</span>}
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="a4-sheet bg-white shadow-lg relative" style={{ width: `${wMm}mm`, height: `${hMm}mm` }}>
              <svg
                ref={svgRef}
                xmlns="http://www.w3.org/2000/svg"
                viewBox={`0 0 ${wMm} ${hMm}`}
                width="100%" height="100%"
                onClick={onSvgClick}
                onMouseMove={onSvgMove}
                onMouseUp={onSvgUp}
                onMouseLeave={onSvgUp}
                style={{
                  cursor: mode === "draw" || mode === "text" || mode === "insert" ? "crosshair" : "default",
                  display: "block",
                }}
              >
                {bg && (
                  <image href={bg} x={0} y={0} width={wMm} height={hMm} preserveAspectRatio="xMidYMid meet" opacity={bgOpacity} className="no-print-bg" />
                )}
                {gridLines}

                {shapes.filter((s) => s.visible).map((s) => {
                  if (s.kind === "text") {
                    return (
                      <g key={s.id} onMouseDown={(e) => { setActiveId(s.id); e.stopPropagation(); }}>
                        <text x={s.x} y={s.y} fontSize={s.fontSize} fill={s.stroke} fontFamily="sans-serif" style={{ cursor: "pointer" }}>{s.text}</text>
                        {mode === "edit" && (
                          <circle cx={s.x} cy={s.y} r={1.2} fill={s.stroke} data-handle="1" className="no-print-handle"
                            onMouseDown={(e) => { e.stopPropagation(); setActiveId(s.id); draggingPt.current = { shapeId: s.id, idx: 0 }; }} />
                        )}
                      </g>
                    );
                  }
                  const d = pathD(s);
                  const isActive = s.id === activeId;
                  return (
                    <g key={s.id}>
                      <path d={d}
                        fill={s.closed ? s.fill : "none"}
                        stroke={s.stroke}
                        strokeWidth={s.strokeWidth + (isActive ? 0.15 : 0)}
                        strokeDasharray={dashFor(s.dash, s.strokeWidth)}
                        strokeLinejoin="round" strokeLinecap="round"
                        onMouseDown={(e) => onShapeDown(s.id, e)}
                        style={{ cursor: (mode === "edit" || mode === "insert") && !s.locked ? "move" : "default" }}
                      />
                      {showMeasurements && !s.smooth && s.points.length > 1 && s.points.map((p, i) => {
                        if (i === 0 && !s.closed) return null;
                        const prev = s.points[(i - 1 + s.points.length) % s.points.length];
                        const len = Math.hypot(p.x - prev.x, p.y - prev.y);
                        if (len < 5) return null;
                        const mx = (p.x + prev.x) / 2, my = (p.y + prev.y) / 2;
                        return <text key={`m${i}`} x={mx} y={my - 1} fontSize={2.2} fill={s.stroke} textAnchor="middle" className="no-print-handle" pointerEvents="none">{(len / 10).toFixed(1)} cm</text>;
                      })}
                      {mode === "edit" && !s.locked && s.points.map((pt, i) => (
                        <circle key={i} cx={pt.x} cy={pt.y} r={isActive ? 1.4 : 1.2}
                          fill={isActive ? "#ef4444" : s.stroke}
                          data-handle="1"
                          onMouseDown={(e) => onHandleDown(s.id, i, e)}
                          onContextMenu={(e) => onHandleContext(s.id, i, e)}
                          style={{ cursor: "grab" }} className="no-print-handle" />
                      ))}
                    </g>
                  );
                })}

                {/* Calibration square */}
                <g transform={`translate(${wMm - 60}, ${hMm - 60})`}>
                  <rect x={0} y={0} width={50} height={50} fill="none" stroke="#0f172a" strokeWidth={0.4} />
                  <text x={25} y={22} textAnchor="middle" fontSize={2.4} fill="#0f172a" fontFamily="sans-serif">Controlo de Escala</text>
                  <text x={25} y={27} textAnchor="middle" fontSize={2} fill="#0f172a" fontFamily="sans-serif">Meça com régua física</text>
                  <text x={25} y={32} textAnchor="middle" fontSize={2} fill="#0f172a" fontFamily="sans-serif">após imprimir</text>
                  <text x={25} y={40} textAnchor="middle" fontSize={3} fill="#0f172a" fontFamily="sans-serif" fontWeight="bold">5cm × 5cm</text>
                </g>

                {snap && hover && (mode === "draw" || mode === "insert" || draggingPt.current || draggingShape.current) && (
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

        {/* RIGHT: Layers + active props + library */}
        <aside className="no-print space-y-4 rounded-lg border border-border bg-card p-4 max-h-[calc(100vh-160px)] overflow-auto">
          <div>
            <Label className="mb-2 block">Camadas</Label>
            <div className="space-y-1">
              {shapes.length === 0 && <p className="text-xs text-muted-foreground">Sem camadas. Começa a desenhar.</p>}
              {shapes.slice().reverse().map((s) => (
                <div key={s.id} className={`flex items-center gap-1 rounded px-2 py-1 text-xs cursor-pointer ${activeId === s.id ? "bg-accent" : "hover:bg-muted/50"}`} onClick={() => setActiveId(s.id)}>
                  <span className="inline-block h-3 w-3 rounded-sm border" style={{ background: s.kind === "path" ? s.stroke : "transparent", borderColor: s.kind === "text" ? s.stroke : "transparent" }} />
                  <span className="flex-1 truncate">{s.name}</span>
                  <button title={s.visible ? "Ocultar" : "Mostrar"} onClick={(e) => { e.stopPropagation(); commit(shapes.map((x) => x.id === s.id ? { ...x, visible: !x.visible } : x)); }}>
                    {s.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3 opacity-50" />}
                  </button>
                  <button title={s.locked ? "Desbloquear" : "Bloquear"} onClick={(e) => { e.stopPropagation(); commit(shapes.map((x) => x.id === s.id ? { ...x, locked: !x.locked } : x)); }}>
                    {s.locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3 opacity-50" />}
                  </button>
                  <button title="Apagar" onClick={(e) => { e.stopPropagation(); commit(shapes.filter((x) => x.id !== s.id)); if (activeId === s.id) setActiveId(null); }}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {activePath && (
            <div className="space-y-3 border-t border-border pt-4">
              <Label className="text-xs uppercase text-muted-foreground">Camada ativa</Label>
              <Input value={activePath.name} onChange={(e) => setActiveProp("name", e.target.value)} className="h-8" />
              <div>
                <Label className="text-xs">Cor</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {COLORS.map((c) => (
                    <button key={c} className={`h-6 w-6 rounded border-2 ${activePath.stroke === c ? "border-foreground" : "border-transparent"}`} style={{ background: c }} onClick={() => setActiveProp("stroke", c)} />
                  ))}
                  <input type="color" value={activePath.stroke} onChange={(e) => setActiveProp("stroke", e.target.value)} className="h-6 w-6 cursor-pointer" />
                </div>
              </div>
              <div>
                <Label className="text-xs">Espessura ({activePath.strokeWidth.toFixed(1)} mm)</Label>
                <Input type="range" min={0.1} max={2} step={0.1} value={activePath.strokeWidth} onChange={(e) => setActiveProp("strokeWidth", Number(e.target.value))} />
              </div>
              <div>
                <Label className="text-xs">Estilo de linha</Label>
                <div className="flex gap-1 mt-1">
                  {(["none", "dashed", "dotted"] as Dash[]).map((d) => (
                    <Button key={d} size="sm" variant={activePath.dash === d ? "default" : "outline"} className="flex-1 h-7 text-xs" onClick={() => setActiveProp("dash", d)}>
                      {d === "none" ? "Sólida" : d === "dashed" ? "Tracejada" : "Pontilhada"}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="sm" className="text-xs">Bézier suave</Label>
                <Switch id="sm" checked={activePath.smooth} onCheckedChange={(v) => setActiveProp("smooth", v)} />
              </div>

              <div className="grid grid-cols-2 gap-1">
                <Button size="sm" variant="outline" onClick={duplicateActive}><Copy className="h-3 w-3 mr-1" />Duplicar</Button>
                <Button size="sm" variant="outline" onClick={mirrorH}><FlipHorizontal2 className="h-3 w-3 mr-1" />Espelhar H</Button>
                <Button size="sm" variant="outline" onClick={mirrorV}><FlipVertical2 className="h-3 w-3 mr-1" />Espelhar V</Button>
                <Button size="sm" variant="outline" onClick={() => rotateBy(15)}><RotateCw className="h-3 w-3 mr-1" />+15°</Button>
                <Button size="sm" variant="outline" onClick={() => rotateBy(-15)}><RotateCw className="h-3 w-3 mr-1 -scale-x-100" />−15°</Button>
                <Button size="sm" variant="outline" onClick={() => rotateBy(90)}>90°</Button>
                <Button size="sm" variant="outline" onClick={() => scaleBy(1.1)}>+10%</Button>
                <Button size="sm" variant="outline" onClick={() => scaleBy(0.9)}>−10%</Button>
              </div>

              <div className="rounded-md bg-muted/40 p-2 text-xs">
                <div className="flex justify-between"><span className="text-muted-foreground">Perímetro</span><strong>{metrics.lenCm.toFixed(1)} cm</strong></div>
                {activePath.closed && <div className="flex justify-between"><span className="text-muted-foreground">Área</span><strong>{metrics.areaCm2.toFixed(1)} cm²</strong></div>}
                <div className="flex justify-between"><span className="text-muted-foreground">Pontos</span><strong>{activePath.points.length}</strong></div>
              </div>
            </div>
          )}

          {activeText && (
            <div className="space-y-3 border-t border-border pt-4">
              <Label className="text-xs uppercase text-muted-foreground">Texto</Label>
              <Input value={activeText.text} onChange={(e) => setTextProp("text", e.target.value)} className="h-8" />
              <div>
                <Label className="text-xs">Tamanho ({activeText.fontSize.toFixed(1)} mm)</Label>
                <Input type="range" min={2} max={20} step={0.5} value={activeText.fontSize} onChange={(e) => setTextProp("fontSize", Number(e.target.value))} />
              </div>
              <input type="color" value={activeText.stroke} onChange={(e) => setTextProp("stroke", e.target.value)} className="h-7 w-full cursor-pointer" />
              <Button size="sm" variant="outline" onClick={duplicateActive}><Copy className="h-3 w-3 mr-1" />Duplicar</Button>
            </div>
          )}

          <div className="space-y-2 border-t border-border pt-4">
            <Label className="text-xs uppercase text-muted-foreground">Guardar molde</Label>
            <Input placeholder="Nome do molde" value={moldeNome} onChange={(e) => setMoldeNome(e.target.value)} className="h-8" />
            <Select value={linkProjetoId} onValueChange={setLinkProjetoId}>
              <SelectTrigger className="h-8"><SelectValue placeholder="Ligar a projeto (opc.)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Nenhum —</SelectItem>
                {projetos.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={linkReceitaId} onValueChange={setLinkReceitaId}>
              <SelectTrigger className="h-8"><SelectValue placeholder="Ligar a receita (opc.)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Nenhuma —</SelectItem>
                {receitas.map((r) => <SelectItem key={r.id} value={r.id}>{r.nome}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button size="sm" className="w-full" onClick={saveToLibrary} disabled={shapes.length === 0}><Save className="h-3 w-3 mr-1" />Guardar na biblioteca</Button>
          </div>

          <div className="space-y-2 border-t border-border pt-4">
            <Label className="text-xs uppercase text-muted-foreground flex items-center gap-1"><FolderOpen className="h-3 w-3" />Moldes guardados</Label>
            {biblioteca.filter((b) => b.tipo === "molde").length === 0 && <p className="text-xs text-muted-foreground">Ainda sem moldes.</p>}
            {biblioteca.filter((b) => b.tipo === "molde").map((b) => (
              <div key={b.id} className="flex items-center gap-1 text-xs">
                <button className="flex-1 text-left truncate hover:underline" onClick={() => loadFromLibrary(b.id)}>{b.titulo}</button>
                <button onClick={() => remove("biblioteca", b.id)}><Trash2 className="h-3 w-3 text-destructive" /></button>
              </div>
            ))}
          </div>
        </aside>
      </div>

      <style>{`
        .a4-sheet { box-sizing: border-box; }
        @media print {
          @page { size: ${orientation === "portrait" ? "A4 portrait" : "A4 landscape"}; margin: 0; }
          html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
          body * { visibility: hidden !important; }
          .print-area, .print-area * { visibility: visible !important; }
          .print-area { position: absolute; inset: 0; display: block !important; overflow: visible !important; }
          .stage { transform: none !important; padding: 0 !important; }
          .a4-sheet { box-shadow: none !important; width: ${wMm}mm !important; height: ${hMm}mm !important; }
          .no-print, .no-print * { display: none !important; }
          .no-print-bg, .no-print-handle { display: none !important; }
        }
      `}</style>
    </div>
  );
}
