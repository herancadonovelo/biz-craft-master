import * as React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import {
  Pencil, Eraser, PaintBucket, Slash, Circle, Type as TypeIcon, FlipHorizontal2, FlipVertical2,
  Replace as ReplaceIcon, Upload, Download, FileDown, Image as ImageIcon, Layers, Palette, Blend,
  Undo2, Redo2, Minus, Square, BoxSelect,
} from "lucide-react";
import {
  emptyChart, imageToChart, textToCells, floodFill, mirror, replaceColor,
  chartStats, fabricSizeCm, chartToJson, jsonToChart, chartToOxs,
  closestThread, blend,
  type ChartDoc, type Cell, type BackstitchEdge, type FrenchKnot,
} from "@/lib/ponto-cruz";
import { getDMC, getAnchor, type Marca, type Cor } from "@/lib/cores-linhas";

type Tool = "pencil" | "eraser" | "bucket" | "half" | "backstitch" | "knot" | "text" | "replace" | "eyedrop" | "line" | "rect" | "select";

interface RectRegion { r1: number; c1: number; r2: number; c2: number }

const STORAGE_KEY = "ponto-cruz-chart-v1";

function loadChart(): ChartDoc {
  if (typeof window === "undefined") return emptyChart();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return jsonToChart(raw);
  } catch { /* noop */ }
  return emptyChart();
}

/** Bresenham line — returns integer grid cells from (r1,c1) to (r2,c2). */
function linePoints(r1: number, c1: number, r2: number, c2: number): Array<[number, number]> {
  const pts: Array<[number, number]> = [];
  const dx = Math.abs(c2 - c1), sx = c1 < c2 ? 1 : -1;
  const dy = -Math.abs(r2 - r1), sy = r1 < r2 ? 1 : -1;
  let err = dx + dy, r = r1, c = c1;
  while (true) {
    pts.push([r, c]);
    if (r === r2 && c === c2) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; c += sx; }
    if (e2 <= dx) { err += dx; r += sy; }
  }
  return pts;
}
function rectCells(reg: RectRegion, filled: boolean): Array<[number, number]> {
  const r1 = Math.min(reg.r1, reg.r2), r2 = Math.max(reg.r1, reg.r2);
  const c1 = Math.min(reg.c1, reg.c2), c2 = Math.max(reg.c1, reg.c2);
  const out: Array<[number, number]> = [];
  for (let r = r1; r <= r2; r++) for (let c = c1; c <= c2; c++) {
    if (filled || r === r1 || r === r2 || c === c1 || c === c2) out.push([r, c]);
  }
  return out;
}

export function PontoCruzEditor() {
  const [chart, setChart] = useState<ChartDoc>(loadChart);
  // History stacks for undo/redo — cap to avoid memory bloat.
  const past = useRef<ChartDoc[]>([]);
  const future = useRef<ChartDoc[]>([]);
  const [, forceTick] = useState(0);
  const commit = useCallback((next: ChartDoc | ((c: ChartDoc) => ChartDoc)) => {
    setChart((cur) => {
      const n = typeof next === "function" ? (next as (c: ChartDoc) => ChartDoc)(cur) : next;
      if (n === cur) return cur;
      past.current.push(cur);
      if (past.current.length > 80) past.current.shift();
      future.current = [];
      forceTick((x) => x + 1);
      return n;
    });
  }, []);
  const undo = useCallback(() => {
    const prev = past.current.pop(); if (!prev) return;
    setChart((cur) => { future.current.push(cur); forceTick((x) => x + 1); return prev; });
  }, []);
  const redo = useCallback(() => {
    const nxt = future.current.pop(); if (!nxt) return;
    setChart((cur) => { past.current.push(cur); forceTick((x) => x + 1); return nxt; });
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.ctrlKey || e.metaKey;
      if (!meta) return;
      if (e.key.toLowerCase() === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
      else if ((e.key.toLowerCase() === "z" && e.shiftKey) || e.key.toLowerCase() === "y") { e.preventDefault(); redo(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  const [tool, setTool] = useState<Tool>("pencil");
  const [cor, setCor] = useState("#C8102E");
  const [cor2, setCor2] = useState<string | null>(null);
  const [showSymbols, setShowSymbols] = useState(false);
  const [realistic, setRealistic] = useState(false);
  const [showBackLayer, setShowBackLayer] = useState(true);
  const [replaceFrom, setReplaceFrom] = useState<string>("#000000");
  const [textInput, setTextInput] = useState("Amor");
  const [textFont, setTextFont] = useState<string>("Courier New");
  const [textSize, setTextSize] = useState<number>(12);
  const [textRow, setTextRow] = useState<number>(2);
  const [textCol, setTextCol] = useState<number>(2);
  const [imgMaxColors, setImgMaxColors] = useState<number>(16);
  const [rectFilled, setRectFilled] = useState(true);
  const [selection, setSelection] = useState<RectRegion | null>(null);
  const [preview, setPreview] = useState<Array<[number, number]> | null>(null);
  const [dragStart, setDragStart] = useState<{ r: number; c: number } | null>(null);
  const [watermark, setWatermark] = useState<string>("");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState("");
  const [palettePick, setPalettePick] = useState<Marca>("DMC");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState<number>(18);
  const drawing = useRef(false);
  const backStart = useRef<{ r: number; c: number } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const importInput = useRef<HTMLInputElement>(null);

  // Persist to localStorage (debounced).
  useEffect(() => {
    const t = setTimeout(() => {
      try { window.localStorage.setItem(STORAGE_KEY, chartToJson(chart)); } catch { /* noop */ }
    }, 400);
    return () => clearTimeout(t);
  }, [chart]);

  const stats = useMemo(() => chartStats(chart), [chart]);
  const cm = fabricSizeCm(chart.cols, chart.rows, chart.aidaCount);

  /* ---------------- Rendering ---------------- */
  const render = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const cs = zoom;
    canvas.width = chart.cols * cs * dpr;
    canvas.height = chart.rows * cs * dpr;
    canvas.style.width = `${chart.cols * cs}px`;
    canvas.style.height = `${chart.rows * cs}px`;
    const ctx = canvas.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Cells
    for (const [k, v] of Object.entries(chart.cells)) {
      const [r, c] = k.split(",").map(Number);
      const x = c * cs, y = r * cs;
      const fillHex = v.hex2 ? blend(v.hex, v.hex2) : v.hex;
      if (v.type === "full") {
        if (realistic) {
          ctx.fillStyle = fillHex;
          ctx.fillRect(x, y, cs, cs);
          // "X" stitch texture
          ctx.strokeStyle = "rgba(0,0,0,0.25)"; ctx.lineWidth = Math.max(1, cs * 0.12);
          ctx.beginPath(); ctx.moveTo(x + 1, y + 1); ctx.lineTo(x + cs - 1, y + cs - 1);
          ctx.moveTo(x + cs - 1, y + 1); ctx.lineTo(x + 1, y + cs - 1); ctx.stroke();
        } else if (showSymbols) {
          ctx.fillStyle = "#ffffff"; ctx.fillRect(x, y, cs, cs);
          const s = stats.find((st) => st.hex === v.hex);
          ctx.fillStyle = "#111"; ctx.font = `${cs * 0.75}px system-ui`;
          ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillText(s?.symbol ?? "?", x + cs / 2, y + cs / 2);
        } else {
          ctx.fillStyle = fillHex; ctx.fillRect(x, y, cs, cs);
        }
      } else {
        // Half-stitch triangle
        ctx.fillStyle = fillHex;
        ctx.beginPath();
        if (v.type === "half-tl") { ctx.moveTo(x, y); ctx.lineTo(x + cs, y); ctx.lineTo(x, y + cs); }
        else { ctx.moveTo(x + cs, y); ctx.lineTo(x + cs, y + cs); ctx.lineTo(x, y + cs); }
        ctx.closePath(); ctx.fill();
      }
    }

    // Grid lines
    ctx.strokeStyle = "rgba(0,0,0,0.15)"; ctx.lineWidth = 1;
    ctx.beginPath();
    for (let c = 0; c <= chart.cols; c++) { ctx.moveTo(c * cs + 0.5, 0); ctx.lineTo(c * cs + 0.5, chart.rows * cs); }
    for (let r = 0; r <= chart.rows; r++) { ctx.moveTo(0, r * cs + 0.5); ctx.lineTo(chart.cols * cs, r * cs + 0.5); }
    ctx.stroke();
    // Every 10 grid emphasized
    ctx.strokeStyle = "rgba(0,0,0,0.7)"; ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let c = 0; c <= chart.cols; c += 10) { ctx.moveTo(c * cs + 0.5, 0); ctx.lineTo(c * cs + 0.5, chart.rows * cs); }
    for (let r = 0; r <= chart.rows; r += 10) { ctx.moveTo(0, r * cs + 0.5); ctx.lineTo(chart.cols * cs, r * cs + 0.5); }
    ctx.stroke();

    // Backstitch layer
    if (showBackLayer) {
      for (const b of chart.back) {
        ctx.strokeStyle = b.hex; ctx.lineWidth = Math.max(1.5, cs * 0.12);
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(b.c1 * cs, b.r1 * cs);
        ctx.lineTo(b.c2 * cs, b.r2 * cs);
        ctx.stroke();
      }
    }
    // French knots
    for (const k of chart.knots) {
      ctx.fillStyle = k.hex;
      ctx.beginPath();
      ctx.arc(k.c * cs, k.r * cs, Math.max(2, cs * 0.22), 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.4)"; ctx.lineWidth = 0.8; ctx.stroke();
    }
  }, [chart, zoom, showSymbols, realistic, showBackLayer, stats]);

  useEffect(() => { render(); }, [render]);

  /* ---------------- Interaction ---------------- */
  const eventToGrid = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    const c = Math.floor(x / zoom), r = Math.floor(y / zoom);
    return { r, c, x, y };
  };
  const eventToVertex = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    return { r: Math.round(y / zoom), c: Math.round(x / zoom) };
  };

  const paintCell = (r: number, c: number) => {
    if (r < 0 || c < 0 || r >= chart.rows || c >= chart.cols) return;
    setChart((ch) => {
      const cells = { ...ch.cells };
      const key = `${r},${c}`;
      if (tool === "eraser") delete cells[key];
      else if (tool === "half") cells[key] = { hex: cor, type: "half-tl", hex2: cor2 ?? undefined };
      else if (tool === "pencil") cells[key] = { hex: cor, type: "full", hex2: cor2 ?? undefined };
      return { ...ch, cells };
    });
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (tool === "backstitch") {
      const v = eventToVertex(e); backStart.current = v; return;
    }
    if (tool === "knot") {
      const v = eventToVertex(e);
      setChart((ch) => ({ ...ch, knots: [...ch.knots, { r: v.r, c: v.c, hex: cor }] }));
      return;
    }
    const { r, c } = eventToGrid(e);
    if (tool === "bucket") { setChart((ch) => ({ ...ch, cells: floodFill(ch.cells, ch.cols, ch.rows, r, c, cor) })); return; }
    if (tool === "replace") {
      const src = chart.cells[`${r},${c}`]?.hex; if (src) setReplaceFrom(src);
      toast.info(`Origem: ${src ?? "(vazio)"} — clica em “Substituir” para aplicar.`);
      return;
    }
    if (tool === "eyedrop") {
      const src = chart.cells[`${r},${c}`]?.hex; if (src) { setCor(src); toast.success(`Cor: ${src}`); }
      return;
    }
    if (tool === "text") return;
    drawing.current = true; paintCell(r, c);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const { r, c } = eventToGrid(e);
    paintCell(r, c);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    drawing.current = false;
    if (tool === "backstitch" && backStart.current) {
      const v = eventToVertex(e);
      const s = backStart.current;
      if (s.r !== v.r || s.c !== v.c) {
        const edge: BackstitchEdge = { r1: s.r, c1: s.c, r2: v.r, c2: v.c, hex: cor };
        setChart((ch) => ({ ...ch, back: [...ch.back, edge] }));
      }
      backStart.current = null;
    }
  };

  /* ---------------- Actions ---------------- */
  const setSize = (cols: number, rows: number) => setChart((ch) => ({ ...ch, cols, rows }));
  const clearAll = () => {
    if (!confirm("Limpar todo o gráfico?")) return;
    setChart(emptyChart(chart.cols, chart.rows));
  };
  const doMirror = (axis: "h" | "v") =>
    setChart((ch) => ({ ...ch, cells: mirror(ch.cells, ch.cols, ch.rows, axis) }));
  const doReplace = (to: string) =>
    setChart((ch) => ({ ...ch, cells: replaceColor(ch.cells, replaceFrom, to) }));
  const removeLastBack = () => setChart((ch) => ({ ...ch, back: ch.back.slice(0, -1) }));
  const clearBack = () => setChart((ch) => ({ ...ch, back: [] }));
  const clearKnots = () => setChart((ch) => ({ ...ch, knots: [] }));

  const importImage = (file: File) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const next = imageToChart(img, img.naturalWidth, img.naturalHeight, {
          cols: chart.cols, rows: chart.rows, maxColors: imgMaxColors, marca: chart.paletteMarca,
        });
        setChart((ch) => ({ ...ch, cells: next.cells }));
        toast.success(`Convertido em ${imgMaxColors} cores máx.`);
      } catch (e) {
        toast.error("Erro ao converter imagem.");
        console.error(e);
      } finally { URL.revokeObjectURL(url); }
    };
    img.onerror = () => { URL.revokeObjectURL(url); toast.error("Não foi possível abrir a imagem."); };
    img.src = url;
  };

  const applyText = () => {
    const cells = textToCells(textInput, {
      font: textFont, sizePx: textSize, hex: cor,
      startRow: textRow, startCol: textCol,
      maxCols: chart.cols, maxRows: chart.rows,
    });
    setChart((ch) => ({ ...ch, cells: { ...ch.cells, ...cells } }));
    toast.success(`Texto “${textInput}” aplicado.`);
  };

  const exportJson = () => {
    const blob = new Blob([chartToJson(chart)], { type: "application/json" });
    triggerDownload(blob, "grafico-ponto-cruz.json");
  };
  const exportOxs = () => {
    const blob = new Blob([chartToOxs(chart, "Gráfico Ponto Cruz")], { type: "application/xml" });
    triggerDownload(blob, "grafico-ponto-cruz.oxs");
  };
  const exportPng = () => {
    canvasRef.current?.toBlob((b) => { if (b) triggerDownload(b, "grafico-ponto-cruz.png"); });
  };
  const exportPdf = () => {
    if (!canvasRef.current) return;
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const imgData = canvasRef.current.toDataURL("image/png");
    const pageW = 210, pageH = 297, margin = 10;
    const maxW = pageW - margin * 2, maxH = 160;
    const ratio = canvasRef.current.width / canvasRef.current.height;
    let w = maxW, h = maxW / ratio;
    if (h > maxH) { h = maxH; w = maxH * ratio; }
    pdf.setFontSize(14); pdf.text("Gráfico de Ponto Cruz", margin, 15);
    pdf.setFontSize(9);
    pdf.text(`Grelha: ${chart.cols} × ${chart.rows} | Aida: ${chart.aidaCount} ct | Tecido: ${cm.w.toFixed(1)} × ${cm.h.toFixed(1)} cm`, margin, 22);
    pdf.addImage(imgData, "PNG", margin, 28, w, h);
    let y = 28 + h + 8;
    pdf.setFontSize(12); pdf.text("Legenda de cores", margin, y); y += 5;
    pdf.setFontSize(9);
    for (const s of stats) {
      if (y > pageH - 10) { pdf.addPage(); y = 15; }
      pdf.setFillColor(s.hex);
      pdf.rect(margin, y - 3, 4, 4, "F");
      pdf.text(`${s.symbol}  DMC ${s.dmc.codigo} · ${s.dmc.nome ?? ""}  ↔  Anchor ${s.anchor.codigo}  —  ${s.full} pontos inteiros, ${s.half} meios, ${s.knots} nós  •  ~${s.meadas} meada(s)`, margin + 6, y);
      y += 5;
    }
    pdf.save("grafico-ponto-cruz.pdf");
  };

  const importChart = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const c = jsonToChart(String(reader.result));
        setChart(c);
        toast.success("Gráfico importado.");
      } catch (e) { toast.error(String((e as Error).message)); }
    };
    reader.readAsText(file);
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      {/* Canvas card (opaque) */}
      <Card className="bg-background/100 opacity-100">
        <CardContent className="p-3">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <ToolButton icon={<Pencil className="h-4 w-4" />} label="Lápis" active={tool === "pencil"} onClick={() => setTool("pencil")} />
            <ToolButton icon={<Eraser className="h-4 w-4" />} label="Apagar" active={tool === "eraser"} onClick={() => setTool("eraser")} />
            <ToolButton icon={<PaintBucket className="h-4 w-4" />} label="Balde" active={tool === "bucket"} onClick={() => setTool("bucket")} />
            <ToolButton icon={<Slash className="h-4 w-4" />} label="½ ponto" active={tool === "half"} onClick={() => setTool("half")} />
            <ToolButton icon={<Pencil className="h-4 w-4 rotate-45" />} label="Ponto atrás" active={tool === "backstitch"} onClick={() => setTool("backstitch")} />
            <ToolButton icon={<Circle className="h-4 w-4" />} label="Nó francês" active={tool === "knot"} onClick={() => setTool("knot")} />
            <ToolButton icon={<TypeIcon className="h-4 w-4" />} label="Texto" active={tool === "text"} onClick={() => setTool("text")} />
            <ToolButton icon={<ReplaceIcon className="h-4 w-4" />} label="Selecionar cor origem" active={tool === "replace"} onClick={() => setTool("replace")} />
            <ToolButton icon={<Palette className="h-4 w-4" />} label="Conta-gotas" active={tool === "eyedrop"} onClick={() => setTool("eyedrop")} />
          </div>
          <div className="max-h-[70vh] max-w-full overflow-auto rounded border bg-white p-2">
            <canvas ref={canvasRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={() => { drawing.current = false; }}
              onContextMenu={(e) => e.preventDefault()}
              className="touch-none select-none"
            />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span>Zoom</span>
            <div className="w-40"><Slider value={[zoom]} min={8} max={40} step={1} onValueChange={(v) => setZoom(v[0])} /></div>
            <span>Tecido: {cm.w.toFixed(1)} × {cm.h.toFixed(1)} cm (Aida {chart.aidaCount})</span>
          </div>
        </CardContent>
      </Card>

      {/* Right side controls */}
      <div className="space-y-3">
        <Tabs defaultValue="grelha">
          <TabsList className="w-full flex-wrap">
            <TabsTrigger value="grelha">Grelha</TabsTrigger>
            <TabsTrigger value="cor">Cor</TabsTrigger>
            <TabsTrigger value="imagem">Imagem</TabsTrigger>
            <TabsTrigger value="texto">Texto</TabsTrigger>
            <TabsTrigger value="camadas">Camadas</TabsTrigger>
            <TabsTrigger value="io">Importar/Exportar</TabsTrigger>
          </TabsList>

          <TabsContent value="grelha">
            <Card><CardContent className="space-y-3 p-3">
              <div className="grid grid-cols-2 gap-2">
                <div><Label className="text-xs">Colunas ({chart.cols})</Label>
                  <Slider value={[chart.cols]} min={10} max={200} onValueChange={(v) => setSize(v[0], chart.rows)} /></div>
                <div><Label className="text-xs">Linhas ({chart.rows})</Label>
                  <Slider value={[chart.rows]} min={10} max={200} onValueChange={(v) => setSize(chart.cols, v[0])} /></div>
              </div>
              <div>
                <Label className="text-xs">Contagem de tecido (Aida)</Label>
                <Select value={String(chart.aidaCount)} onValueChange={(v) => setChart((ch) => ({ ...ch, aidaCount: Number(v) }))}>
                  <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[11, 14, 16, 18, 20, 22, 25, 28].map((n) => (
                      <SelectItem key={n} value={String(n)}>Aida {n} ct</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <label className="flex items-center gap-2"><Switch checked={showSymbols} onCheckedChange={setShowSymbols} />Vista de símbolos</label>
                <label className="flex items-center gap-2"><Switch checked={realistic} onCheckedChange={setRealistic} />Vista realista</label>
              </div>
              <Button size="sm" variant="destructive" onClick={clearAll}>Limpar tudo</Button>
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="cor">
            <Card><CardContent className="space-y-3 p-3">
              <div className="flex items-center gap-2">
                <Label className="text-xs">Cor</Label>
                <input aria-label="Cor" type="color" value={cor} onChange={(e) => setCor(e.target.value)} className="h-9 w-14 rounded border" />
                <span className="text-xs font-mono">{closestThread(cor, "DMC").codigo} DMC · {closestThread(cor, "Anchor").codigo} Anchor</span>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs"><Blend className="mr-1 inline h-3 w-3" />Mesclar</Label>
                <input type="color" value={cor2 ?? "#ffffff"} onChange={(e) => setCor2(e.target.value)} className="h-9 w-14 rounded border" disabled={!cor2} />
                <Button size="sm" variant={cor2 ? "default" : "outline"} onClick={() => setCor2(cor2 ? null : cor)}>{cor2 ? "Desativar" : "Ativar"}</Button>
                {cor2 && <span className="inline-block h-5 w-5 rounded border" style={{ background: blend(cor, cor2) }} />}
              </div>
              <div>
                <Label className="text-xs">Marca da paleta</Label>
                <Select value={chart.paletteMarca} onValueChange={(v: string) => setChart((ch) => ({ ...ch, paletteMarca: v as Marca }))}>
                  <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DMC">DMC</SelectItem>
                    <SelectItem value="Anchor">Anchor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Máx. de cores ({chart.paletteMax})</Label>
                <Slider value={[chart.paletteMax]} min={2} max={64} onValueChange={(v) => setChart((ch) => ({ ...ch, paletteMax: v[0] }))} />
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => doMirror("h")}><FlipHorizontal2 className="mr-1 h-3 w-3" />Espelhar horizontal</Button>
                <Button size="sm" variant="outline" onClick={() => doMirror("v")}><FlipVertical2 className="mr-1 h-3 w-3" />vertical</Button>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs">Substituir</Label>
                <input type="color" value={replaceFrom} onChange={(e) => setReplaceFrom(e.target.value)} className="h-8 w-10 rounded border" />
                <span className="text-xs">→</span>
                <input type="color" value={cor} onChange={(e) => setCor(e.target.value)} className="h-8 w-10 rounded border" />
                <Button size="sm" onClick={() => doReplace(cor)}>Aplicar</Button>
              </div>
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="imagem">
            <Card><CardContent className="space-y-3 p-3">
              <div>
                <Label className="text-xs">Máx. de cores ({imgMaxColors})</Label>
                <Slider value={[imgMaxColors]} min={2} max={48} onValueChange={(v) => setImgMaxColors(v[0])} />
              </div>
              <input ref={fileInput} type="file" accept="image/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) importImage(f); e.currentTarget.value = ""; }} />
              <Button size="sm" onClick={() => fileInput.current?.click()}>
                <ImageIcon className="mr-1 h-3 w-3" />Carregar fotografia
              </Button>
              <p className="text-xs text-muted-foreground">A foto é ajustada à grelha atual ({chart.cols}×{chart.rows}) e as cores são mapeadas para {chart.paletteMarca}.</p>
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="texto">
            <Card><CardContent className="space-y-2 p-3">
              <div><Label className="text-xs">Texto</Label>
                <Input value={textInput} onChange={(e) => setTextInput(e.target.value)} className="h-8" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label className="text-xs">Fonte</Label>
                  <Select value={textFont} onValueChange={setTextFont}>
                    <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["Courier New", "monospace", "Georgia", "Arial", "Impact", "Verdana", "Times New Roman"].map((f) => (
                        <SelectItem key={f} value={f}>{f}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select></div>
                <div><Label className="text-xs">Tamanho ({textSize}px)</Label>
                  <Slider value={[textSize]} min={6} max={40} onValueChange={(v) => setTextSize(v[0])} /></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label className="text-xs">Linha inicial</Label>
                  <Input type="number" min={0} value={textRow} onChange={(e) => setTextRow(Number(e.target.value))} className="h-8" /></div>
                <div><Label className="text-xs">Coluna inicial</Label>
                  <Input type="number" min={0} value={textCol} onChange={(e) => setTextCol(Number(e.target.value))} className="h-8" /></div>
              </div>
              <Button size="sm" onClick={applyText}><TypeIcon className="mr-1 h-3 w-3" />Converter em ponto cruz</Button>
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="camadas">
            <Card><CardContent className="space-y-2 p-3">
              <label className="flex items-center gap-2 text-xs"><Switch checked={showBackLayer} onCheckedChange={setShowBackLayer} /><Layers className="h-3 w-3" />Mostrar camada de ponto atrás</label>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={removeLastBack}>Desfazer último</Button>
                <Button size="sm" variant="outline" onClick={clearBack}>Limpar ponto atrás</Button>
                <Button size="sm" variant="outline" onClick={clearKnots}>Limpar nós</Button>
              </div>
              <p className="text-xs text-muted-foreground">O ponto atrás é desenhado entre vértices da grelha (arrasta na diagonal ou reta). Os nós franceses ficam nos cruzamentos.</p>
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="io">
            <Card><CardContent className="space-y-2 p-3">
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={exportPng}><Download className="mr-1 h-3 w-3" />PNG</Button>
                <Button size="sm" variant="outline" onClick={exportPdf}><FileDown className="mr-1 h-3 w-3" />PDF + Legenda</Button>
                <Button size="sm" variant="outline" onClick={exportJson}>JSON</Button>
                <Button size="sm" variant="outline" onClick={exportOxs}>OXS (Pattern Keeper)</Button>
              </div>
              <input ref={importInput} type="file" accept=".json,application/json" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) importChart(f); e.currentTarget.value = ""; }} />
              <Button size="sm" onClick={() => importInput.current?.click()}>
                <Upload className="mr-1 h-3 w-3" />Importar gráfico (JSON)
              </Button>
            </CardContent></Card>
          </TabsContent>
        </Tabs>

        {/* Legend / thread estimate */}
        <Card><CardContent className="space-y-2 p-3">
          <div className="font-display text-sm font-semibold">Legenda &amp; estimativa de linhas</div>
          {stats.length === 0 && <p className="text-xs text-muted-foreground">Começa a pintar para ver a legenda.</p>}
          <div className="max-h-64 space-y-1 overflow-auto pr-1">
            {stats.map((s) => (
              <div key={s.hex} className="flex items-center gap-2 text-xs">
                <span className="inline-block h-4 w-4 rounded border" style={{ background: s.hex }} />
                <span className="w-6 text-center font-mono">{s.symbol}</span>
                <span className="font-mono">DMC {s.dmc.codigo}</span>
                <span className="text-muted-foreground">↔ Anchor {s.anchor.codigo}</span>
                <span className="ml-auto">{s.full + s.half} pts · ~{s.meadas} meada(s)</span>
              </div>
            ))}
          </div>
        </CardContent></Card>
      </div>
    </div>
  );
}

function ToolButton({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <Button size="sm" variant={active ? "default" : "outline"} onClick={onClick} title={label}>
      {icon}<span className="ml-1 hidden sm:inline">{label}</span>
    </Button>
  );
}

function triggerDownload(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; document.body.appendChild(a); a.click();
  a.remove(); URL.revokeObjectURL(url);
}