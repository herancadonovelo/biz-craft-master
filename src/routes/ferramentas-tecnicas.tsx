import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
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
import { Plus, Trash2, Eraser } from "lucide-react";

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
function TricotinTab() {
  const ref = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [w, setW] = useMarcaDAgua();
  const [paths, setPaths] = useState<string[]>([]);
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
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <A4Stage innerRef={ref} watermark={w}>
        <svg ref={svgRef} viewBox="0 0 595 842" className="absolute inset-0 h-full w-full"
             onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp}>
          <defs><pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#eee" strokeWidth="0.5" />
          </pattern></defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          {paths.map((d, i) => <path key={i} d={d} stroke="#222" strokeWidth="2" fill="none" strokeLinecap="round" />)}
        </svg>
      </A4Stage>
      <div className="space-y-3">
        <Card><CardContent className="p-3 flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setPaths([])}><Eraser className="mr-1 h-3.5 w-3.5" />Limpar</Button>
          <Button variant="outline" size="sm" onClick={() => setPaths((s) => s.slice(0, -1))}>Desfazer</Button>
        </CardContent></Card>
        <WatermarkControls w={w} set={setW} />
        <ExportPanel targetRef={ref} defaultArea="Tricotin" defaultTitulo="Molde Tricotin" />
      </div>
    </div>
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

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <A4Stage innerRef={ref} watermark={w}>
        {imagemFundo && <img src={imagemFundo} className="absolute inset-0 h-full w-full object-contain opacity-50" />}
        <svg ref={svgRef} viewBox="0 0 595 842" className="absolute inset-0 h-full w-full"
             onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp}>
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
          <Button size="sm" variant="ghost" onClick={() => setPaths([])}><Eraser className="mr-1 h-3 w-3" />Limpar traços</Button>
        </CardContent></Card>
        <WatermarkControls w={w} set={setW} />
        <ExportPanel targetRef={ref} defaultArea="Bordado" defaultTitulo="Padrão Bordado" />
      </div>
    </div>
  );
}