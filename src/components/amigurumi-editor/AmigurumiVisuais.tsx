import { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Trash2, Upload, Palette, Grid3x3, ImageIcon, Link as LinkIcon, Download,
} from "lucide-react";
import { toast } from "sonner";

const uid = () => Math.random().toString(36).slice(2, 10);
const STORAGE_KEY = "amigurumi-visuais-v1";

/* ============================================================
 * Types + persistence
 * ============================================================ */

interface Foto {
  id: string;
  src: string;               // dataURL
  overlay?: string;          // dataURL do desenho manual por cima
  legenda: string;
  carreira: string;          // ex: "C1", "Cabeça C7"
}
interface CelulaSimbolo { r: number; c: number; simbolo: string }
interface Grafico {
  id: string;
  nome: string;
  rows: number;
  cols: number;
  celulas: CelulaSimbolo[];
}
interface PixelArt {
  id: string;
  nome: string;
  src: string;               // original image dataURL
  cols: number;
  rows: number;
  cores: number;
  paleta: string[];          // hex
  grid: number[];            // length = rows*cols, index into paleta
}
interface Video { id: string; titulo: string; url: string }

interface Estado {
  fotos: Foto[];
  graficos: Grafico[];
  pixelArts: PixelArt[];
  videos: Video[];
}

const DEFAULT: Estado = { fotos: [], graficos: [], pixelArts: [], videos: [] };

function loadInitial(): Estado {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT;
}

/* ============================================================
 * Símbolos de crochê (SVG paths, viewBox 24x24)
 * ============================================================ */

const SIMBOLOS: { id: string; nome: string; svg: React.ReactNode }[] = [
  { id: "empty", nome: "vazio",    svg: null },
  { id: "corr",  nome: "corrente", svg: <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.5" /> },
  { id: "pbx",   nome: "pbx",      svg: <line x1="6" y1="12" x2="18" y2="12" stroke="currentColor" strokeWidth="1.5" /> },
  { id: "pb",    nome: "pb",       svg: <g fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="4" x2="12" y2="20" /><line x1="6" y1="12" x2="18" y2="12" /></g> },
  { id: "mpa",   nome: "mpa",      svg: <g fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="3" x2="12" y2="21" /><line x1="6" y1="12" x2="18" y2="12" /><line x1="8" y1="17" x2="16" y2="17" /></g> },
  { id: "pa",    nome: "pa",       svg: <g fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="3" x2="12" y2="21" /><line x1="6" y1="12" x2="18" y2="12" /><line x1="7" y1="8"  x2="17" y2="8" /></g> },
  { id: "aum",   nome: "aum",      svg: <g fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="8"  y1="4" x2="16" y2="20" /><line x1="16" y1="4" x2="8"  y2="20" /><line x1="5" y1="12" x2="19" y2="12" /></g> },
  { id: "dim",   nome: "dim",      svg: <g fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="8" y1="4" x2="12" y2="20" /><line x1="16" y1="4" x2="12" y2="20" /></g> },
  { id: "am",    nome: "am",       svg: <circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" strokeWidth="2" /> },
  { id: "pipoca",nome: "pipoca",   svg: <g fill="currentColor"><circle cx="12" cy="12" r="4" /></g> },
];

/* ============================================================
 * Component
 * ============================================================ */

export function AmigurumiVisuais() {
  const [s, setS] = useState<Estado>(loadInitial);
  useEffect(() => {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
  }, [s]);

  return (
    <Tabs defaultValue="fotos" className="space-y-3">
      <TabsList>
        <TabsTrigger value="fotos"><ImageIcon className="mr-1 h-3.5 w-3.5" />Fotos por carreira</TabsTrigger>
        <TabsTrigger value="grafico"><Grid3x3 className="mr-1 h-3.5 w-3.5" />Gráfico de crochê</TabsTrigger>
        <TabsTrigger value="pixel"><Palette className="mr-1 h-3.5 w-3.5" />Pixel-art / C2C</TabsTrigger>
        <TabsTrigger value="videos"><LinkIcon className="mr-1 h-3.5 w-3.5" />Vídeos & QR</TabsTrigger>
      </TabsList>

      <TabsContent value="fotos">
        <FotosPanel fotos={s.fotos} setFotos={(f) => setS((x) => ({ ...x, fotos: f }))} />
      </TabsContent>
      <TabsContent value="grafico">
        <GraficoPanel graficos={s.graficos} setGraficos={(g) => setS((x) => ({ ...x, graficos: g }))} />
      </TabsContent>
      <TabsContent value="pixel">
        <PixelPanel arts={s.pixelArts} setArts={(a) => setS((x) => ({ ...x, pixelArts: a }))} />
      </TabsContent>
      <TabsContent value="videos">
        <VideosPanel videos={s.videos} setVideos={(v) => setS((x) => ({ ...x, videos: v }))} />
      </TabsContent>
    </Tabs>
  );
}

/* ============================================================
 * 1) FOTOS por carreira + overlay livre
 * ============================================================ */

function FotosPanel({ fotos, setFotos }: { fotos: Foto[]; setFotos: (f: Foto[]) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);

  const onUpload = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file) => {
      const rd = new FileReader();
      rd.onload = () => {
        const src = String(rd.result);
        setFotos([...fotos, { id: uid(), src, legenda: "", carreira: "" }]);
      };
      rd.readAsDataURL(file);
    });
  };

  return (
    <Card className="!bg-white/100 opacity-100">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-display">Fotos por carreira</CardTitle>
          <div>
            <input ref={fileRef} type="file" accept="image/*" multiple hidden
              onChange={(e) => onUpload(e.target.files)} />
            <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
              <Upload className="mr-1 h-3.5 w-3.5" /> Carregar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {fotos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Carrega fotos do progresso e associa-as a uma carreira específica (ex: C7).</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {fotos.map((f) => (
              <FotoCard key={f.id} foto={f}
                onChange={(patch) => setFotos(fotos.map((x) => x.id === f.id ? { ...x, ...patch } : x))}
                onRemove={() => setFotos(fotos.filter((x) => x.id !== f.id))} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function FotoCard({ foto, onChange, onRemove }: {
  foto: Foto;
  onChange: (p: Partial<Foto>) => void;
  onRemove: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [drawColor, setDrawColor] = useState("#ef4444");

  // Sync overlay initial state onto canvas on mount / change
  useEffect(() => {
    const cv = canvasRef.current; if (!cv) return;
    const ctx = cv.getContext("2d"); if (!ctx) return;
    ctx.clearRect(0, 0, cv.width, cv.height);
    if (foto.overlay) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, cv.width, cv.height);
      img.src = foto.overlay;
    }
  }, [foto.overlay, foto.id]);

  const persist = useCallback(() => {
    const cv = canvasRef.current; if (!cv) return;
    onChange({ overlay: cv.toDataURL("image/png") });
  }, [onChange]);

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const cv = canvasRef.current!;
    const r = cv.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * cv.width,
      y: ((e.clientY - r.top) / r.height) * cv.height,
    };
  };

  return (
    <div className="space-y-2 rounded border p-2">
      <div className="relative aspect-square overflow-hidden rounded bg-muted">
        <img src={foto.src} alt={foto.legenda} className="absolute inset-0 h-full w-full object-cover" />
        <canvas
          ref={canvasRef}
          width={400} height={400}
          className="absolute inset-0 h-full w-full touch-none"
          onPointerDown={(e) => {
            drawing.current = true;
            const cv = canvasRef.current!; const ctx = cv.getContext("2d")!;
            const p = pos(e);
            ctx.beginPath(); ctx.moveTo(p.x, p.y);
            ctx.strokeStyle = drawColor; ctx.lineWidth = 4; ctx.lineCap = "round";
          }}
          onPointerMove={(e) => {
            if (!drawing.current) return;
            const cv = canvasRef.current!; const ctx = cv.getContext("2d")!;
            const p = pos(e); ctx.lineTo(p.x, p.y); ctx.stroke();
          }}
          onPointerUp={() => { drawing.current = false; persist(); }}
          onPointerLeave={() => { if (drawing.current) { drawing.current = false; persist(); } }}
        />
      </div>
      <div className="grid grid-cols-[80px_1fr] items-center gap-1">
        <Input placeholder="C7" value={foto.carreira} onChange={(e) => onChange({ carreira: e.target.value })} />
        <Input placeholder="Legenda" value={foto.legenda} onChange={(e) => onChange({ legenda: e.target.value })} />
      </div>
      <div className="flex items-center gap-2">
        <input type="color" value={drawColor} onChange={(e) => setDrawColor(e.target.value)}
          className="h-7 w-9 cursor-pointer rounded border" />
        <Button size="sm" variant="ghost" onClick={() => {
          const cv = canvasRef.current; if (!cv) return;
          cv.getContext("2d")!.clearRect(0, 0, cv.width, cv.height);
          onChange({ overlay: undefined });
        }}>Limpar anotações</Button>
        <Button size="icon" variant="ghost" className="ml-auto" onClick={onRemove}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

/* ============================================================
 * 2) GRÁFICO de crochê drag&drop
 * ============================================================ */

function GraficoPanel({ graficos, setGraficos }: { graficos: Grafico[]; setGraficos: (g: Grafico[]) => void }) {
  const [activeId, setActiveId] = useState<string | null>(graficos[0]?.id ?? null);
  const active = graficos.find((g) => g.id === activeId);

  const criar = () => {
    const g: Grafico = { id: uid(), nome: `Gráfico ${graficos.length + 1}`, rows: 12, cols: 12, celulas: [] };
    setGraficos([...graficos, g]);
    setActiveId(g.id);
  };
  const patch = (p: Partial<Grafico>) =>
    active && setGraficos(graficos.map((g) => g.id === active.id ? { ...g, ...p } : g));

  return (
    <Card className="!bg-white/100 opacity-100">
      <CardHeader className="pb-2 flex-row items-center justify-between gap-2">
        <CardTitle className="text-sm font-display">Construtor de gráfico</CardTitle>
        <div className="flex items-center gap-2">
          <Select value={activeId ?? ""} onValueChange={setActiveId}>
            <SelectTrigger className="h-8 w-40"><SelectValue placeholder="Nenhum" /></SelectTrigger>
            <SelectContent>{graficos.map((g) => <SelectItem key={g.id} value={g.id}>{g.nome}</SelectItem>)}</SelectContent>
          </Select>
          <Button size="sm" variant="outline" onClick={criar}>Novo</Button>
        </div>
      </CardHeader>
      <CardContent>
        {!active ? (
          <p className="text-sm text-muted-foreground">Cria um gráfico para começar a desenhar com símbolos.</p>
        ) : (
          <GraficoEditor
            g={active}
            onPatch={patch}
            onRemove={() => { setGraficos(graficos.filter((x) => x.id !== active.id)); setActiveId(null); }}
          />
        )}
      </CardContent>
    </Card>
  );
}

function GraficoEditor({ g, onPatch, onRemove }: {
  g: Grafico;
  onPatch: (p: Partial<Grafico>) => void;
  onRemove: () => void;
}) {
  const [tool, setTool] = useState<string>("pb");
  const cell = (r: number, c: number) => g.celulas.find((x) => x.r === r && x.c === c);

  const paint = (r: number, c: number) => {
    const existing = g.celulas.filter((x) => !(x.r === r && x.c === c));
    if (tool === "empty") return onPatch({ celulas: existing });
    onPatch({ celulas: [...existing, { r, c, simbolo: tool }] });
  };

  const exportSVG = () => {
    const size = 24;
    const w = g.cols * size, h = g.rows * size;
    const cells: string[] = [];
    for (let r = 0; r < g.rows; r++) {
      for (let c = 0; c < g.cols; c++) {
        cells.push(`<rect x="${c * size}" y="${r * size}" width="${size}" height="${size}" fill="none" stroke="#ddd" />`);
      }
    }
    // We'll stamp symbol IDs; for simplicity, re-render each symbol inline via letter fallback in SVG.
    const sym = g.celulas.map((x) => {
      const cx = x.c * size + size / 2;
      const cy = x.r * size + size / 2 + 4;
      return `<text x="${cx}" y="${cy}" text-anchor="middle" font-family="monospace" font-size="10">${x.simbolo}</text>`;
    }).join("");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">${cells.join("")}${sym}</svg>`;
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${g.nome}.svg`; a.click();
    URL.revokeObjectURL(url);
    toast.success("SVG exportado");
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-2">
        <div>
          <Label>Nome</Label>
          <Input value={g.nome} onChange={(e) => onPatch({ nome: e.target.value })} className="w-40" />
        </div>
        <div>
          <Label>Colunas</Label>
          <Input type="number" min={2} max={40} value={g.cols}
            onChange={(e) => onPatch({ cols: Math.min(40, Math.max(2, +e.target.value)) })} className="w-20" />
        </div>
        <div>
          <Label>Linhas</Label>
          <Input type="number" min={2} max={40} value={g.rows}
            onChange={(e) => onPatch({ rows: Math.min(40, Math.max(2, +e.target.value)) })} className="w-20" />
        </div>
        <Button size="sm" variant="outline" onClick={exportSVG}>
          <Download className="mr-1 h-3.5 w-3.5" /> SVG
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onPatch({ celulas: [] })}>Limpar</Button>
        <Button size="icon" variant="ghost" onClick={onRemove}><Trash2 className="h-3.5 w-3.5" /></Button>
      </div>

      <div className="flex flex-wrap gap-1 rounded border bg-muted/40 p-2">
        {SIMBOLOS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setTool(s.id)}
            className={`flex h-10 w-10 items-center justify-center rounded border text-[10px] ${tool === s.id ? "border-primary bg-primary/10" : "bg-white"}`}
            title={s.nome}
          >
            {s.svg
              ? <svg viewBox="0 0 24 24" className="h-6 w-6">{s.svg}</svg>
              : <span className="text-muted-foreground">·</span>}
          </button>
        ))}
      </div>

      <div className="overflow-auto rounded border bg-white p-2">
        <div
          className="grid gap-px"
          style={{ gridTemplateColumns: `repeat(${g.cols}, 24px)` }}
        >
          {Array.from({ length: g.rows * g.cols }).map((_, i) => {
            const r = Math.floor(i / g.cols); const c = i % g.cols;
            const cur = cell(r, c);
            const sym = SIMBOLOS.find((x) => x.id === cur?.simbolo);
            return (
              <button
                key={i}
                type="button"
                onClick={() => paint(r, c)}
                onPointerEnter={(e) => { if (e.buttons === 1) paint(r, c); }}
                className="flex h-6 w-6 items-center justify-center border border-slate-200 bg-white hover:bg-slate-50"
              >
                {sym?.svg ? <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-700">{sym.svg}</svg> : null}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
 * 3) PIXEL-ART / C2C — quantização
 * ============================================================ */

function PixelPanel({ arts, setArts }: { arts: PixelArt[]; setArts: (a: PixelArt[]) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [cols, setCols] = useState(40);
  const [rows, setRows] = useState(40);
  const [cores, setCores] = useState(8);

  const process = async (file: File) => {
    const src = await new Promise<string>((res) => {
      const r = new FileReader(); r.onload = () => res(String(r.result)); r.readAsDataURL(file);
    });
    const img = await new Promise<HTMLImageElement>((res) => {
      const im = new Image(); im.onload = () => res(im); im.src = src;
    });
    const cv = document.createElement("canvas");
    cv.width = cols; cv.height = rows;
    const ctx = cv.getContext("2d")!;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(img, 0, 0, cols, rows);
    const { data } = ctx.getImageData(0, 0, cols, rows);
    // Simple k-means-ish quantization: pick "cores" most-frequent quantized colors
    // by binning to a coarse 5-bit-per-channel grid, then refine to top-N.
    const bins = new Map<string, { count: number; r: number; g: number; b: number }>();
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const key = `${r >> 3}-${g >> 3}-${b >> 3}`;
      const cur = bins.get(key);
      if (cur) { cur.count++; cur.r += r; cur.g += g; cur.b += b; }
      else bins.set(key, { count: 1, r, g, b });
    }
    const top = Array.from(bins.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, cores)
      .map((c) => ({ r: Math.round(c.r / c.count), g: Math.round(c.g / c.count), b: Math.round(c.b / c.count) }));
    const paleta = top.map((c) => `#${[c.r, c.g, c.b].map((v) => v.toString(16).padStart(2, "0")).join("")}`);
    // Map each pixel to nearest palette color
    const grid: number[] = new Array(cols * rows);
    for (let i = 0, p = 0; i < data.length; i += 4, p++) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      let best = 0, bestD = Infinity;
      for (let k = 0; k < top.length; k++) {
        const dr = r - top[k].r, dg = g - top[k].g, db = b - top[k].b;
        const d = dr * dr + dg * dg + db * db;
        if (d < bestD) { bestD = d; best = k; }
      }
      grid[p] = best;
    }
    const art: PixelArt = { id: uid(), nome: file.name.replace(/\.[^.]+$/, ""), src, cols, rows, cores, paleta, grid };
    setArts([...arts, art]);
    toast.success(`Pixel-art criada com ${paleta.length} cores`);
  };

  return (
    <Card className="!bg-white/100 opacity-100">
      <CardHeader className="pb-2 flex-row items-center justify-between gap-2">
        <CardTitle className="text-sm font-display">Pixel-art / C2C / Tapestry</CardTitle>
        <div className="flex items-end gap-2">
          <div><Label className="text-[10px]">Cols</Label><Input className="h-8 w-16" type="number" value={cols} min={8} max={120} onChange={(e) => setCols(+e.target.value)} /></div>
          <div><Label className="text-[10px]">Rows</Label><Input className="h-8 w-16" type="number" value={rows} min={8} max={120} onChange={(e) => setRows(+e.target.value)} /></div>
          <div><Label className="text-[10px]">Cores</Label><Input className="h-8 w-16" type="number" value={cores} min={2} max={24} onChange={(e) => setCores(+e.target.value)} /></div>
          <input ref={fileRef} type="file" accept="image/*" hidden
            onChange={(e) => { const f = e.target.files?.[0]; if (f) process(f); if (fileRef.current) fileRef.current.value = ""; }} />
          <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
            <Upload className="mr-1 h-3.5 w-3.5" /> Imagem
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {arts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Carrega uma imagem para gerar um gráfico C2C/tapestry com paleta extraída automaticamente.
          </p>
        ) : arts.map((a) => (
          <PixelArtCard key={a.id} art={a}
            onRemove={() => setArts(arts.filter((x) => x.id !== a.id))}
            onRename={(nome) => setArts(arts.map((x) => x.id === a.id ? { ...x, nome } : x))}
          />
        ))}
      </CardContent>
    </Card>
  );
}

function PixelArtCard({ art, onRemove, onRename }: {
  art: PixelArt;
  onRemove: () => void;
  onRename: (n: string) => void;
}) {
  const [px, setPx] = useState(14);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const counts = useMemo(() => {
    const c = new Array(art.paleta.length).fill(0);
    for (const v of art.grid) c[v]++;
    return c;
  }, [art.grid, art.paleta.length]);

  useEffect(() => {
    const cv = canvasRef.current; if (!cv) return;
    cv.width = art.cols * px; cv.height = art.rows * px;
    const ctx = cv.getContext("2d")!;
    for (let r = 0; r < art.rows; r++) {
      for (let c = 0; c < art.cols; c++) {
        ctx.fillStyle = art.paleta[art.grid[r * art.cols + c]];
        ctx.fillRect(c * px, r * px, px, px);
      }
    }
    ctx.strokeStyle = "rgba(0,0,0,0.08)"; ctx.lineWidth = 1;
    for (let x = 0; x <= art.cols; x++) { ctx.beginPath(); ctx.moveTo(x * px, 0); ctx.lineTo(x * px, art.rows * px); ctx.stroke(); }
    for (let y = 0; y <= art.rows; y++) { ctx.beginPath(); ctx.moveTo(0, y * px); ctx.lineTo(art.cols * px, y * px); ctx.stroke(); }
  }, [art, px]);

  const exportPNG = () => {
    const cv = canvasRef.current; if (!cv) return;
    cv.toBlob((b) => {
      if (!b) return;
      const url = URL.createObjectURL(b);
      const a = document.createElement("a"); a.href = url; a.download = `${art.nome}.png`; a.click();
      URL.revokeObjectURL(url);
    });
  };

  return (
    <div className="space-y-2 rounded border p-2">
      <div className="flex flex-wrap items-center gap-2">
        <Input value={art.nome} onChange={(e) => onRename(e.target.value)} className="w-40" />
        <Badge variant="secondary">{art.cols}×{art.rows}</Badge>
        <Badge variant="secondary">{art.paleta.length} cores</Badge>
        <div className="flex items-center gap-2 text-xs">
          Zoom
          <Slider value={[px]} onValueChange={(v) => setPx(v[0])} min={4} max={28} step={1} className="w-28" />
        </div>
        <Button size="sm" variant="outline" onClick={exportPNG}>
          <Download className="mr-1 h-3.5 w-3.5" /> PNG
        </Button>
        <Button size="icon" variant="ghost" className="ml-auto" onClick={onRemove}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="grid gap-3 md:grid-cols-[1fr_180px]">
        <div className="overflow-auto rounded border bg-white">
          <canvas ref={canvasRef} className="block" />
        </div>
        <div>
          <div className="mb-1 text-xs font-medium">Paleta extraída</div>
          <ul className="space-y-1 text-xs">
            {art.paleta.map((hex, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="inline-block h-4 w-4 rounded border" style={{ background: hex }} />
                <span className="font-mono">{hex}</span>
                <span className="ml-auto text-muted-foreground">{counts[i]} pts</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
 * 4) VÍDEOS & QR
 * ============================================================ */

function VideosPanel({ videos, setVideos }: { videos: Video[]; setVideos: (v: Video[]) => void }) {
  return (
    <Card className="!bg-white/100 opacity-100">
      <CardHeader className="pb-2 flex-row items-center justify-between gap-2">
        <CardTitle className="text-sm font-display">Vídeos & QR partilháveis</CardTitle>
        <Button size="sm" variant="outline"
          onClick={() => setVideos([...videos, { id: uid(), titulo: "Vídeo", url: "" }])}>
          Adicionar
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {videos.length === 0 && <p className="text-sm text-muted-foreground">Adiciona URLs de vídeos tutoriais (YouTube, Vimeo, Instagram) — geramos automaticamente um QR para colar na receita.</p>}
        {videos.map((v) => (
          <div key={v.id} className="grid grid-cols-[1fr_2fr_80px_auto] items-center gap-2">
            <Input placeholder="Título" value={v.titulo} onChange={(e) => setVideos(videos.map((x) => x.id === v.id ? { ...x, titulo: e.target.value } : x))} />
            <Input placeholder="https://…" value={v.url} onChange={(e) => setVideos(videos.map((x) => x.id === v.id ? { ...x, url: e.target.value } : x))} />
            {v.url ? (
              <img
                alt={`QR ${v.titulo}`}
                width={64} height={64}
                className="rounded border bg-white"
                src={`https://api.qrserver.com/v1/create-qr-code/?size=128x128&data=${encodeURIComponent(v.url)}`}
              />
            ) : <div className="h-16 w-16 rounded border bg-muted" />}
            <Button size="icon" variant="ghost" onClick={() => setVideos(videos.filter((x) => x.id !== v.id))}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}