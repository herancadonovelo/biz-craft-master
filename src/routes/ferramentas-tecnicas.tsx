import { createFileRoute } from "@tanstack/react-router";
import { PremiumRoute } from "@/components/PremiumRoute";
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
  SheetControls, useSheet,
} from "@/components/A4Export";
import { TricotinProPanel } from "@/components/TricotinProPanel";
import {
  Plus, Trash2, Eraser, MousePointer2, Minus, Spline, Type, Ruler,
  Combine, Sparkles, Grid3x3, Magnet, RotateCw, ArrowRightCircle, Hash, Tag,
  Pen, Link2, Move, ZoomIn, ZoomOut,
} from "lucide-react";
import { toast } from "sonner";
import { EditorReceitaPage } from "./editor-receita";
import { EditorMoodboardsPage } from "./editor-moodboards";
import { ConversorPage } from "./conversor-cores";
import { ContadorPage } from "./contador";
import { traceImage, toSVG, toDXF, polylineLength, type TracePoint, type TraceResult } from "@/lib/trace";

export const Route = createFileRoute("/ferramentas-tecnicas")({
  head: () => ({ meta: [{ title: "Ferramentas Técnicas" }] }),
  component: () => (
    <PremiumRoute feature="Ferramentas Técnicas">
      <FerramentasPage />
    </PremiumRoute>
  ),
});

function FerramentasPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Ferramentas Técnicas"
        description="Os 5 editores partilham tela A4, marca d'água configurável e exportação para Biblioteca, PDF e Imprimir." />
      <Tabs defaultValue="instrucoes">
        <TabsList className="flex h-auto w-full flex-wrap">
          <TabsTrigger value="instrucoes">Instruções de uso</TabsTrigger>
          <TabsTrigger value="tricotin">Editor de Moldes: Tricotin/i-cord</TabsTrigger>
          <TabsTrigger value="amigurumi">Editor de Receitas: Amigurumis & Crochê</TabsTrigger>
          <TabsTrigger value="costura">Editor de Moldes: Costura</TabsTrigger>
          <TabsTrigger value="ponto-cruz">Editor de Gráficos: Ponto Cruz</TabsTrigger>
          <TabsTrigger value="bordado">Editor de Padrões: Bordado</TabsTrigger>
          <TabsTrigger value="editor-receita">Editor De Receitas</TabsTrigger>
          <TabsTrigger value="editor-moodboards">Editor De Moodboards</TabsTrigger>
          <TabsTrigger value="conversor">Conversor De Cores: DMC/ANCHOR</TabsTrigger>
          <TabsTrigger value="contador">Contador De Carreiras & Pontos</TabsTrigger>
        </TabsList>
        <TabsContent value="instrucoes" className="mt-24"><InstrucoesTab /></TabsContent>
        <TabsContent value="tricotin" className="mt-24"><TricotinTab /></TabsContent>
        <TabsContent value="amigurumi" className="mt-24"><AmigurumiTab /></TabsContent>
        <TabsContent value="costura" className="mt-24"><CosturaTab /></TabsContent>
        <TabsContent value="ponto-cruz" className="mt-24"><PontoCruzTab /></TabsContent>
        <TabsContent value="bordado" className="mt-24"><BordadoTab /></TabsContent>
        <TabsContent value="editor-receita" className="mt-24"><EditorReceitaPage /></TabsContent>
        <TabsContent value="editor-moodboards" className="mt-24"><EditorMoodboardsPage /></TabsContent>
        <TabsContent value="conversor" className="mt-24"><ConversorPage /></TabsContent>
        <TabsContent value="contador" className="mt-24"><ContadorPage /></TabsContent>
      </Tabs>
    </div>
  );
}

function InstrucoesTab() {
  const items = [
    { t: "Editor de Moldes: Tricotin/i-cord", d: "Tela interativa para desenhar e moldar esquemas de arame para i-cord/tricotin. Usa o lápis para traçar o caminho e o A4 garante escala real ao imprimir." },
    { t: "Editor de Receitas: Amigurumis & Crochê", d: "Processador de texto e tabelas técnicas para escrever padrões, contar pontos linha-a-linha e adicionar notas de produção. Pensa em \"livro de receita\"." },
    { t: "Editor de Moldes: Costura", d: "Estúdio vetorial para moldes de vestuário, com linhas retas, curvas, introdução manual de medidas em cm e graduação por tamanhos (S, M, L, XL). Inclui cálculo financeiro." },
    { t: "Editor de Gráficos: Ponto Cruz", d: "Grelha pixel-art para criar gráficos quadriculados com cores DMC/Anchor. Permite alternar entre vista a cor e vista de símbolos a preto e branco para leitura em papel." },
    { t: "Editor de Padrões: Bordado", d: "Canvas livre para importar imagens, traçar contornos e definir riscos para bordado à mão." },
    { t: "Editor De Receitas", d: "Editor estruturado para criar e organizar receitas por secções e carreiras. Adiciona materiais, imagens de referência por secção, e o total de pontos é calculado automaticamente. Ideal para amigurumis, crochet e tricotin em formato \"livro\"." },
    { t: "Editor De Moodboards", d: "Cria moodboards em tela A4 com imagens, texto, formas e paleta de cores. Arrasta, rodas e redimensiona elementos, associa a uma encomenda e exporta em PDF/imagem para partilhar com o cliente." },
    { t: "Conversor De Cores: DMC/ANCHOR", d: "Converte códigos de linhas entre marcas DMC ↔ Anchor. Pesquisa por código ou nome, vê equivalências aproximadas e adiciona diretamente ao stock ou à lista de compras." },
    { t: "Contador De Carreiras & Pontos", d: "Contadores digitais para acompanhar carreiras e pontos em tempo real durante o trabalho. Cria vários contadores por receita, incrementa/decrementa com um toque e guarda a última sessão automaticamente." },
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

/* ---- Fontes cursivas priorizadas pelo Auto-script (ligação natural entre letras) ---- */
const FONTES_CURSIVAS = [
  "Pacifico","Great Vibes","Allura","Dancing Script","Sacramento","Alex Brush","Parisienne","Kaushan Script","Satisfy",
];

type LetteringPath = "straight" | "arc" | "circle";
type Lettering = {
  ativa: boolean;
  text: string;
  font: string;
  size: number;      // px
  kerning: number;   // px extra entre letras (pode ser negativo)
  autoScript: boolean;
  pathType: LetteringPath;
  cx: number;        // centro/origem em px do canvas A4
  cy: number;
  radius: number;    // px, para arc/circle
  angleStart: number; // rad, ponto inicial do arco (0 = 3h, -PI/2 = 12h)
  arcSweep: number;   // rad, extensão do arco (positivo = sentido horário)
  straightAngle: number; // rad, para linha reta
  color: string;
};

/**
 * Renderiza texto ao longo de uma linha reta, arco ou círculo.
 * Aplica Auto-script (sobreposição estética entre glifos cursivos) e Kerning manual.
 * Chamado tanto no draw() (com handles) como no renderClean() (para PNG/impressão).
 */
function drawLettering(ctx: CanvasRenderingContext2D, L: Lettering, opts?: { withHandles?: boolean }) {
  if (!L.ativa || !L.text) return;
  const withHandles = !!opts?.withHandles;
  const font = L.autoScript
    ? (FONTES_CURSIVAS.includes(L.font) ? L.font : "Pacifico")
    : L.font;
  ctx.save();
  ctx.fillStyle = L.color;
  ctx.strokeStyle = L.color;
  ctx.textBaseline = "alphabetic";
  ctx.font = `${L.size}px "${font}", cursive`;
  const chars = Array.from(L.text);
  // Auto-script: reduz espaçamento em ~12% para "ligar" letras cursivas
  const autoOverlap = L.autoScript ? -Math.round(L.size * 0.12) : 0;
  const widths = chars.map((c) => ctx.measureText(c).width);
  const advances = widths.map((w) => w + L.kerning + autoOverlap);
  const totalW = advances.reduce((a, b) => a + b, 0);

  if (L.pathType === "straight") {
    // Origem em (cx, cy), texto começa aí e segue ao longo de straightAngle
    ctx.translate(L.cx, L.cy);
    ctx.rotate(L.straightAngle);
    let x = 0;
    for (let i = 0; i < chars.length; i++) {
      ctx.fillText(chars[i], x, 0);
      x += advances[i];
    }
  } else {
    // Arc/Circle: distribui chars por comprimento de arco
    const r = Math.max(20, L.radius);
    const totalSweep = L.pathType === "circle" ? Math.PI * 2 : L.arcSweep;
    // Comprimento disponível ao longo do arco
    const arcLen = Math.abs(totalSweep) * r;
    // Se o texto não cabe, aperta advances proporcionalmente
    const scale = totalW > arcLen ? arcLen / totalW : 1;
    let cumLen = 0;
    for (let i = 0; i < chars.length; i++) {
      const advPx = advances[i] * scale;
      const midLen = cumLen + advPx / 2;
      // Distribuição centrada: começa em angleStart e avança
      const t = midLen / r; // rad
      const dir = totalSweep >= 0 ? 1 : -1;
      const ang = L.angleStart + dir * t;
      const px = L.cx + Math.cos(ang) * r;
      const py = L.cy + Math.sin(ang) * r;
      ctx.save();
      ctx.translate(px, py);
      // Perpendicular ao raio, alinhado ao sentido do arco
      ctx.rotate(ang + dir * Math.PI / 2);
      ctx.fillText(chars[i], -widths[i] * scale / 2, 0);
      ctx.restore();
      cumLen += advPx;
    }
    if (withHandles) {
      ctx.strokeStyle = "rgba(59,130,246,0.55)";
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      if (L.pathType === "circle") ctx.arc(L.cx, L.cy, r, 0, Math.PI * 2);
      else ctx.arc(L.cx, L.cy, r, L.angleStart, L.angleStart + L.arcSweep, L.arcSweep < 0);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
  ctx.restore();

  if (withHandles && L.pathType === "straight") {
    ctx.save();
    ctx.strokeStyle = "rgba(59,130,246,0.55)";
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(L.cx, L.cy);
    ctx.lineTo(L.cx + Math.cos(L.straightAngle) * 400, L.cy + Math.sin(L.straightAngle) * 400);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }
}

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
  const addToStore = useStore((s) => s.add);
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
  // Calibração automática: fator multiplicativo aplicado à impressão A4.
  // Se a barra de 100 mm sair com L mm na régua física, scale = 100 / L.
  const CAL_KEY = "tricotin-cal-scale-v1";
  const [calScale, setCalScale] = React.useState<number>(() => {
    if (typeof window === "undefined") return 1;
    const v = parseFloat(localStorage.getItem(CAL_KEY) || "1");
    return Number.isFinite(v) && v > 0.5 && v < 2 ? v : 1;
  });
  const [measuredMm, setMeasuredMm] = React.useState<string>("");

  // ---------- Lettering (Auto-script + Kerning + Text on Path) ----------
  // Marca d'água da folha de desenho
  const [w, setW] = useMarcaDAgua();
  const [lettering, setLettering] = React.useState<Lettering>({
    ativa: false,
    text: "Sara",
    font: "Pacifico",
    size: 96,
    kerning: 0,
    autoScript: true,
    pathType: "arc",
    cx: A4_W / 2,
    cy: A4_H / 2,
    radius: 160,
    angleStart: -Math.PI * 0.75, // canto superior esquerdo
    arcSweep: Math.PI * 1.5,     // arco largo
    straightAngle: 0,
    color: "#111111",
  });
  const setL = (p: Partial<Lettering>) => setLettering((s) => ({ ...s, ...p }));
  const applyCalibration = () => {
    const m = parseFloat(measuredMm.replace(",", "."));
    if (!Number.isFinite(m) || m < 50 || m > 150) {
      alert("Insere um valor entre 50 e 150 mm (a barra esperada é 100 mm).");
      return;
    }
    const newScale = (100 / m) * calScale; // compõe com a calibração anterior
    setCalScale(newScale);
    try { localStorage.setItem(CAL_KEY, String(newScale)); } catch { /* noop */ }
  };
  const resetCalibration = () => {
    setCalScale(1); setMeasuredMm("");
    try { localStorage.removeItem(CAL_KEY); } catch { /* noop */ }
  };
  const measuredNum = parseFloat(measuredMm.replace(",", "."));
  const errorMm = Number.isFinite(measuredNum) ? measuredNum - 100 : null;

  // ---------- Comprimento total de arame (tempo real) ----------
  // Soma comprimentos por segmento (reta ou Bézier quadrática) + fecho opcional,
  // converte px → cm com a escala real do A4 (PX_PER_CM) e aplica margem +5%.
  const totalLengthCm = React.useMemo(() => {
    if (nodes.length < 2) return 0;
    const segLen = (a: PtNode, b: PtNode) => {
      if (b.type === "curve" && b.ctrlX != null && b.ctrlY != null) {
        let sum = 0;
        let px = a.x, py = a.y;
        for (let i = 1; i <= 20; i++) {
          const t = i * 0.05;
          const it = 1 - t;
          const bx = it * it * a.x + 2 * it * t * b.ctrlX + t * t * b.x;
          const by = it * it * a.y + 2 * it * t * b.ctrlY + t * t * b.y;
          sum += Math.hypot(bx - px, by - py);
          px = bx; py = by;
        }
        return sum;
      }
      return Math.hypot(b.x - a.x, b.y - a.y);
    };
    let total = 0;
    for (let i = 1; i < nodes.length; i++) total += segLen(nodes[i - 1], nodes[i]);
    if (isClosedPath && nodes.length > 1) total += segLen(nodes[nodes.length - 1], nodes[0]);
    const cm = total / PX_PER_CM;
    return cm * 1.05; // margem de segurança +5%
  }, [nodes, isClosedPath]);
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
    // Também guarda na Biblioteca como snapshot PNG (categoria Tricotin)
    try {
      const off = document.createElement("canvas");
      renderClean(off);
      const dataUrl = off.toDataURL("image/png");
      addToStore("biblioteca", {
        titulo: name,
        categoria: "Tricotin",
        tipo: "molde",
        descricao: `Molde de tricotin · ${nodes.length} nós · ${totalLengthCm.toFixed(1)} cm de arame`,
        ficheiroBase64: dataUrl,
        criadoEm: new Date().toISOString(),
      } as any);
      toast.success(`Molde "${name}" guardado na Biblioteca › Tricotin.`);
    } catch {
      alert(`Guardado como "${name}".`);
    }
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
    drawLettering(ctx, lettering);
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
    if (printRuler) {
      const ctx2 = off.getContext("2d");
      if (ctx2) drawRuler(ctx2);
    }
    const dataUrl = off.toDataURL("image/png");
    // Build a top-level overlay attached directly to <body> so the print CSS
    // can reliably hide everything else.
    const host = document.createElement("div");
    host.id = "tricotin-print-host";
    const wCm = (21 * calScale).toFixed(4);
    const hCm = (29.7 * calScale).toFixed(4);
    host.innerHTML = `<img src="${dataUrl}" alt="Molde Tricotin" style="width:${wCm}cm;height:${hCm}cm;display:block;page-break-inside:avoid;" />`;
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

      // Layer 2: nodes principais (sem linhas de apoio nem handles de controlo)
      nodes.forEach((n) => {
        ctx.fillStyle = "#4d4d4d";
        ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(n.x, n.y, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      });
    }
    drawLettering(ctx, lettering, { withHandles: true });
    if (showRuler) drawRuler(ctx);
  }, [nodes, isClosedPath, lineWidthTricotin, showRuler, lettering]);

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
      <div className="overflow-auto rounded-lg border bg-white opacity-100 shadow-sm tricotin-no-print">
        <div className="relative bg-white">
          <div className="tricotin-no-print pointer-events-none absolute left-3 top-3 z-10 rounded-md border border-primary/30 bg-white/95 px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm backdrop-blur">
            Arame Necessário: <span className="tabular-nums text-primary">{totalLengthCm.toFixed(1)} cm</span>
            <span className="ml-2 text-[10px] font-normal text-muted-foreground">(inclui +5% margem)</span>
          </div>
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
          {/* Watermark overlay (renderizada em cima da folha) */}
          <div className="pointer-events-none absolute inset-0">
            <Watermark w={w} />
          </div>
        </div>
      </div>
      {/* Marca d'água da folha de desenho */}
      <div className="rounded-lg border bg-card p-3 tricotin-no-print">
        <div className="mb-2 text-xs font-medium text-muted-foreground">Marca d'água da folha de desenho</div>
        <WatermarkControls w={w} set={setW} />
      </div>
      {/* Gestão do Molde (abaixo da folha de desenho) */}
      <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card p-3 tricotin-no-print">
        <span className="text-xs font-medium text-muted-foreground">Gestão do Molde:</span>
        <button onClick={saveToApp} className="rounded border px-3 py-1.5 text-xs hover:bg-muted">Guardar na Biblioteca</button>
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
      <p className="text-xs text-muted-foreground tricotin-no-print">
        Dica: no "Modo Seleção" arrasta os nós cinzentos para reposicionar, os pontos de controlo (cinza escuro) para ajustar a curvatura, ou arrasta diretamente um segmento da linha para mover toda essa secção. Os moldes guardados aparecem na Biblioteca › Tricotin. Atalhos: Ctrl/Cmd+Z (desfazer), Ctrl/Cmd+Shift+Z (refazer).
      </p>
      {/* Lettering — Auto-script + Kerning + Text on Path */}
      <div className="space-y-3 rounded-lg border bg-card p-3 tricotin-no-print">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">Lettering (texto no molde)</div>
            <div className="text-[11px] text-muted-foreground">
              Auto-script liga letras cursivas · Kerning ajusta o espaçamento · Text on Path curva o texto ao longo de reta, arco ou círculo.
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={lettering.ativa}
              onChange={(e) => setL({ ativa: e.target.checked })}
            />
            Ativar
          </label>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs">
            <span className="text-muted-foreground">Texto</span>
            <input
              type="text"
              value={lettering.text}
              onChange={(e) => setL({ text: e.target.value })}
              className="rounded border bg-background px-2 py-1"
              placeholder="Nome ou frase"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            <span className="text-muted-foreground">Fonte</span>
            <select
              value={lettering.font}
              onChange={(e) => setL({ font: e.target.value })}
              className="rounded border bg-background px-2 py-1"
            >
              <optgroup label="Cursivas (recomendadas para Auto-script)">
                {FONTES_CURSIVAS.map((f) => <option key={f} value={f}>{f}</option>)}
              </optgroup>
              <optgroup label="Todas">
                {FONTES_50.map((f) => <option key={f} value={f}>{f}</option>)}
              </optgroup>
            </select>
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <label className="flex flex-col gap-1 text-xs">
            <span className="text-muted-foreground">Tamanho ({lettering.size}px)</span>
            <input
              type="range" min={20} max={220} step={1}
              value={lettering.size}
              onChange={(e) => setL({ size: Number(e.target.value) })}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            <span className="text-muted-foreground">Kerning ({lettering.kerning > 0 ? "+" : ""}{lettering.kerning}px)</span>
            <input
              type="range" min={-30} max={40} step={1}
              value={lettering.kerning}
              onChange={(e) => setL({ kerning: Number(e.target.value) })}
            />
          </label>
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={lettering.autoScript}
              onChange={(e) => setL({ autoScript: e.target.checked })}
            />
            Auto-script (ligar letras)
          </label>
          <label className="flex flex-col gap-1 text-xs">
            <span className="text-muted-foreground">Cor</span>
            <input
              type="color"
              value={lettering.color}
              onChange={(e) => setL({ color: e.target.value })}
              className="h-8 w-16 rounded border bg-background"
            />
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-muted-foreground">Text on Path:</span>
          {(["straight", "arc", "circle"] as LetteringPath[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setL({ pathType: p })}
              className={`rounded border px-2 py-1 ${lettering.pathType === p ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            >
              {p === "straight" ? "Linha reta" : p === "arc" ? "Arco" : "Círculo"}
            </button>
          ))}
        </div>
        {lettering.pathType === "straight" && (
          <label className="flex flex-col gap-1 text-xs">
            <span className="text-muted-foreground">
              Ângulo da linha ({Math.round((lettering.straightAngle * 180) / Math.PI)}°)
            </span>
            <input
              type="range" min={-180} max={180} step={1}
              value={Math.round((lettering.straightAngle * 180) / Math.PI)}
              onChange={(e) => setL({ straightAngle: (Number(e.target.value) * Math.PI) / 180 })}
            />
          </label>
        )}
        {lettering.pathType !== "straight" && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <label className="flex flex-col gap-1 text-xs">
              <span className="text-muted-foreground">Raio ({lettering.radius}px ≈ {(lettering.radius / PX_PER_CM).toFixed(1)} cm)</span>
              <input
                type="range" min={40} max={380} step={1}
                value={lettering.radius}
                onChange={(e) => setL({ radius: Number(e.target.value) })}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              <span className="text-muted-foreground">
                Início do arco ({Math.round((lettering.angleStart * 180) / Math.PI)}°)
              </span>
              <input
                type="range" min={-180} max={180} step={1}
                value={Math.round((lettering.angleStart * 180) / Math.PI)}
                onChange={(e) => setL({ angleStart: (Number(e.target.value) * Math.PI) / 180 })}
              />
            </label>
            {lettering.pathType === "arc" && (
              <label className="flex flex-col gap-1 text-xs">
                <span className="text-muted-foreground">
                  Abertura do arco ({Math.round((lettering.arcSweep * 180) / Math.PI)}°)
                </span>
                <input
                  type="range" min={-360} max={360} step={1}
                  value={Math.round((lettering.arcSweep * 180) / Math.PI)}
                  onChange={(e) => setL({ arcSweep: (Number(e.target.value) * Math.PI) / 180 })}
                />
              </label>
            )}
          </div>
        )}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <label className="flex flex-col gap-1">
            <span className="text-muted-foreground">Centro X ({lettering.cx.toFixed(0)}px)</span>
            <input
              type="range" min={0} max={A4_W} step={1}
              value={lettering.cx}
              onChange={(e) => setL({ cx: Number(e.target.value) })}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-muted-foreground">Centro Y ({lettering.cy.toFixed(0)}px)</span>
            <input
              type="range" min={0} max={A4_H} step={1}
              value={lettering.cy}
              onChange={(e) => setL({ cy: Number(e.target.value) })}
            />
          </label>
        </div>
        <p className="text-[11px] text-muted-foreground">
          A guia tracejada azul no canvas mostra o traçado do texto (não é impressa). O texto é exportado com o molde no PNG e na impressão A4.
        </p>
      </div>
      <TracePanel
        onImport={(pts: TracePoint[]) => {
          if (!pts.length) return;
          pushHistory();
          const imported: PtNode[] = pts.map((p: TracePoint, i: number) => ({
            id: `t${Date.now().toString(36)}${i}`,
            x: p.x,
            y: p.y,
            type: i === 0 ? "start" : "straight",
          }));
          setNodes(imported);
          setIsClosedPath(false);
        }}
        fitW={W}
        fitH={H}
      />
      <TricotinProPanel
        getPoints={() => nodes.map((n) => ({ x: n.x, y: n.y }))}
        setPoints={(pts) => {
          pushHistory();
          setNodes(pts.map((p, i) => ({
            id: `p${Date.now().toString(36)}${i}`,
            x: p.x,
            y: p.y,
            type: i === 0 ? "start" : "straight",
          })));
        }}
        pxPerMm={PX_PER_MM}
        sheetW={W}
        sheetH={H}
      />
      {/* ===== Calibração (movida para o fundo da página) ===== */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-card p-3 text-xs tricotin-no-print">
        <span className="font-medium text-muted-foreground">Calibração de escala:</span>
        <label className="flex items-center gap-1">
          <input type="checkbox" checked={showRuler} onChange={(e) => setShowRuler(e.target.checked)} />
          Mostrar régua mm/cm no canvas
        </label>
        <label className="flex items-center gap-1">
          <input type="checkbox" checked={printRuler} onChange={(e) => setPrintRuler(e.target.checked)} />
          Incluir régua na impressão (verificação 1:1)
        </label>
        <span className="text-muted-foreground">
          A4 = 21,0 × 29,7 cm · 1 cm = {PX_PER_CM.toFixed(2)} px · 1 mm = {PX_PER_MM.toFixed(3)} px.
          Imprime com régua ativa e mede a barra de 100 mm — se der 10,0 cm exatos, está calibrado.
        </span>
      </div>
      <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-card p-3 text-xs tricotin-no-print">
        <div>
          <div className="font-medium text-muted-foreground">Calibração automática</div>
          <div className="text-muted-foreground">
            Imprime com a régua ativa, mede a barra de 100 mm com régua física e introduz o valor obtido.
          </div>
        </div>
        <label className="flex flex-col gap-1">
          <span className="text-muted-foreground">Medição obtida (mm)</span>
          <input
            type="number" inputMode="decimal" step="0.1" min={50} max={150}
            value={measuredMm}
            onChange={(e) => setMeasuredMm(e.target.value)}
            placeholder="ex.: 99,4"
            className="w-28 rounded border bg-background px-2 py-1"
          />
        </label>
        <button onClick={applyCalibration} className="rounded border bg-primary px-3 py-1.5 text-primary-foreground hover:opacity-90">
          Calcular &amp; aplicar
        </button>
        <button onClick={resetCalibration} className="rounded border px-3 py-1.5 hover:bg-muted">Repor 1:1</button>
        <div className="ml-auto flex flex-col items-end gap-0.5">
          <span>
            Erro atual:{" "}
            <strong className={errorMm == null ? "" : Math.abs(errorMm) < 0.2 ? "text-emerald-600" : "text-destructive"}>
              {errorMm == null ? "—" : `${errorMm > 0 ? "+" : ""}${errorMm.toFixed(2)} mm`}
            </strong>
            {errorMm != null && <span className="text-muted-foreground"> ({((errorMm / 100) * 100).toFixed(2)}%)</span>}
          </span>
          <span className="text-muted-foreground">
            Fator aplicado: <strong className="text-foreground">×{calScale.toFixed(4)}</strong>
            {" · "}Impressão: {(21 * calScale).toFixed(2)} × {(29.7 * calScale).toFixed(2)} cm
          </span>
        </div>
      </div>
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

/* ============================================================
 * TracePanel — Vetorização de imagem → polyline única contínua.
 * Ferramenta: upload → threshold + epsilon → preview → importar
 * como molde OU exportar SVG/DXF (uma única polyline garantida).
 * ============================================================ */
function TracePanel({
  onImport,
  fitW,
  fitH,
}: {
  onImport: (pts: TracePoint[]) => void;
  fitW: number;
  fitH: number;
}) {
  const fileRef = React.useRef<HTMLInputElement | null>(null);
  const previewRef = React.useRef<HTMLCanvasElement | null>(null);
  const [imgEl, setImgEl] = React.useState<HTMLImageElement | null>(null);
  const [thrMode, setThrMode] = React.useState<"auto" | "manual">("auto");
  const [thr, setThr] = React.useState<number>(128);
  const [invert, setInvert] = React.useState<boolean>(false);
  const [epsilon, setEpsilon] = React.useState<number>(1.5);
  const [result, setResult] = React.useState<TraceResult | null>(null);
  const [busy, setBusy] = React.useState(false);

  const onFile = (f: File) => {
    const url = URL.createObjectURL(f);
    const img = new Image();
    img.onload = () => {
      setImgEl(img);
      setResult(null);
    };
    img.onerror = () => toast.error("Não consegui abrir a imagem.");
    img.src = url;
  };

  const runTrace = React.useCallback(() => {
    if (!imgEl) return;
    setBusy(true);
    try {
      const r = traceImage(imgEl, {
        maxDim: 400,
        threshold: thrMode === "manual" ? thr : undefined,
        invert,
        epsilon,
      });
      setResult(r);
      if (thrMode === "auto") setThr(r.threshold);
      if (r.points.length < 4) {
        toast.warning("Muito poucos pontos detetados. Ajusta o limiar/inverte.");
      } else {
        toast.success(`Traço: ${r.points.length} pontos, ${polylineLength(r.points).toFixed(0)}px.`);
      }
    } catch (e) {
      toast.error("Falha na vetorização.");
      console.error(e);
    } finally {
      setBusy(false);
    }
  }, [imgEl, thrMode, thr, invert, epsilon]);

  // Redesenha preview
  React.useEffect(() => {
    const cv = previewRef.current;
    if (!cv || !result) return;
    cv.width = result.width;
    cv.height = result.height;
    const ctx = cv.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 1.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    for (let i = 0; i < result.points.length; i++) {
      const p = result.points[i];
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
  }, [result]);

  // Escala e centra pontos para caber no A4 do Tricotin.
  const scaledForImport = React.useMemo<TracePoint[]>(() => {
    if (!result) return [];
    const pad = 40;
    const scale = Math.min((fitW - pad * 2) / result.width, (fitH - pad * 2) / result.height);
    const w = result.width * scale;
    const h = result.height * scale;
    const ox = (fitW - w) / 2;
    const oy = (fitH - h) / 2;
    return result.points.map((p) => ({ x: ox + p.x * scale, y: oy + p.y * scale }));
  }, [result, fitW, fitH]);

  const download = (name: string, mime: string, body: string) => {
    const blob = new Blob([body], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div
      className="space-y-3 rounded-lg border bg-card p-3 tricotin-no-print"
      data-testid="trace-panel"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">Vetorização (Trace)</div>
          <div className="text-[11px] text-muted-foreground">
            Converte uma imagem em <strong>uma única polyline contínua</strong> pronta a importar
            para o molde ou a exportar como <strong>SVG/DXF</strong> (linha única garantida).
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            data-testid="trace-file"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.currentTarget.value = ""; }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="rounded border px-3 py-1.5 text-xs hover:bg-muted"
          >
            Carregar imagem
          </button>
          <button
            type="button"
            onClick={runTrace}
            disabled={!imgEl || busy}
            data-testid="trace-run"
            className="rounded border bg-primary px-3 py-1.5 text-xs text-primary-foreground hover:opacity-90 disabled:opacity-40"
          >
            {busy ? "A vetorizar…" : "Vetorizar"}
          </button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted-foreground">Limiar</span>
          <div className="flex items-center gap-2">
            <select
              value={thrMode}
              onChange={(e) => setThrMode(e.target.value as "auto" | "manual")}
              className="rounded border bg-background px-1 py-0.5"
            >
              <option value="auto">Auto (Otsu)</option>
              <option value="manual">Manual</option>
            </select>
            <input
              type="range" min={16} max={240} step={1}
              value={thr}
              disabled={thrMode === "auto"}
              onChange={(e) => setThr(Number(e.target.value))}
              className="flex-1"
            />
            <span className="w-8 tabular-nums">{thr}</span>
          </div>
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted-foreground">Simplificação (ε px)</span>
          <div className="flex items-center gap-2">
            <input
              type="range" min={0.2} max={6} step={0.1}
              value={epsilon}
              onChange={(e) => setEpsilon(Number(e.target.value))}
              className="flex-1"
            />
            <span className="w-10 tabular-nums">{epsilon.toFixed(1)}</span>
          </div>
        </label>
        <label className="flex items-center gap-2 text-xs">
          <input type="checkbox" checked={invert} onChange={(e) => setInvert(e.target.checked)} />
          <span>Inverter (fundo escuro / linha clara)</span>
        </label>
      </div>

      {result && (
        <div className="flex flex-wrap items-start gap-3">
          <div className="rounded border bg-white p-1">
            <canvas
              ref={previewRef}
              data-testid="trace-preview"
              style={{ width: "min(320px, 100%)", height: "auto", display: "block" }}
            />
          </div>
          <div className="flex flex-1 flex-col gap-2 text-xs">
            <div className="text-muted-foreground">
              <strong>{result.points.length}</strong> pontos ·{" "}
              <strong>1</strong> polyline contínua · limiar {result.threshold}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onImport(scaledForImport)}
                data-testid="trace-import"
                className="rounded border bg-primary px-3 py-1.5 text-primary-foreground hover:opacity-90"
              >
                Importar para o molde
              </button>
              <button
                type="button"
                data-testid="trace-svg"
                onClick={() => download("tracado.svg", "image/svg+xml", toSVG(result.points, result.width, result.height))}
                className="rounded border px-3 py-1.5 hover:bg-muted"
              >
                Exportar SVG
              </button>
              <button
                type="button"
                data-testid="trace-dxf"
                onClick={() => download("tracado.dxf", "application/dxf", toDXF(result.points, result.height))}
                className="rounded border px-3 py-1.5 hover:bg-muted"
              >
                Exportar DXF
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              O importador substitui o desenho atual pelo traçado vetorizado, centrado na folha A4.
              Podes editar os nós no <em>Modo Seleção</em>.
            </p>
          </div>
        </div>
      )}
    </div>
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
  const sheet = useSheet();
  const [titulo, setTitulo] = useState("");
  const [intro, setIntro] = useState("");
  const [carreiras, setCarreiras] = useState<{ texto: string; pontos: number }[]>([
    { texto: "Anel mágico com 6pb", pontos: 6 },
  ]);
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <A4Stage innerRef={ref} watermark={w} size={sheet.size} orientacao={sheet.orientacao}>
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
        <SheetControls {...sheet} />
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
        <ExportPanel targetRef={ref} defaultArea="Amigurumi" defaultTitulo={titulo || "Receita"} size={sheet.size} orientacao={sheet.orientacao} />
      </div>
    </div>
  );
}

/* ============================ COSTURA ============================ */
function CosturaTab() {
  const ref = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [w, setW] = useMarcaDAgua();
  const sheet = useSheet();
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
      <A4Stage innerRef={ref} watermark={w} size={sheet.size} orientacao={sheet.orientacao}>
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
        <SheetControls {...sheet} />
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
        <ExportPanel targetRef={ref} defaultArea="Costura" defaultTitulo={`Molde ${tamanho}`} size={sheet.size} orientacao={sheet.orientacao} />
      </div>
    </div>
  );
}

/* ============================ PONTO CRUZ ============================ */
function PontoCruzTab() {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useMarcaDAgua();
  const sheet = useSheet();
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
      <A4Stage innerRef={ref} watermark={w} size={sheet.size} orientacao={sheet.orientacao}>
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
        <SheetControls {...sheet} />
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
        <ExportPanel targetRef={ref} defaultArea="Ponto cruz" defaultTitulo="Gráfico Ponto Cruz" size={sheet.size} orientacao={sheet.orientacao} />
      </div>
    </div>
  );
}

/* ============================ BORDADO ============================ */
function BordadoTab() {
  const ref = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [w, setW] = useMarcaDAgua();
  const sheet = useSheet();
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
      <A4Stage innerRef={ref} watermark={w} size={sheet.size} orientacao={sheet.orientacao}>
        {imagemFundo && <img src={imagemFundo} className="absolute inset-0 h-full w-full object-contain opacity-50" />}
        <svg ref={svgRef} viewBox="0 0 595 842" className="absolute inset-0 h-full w-full"
             onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp}>
          {contornos.map((d, i) => <path key={`c${i}`} d={d} stroke="#1e88e5" strokeWidth="0.8" fill="none" />)}
          {paths.map((d, i) => <path key={i} d={d} stroke="#111" strokeWidth="1.5" fill="none" strokeLinecap="round" />)}
        </svg>
      </A4Stage>
      <div className="space-y-3">
        <SheetControls {...sheet} />
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
        <ExportPanel targetRef={ref} defaultArea="Bordado" defaultTitulo="Padrão Bordado" size={sheet.size} orientacao={sheet.orientacao} />
      </div>
    </div>
  );
}