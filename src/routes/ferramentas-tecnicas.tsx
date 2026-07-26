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
import { EditorMoodboardsPage } from "./editor-moodboards";
import { ConversorPage } from "./conversor-cores";
import { AmigurumiEditor } from "@/components/amigurumi-editor/AmigurumiEditor";
import { ContadorPage } from "./contador";
import { traceImage, toSVG, toDXF, polylineLength, type TracePoint, type TraceResult } from "@/lib/trace";
import { PontoCruzEditor } from "@/components/PontoCruzEditor";
import { CosturaEditor } from "@/components/CosturaEditor";
import { DMC_PALETTE, nearestDmc, type DmcColor } from "@/lib/dmc-palette";
import { buildPatternSheetPdf, downloadPdf, svgToPngDataUrl } from "@/lib/embroidery-pdf";
import { decodeDst, blocksToPaths } from "@/lib/dst-import";
import {
  splitSubpaths, resample, orderNearest, encodeDst, type StitchBlock,
} from "@/lib/dst";
import { encodePes, splitByHoop } from "@/lib/pes";
import { generateFill, estimateFillStitches, type FillOptions } from "@/lib/fill-stitches";
import {
  textToPaths,
  LETTERING_FONTS,
  MOTIF_PRESETS,
  motifPath,
  buildAppliqueLayers,
  type MotifId,
} from "@/lib/lettering";
import { autoDigitize, type DigitizedLayer } from "@/lib/auto-digitize";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
// BordadoStudio será usado em iterações futuras; a Fase 1 mantém BordadoTab
// enriquecido inline com o simulador de bastidor, grelha da regra dos terços,
// texturas de tecido e gestor de camadas simples.

export const Route = createFileRoute("/ferramentas-tecnicas")({
  head: () => ({ meta: [{ title: "Ferramentas Técnicas" }] }),
  component: () => (
    <PremiumRoute feature="Ferramentas Técnicas">
      <FerramentasPage />
    </PremiumRoute>
  ),
});

function FerramentasPage() {
  const TAB_KEY = "ferramentas-tecnicas-tab-v1";
  const [tab, setTab] = React.useState<string>(() => {
    if (typeof window === "undefined") return "instrucoes";
    try {
      const raw = window.localStorage.getItem(TAB_KEY) || "instrucoes";
      // "editor-receita" tab was removed — migrate silently.
      return raw === "editor-receita" ? "instrucoes" : raw;
    } catch { return "instrucoes"; }
  });
  React.useEffect(() => {
    try { window.localStorage.setItem(TAB_KEY, tab); } catch { /* noop */ }
  }, [tab]);
  return (
    <div className="space-y-6">
      <PageHeader title="Ferramentas Técnicas"
        description="Os 5 editores partilham tela A4, marca d'água configurável e exportação para Biblioteca, PDF e Imprimir." />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex h-auto w-full flex-wrap">
          <TabsTrigger value="instrucoes">Instruções de uso</TabsTrigger>
          <TabsTrigger value="tricotin">Editor de Moldes: Tricotin/i-cord</TabsTrigger>
          <TabsTrigger value="amigurumi">Editor de Receitas: Amigurumis & Crochê</TabsTrigger>
          <TabsTrigger value="costura">Editor de Moldes: Costura</TabsTrigger>
          <TabsTrigger value="ponto-cruz">Editor de Gráficos: Ponto Cruz</TabsTrigger>
          <TabsTrigger value="bordado">Editor de Padrões: Bordado</TabsTrigger>
          <TabsTrigger value="editor-moodboards">Editor De Moodboards</TabsTrigger>
          <TabsTrigger value="conversor">Conversor De Cores: DMC/ANCHOR</TabsTrigger>
          <TabsTrigger value="contador">Contador De Carreiras & Pontos</TabsTrigger>
        </TabsList>
        {/* forceMount keeps editor state (canvas, form, presets) alive when
            switching tabs — Radix would otherwise unmount inactive content. */}
        <TabsContent forceMount value="instrucoes" className="mt-24 data-[state=inactive]:hidden"><InstrucoesTab /></TabsContent>
        <TabsContent forceMount value="tricotin" className="mt-24 data-[state=inactive]:hidden"><TricotinTab /></TabsContent>
        <TabsContent forceMount value="amigurumi" className="mt-24 data-[state=inactive]:hidden"><AmigurumiTab /></TabsContent>
        <TabsContent forceMount value="costura" className="mt-24 data-[state=inactive]:hidden"><CosturaTab /></TabsContent>
        <TabsContent forceMount value="ponto-cruz" className="mt-24 data-[state=inactive]:hidden"><PontoCruzTab /></TabsContent>
        <TabsContent forceMount value="bordado" className="mt-24 data-[state=inactive]:hidden"><BordadoTab /></TabsContent>
        <TabsContent forceMount value="editor-moodboards" className="mt-24 data-[state=inactive]:hidden"><EditorMoodboardsPage /></TabsContent>
        <TabsContent forceMount value="conversor" className="mt-24 data-[state=inactive]:hidden"><ConversorPage /></TabsContent>
        <TabsContent forceMount value="contador" className="mt-24 data-[state=inactive]:hidden"><ContadorPage /></TabsContent>
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
    { t: "Editor de Padrões: Bordado", d: "Estúdio de bordado com bastidor virtual, camadas, grelha da regra dos terços, texturas de tecido, decalque de imagem, vetorização automática e exportação A4 pronta para transferir." },
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
  // ---------- Auto-persist current canvas across reloads ----------
  // Every knob that survives a reload is loaded once from this key and rewritten
  // whenever the user changes it. Kept minimal so the file is safe to grow.
  const CANVAS_KEY = "tricotin-canvas-state-v1";
  type CanvasSnapshot = {
    nodes: PtNode[]; isClosedPath: boolean; lineWidthTricotin: number; mode: Mode;
  };
  const initialCanvas: CanvasSnapshot = (() => {
    if (typeof window === "undefined") return { nodes: [], isClosedPath: false, lineWidthTricotin: 12, mode: "straight" };
    try {
      const raw = window.localStorage.getItem(CANVAS_KEY);
      if (!raw) return { nodes: [], isClosedPath: false, lineWidthTricotin: 12, mode: "straight" };
      const parsed = JSON.parse(raw) as Partial<CanvasSnapshot>;
      return {
        nodes: Array.isArray(parsed.nodes) ? parsed.nodes : [],
        isClosedPath: !!parsed.isClosedPath,
        lineWidthTricotin: typeof parsed.lineWidthTricotin === "number" ? parsed.lineWidthTricotin : 12,
        mode: (parsed.mode === "select" || parsed.mode === "curve" || parsed.mode === "straight") ? parsed.mode : "straight",
      };
    } catch { return { nodes: [], isClosedPath: false, lineWidthTricotin: 12, mode: "straight" }; }
  })();
  const [nodes, setNodes] = React.useState<PtNode[]>(initialCanvas.nodes);
  const [isClosedPath, setIsClosedPath] = React.useState(initialCanvas.isClosedPath);
  const [lineWidthTricotin, setLineWidthTricotin] = React.useState(initialCanvas.lineWidthTricotin);
  const [mode, setMode] = React.useState<Mode>(initialCanvas.mode);
  React.useEffect(() => {
    // Debounce to avoid thrashing localStorage while dragging.
    const id = window.setTimeout(() => {
      try {
        window.localStorage.setItem(CANVAS_KEY, JSON.stringify({ nodes, isClosedPath, lineWidthTricotin, mode }));
      } catch { /* quota / private mode */ }
    }, 250);
    return () => window.clearTimeout(id);
  }, [nodes, isClosedPath, lineWidthTricotin, mode]);
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
  // Marca de agua da folha de desenho
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
          <button onClick={() => { pushHistory(); setNodes([]); setIsClosedPath(false); }} className="rounded border px-3 py-1.5 text-xs hover:bg-muted" title="Começar uma folha vazia">Criar novo molde</button>
          <button onClick={() => { pushHistory(); setNodes([]); setIsClosedPath(false); }} className="rounded border px-3 py-1.5 text-xs hover:bg-muted">Limpar Folha do Editor</button>
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
  return <AmigurumiEditor />;
}

/* ============================ COSTURA ============================ */
function CosturaTab() { return <CosturaEditor />; }

/* ============================ PONTO CRUZ ============================ */
function PontoCruzTab() {
  return <PontoCruzEditor />;
}

/* ============================ BORDADO ============================ */
/** Botão + diálogo para escolher uma cor DMC da paleta ou pedir sugestão automática. */
function DmcPickerButton({
  current, onPick, onSuggest,
}: { current?: string; onPick: (c: DmcColor) => void; onSuggest: () => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const filtered = DMC_PALETTE.filter((c) =>
    !q ? true : c.code.toLowerCase().includes(q.toLowerCase()) || c.name.toLowerCase().includes(q.toLowerCase())
  );
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-6 px-2 text-[10px]" title="Escolher DMC">
          DMC{current ? ` ${current}` : ""}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Paleta DMC / Anchor</DialogTitle></DialogHeader>
        <div className="flex items-center gap-2">
          <Input placeholder="Pesquisar código ou nome…" value={q} onChange={(e) => setQ(e.target.value)} className="h-8 text-xs" />
          <Button size="sm" variant="secondary" onClick={() => { onSuggest(); setOpen(false); }}>
            Sugerir mais próxima
          </Button>
        </div>
        <div className="grid max-h-[420px] grid-cols-2 gap-1 overflow-y-auto pr-1 sm:grid-cols-3">
          {filtered.map((c) => (
            <button key={c.code}
              onClick={() => { onPick(c); setOpen(false); }}
              className={`flex items-center gap-2 rounded border px-2 py-1 text-left text-[11px] hover:bg-accent ${current === c.code ? "border-primary" : "border-border"}`}>
              <span className="h-5 w-5 shrink-0 rounded border" style={{ backgroundColor: c.hex }} />
              <span className="min-w-0">
                <span className="block font-medium">DMC {c.code}</span>
                <span className="block truncate text-muted-foreground">{c.name}{c.anchor ? ` · A${c.anchor}` : ""}</span>
              </span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Estúdio de Bordado — Fase 1.
 * Sobre o desenho e vetorização originais adiciona:
 *  - Simulador de bastidor (Redondo 15/20/25 cm, Oval 18×13 cm, Quadrado 15 cm)
 *  - Grelha da regra dos terços (toggle)
 *  - Texturas de tecido (algodão cru, linho, escuro)
 *  - Gestor de camadas: adicionar, renomear, cor, espessura, visibilidade,
 *    bloqueio, reordenar e apagar. Os traços entram na camada ativa e a
 *    vetorização vai sempre para a camada "Risco".
 *  - Decalque com controlo de opacidade.
 * Fases 2–6 (pincéis satin/nó francês, paletas DMC/Anchor, texto circular,
 * lightbox, export DST) serão adicionadas em iterações seguintes.
 */
type BordadoLayer = {
  id: string; nome: string; visible: boolean; locked: boolean;
  color: string; width: number; strokes: string[];
  /** Fase 3 — tipo de ponto simulado para esta camada. */
  stitch: StitchType;
  /** Fase 3 — código DMC associado (opcional). */
  dmc?: string;
};

/** Fase 3 — tipos de ponto suportados na simulação visual. */
type StitchType =
  | "backstitch"   // ponto atrás — linha contínua
  | "running"      // ponto alinhavo — tracejado curto
  | "chain"        // ponto cadeia — tracejado longo com pontas redondas
  | "couching"     // ponto acolchoado — traço + espaço amplo
  | "satin"        // ponto cheio — traço mais grosso
  | "stem"         // ponto haste — pequenos traços inclinados
  | "cross"        // ponto cruz — marcador "×" ao longo
  | "knot";        // nó francês — marcador circular ao longo

const STITCH_LABELS: Record<StitchType, string> = {
  backstitch: "Ponto atrás",
  running: "Alinhavo",
  chain: "Cadeia",
  couching: "Acolchoado",
  satin: "Cheio (satin)",
  stem: "Haste",
  cross: "Ponto cruz",
  knot: "Nó francês",
};

/** Devolve o dasharray e multiplicador de espessura para cada ponto. */
function stitchStyle(kind: StitchType, base: number): { dash?: string; widthMul: number; marker?: "cross" | "knot" } {
  switch (kind) {
    case "backstitch": return { widthMul: 1 };
    case "running":    return { dash: "6 3", widthMul: 1 };
    case "chain":      return { dash: "10 4", widthMul: 1.2 };
    case "couching":   return { dash: "3 6", widthMul: 1 };
    case "satin":      return { widthMul: 2.2 };
    case "stem":       return { dash: "8 2", widthMul: 1.1 };
    case "cross":      return { dash: `0.1 ${Math.max(6, base * 6)}`, widthMul: 0.4, marker: "cross" };
    case "knot":       return { dash: `0.1 ${Math.max(8, base * 7)}`, widthMul: 0.4, marker: "knot" };
  }
}

/** Comprimento total em px de um path "M x y L x y ..." (multi-subpath). */
function pathLengthPx(d: string): number {
  const toks = d.replace(/,/g, " ").split(/\s+/).filter(Boolean);
  let total = 0;
  let px = 0, py = 0, has = false;
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i];
    if (t === "M" || t === "L") {
      const x = parseFloat(toks[++i]);
      const y = parseFloat(toks[++i]);
      if (isNaN(x) || isNaN(y)) continue;
      if (t === "L" && has) total += Math.hypot(x - px, y - py);
      px = x; py = y; has = true;
    }
  }
  return total;
}
type HoopShape = "round15" | "round20" | "round25" | "oval" | "square";
type FabricKind = "none" | "algodao" | "linho" | "escuro";

const HOOP_PRESETS: { id: HoopShape; nome: string; wCm: number; hCm: number }[] = [
  { id: "round15", nome: "Redondo 15 cm", wCm: 15, hCm: 15 },
  { id: "round20", nome: "Redondo 20 cm", wCm: 20, hCm: 20 },
  { id: "round25", nome: "Redondo 25 cm", wCm: 25, hCm: 25 },
  { id: "oval",    nome: "Oval 18×13 cm",  wCm: 18, hCm: 13 },
  { id: "square",  nome: "Quadrado 15 cm", wCm: 15, hCm: 15 },
];
const FABRIC_STYLES: Record<FabricKind, React.CSSProperties> = {
  none: {},
  algodao: {
    backgroundColor: "#f4ecdd",
    backgroundImage:
      "repeating-linear-gradient(0deg, rgba(120,90,50,0.05) 0 1px, transparent 1px 3px), repeating-linear-gradient(90deg, rgba(120,90,50,0.05) 0 1px, transparent 1px 3px)",
  },
  linho: {
    backgroundColor: "#e8dfc8",
    backgroundImage:
      "repeating-linear-gradient(45deg, rgba(90,70,40,0.08) 0 2px, transparent 2px 6px), repeating-linear-gradient(-45deg, rgba(90,70,40,0.06) 0 2px, transparent 2px 6px)",
  },
  escuro: {
    backgroundColor: "#2b2b30",
    backgroundImage:
      "repeating-linear-gradient(0deg, rgba(255,255,255,0.04) 0 1px, transparent 1px 3px), repeating-linear-gradient(90deg, rgba(255,255,255,0.04) 0 1px, transparent 1px 3px)",
  },
};

function BordadoTab() {
  const ref = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [w, setW] = useMarcaDAgua();
  const sheet = useSheet();
  const [imagemFundo, setImagemFundo] = useState<string>("");
  const [imagemOpacidade, setImagemOpacidade] = useState(50);
  const [limiar, setLimiar] = useState(128);
  const [suavizar, setSuavizar] = useState(1);
  const [minSeg, setMinSeg] = useState(4);
  const [separados, setSeparados] = useState(true);
  const [aTrabalhar, setATrabalhar] = useState(false);
  const drawing = useRef(false);
  // Buffer de pontos do traço atual (para suavização de tremor via média móvel).
  const rawPts = useRef<{ x: number; y: number }[]>([]);
  // Índices dos traços criados por um único gesto (original + espelhos), para desfazer/apagar em conjunto.
  const currentGesture = useRef<number[]>([]);

  // Bastidor / fundo / grelha
  const [hoopOn, setHoopOn] = useState(true);
  const [hoop, setHoop] = useState<HoopShape>("round20");
  const [thirds, setThirds] = useState(false);
  const [fabric, setFabric] = useState<FabricKind>("none");

  // Fase 2 — ferramentas de desenho
  type BordadoTool = "pen" | "smooth" | "eraser";
  const [tool, setTool] = useState<BordadoTool>("pen");
  const [smoothN, setSmoothN] = useState(6);        // janela da média móvel (2–12)
  const [mirrorOn, setMirrorOn] = useState(false);
  const [mirrorAxes, setMirrorAxes] = useState(2); // 1..12 (1 = só o eixo, sem rotação extra)
  const [eraserR, setEraserR] = useState(10);       // raio do apagador em px (SVG)
  // Histórico de gestos p/ desfazer o último traço (inclui espelhos).
  const undoStack = useRef<{ layerId: string; removeCount: number }[]>([]);

  // Camadas
  const [layers, setLayers] = useState<BordadoLayer[]>(() => [
    { id: "l-esboco",   nome: "Esboço",   visible: true, locked: false, color: "#9ca3af", width: 1.2, strokes: [], stitch: "running" },
    { id: "l-risco",    nome: "Risco",    visible: true, locked: false, color: "#111111", width: 1.5, strokes: [], stitch: "backstitch" },
    { id: "l-decalque", nome: "Decalque", visible: true, locked: true,  color: "#1e88e5", width: 0.8, strokes: [], stitch: "backstitch" },
  ]);
  const [activeLayer, setActiveLayer] = useState("l-risco");
  const active = layers.find((l) => l.id === activeLayer) ?? layers[0];

  const patchLayer = (id: string, patch: Partial<BordadoLayer>) =>
    setLayers((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  const addLayer = () => {
    const id = `l-${Date.now()}`;
    setLayers((ls) => [...ls, { id, nome: `Camada ${ls.length + 1}`, visible: true, locked: false, color: "#111111", width: 1.5, strokes: [], stitch: "backstitch" }]);
    setActiveLayer(id);
  };
  const removeLayer = (id: string) => setLayers((ls) => {
    if (ls.length <= 1) { toast.error("Tens de manter pelo menos uma camada."); return ls; }
    const next = ls.filter((l) => l.id !== id);
    if (id === activeLayer) setActiveLayer(next[0].id);
    return next;
  });
  const moveLayer = (id: string, dir: -1 | 1) => setLayers((ls) => {
    const i = ls.findIndex((l) => l.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= ls.length) return ls;
    const copy = ls.slice(); [copy[i], copy[j]] = [copy[j], copy[i]]; return copy;
  });

  // ---------- Fase 2: desenho, simetria e trim ----------

  /** Reflete um ponto no eixo vertical central do A4 (x = A4_W/2). */
  const reflectX = (x: number) => A4_W - x;
  /** Rotaciona um ponto k passos de (360/N) graus em volta do centro do A4. */
  const rotateAround = (x: number, y: number, k: number, n: number) => {
    if (n <= 1 || k === 0) return { x, y };
    const a = (2 * Math.PI * k) / n;
    const cx = A4_W / 2, cy = A4_H / 2;
    const dx = x - cx, dy = y - cy;
    return { x: cx + dx * Math.cos(a) - dy * Math.sin(a), y: cy + dx * Math.sin(a) + dy * Math.cos(a) };
  };
  /** Gera N cópias giradas (original + espelho de cada) de um conjunto de pontos. */
  const mirroredPointSets = (pts: { x: number; y: number }[]) => {
    if (!mirrorOn) return [pts];
    const sets: { x: number; y: number }[][] = [];
    const n = Math.max(1, Math.min(12, mirrorAxes));
    for (let k = 0; k < n; k++) {
      sets.push(pts.map((p) => rotateAround(p.x, p.y, k, n)));
      sets.push(pts.map((p) => { const r = rotateAround(p.x, p.y, k, n); return { x: reflectX(r.x), y: r.y }; }));
    }
    return sets;
  };

  const pointsToPath = (pts: { x: number; y: number }[]) =>
    pts.length ? "M " + pts.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" L ") : "";

  /** Média móvel simples com janela N nas duas dimensões. Reduz tremor sem cortar cantos como Chaikin. */
  const smoothMovingAverage = (pts: { x: number; y: number }[], n: number) => {
    if (n <= 1 || pts.length < 3) return pts;
    const half = Math.floor(n / 2);
    const out: { x: number; y: number }[] = [];
    for (let i = 0; i < pts.length; i++) {
      let sx = 0, sy = 0, c = 0;
      for (let j = Math.max(0, i - half); j <= Math.min(pts.length - 1, i + half); j++) {
        sx += pts[j].x; sy += pts[j].y; c++;
      }
      out.push({ x: sx / c, y: sy / c });
    }
    return out;
  };

  /** Distância mínima entre um ponto e um segmento — para o apagador com trim. */
  const distPointSeg = (px: number, py: number, ax: number, ay: number, bx: number, by: number) => {
    const dx = bx - ax, dy = by - ay;
    const l2 = dx * dx + dy * dy;
    if (l2 === 0) { const ex = px - ax, ey = py - ay; return Math.hypot(ex, ey); }
    let t = ((px - ax) * dx + (py - ay) * dy) / l2;
    t = Math.max(0, Math.min(1, t));
    const qx = ax + t * dx, qy = ay + t * dy;
    return Math.hypot(px - qx, py - qy);
  };

  /** Converte "M x y L x y ..." num array de pontos. Ignora sub-caminhos (apenas Fase 2). */
  const pathToPoints = (d: string): { x: number; y: number }[] => {
    const tokens = d.replace(/,/g, " ").split(/\s+/).filter(Boolean);
    const pts: { x: number; y: number }[] = [];
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      if (t === "M" || t === "L") {
        const x = parseFloat(tokens[++i]); const y = parseFloat(tokens[++i]);
        if (!isNaN(x) && !isNaN(y)) pts.push({ x, y });
      }
    }
    return pts;
  };

  /** Aplica o apagador com trim: corta um traço nos pontos que ficam dentro do círculo do apagador. */
  const trimAtPoint = (px: number, py: number) => {
    setLayers((ls) => ls.map((l) => {
      if (!l.visible || l.locked) return l;
      const novos: string[] = [];
      for (const d of l.strokes) {
        const pts = pathToPoints(d);
        if (pts.length < 2) { novos.push(d); continue; }
        let current: { x: number; y: number }[] = [];
        for (let i = 0; i < pts.length - 1; i++) {
          const inside = distPointSeg(px, py, pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y) < eraserR;
          if (inside) {
            if (current.length >= 2) novos.push(pointsToPath(current));
            current = [];
          } else {
            if (current.length === 0) current.push(pts[i]);
            current.push(pts[i + 1]);
          }
        }
        if (current.length >= 2) novos.push(pointsToPath(current));
      }
      return { ...l, strokes: novos };
    }));
  };

  const onDown = (e: React.PointerEvent<SVGSVGElement>) => {
    const p = ponto(e, svgRef.current!);
    if (tool === "eraser") { drawing.current = true; trimAtPoint(p.x, p.y); return; }
    if (!active || active.locked || !active.visible) { toast.error("Camada bloqueada ou oculta."); return; }
    drawing.current = true;
    rawPts.current = [p];
    const sets = mirroredPointSets(rawPts.current);
    const startPaths = sets.map(pointsToPath);
    currentGesture.current = [];
    setLayers((ls) => ls.map((l) => {
      if (l.id !== active.id) return l;
      const base = l.strokes.length;
      startPaths.forEach((_, i) => currentGesture.current.push(base + i));
      return { ...l, strokes: [...l.strokes, ...startPaths] };
    }));
  };
  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!drawing.current) return;
    const p = ponto(e, svgRef.current!);
    if (tool === "eraser") { trimAtPoint(p.x, p.y); return; }
    if (!active) return;
    rawPts.current.push(p);
    const smoothed = tool === "smooth" ? smoothMovingAverage(rawPts.current, smoothN) : rawPts.current;
    const sets = mirroredPointSets(smoothed);
    const paths = sets.map(pointsToPath);
    setLayers((ls) => ls.map((l) => {
      if (l.id !== active.id) return l;
      const strokes = l.strokes.slice();
      currentGesture.current.forEach((idx, k) => { if (paths[k]) strokes[idx] = paths[k]; });
      return { ...l, strokes };
    }));
  };
  const onUp = () => {
    if (drawing.current && tool !== "eraser" && currentGesture.current.length && active) {
      undoStack.current.push({ layerId: active.id, removeCount: currentGesture.current.length });
    }
    drawing.current = false;
    rawPts.current = [];
    currentGesture.current = [];
  };

  const desfazerUltimoTraco = () => {
    const g = undoStack.current.pop();
    if (!g) { toast.error("Nada para desfazer."); return; }
    setLayers((ls) => ls.map((l) => l.id === g.layerId
      ? { ...l, strokes: l.strokes.slice(0, Math.max(0, l.strokes.length - g.removeCount)) }
      : l));
  };

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
      const edge = new Uint8Array(W * H);
      for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
        const c = lum[y * W + x];
        if (c !== lum[y * W + x + 1] || c !== lum[(y + 1) * W + x]) edge[y * W + x] = 1;
      }
      const sx = A4_W / W, sy = A4_H / H;
      type Seg = { x1: number; y1: number; x2: number; y2: number };
      const segs: Seg[] = [];
      for (let y = 0; y < H; y++) {
        let start = -1;
        for (let x = 0; x < W; x++) {
          if (edge[y * W + x]) { if (start < 0) start = x; }
          else if (start >= 0) {
            if (x - start >= minSeg) segs.push({ x1: start * sx, y1: y * sy, x2: (x - 1) * sx, y2: y * sy });
            start = -1;
          }
        }
      }
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
      setLayers((ls) => ls.map((l) => l.id === "l-risco" ? { ...l, strokes: [...l.strokes, ...novos] } : l));
      toast.success(`${novos.length} contorno(s) gerado(s) na camada Risco.`);
    } catch (e) {
      toast.error("Falha na vetorização: " + (e as Error).message);
    } finally { setATrabalhar(false); }
  };

  // Overlay do bastidor
  const hoopSpec = HOOP_PRESETS.find((h) => h.id === hoop)!;
  const hoopWpx = hoopSpec.wCm * PX_PER_CM;
  const hoopHpx = hoopSpec.hCm * PX_PER_CM;
  const cx = A4_W / 2, cy = A4_H / 2;
  const decalqueVisivel = layers.find((l) => l.id === "l-decalque")?.visible ?? true;

  // Fase 3 — estatísticas de linha (comprimento total por camada em cm).
  const linhaStats = useMemo(() => {
    return layers.map((l) => {
      const px = l.strokes.reduce((s, d) => s + pathLengthPx(d), 0);
      const cm = px / PX_PER_CM;
      // margem ~15% para nós, cruzamentos e sobra de agulha
      const cmComMargem = cm * 1.15;
      return { id: l.id, nome: l.nome, cm, cmComMargem, dmc: l.dmc };
    });
  }, [layers]);
  const totalCmMargem = linhaStats.reduce((s, x) => s + x.cmComMargem, 0);

  // ---------- Fase 4: modo ponto cruz + grelha Aida + conversão foto→gráfico ----------
  /** Contagem Aida (crosses por polegada). 0 desliga a grelha. */
  const [aidaCount, setAidaCount] = useState<0 | 11 | 14 | 16 | 18>(0);
  const [chartCells, setChartCells] = useState<{ gx: number; gy: number; dmc: string; hex: string }[]>([]);
  const [nCores, setNCores] = useState(12);
  const [convertendo, setConvertendo] = useState(false);
  const [carrinhoOpen, setCarrinhoOpen] = useState(false);
  // Fase 5 — estado UI declarado cedo (usado no return); a lógica que depende
  // de chartArea/chartCells está mais abaixo após essas variáveis existirem.
  const [stitchLenMm, setStitchLenMm] = useState(3);
  const [orderByNearest, setOrderByNearest] = useState(true);
  const [dstBusy, setDstBusy] = useState(false);
  const [circText, setCircText] = useState("Craft Business Master");
  const [circRadius, setCircRadius] = useState(60);
  const [circFontPx, setCircFontPx] = useState(20);
  const [circClockwise, setCircClockwise] = useState(true);
  // Fase 6 — PES + tiling multi-bastidor + reordenação de cores
  const [pesBusy, setPesBusy] = useState(false);
  const [tilingOn, setTilingOn] = useState(false);
  const [tileMarginMm, setTileMarginMm] = useState(5);
  const [colorOrder, setColorOrder] = useState<number[] | null>(null);
  // Fase 7 — preenchimento (satin/tatami) + underlay + compensação de puxão
  const [fillMode, setFillMode] = useState<"satin" | "tatami">("tatami");
  const [fillAngle, setFillAngle] = useState(0);
  const [fillSpacingPx, setFillSpacingPx] = useState(2.2);
  const [fillStitchPx, setFillStitchPx] = useState(6);
  const [fillStagger, setFillStagger] = useState(0.5);
  const [fillPullPx, setFillPullPx] = useState(0.6);
  const [fillUnderlay, setFillUnderlay] = useState<0 | 1 | 2>(1);
  const [fillUnderlayInsetPx, setFillUnderlayInsetPx] = useState(1.6);
  // Fase 8 — Lettering + Motivos + Apliques
  const [letText, setLetText] = useState("Bordado");
  const [letFontId, setLetFontId] = useState<string>(LETTERING_FONTS[0].id);
  const [letSizeMm, setLetSizeMm] = useState(18);
  const [letSpacingPx, setLetSpacingPx] = useState(0);
  const [letSimplify, setLetSimplify] = useState(0.6);
  const [motifId, setMotifId] = useState<MotifId>("heart");
  const [motifSizeMm, setMotifSizeMm] = useState(30);
  const [appliqueCover, setAppliqueCover] = useState("#111111");
  const [appliqueWidth, setAppliqueWidth] = useState(3.5);
  // Fase 9 — Auto-digitize + Monogramas
  const [autoNCores, setAutoNCores] = useState(5);
  const [autoTargetW, setAutoTargetW] = useState(220);
  const [autoSimplify, setAutoSimplify] = useState(0.8);
  const [autoMinRegion, setAutoMinRegion] = useState(24);
  const [autoWidthMm, setAutoWidthMm] = useState(120);
  const [autoFillOnCreate, setAutoFillOnCreate] = useState(true);
  const [autoBusy, setAutoBusy] = useState(false);
  const [monoIniciais, setMonoIniciais] = useState("AF");
  const [monoFontId, setMonoFontId] = useState<string>(LETTERING_FONTS[1].id);
  const [monoSizeMm, setMonoSizeMm] = useState(40);
  const [monoFrame, setMonoFrame] = useState<MotifId>("circle");
  const [monoFrameSizeMm, setMonoFrameSizeMm] = useState(70);
  const [monoFramePadMm, setMonoFramePadMm] = useState(6);
  const [monoDoubleFrame, setMonoDoubleFrame] = useState(true);
  // Fase 10 — pré-visualização 3D + folha de padrão PDF
  const [preview3D, setPreview3D] = useState(false);
  const [fabric3D, setFabric3D] = useState<"aida" | "linho" | "algodao">("aida");
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfTitulo, setPdfTitulo] = useState("Padrão de Bordado");
  const [pdfAutor, setPdfAutor] = useState("");
  // Fase 11 — importação DST + simulador animado
  const [simOn, setSimOn] = useState(false);
  const [simSpeed, setSimSpeed] = useState(400); // pontos/segundo
  const [simProgress, setSimProgress] = useState(0); // 0..1
  const [simPlaying, setSimPlaying] = useState(false);
  const dstFileRef = useRef<HTMLInputElement>(null);

  const fillOpts: FillOptions = {
    mode: fillMode,
    angleDeg: fillAngle,
    spacingPx: fillSpacingPx,
    stitchPx: fillStitchPx,
    stagger: fillStagger,
    pullCompensationPx: fillPullPx,
    underlay: fillUnderlay,
    underlayInsetPx: fillUnderlayInsetPx,
  };

  const preencherCamadaAtiva = () => {
    if (!active || active.locked) { toast.error("Camada ativa bloqueada."); return; }
    const fechados = active.strokes.filter((d) => /z/i.test(d));
    if (fechados.length === 0) { toast.error("A camada ativa não tem contornos fechados (usa Z para fechar)."); return; }
    let total = 0;
    const novos: string[] = [];
    for (const d of fechados) {
      const fill = generateFill(d, fillOpts);
      if (fill) { novos.push(fill); total += estimateFillStitches(d, fillOpts); }
    }
    if (novos.length === 0) { toast.error("Nenhum polígono válido para preencher."); return; }
    setLayers((ls) => ls.map((l) => l.id === active.id ? { ...l, strokes: [...l.strokes, ...novos] } : l));
    toast.success(`Preenchimento gerado (~${total.toLocaleString()} pontos, ${fillMode}).`);
  };

  // ---------- Fase 8: lettering, motivos e apliques ----------
  const inserirLettering = () => {
    if (!active || active.locked) { toast.error("Camada ativa bloqueada."); return; }
    const font = LETTERING_FONTS.find((f) => f.id === letFontId) ?? LETTERING_FONTS[0];
    const sizePx = letSizeMm * PX_PER_MM;
    // Estimativa de largura para centrar (measureText interno faz o cálculo real).
    const cvs = document.createElement("canvas");
    const ctx = cvs.getContext("2d")!;
    ctx.font = `${font.weight} ${sizePx}px ${font.family}`;
    const wEst = ctx.measureText(letText).width;
    const x = A4_W / 2 - wEst / 2;
    const y = A4_H / 2 - sizePx / 2;
    try {
      const paths = textToPaths({
        text: letText, fontFamily: font.family, fontWeight: font.weight,
        sizePx, x, y, letterSpacingPx: letSpacingPx, simplifyPx: letSimplify,
      });
      if (paths.length === 0) { toast.error("Não foi possível traçar o texto."); return; }
      setLayers((ls) => ls.map((l) => l.id === active.id ? { ...l, strokes: [...l.strokes, ...paths] } : l));
      toast.success(`Lettering inserido (${paths.length} contornos). Usa "Aplicar preenchimento" para satin/tatami.`);
    } catch (e) {
      toast.error("Falha ao traçar o texto: " + (e as Error).message);
    }
  };

  const inserirMotif = () => {
    if (!active || active.locked) { toast.error("Camada ativa bloqueada."); return; }
    const sizePx = motifSizeMm * PX_PER_MM;
    const path = motifPath(motifId, A4_W / 2, A4_H / 2, sizePx);
    setLayers((ls) => ls.map((l) => l.id === active.id ? { ...l, strokes: [...l.strokes, path] } : l));
    toast.success("Motivo inserido no centro da página.");
  };

  const gerarAppliqueDaCamadaAtiva = () => {
    if (!active) { toast.error("Sem camada ativa."); return; }
    const closed = active.strokes.filter((d) => /z/i.test(d));
    if (closed.length === 0) { toast.error("A camada ativa não tem contornos fechados."); return; }
    const specs = buildAppliqueLayers(closed, appliqueCover, appliqueWidth);
    const novas: BordadoLayer[] = specs.map((s) => ({
      id: `l-appl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      nome: s.nome, visible: true, locked: false,
      color: s.color, width: s.width, strokes: s.strokes, stitch: s.stitch,
    }));
    setLayers((ls) => [...ls, ...novas]);
    setColorOrder(null);
    toast.success("Sequência de aplique criada em 3 camadas (Colocar → Fixar → Cobrir).");
  };

  // ---------- Fase 9: auto-digitize (foto → camadas) + monogramas ----------
  const autoDigitizeImagem = async () => {
    if (!imagemFundo) { toast.error("Importa uma imagem de decalque primeiro."); return; }
    setAutoBusy(true);
    try {
      const outWpx = autoWidthMm * PX_PER_MM;
      const originX = A4_W / 2 - outWpx / 2;
      // altura aproximada preserva o rácio da imagem original ao alinhar no A4
      const img = new Image(); img.src = imagemFundo;
      await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(new Error("img")); });
      const ratio = img.naturalHeight / img.naturalWidth;
      const outHpx = outWpx * ratio;
      const originY = A4_H / 2 - outHpx / 2;
      const digital: DigitizedLayer[] = await autoDigitize(imagemFundo, {
        colors: autoNCores,
        targetWidthPx: autoTargetW,
        simplifyPx: autoSimplify,
        minRegionPx: autoMinRegion,
        originX, originY, outWidthPx: outWpx,
      });
      if (digital.length === 0) { toast.error("Nenhuma cor detetada com regiões suficientes."); return; }
      const novas: BordadoLayer[] = digital.map((d, i) => {
        let strokes = d.paths;
        if (autoFillOnCreate) {
          const fills: string[] = [];
          for (const p of d.paths) {
            const f = generateFill(p, fillOpts);
            if (f) fills.push(f);
          }
          strokes = [...d.paths, ...fills];
        }
        return {
          id: `l-auto-${Date.now()}-${i}`,
          nome: `Foto ${i + 1} — ${d.hex}`,
          visible: true, locked: false,
          color: d.hex,
          width: 1.2,
          strokes,
          stitch: "satin",
        };
      });
      setLayers((ls) => [...ls, ...novas]);
      setColorOrder(null);
      toast.success(`Auto-digitize: ${novas.length} camada(s) criadas${autoFillOnCreate ? " com preenchimento" : ""}.`);
    } catch (e) {
      toast.error("Falha no auto-digitize: " + (e as Error).message);
    } finally { setAutoBusy(false); }
  };

  const inserirMonograma = () => {
    if (!active || active.locked) { toast.error("Camada ativa bloqueada."); return; }
    const font = LETTERING_FONTS.find((f) => f.id === monoFontId) ?? LETTERING_FONTS[0];
    const sizePx = monoSizeMm * PX_PER_MM;
    const cvs = document.createElement("canvas");
    const ctx = cvs.getContext("2d")!;
    ctx.font = `${font.weight} ${sizePx}px ${font.family}`;
    const wEst = ctx.measureText(monoIniciais).width;
    const x = A4_W / 2 - wEst / 2;
    const y = A4_H / 2 - sizePx / 2;
    try {
      const letters = textToPaths({
        text: monoIniciais, fontFamily: font.family, fontWeight: font.weight,
        sizePx, x, y, simplifyPx: 0.5,
      });
      const frameSizePx = (monoFrameSizeMm + monoFramePadMm) * PX_PER_MM;
      const outer = motifPath(monoFrame, A4_W / 2, A4_H / 2, frameSizePx);
      const paths = [outer, ...(monoDoubleFrame ? [motifPath(monoFrame, A4_W / 2, A4_H / 2, frameSizePx - 5 * PX_PER_MM)] : []), ...letters];
      setLayers((ls) => ls.map((l) => l.id === active.id ? { ...l, strokes: [...l.strokes, ...paths] } : l));
      toast.success(`Monograma inserido (${letters.length} contornos + moldura).`);
    } catch (e) {
      toast.error("Falha ao criar monograma: " + (e as Error).message);
    }
  };

  /** Tamanho em px de cada célula (1 cruz) na grelha Aida corrente. */
  const cellPx = aidaCount ? (2.54 / aidaCount) * PX_PER_CM : 0;
  /** Origem da grelha centrada na página. */
  const chartArea = useMemo(() => {
    if (!aidaCount) return null;
    // Restringe ao bastidor quando visível, caso contrário ao A4 completo com 2 cm de margem.
    const wCm = hoopOn ? hoopSpec.wCm : 21 - 4;
    const hCm = hoopOn ? hoopSpec.hCm : 29.7 - 4;
    const wPx = wCm * PX_PER_CM, hPx = hCm * PX_PER_CM;
    const nx = Math.floor(wPx / cellPx), ny = Math.floor(hPx / cellPx);
    const x0 = A4_W / 2 - (nx * cellPx) / 2;
    const y0 = A4_H / 2 - (ny * cellPx) / 2;
    return { x0, y0, nx, ny, cellPx };
  }, [aidaCount, hoopOn, hoopSpec.wCm, hoopSpec.hCm, cellPx]);

  /** Converte a imagem de decalque para um gráfico de ponto cruz na grelha Aida atual. */
  const converterParaPontoCruz = async () => {
    if (!chartArea) { toast.error("Ativa uma grelha Aida primeiro."); return; }
    if (!imagemFundo) { toast.error("Importa uma imagem de decalque primeiro."); return; }
    setConvertendo(true);
    try {
      const img = new Image();
      img.src = imagemFundo;
      await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(new Error("img")); });
      const { nx, ny } = chartArea;
      // Downsample em canvas para uma cor média por célula.
      const cvs = document.createElement("canvas");
      cvs.width = nx; cvs.height = ny;
      const ctx = cvs.getContext("2d")!;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(img, 0, 0, nx, ny);
      const { data } = ctx.getImageData(0, 0, nx, ny);

      // Selecionar as N cores mais representativas do universo DMC nesta imagem.
      const contagem = new Map<string, number>();
      for (let i = 0; i < nx * ny; i++) {
        const a = data[i * 4 + 3];
        if (a < 40) continue; // transparente
        const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2];
        const hex = "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
        const near = nearestDmc(hex);
        contagem.set(near.code, (contagem.get(near.code) ?? 0) + 1);
      }
      const topCodes = new Set(
        [...contagem.entries()].sort((a, b) => b[1] - a[1]).slice(0, Math.max(2, nCores)).map(([k]) => k)
      );
      const paletaFiltrada = DMC_PALETTE.filter((c) => topCodes.has(c.code));

      const cells: { gx: number; gy: number; dmc: string; hex: string }[] = [];
      for (let y = 0; y < ny; y++) {
        for (let x = 0; x < nx; x++) {
          const i = (y * nx + x) * 4;
          const a = data[i + 3];
          if (a < 40) continue;
          const r = data[i], g = data[i + 1], b = data[i + 2];
          // Mais próxima dentro da paleta reduzida (evita ruído colorido).
          let best = paletaFiltrada[0], bd = Infinity;
          for (const c of paletaFiltrada) {
            const cr = parseInt(c.hex.slice(1, 3), 16);
            const cg = parseInt(c.hex.slice(3, 5), 16);
            const cb = parseInt(c.hex.slice(5, 7), 16);
            const d = (r - cr) ** 2 + (g - cg) ** 2 + (b - cb) ** 2;
            if (d < bd) { bd = d; best = c; }
          }
          cells.push({ gx: x, gy: y, dmc: best.code, hex: best.hex });
        }
      }
      setChartCells(cells);
      toast.success(`Gráfico gerado: ${cells.length} cruzes em ${paletaFiltrada.length} cores DMC.`);
    } catch (e) {
      toast.error("Falha na conversão: " + (e as Error).message);
    } finally { setConvertendo(false); }
  };

  /** Lista de compras DMC agregada (gráfico ponto cruz + camadas com DMC). */
  const materiais = useStore((s) => s.materiais);
  const listaCompras = useMemo(() => {
    // agregar cruzes por DMC (1 cruz ≈ ~2 × diagonal da célula × 2 passagens)
    const contagem = new Map<string, { hex: string; stitches: number; cm: number }>();
    for (const c of chartCells) {
      const prev = contagem.get(c.dmc);
      const cellCm = cellPx / PX_PER_CM || 0.15;
      const cmPorCruz = cellCm * 2 * Math.SQRT2 * 1.15; // ida+volta em cada perna
      const add = { hex: c.hex, stitches: 1, cm: cmPorCruz };
      contagem.set(c.dmc, prev
        ? { hex: c.hex, stitches: prev.stitches + 1, cm: prev.cm + add.cm }
        : add);
    }
    // adicionar as camadas com DMC definido usando os cm estimados dos traços
    for (const s of linhaStats) {
      if (!s.dmc) continue;
      const layer = layers.find((l) => l.id === s.id);
      if (!layer) continue;
      const hex = layer.color;
      const prev = contagem.get(s.dmc);
      contagem.set(s.dmc, prev
        ? { hex, stitches: prev.stitches, cm: prev.cm + s.cmComMargem }
        : { hex, stitches: 0, cm: s.cmComMargem });
    }
    const rows = [...contagem.entries()].map(([code, v]) => {
      const dmc = DMC_PALETTE.find((d) => d.code === code);
      const emStock = materiais.find(
        (m) => (m.marca || "").toUpperCase() === "DMC" && (m.codigoCor || "") === code
      );
      return {
        code, nome: dmc?.name ?? "—", anchor: dmc?.anchor,
        hex: v.hex, stitches: v.stitches, cm: v.cm,
        temStock: !!emStock, stock: emStock?.stock ?? 0, unidade: emStock?.unidade ?? "",
      };
    }).sort((a, b) => b.cm - a.cm);
    return rows;
  }, [chartCells, cellPx, linhaStats, layers, materiais]);

  const exportarListaCsv = () => {
    const linhas = [
      "DMC;Nome;Anchor;Cruzes;Linha estimada (cm);Em stock;Quantidade em stock;Unidade",
      ...listaCompras.map((r) =>
        [r.code, r.nome.replace(/;/g, ","), r.anchor ?? "", r.stitches, r.cm.toFixed(1), r.temStock ? "sim" : "não", r.stock, r.unidade].join(";")
      ),
    ].join("\n");
    const blob = new Blob([linhas], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "lista-linhas-dmc.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success("Lista exportada em CSV.");
  };

  // ---------- Fase 10: folha de padrão PDF ----------
  const exportarPatternSheetPdf = async () => {
    if (!svgRef.current) { toast.error("SVG não disponível."); return; }
    setPdfBusy(true);
    try {
      const chartPngDataUrl = await svgToPngDataUrl(svgRef.current, 1600);
      const dimensaoCm = { w: A4_W / PX_PER_CM, h: A4_H / PX_PER_CM };
      const totalStitches = listaCompras.reduce((s, r) => s + r.stitches, 0);
      const bytes = await buildPatternSheetPdf({
        titulo: pdfTitulo || "Padrão de Bordado",
        autor: pdfAutor || undefined,
        hoop: hoopOn ? `${hoop === "square" ? "Quadrado" : "Redondo"} ${(hoopWpx / PX_PER_CM).toFixed(0)}×${(hoopHpx / PX_PER_CM).toFixed(0)} cm` : undefined,
        aida: aidaCount || undefined,
        dimensaoCm,
        totalStitches,
        totalColors: listaCompras.length,
        linhas: listaCompras,
        chartPngDataUrl,
        watermark: w?.texto || undefined,
      });
      downloadPdf(bytes, `padrao-bordado-${Date.now()}.pdf`);
      toast.success("Folha de padrão PDF gerada.");
    } catch (e) {
      toast.error("Falha ao gerar PDF: " + (e as Error).message);
    } finally { setPdfBusy(false); }
  };

  // ---------- Fase 11: importação DST ----------
  const importarDst = async (file: File) => {
    try {
      const buf = await file.arrayBuffer();
      const blocks = decodeDst(buf, PX_PER_MM);
      if (blocks.length === 0) { toast.error("DST sem pontos válidos."); return; }
      const paths = blocksToPaths(blocks, { cx: A4_W / 2, cy: A4_H / 2 });
      const novosLayers: BordadoLayer[] = paths
        .filter((p) => p.d)
        .map((p, i) => ({
          id: crypto.randomUUID(),
          nome: `DST · ${p.label}`,
          color: p.color,
          width: 1.6,
          stitch: "running",
          visible: true,
          locked: false,
          strokes: [p.d],
        }));
      setLayers((ls) => [...ls, ...novosLayers]);
      toast.success(`DST importado: ${novosLayers.length} camadas, ${blocks.reduce((s, b) => s + b.points.length, 0).toLocaleString()} pontos.`);
    } catch (e) {
      toast.error("Falha ao importar DST: " + (e as Error).message);
    }
  };


  // ---------- Fase 5: exportação DST + sequência de máquina + texto circular ----------
  /** Reduz camadas visíveis a blocos de pontos (um bloco por camada, com re-amostragem). */
  const buildStitchBlocks = (): StitchBlock[] => {
    const stepPx = stitchLenMm * PX_PER_MM;
    const blocks: StitchBlock[] = [];
    for (const l of layers) {
      if (!l.visible || l.strokes.length === 0) continue;
      const subs: { x: number; y: number }[][] = [];
      for (const d of l.strokes) {
        for (const sub of splitSubpaths(d)) {
          if (sub.length < 2) continue;
          subs.push(resample(sub, stepPx));
        }
      }
      if (subs.length === 0) continue;
      const ordered = orderByNearest ? orderNearest(subs) : subs;
      const points: { x: number; y: number }[] = [];
      for (const sub of ordered) for (const p of sub) points.push(p);
      blocks.push({ color: l.color, label: `${l.nome}${l.dmc ? ` (DMC ${l.dmc})` : ""}`, points });
    }
    if (chartArea && chartCells.length > 0) {
      const porCor = new Map<string, { x: number; y: number }[]>();
      for (const c of chartCells) {
        const x = chartArea.x0 + (c.gx + 0.5) * chartArea.cellPx;
        const y = chartArea.y0 + (c.gy + 0.5) * chartArea.cellPx;
        const r = chartArea.cellPx / 2;
        const arr = porCor.get(c.dmc) ?? [];
        arr.push({ x: x - r, y: y - r }, { x: x + r, y: y + r });
        arr.push({ x: x - r, y: y + r }, { x: x + r, y: y - r });
        porCor.set(c.dmc, arr);
      }
      for (const [dmc, pts] of porCor.entries()) {
        const dmcC = DMC_PALETTE.find((d) => d.code === dmc);
        blocks.push({ color: dmcC?.hex ?? "#000000", label: `Cruzes DMC ${dmc}`, points: pts });
      }
    }
    return blocks;
  };

  const exportarDst = async () => {
    const blocks = applyColorOrder(buildStitchBlocks());
    if (blocks.length === 0) { toast.error("Sem traços visíveis para exportar."); return; }
    setDstBusy(true);
    try {
      const blob = encodeDst(blocks, PX_PER_MM, "CBM_BORDADO");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `bordado-${Date.now()}.dst`; a.click();
      URL.revokeObjectURL(url);
      toast.success(`DST gerado com ${blocks.length} cor(es). Pronto para a máquina.`);
    } catch (e) {
      toast.error("Falha ao gerar DST: " + (e as Error).message);
    } finally { setDstBusy(false); }
  };

  // Reordena blocos conforme a sequência do utilizador (ou identidade).
  const applyColorOrder = (blocks: StitchBlock[]): StitchBlock[] => {
    if (!colorOrder || colorOrder.length !== blocks.length) return blocks;
    const seen = new Set<number>();
    const out: StitchBlock[] = [];
    for (const idx of colorOrder) {
      if (idx >= 0 && idx < blocks.length && !seen.has(idx)) { out.push(blocks[idx]); seen.add(idx); }
    }
    for (let i = 0; i < blocks.length; i++) if (!seen.has(i)) out.push(blocks[i]);
    return out;
  };

  const moveColor = (i: number, dir: -1 | 1) => {
    const base = colorOrder ?? buildStitchBlocks().map((_, k) => k);
    const j = i + dir;
    if (j < 0 || j >= base.length) return;
    const next = base.slice();
    [next[i], next[j]] = [next[j], next[i]];
    setColorOrder(next);
  };

  const exportarPes = async () => {
    let blocks = applyColorOrder(buildStitchBlocks());
    if (blocks.length === 0) { toast.error("Sem traços visíveis para exportar."); return; }
    setPesBusy(true);
    try {
      if (tilingOn && hoopOn) {
        const tiles = splitByHoop(blocks, hoopWpx, hoopHpx, tileMarginMm * PX_PER_MM);
        if (tiles.length === 0) { toast.error("Nada a exportar após dividir por bastidor."); setPesBusy(false); return; }
        tiles.forEach((tile, i) => {
          const blob = encodePes(tile, PX_PER_MM, `CBM_${i + 1}`);
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url; a.download = `bordado-hoop${i + 1}-${Date.now()}.pes`; a.click();
          URL.revokeObjectURL(url);
        });
        toast.success(`Design dividido em ${tiles.length} bastidor(es) PES.`);
      } else {
        const blob = encodePes(blocks, PX_PER_MM, "CBM_BORDADO");
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = `bordado-${Date.now()}.pes`; a.click();
        URL.revokeObjectURL(url);
        toast.success(`PES gerado com ${blocks.length} cor(es).`);
      }
    } catch (e) {
      toast.error("Falha ao gerar PES: " + (e as Error).message);
    } finally { setPesBusy(false); }
  };

  // Lista viva de cores (para o UI de reordenação)
  const colorBlocks = useMemo(() => buildStitchBlocks(), [layers, chartArea, chartCells, stitchLenMm, orderByNearest]);
  const orderedColorBlocks = useMemo(() => applyColorOrder(colorBlocks), [colorBlocks, colorOrder]);

  // ---------- Fase 11: simulador animado ----------
  const simFlat = useMemo(() => {
    const arr: { x: number; y: number; blockIdx: number; jump: boolean }[] = [];
    orderedColorBlocks.forEach((b, bi) => {
      b.points.forEach((p, pi) => arr.push({ x: p.x, y: p.y, blockIdx: bi, jump: pi === 0 && bi > 0 }));
    });
    return arr;
  }, [orderedColorBlocks]);

  useEffect(() => {
    if (!simPlaying || !simOn || simFlat.length === 0) return;
    let raf = 0;
    let last = performance.now();
    const tick = (t: number) => {
      const dt = (t - last) / 1000;
      last = t;
      setSimProgress((p) => {
        const stepFrac = (simSpeed * dt) / simFlat.length;
        const next = p + stepFrac;
        if (next >= 1) { setSimPlaying(false); return 1; }
        return next;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [simPlaying, simOn, simFlat, simSpeed]);

  const simVisibleCount = Math.round(simProgress * simFlat.length);

  const inserirTextoCircular = () => {
    if (!active || active.locked) { toast.error("Camada ativa bloqueada."); return; }
    const txt = circText.trim();
    if (!txt) { toast.error("Escreve o texto primeiro."); return; }
    const rPx = circRadius * PX_PER_MM;
    const cxg = A4_W / 2, cyg = A4_H / 2;
    const advance = circFontPx * 0.55;
    const angStep = (advance / rPx) * (circClockwise ? 1 : -1);
    const novos: string[] = [];
    let ang = -Math.PI / 2;
    for (let i = 0; i < txt.length; i++) {
      const ch = txt[i];
      if (ch === " ") { ang += angStep; continue; }
      const x0 = cxg + rPx * Math.cos(ang);
      const y0 = cyg + rPx * Math.sin(ang);
      const tx = -Math.sin(ang), ty = Math.cos(ang);
      const half = circFontPx / 2;
      const ax = x0 + tx * (advance * 0.15) - tx * half * 0.15;
      const ay = y0 + ty * (advance * 0.15) - ty * half * 0.15;
      const bx = x0 - tx * (advance * 0.15) + tx * half * 0.15;
      const by = y0 - ty * (advance * 0.15) + ty * half * 0.15;
      novos.push(`M ${ax.toFixed(1)} ${ay.toFixed(1)} L ${bx.toFixed(1)} ${by.toFixed(1)}`);
      const nx = x0 - Math.cos(ang) * (circFontPx * 0.3);
      const ny = y0 - Math.sin(ang) * (circFontPx * 0.3);
      novos.push(`M ${x0.toFixed(1)} ${y0.toFixed(1)} L ${nx.toFixed(1)} ${ny.toFixed(1)}`);
      ang += angStep;
    }
    setLayers((ls) => ls.map((l) => l.id === active.id ? { ...l, strokes: [...l.strokes, ...novos] } : l));
    toast.success(`Texto circular inserido (${txt.length} caracteres).`);
  };

  const machineStats = useMemo(() => {
    const stepPx = stitchLenMm * PX_PER_MM;
    let pontos = 0, comprimentoMm = 0;
    const coresSet = new Set<string>();
    for (const l of layers) {
      if (!l.visible || l.strokes.length === 0) continue;
      coresSet.add(l.color);
      for (const d of l.strokes) {
        for (const sub of splitSubpaths(d)) {
          if (sub.length < 2) continue;
          const rs = resample(sub, stepPx);
          pontos += Math.max(0, rs.length - 1);
          for (let i = 1; i < rs.length; i++) {
            comprimentoMm += Math.hypot(rs[i].x - rs[i - 1].x, rs[i].y - rs[i - 1].y) / PX_PER_MM;
          }
        }
      }
    }
    if (chartArea && chartCells.length > 0) {
      const cellMm = chartArea.cellPx / PX_PER_MM;
      pontos += chartCells.length * 4;
      comprimentoMm += chartCells.length * 2 * Math.SQRT2 * cellMm;
      for (const c of chartCells) coresSet.add(c.dmc);
    }
    return { pontos, comprimentoMm, cores: coresSet.size };
  }, [layers, chartCells, chartArea, stitchLenMm]);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <A4Stage innerRef={ref} watermark={w} size={sheet.size} orientacao={sheet.orientacao}>
        <div className="absolute inset-0" style={FABRIC_STYLES[fabric]} />
        {imagemFundo && decalqueVisivel && (
          <img src={imagemFundo}
               className="absolute inset-0 h-full w-full object-contain pointer-events-none"
               style={{ opacity: imagemOpacidade / 100 }} />
        )}
        <svg ref={svgRef} viewBox="0 0 595 842" className="absolute inset-0 h-full w-full"
             onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp}>
          {/* Fase 3 — marcadores para ponto cruz e nó francês */}
          <defs>
            {/* Fase 10 — filtros de pré-visualização 3D */}
            <filter id="fx-thread" x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur stdDeviation="0.35" />
              <feSpecularLighting result="sp" surfaceScale="2" specularConstant="0.9" specularExponent="18" lightingColor="#ffffff">
                <feDistantLight azimuth="135" elevation="55" />
              </feSpecularLighting>
              <feComposite in="sp" in2="SourceGraphic" operator="in" result="lit" />
              <feMerge>
                <feMergeNode in="SourceGraphic" />
                <feMergeNode in="lit" />
              </feMerge>
            </filter>
            <pattern id="fx-fabric-aida" width="8" height="8" patternUnits="userSpaceOnUse">
              <rect width="8" height="8" fill="#f5efe1" />
              <path d="M0 4 H8 M4 0 V8" stroke="#d9c9a3" strokeWidth="0.6" />
            </pattern>
            <pattern id="fx-fabric-linho" width="6" height="6" patternUnits="userSpaceOnUse">
              <rect width="6" height="6" fill="#efe6d0" />
              <path d="M0 0 L6 6 M6 0 L0 6" stroke="#c9b591" strokeWidth="0.4" opacity="0.7" />
            </pattern>
            <pattern id="fx-fabric-algodao" width="4" height="4" patternUnits="userSpaceOnUse">
              <rect width="4" height="4" fill="#faf7f0" />
              <circle cx="2" cy="2" r="0.5" fill="#e2d6b8" />
            </pattern>
            {layers.map((l) => (
              <React.Fragment key={`m-${l.id}`}>
                <marker id={`mk-cross-${l.id}`} viewBox="-5 -5 10 10" markerWidth="6" markerHeight="6"
                        refX="0" refY="0" orient="auto">
                  <path d="M-3 -3 L3 3 M-3 3 L3 -3" stroke={l.color} strokeWidth="1.2" fill="none" strokeLinecap="round" />
                </marker>
                <marker id={`mk-knot-${l.id}`} viewBox="-3 -3 6 6" markerWidth="5" markerHeight="5"
                        refX="0" refY="0" orient="auto">
                  <circle cx="0" cy="0" r="1.6" fill={l.color} />
                </marker>
              </React.Fragment>
            ))}
          </defs>
          {preview3D && (
            <rect x="0" y="0" width={A4_W} height={A4_H}
                  fill={`url(#fx-fabric-${fabric3D})`} pointerEvents="none" />
          )}
          {hoopOn && (
            <>
              <defs>
                <mask id="hoop-mask">
                  <rect x="0" y="0" width={A4_W} height={A4_H} fill="white" />
                  {hoop === "square"
                    ? <rect x={cx - hoopWpx / 2} y={cy - hoopHpx / 2} width={hoopWpx} height={hoopHpx} fill="black" />
                    : <ellipse cx={cx} cy={cy} rx={hoopWpx / 2} ry={hoopHpx / 2} fill="black" />}
                </mask>
              </defs>
              <rect x="0" y="0" width={A4_W} height={A4_H} fill="rgba(0,0,0,0.18)" mask="url(#hoop-mask)" />
              {hoop === "square"
                ? <rect x={cx - hoopWpx / 2} y={cy - hoopHpx / 2} width={hoopWpx} height={hoopHpx}
                        fill="none" stroke="#8b5e34" strokeWidth="3" />
                : <ellipse cx={cx} cy={cy} rx={hoopWpx / 2} ry={hoopHpx / 2}
                           fill="none" stroke="#8b5e34" strokeWidth="3" />}
            </>
          )}
          {thirds && (
            <g stroke="rgba(59,130,246,0.45)" strokeWidth="0.5" strokeDasharray="4 3" pointerEvents="none">
              <line x1={A4_W / 3} y1="0" x2={A4_W / 3} y2={A4_H} />
              <line x1={(A4_W * 2) / 3} y1="0" x2={(A4_W * 2) / 3} y2={A4_H} />
              <line x1="0" y1={A4_H / 3} x2={A4_W} y2={A4_H / 3} />
              <line x1="0" y1={(A4_H * 2) / 3} x2={A4_W} y2={(A4_H * 2) / 3} />
            </g>
          )}
          {/* Fase 4 — grelha Aida (opcional) */}
          {chartArea && (
            <g pointerEvents="none">
              <g stroke="rgba(0,0,0,0.22)" strokeWidth="0.3">
                {Array.from({ length: chartArea.nx + 1 }).map((_, i) => (
                  <line key={`vx-${i}`} x1={chartArea.x0 + i * chartArea.cellPx} y1={chartArea.y0}
                        x2={chartArea.x0 + i * chartArea.cellPx} y2={chartArea.y0 + chartArea.ny * chartArea.cellPx} />
                ))}
                {Array.from({ length: chartArea.ny + 1 }).map((_, i) => (
                  <line key={`hz-${i}`} x1={chartArea.x0} y1={chartArea.y0 + i * chartArea.cellPx}
                        x2={chartArea.x0 + chartArea.nx * chartArea.cellPx} y2={chartArea.y0 + i * chartArea.cellPx} />
                ))}
              </g>
              {/* linhas de 10 em 10 mais escuras (referência de contagem) */}
              <g stroke="rgba(0,0,0,0.55)" strokeWidth="0.6">
                {Array.from({ length: Math.floor(chartArea.nx / 10) + 1 }).map((_, i) => (
                  <line key={`v10-${i}`} x1={chartArea.x0 + i * 10 * chartArea.cellPx} y1={chartArea.y0}
                        x2={chartArea.x0 + i * 10 * chartArea.cellPx} y2={chartArea.y0 + chartArea.ny * chartArea.cellPx} />
                ))}
                {Array.from({ length: Math.floor(chartArea.ny / 10) + 1 }).map((_, i) => (
                  <line key={`h10-${i}`} x1={chartArea.x0} y1={chartArea.y0 + i * 10 * chartArea.cellPx}
                        x2={chartArea.x0 + chartArea.nx * chartArea.cellPx} y2={chartArea.y0 + i * 10 * chartArea.cellPx} />
                ))}
              </g>
            </g>
          )}
          {/* Fase 4 — células do gráfico de ponto cruz */}
          {chartArea && chartCells.length > 0 && (
            <g pointerEvents="none">
              {chartCells.map((c, i) => (
                <rect key={`cc-${i}`} x={chartArea.x0 + c.gx * chartArea.cellPx}
                      y={chartArea.y0 + c.gy * chartArea.cellPx}
                      width={chartArea.cellPx} height={chartArea.cellPx}
                      fill={c.hex} opacity={0.85} />
              ))}
            </g>
          )}
          {layers.map((layer) => {
            if (!layer.visible) return null;
            const st = stitchStyle(layer.stitch, layer.width);
            const markerUrl = st.marker === "cross" ? `url(#mk-cross-${layer.id})`
                            : st.marker === "knot"  ? `url(#mk-knot-${layer.id})`
                            : undefined;
            return (
              <g key={layer.id} opacity={layer.locked ? 0.7 : 1}
                 filter={preview3D ? "url(#fx-thread)" : undefined}>
                {layer.stitch === "satin" && layer.strokes.map((d, i) => (
                  // ponto cheio — 2ª passagem paralela ligeiramente deslocada para efeito de preenchimento
                  <path key={`sat-${layer.id}-${i}`} d={d} stroke={layer.color}
                        strokeWidth={layer.width * 1.6} strokeOpacity={0.55}
                        fill="none" strokeLinecap="butt" strokeLinejoin="round" />
                ))}
                {layer.strokes.map((d, i) => (
                  <path key={`${layer.id}-${i}`} d={d} stroke={layer.color}
                        strokeWidth={Math.max(0.2, layer.width * st.widthMul)}
                        fill="none" strokeLinecap="round" strokeLinejoin="round"
                        strokeDasharray={st.dash}
                        markerStart={markerUrl} markerMid={markerUrl} markerEnd={markerUrl} />
                ))}
              </g>
            );
          })}
          {/* Guias de simetria (Fase 2) */}
          {mirrorOn && (
            <g stroke="rgba(236,72,153,0.6)" strokeWidth="0.6" strokeDasharray="3 3" pointerEvents="none">
              {Array.from({ length: Math.max(1, Math.min(12, mirrorAxes)) }).map((_, k, arr) => {
                const ang = (Math.PI * k) / arr.length;
                const cxg = A4_W / 2, cyg = A4_H / 2;
                const L = Math.hypot(A4_W, A4_H);
                const dx = Math.cos(ang) * L, dy = Math.sin(ang) * L;
                return <line key={k} x1={cxg - dx} y1={cyg - dy} x2={cxg + dx} y2={cyg + dy} />;
              })}
            </g>
          )}
        </svg>
      </A4Stage>
      <div className="space-y-3">
        <SheetControls {...sheet} />
        <Card><CardContent className="space-y-2 p-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold">Ferramentas de desenho</Label>
            <Button size="sm" variant="outline" onClick={desfazerUltimoTraco} title="Desfazer último traço">
              <RotateCw className="mr-1 h-3 w-3 -scale-x-100" />Desfazer
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-1">
            <Button size="sm" variant={tool === "pen" ? "default" : "outline"} onClick={() => setTool("pen")}>Caneta</Button>
            <Button size="sm" variant={tool === "smooth" ? "default" : "outline"} onClick={() => setTool("smooth")}>Suave</Button>
            <Button size="sm" variant={tool === "eraser" ? "default" : "outline"} onClick={() => setTool("eraser")}>Apagar</Button>
          </div>
          {tool === "smooth" && (
            <div>
              <Label className="text-xs">Correção de tremor ({smoothN})</Label>
              <Slider value={[smoothN]} min={2} max={12} step={1} onValueChange={(v) => setSmoothN(v[0])} />
            </div>
          )}
          {tool === "eraser" && (
            <div>
              <Label className="text-xs">Raio do apagador ({eraserR} px)</Label>
              <Slider value={[eraserR]} min={3} max={40} step={1} onValueChange={(v) => setEraserR(v[0])} />
              <p className="text-[10px] text-muted-foreground mt-1">
                Apaga apenas as interseções sob o cursor; o resto do traço permanece intacto.
              </p>
            </div>
          )}
          <div className="border-t pt-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold">Simetria em tempo real</Label>
              <Button size="sm" variant={mirrorOn ? "default" : "outline"} onClick={() => setMirrorOn((v) => !v)}>
                {mirrorOn ? "Ligada" : "Desligada"}
              </Button>
            </div>
            {mirrorOn && (
              <div className="mt-1">
                <Label className="text-xs">Eixos ({mirrorAxes})</Label>
                <Slider value={[mirrorAxes]} min={1} max={12} step={1} onValueChange={(v) => setMirrorAxes(v[0])} />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Cada eixo cria uma cópia espelhada em torno do centro do bastidor.
                </p>
              </div>
            )}
          </div>
        </CardContent></Card>
        <Card><CardContent className="space-y-2 p-3">
          <Label className="text-xs font-semibold">Bastidor virtual</Label>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Mostrar bastidor</Label>
            <Button size="sm" variant={hoopOn ? "default" : "outline"} onClick={() => setHoopOn((v) => !v)}>
              {hoopOn ? "Ligado" : "Desligado"}
            </Button>
          </div>
          <Select value={hoop} onValueChange={(v) => setHoop(v as HoopShape)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {HOOP_PRESETS.map((h) => <SelectItem key={h.id} value={h.id}>{h.nome}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Regra dos terços</Label>
            <Button size="sm" variant={thirds ? "default" : "outline"} onClick={() => setThirds((v) => !v)}>
              {thirds ? "Sim" : "Não"}
            </Button>
          </div>
          <Label className="text-xs">Tecido de fundo</Label>
          <Select value={fabric} onValueChange={(v) => setFabric(v as FabricKind)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhum</SelectItem>
              <SelectItem value="algodao">Algodão cru</SelectItem>
              <SelectItem value="linho">Linho</SelectItem>
              <SelectItem value="escuro">Tecido escuro</SelectItem>
            </SelectContent>
          </Select>
        </CardContent></Card>
        <Card><CardContent className="space-y-2 p-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold">Camadas</Label>
            <Button size="sm" variant="outline" onClick={addLayer}><Plus className="h-3 w-3" /></Button>
          </div>
          <div className="space-y-1">
            {layers.slice().reverse().map((l) => (
              <div key={l.id}
                   className={`space-y-1 rounded border px-2 py-1 ${activeLayer === l.id ? "border-primary bg-primary/5" : "border-border"}`}>
                <div className="flex items-center gap-1">
                  <button className="text-xs" onClick={() => patchLayer(l.id, { visible: !l.visible })} title="Visibilidade">
                    {l.visible ? "👁" : "—"}
                  </button>
                  <button className="text-xs" onClick={() => patchLayer(l.id, { locked: !l.locked })} title="Bloquear">
                    {l.locked ? "🔒" : "🔓"}
                  </button>
                  <Input value={l.nome} onChange={(e) => patchLayer(l.id, { nome: e.target.value })}
                         className="h-6 flex-1 text-xs" onFocus={() => setActiveLayer(l.id)} />
                  <input type="color" value={l.color} onChange={(e) => patchLayer(l.id, { color: e.target.value, dmc: undefined })}
                         className="h-6 w-6 cursor-pointer rounded border" title="Cor personalizada" />
                  <button className="text-xs" onClick={() => moveLayer(l.id, 1)} title="Subir">▲</button>
                  <button className="text-xs" onClick={() => moveLayer(l.id, -1)} title="Descer">▼</button>
                  <button className="text-xs text-destructive" onClick={() => removeLayer(l.id)} title="Apagar">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <Select value={l.stitch} onValueChange={(v) => patchLayer(l.id, { stitch: v as StitchType })}>
                    <SelectTrigger className="h-6 flex-1 text-[11px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(STITCH_LABELS) as StitchType[]).map((k) => (
                        <SelectItem key={k} value={k}>{STITCH_LABELS[k]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <DmcPickerButton
                    current={l.dmc}
                    onPick={(c) => patchLayer(l.id, { color: c.hex, dmc: c.code })}
                    onSuggest={() => {
                      const near = nearestDmc(l.color);
                      patchLayer(l.id, { color: near.hex, dmc: near.code });
                      toast.success(`DMC ${near.code} aplicado (${near.name}).`);
                    }}
                  />
                </div>
                {l.dmc && (
                  <p className="text-[10px] text-muted-foreground">DMC {l.dmc}</p>
                )}
              </div>
            ))}
          </div>
          <div>
            <Label className="text-xs">Espessura da camada ativa ({active.width.toFixed(1)} px)</Label>
            <Slider value={[active.width]} min={0.4} max={4} step={0.1}
                    onValueChange={(v) => patchLayer(active.id, { width: v[0] })} />
            <p className="text-[10px] text-muted-foreground mt-1">Sugestão: 0.4 px ≈ 1 fio · 0.8 px ≈ 3 fios · 1.4 px ≈ 6 fios.</p>
          </div>
        </CardContent></Card>
        <Card><CardContent className="space-y-1 p-3">
          <Label className="text-xs font-semibold">Estimativa de linha</Label>
          <p className="text-[10px] text-muted-foreground">
            Comprimento total das linhas por camada (com 15% de margem para nós e sobra de agulha).
          </p>
          {linhaStats.every((s) => s.cm < 0.05) ? (
            <p className="text-[11px] italic text-muted-foreground pt-1">
              Desenha ou vetoriza para veres a estimativa de consumo por camada.
            </p>
          ) : (
            <div className="pt-1 space-y-0.5">
              {linhaStats.map((s) => (
                s.cm > 0 && (
                  <div key={s.id} className="flex justify-between text-[11px]">
                    <span className="truncate">
                      {s.nome}{s.dmc ? ` · DMC ${s.dmc}` : ""}
                    </span>
                    <span className="tabular-nums text-muted-foreground">
                      {s.cmComMargem.toFixed(1)} cm
                    </span>
                  </div>
                )
              ))}
              <div className="flex justify-between border-t pt-1 text-[11px] font-medium">
                <span>Total estimado</span>
                <span className="tabular-nums">{totalCmMargem.toFixed(1)} cm</span>
              </div>
            </div>
          )}
        </CardContent></Card>
        <Card><CardContent className="space-y-2 p-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold">Modo ponto cruz (Aida)</Label>
            <Button size="sm" variant="outline" onClick={() => setCarrinhoOpen(true)}>
              Lista de compras
            </Button>
          </div>
          <Label className="text-xs">Contagem Aida</Label>
          <Select value={String(aidaCount)} onValueChange={(v) => setAidaCount(Number(v) as 0 | 11 | 14 | 16 | 18)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Desligada</SelectItem>
              <SelectItem value="11">Aida 11 ct (≈2.31 mm)</SelectItem>
              <SelectItem value="14">Aida 14 ct (≈1.81 mm)</SelectItem>
              <SelectItem value="16">Aida 16 ct (≈1.59 mm)</SelectItem>
              <SelectItem value="18">Aida 18 ct (≈1.41 mm)</SelectItem>
            </SelectContent>
          </Select>
          {chartArea && (
            <p className="text-[10px] text-muted-foreground">
              Grelha: {chartArea.nx} × {chartArea.ny} cruzes · célula {(chartArea.cellPx / PX_PER_CM * 10).toFixed(1)} mm
            </p>
          )}
          <div>
            <Label className="text-xs">Cores DMC no gráfico ({nCores})</Label>
            <Slider value={[nCores]} min={2} max={40} step={1} onValueChange={(v) => setNCores(v[0])} />
          </div>
          <div className="grid grid-cols-2 gap-1">
            <Button size="sm" onClick={converterParaPontoCruz} disabled={convertendo || !aidaCount || !imagemFundo}>
              <Sparkles className="mr-1 h-3 w-3" />{convertendo ? "A converter…" : "Foto → Cruz"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setChartCells([])}>
              <Eraser className="mr-1 h-3 w-3" />Limpar cruzes
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Cria uma grelha Aida centrada e converte a imagem de decalque em cruzes DMC. Ajusta o número de cores para simplificar o gráfico.
          </p>
        </CardContent></Card>
        <Dialog open={carrinhoOpen} onOpenChange={setCarrinhoOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Lista de linhas DMC</DialogTitle></DialogHeader>
            {listaCompras.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Sem linhas ainda. Atribui uma cor DMC a cada camada ou gera um gráfico de ponto cruz para veres a lista.
              </p>
            ) : (
              <>
                <div className="max-h-[420px] overflow-y-auto rounded border">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-muted/70 text-left">
                      <tr>
                        <th className="p-2">DMC</th><th className="p-2">Nome</th>
                        <th className="p-2 text-right">Cruzes</th>
                        <th className="p-2 text-right">Linha (cm)</th>
                        <th className="p-2">Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {listaCompras.map((r) => (
                        <tr key={r.code} className="border-t">
                          <td className="p-2">
                            <div className="flex items-center gap-2">
                              <span className="h-4 w-4 rounded border" style={{ backgroundColor: r.hex }} />
                              <span className="font-medium">{r.code}</span>
                              {r.anchor && <span className="text-muted-foreground">A{r.anchor}</span>}
                            </div>
                          </td>
                          <td className="p-2">{r.nome}</td>
                          <td className="p-2 text-right tabular-nums">{r.stitches || "—"}</td>
                          <td className="p-2 text-right tabular-nums">{r.cm.toFixed(1)}</td>
                          <td className="p-2">
                            {r.temStock
                              ? <span className="text-emerald-600">✓ {r.stock} {r.unidade}</span>
                              : <span className="text-destructive">Em falta</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="outline" onClick={exportarListaCsv}>Exportar CSV</Button>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  O stock é procurado no Inventário por marca "DMC" + código de cor igual. Para ligar automaticamente, garante que os teus fios têm esses campos preenchidos.
                </p>
              </>
            )}
          </DialogContent>
        </Dialog>
        <Card><CardContent className="space-y-2 p-3">
          <Label className="text-xs">Imagem de referência (decalque)</Label>
          <Input type="file" accept="image/*" onChange={(e) => {
            const f = e.target.files?.[0]; if (!f) return;
            const r = new FileReader(); r.onload = () => setImagemFundo(r.result as string); r.readAsDataURL(f);
          }} />
          <div>
            <Label className="text-xs">Opacidade do decalque ({imagemOpacidade}%)</Label>
            <Slider value={[imagemOpacidade]} min={0} max={100} step={5} onValueChange={(v) => setImagemOpacidade(v[0])} />
          </div>
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
          <Button size="sm" variant="ghost" onClick={() => patchLayer(active.id, { strokes: [] })}>
            <Eraser className="mr-1 h-3 w-3" />Limpar camada ativa
          </Button>
        </CardContent></Card>
        <Card><CardContent className="space-y-2 p-3">
          <Label className="text-xs font-semibold">Bordado à máquina (DST)</Label>
          <p className="text-[10px] text-muted-foreground">
            Converte as camadas visíveis em pontos com espaçamento fixo e exporta um ficheiro Tajima .DST compatível com máquinas Brother, Janome, Bernina, Tajima e Ricoma.
          </p>
          <div>
            <Label className="text-xs">Comprimento do ponto ({stitchLenMm.toFixed(1)} mm)</Label>
            <Slider value={[stitchLenMm]} min={1} max={6} step={0.1} onValueChange={(v) => setStitchLenMm(v[0])} />
            <p className="text-[10px] text-muted-foreground mt-1">
              Recomendado 2–4 mm para bordado padrão; abaixo de 1.5 mm para detalhe fino.
            </p>
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Otimizar ordem (menor salto)</Label>
            <Button size="sm" variant={orderByNearest ? "default" : "outline"} onClick={() => setOrderByNearest((v) => !v)}>
              {orderByNearest ? "Sim" : "Não"}
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-2 rounded border bg-muted/30 p-2 text-[11px]">
            <div><span className="text-muted-foreground block">Pontos</span><span className="tabular-nums font-medium">{machineStats.pontos.toLocaleString()}</span></div>
            <div><span className="text-muted-foreground block">Cores</span><span className="tabular-nums font-medium">{machineStats.cores}</span></div>
            <div><span className="text-muted-foreground block">Linha</span><span className="tabular-nums font-medium">{(machineStats.comprimentoMm / 10).toFixed(1)} cm</span></div>
          </div>
          <Button size="sm" className="w-full" onClick={exportarDst} disabled={dstBusy || machineStats.pontos === 0}>
            <Sparkles className="mr-1 h-3 w-3" />{dstBusy ? "A gerar…" : "Exportar .DST"}
          </Button>
        </CardContent></Card>
        <Card><CardContent className="space-y-2 p-3">
          <Label className="text-xs font-semibold">Brother PES + multi-bastidor</Label>
          <p className="text-[10px] text-muted-foreground">
            Gera ficheiros .PES v1 nativos para máquinas Brother/Babylock. Ativa o tiling para dividir automaticamente designs maiores que o bastidor em vários ficheiros posicionáveis.
          </p>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Dividir por bastidor</Label>
            <Button size="sm" variant={tilingOn ? "default" : "outline"} onClick={() => setTilingOn((v) => !v)} disabled={!hoopOn}>
              {tilingOn ? "Ligado" : "Desligado"}
            </Button>
          </div>
          {!hoopOn && <p className="text-[10px] text-amber-600">Ativa o bastidor para permitir tiling.</p>}
          {tilingOn && (
            <div>
              <Label className="text-xs">Margem de sobreposição ({tileMarginMm} mm)</Label>
              <Slider value={[tileMarginMm]} min={0} max={20} step={1} onValueChange={(v) => setTileMarginMm(v[0])} />
            </div>
          )}
          <Button size="sm" className="w-full" onClick={exportarPes} disabled={pesBusy || machineStats.pontos === 0}>
            <Sparkles className="mr-1 h-3 w-3" />{pesBusy ? "A gerar…" : "Exportar .PES"}
          </Button>
          <div className="border-t pt-2">
            <Label className="text-xs font-semibold">Sequência de cores</Label>
            <p className="text-[10px] text-muted-foreground mb-1">
              Reordena os blocos para reduzir trocas de agulha e otimizar a operação da máquina.
            </p>
            <div className="space-y-1 max-h-48 overflow-auto pr-1">
              {orderedColorBlocks.length === 0 && (
                <p className="text-[10px] text-muted-foreground">Ainda sem blocos visíveis.</p>
              )}
              {orderedColorBlocks.map((b, i) => (
                <div key={`${b.label}-${i}`} className="flex items-center gap-1 rounded border bg-background/50 px-2 py-1">
                  <span className="inline-block h-3 w-3 rounded-sm border" style={{ background: b.color }} />
                  <span className="text-[11px] flex-1 truncate">{i + 1}. {b.label}</span>
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => moveColor(i, -1)} disabled={i === 0} aria-label="Subir">↑</Button>
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => moveColor(i, +1)} disabled={i === orderedColorBlocks.length - 1} aria-label="Descer">↓</Button>
                </div>
              ))}
            </div>
            {colorOrder && (
              <Button size="sm" variant="ghost" className="w-full mt-1" onClick={() => setColorOrder(null)}>
                Restaurar ordem original
              </Button>
            )}
          </div>
        </CardContent></Card>
        <Card><CardContent className="space-y-2 p-3">
          <Label className="text-xs font-semibold">Texto circular</Label>
          <Input value={circText} onChange={(e) => setCircText(e.target.value)} placeholder="Texto a bordar em círculo" className="h-8 text-xs" />
          <div>
            <Label className="text-xs">Raio ({circRadius} mm)</Label>
            <Slider value={[circRadius]} min={20} max={100} step={2} onValueChange={(v) => setCircRadius(v[0])} />
          </div>
          <div>
            <Label className="text-xs">Tamanho ({circFontPx} px)</Label>
            <Slider value={[circFontPx]} min={10} max={48} step={1} onValueChange={(v) => setCircFontPx(v[0])} />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Sentido horário</Label>
            <Button size="sm" variant={circClockwise ? "default" : "outline"} onClick={() => setCircClockwise((v) => !v)}>
              {circClockwise ? "→" : "←"}
            </Button>
          </div>
          <Button size="sm" className="w-full" onClick={inserirTextoCircular}>
            <Type className="mr-1 h-3 w-3" />Inserir na camada ativa
          </Button>
        </CardContent></Card>
        <Card><CardContent className="space-y-2 p-3">
          <Label className="text-xs font-semibold">Preenchimento automático (fill)</Label>
          <p className="text-[10px] text-muted-foreground">
            Gera pontos satin (zig-zag) ou tatami (stipple estruturado) dentro dos contornos fechados da camada ativa. Inclui underlay e compensação de puxão para bordado à máquina.
          </p>
          <div className="grid grid-cols-2 gap-1">
            <Button size="sm" variant={fillMode === "tatami" ? "default" : "outline"} onClick={() => setFillMode("tatami")}>Tatami</Button>
            <Button size="sm" variant={fillMode === "satin" ? "default" : "outline"} onClick={() => setFillMode("satin")}>Satin</Button>
          </div>
          <div>
            <Label className="text-xs">Ângulo ({fillAngle}°)</Label>
            <Slider value={[fillAngle]} min={0} max={180} step={5} onValueChange={(v) => setFillAngle(v[0])} />
          </div>
          <div>
            <Label className="text-xs">Espaçamento entre linhas ({fillSpacingPx.toFixed(1)} px)</Label>
            <Slider value={[fillSpacingPx]} min={1} max={8} step={0.1} onValueChange={(v) => setFillSpacingPx(v[0])} />
          </div>
          {fillMode === "tatami" && (
            <>
              <div>
                <Label className="text-xs">Comprimento do ponto ({fillStitchPx.toFixed(1)} px)</Label>
                <Slider value={[fillStitchPx]} min={2} max={12} step={0.5} onValueChange={(v) => setFillStitchPx(v[0])} />
              </div>
              <div>
                <Label className="text-xs">Stagger ({fillStagger.toFixed(2)})</Label>
                <Slider value={[fillStagger]} min={0} max={0.9} step={0.05} onValueChange={(v) => setFillStagger(v[0])} />
                <p className="text-[10px] text-muted-foreground mt-1">Deslocamento em fase entre linhas — evita "sulcos" visíveis no tecido.</p>
              </div>
            </>
          )}
          <div>
            <Label className="text-xs">Compensação de puxão ({fillPullPx.toFixed(1)} px)</Label>
            <Slider value={[fillPullPx]} min={-2} max={4} step={0.1} onValueChange={(v) => setFillPullPx(v[0])} />
          </div>
          <div className="border-t pt-2 space-y-1">
            <Label className="text-xs font-semibold">Underlay</Label>
            <div className="grid grid-cols-3 gap-1">
              <Button size="sm" variant={fillUnderlay === 0 ? "default" : "outline"} onClick={() => setFillUnderlay(0)}>Nenhum</Button>
              <Button size="sm" variant={fillUnderlay === 1 ? "default" : "outline"} onClick={() => setFillUnderlay(1)}>Contorno</Button>
              <Button size="sm" variant={fillUnderlay === 2 ? "default" : "outline"} onClick={() => setFillUnderlay(2)}>Zig-zag</Button>
            </div>
            {fillUnderlay !== 0 && (
              <div>
                <Label className="text-xs">Inset ({fillUnderlayInsetPx.toFixed(1)} px)</Label>
                <Slider value={[fillUnderlayInsetPx]} min={0.5} max={6} step={0.1} onValueChange={(v) => setFillUnderlayInsetPx(v[0])} />
              </div>
            )}
          </div>
          <Button size="sm" className="w-full" onClick={preencherCamadaAtiva}>
            <Sparkles className="mr-1 h-3 w-3" />Aplicar preenchimento
          </Button>
          <p className="text-[10px] text-muted-foreground">
            Dica: fecha o contorno com "Z" antes de preencher (ferramentas de desenho geram traços abertos por padrão).
          </p>
        </CardContent></Card>
        <Card><CardContent className="space-y-2 p-3">
          <Label className="text-xs font-semibold">Lettering (texto → bordado)</Label>
          <p className="text-[10px] text-muted-foreground">
            Converte texto em contornos fechados prontos para satin/tatami e export DST/PES.
          </p>
          <Input value={letText} onChange={(e) => setLetText(e.target.value)} placeholder="Texto" className="h-8 text-xs" />
          <div>
            <Label className="text-xs">Fonte</Label>
            <select
              value={letFontId}
              onChange={(e) => setLetFontId(e.target.value)}
              className="h-8 w-full rounded border bg-background px-2 text-xs"
            >
              {LETTERING_FONTS.map((f) => (
                <option key={f.id} value={f.id} style={{ fontFamily: f.family }}>{f.label}</option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-xs">Altura ({letSizeMm} mm)</Label>
            <Slider value={[letSizeMm]} min={6} max={80} step={1} onValueChange={(v) => setLetSizeMm(v[0])} />
          </div>
          <div>
            <Label className="text-xs">Espaçamento entre letras ({letSpacingPx.toFixed(1)} px)</Label>
            <Slider value={[letSpacingPx]} min={-2} max={8} step={0.5} onValueChange={(v) => setLetSpacingPx(v[0])} />
          </div>
          <div>
            <Label className="text-xs">Simplificação ({letSimplify.toFixed(2)} px)</Label>
            <Slider value={[letSimplify]} min={0} max={2} step={0.05} onValueChange={(v) => setLetSimplify(v[0])} />
            <p className="text-[10px] text-muted-foreground mt-1">
              Menor = mais fiel; maior = menos pontos e ficheiros mais leves.
            </p>
          </div>
          <Button size="sm" className="w-full" onClick={inserirLettering}>
            <Type className="mr-1 h-3 w-3" />Inserir texto vetorizado
          </Button>
        </CardContent></Card>
        <Card><CardContent className="space-y-2 p-3">
          <Label className="text-xs font-semibold">Biblioteca de motivos</Label>
          <div>
            <Label className="text-xs">Motivo</Label>
            <select
              value={motifId}
              onChange={(e) => setMotifId(e.target.value as MotifId)}
              className="h-8 w-full rounded border bg-background px-2 text-xs"
            >
              {MOTIF_PRESETS.map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-xs">Tamanho ({motifSizeMm} mm)</Label>
            <Slider value={[motifSizeMm]} min={8} max={120} step={2} onValueChange={(v) => setMotifSizeMm(v[0])} />
          </div>
          <Button size="sm" className="w-full" onClick={inserirMotif}>
            <Sparkles className="mr-1 h-3 w-3" />Inserir motivo (contorno fechado)
          </Button>
          <p className="text-[10px] text-muted-foreground">
            Ideal para combinar com o preenchimento automático e a sequência de aplique.
          </p>
        </CardContent></Card>
        <Card><CardContent className="space-y-2 p-3">
          <Label className="text-xs font-semibold">Apliques (appliqué)</Label>
          <p className="text-[10px] text-muted-foreground">
            Gera 3 passes canónicos a partir dos contornos fechados da camada ativa:
            Colocar (corte), Fixar (tack) e Cobrir (satin no rebordo).
          </p>
          <div>
            <Label className="text-xs">Cor da cobertura satin</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={appliqueCover}
                onChange={(e) => setAppliqueCover(e.target.value)}
                className="h-8 w-10 rounded border bg-background"
              />
              <Input
                value={appliqueCover}
                onChange={(e) => setAppliqueCover(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs">Largura do satin de cobertura ({appliqueWidth.toFixed(1)} px)</Label>
            <Slider value={[appliqueWidth]} min={1.5} max={8} step={0.1} onValueChange={(v) => setAppliqueWidth(v[0])} />
          </div>
          <Button size="sm" className="w-full" onClick={gerarAppliqueDaCamadaAtiva}>
            <Sparkles className="mr-1 h-3 w-3" />Gerar sequência de aplique
          </Button>
        </CardContent></Card>
        <Card><CardContent className="space-y-2 p-3">
          <Label className="text-xs font-semibold">Auto-digitize (foto → camadas)</Label>
          <p className="text-[10px] text-muted-foreground">
            Quantiza a imagem de decalque em N cores dominantes, gera contornos fechados por cor
            e (opcionalmente) aplica preenchimento automático em cada camada.
          </p>
          <div>
            <Label className="text-xs">Nº de cores ({autoNCores})</Label>
            <Slider value={[autoNCores]} min={2} max={12} step={1} onValueChange={(v) => setAutoNCores(v[0])} />
          </div>
          <div>
            <Label className="text-xs">Resolução de análise ({autoTargetW} px)</Label>
            <Slider value={[autoTargetW]} min={80} max={480} step={20} onValueChange={(v) => setAutoTargetW(v[0])} />
          </div>
          <div>
            <Label className="text-xs">Largura final ({autoWidthMm} mm)</Label>
            <Slider value={[autoWidthMm]} min={40} max={180} step={5} onValueChange={(v) => setAutoWidthMm(v[0])} />
          </div>
          <div>
            <Label className="text-xs">Simplificação ({autoSimplify.toFixed(2)} px)</Label>
            <Slider value={[autoSimplify]} min={0.2} max={2.5} step={0.05} onValueChange={(v) => setAutoSimplify(v[0])} />
          </div>
          <div>
            <Label className="text-xs">Regiões mínimas ({autoMinRegion} px)</Label>
            <Slider value={[autoMinRegion]} min={6} max={200} step={2} onValueChange={(v) => setAutoMinRegion(v[0])} />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Preencher ao criar (satin/tatami)</Label>
            <Button size="sm" variant={autoFillOnCreate ? "default" : "outline"} onClick={() => setAutoFillOnCreate((v) => !v)}>
              {autoFillOnCreate ? "Sim" : "Não"}
            </Button>
          </div>
          <Button size="sm" className="w-full" onClick={autoDigitizeImagem} disabled={autoBusy}>
            <Sparkles className="mr-1 h-3 w-3" />{autoBusy ? "A processar…" : "Digitalizar imagem"}
          </Button>
        </CardContent></Card>
        <Card><CardContent className="space-y-2 p-3">
          <Label className="text-xs font-semibold">Monograma</Label>
          <Input value={monoIniciais} onChange={(e) => setMonoIniciais(e.target.value.slice(0, 3))} placeholder="Iniciais (até 3)" className="h-8 text-xs" />
          <div>
            <Label className="text-xs">Fonte</Label>
            <select value={monoFontId} onChange={(e) => setMonoFontId(e.target.value)} className="h-8 w-full rounded border bg-background px-2 text-xs">
              {LETTERING_FONTS.map((f) => (<option key={f.id} value={f.id} style={{ fontFamily: f.family }}>{f.label}</option>))}
            </select>
          </div>
          <div>
            <Label className="text-xs">Altura das iniciais ({monoSizeMm} mm)</Label>
            <Slider value={[monoSizeMm]} min={12} max={80} step={1} onValueChange={(v) => setMonoSizeMm(v[0])} />
          </div>
          <div>
            <Label className="text-xs">Moldura</Label>
            <select value={monoFrame} onChange={(e) => setMonoFrame(e.target.value as MotifId)} className="h-8 w-full rounded border bg-background px-2 text-xs">
              {MOTIF_PRESETS.filter((m) => m.id === "circle" || m.id === "hexagon" || m.id === "square" || m.id === "flower6").map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-xs">Tamanho da moldura ({monoFrameSizeMm} mm)</Label>
            <Slider value={[monoFrameSizeMm]} min={20} max={140} step={2} onValueChange={(v) => setMonoFrameSizeMm(v[0])} />
          </div>
          <div>
            <Label className="text-xs">Margem interna ({monoFramePadMm} mm)</Label>
            <Slider value={[monoFramePadMm]} min={0} max={20} step={1} onValueChange={(v) => setMonoFramePadMm(v[0])} />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Moldura dupla</Label>
            <Button size="sm" variant={monoDoubleFrame ? "default" : "outline"} onClick={() => setMonoDoubleFrame((v) => !v)}>
              {monoDoubleFrame ? "Sim" : "Não"}
            </Button>
          </div>
          <Button size="sm" className="w-full" onClick={inserirMonograma}>
            <Type className="mr-1 h-3 w-3" />Inserir monograma
          </Button>
        </CardContent></Card>
        {/* Fase 10 — Pré-visualização 3D */}
        <Card><CardContent className="space-y-2 p-3">
          <Label className="text-xs font-semibold">Pré-visualização 3D</Label>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Ativar</Label>
            <Button size="sm" variant={preview3D ? "default" : "outline"} onClick={() => setPreview3D((v) => !v)}>
              {preview3D ? "Ligado" : "Desligado"}
            </Button>
          </div>
          <div>
            <Label className="text-xs">Tecido</Label>
            <select value={fabric3D} onChange={(e) => setFabric3D(e.target.value as "aida" | "linho" | "algodao")}
                    className="h-8 w-full rounded border bg-background px-2 text-xs">
              <option value="aida">Aida</option>
              <option value="linho">Linho</option>
              <option value="algodao">Algodão</option>
            </select>
          </div>
          <p className="text-[10px] text-muted-foreground">Simula o brilho da linha e a textura do tecido para conferência visual antes de bordar.</p>
        </CardContent></Card>
        {/* Fase 10 — Folha de padrão PDF */}
        <Card><CardContent className="space-y-2 p-3">
          <Label className="text-xs font-semibold">Folha de padrão (PDF)</Label>
          <Input value={pdfTitulo} onChange={(e) => setPdfTitulo(e.target.value)} placeholder="Título" className="h-8 text-xs" />
          <Input value={pdfAutor} onChange={(e) => setPdfAutor(e.target.value)} placeholder="Autor(a) (opcional)" className="h-8 text-xs" />
          <p className="text-[10px] text-muted-foreground">Gera PDF com capa, gráfico e legenda DMC (com símbolos, swatches e stock).</p>
          <Button size="sm" className="w-full" onClick={exportarPatternSheetPdf} disabled={pdfBusy}>
            {pdfBusy ? "A gerar…" : "Exportar folha PDF"}
          </Button>
        </CardContent></Card>
        <WatermarkControls w={w} set={setW} />
        <ExportPanel targetRef={ref} defaultArea="Bordado" defaultTitulo="Padrão Bordado" size={sheet.size} orientacao={sheet.orientacao} />
      </div>
    </div>
  );
}