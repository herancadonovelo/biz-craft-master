import { createFileRoute } from "@tanstack/react-router";
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
  const ref = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [w, setW] = useMarcaDAgua();

  type Tool = "select" | "move" | "line" | "curve" | "text" | "measure" | "number" | "label";
  const [tool, setTool] = useState<Tool>("curve");
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [stroke, setStroke] = useState("#000000");
  const [grid, setGrid] = useState(true);
  const [snapOn, setSnapOn] = useState(true);
  const [realista, setRealista] = useState(false);
  const [fontFamily, setFontFamily] = useState("Inter");

  const [objs, setObjs] = useState<AnyObj[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [linePending, setLinePending] = useState<{ x: number; y: number } | null>(null);
  // Polilinha contínua de vértices (usada por "Reta" e "Curva")
  const [polyPts, setPolyPts] = useState<{ x: number; y: number }[]>([]);
  const [polyMode, setPolyMode] = useState<"line" | "curve">("line");
  const [hoverPt, setHoverPt] = useState<{ x: number; y: number } | null>(null);

  // Zoom & pan (ferramenta "Mover")
  const [zoom, setZoom] = useState(1);
  const [viewDx, setViewDx] = useState(0);
  const [viewDy, setViewDy] = useState(0);
  const panRef = useRef<{ sx: number; sy: number; dx: number; dy: number } | null>(null);

  // Estilo das setas por path
  const [arrowStyles, setArrowStyles] = useState<Record<string, "triangle" | "open" | "line">>({});
  // Drag de vértice individual
  const vertexDragRef = useRef<{ pathId: string; index: number } | null>(null);

  const buildPoly = (pts: { x: number; y: number }[], mode: "line" | "curve", fechar: boolean) => {
    if (pts.length < 2) return "";
    if (mode === "line") {
      let d = `M ${pts[0].x} ${pts[0].y}` + pts.slice(1).map((q) => ` L ${q.x} ${q.y}`).join("");
      if (fechar) d += " Z";
      return d;
    }
    // Curva contínua suavizada passando pelos vértices
    const arr = fechar ? [...pts, pts[0]] : pts;
    let d = `M ${arr[0].x} ${arr[0].y}`;
    if (arr.length === 2) { d += ` L ${arr[1].x} ${arr[1].y}`; return d + (fechar ? " Z" : ""); }
    for (let i = 1; i < arr.length - 1; i++) {
      const mx = (arr[i].x + arr[i + 1].x) / 2;
      const my = (arr[i].y + arr[i + 1].y) / 2;
      d += ` Q ${arr[i].x} ${arr[i].y} ${mx} ${my}`;
    }
    d += ` T ${arr[arr.length - 1].x} ${arr[arr.length - 1].y}`;
    if (fechar) d += " Z";
    return d;
  };

  const terminarPoli = (fechar = false) => {
    if (polyPts.length < 2) { setPolyPts([]); return; }
    const d = buildPoly(polyPts, polyMode, fechar);
    if (d) {
      const id = crypto.randomUUID();
      const ptsCopy = polyPts.map((q) => ({ ...q }));
      setObjs((s) => [...s, { id, kind: "path", d, pts: ptsCopy, mode: polyMode, closed: fechar, x: 0, y: 0, rot: 0, scale: 1, stroke, strokeWidth }]);
      setSelected(new Set([id]));
    }
    setPolyPts([]);
    setHoverPt(null);
  };
  const [measurePts, setMeasurePts] = useState<{ x: number; y: number }[]>([]);
  const drawPts = useRef<{ x: number; y: number }[]>([]);
  const drawing = useRef(false);
  const dragRef = useRef<{ id: string; sx: number; sy: number; ox: number; oy: number } | null>(null);

  // Guias avançadas
  const [pautaOn, setPautaOn] = useState(false);
  const [pautaH, setPautaH] = useState(2);          // altura da letra em cm
  const [pautaY, setPautaY] = useState(6);          // posição vertical do topo, cm
  const [caligrafia, setCaligrafia] = useState(false);
  const [arrowedPaths, setArrowedPaths] = useState<Set<string>>(new Set());
  const [numeros, setNumeros] = useState<{ id: string; x: number; y: number; n: number }[]>([]);
  const [etiquetas, setEtiquetas] = useState<{ id: string; x: number; y: number; lx: number; ly: number; texto: string }[]>([]);
  const ETIQUETAS_PRE = ["Por trás", "Pela frente", "Cruzamento", "Início", "Fim", "Dobrar"];

  // Integração com Stock de Material
  const materiais = useStore((s) => s.materiais);
  const [arameMaterialId, setArameMaterialId] = useState<string>("");
  const updateMaterial = useStore((s) => s.update);

  // Carregar fontes do Google sob demanda
  useEffect(() => {
    if (typeof document === "undefined") return;
    const id = `gf-${fontFamily.replace(/\s+/g, "-")}`;
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@400;700&display=swap`;
    document.head.appendChild(link);
  }, [fontFamily]);

  const ptSvg = (e: React.PointerEvent<SVGSVGElement>) => {
    const p = ponto(e, svgRef.current!);
    const wx = (p.x - viewDx) / zoom;
    const wy = (p.y - viewDy) / zoom;
    return { x: snap(wx, snapOn), y: snap(wy, snapOn) };
  };

  const addPath = (d: string) => {
    const id = crypto.randomUUID();
    setObjs((s) => [...s, { id, kind: "path", d, x: 0, y: 0, rot: 0, scale: 1, stroke, strokeWidth }]);
    setSelected(new Set([id]));
  };

  const onDown = (e: React.PointerEvent<SVGSVGElement>) => {
    const p = ptSvg(e);
    if (tool === "select") { setSelected(new Set()); return; }
    if (tool === "move") {
      const raw = ponto(e, svgRef.current!);
      panRef.current = { sx: raw.x, sy: raw.y, dx: viewDx, dy: viewDy };
      (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
      return;
    }
    if (tool === "measure") {
      setMeasurePts((m) => (m.length >= 2 ? [p] : [...m, p]));
      return;
    }
    if (tool === "number") {
      setNumeros((s) => [...s, { id: crypto.randomUUID(), x: p.x, y: p.y, n: s.length + 1 }]);
      return;
    }
    if (tool === "label") {
      const idx = window.prompt(
        "Etiqueta (escreve número ou texto):\n" + ETIQUETAS_PRE.map((t, i) => `${i + 1}) ${t}`).join("\n"),
        "1",
      );
      if (!idx) return;
      const n = parseInt(idx, 10);
      const texto = Number.isFinite(n) && ETIQUETAS_PRE[n - 1] ? ETIQUETAS_PRE[n - 1] : idx;
      setEtiquetas((s) => [...s, { id: crypto.randomUUID(), x: p.x, y: p.y, lx: p.x + 40, ly: p.y - 30, texto }]);
      return;
    }
    if (tool === "line" || tool === "curve") {
      if (e.detail === 2 && polyPts.length >= 2) { terminarPoli(false); return; }
      setPolyMode(tool);
      setPolyPts((s) => [...s, p]);
      return;
    }
    if (tool === "text") {
      const t = window.prompt("Texto a inserir:", "Tricotin");
      if (!t) return;
      const id = crypto.randomUUID();
      setObjs((s) => [...s, { id, kind: "text", text: t, font: fontFamily, size: 32, x: p.x, y: p.y, rot: 0, scale: 1, stroke, strokeWidth }]);
      setSelected(new Set([id]));
    }
  };
  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if ((tool === "line" || tool === "curve") && polyPts.length > 0) {
      const r = ponto(e, svgRef.current!);
      setHoverPt({ x: (r.x - viewDx) / zoom, y: (r.y - viewDy) / zoom });
    }
    if (panRef.current) {
      const raw = ponto(e, svgRef.current!);
      setViewDx(panRef.current.dx + (raw.x - panRef.current.sx));
      setViewDy(panRef.current.dy + (raw.y - panRef.current.sy));
    }
  };
  const onUp = () => { panRef.current = null; };

  const selectObj = (id: string, additive = false) => {
    setSelected((s) => {
      const n = new Set(additive ? s : []);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const startDrag = (e: React.PointerEvent, id: string) => {
    if (tool === "move") return;
    e.stopPropagation();
    const raw = ponto(e as any, svgRef.current!);
    const p = { x: (raw.x - viewDx) / zoom, y: (raw.y - viewDy) / zoom };
    const o = objs.find((x) => x.id === id)!;
    dragRef.current = { id, sx: p.x, sy: p.y, ox: o.x, oy: o.y };
    selectObj(id, e.shiftKey);
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };

  const startVertexDrag = (e: React.PointerEvent, pathId: string, index: number) => {
    if (tool !== "select") return;
    e.stopPropagation();
    vertexDragRef.current = { pathId, index };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };

  const onSvgPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    onMove(e);
    if (vertexDragRef.current) {
      const raw = ponto(e, svgRef.current!);
      const wx = snap((raw.x - viewDx) / zoom, snapOn);
      const wy = snap((raw.y - viewDy) / zoom, snapOn);
      const { pathId, index } = vertexDragRef.current;
      setObjs((s) => s.map((o) => {
        if (o.id !== pathId || o.kind !== "path" || !o.pts) return o;
        const npts = o.pts.map((q, i) => i === index ? { x: wx, y: wy } : q);
        return { ...o, pts: npts, d: buildPoly(npts, o.mode ?? "line", !!o.closed) };
      }));
      return;
    }
    if (!dragRef.current) return;
    const raw = ponto(e, svgRef.current!);
    const p = { x: (raw.x - viewDx) / zoom, y: (raw.y - viewDy) / zoom };
    const dx = p.x - dragRef.current.sx;
    const dy = p.y - dragRef.current.sy;
    const id = dragRef.current.id;
    setObjs((s) => s.map((o) => o.id === id ? { ...o, x: snap(dragRef.current!.ox + dx, snapOn), y: snap(dragRef.current!.oy + dy, snapOn) } : o));
  };
  const endDrag = () => { dragRef.current = null; vertexDragRef.current = null; onUp(); };

  const apagar = () => setObjs((s) => s.filter((o) => !selected.has(o.id)));
  const unirPaths = () => {
    const sel = objs.filter((o) => selected.has(o.id) && o.kind === "path") as PathObj[];
    if (sel.length < 2) { toast.error("Seleciona pelo menos 2 traços vetoriais."); return; }
    const merged = sel.map((p) => p.d).join(" ");
    const id = crypto.randomUUID();
    setObjs((s) => [...s.filter((o) => !selected.has(o.id)),
      { id, kind: "path", d: merged, x: 0, y: 0, rot: 0, scale: 1, stroke: sel[0].stroke, strokeWidth: sel[0].strokeWidth }]);
    setSelected(new Set([id]));
    toast.success("Traços unidos.");
  };

  /** Fecha o molde: liga o último ponto ao primeiro com uma linha + Z.
   *  Se as extremidades já estiverem próximas (< 1cm) usa apenas Z. */
  const fecharPath = () => {
    const sel = objs.filter((o) => selected.has(o.id) && o.kind === "path") as PathObj[];
    if (sel.length === 0) { toast.error("Seleciona um traço para fechar."); return; }
    setObjs((s) => s.map((o) => {
      if (!selected.has(o.id) || o.kind !== "path") return o;
      const p = o as PathObj;
      if (/Z\s*$/i.test(p.d)) return p;
      if (typeof document === "undefined") return p;
      const ns = "http://www.w3.org/2000/svg";
      const el = document.createElementNS(ns, "path");
      el.setAttribute("d", p.d);
      let total = 0;
      try { total = el.getTotalLength(); } catch { return p; }
      if (total <= 0) return p;
      const start = el.getPointAtLength(0);
      const end = el.getPointAtLength(total);
      const dist = Math.hypot(end.x - start.x, end.y - start.y);
      const near = dist < PX_PER_CM; // < 1 cm => fecha direto
      const newD = near
        ? `${p.d} Z`
        : `${p.d} L ${start.x.toFixed(2)} ${start.y.toFixed(2)} Z`;
      if (!near) toast.message(`Extremidades a ${(dist / PX_PER_CM).toFixed(1)} cm — ligadas com linha reta.`);
      else toast.success("Molde fechado.");
      return { ...p, d: newD };
    }));
  };

  const inserirSilhueta = (s: { nome: string; d: string }) => {
    // O d original usa um viewBox 100x100 — escalamos x5 e centramos
    const scaled = s.d.replace(/(-?\d+(?:\.\d+)?)/g, (m, _g, i) => {
      // Não escalar comandos (mas todos os tokens numéricos sim, ok aqui)
      return (parseFloat(m) * 4).toFixed(1);
    });
    const id = crypto.randomUUID();
    setObjs((o) => [...o, { id, kind: "path", d: scaled, x: 100, y: 200, rot: 0, scale: 1, stroke, strokeWidth }]);
    setSelected(new Set([id]));
  };

  const selObj = objs.find((o) => selected.size === 1 && selected.has(o.id));

  const comprimentoTotal = useMemo(() => {
    let total = 0;
    for (const o of objs) {
      if (o.kind === "path") total += pathLength(o.d) * o.scale;
    }
    return total / PX_PER_CM;
  }, [objs]);

  const medicao = useMemo(() => {
    if (measurePts.length < 2) return null;
    const [a, b] = measurePts;
    const cm = Math.hypot(b.x - a.x, b.y - a.y) / PX_PER_CM;
    return { a, b, cm };
  }, [measurePts]);

  const onWheelSvg = (e: React.WheelEvent<SVGSVGElement>) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
    setZoom((z) => Math.min(4, Math.max(0.3, z * factor)));
  };
  const resetView = () => { setZoom(1); setViewDx(0); setViewDy(0); };

  const bbox = (o: AnyObj) => {
    if (o.kind === "text") return { w: (o.text.length * o.size) / 2, h: o.size };
    return { w: 100, h: 100 };
  };

  /** Calcula 3 pontos+tangentes ao longo de um path para desenhar setas de sentido. */
  const arrowsForPath = (d: string): { x: number; y: number; ang: number }[] => {
    if (typeof document === "undefined") return [];
    const ns = "http://www.w3.org/2000/svg";
    const el = document.createElementNS(ns, "path");
    el.setAttribute("d", d);
    let len = 0;
    try { len = el.getTotalLength(); } catch { return []; }
    if (len < 10) return [];
    return [0.25, 0.55, 0.85].map((t) => {
      const p = el.getPointAtLength(len * t);
      const p2 = el.getPointAtLength(Math.min(len, len * t + 1));
      return { x: p.x, y: p.y, ang: (Math.atan2(p2.y - p.y, p2.x - p.x) * 180) / Math.PI };
    });
  };

  /* --- Stock & custo do arame --- */
  const arameMat = materiais.find((m) => m.id === arameMaterialId);
  const arameNecessarioM = comprimentoTotal / 100; // metros
  const custoArame = arameMat ? arameMat.precoCompra * arameNecessarioM : 0;
  const stockSuficiente = arameMat ? arameMat.stock >= arameNecessarioM : true;
  const faltaM = arameMat ? Math.max(0, arameNecessarioM - arameMat.stock) : 0;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2 rounded-md border bg-card p-2 text-xs">
          <span className="font-semibold">Arame necessário:</span>
          <span className="font-display text-base font-bold">{comprimentoTotal.toFixed(1)} cm</span>
          {comprimentoTotal > 0 && <span className="text-muted-foreground">— necessita {comprimentoTotal.toFixed(1)} cm de tricotin para este molde.</span>}
        </div>

        {/* Réguas */}
        <div className="relative">
          <div className="absolute left-6 right-0 top-0 flex h-5 border-b bg-muted/40 text-[9px]">
            {Array.from({ length: 21 }).map((_, i) => (
              <div key={i} className="relative border-l" style={{ width: `${100 / 21}%` }}>
                <span className="absolute left-0.5 top-0">{i}</span>
              </div>
            ))}
          </div>
          <div className="absolute left-0 top-5 bottom-0 flex w-6 flex-col border-r bg-muted/40 text-[9px]">
            {Array.from({ length: 29 }).map((_, i) => (
              <div key={i} className="relative border-t pl-0.5" style={{ height: `${100 / 29}%` }}>{i}</div>
            ))}
          </div>
          <div className="pl-6 pt-5">
            <A4Stage innerRef={ref} watermark={w}>
              <svg ref={svgRef} viewBox={`0 0 ${A4_W} ${A4_H}`} className="absolute inset-0 h-full w-full touch-none"
                   onPointerDown={onDown} onPointerMove={onSvgPointerMove} onPointerUp={endDrag} onPointerLeave={endDrag}
                   onWheel={onWheelSvg}
                   style={{ cursor: tool === "move" ? "grab" : undefined }}>
                <defs>
                  <pattern id="grid-mm" width={PX_PER_CM / 2} height={PX_PER_CM / 2} patternUnits="userSpaceOnUse">
                    <path d={`M ${PX_PER_CM / 2} 0 L 0 0 0 ${PX_PER_CM / 2}`} fill="none" stroke="#eee" strokeWidth="0.5" />
                  </pattern>
                  <pattern id="grid-cm" width={PX_PER_CM} height={PX_PER_CM} patternUnits="userSpaceOnUse">
                    <path d={`M ${PX_PER_CM} 0 L 0 0 0 ${PX_PER_CM}`} fill="none" stroke="#d4d4d4" strokeWidth="0.7" />
                  </pattern>
                  <filter id="yarn">
                    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" />
                    <feDisplacementMap in="SourceGraphic" scale="2" />
                  </filter>
                </defs>
                {grid && <>
                  <rect width="100%" height="100%" fill="url(#grid-mm)" />
                  <rect width="100%" height="100%" fill="url(#grid-cm)" />
                </>}
                <g transform={`translate(${viewDx} ${viewDy}) scale(${zoom})`}>

                {/* Pauta de caligrafia */}
                {pautaOn && (() => {
                  const top = pautaY * PX_PER_CM;
                  const mid = top + (pautaH * PX_PER_CM) * 0.4;
                  const base = top + pautaH * PX_PER_CM;
                  const desc = base + pautaH * PX_PER_CM * 0.5;
                  return (
                    <g>
                      <line x1="0" y1={top}  x2={A4_W} y2={top}  stroke="#93c5fd" strokeDasharray="6 4" />
                      <line x1="0" y1={mid}  x2={A4_W} y2={mid}  stroke="#cbd5e1" strokeDasharray="2 3" />
                      <line x1="0" y1={base} x2={A4_W} y2={base} stroke="#1d4ed8" strokeWidth="1.2" />
                      <line x1="0" y1={desc} x2={A4_W} y2={desc} stroke="#93c5fd" strokeDasharray="6 4" />
                    </g>
                  );
                })()}

                {/* Objetos */}
                {objs.map((o) => {
                  const sel = selected.has(o.id);
                  const transform = `translate(${o.x} ${o.y}) rotate(${o.rot}) scale(${o.scale})`;
                  if (o.kind === "path") {
                    const corLinha = caligrafia ? "#cbd5e1" : o.stroke;
                    const aStyle = arrowStyles[o.id] ?? "triangle";
                    return (
                      <g key={o.id} transform={transform} onPointerDown={(e) => startDrag(e, o.id)} style={{ cursor: tool === "select" ? "move" : tool === "move" ? "grab" : "crosshair" }}>
                        {sel && (
                          <path d={o.d} stroke="#1e88e5" strokeWidth={o.strokeWidth + 6} fill="none"
                                strokeLinecap="round" strokeLinejoin="round" opacity={0.25} pointerEvents="none" />
                        )}
                        <path d={o.d} stroke={corLinha} strokeWidth={o.strokeWidth} fill="none"
                              strokeLinecap="round" strokeLinejoin="round"
                              filter={realista ? "url(#yarn)" : undefined}
                              style={realista ? { strokeDasharray: `${o.strokeWidth * 0.6} ${o.strokeWidth * 0.3}` } : undefined} />
                        {arrowedPaths.has(o.id) && arrowsForPath(o.d).map((a, i) => (
                          <g key={i} transform={`translate(${a.x} ${a.y}) rotate(${a.ang})`}>
                            {aStyle === "triangle" && <polygon points="-8,-5 0,0 -8,5" fill="#111" />}
                            {aStyle === "open" && <polyline points="-8,-5 0,0 -8,5" fill="none" stroke="#111" strokeWidth="1.5" />}
                            {aStyle === "line" && <line x1="-10" y1="0" x2="0" y2="0" stroke="#111" strokeWidth="2" />}
                          </g>
                        ))}
                        {sel && tool === "select" && o.pts && o.pts.map((q, i) => (
                          <circle key={`v${i}`} cx={q.x} cy={q.y} r={5 / Math.max(0.5, zoom)} fill="#ef4444" stroke="#fff" strokeWidth={1.5 / Math.max(0.5, zoom)}
                            style={{ cursor: "grab" }}
                            onPointerDown={(e) => startVertexDrag(e, o.id, i)} />
                        ))}
                      </g>
                    );
                  }
                  return (
                    <g key={o.id} transform={transform} onPointerDown={(e) => startDrag(e, o.id)} style={{ cursor: tool === "select" ? "move" : "text" }}>
                      <text fontFamily={o.font} fontSize={o.size} fill={o.stroke}>{o.text}</text>
                      {sel && <SelectionFrame w={(o.text.length * o.size) / 2} h={o.size} dy={-o.size} />}
                    </g>
                  );
                })}

                {/* Números de sequência */}
                {numeros.map((n) => (
                  <g key={n.id} style={{ cursor: tool === "select" ? "pointer" : "default" }}
                     onClick={() => tool === "select" && setNumeros((s) => s.filter((x) => x.id !== n.id))}>
                    <circle cx={n.x} cy={n.y} r="11" fill="#ef4444" stroke="#fff" strokeWidth="1.5" />
                    <text x={n.x} y={n.y + 4} textAnchor="middle" fontSize="12" fill="#fff" fontWeight="700">{n.n}</text>
                  </g>
                ))}

                {/* Etiquetas com leader line */}
                {etiquetas.map((et) => (
                  <g key={et.id} style={{ cursor: tool === "select" ? "pointer" : "default" }}
                     onClick={() => tool === "select" && setEtiquetas((s) => s.filter((x) => x.id !== et.id))}>
                    <circle cx={et.x} cy={et.y} r="3" fill="#1d4ed8" />
                    <line x1={et.x} y1={et.y} x2={et.lx} y2={et.ly} stroke="#1d4ed8" strokeWidth="0.8" />
                    <rect x={et.lx - 2} y={et.ly - 10} width={et.texto.length * 5.4 + 6} height="14" fill="#fff" stroke="#1d4ed8" rx="2" />
                    <text x={et.lx + 2} y={et.ly} fontSize="10" fill="#1d4ed8">{et.texto}</text>
                  </g>
                ))}

                {/* Polilinha / curva em construção */}
                {(tool === "line" || tool === "curve") && polyPts.length > 0 && (
                  <g>
                    <path
                      d={buildPoly(hoverPt ? [...polyPts, hoverPt] : polyPts, tool, false)}
                      stroke="#000000" strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round"
                    />
                    {polyPts.map((q, i) => (
                      <circle key={i} cx={q.x} cy={q.y} r={4} fill="#ef4444" stroke="#fff" strokeWidth={1} />
                    ))}
                  </g>
                )}

                {/* Medição */}
                {medicao && (
                  <g>
                    <line x1={medicao.a.x} y1={medicao.a.y} x2={medicao.b.x} y2={medicao.b.y} stroke="#1e88e5" strokeWidth="1" strokeDasharray="4 4" />
                    <text x={(medicao.a.x + medicao.b.x) / 2} y={(medicao.a.y + medicao.b.y) / 2 - 6} textAnchor="middle" fontSize="12" fill="#1e88e5">{medicao.cm.toFixed(1)} cm</text>
                  </g>
                )}
                </g>
              </svg>
            </A4Stage>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {/* Ferramentas */}
        <Card><CardContent className="space-y-2 p-3">
          <Label className="text-xs">Ferramenta</Label>
          <div className="grid grid-cols-4 gap-1">
            <ToolBtn active={tool === "select"} onClick={() => { if (polyPts.length >= 2) terminarPoli(false); else { setPolyPts([]); setHoverPt(null); } setTool("select"); }} icon={<MousePointer2 className="h-4 w-4" />} label="Selecionar" />
            <ToolBtn active={tool === "move"} onClick={() => { if (polyPts.length >= 2) terminarPoli(false); else { setPolyPts([]); setHoverPt(null); } setTool("move"); }} icon={<Move className="h-4 w-4" />} label="Mover" />
            <ToolBtn active={tool === "line"} onClick={() => { setTool("line"); setLinePending(null); setPolyPts([]); setHoverPt(null); }} icon={<Minus className="h-4 w-4" />} label="Reta" />
            <ToolBtn active={tool === "curve"} onClick={() => { setTool("curve"); setPolyPts([]); setHoverPt(null); }} icon={<Spline className="h-4 w-4" />} label="Curva" />
            <ToolBtn active={tool === "text"} onClick={() => setTool("text")} icon={<Type className="h-4 w-4" />} label="Texto" />
            <ToolBtn active={tool === "measure"} onClick={() => { setTool("measure"); setMeasurePts([]); }} icon={<Ruler className="h-4 w-4" />} label="Fita" />
            <ToolBtn active={tool === "number"} onClick={() => setTool("number")} icon={<Hash className="h-4 w-4" />} label="Nº passo" />
            <ToolBtn active={tool === "label"} onClick={() => setTool("label")} icon={<Tag className="h-4 w-4" />} label="Etiqueta" />
          </div>
          <div className="flex items-center gap-1 pt-1">
            <Label className="text-xs flex-1">Zoom ({Math.round(zoom * 100)}%)</Label>
            <Button size="sm" variant="outline" onClick={() => setZoom((z) => Math.max(0.3, z / 1.2))}><ZoomOut className="h-3 w-3" /></Button>
            <Button size="sm" variant="outline" onClick={() => setZoom((z) => Math.min(4, z * 1.2))}><ZoomIn className="h-3 w-3" /></Button>
            <Button size="sm" variant="ghost" onClick={resetView}>Reset</Button>
          </div>
          {(tool === "line" || tool === "curve") && polyPts.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              <Button size="sm" variant="secondary" onClick={() => terminarPoli(false)}>
                Terminar {tool === "curve" ? "curva" : "linha"} ({polyPts.length} pts)
              </Button>
              <Button size="sm" variant="outline" onClick={() => terminarPoli(true)}>
                <Link2 className="mr-1 h-3 w-3" />Terminar e fechar
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setPolyPts((s) => s.slice(0, -1)); }}>
                Anular último
              </Button>
            </div>
          )}
          <div>
            <Label className="text-xs">Espessura ({strokeWidth}px)</Label>
            <Slider value={[strokeWidth]} min={1} max={20} step={1} onValueChange={(v) => {
              setStrokeWidth(v[0]);
              if (selected.size) setObjs((s) => s.map((o) => selected.has(o.id) ? { ...o, strokeWidth: v[0] } : o));
            }} />
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs">Cor</Label>
            <input type="color" value={stroke} onChange={(e) => {
              setStroke(e.target.value);
              if (selected.size) setObjs((s) => s.map((o) => selected.has(o.id) ? { ...o, stroke: e.target.value } : o));
            }} className="h-8 w-12 rounded border" />
            {tool === "text" && (
              <Select value={fontFamily} onValueChange={setFontFamily}>
                <SelectTrigger className="h-8 flex-1"><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-60">{FONTES_50.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
              </Select>
            )}
          </div>
        </CardContent></Card>

        {/* Transformações do selecionado */}
        {selObj && (
          <Card><CardContent className="space-y-2 p-3">
            <div className="text-xs font-semibold">Objeto selecionado</div>
            <div>
              <Label className="text-xs">Rotação ({selObj.rot}°)</Label>
              <Slider value={[selObj.rot]} min={-180} max={180} step={1}
                onValueChange={(v) => setObjs((s) => s.map((o) => o.id === selObj.id ? { ...o, rot: v[0] } : o))} />
            </div>
            <div>
              <Label className="text-xs">Escala ({selObj.scale.toFixed(2)}×)</Label>
              <Slider value={[selObj.scale * 100]} min={20} max={300} step={5}
                onValueChange={(v) => setObjs((s) => s.map((o) => o.id === selObj.id ? { ...o, scale: v[0] / 100 } : o))} />
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" onClick={() => setObjs((s) => s.map((o) => o.id === selObj.id ? { ...o, rot: o.rot + 90 } : o))}>
                <RotateCw className="mr-1 h-3 w-3" />90°
              </Button>
              <Button size="sm" variant="destructive" onClick={apagar}><Trash2 className="mr-1 h-3 w-3" />Apagar</Button>
            </div>
            {selected.size >= 2 && (
              <Button size="sm" variant="secondary" onClick={unirPaths}><Combine className="mr-1 h-3 w-3" />Unir linhas</Button>
            )}
            {selObj.kind === "path" && (
              <>
                <Button size="sm" variant="secondary" onClick={fecharPath}>
                  <Link2 className="mr-1 h-3 w-3" />Fechar molde
                </Button>
                <Button size="sm" variant={arrowedPaths.has(selObj.id) ? "default" : "outline"} onClick={() => setArrowedPaths((s) => {
                  const n = new Set(s); n.has(selObj.id) ? n.delete(selObj.id) : n.add(selObj.id); return n;
                })}>
                  <ArrowRightCircle className="mr-1 h-3 w-3" />
                  {arrowedPaths.has(selObj.id) ? "Remover setas" : "Adicionar setas de sentido"}
                </Button>
              </>
            )}
          </CardContent></Card>
        )}

        {/* Grelha & Snap & Realista */}
        <Card><CardContent className="space-y-2 p-3">
          <div className="flex flex-wrap gap-1">
            <Button size="sm" variant={grid ? "default" : "outline"} onClick={() => setGrid((v) => !v)}><Grid3x3 className="mr-1 h-3 w-3" />Grelha</Button>
            <Button size="sm" variant={snapOn ? "default" : "outline"} onClick={() => setSnapOn((v) => !v)}><Magnet className="mr-1 h-3 w-3" />Snap</Button>
            <Button size="sm" variant={realista ? "default" : "outline"} onClick={() => setRealista((v) => !v)}><Sparkles className="mr-1 h-3 w-3" />Vista realista</Button>
            <Button size="sm" variant={caligrafia ? "default" : "outline"} onClick={() => setCaligrafia((v) => !v)}><Pen className="mr-1 h-3 w-3" />Modo Caligrafia</Button>
          </div>
          <Button size="sm" variant="ghost" onClick={() => { setObjs([]); setSelected(new Set()); setMeasurePts([]); setNumeros([]); setEtiquetas([]); setArrowedPaths(new Set()); }}>
            <Eraser className="mr-1 h-3 w-3" />Limpar tudo
          </Button>
        </CardContent></Card>

        {/* Pauta de caligrafia */}
        <Card><CardContent className="space-y-2 p-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold">Pauta escolar (linhas-guia)</div>
            <Button size="sm" variant={pautaOn ? "default" : "outline"} onClick={() => setPautaOn((v) => !v)}>
              {pautaOn ? "Ativa" : "Ativar"}
            </Button>
          </div>
          {pautaOn && <>
            <div>
              <Label className="text-xs">Altura da letra ({pautaH} cm)</Label>
              <Slider value={[pautaH * 10]} min={5} max={80} step={1} onValueChange={(v) => setPautaH(v[0] / 10)} />
            </div>
            <div>
              <Label className="text-xs">Posição vertical ({pautaY} cm do topo)</Label>
              <Slider value={[pautaY * 10]} min={10} max={250} step={5} onValueChange={(v) => setPautaY(v[0] / 10)} />
            </div>
          </>}
        </CardContent></Card>

        {/* Marcadores & Etiquetas */}
        {(numeros.length > 0 || etiquetas.length > 0) && (
          <Card><CardContent className="space-y-2 p-3">
            <div className="text-xs font-semibold">Marcadores no molde</div>
            {numeros.length > 0 && <div className="text-[11px] text-muted-foreground">{numeros.length} marcador(es) numérico(s) — usa a ferramenta Selecionar e clica num círculo para remover.</div>}
            {etiquetas.length > 0 && <div className="text-[11px] text-muted-foreground">{etiquetas.length} etiqueta(s) de sobreposição — clica para remover.</div>}
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={() => setNumeros([])}>Limpar números</Button>
              <Button size="sm" variant="ghost" onClick={() => setEtiquetas([])}>Limpar etiquetas</Button>
            </div>
          </CardContent></Card>
        )}

        {/* Stock & Custo do arame */}
        <Card><CardContent className="space-y-2 p-3">
          <div className="text-xs font-semibold">Stock & Custo do arame</div>
          <Label className="text-xs">Material (Stock de Material)</Label>
          <Select value={arameMaterialId} onValueChange={setArameMaterialId}>
            <SelectTrigger className="h-8"><SelectValue placeholder="Selecionar material…" /></SelectTrigger>
            <SelectContent>
              {materiais.length === 0 && <div className="px-2 py-1 text-xs text-muted-foreground">Sem materiais no stock.</div>}
              {materiais.map((m) => <SelectItem key={m.id} value={m.id}>{m.nome} — {formatEUR(m.precoCompra)}/{m.unidade}</SelectItem>)}
            </SelectContent>
          </Select>
          {arameMat ? (
            <div className="space-y-1 text-xs">
              <div>Necessário: <strong>{arameNecessarioM.toFixed(2)} m</strong> ({comprimentoTotal.toFixed(1)} cm)</div>
              <div>Preço unitário: {formatEUR(arameMat.precoCompra)}/{arameMat.unidade}</div>
              <div className="font-display text-sm">Custo estimado: <strong>{formatEUR(custoArame)}</strong></div>
              <div>Stock atual: {arameMat.stock} {arameMat.unidade}</div>
              {!stockSuficiente && (
                <div className="rounded-md border border-destructive/50 bg-destructive/10 p-2">
                  <div className="font-semibold text-destructive">Lista de compras</div>
                  <div>Falta comprar <strong>{faltaM.toFixed(2)} {arameMat.unidade}</strong> de {arameMat.nome}.</div>
                  <Button size="sm" variant="outline" className="mt-1"
                    onClick={() => {
                      updateMaterial("materiais", arameMat.id, {
                        stockMinimo: Math.max(arameMat.stockMinimo ?? 0, Math.ceil(arameNecessarioM)),
                      });
                      toast.success("Stock mínimo atualizado — aparece em Lista de Compras.");
                    }}>
                    Adicionar à Lista de Compras
                  </Button>
                </div>
              )}
              {stockSuficiente && comprimentoTotal > 0 && (
                <div className="text-emerald-600">Stock suficiente para o molde.</div>
              )}
            </div>
          ) : (
            <div className="text-[11px] text-muted-foreground">Seleciona um material de arame/tricotin para ver custo automático e gerar lista de compras quando faltar.</div>
          )}
        </CardContent></Card>

        {/* Biblioteca de silhuetas */}
        <Card><CardContent className="space-y-2 p-3">
          <div className="text-xs font-semibold">Silhuetas base</div>
          <div className="grid grid-cols-4 gap-1">
            {SILHUETAS.map((s) => (
              <button key={s.nome} title={s.nome} onClick={() => inserirSilhueta(s)}
                      className="grid aspect-square place-items-center rounded border bg-background hover:bg-muted">
                <svg viewBox="0 0 100 100" className="h-8 w-8"><path d={s.d} stroke="#222" strokeWidth="3" fill="none" /></svg>
              </button>
            ))}
          </div>
        </CardContent></Card>

        <WatermarkControls w={w} set={setW} />
        <ExportPanel targetRef={ref} defaultArea="Tricotin" defaultTitulo="Molde Tricotin" />
      </div>
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