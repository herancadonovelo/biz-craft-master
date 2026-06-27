import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useStore, formatEUR } from "@/lib/store";
import {
  A4Stage, ExportPanel, Watermark, WatermarkControls, useMarcaDAgua,
} from "@/components/A4Export";
import {
  Plus, Trash2, Eraser, MousePointer2, Minus, Spline, Type, Ruler,
  Combine, Sparkles, Grid3x3, Magnet, RotateCw, ArrowRightCircle, Hash, Tag,
  Pen, Link2, Move, ZoomIn, ZoomOut,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/ferramentas-tecnicas")({
  head: () => ({ meta: [{ title: "Ferramentas Técnicas: Editores" }] }),
  component: FerramentasPage,
});

function FerramentasPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Ferramentas Técnicas: Editores"
        description="Os 5 editores partilham tela A4, marca d'água configurável e exportação para Biblioteca, PDF e Imprimir." />
      <Tabs defaultValue="instrucoes">
        <TabsList className="flex h-auto w-full flex-wrap">
          <TabsTrigger value="instrucoes">Instruções de uso</TabsTrigger>
          <TabsTrigger value="tricotin">Editor de moldes: Tricotin</TabsTrigger>
          <TabsTrigger value="amigurumi">Editor de Receitas: Amigurumis & Crochê</TabsTrigger>
          <TabsTrigger value="costura">Editor de Moldes: Costura</TabsTrigger>
          <TabsTrigger value="ponto-cruz">Editor de Gráficos: Ponto Cruz</TabsTrigger>
          <TabsTrigger value="bordado">Editor de Padrões: Bordado</TabsTrigger>
        </TabsList>
        <TabsContent value="instrucoes" className="mt-24"><InstrucoesTab /></TabsContent>
        <TabsContent value="tricotin" className="mt-24"><TricotinTab /></TabsContent>
        <TabsContent value="amigurumi" className="mt-24"><AmigurumiTab /></TabsContent>
        <TabsContent value="costura" className="mt-24"><CosturaTab /></TabsContent>
        <TabsContent value="ponto-cruz" className="mt-24"><PontoCruzTab /></TabsContent>
        <TabsContent value="bordado" className="mt-24"><BordadoTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function InstrucoesTab() {
  const items = [
    { t: "Editor de moldes: Tricotin", d: "Tela interativa para desenhar e moldar esquemas de arame para i-cord/tricotin. Usa o lápis para traçar o caminho e o A4 garante escala real ao imprimir." },
    { t: "Editor de Receitas: Amigurumis & Crochê", d: "Processador de texto e tabelas técnicas para escrever padrões, contar pontos linha-a-linha e adicionar notas de produção. Pensa em \"livro de receita\"." },
    { t: "Editor de Moldes: Costura", d: "Estúdio vetorial para moldes de vestuário, com linhas retas, curvas, introdução manual de medidas em cm e graduação por tamanhos (S, M, L, XL). Inclui cálculo financeiro." },
    { t: "Editor de Gráficos: Ponto Cruz", d: "Grelha pixel-art para criar gráficos quadriculados com cores DMC/Anchor. Permite alternar entre vista a cor e vista de símbolos a preto e branco para leitura em papel." },
    { t: "Editor de Padrões: Bordado", d: "Canvas livre para importar imagens, traçar contornos e definir riscos para bordado à mão." },
  ];
  return (
    <Card><CardContent className="p-6 space-y-5">
      {items.map((i) => (
        <div key={i.t}>
          <h3 className="font-display text-lg font-semibold">{i.t}</h3>
          <p className="text-sm text-muted-foreground mt-1">{i.d}</p>
        </div>
      ))}
    </CardContent></Card>
  );
}

/* ============================ TRICOTIN ============================ */
/**
 * Editor Vetorial Avançado para Tricotin (i-cord).
 * Suporta: linha reta, curva Bézier suavizada, texto vetorial, transformações
 * (mover/rodar/redimensionar), réguas, snap-to-grid, união de paths, biblioteca
 * de silhuetas, medição automática do comprimento total e preview realista.
 */

type ObjBase = { id: string; x: number; y: number; rot: number; scale: number; stroke: string; strokeWidth: number };
type PathObj = ObjBase & { kind: "path"; d: string; pts?: { x: number; y: number }[]; mode?: "line" | "curve"; closed?: boolean };
type TextObj = ObjBase & { kind: "text"; text: string; font: string; size: number };
type AnyObj = PathObj | TextObj;

const A4_W = 595;
const A4_H = 842;
const PX_PER_CM = A4_W / 21; // ~28.33 px/cm
const PX_PER_MM = PX_PER_CM / 10;

const FONTES_50 = [
  "Inter","Roboto","Open Sans","Lato","Montserrat","Poppins","Oswald","Raleway","Nunito","Merriweather",
  "Playfair Display","Source Sans Pro","PT Sans","PT Serif","Roboto Condensed","Roboto Slab","Ubuntu","Bebas Neue","Cormorant Garamond","Lora",
  "Quicksand","Fira Sans","Work Sans","Mukta","Karla","Manrope","DM Sans","Inconsolata","Josefin Sans","Archivo",
  "Barlow","Cabin","Crimson Text","EB Garamond","Hind","Heebo","Libre Baskerville","Maven Pro","Noto Sans","Noto Serif",
  "Overpass","Pacifico","Permanent Marker","Pathway Gothic One","Questrial","Rubik","Signika","Tinos","Vollkorn","Yanone Kaffeesatz",
];

const SILHUETAS: { nome: string; d: string }[] = [
  { nome: "Coração",    d: "M50,85 C20,60 5,40 25,20 C40,8 50,25 50,35 C50,25 60,8 75,20 C95,40 80,60 50,85 Z" },
  { nome: "Estrela",    d: "M50,5 L61,38 L96,38 L67,58 L78,92 L50,72 L22,92 L33,58 L4,38 L39,38 Z" },
  { nome: "Nuvem",      d: "M20,60 C5,60 5,40 20,40 C20,25 45,20 50,35 C58,20 80,28 80,45 C95,45 95,65 80,65 L25,65 C20,65 20,60 20,60 Z" },
  { nome: "Balão",      d: "M50,10 C70,10 80,30 80,45 C80,65 60,75 50,80 C40,75 20,65 20,45 C20,30 30,10 50,10 Z M48,80 L52,80 L54,92 L46,92 Z" },
  { nome: "Urso",       d: "M30,30 a8,8 0 1,0 0,-1 M70,30 a8,8 0 1,0 0,-1 M50,55 C25,55 20,80 50,85 C80,80 75,55 50,55 Z M30,55 C20,55 15,40 25,38 C35,38 35,50 30,55 Z M70,55 C80,55 85,40 75,38 C65,38 65,50 70,55 Z" },
  { nome: "Orelhas",    d: "M25,40 C15,15 35,5 40,30 Z M75,40 C85,15 65,5 60,30 Z" },
  { nome: "Lua",        d: "M65,15 C40,15 30,40 45,65 C25,55 20,25 45,10 C55,5 60,10 65,15 Z" },
  { nome: "Letra A",    d: "M20,90 L50,10 L80,90 M30,65 L70,65" },
  { nome: "Letra B",    d: "M25,10 L25,90 L55,90 C75,90 75,55 55,50 C75,45 75,10 55,10 Z" },
  { nome: "Letra C",    d: "M85,25 C70,5 25,10 25,50 C25,90 70,95 85,75" },
];

function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return "";
  // Simplificação: tomar 1 a cada N para reduzir ruído
  const step = Math.max(1, Math.floor(pts.length / 40));
  const p = pts.filter((_, i) => i % step === 0 || i === pts.length - 1);
  if (p.length < 3) return `M ${p[0].x} ${p[0].y} L ${p[p.length - 1].x} ${p[p.length - 1].y}`;
  let d = `M ${p[0].x} ${p[0].y}`;
  for (let i = 1; i < p.length - 1; i++) {
    const mx = (p[i].x + p[i + 1].x) / 2;
    const my = (p[i].y + p[i + 1].y) / 2;
    d += ` Q ${p[i].x} ${p[i].y} ${mx} ${my}`;
  }
  d += ` T ${p[p.length - 1].x} ${p[p.length - 1].y}`;
  return d;
}

function pathLength(d: string): number {
  if (typeof document === "undefined") return 0;
  const ns = "http://www.w3.org/2000/svg";
  const el = document.createElementNS(ns, "path");
  el.setAttribute("d", d);
  try { return el.getTotalLength(); } catch { return 0; }
}

function snap(v: number, on: boolean, step = PX_PER_CM / 2) {
  return on ? Math.round(v / step) * step : v;
}

function TricotinTab() {
  type NodeType = "start" | "straight" | "curve";
  type PtNode = { id: string; x: number; y: number; type: NodeType; ctrlX?: number; ctrlY?: number };
  type Mode = "select" | "straight" | "curve";

  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [nodes, setNodes] = React.useState<PtNode[]>([]);
  const [isClosedPath, setIsClosedPath] = React.useState(false);
  const [lineWidthTricotin, setLineWidthTricotin] = React.useState(12);
  const [mode, setMode] = React.useState<Mode>("straight");
  // Snapping options (opt-in)
  const [snapGridOn, setSnapGridOn] = React.useState(false);
  const [gridStepCm, setGridStepCm] = React.useState<0.5 | 1>(0.5);
  const [snapAngleOn, setSnapAngleOn] = React.useState(false);
  const [angleStep, setAngleStep] = React.useState<15 | 45 | 90>(15);
  // Calibração: régua mm/cm sobreposta (1:1 com A4 quando impresso)
  const [showRuler, setShowRuler] = React.useState(false);
  const [printRuler, setPrintRuler] = React.useState(false);
  const dragRef = React.useRef<
    | { kind: "main" | "ctrl"; id: string }
    | { kind: "segment"; aId: string; bId: string }
    | null
  >(null);
  const didDragRef = React.useRef(false);

  // A4 portrait proportion (1 : 1.414). Use A4_W (595px) so PX_PER_CM stays exact.
  const W = A4_W, H = A4_H, HIT = 12;

  // ---------- Undo / Redo ----------
  type Snap = { nodes: PtNode[]; isClosedPath: boolean };
  const undoRef = React.useRef<Snap[]>([]);
  const redoRef = React.useRef<Snap[]>([]);
  const [, forceRender] = React.useState(0);
  const snapshot = React.useCallback((): Snap => ({
    nodes: nodes.map((n) => ({ ...n })),
    isClosedPath,
  }), [nodes, isClosedPath]);
  const pushHistory = React.useCallback(() => {
    undoRef.current.push(snapshot());
    if (undoRef.current.length > 100) undoRef.current.shift();
    redoRef.current = [];
    forceRender((v) => v + 1);
  }, [snapshot]);
  const apply = (s: Snap) => {
    setNodes(s.nodes.map((n) => ({ ...n })));
    setIsClosedPath(s.isClosedPath);
  };
  const undo = () => {
    const prev = undoRef.current.pop();
    if (!prev) return;
    redoRef.current.push(snapshot());
    apply(prev);
    forceRender((v) => v + 1);
  };
  const redo = () => {
    const next = redoRef.current.pop();
    if (!next) return;
    undoRef.current.push(snapshot());
    apply(next);
    forceRender((v) => v + 1);
  };

  // ---------- Save / Load ----------
  // ---------- Saved molds (LocalStorage list) ----------
  type SavedMold = { id: string; name: string; nodes: PtNode[]; isClosedPath: boolean; lineWidthTricotin: number; savedAt: number };
  const STORAGE_KEY = "tricotin-molds-v1";
  const readSaved = (): SavedMold[] => {
    try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; }
  };
  const writeSaved = (arr: SavedMold[]) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(arr)); } catch { /* noop */ }
  };
  const [savedMolds, setSavedMolds] = React.useState<SavedMold[]>(() => (typeof window !== "undefined" ? readSaved() : []));
  const saveToApp = () => {
    if (nodes.length === 0) { alert("Nada para guardar."); return; }
    const name = window.prompt("Nome do molde:", `Molde ${new Date().toLocaleString()}`);
    if (!name) return;
    const item: SavedMold = { id: Math.random().toString(36).slice(2, 9), name, nodes, isClosedPath, lineWidthTricotin, savedAt: Date.now() };
    const next = [item, ...savedMolds];
    setSavedMolds(next); writeSaved(next);
    alert(`Guardado como "${name}".`);
  };
  const loadSaved = (id: string) => {
    const item = savedMolds.find((m) => m.id === id); if (!item) return;
    pushHistory();
    setNodes(item.nodes.map((n) => ({ ...n })));
    setIsClosedPath(item.isClosedPath);
    setLineWidthTricotin(item.lineWidthTricotin);
  };
  const deleteSaved = (id: string) => {
    if (!confirm("Apagar este molde guardado?")) return;
    const next = savedMolds.filter((m) => m.id !== id);
    setSavedMolds(next); writeSaved(next);
  };

  // ---------- Render clean (no grid, no handles) — used for PNG/print ----------
  const renderClean = (target: HTMLCanvasElement) => {
    target.width = W; target.height = H;
    const ctx = target.getContext("2d"); if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    if (nodes.length === 0) return;
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.strokeStyle = "#000000"; ctx.lineWidth = lineWidthTricotin;
    ctx.beginPath();
    ctx.moveTo(nodes[0].x, nodes[0].y);
    for (let i = 1; i < nodes.length; i++) {
      const n = nodes[i];
      if (n.type === "curve" && n.ctrlX != null && n.ctrlY != null) ctx.quadraticCurveTo(n.ctrlX, n.ctrlY, n.x, n.y);
      else ctx.lineTo(n.x, n.y);
    }
    if (isClosedPath && nodes.length > 1) {
      const first = nodes[0];
      if (first.type === "curve" && first.ctrlX != null && first.ctrlY != null) ctx.quadraticCurveTo(first.ctrlX, first.ctrlY, first.x, first.y);
      else ctx.lineTo(first.x, first.y);
    }
    ctx.stroke();
  };

  // ---------- Régua mm/cm (calibração) ----------
  // Desenha duas réguas (topo + esquerda) ao longo de toda a área A4.
  // Tick 1mm (curto), 5mm (médio), 10mm = 1cm (longo, com número).
  // Inclui ainda uma barra de verificação de 100 mm (10 cm) com etiqueta:
  // se medires com régua física e der 10,0 cm => px↔mm está 1:1.
  const drawRuler = (ctx: CanvasRenderingContext2D) => {
    const BAND = 22; // espessura da régua em px (~7,8mm) — fora da área útil
    ctx.save();
    // Fundo das réguas
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.fillRect(0, 0, W, BAND);
    ctx.fillRect(0, 0, BAND, H);
    ctx.strokeStyle = "#111";
    ctx.fillStyle = "#111";
    ctx.lineWidth = 1;
    ctx.font = "9px ui-sans-serif, system-ui, sans-serif";
    ctx.textBaseline = "top";
    // Linha base das réguas
    ctx.beginPath();
    ctx.moveTo(0, BAND + 0.5); ctx.lineTo(W, BAND + 0.5);
    ctx.moveTo(BAND + 0.5, 0); ctx.lineTo(BAND + 0.5, H);
    ctx.stroke();
    // Topo: 0..210 mm
    for (let mm = 0; mm <= 210; mm++) {
      const x = BAND + mm * PX_PER_MM;
      if (x > W) break;
      const h = mm % 10 === 0 ? 12 : mm % 5 === 0 ? 8 : 4;
      ctx.beginPath();
      ctx.moveTo(x + 0.5, BAND);
      ctx.lineTo(x + 0.5, BAND - h);
      ctx.stroke();
      if (mm % 10 === 0 && mm > 0) {
        ctx.fillText(String(mm / 10), x + 1, 2);
      }
    }
    // Esquerda: 0..297 mm
    ctx.textBaseline = "alphabetic";
    for (let mm = 0; mm <= 297; mm++) {
      const y = BAND + mm * PX_PER_MM;
      if (y > H) break;
      const h = mm % 10 === 0 ? 12 : mm % 5 === 0 ? 8 : 4;
      ctx.beginPath();
      ctx.moveTo(BAND, y + 0.5);
      ctx.lineTo(BAND - h, y + 0.5);
      ctx.stroke();
      if (mm % 10 === 0 && mm > 0) {
        ctx.save();
        ctx.translate(8, y + 3);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(String(mm / 10), 0, 0);
        ctx.restore();
      }
    }
    // Barra de verificação 10 cm (100 mm) — canto inferior esquerdo da área útil
    const barLen = 100 * PX_PER_MM;
    const barX = BAND + 20;
    const barY = H - 28;
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#111";
    ctx.beginPath();
    ctx.moveTo(barX, barY); ctx.lineTo(barX + barLen, barY);
    ctx.moveTo(barX, barY - 6); ctx.lineTo(barX, barY + 6);
    ctx.moveTo(barX + barLen, barY - 6); ctx.lineTo(barX + barLen, barY + 6);
    ctx.stroke();
    // ticks mm na barra
    ctx.lineWidth = 1;
    for (let mm = 0; mm <= 100; mm++) {
      const x = barX + mm * PX_PER_MM;
      const h = mm % 10 === 0 ? 6 : mm % 5 === 0 ? 4 : 2;
      ctx.beginPath();
      ctx.moveTo(x + 0.5, barY); ctx.lineTo(x + 0.5, barY - h);
      ctx.stroke();
    }
    ctx.fillStyle = "#111";
    ctx.font = "10px ui-sans-serif, system-ui, sans-serif";
    ctx.textBaseline = "top";
    ctx.fillText("Verificação: 100 mm (10 cm) — mede com régua física", barX, barY + 6);
    ctx.restore();
  };

  // ---------- Export: JSON ----------
  const exportJSON = () => {
    const payload = { version: 1, nodes, isClosedPath, lineWidthTricotin, pxPerCm: PX_PER_CM, canvas: { w: W, h: H } };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `molde-tricotin-${Date.now()}.json`;
    a.click(); URL.revokeObjectURL(url);
  };
  // Load .json file from device into editor
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const importJSON = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        if (!Array.isArray(data.nodes)) throw new Error("inválido");
        pushHistory();
        setNodes(data.nodes);
        setIsClosedPath(!!data.isClosedPath);
        if (typeof data.lineWidthTricotin === "number") setLineWidthTricotin(data.lineWidthTricotin);
      } catch { alert("Ficheiro inválido."); }
    };
    reader.readAsText(file);
  };
  // ---------- Export: PNG (transparent) ----------
  const exportPNG = () => {
    const off = document.createElement("canvas");
    renderClean(off);
    off.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `molde-tricotin-${Date.now()}.png`;
      a.click(); URL.revokeObjectURL(url);
    }, "image/png");
  };
  // ---------- Print: A4 real size ----------
  const printMold = () => {
    const off = document.createElement("canvas");
    renderClean(off);
    const dataUrl = off.toDataURL("image/png");
    // Build a top-level overlay attached directly to <body> so the print CSS
    // can reliably hide everything else.
    const host = document.createElement("div");
    host.id = "tricotin-print-host";
    host.innerHTML = `<img src="${dataUrl}" alt="Molde Tricotin" style="width:21cm;height:29.7cm;display:block;page-break-inside:avoid;" />`;
    document.body.appendChild(host);
    document.body.classList.add("tricotin-printing");
    const cleanup = () => {
      document.body.classList.remove("tricotin-printing");
      host.remove();
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
    setTimeout(() => window.print(), 80);
  };

  // Keyboard shortcuts
  React.useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const meta = e.ctrlKey || e.metaKey;
      if (!meta) return;
      if (e.key === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
      else if ((e.key === "z" && e.shiftKey) || e.key === "y") { e.preventDefault(); redo(); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) * c.width) / r.width,
      y: ((e.clientY - r.top) * c.height) / r.height,
    };
  };
  const dist = (ax: number, ay: number, bx: number, by: number) => Math.hypot(ax - bx, ay - by);

  // Snap helpers (pure: never block first/last vector, only adjust coordinates)
  const snapToGrid = (x: number, y: number) => {
    if (!snapGridOn) return { x, y };
    const step = PX_PER_CM * gridStepCm;
    return { x: Math.round(x / step) * step, y: Math.round(y / step) * step };
  };
  const snapToAngle = (originX: number, originY: number, x: number, y: number) => {
    if (!snapAngleOn) return { x, y };
    const dx = x - originX, dy = y - originY;
    const r = Math.hypot(dx, dy);
    if (r === 0) return { x, y };
    const stepRad = (angleStep * Math.PI) / 180;
    const a = Math.round(Math.atan2(dy, dx) / stepRad) * stepRad;
    return { x: originX + Math.cos(a) * r, y: originY + Math.sin(a) * r };
  };

  // Distance from point (px,py) to segment (ax,ay)-(bx,by)
  const distToSegment = (px: number, py: number, ax: number, ay: number, bx: number, by: number) => {
    const dx = bx - ax, dy = by - ay;
    const len2 = dx * dx + dy * dy;
    if (len2 === 0) return Math.hypot(px - ax, py - ay);
    let t = ((px - ax) * dx + (py - ay) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
  };

  const draw = React.useCallback(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    // grid
    ctx.strokeStyle = "#eef2f7"; ctx.lineWidth = 1;
    for (let x = 0; x <= c.width; x += 25) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, c.height); ctx.stroke(); }
    for (let y = 0; y <= c.height; y += 25) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(c.width, y); ctx.stroke(); }

    if (nodes.length > 0) {
      // Layer 1: tricotin path (black)
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.strokeStyle = "#000000"; ctx.lineWidth = lineWidthTricotin;
      ctx.beginPath();
      ctx.moveTo(nodes[0].x, nodes[0].y);
      for (let i = 1; i < nodes.length; i++) {
        const n = nodes[i];
        if (n.type === "curve" && n.ctrlX != null && n.ctrlY != null) ctx.quadraticCurveTo(n.ctrlX, n.ctrlY, n.x, n.y);
        else ctx.lineTo(n.x, n.y);
      }
      if (isClosedPath && nodes.length > 1) {
        const first = nodes[0];
        if (first.type === "curve" && first.ctrlX != null && first.ctrlY != null) ctx.quadraticCurveTo(first.ctrlX, first.ctrlY, first.x, first.y);
        else ctx.lineTo(first.x, first.y);
      }
      ctx.stroke();

      // Layer 2: guides (dashed gray) from curve nodes to control
      ctx.save();
      ctx.setLineDash([4, 4]); ctx.strokeStyle = "#9ca3af"; ctx.lineWidth = 1;
      nodes.forEach((n, i) => {
        if (n.type === "curve" && n.ctrlX != null && n.ctrlY != null) {
          const prev = nodes[i - 1] ?? (isClosedPath ? nodes[nodes.length - 1] : null);
          ctx.beginPath(); ctx.moveTo(n.ctrlX, n.ctrlY); ctx.lineTo(n.x, n.y); ctx.stroke();
          if (prev) { ctx.beginPath(); ctx.moveTo(prev.x, prev.y); ctx.lineTo(n.ctrlX, n.ctrlY); ctx.stroke(); }
        }
      });
      ctx.restore();

      // Layer 3: nodes (all red) & control handles (dark red w/ border)
      nodes.forEach((n) => {
        if (n.type === "curve" && n.ctrlX != null && n.ctrlY != null) {
          ctx.fillStyle = "#7f1d1d";
          ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(n.ctrlX, n.ctrlY, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        }
        ctx.fillStyle = "#FF0000";
        ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(n.x, n.y, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      });
    }
  }, [nodes, isClosedPath, lineWidthTricotin]);

  React.useEffect(() => { draw(); }, [draw]);

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    let { x, y } = getPos(e);
    didDragRef.current = false;
    if (mode === "select") {
      // 1) Control handle hit
      for (const n of nodes) {
        if (n.type === "curve" && n.ctrlX != null && n.ctrlY != null && dist(x, y, n.ctrlX, n.ctrlY) <= HIT) {
          pushHistory();
          dragRef.current = { kind: "ctrl", id: n.id };
          (e.target as Element).setPointerCapture(e.pointerId); return;
        }
      }
      // 2) Main node hit
      for (const n of nodes) {
        if (dist(x, y, n.x, n.y) <= HIT) {
          pushHistory();
          dragRef.current = { kind: "main", id: n.id };
          (e.target as Element).setPointerCapture(e.pointerId); return;
        }
      }
      // 3) Segment hit (drag whole line)
      const segs: Array<[PtNode, PtNode]> = [];
      for (let i = 1; i < nodes.length; i++) segs.push([nodes[i - 1], nodes[i]]);
      if (isClosedPath && nodes.length > 1) segs.push([nodes[nodes.length - 1], nodes[0]]);
      for (const [a, b] of segs) {
        if (distToSegment(x, y, a.x, a.y, b.x, b.y) <= Math.max(8, lineWidthTricotin / 2)) {
          pushHistory();
          dragRef.current = { kind: "segment", aId: a.id, bId: b.id };
          (e.target as Element).setPointerCapture(e.pointerId); return;
        }
      }
      return;
    }
    // add point
    pushHistory();
    const id = Math.random().toString(36).slice(2, 9);
    if (nodes.length === 0) {
      ({ x, y } = snapToGrid(x, y));
      setNodes([{ id, x, y, type: "start" }]);
    } else if (mode === "straight") {
      const prev = nodes[nodes.length - 1];
      ({ x, y } = snapToAngle(prev.x, prev.y, x, y));
      ({ x, y } = snapToGrid(x, y));
      setNodes((p) => [...p, { id, x, y, type: "straight" }]);
    } else {
      const prev = nodes[nodes.length - 1];
      ({ x, y } = snapToAngle(prev.x, prev.y, x, y));
      ({ x, y } = snapToGrid(x, y));
      setNodes((p) => [...p, { id, x, y, type: "curve", ctrlX: (prev.x + x) / 2, ctrlY: (prev.y + y) / 2 - 60 }]);
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    let { x, y } = getPos(e);
    didDragRef.current = true;
    if (drag.kind === "segment") {
      ({ x, y } = snapToGrid(x, y));
      // Adjust ONLY the curvature of this segment.
      // Endpoints A and B stay fixed; node B carries the quadratic control point.
      setNodes((prev) => {
        const a = prev.find((n) => n.id === drag.aId);
        const b = prev.find((n) => n.id === drag.bId);
        if (!a || !b) return prev;
        // Quadratic Bezier passing through cursor at t=0.5: ctrl = 2C - 0.5A - 0.5B
        const cx = 2 * x - 0.5 * a.x - 0.5 * b.x;
        const cy = 2 * y - 0.5 * a.y - 0.5 * b.y;
        return prev.map((n) =>
          n.id === drag.bId
            ? { ...n, type: "curve", ctrlX: cx, ctrlY: cy }
            : n
        );
      });
      return;
    }
    const { id, kind } = drag;
    setNodes((prev) => prev.map((n) => {
      if (n.id !== id) return n;
      if (kind === "ctrl") {
        const s = snapToGrid(x, y);
        return { ...n, ctrlX: s.x, ctrlY: s.y };
      }
      // Main node drag: optional angle snap relative to previous node, then grid snap.
      let nx = x, ny = y;
      const idx = prev.findIndex((p) => p.id === id);
      const ref = idx > 0 ? prev[idx - 1] : (isClosedPath && prev.length > 1 ? prev[prev.length - 1] : null);
      if (ref && ref.id !== id) ({ x: nx, y: ny } = snapToAngle(ref.x, ref.y, nx, ny));
      ({ x: nx, y: ny } = snapToGrid(nx, ny));
      const dx = nx - n.x, dy = ny - n.y;
      const upd: PtNode = { ...n, x: nx, y: ny };
      if (n.type === "curve" && n.ctrlX != null && n.ctrlY != null) { upd.ctrlX = n.ctrlX + dx; upd.ctrlY = n.ctrlY + dy; }
      return upd;
    }));
  };

  const onPointerUp = () => {
    if (dragRef.current && !didDragRef.current) {
      // no movement → revert the history snapshot we eagerly pushed
      undoRef.current.pop();
      forceRender((v) => v + 1);
    }
    dragRef.current = null;
    didDragRef.current = false;
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card p-3">
        <button onClick={() => setMode("select")} className={`rounded border px-3 py-1.5 text-xs ${mode === "select" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>Modo Seleção</button>
        <button onClick={() => setMode("straight")} className={`rounded border px-3 py-1.5 text-xs ${mode === "straight" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>Adicionar Ponto Reto</button>
        <button onClick={() => setMode("curve")} className={`rounded border px-3 py-1.5 text-xs ${mode === "curve" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>Adicionar Ponto Curvo</button>
        {mode === "select" && nodes.length >= 2 && (
          <button onClick={() => { pushHistory(); setIsClosedPath((v) => !v); }} className="rounded border px-3 py-1.5 text-xs hover:bg-muted">
            {isClosedPath ? "Abrir Molde" : "Fechar Molde"}
          </button>
        )}
        <div className="ml-2 flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Espessura:</span>
          <input type="range" min={5} max={35} value={lineWidthTricotin} onChange={(e) => setLineWidthTricotin(Number(e.target.value))} />
          <span className="w-10 tabular-nums">{lineWidthTricotin}px</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={snapGridOn} onChange={(e) => setSnapGridOn(e.target.checked)} />
            Snap grelha
          </label>
          <select
            value={gridStepCm}
            onChange={(e) => setGridStepCm(Number(e.target.value) as 0.5 | 1)}
            disabled={!snapGridOn}
            className="rounded border bg-background px-1 py-0.5 disabled:opacity-40"
          >
            <option value={0.5}>0,5 cm</option>
            <option value={1}>1 cm</option>
          </select>
          <label className="ml-2 flex items-center gap-1">
            <input type="checkbox" checked={snapAngleOn} onChange={(e) => setSnapAngleOn(e.target.checked)} />
            Snap ângulo
          </label>
          <select
            value={angleStep}
            onChange={(e) => setAngleStep(Number(e.target.value) as 15 | 45 | 90)}
            disabled={!snapAngleOn}
            className="rounded border bg-background px-1 py-0.5 disabled:opacity-40"
          >
            <option value={15}>15°</option>
            <option value={45}>45°</option>
            <option value={90}>90°</option>
          </select>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <button onClick={undo} disabled={undoRef.current.length === 0} className="rounded border px-3 py-1.5 text-xs hover:bg-muted disabled:opacity-40">↶ Desfazer</button>
          <button onClick={redo} disabled={redoRef.current.length === 0} className="rounded border px-3 py-1.5 text-xs hover:bg-muted disabled:opacity-40">↷ Refazer</button>
          <button onClick={() => { pushHistory(); setNodes([]); setIsClosedPath(false); }} className="rounded border px-3 py-1.5 text-xs hover:bg-muted">Limpar Canvas</button>
        </div>
      </div>
      {/* Gestão do Molde */}
      <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card p-3 tricotin-no-print">
        <span className="text-xs font-medium text-muted-foreground">Gestão do Molde:</span>
        <button onClick={saveToApp} className="rounded border px-3 py-1.5 text-xs hover:bg-muted">Guardar na APP</button>
        <button onClick={exportJSON} className="rounded border px-3 py-1.5 text-xs hover:bg-muted">Guardar no Dispositivo (.json)</button>
        <button onClick={exportPNG} className="rounded border px-3 py-1.5 text-xs hover:bg-muted">Guardar no Dispositivo (.png)</button>
        <button onClick={printMold} className="rounded border bg-primary px-3 py-1.5 text-xs text-primary-foreground hover:opacity-90">Imprimir Molde (A4)</button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) importJSON(f); e.currentTarget.value = ""; }}
        />
        <button onClick={() => fileInputRef.current?.click()} className="rounded border px-3 py-1.5 text-xs hover:bg-muted">Importar .json</button>
        {savedMolds.length > 0 && (
          <div className="ml-auto flex items-center gap-2">
            <select
              onChange={(e) => { if (e.target.value) loadSaved(e.target.value); e.currentTarget.value = ""; }}
              className="rounded border bg-background px-2 py-1 text-xs"
              defaultValue=""
            >
              <option value="" disabled>Moldes guardados ({savedMolds.length})</option>
              {savedMolds.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            <select
              onChange={(e) => { if (e.target.value) deleteSaved(e.target.value); e.currentTarget.value = ""; }}
              className="rounded border bg-background px-2 py-1 text-xs"
              defaultValue=""
            >
              <option value="" disabled>Apagar…</option>
              {savedMolds.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>
      <div className="overflow-auto rounded-lg border bg-white tricotin-no-print">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="block touch-none"
          style={{ width: "100%", maxWidth: `${W}px`, height: "auto", aspectRatio: `${W} / ${H}`, cursor: mode === "select" ? "grab" : "crosshair" }}
        />
      </div>
      <p className="text-xs text-muted-foreground tricotin-no-print">
        Dica: no "Modo Seleção" arrasta os nós vermelhos para reposicionar, os pontos de controlo (vermelho escuro) para ajustar a curvatura, ou arrasta diretamente um segmento da linha para mover toda essa secção. Atalhos: Ctrl/Cmd+Z (desfazer), Ctrl/Cmd+Shift+Z (refazer).
      </p>
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body.tricotin-printing > *:not(#tricotin-print-host) { display: none !important; }
          body.tricotin-printing #tricotin-print-host {
            position: fixed; inset: 0; background: #fff; z-index: 999999;
            display: block !important; page-break-inside: avoid;
          }
          body.tricotin-printing { background: #fff !important; margin: 0 !important; padding: 0 !important; }
          body.tricotin-printing #tricotin-print-host img { page-break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}


function ToolBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button onClick={onClick} title={label}
      className={`flex flex-col items-center gap-0.5 rounded border p-1.5 text-[10px] ${active ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}>
      {icon}<span className="truncate">{label}</span>
    </button>
  );
}

function SelectionFrame({ w, h, dy = 0 }: { w: number; h: number; dy?: number }) {
  return (
    <g pointerEvents="none">
      <rect x={-4} y={dy - 4} width={w + 8} height={h + 8} fill="none" stroke="#1e88e5" strokeWidth="1" strokeDasharray="4 3" />
      {[[-4, dy - 4], [w + 4, dy - 4], [-4, dy + h + 4], [w + 4, dy + h + 4]].map(([cx, cy], i) => (
        <rect key={i} x={cx - 3} y={cy - 3} width="6" height="6" fill="#fff" stroke="#1e88e5" />
      ))}
    </g>
  );
}
function ponto(e: React.PointerEvent<SVGSVGElement>, svg: SVGSVGElement) {
  const r = svg.getBoundingClientRect();
  return { x: ((e.clientX - r.left) / r.width) * 595, y: ((e.clientY - r.top) / r.height) * 842 };
}

/* ============================ AMIGURUMI / CROCHÊ ============================ */
function AmigurumiTab() {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useMarcaDAgua();
  const [titulo, setTitulo] = useState("");
  const [intro, setIntro] = useState("");
  const [carreiras, setCarreiras] = useState<{ texto: string; pontos: number }[]>([
    { texto: "Anel mágico com 6pb", pontos: 6 },
  ]);
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <A4Stage innerRef={ref} watermark={w}>
        <div className="absolute inset-0 overflow-auto p-8 text-sm leading-relaxed">
          <h2 className="font-display text-2xl font-bold">{titulo || "Sem título"}</h2>
          <p className="mt-2 whitespace-pre-wrap text-muted-foreground">{intro}</p>
          <table className="mt-4 w-full text-left">
            <thead><tr className="border-b"><th className="py-1 pr-2">#</th><th>Instruções</th><th className="w-20 text-right">Pontos</th></tr></thead>
            <tbody>
              {carreiras.map((c, i) => (
                <tr key={i} className="border-b"><td className="py-1 pr-2 font-mono">{i + 1}</td><td>{c.texto}</td><td className="text-right">{c.pontos}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </A4Stage>
      <div className="space-y-3">
        <Card><CardContent className="space-y-2 p-3">
          <Input placeholder="Título da receita" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
          <Textarea placeholder="Materiais, agulha, nível..." value={intro} onChange={(e) => setIntro(e.target.value)} />
          {carreiras.map((c, i) => (
            <div key={i} className="grid grid-cols-[1fr_60px_auto] gap-1">
              <Input value={c.texto} onChange={(e) => setCarreiras((s) => s.map((x, j) => j === i ? { ...x, texto: e.target.value } : x))} />
              <Input type="number" value={c.pontos} onChange={(e) => setCarreiras((s) => s.map((x, j) => j === i ? { ...x, pontos: +e.target.value } : x))} />
              <Button size="icon" variant="ghost" onClick={() => setCarreiras((s) => s.filter((_, j) => j !== i))}><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          ))}
          <Button size="sm" variant="outline" onClick={() => setCarreiras((s) => [...s, { texto: "", pontos: 0 }])}>
            <Plus className="mr-1 h-3.5 w-3.5" />Carreira
          </Button>
        </CardContent></Card>
        <WatermarkControls w={w} set={setW} />
        <ExportPanel targetRef={ref} defaultArea="Amigurumi" defaultTitulo={titulo || "Receita"} />
      </div>
    </div>
  );
}

/* ============================ COSTURA ============================ */
function CosturaTab() {
  const ref = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [w, setW] = useMarcaDAgua();
  const [escala, setEscala] = useState(2); // px por mm (200mm → 400px no SVG)
  const [linhas, setLinhas] = useState<{ x1: number; y1: number; x2: number; y2: number; cm: number }[]>([]);
  const [tamanho, setTamanho] = useState<"S" | "M" | "L" | "XL">("M");
  const fator = tamanho === "S" ? 0.9 : tamanho === "M" ? 1 : tamanho === "L" ? 1.1 : 1.2;
  const materiais = useStore((s) => s.materiais);
  const [usados, setUsados] = useState<{ materialId: string; quantidade: number }[]>([]);
  const custoTotal = useMemo(() => usados.reduce((acc, u) => {
    const m = materiais.find((x) => x.id === u.materialId);
    return acc + (m ? m.precoCompra * u.quantidade : 0);
  }, 0), [usados, materiais]);

  const inicio = useRef<{ x: number; y: number } | null>(null);
  const onDown = (e: React.PointerEvent<SVGSVGElement>) => {
    inicio.current = ponto(e, svgRef.current!);
  };
  const onUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!inicio.current) return;
    const p = ponto(e, svgRef.current!);
    const dx = (p.x - inicio.current.x) / escala / 10;
    const dy = (p.y - inicio.current.y) / escala / 10;
    const cm = Math.round(Math.hypot(dx, dy) * 10) / 10;
    setLinhas((s) => [...s, { x1: inicio.current!.x, y1: inicio.current!.y, x2: p.x, y2: p.y, cm }]);
    inicio.current = null;
  };

  const adicionarMedida = () => {
    const v = window.prompt("Comprimento em cm:", "30");
    if (!v) return;
    const cm = parseFloat(v);
    const px = cm * 10 * escala;
    setLinhas((s) => [...s, { x1: 60, y1: 60 + s.length * 30, x2: 60 + px, y2: 60 + s.length * 30, cm }]);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <A4Stage innerRef={ref} watermark={w}>
        <svg ref={svgRef} viewBox="0 0 595 842" className="absolute inset-0 h-full w-full" onPointerDown={onDown} onPointerUp={onUp}>
          <defs><pattern id="gridc" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#eee" strokeWidth="0.5" />
          </pattern></defs>
          <rect width="100%" height="100%" fill="url(#gridc)" />
          {linhas.map((l, i) => (
            <g key={i}>
              <line x1={l.x1} y1={l.y1} x2={l.x1 + (l.x2 - l.x1) * fator} y2={l.y1 + (l.y2 - l.y1) * fator} stroke="#222" strokeWidth="1.5" />
              <text x={(l.x1 + l.x2) / 2} y={(l.y1 + l.y2) / 2 - 4} fontSize="10" textAnchor="middle" fill="#444">{(l.cm * fator).toFixed(1)}cm</text>
            </g>
          ))}
        </svg>
      </A4Stage>
      <div className="space-y-3">
        <Card><CardContent className="space-y-2 p-3">
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-xs">Tamanho</Label>
              <Select value={tamanho} onValueChange={(v) => setTamanho(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["S","M","L","XL"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Escala (px/mm): {escala}</Label>
              <Slider value={[escala]} min={1} max={5} step={0.5} onValueChange={(v) => setEscala(v[0])} />
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={adicionarMedida}><Plus className="mr-1 h-3 w-3" />Adicionar linha por medida</Button>
          <Button size="sm" variant="ghost" onClick={() => setLinhas([])}><Eraser className="mr-1 h-3 w-3" />Limpar</Button>
        </CardContent></Card>

        <Card><CardContent className="space-y-2 p-3">
          <div className="font-display font-semibold text-sm">Custo do Projeto</div>
          {usados.map((u, i) => {
            const m = materiais.find((x) => x.id === u.materialId);
            return (
              <div key={i} className="grid grid-cols-[1fr_70px_auto] gap-1 items-center">
                <Select value={u.materialId} onValueChange={(v) => setUsados((s) => s.map((x, j) => j === i ? { ...x, materialId: v } : x))}>
                  <SelectTrigger className="h-8"><SelectValue placeholder="Material" /></SelectTrigger>
                  <SelectContent>{materiais.map((m) => <SelectItem key={m.id} value={m.id}>{m.nome} ({m.unidade})</SelectItem>)}</SelectContent>
                </Select>
                <Input type="number" className="h-8" value={u.quantidade} onChange={(e) => setUsados((s) => s.map((x, j) => j === i ? { ...x, quantidade: +e.target.value } : x))} />
                <Button size="icon" variant="ghost" onClick={() => setUsados((s) => s.filter((_, j) => j !== i))}><Trash2 className="h-3 w-3" /></Button>
                {m && <div className="col-span-3 text-[10px] text-muted-foreground">{u.quantidade} × {formatEUR(m.precoCompra)} = {formatEUR(u.quantidade * m.precoCompra)}</div>}
              </div>
            );
          })}
          <Button size="sm" variant="outline" onClick={() => setUsados((s) => [...s, { materialId: materiais[0]?.id ?? "", quantidade: 1 }])}>
            <Plus className="mr-1 h-3 w-3" />Material
          </Button>
          <div className="border-t pt-2 text-sm">Total estimado: <span className="font-display font-bold">{formatEUR(custoTotal)}</span></div>
        </CardContent></Card>

        <WatermarkControls w={w} set={setW} />
        <ExportPanel targetRef={ref} defaultArea="Costura" defaultTitulo={`Molde ${tamanho}`} />
      </div>
    </div>
  );
}

/* ============================ PONTO CRUZ ============================ */
function PontoCruzTab() {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useMarcaDAgua();
  const [cols, setCols] = useState(40);
  const [rows, setRows] = useState(40);
  const [cor, setCor] = useState("#222222");
  const [simbolos, setSimbolos] = useState(false);
  const [grid, setGrid] = useState<Record<string, string>>({}); // "r,c" → hex
  const materiais = useStore((s) => s.materiais);
  const drawing = useRef(false);

  const pinta = (r: number, c: number) => setGrid((g) => ({ ...g, [`${r},${c}`]: cor }));
  const apaga = (r: number, c: number) => setGrid((g) => { const x = { ...g }; delete x[`${r},${c}`]; return x; });

  const coresUsadas = useMemo(() => {
    const m: Record<string, number> = {};
    Object.values(grid).forEach((h) => { m[h] = (m[h] || 0) + 1; });
    return Object.entries(m);
  }, [grid]);

  const SIMBOLOS = ["■", "▲", "●", "◆", "★", "✚", "✱", "▼", "◯", "□", "✦", "⬢", "✧", "❖", "✜"];
  const simboloPara = (hex: string) => {
    const i = coresUsadas.findIndex(([h]) => h === hex);
    return SIMBOLOS[i % SIMBOLOS.length];
  };

  const cellSize = Math.min(500 / cols, 700 / rows);

  const verificarStock = () => {
    const faltas: string[] = [];
    coresUsadas.forEach(([hex, count]) => {
      const meadas = Math.ceil(count / 800); // estimativa simplificada
      const stock = materiais.find((m) => m.categoria === "meadas" && m.imagem === hex);
      if (!stock || stock.stock < meadas) faltas.push(`${hex} (${meadas} meadas)`);
    });
    if (faltas.length === 0) alert("Tens todas as cores em stock!");
    else alert("Em falta:\n" + faltas.join("\n"));
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <A4Stage innerRef={ref} watermark={w}>
        <div className="absolute inset-0 grid place-items-center p-4">
          <div className="grid select-none" style={{ gridTemplateColumns: `repeat(${cols}, ${cellSize}px)` }}
               onPointerDown={() => { drawing.current = true; }}
               onPointerUp={() => { drawing.current = false; }}
               onPointerLeave={() => { drawing.current = false; }}>
            {Array.from({ length: rows }).map((_, r) =>
              Array.from({ length: cols }).map((__, c) => {
                const h = grid[`${r},${c}`];
                return (
                  <div key={`${r}-${c}`} className="border border-gray-200"
                       style={{ width: cellSize, height: cellSize, background: simbolos ? "#fff" : (h || "#fff"), color: "#000" }}
                       onPointerDown={(e) => { e.preventDefault(); e.button === 2 ? apaga(r, c) : pinta(r, c); }}
                       onPointerEnter={() => { if (drawing.current) pinta(r, c); }}
                       onContextMenu={(e) => { e.preventDefault(); apaga(r, c); }}>
                    {simbolos && h && <div className="grid h-full w-full place-items-center" style={{ fontSize: cellSize * 0.7 }}>{simboloPara(h)}</div>}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </A4Stage>
      <div className="space-y-3">
        <Card><CardContent className="space-y-2 p-3">
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-xs">Largura ({cols})</Label><Slider value={[cols]} min={10} max={100} onValueChange={(v) => setCols(v[0])} /></div>
            <div><Label className="text-xs">Altura ({rows})</Label><Slider value={[rows]} min={10} max={100} onValueChange={(v) => setRows(v[0])} /></div>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs">Cor</Label>
            <input type="color" value={cor} onChange={(e) => setCor(e.target.value)} className="h-8 w-12 rounded border" />
            <Button size="sm" variant={simbolos ? "default" : "outline"} onClick={() => setSimbolos((s) => !s)}>Símbolos</Button>
            <Button size="sm" variant="ghost" onClick={() => setGrid({})}><Eraser className="mr-1 h-3 w-3" />Limpar</Button>
          </div>
        </CardContent></Card>

        <Card><CardContent className="space-y-2 p-3">
          <div className="font-display font-semibold text-sm">Custo do Projeto</div>
          {coresUsadas.length === 0 && <p className="text-xs text-muted-foreground">Pinta a grelha para ver o custo estimado.</p>}
          {coresUsadas.map(([hex, count]) => (
            <div key={hex} className="flex items-center gap-2 text-xs">
              <span className="inline-block h-4 w-4 rounded border" style={{ background: hex }} />
              <span className="font-mono">{hex}</span>
              <span className="ml-auto">{count} pontos</span>
            </div>
          ))}
          {coresUsadas.length > 0 && (
            <Button size="sm" variant="outline" onClick={verificarStock}>Verificar disponibilidade de linhas</Button>
          )}
        </CardContent></Card>

        <WatermarkControls w={w} set={setW} />
        <ExportPanel targetRef={ref} defaultArea="Ponto cruz" defaultTitulo="Gráfico Ponto Cruz" />
      </div>
    </div>
  );
}

/* ============================ BORDADO ============================ */
function BordadoTab() {
  const ref = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [w, setW] = useMarcaDAgua();
  const [paths, setPaths] = useState<string[]>([]);
  const [imagemFundo, setImagemFundo] = useState<string>("");
  const [contornos, setContornos] = useState<string[]>([]);
  const [limiar, setLimiar] = useState(128);
  const [suavizar, setSuavizar] = useState(1);          // iterações de Chaikin
  const [minSeg, setMinSeg] = useState(4);              // px mínimos
  const [separados, setSeparados] = useState(true);     // gerar caminhos separados ou unidos
  const [aTrabalhar, setATrabalhar] = useState(false);
  const drawing = useRef(false);

  const onDown = (e: React.PointerEvent<SVGSVGElement>) => {
    drawing.current = true;
    const p = ponto(e, svgRef.current!);
    setPaths((s) => [...s, `M ${p.x} ${p.y}`]);
  };
  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!drawing.current) return;
    const p = ponto(e, svgRef.current!);
    setPaths((s) => { const c = [...s]; c[c.length - 1] += ` L ${p.x} ${p.y}`; return c; });
  };
  const onUp = () => { drawing.current = false; };

  /** Vetorização: marching-squares simplificado sobre a luminância da imagem. */
  const vetorizar = async () => {
    if (!imagemFundo) { toast.error("Importa uma imagem primeiro."); return; }
    setATrabalhar(true);
    try {
      const img = new Image();
      img.src = imagemFundo;
      await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(new Error("img")); });
      const W = 240, H = Math.round((img.height / img.width) * 240);
      const canvas = document.createElement("canvas");
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, W, H);
      const { data } = ctx.getImageData(0, 0, W, H);
      const lum = new Uint8Array(W * H);
      for (let i = 0; i < W * H; i++) {
        const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2];
        lum[i] = (0.299 * r + 0.587 * g + 0.114 * b) < limiar ? 1 : 0;
      }
      // Deteção de aresta simples (Sobel binário): pixel é contorno se vizinhança difere
      const edge = new Uint8Array(W * H);
      for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
        const c = lum[y * W + x];
        if (c !== lum[y * W + x + 1] || c !== lum[(y + 1) * W + x]) edge[y * W + x] = 1;
      }
      // Extrair segmentos contínuos de aresta linha-a-linha
      const sx = A4_W / W, sy = A4_H / H;
      type Seg = { x1: number; y1: number; x2: number; y2: number };
      const segs: Seg[] = [];
      for (let y = 0; y < H; y++) {
        let start = -1;
        for (let x = 0; x < W; x++) {
          if (edge[y * W + x]) {
            if (start < 0) start = x;
          } else if (start >= 0) {
            const len = x - start;
            if (len >= minSeg) segs.push({ x1: start * sx, y1: y * sy, x2: (x - 1) * sx, y2: y * sy });
            start = -1;
          }
        }
      }
      // Suavização Chaikin (cada iteração corta cantos)
      const chaikin = (pts: { x: number; y: number }[], it: number) => {
        let p = pts;
        for (let k = 0; k < it; k++) {
          const out: { x: number; y: number }[] = [];
          for (let i = 0; i < p.length - 1; i++) {
            const a = p[i], b = p[i + 1];
            out.push({ x: a.x + (b.x - a.x) * 0.25, y: a.y + (b.y - a.y) * 0.25 });
            out.push({ x: a.x + (b.x - a.x) * 0.75, y: a.y + (b.y - a.y) * 0.75 });
          }
          p = out;
        }
        return p;
      };
      const segToPath = (s: Seg) => {
        const sm = chaikin([{ x: s.x1, y: s.y1 }, { x: s.x2, y: s.y2 }], suavizar);
        return "M " + sm.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" L ");
      };
      let novos: string[];
      if (separados) {
        novos = segs.map(segToPath);
      } else {
        // Encadear segmentos contíguos da mesma linha num único caminho
        const grouped = new Map<number, Seg[]>();
        segs.forEach((s) => {
          const row = Math.round(s.y1);
          (grouped.get(row) ?? grouped.set(row, []).get(row)!).push(s);
        });
        novos = [];
        for (const list of grouped.values()) {
          list.sort((a, b) => a.x1 - b.x1);
          let d = "";
          list.forEach((s, i) => {
            const sm = chaikin([{ x: s.x1, y: s.y1 }, { x: s.x2, y: s.y2 }], suavizar);
            d += (i === 0 ? "M " : " M ") + sm.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" L ");
          });
          if (d) novos.push(d);
        }
      }
      setContornos(novos);
      toast.success(`${novos.length} contorno(s) gerado(s).`);
    } catch (e) {
      toast.error("Falha na vetorização: " + (e as Error).message);
    } finally {
      setATrabalhar(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <A4Stage innerRef={ref} watermark={w}>
        {imagemFundo && <img src={imagemFundo} className="absolute inset-0 h-full w-full object-contain opacity-50" />}
        <svg ref={svgRef} viewBox="0 0 595 842" className="absolute inset-0 h-full w-full"
             onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp}>
          {contornos.map((d, i) => <path key={`c${i}`} d={d} stroke="#1e88e5" strokeWidth="0.8" fill="none" />)}
          {paths.map((d, i) => <path key={i} d={d} stroke="#111" strokeWidth="1.5" fill="none" strokeLinecap="round" />)}
        </svg>
      </A4Stage>
      <div className="space-y-3">
        <Card><CardContent className="space-y-2 p-3">
          <Label className="text-xs">Imagem de referência</Label>
          <Input type="file" accept="image/*" onChange={(e) => {
            const f = e.target.files?.[0]; if (!f) return;
            const r = new FileReader(); r.onload = () => setImagemFundo(r.result as string); r.readAsDataURL(f);
          }} />
          <div>
            <Label className="text-xs">Limiar de contraste ({limiar})</Label>
            <Slider value={[limiar]} min={40} max={220} step={5} onValueChange={(v) => setLimiar(v[0])} />
          </div>
          <div>
            <Label className="text-xs">Suavização ({suavizar}×)</Label>
            <Slider value={[suavizar]} min={0} max={4} step={1} onValueChange={(v) => setSuavizar(v[0])} />
          </div>
          <div>
            <Label className="text-xs">Remover áreas pequenas (&lt; {minSeg}px)</Label>
            <Slider value={[minSeg]} min={1} max={30} step={1} onValueChange={(v) => setMinSeg(v[0])} />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Caminhos separados</Label>
            <Button size="sm" variant={separados ? "default" : "outline"} onClick={() => setSeparados((v) => !v)}>
              {separados ? "Sim" : "Unidos por linha"}
            </Button>
          </div>
          <Button size="sm" onClick={vetorizar} disabled={aTrabalhar || !imagemFundo}>
            <Sparkles className="mr-1 h-3 w-3" />{aTrabalhar ? "A vetorizar..." : "Vetorizar imagem"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setContornos([])}>Limpar contornos</Button>
          <Button size="sm" variant="ghost" onClick={() => setPaths([])}><Eraser className="mr-1 h-3 w-3" />Limpar traços</Button>
        </CardContent></Card>
        <WatermarkControls w={w} set={setW} />
        <ExportPanel targetRef={ref} defaultArea="Bordado" defaultTitulo="Padrão Bordado" />
      </div>
    </div>
  );
}