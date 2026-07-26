import * as React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  A4Stage, ExportPanel, WatermarkControls, useMarcaDAgua,
  SheetControls, useSheet,
} from "@/components/A4Export";
import { useStore, formatEUR } from "@/lib/store";
import { toast } from "sonner";
import {
  MousePointer2, Minus, Spline, Compass, Scissors, Split, Waves,
  GitCommitHorizontal, ImagePlus, Ruler, Trash2, Undo2, Plus, FlipHorizontal2,
  Redo2, History, FileDown, Save, Keyboard, FileUp, GitCompare,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

/* ─────────────── Geometria ─────────────── */

type Pt = { x: number; y: number };
type PolyKind =
  | "line" | "polyline" | "spline"
  | "arc" | "circle" | "spiral"
  | "offset" | "tangent" | "measure";

type Poly = {
  id: string;
  kind: PolyKind;
  pts: Pt[];
  closed?: boolean;
  color?: string;
  marks?: Pt[];   // split-line markers
  label?: string;
  layer?: "molde" | "mirror" | "annotation" | "guide";
};

const A4_W = 595;
const A4_H = 842;
const PX_PER_CM = A4_W / 21; // ≈ 28.33 (mesma constante do editor)

function uid() { return Math.random().toString(36).slice(2, 10); }
function dist(a: Pt, b: Pt) { return Math.hypot(a.x - b.x, a.y - b.y); }
function polyLen(pts: Pt[]) {
  let d = 0; for (let i = 1; i < pts.length; i++) d += dist(pts[i - 1], pts[i]); return d;
}
function pxToCm(px: number) { return px / PX_PER_CM; }
function cmToPx(cm: number) { return cm * PX_PER_CM; }

/** Catmull-Rom uniforme → amostra suave passando exatamente pelos pontos. */
function catmullRom(pts: Pt[], samples = 24): Pt[] {
  if (pts.length < 2) return pts.slice();
  if (pts.length === 2) return [pts[0], pts[1]];
  const out: Pt[] = [];
  const ext = [pts[0], ...pts, pts[pts.length - 1]];
  for (let i = 0; i < ext.length - 3; i++) {
    const p0 = ext[i], p1 = ext[i + 1], p2 = ext[i + 2], p3 = ext[i + 3];
    for (let j = 0; j < samples; j++) {
      const t = j / samples, t2 = t * t, t3 = t2 * t;
      out.push({
        x: 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t
              + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2
              + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
        y: 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t
              + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2
              + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
      });
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

function arcSample(cx: number, cy: number, r: number, a0: number, a1: number, steps = 64): Pt[] {
  const out: Pt[] = []; const n = Math.max(4, Math.round(steps * Math.abs(a1 - a0) / (Math.PI * 2)));
  for (let i = 0; i <= n; i++) {
    const t = a0 + (a1 - a0) * (i / n);
    out.push({ x: cx + Math.cos(t) * r, y: cy + Math.sin(t) * r });
  }
  return out;
}

function spiralSample(cx: number, cy: number, r0: number, r1: number, turns: number, steps = 200): Pt[] {
  const out: Pt[] = [];
  const total = turns * Math.PI * 2;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps; const ang = t * total; const r = r0 + (r1 - r0) * t;
    out.push({ x: cx + Math.cos(ang) * r, y: cy + Math.sin(ang) * r });
  }
  return out;
}

/** Offset paralelo de polilinha (positive = "direita" no sentido do traçado). */
function offsetPolyline(pts: Pt[], distPx: number): Pt[] {
  if (pts.length < 2) return pts;
  const out: Pt[] = [];
  for (let i = 0; i < pts.length; i++) {
    const prev = pts[Math.max(0, i - 1)];
    const next = pts[Math.min(pts.length - 1, i + 1)];
    const tx = next.x - prev.x, ty = next.y - prev.y;
    const l = Math.hypot(tx, ty) || 1;
    // normal (rotação -90°)
    const nx = -ty / l, ny = tx / l;
    out.push({ x: pts[i].x + nx * distPx, y: pts[i].y + ny * distPx });
  }
  return out;
}

/** Marcadores equidistantes (N-1 marcadores entre extremos) para uma polyline. */
function splitMarks(pts: Pt[], n: number): Pt[] {
  const total = polyLen(pts); if (total <= 0 || n < 2) return [];
  const step = total / n; const marks: Pt[] = []; let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    let segLen = dist(pts[i - 1], pts[i]); if (segLen === 0) continue;
    while (marks.length < n - 1 && acc + segLen >= step * (marks.length + 1)) {
      const need = step * (marks.length + 1) - acc;
      const t = need / segLen;
      marks.push({
        x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * t,
        y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * t,
      });
    }
    acc += segLen;
  }
  return marks;
}

/** Interseção segmento-segmento; devolve ponto ou null. */
function segIntersect(a: Pt, b: Pt, c: Pt, d: Pt): Pt | null {
  const rx = b.x - a.x, ry = b.y - a.y;
  const sx = d.x - c.x, sy = d.y - c.y;
  const denom = rx * sy - ry * sx; if (Math.abs(denom) < 1e-6) return null;
  const t = ((c.x - a.x) * sy - (c.y - a.y) * sx) / denom;
  const u = ((c.x - a.x) * ry - (c.y - a.y) * rx) / denom;
  if (t < 0 || t > 1 || u < 0 || u > 1) return null;
  return { x: a.x + rx * t, y: a.y + ry * t };
}

function allIntersections(polys: Poly[]): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < polys.length; i++) {
    for (let j = i + 1; j < polys.length; j++) {
      const A = polys[i].pts, B = polys[j].pts;
      for (let a = 1; a < A.length; a++) {
        for (let b = 1; b < B.length; b++) {
          const p = segIntersect(A[a - 1], A[a], B[b - 1], B[b]);
          if (p) out.push(p);
        }
      }
    }
  }
  return out;
}

/* ─────────────── Export helpers (SVG/DXF) ─────────────── */

function polysToSVG(polys: Poly[], w: number, h: number): string {
  return polysToSVGLayered(polys, w, h, { molde: true, mirror: true, annotations: true, grid: false, gridCm: 1 });
}

function polysToDXF(polys: Poly[]): string {
  return polysToDXFLayered(polys, { molde: true, mirror: true, annotations: true, grid: false, gridCm: 1, w: A4_W, h: A4_H });
}

type LayerOpts = {
  molde: boolean; mirror: boolean; annotations: boolean;
  grid: boolean; gridCm: number;
};

function layerOf(pl: Poly): string {
  return pl.layer ?? (pl.color === "#8b5cf6" ? "mirror" : (pl.marks?.length ? "annotation" : "molde"));
}

function polysToSVGLayered(polys: Poly[], w: number, h: number, o: LayerOpts): string {
  const groups: string[] = [];
  if (o.grid) {
    const g = cmToPx(o.gridCm); const lines: string[] = [];
    for (let x = 0; x <= w; x += g) lines.push(`<line x1="${x}" y1="0" x2="${x}" y2="${h}" stroke="#e5e7eb" stroke-width="0.4"/>`);
    for (let y = 0; y <= h; y += g) lines.push(`<line x1="0" y1="${y}" x2="${w}" y2="${y}" stroke="#e5e7eb" stroke-width="0.4"/>`);
    groups.push(`<g id="grelha" inkscape:label="grelha">${lines.join("")}</g>`);
  }
  const byLayer: Record<string, Poly[]> = { molde: [], mirror: [], annotation: [] };
  for (const pl of polys) {
    const L = layerOf(pl);
    if (L === "mirror" && !o.mirror) continue;
    if (L === "annotation" && !o.annotations) continue;
    if (L === "molde" && !o.molde) continue;
    (byLayer[L] ||= []).push(pl);
  }
  for (const [L, list] of Object.entries(byLayer)) {
    const paths = list.map((pl) => {
      const d = pl.pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ");
      return `<path d="${d}" fill="none" stroke="${pl.color ?? "#000"}" stroke-width="1"/>`;
    }).join("");
    groups.push(`<g id="${L}" inkscape:label="${L}">${paths}</g>`);
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${groups.join("")}</svg>`;
}

function polysToDXFLayered(polys: Poly[], o: LayerOpts & { w: number; h: number }): string {
  const lines: string[] = ["0", "SECTION", "2", "ENTITIES"];
  const emit = (a: Pt, b: Pt, layer: string) => {
    lines.push("0", "LINE", "8", layer,
      "10", a.x.toFixed(3), "20", (-a.y).toFixed(3), "30", "0",
      "11", b.x.toFixed(3), "21", (-b.y).toFixed(3), "31", "0");
  };
  if (o.grid) {
    const g = cmToPx(o.gridCm);
    for (let x = 0; x <= o.w; x += g) emit({ x, y: 0 }, { x, y: o.h }, "GRELHA");
    for (let y = 0; y <= o.h; y += g) emit({ x: 0, y }, { x: o.w, y }, "GRELHA");
  }
  for (const pl of polys) {
    const L = layerOf(pl).toUpperCase();
    if (L === "MIRROR" && !o.mirror) continue;
    if (L === "ANNOTATION" && !o.annotations) continue;
    if (L === "MOLDE" && !o.molde) continue;
    for (let i = 1; i < pl.pts.length; i++) {
      emit(pl.pts[i - 1], pl.pts[i], L);
    }
  }
  lines.push("0", "ENDSEC", "0", "EOF");
  return lines.join("\n");
}

/* ─────────────── Import (SVG/DXF) ─────────────── */

function parseSVG(text: string): Poly[] {
  const out: Poly[] = [];
  const dom = new DOMParser().parseFromString(text, "image/svg+xml");
  dom.querySelectorAll("line").forEach((el) => {
    const a = { x: +(el.getAttribute("x1") || 0), y: +(el.getAttribute("y1") || 0) };
    const b = { x: +(el.getAttribute("x2") || 0), y: +(el.getAttribute("y2") || 0) };
    out.push({ id: uid(), kind: "line", pts: [a, b], color: "#222", layer: "molde" });
  });
  dom.querySelectorAll("polyline, polygon").forEach((el) => {
    const raw = (el.getAttribute("points") || "").trim();
    const pts = raw.split(/[\s,]+/).map(Number);
    const points: Pt[] = [];
    for (let i = 0; i + 1 < pts.length; i += 2) points.push({ x: pts[i], y: pts[i + 1] });
    if (points.length >= 2) out.push({ id: uid(), kind: "polyline", pts: points, color: "#222", layer: "molde" });
  });
  dom.querySelectorAll("path").forEach((el) => {
    const d = el.getAttribute("d") || "";
    const cmds = d.match(/[MLHVZmlhvz][^MLHVZmlhvz]*/g) || [];
    const points: Pt[] = []; let cx = 0, cy = 0;
    for (const c of cmds) {
      const t = c[0]; const nums = (c.slice(1).trim().match(/-?\d+(\.\d+)?/g) || []).map(Number);
      if (t === "M" || t === "L") {
        for (let i = 0; i + 1 < nums.length; i += 2) { cx = nums[i]; cy = nums[i + 1]; points.push({ x: cx, y: cy }); }
      } else if (t === "m" || t === "l") {
        for (let i = 0; i + 1 < nums.length; i += 2) { cx += nums[i]; cy += nums[i + 1]; points.push({ x: cx, y: cy }); }
      } else if (t === "H") { for (const n of nums) { cx = n; points.push({ x: cx, y: cy }); } }
      else if (t === "h") { for (const n of nums) { cx += n; points.push({ x: cx, y: cy }); } }
      else if (t === "V") { for (const n of nums) { cy = n; points.push({ x: cx, y: cy }); } }
      else if (t === "v") { for (const n of nums) { cy += n; points.push({ x: cx, y: cy }); } }
    }
    if (points.length >= 2) out.push({ id: uid(), kind: "polyline", pts: points, color: "#222", layer: "molde" });
  });
  return out;
}

function parseDXF(text: string): Poly[] {
  const out: Poly[] = [];
  const lines = text.split(/\r?\n/).map((s) => s.trim());
  let i = 0;
  while (i < lines.length) {
    if (lines[i] === "0" && lines[i + 1] === "LINE") {
      let x1 = 0, y1 = 0, x2 = 0, y2 = 0; let j = i + 2;
      while (j < lines.length && !(lines[j] === "0")) {
        const code = lines[j]; const val = parseFloat(lines[j + 1]);
        if (code === "10") x1 = val;
        else if (code === "20") y1 = -val;
        else if (code === "11") x2 = val;
        else if (code === "21") y2 = -val;
        j += 2;
      }
      out.push({ id: uid(), kind: "line", pts: [{ x: x1, y: y1 }, { x: x2, y: y2 }], color: "#222", layer: "molde" });
      i = j; continue;
    }
    i++;
  }
  return out;
}

/* ─────────────── Version diff ─────────────── */

function polysStats(pls: Poly[]) {
  const totalCm = pls.reduce((a, p) => a + pxToCm(polyLen(p.pts)), 0);
  return { count: pls.length, totalCm, byKind: pls.reduce<Record<string, number>>((a, p) => { a[p.kind] = (a[p.kind] || 0) + 1; return a; }, {}) };
}

function downloadFile(name: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

function ponto(e: React.PointerEvent<SVGSVGElement>, svg: SVGSVGElement): Pt {
  const r = svg.getBoundingClientRect();
  return { x: ((e.clientX - r.left) / r.width) * A4_W, y: ((e.clientY - r.top) / r.height) * A4_H };
}

/* ─────────────── Componente ─────────────── */

type Tool =
  | "select" | "line" | "spline" | "arc" | "spiral"
  | "offset" | "split" | "trim" | "tangent" | "measure";

const TOOL_HINTS: Record<Tool, string> = {
  select: "Clica numa peça para selecionar. Delete para apagar.",
  line: "Clica-arrasta para criar uma linha reta. Ativa Live Mirror para espelhar.",
  spline: "Clica em vários pontos; Enter/duplo-clique fecha a curva Catmull-Rom.",
  arc: "Define centro, raio (cm) e ângulos, depois clica para posicionar o centro (compasso).",
  spiral: "Define parâmetros e clica no centro (folhos em cascata).",
  offset: "Seleciona uma peça e aplica offset em cm (revelo/margem interior).",
  split: "Seleciona uma linha e divide em N partes iguais (casas de botão, franzido).",
  trim: "Clica numa peça para remover o segmento entre as duas interseções mais próximas.",
  tangent: "Clica no extremo de uma peça e depois no extremo de outra para as unir suavemente.",
  measure: "Clica-arrasta para medir distâncias em cm sem criar peça.",
};

export function CosturaEditor() {
  const ref = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [w, setW] = useMarcaDAgua();
  const sheet = useSheet();

  const [tool, setTool] = useState<Tool>("line");
  const [polys, setPolys] = useState<Poly[]>([]);
  const [history, setHistory] = useState<Poly[][]>([]);
  const [future, setFuture] = useState<Poly[][]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [liveMirror, setLiveMirror] = useState(false);
  const [snapIntersect, setSnapIntersect] = useState(true);
  const [snapEndpoints, setSnapEndpoints] = useState(true);
  const [snapAlign, setSnapAlign] = useState(true);
  const [gridOn, setGridOn] = useState(true);
  const [gridCm, setGridCm] = useState(1);
  const [annotate, setAnnotate] = useState(true);
  const [snapTolPx, setSnapTolPx] = useState(8);
  const [layerOpts, setLayerOpts] = useState({ molde: true, mirror: true, annotations: true, grid: false });
  const [diffIdx, setDiffIdx] = useState<number | null>(null);

  // Autosave & versioning
  const AUTOSAVE_KEY = "costura:autosave";
  const VERSIONS_KEY = "costura:versions";
  const [versions, setVersions] = useState<{ ts: number; polys: Poly[] }[]>(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem(VERSIONS_KEY) || "[]"); } catch { return []; }
  });
  const hydrated = useRef(false);
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    try {
      const raw = localStorage.getItem(AUTOSAVE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Poly[];
        if (Array.isArray(parsed) && parsed.length) setPolys(parsed);
      }
    } catch { /* ignore */ }
  }, []);
  useEffect(() => {
    if (!hydrated.current) return;
    const t = setTimeout(() => {
      try { localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(polys)); } catch { /* quota */ }
    }, 700);
    return () => clearTimeout(t);
  }, [polys]);
  function snapshotVersion() {
    const v = [{ ts: Date.now(), polys }, ...versions].slice(0, 12);
    setVersions(v);
    try { localStorage.setItem(VERSIONS_KEY, JSON.stringify(v)); } catch { /* quota */ }
    toast.success("Versão guardada.");
  }
  function restoreVersion(i: number) {
    const v = versions[i]; if (!v) return;
    push(v.polys);
    toast.success("Versão restaurada.");
  }

  // Decalque (image underlay)
  const [underlay, setUnderlay] = useState<string>("");
  const [underOpacity, setUnderOpacity] = useState(35);

  // Parâmetros de ferramentas
  const [arcRadiusCm, setArcRadiusCm] = useState(20);
  const [arcStart, setArcStart] = useState(180);
  const [arcEnd, setArcEnd] = useState(360);
  const [spiralR0, setSpiralR0] = useState(3);
  const [spiralR1, setSpiralR1] = useState(12);
  const [spiralTurns, setSpiralTurns] = useState(2.5);
  const [offsetCm, setOffsetCm] = useState(4);
  const [splitN, setSplitN] = useState(5);

  // Traço em progresso (line drag, spline point list, measure)
  const dragStart = useRef<Pt | null>(null);
  const [previewLine, setPreviewLine] = useState<{ a: Pt; b: Pt } | null>(null);
  const [splinePts, setSplinePts] = useState<Pt[]>([]);
  const [measureBox, setMeasureBox] = useState<{ a: Pt; b: Pt } | null>(null);

  // Tamanhos & custo
  const [tamanho, setTamanho] = useState<"S" | "M" | "L" | "XL">("M");
  const fator = tamanho === "S" ? 0.9 : tamanho === "M" ? 1 : tamanho === "L" ? 1.1 : 1.2;
  const materiais = useStore((s) => s.materiais);
  const [usados, setUsados] = useState<{ materialId: string; quantidade: number }[]>([]);
  const custoTotal = useMemo(() => usados.reduce((acc, u) => {
    const m = materiais.find((x) => x.id === u.materialId);
    return acc + (m ? m.precoCompra * u.quantidade : 0);
  }, 0), [usados, materiais]);

  const intersections = useMemo(() => allIntersections(polys), [polys]);

  function push(next: Poly[]) {
    setHistory((h) => [...h.slice(-99), polys]);
    setFuture([]);
    setPolys(next);
  }
  function undo() {
    setHistory((h) => {
      if (!h.length) return h;
      const prev = h[h.length - 1];
      setFuture((f) => [polys, ...f].slice(0, 99));
      setPolys(prev);
      return h.slice(0, -1);
    });
  }
  function redo() {
    setFuture((f) => {
      if (!f.length) return f;
      const nxt = f[0];
      setHistory((h) => [...h.slice(-99), polys]);
      setPolys(nxt);
      return f.slice(1);
    });
  }

  function snap(p: Pt): Pt {
    const candidates: Pt[] = [];
    if (snapIntersect) candidates.push(...intersections);
    if (snapEndpoints) {
      for (const pl of polys) {
        if (pl.pts.length) {
          candidates.push(pl.pts[0], pl.pts[pl.pts.length - 1]);
        }
      }
    }
    let best: Pt | null = null; let bd = snapTolPx;
    for (const q of candidates) {
      const d = dist(p, q); if (d < bd) { bd = d; best = q; }
    }
    if (best) return best;
    if (snapAlign) {
      let sx = p.x, sy = p.y; let fx = false, fy = false;
      const alignTol = Math.max(3, snapTolPx * 0.6);
      for (const pl of polys) {
        for (const q of [pl.pts[0], pl.pts[pl.pts.length - 1]]) {
          if (!q) continue;
          if (!fx && Math.abs(q.x - p.x) < alignTol) { sx = q.x; fx = true; }
          if (!fy && Math.abs(q.y - p.y) < alignTol) { sy = q.y; fy = true; }
        }
      }
      if (fx || fy) return { x: sx, y: sy };
    }
    return p;
  }

  function addPoly(kind: PolyKind, pts: Pt[], extra: Partial<Poly> = {}) {
    const p: Poly = { id: uid(), kind, pts, color: "#222", layer: "molde", ...extra };
    const mirror: Poly[] = liveMirror
      ? [{ id: uid(), kind, color: "#8b5cf6", layer: "mirror", pts: pts.map((q) => ({ x: A4_W - q.x, y: q.y })), ...extra }]
      : [];
    push([...polys, p, ...mirror]);
  }

  /* ─── Eventos do canvas ─── */
  const onDown = (e: React.PointerEvent<SVGSVGElement>) => {
    const p = snap(ponto(e, svgRef.current!));
    if (tool === "line" || tool === "measure") {
      dragStart.current = p;
      if (tool === "measure") setMeasureBox({ a: p, b: p });
      return;
    }
    if (tool === "spline") {
      setSplinePts((s) => [...s, p]);
      return;
    }
    if (tool === "arc") {
      const r = cmToPx(arcRadiusCm);
      const pts = arcSample(p.x, p.y, r, (arcStart * Math.PI) / 180, (arcEnd * Math.PI) / 180);
      addPoly("arc", pts, { label: `⌀${arcRadiusCm}cm` });
      return;
    }
    if (tool === "spiral") {
      const pts = spiralSample(p.x, p.y, cmToPx(spiralR0), cmToPx(spiralR1), spiralTurns);
      addPoly("spiral", pts, { label: `${spiralTurns}× espiral` });
      return;
    }
    if (tool === "select" || tool === "offset" || tool === "split" || tool === "trim" || tool === "tangent") {
      // pick nearest poly point
      let bestId: string | null = null; let bd = 12;
      polys.forEach((pl) => {
        for (const q of pl.pts) {
          const d = dist(p, q); if (d < bd) { bd = d; bestId = pl.id; }
        }
      });
      setSelectedId(bestId);
      if (bestId && tool === "trim") applyTrim(bestId, p);
      if (bestId && tool === "tangent") applyTangent(bestId, p);
      return;
    }
  };
  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragStart.current) return;
    const p = snap(ponto(e, svgRef.current!));
    if (tool === "line") setPreviewLine({ a: dragStart.current, b: p });
    if (tool === "measure") setMeasureBox({ a: dragStart.current, b: p });
  };
  const onUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragStart.current) return;
    const p = snap(ponto(e, svgRef.current!));
    if (tool === "line" && dist(dragStart.current, p) > 4) {
      addPoly("line", [dragStart.current, p]);
    }
    dragStart.current = null; setPreviewLine(null);
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && tool === "spline" && splinePts.length >= 2) {
      addPoly("spline", catmullRom(splinePts));
      setSplinePts([]);
    }
    if (e.key === "Delete" && selectedId) {
      push(polys.filter((x) => x.id !== selectedId));
      setSelectedId(null);
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") undo();
    if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === "y" || (e.shiftKey && e.key.toLowerCase() === "z"))) redo();
  };
  const onDoubleClick = () => {
    if (tool === "spline" && splinePts.length >= 2) {
      addPoly("spline", catmullRom(splinePts));
      setSplinePts([]);
    }
  };

  /* ─── Ações por seleção ─── */
  function applyOffset(dir: 1 | -1) {
    if (!selectedId) return toast.error("Seleciona uma peça primeiro.");
    const src = polys.find((x) => x.id === selectedId); if (!src) return;
    const off = offsetPolyline(src.pts, dir * cmToPx(offsetCm));
    push([...polys, { id: uid(), kind: "offset", pts: off, color: dir > 0 ? "#0ea5e9" : "#22c55e" }]);
    toast.success(`Offset ${dir > 0 ? "exterior" : "interior"} ${offsetCm} cm`);
  }
  function applySplit() {
    if (!selectedId) return toast.error("Seleciona uma peça primeiro.");
    const idx = polys.findIndex((x) => x.id === selectedId); if (idx < 0) return;
    const src = polys[idx];
    const marks = splitMarks(src.pts, splitN);
    const next = polys.slice(); next[idx] = { ...src, marks };
    push(next);
    toast.success(`${marks.length} marcadores igualmente espaçados`);
  }
  function applyTrim(id: string, near: Pt) {
    const idx = polys.findIndex((x) => x.id === id); if (idx < 0) return;
    const src = polys[idx];
    // interseções desta peça com todas as outras
    const hits: { pt: Pt; segIdx: number; t: number }[] = [];
    for (let a = 1; a < src.pts.length; a++) {
      const A0 = src.pts[a - 1], A1 = src.pts[a];
      polys.forEach((other) => {
        if (other.id === id) return;
        for (let b = 1; b < other.pts.length; b++) {
          const p = segIntersect(A0, A1, other.pts[b - 1], other.pts[b]);
          if (p) {
            const len = dist(A0, A1) || 1;
            hits.push({ pt: p, segIdx: a, t: dist(A0, p) / len });
          }
        }
      });
    }
    if (hits.length < 2) return toast.error("Precisa de ≥2 interseções com outras peças.");
    // ordena pela distância acumulada, escolhe as duas que envolvem o clique
    hits.sort((x, y) => (x.segIdx + x.t) - (y.segIdx + y.t));
    const posClick = hits.reduce((best, h) => dist(h.pt, near) < dist(best.pt, near) ? h : best, hits[0]);
    const centerIdx = hits.indexOf(posClick);
    const lo = hits[Math.max(0, centerIdx - 1)];
    const hi = hits[Math.min(hits.length - 1, centerIdx + 1)];
    // mantém partes antes de `lo` e depois de `hi`
    const before = src.pts.slice(0, lo.segIdx).concat([lo.pt]);
    const after = [hi.pt].concat(src.pts.slice(hi.segIdx));
    const next = polys.slice();
    next.splice(idx, 1,
      { ...src, id: uid(), pts: before },
      { ...src, id: uid(), pts: after },
    );
    push(next);
    toast.success("Segmento aparado entre interseções.");
  }
  const tangentPick = useRef<{ id: string; pt: Pt } | null>(null);
  function applyTangent(id: string, p: Pt) {
    const src = polys.find((x) => x.id === id); if (!src) return;
    // escolhe extremo mais próximo
    const first = src.pts[0], last = src.pts[src.pts.length - 1];
    const endpoint = dist(first, p) < dist(last, p) ? first : last;
    if (!tangentPick.current) {
      tangentPick.current = { id, pt: endpoint };
      toast("Clica agora no extremo da segunda peça.");
      return;
    }
    const a = tangentPick.current.pt;
    tangentPick.current = null;
    // curva de transição suave: Catmull-Rom com 4 pontos = tangente suave
    const mid1 = { x: a.x + (endpoint.x - a.x) * 0.33, y: a.y + (endpoint.y - a.y) * 0.33 };
    const mid2 = { x: a.x + (endpoint.x - a.x) * 0.66, y: a.y + (endpoint.y - a.y) * 0.66 };
    const pts = catmullRom([a, mid1, mid2, endpoint], 12);
    push([...polys, { id: uid(), kind: "tangent", pts, color: "#f59e0b" }]);
    toast.success("Tangente automática criada.");
  }

  /* ─── Custo × tamanho ─── */
  const totalCm = useMemo(
    () => polys.reduce((acc, p) => acc + pxToCm(polyLen(p.pts)) * fator, 0),
    [polys, fator],
  );

  // path helpers
  const toD = (pts: Pt[]) => pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div>
        <div className="mb-2 flex flex-wrap gap-1 rounded border bg-card p-1 text-[11px]" role="toolbar">
          <ToolBtn label="Selecionar" icon={<MousePointer2 className="h-3 w-3" />} active={tool === "select"} onClick={() => setTool("select")} />
          <ToolBtn label="Reta" icon={<Minus className="h-3 w-3" />} active={tool === "line"} onClick={() => setTool("line")} />
          <ToolBtn label="Spline" icon={<Spline className="h-3 w-3" />} active={tool === "spline"} onClick={() => setTool("spline")} />
          <ToolBtn label="Compasso" icon={<Compass className="h-3 w-3" />} active={tool === "arc"} onClick={() => setTool("arc")} />
          <ToolBtn label="Espiral" icon={<Waves className="h-3 w-3" />} active={tool === "spiral"} onClick={() => setTool("spiral")} />
          <ToolBtn label="Offset" icon={<GitCommitHorizontal className="h-3 w-3" />} active={tool === "offset"} onClick={() => setTool("offset")} />
          <ToolBtn label="Dividir" icon={<Split className="h-3 w-3" />} active={tool === "split"} onClick={() => setTool("split")} />
          <ToolBtn label="Aparar" icon={<Scissors className="h-3 w-3" />} active={tool === "trim"} onClick={() => setTool("trim")} />
          <ToolBtn label="Tangente" icon={<Spline className="h-3 w-3 rotate-45" />} active={tool === "tangent"} onClick={() => setTool("tangent")} />
          <ToolBtn label="Medir" icon={<Ruler className="h-3 w-3" />} active={tool === "measure"} onClick={() => setTool("measure")} />
          <div className="mx-1 w-px bg-border" />
          <ToolBtn label="Live Mirror" icon={<FlipHorizontal2 className="h-3 w-3" />} active={liveMirror} onClick={() => setLiveMirror((v) => !v)} />
          <ToolBtn label="Snap ⇔" icon={<Compass className="h-3 w-3" />} active={snapIntersect} onClick={() => setSnapIntersect((v) => !v)} />
          <ToolBtn label="Grelha" icon={<Compass className="h-3 w-3" />} active={gridOn} onClick={() => setGridOn((v) => !v)} />
          <ToolBtn label="Desfazer" icon={<Undo2 className="h-3 w-3" />} onClick={undo} />
          <ToolBtn label="Refazer" icon={<Redo2 className="h-3 w-3" />} onClick={redo} />
          <ToolBtn label="Limpar" icon={<Trash2 className="h-3 w-3" />} onClick={() => push([])} />
        </div>
        <p className="mb-2 rounded bg-muted/40 px-2 py-1 text-[11px] text-muted-foreground">{TOOL_HINTS[tool]}</p>
        <Card className="!bg-white opacity-100" style={{ backgroundColor: "#ffffff", opacity: 1 }}><CardContent className="p-3">
        <A4Stage innerRef={ref} watermark={w} size={sheet.size} orientacao={sheet.orientacao}>
          {underlay && (
            <img
              src={underlay}
              alt="decalque"
              className="pointer-events-none absolute inset-0 h-full w-full object-contain"
              style={{ opacity: underOpacity / 100 }}
            />
          )}
          <svg
            ref={svgRef}
            viewBox={`0 0 ${A4_W} ${A4_H}`}
            className="absolute inset-0 h-full w-full touch-none"
            tabIndex={0}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onDoubleClick={onDoubleClick}
            onKeyDown={onKey}
          >
            {gridOn && (
              <>
                <defs>
                  <pattern id="gridc" width={cmToPx(gridCm)} height={cmToPx(gridCm)} patternUnits="userSpaceOnUse">
                    <path d={`M ${cmToPx(gridCm)} 0 L 0 0 0 ${cmToPx(gridCm)}`} fill="none" stroke="#e5e7eb" strokeWidth="0.4" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#gridc)" />
              </>
            )}
            {liveMirror && (
              <line x1={A4_W / 2} y1={0} x2={A4_W / 2} y2={A4_H}
                    stroke="#8b5cf6" strokeDasharray="4 6" strokeWidth="0.6" />
            )}
            {polys.map((pl) => {
              const cm = (pxToCm(polyLen(pl.pts)) * fator).toFixed(1);
              const sel = pl.id === selectedId;
              return (
                <g key={pl.id}>
                  <path d={toD(pl.pts)} fill="none"
                        stroke={sel ? "#ef4444" : (pl.color ?? "#222")}
                        strokeWidth={sel ? 2 : 1.4}
                        transform={fator !== 1 ? `translate(${pl.pts[0]?.x ?? 0} ${pl.pts[0]?.y ?? 0}) scale(${fator}) translate(${-(pl.pts[0]?.x ?? 0)} ${-(pl.pts[0]?.y ?? 0)})` : undefined} />
                  {pl.marks?.map((m, i) => (
                    <circle key={i} cx={m.x} cy={m.y} r={3} fill="#f43f5e" stroke="white" strokeWidth={1} />
                  ))}
                  {pl.label && pl.pts[0] && (
                    <text x={pl.pts[0].x + 4} y={pl.pts[0].y - 4} fontSize="9" fill="#6b7280">{pl.label} · {cm}cm</text>
                  )}
                  {annotate && pl.pts.length >= 2 && pl.pts.slice(1).map((p, i) => {
                    const a = pl.pts[i]; const mx = (a.x + p.x) / 2; const my = (a.y + p.y) / 2;
                    const len = pxToCm(dist(a, p)) * fator;
                    if (len < 0.6) return null;
                    return (
                      <text key={"seg" + i} x={mx} y={my - 3} fontSize="7" fill="#64748b" textAnchor="middle">
                        {len.toFixed(1)}
                      </text>
                    );
                  })}
                  {annotate && pl.pts.length >= 3 && pl.pts.slice(1, -1).map((p, i) => {
                    const a = pl.pts[i], c = pl.pts[i + 2];
                    const v1x = a.x - p.x, v1y = a.y - p.y;
                    const v2x = c.x - p.x, v2y = c.y - p.y;
                    const cos = (v1x * v2x + v1y * v2y) / ((Math.hypot(v1x, v1y) || 1) * (Math.hypot(v2x, v2y) || 1));
                    const ang = Math.round(Math.acos(Math.max(-1, Math.min(1, cos))) * 180 / Math.PI);
                    if (ang >= 175) return null;
                    return (
                      <text key={"ang" + i} x={p.x + 4} y={p.y + 8} fontSize="7" fill="#94a3b8">{ang}°</text>
                    );
                  })}
                </g>
              );
            })}
            {/* linha em pré-visualização */}
            {previewLine && (
              <line x1={previewLine.a.x} y1={previewLine.a.y} x2={previewLine.b.x} y2={previewLine.b.y}
                    stroke="#0ea5e9" strokeDasharray="3 3" strokeWidth="1.2" />
            )}
            {/* pontos spline em progresso */}
            {tool === "spline" && splinePts.length > 0 && (
              <g>
                <path d={toD(catmullRom(splinePts))} fill="none" stroke="#a78bfa" strokeDasharray="2 3" strokeWidth="1.2" />
                {splinePts.map((p, i) => (
                  <circle key={i} cx={p.x} cy={p.y} r={3} fill="#a78bfa" />
                ))}
              </g>
            )}
            {/* medidor */}
            {measureBox && (
              <g>
                <line x1={measureBox.a.x} y1={measureBox.a.y} x2={measureBox.b.x} y2={measureBox.b.y}
                      stroke="#f59e0b" strokeWidth="1" strokeDasharray="4 3" />
                <text x={(measureBox.a.x + measureBox.b.x) / 2} y={(measureBox.a.y + measureBox.b.y) / 2 - 6}
                      fontSize="10" fill="#b45309" textAnchor="middle">
                  {pxToCm(dist(measureBox.a, measureBox.b)).toFixed(1)} cm
                </text>
              </g>
            )}
            {/* interseções */}
            {snapIntersect && intersections.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={2.2} fill="none" stroke="#10b981" strokeWidth="0.8" />
            ))}
          </svg>
        </A4Stage>
        </CardContent></Card>
      </div>

      <div className="space-y-3">
        <SheetControls {...sheet} />

        <Card><CardContent className="space-y-2 p-3">
          <div className="text-xs font-medium">Grelha & Snap</div>
          <Label className="text-[11px]">Grelha ({gridCm} cm)</Label>
          <div className="flex gap-1">
            {[0.5, 1, 2, 5].map((g) => (
              <Button key={g} size="sm" variant={gridCm === g ? "default" : "outline"} onClick={() => setGridCm(g)}>{g}</Button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-1 pt-1">
            <Button size="sm" variant={snapEndpoints ? "default" : "outline"} onClick={() => setSnapEndpoints((v) => !v)}>Snap extremos</Button>
            <Button size="sm" variant={snapAlign ? "default" : "outline"} onClick={() => setSnapAlign((v) => !v)}>Alinhar H/V</Button>
            <Button size="sm" variant={snapIntersect ? "default" : "outline"} onClick={() => setSnapIntersect((v) => !v)}>Interseções</Button>
            <Button size="sm" variant={annotate ? "default" : "outline"} onClick={() => setAnnotate((v) => !v)}>Cotas auto</Button>
          </div>
          <Label className="text-[11px] pt-1">Tolerância snap · {snapTolPx}px ({pxToCm(snapTolPx).toFixed(2)} cm)</Label>
          <Slider value={[snapTolPx]} min={2} max={30} step={1} onValueChange={(v) => setSnapTolPx(v[0])} />
        </CardContent></Card>

        <Card><CardContent className="space-y-2 p-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-medium">Versões do molde</div>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" onClick={snapshotVersion}><Save className="mr-1 h-3 w-3" />Guardar</Button>
            </div>
          </div>
          {versions.length === 0 && <p className="text-[10px] text-muted-foreground">Autosave ativo. Cria um ponto de restauro sempre que quiseres.</p>}
          <div className="max-h-40 space-y-1 overflow-auto">
            {versions.map((v, i) => (
              <div key={v.ts} className="flex items-center justify-between rounded bg-muted/40 px-2 py-1 text-[10px]">
                <span>#{versions.length - i} · {new Date(v.ts).toLocaleString()}</span>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]" onClick={() => setDiffIdx(i)}><GitCompare className="mr-1 h-3 w-3" />Diff</Button>
                  <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]" onClick={() => restoreVersion(i)}><History className="mr-1 h-3 w-3" />Restaurar</Button>
                </div>
              </div>
            ))}
          </div>
          {diffIdx !== null && versions[diffIdx] && (() => {
            const cur = polysStats(polys); const old = polysStats(versions[diffIdx].polys);
            const kinds = Array.from(new Set([...Object.keys(cur.byKind), ...Object.keys(old.byKind)]));
            return (
              <div className="mt-1 rounded border bg-muted/30 p-2 text-[10px]">
                <div className="mb-1 flex items-center justify-between">
                  <b>Diferenças vs versão #{versions.length - diffIdx}</b>
                  <button className="underline" onClick={() => setDiffIdx(null)}>fechar</button>
                </div>
                <div>Peças: {old.count} → {cur.count} ({cur.count - old.count >= 0 ? "+" : ""}{cur.count - old.count})</div>
                <div>Linhas: {old.totalCm.toFixed(1)} cm → {cur.totalCm.toFixed(1)} cm</div>
                <div className="pt-1">
                  {kinds.map((k) => {
                    const a = old.byKind[k] || 0, b = cur.byKind[k] || 0;
                    if (a === b) return null;
                    return <div key={k}>· {k}: {a} → {b}</div>;
                  })}
                </div>
              </div>
            );
          })()}
        </CardContent></Card>

        <Card><CardContent className="space-y-2 p-3">
          <div className="text-xs font-medium">Exportar / Importar CAD</div>
          <div className="space-y-1 rounded border p-2">
            <div className="text-[10px] font-medium text-muted-foreground">Camadas a incluir</div>
            {([["molde","Molde"],["mirror","Mirror"],["annotations","Cotas/marcadores"],["grid","Grelha"]] as const).map(([k,l]) => (
              <label key={k} className="flex items-center gap-2 text-[11px]">
                <Checkbox checked={(layerOpts as any)[k]} onCheckedChange={(v) => setLayerOpts((s) => ({ ...s, [k]: !!v }))} />
                {l}
              </label>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-1">
            <Button size="sm" variant="outline" onClick={() => downloadFile("molde.svg", polysToSVGLayered(polys, A4_W, A4_H, { ...layerOpts, gridCm }), "image/svg+xml")}>
              <FileDown className="mr-1 h-3 w-3" />SVG
            </Button>
            <Button size="sm" variant="outline" onClick={() => downloadFile("molde.dxf", polysToDXFLayered(polys, { ...layerOpts, gridCm, w: A4_W, h: A4_H }), "application/dxf")}>
              <FileDown className="mr-1 h-3 w-3" />DXF
            </Button>
          </div>
          <div className="pt-1">
            <Label className="text-[11px]">Importar SVG / DXF</Label>
            <Input type="file" accept=".svg,.dxf,image/svg+xml,application/dxf" onChange={(e) => {
              const f = e.target.files?.[0]; if (!f) return;
              const r = new FileReader();
              r.onload = () => {
                try {
                  const raw = String(r.result);
                  const parsed = f.name.toLowerCase().endsWith(".dxf") ? parseDXF(raw) : parseSVG(raw);
                  if (!parsed.length) return toast.error("Ficheiro sem geometria reconhecida.");
                  push([...polys, ...parsed]);
                  toast.success(`${parsed.length} peça(s) importadas.`);
                } catch (err) { toast.error(String((err as Error).message)); }
              };
              r.readAsText(f);
              e.currentTarget.value = "";
            }} />
          </div>
          <p className="text-[10px] text-muted-foreground">Export com camadas (Inkscape/AutoCAD). Import cria LINE/polyline/path como peças novas.</p>
        </CardContent></Card>

        <Card><CardContent className="space-y-2 p-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Tamanho</Label>
              <Select value={tamanho} onValueChange={(v) => setTamanho(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["S", "M", "L", "XL"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Total linhas</Label>
              <div className="rounded border bg-muted/40 px-2 py-1 text-[11px]">{totalCm.toFixed(1)} cm</div>
            </div>
          </div>
        </CardContent></Card>

        {(tool === "arc") && (
          <Card><CardContent className="space-y-2 p-3">
            <div className="text-xs font-medium">Compasso (arco por raio)</div>
            <Label className="text-[11px]">Raio ({arcRadiusCm} cm)</Label>
            <Slider value={[arcRadiusCm]} min={1} max={80} step={0.5} onValueChange={(v) => setArcRadiusCm(v[0])} />
            <div className="grid grid-cols-2 gap-1">
              <div>
                <Label className="text-[11px]">Início ({arcStart}°)</Label>
                <Slider value={[arcStart]} min={0} max={360} step={1} onValueChange={(v) => setArcStart(v[0])} />
              </div>
              <div>
                <Label className="text-[11px]">Fim ({arcEnd}°)</Label>
                <Slider value={[arcEnd]} min={0} max={720} step={1} onValueChange={(v) => setArcEnd(v[0])} />
              </div>
            </div>
          </CardContent></Card>
        )}

        {(tool === "spiral") && (
          <Card><CardContent className="space-y-2 p-3">
            <div className="text-xs font-medium">Gerador de espiral</div>
            <Label className="text-[11px]">Raio inicial ({spiralR0} cm)</Label>
            <Slider value={[spiralR0]} min={0.5} max={30} step={0.5} onValueChange={(v) => setSpiralR0(v[0])} />
            <Label className="text-[11px]">Raio final ({spiralR1} cm)</Label>
            <Slider value={[spiralR1]} min={1} max={40} step={0.5} onValueChange={(v) => setSpiralR1(v[0])} />
            <Label className="text-[11px]">Voltas ({spiralTurns.toFixed(1)}×)</Label>
            <Slider value={[spiralTurns]} min={0.5} max={8} step={0.1} onValueChange={(v) => setSpiralTurns(v[0])} />
          </CardContent></Card>
        )}

        {(tool === "offset") && (
          <Card><CardContent className="space-y-2 p-3">
            <div className="text-xs font-medium">Offset / Revelo</div>
            <Label className="text-[11px]">Distância ({offsetCm} cm)</Label>
            <Slider value={[offsetCm]} min={0.2} max={20} step={0.1} onValueChange={(v) => setOffsetCm(v[0])} />
            <div className="flex gap-1">
              <Button size="sm" variant="outline" onClick={() => applyOffset(1)}>Exterior (margem)</Button>
              <Button size="sm" variant="outline" onClick={() => applyOffset(-1)}>Interior (revelo)</Button>
            </div>
          </CardContent></Card>
        )}

        {(tool === "split") && (
          <Card><CardContent className="space-y-2 p-3">
            <div className="text-xs font-medium">Dividir em N partes iguais</div>
            <Label className="text-[11px]">N = {splitN}</Label>
            <Slider value={[splitN]} min={2} max={30} step={1} onValueChange={(v) => setSplitN(v[0])} />
            <Button size="sm" variant="outline" onClick={applySplit}><Plus className="mr-1 h-3 w-3" />Colocar marcadores</Button>
          </CardContent></Card>
        )}

        <Card><CardContent className="space-y-2 p-3">
          <div className="text-xs font-medium">Decalque de imagem</div>
          <Input type="file" accept="image/*" onChange={(e) => {
            const f = e.target.files?.[0]; if (!f) return;
            const r = new FileReader(); r.onload = () => setUnderlay(r.result as string); r.readAsDataURL(f);
          }} />
          {underlay && (
            <>
              <Label className="text-[11px]">Opacidade ({underOpacity}%)</Label>
              <Slider value={[underOpacity]} min={5} max={90} step={1} onValueChange={(v) => setUnderOpacity(v[0])} />
              <Button size="sm" variant="ghost" onClick={() => setUnderlay("")}><Trash2 className="mr-1 h-3 w-3" />Remover decalque</Button>
            </>
          )}
          <p className="text-[10px] text-muted-foreground">
            Importa uma fotografia de um molde antigo ou esboço e decalca por cima com as ferramentas.
          </p>
        </CardContent></Card>

        <Card><CardContent className="space-y-2 p-3">
          <div className="font-display font-semibold text-sm">Custo do Projeto</div>
          {usados.map((u, i) => {
            const m = materiais.find((x) => x.id === u.materialId);
            return (
              <div key={i} className="grid grid-cols-[1fr_70px_auto] items-center gap-1">
                <Select value={u.materialId} onValueChange={(v) => setUsados((s) => s.map((x, j) => j === i ? { ...x, materialId: v } : x))}>
                  <SelectTrigger className="h-8"><SelectValue placeholder="Material" /></SelectTrigger>
                  <SelectContent>{materiais.map((mm) => <SelectItem key={mm.id} value={mm.id}>{mm.nome} ({mm.unidade})</SelectItem>)}</SelectContent>
                </Select>
                <Input type="number" className="h-8" value={u.quantidade}
                       onChange={(e) => setUsados((s) => s.map((x, j) => j === i ? { ...x, quantidade: +e.target.value } : x))} />
                <Button size="icon" variant="ghost" onClick={() => setUsados((s) => s.filter((_, j) => j !== i))}><Trash2 className="h-3 w-3" /></Button>
                {m && <div className="col-span-3 text-[10px] text-muted-foreground">{u.quantidade} × {formatEUR(m.precoCompra)} = {formatEUR(u.quantidade * m.precoCompra)}</div>}
              </div>
            );
          })}
          <Button size="sm" variant="outline" onClick={() => setUsados((s) => [...s, { materialId: materiais[0]?.id ?? "", quantidade: 1 }])}>
            <Plus className="mr-1 h-3 w-3" />Material
          </Button>
          <div className="border-t pt-2 text-sm">Total: <span className="font-display font-bold">{formatEUR(custoTotal)}</span></div>
        </CardContent></Card>

        <WatermarkControls w={w} set={setW} />
        <ExportPanel targetRef={ref} defaultArea="Costura" defaultTitulo={`Molde ${tamanho}`} size={sheet.size} orientacao={sheet.orientacao} />
      </div>
    </div>
  );
}

function ToolBtn({ label, icon, active, onClick }: { label: string; icon: React.ReactNode; active?: boolean; onClick: () => void }) {
  return (
    <button type="button"
      className={`inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] ${active ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
      onClick={onClick} title={label}>
      {icon}<span className="hidden sm:inline">{label}</span>
    </button>
  );
}