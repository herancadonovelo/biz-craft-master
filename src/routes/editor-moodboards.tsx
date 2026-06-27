import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { PremiumRoute } from "@/components/PremiumRoute";
import { useEffect, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { z } from "zod";
import { useStore, type MoodboardDesign, type MoodboardElement, type Moodboard } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Save, Download, Printer, Type, Image as ImageIcon, Sparkles, Layers, ChevronUp, ChevronDown,
  Trash2, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Wand2, Loader2, Plus, Palette as PaletteIcon, Sticker,
} from "lucide-react";
import { toast } from "sonner";
import { FUNDOS_PADRAO, DECOR_PADRAO, FONTES, type FundoItem, type DecorItem } from "@/lib/moodboard-assets";
import {
  sugerirTemaMoodboard, gerarTextosMoodboard, criticarComposicao, sugestaoContextual, removerFundoImagem,
} from "@/lib/moodboard-ai.functions";

// A4 a 72dpi: 595 x 842
const A4_W = 595;
const A4_H = 842;

const searchSchema = z.object({ id: z.string().optional() });

export const Route = createFileRoute("/editor-moodboards")({
  head: () => ({ meta: [{ title: "Editor de Moodboards" }] }),
  validateSearch: (s) => searchSchema.parse(s),
  component: () => (
    <PremiumRoute feature="Editor de Moodboards">
      <EditorPage />
    </PremiumRoute>
  ),
});

const novoDesign = (): MoodboardDesign => ({
  largura: A4_W, altura: A4_H, corFundo: "#ffffff", elementos: [],
});

function uid() { return Math.random().toString(36).slice(2, 9); }

function EditorPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/editor-moodboards" }) as { id?: string };
  const { moodboards, add, update } = useStore();
  const existente = useMemo(() => moodboards.find((m) => m.id === search.id), [moodboards, search.id]);

  const [titulo, setTitulo] = useState(existente?.titulo ?? "Novo Moodboard");
  const [design, setDesign] = useState<MoodboardDesign>(existente?.design ?? novoDesign());
  const [selId, setSelId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(0.7);
  const [fundos, setFundos] = useState<FundoItem[]>(() => loadCustom("mb-fundos", FUNDOS_PADRAO));
  const [decor, setDecor] = useState<DecorItem[]>(() => loadCustom("mb-decor", DECOR_PADRAO));
  const [busy, setBusy] = useState<string | null>(null);
  const [aiPanel, setAiPanel] = useState(true);
  const [aiSugestoes, setAiSugestoes] = useState<string>("");
  const [aiFeedback, setAiFeedback] = useState<string>("");
  const [tema, setTema] = useState("");
  const [texto3, setTexto3] = useState<string[]>([]);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (existente?.design) setDesign(existente.design);
    if (existente?.titulo) setTitulo(existente.titulo);
  }, [existente?.id]);

  const sel = design.elementos.find((e) => e.id === selId) || null;

  const updEl = (id: string, patch: Partial<MoodboardElement>) =>
    setDesign((d) => ({ ...d, elementos: d.elementos.map((e) => (e.id === id ? { ...e, ...patch } : e)) }));

  const addEl = (e: Omit<MoodboardElement, "id" | "zIndex">) => {
    const maxZ = design.elementos.reduce((m, x) => Math.max(m, x.zIndex), 0);
    const novo: MoodboardElement = { ...e, id: uid(), zIndex: maxZ + 1 };
    setDesign((d) => ({ ...d, elementos: [...d.elementos, novo] }));
    setSelId(novo.id);
  };
  const remEl = (id: string) => { setDesign((d) => ({ ...d, elementos: d.elementos.filter((e) => e.id !== id) })); setSelId(null); };
  const trazerFrente = (id: string) => { const maxZ = design.elementos.reduce((m, x) => Math.max(m, x.zIndex), 0); updEl(id, { zIndex: maxZ + 1 }); };
  const enviarTras = (id: string) => { const minZ = design.elementos.reduce((m, x) => Math.min(m, x.zIndex), 0); updEl(id, { zIndex: minZ - 1 }); };

  // === ferramentas de inserção ===
  const inserirTexto = () => addEl({
    tipo: "text", x: A4_W / 2 - 120, y: 80, w: 240, h: 60, rotacao: 0,
    texto: "Escreve aqui...", fonte: "Playfair Display", tamanhoFonte: 32, corTexto: "#1f2937", alinhamento: "center",
  });
  const uploadImagem = async (files: FileList | null, isDecor = false) => {
    if (!files?.length) return;
    for (const f of Array.from(files)) {
      const url = await fileToDataURL(f);
      addEl({ tipo: isDecor ? "decor" : "image", src: url, x: 100, y: 100, w: 200, h: 200, rotacao: 0, raioCantos: 0 });
    }
  };
  const inserirFundoCor = (cor: string) => setDesign((d) => ({ ...d, corFundo: cor, imagemFundo: undefined }));
  const inserirFundoImagem = (url?: string) => setDesign((d) => ({ ...d, imagemFundo: url }));
  const uploadFundoUser = async (files: FileList | null) => {
    if (!files?.length) return;
    for (const f of Array.from(files)) {
      const url = await fileToDataURL(f);
      const novo: FundoItem = { id: uid(), nome: f.name.slice(0, 30), url };
      setFundos((arr) => { const x = [...arr, novo]; saveCustom("mb-fundos", x); return x; });
      inserirFundoImagem(url);
    }
    toast.success("Adicionado à biblioteca de fundos.");
  };
  const uploadDecorUser = async (files: FileList | null) => {
    if (!files?.length) return;
    for (const f of Array.from(files)) {
      const url = await fileToDataURL(f);
      const novo: DecorItem = { id: uid(), nome: f.name.slice(0, 30), src: url };
      setDecor((arr) => { const x = [...arr, novo]; saveCustom("mb-decor", x); return x; });
    }
    toast.success("Adicionado à biblioteca de elementos.");
  };

  // === drag/resize/rotate ===
  const onPointerDownEl = (ev: React.PointerEvent, id: string, mode: "move" | "resize" | "rotate") => {
    ev.stopPropagation();
    (ev.target as Element).setPointerCapture?.(ev.pointerId);
    setSelId(id);
    const el = design.elementos.find((e) => e.id === id);
    if (!el || !stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const startX = ev.clientX, startY = ev.clientY;
    const startEl = { ...el };
    const centerX = rect.left + (startEl.x + startEl.w / 2) * zoom;
    const centerY = rect.top + (startEl.y + startEl.h / 2) * zoom;
    const startAngle = Math.atan2(startY - centerY, startX - centerX);
    const onMove = (e: PointerEvent) => {
      const dx = (e.clientX - startX) / zoom;
      const dy = (e.clientY - startY) / zoom;
      if (mode === "move") updEl(id, { x: startEl.x + dx, y: startEl.y + dy });
      else if (mode === "resize") updEl(id, { w: Math.max(20, startEl.w + dx), h: Math.max(20, startEl.h + dy) });
      else if (mode === "rotate") {
        const ang = Math.atan2(e.clientY - centerY, e.clientX - centerX);
        updEl(id, { rotacao: startEl.rotacao + (ang - startAngle) * (180 / Math.PI) });
      }
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  // === IA ===
  const aplicarTema = async () => {
    if (!tema.trim()) return toast.error("Escreve um tema.");
    setBusy("tema");
    const r = await sugerirTemaMoodboard({ data: { tema } });
    setBusy(null);
    if (!r.ok) return toast.error(r.error);
    const s = r.sugestao || {};
    const fundoNome = String(s.fundoSugerido || "").toLowerCase();
    const f = fundos.find((x) => x.nome.toLowerCase().includes(fundoNome.split(" ")[0] || "kraft")) ?? fundos[0];
    setDesign((d) => ({ ...d, imagemFundo: f?.url, corFundo: s.paleta?.[0] ?? d.corFundo }));
    toast.success(`Tema aplicado · Paleta: ${(s.paleta || []).join(" · ")}`);
    setAiFeedback(`Sugestões para "${tema}":\n• Fundo: ${s.fundoSugerido}\n• Fontes: ${(s.fontes || []).join(", ")}\n• Elementos: ${(s.elementos || []).join(", ")}\n\n${s.descricao || ""}`);
  };
  const pedirFeedback = async () => {
    setBusy("fb");
    const r = await criticarComposicao({ data: { resumo: resumirDesign(design) } });
    setBusy(null);
    if (!r.ok) return toast.error(r.error);
    setAiFeedback(r.feedback);
  };
  const pedirSugestoes = async () => {
    setBusy("sug");
    const r = await sugestaoContextual({ data: { resumo: resumirDesign(design) } });
    setBusy(null);
    if (!r.ok) return toast.error(r.error);
    setAiSugestoes(r.sugestoes);
  };
  const gerarTextoIA = async (topico: string) => {
    setBusy("txt");
    const r = await gerarTextosMoodboard({ data: { topico } });
    setBusy(null);
    if (!r.ok) return toast.error(r.error);
    setTexto3(r.opcoes);
  };
  const removerFundoSel = async () => {
    if (!sel || sel.tipo !== "image" || !sel.src) return;
    setBusy("bg");
    const r = await removerFundoImagem({ data: { imagem: sel.src } });
    setBusy(null);
    if (!r.ok) return toast.error(r.error);
    updEl(sel.id, { src: r.imagem });
    toast.success("Fundo removido");
  };

  // === exportar ===
  const exportarPNG = async (): Promise<string | null> => {
    if (!stageRef.current) return null;
    const node = stageRef.current.querySelector<HTMLDivElement>("[data-stage-export]");
    if (!node) return null;
    try {
      const url = await toPng(node, { pixelRatio: 2, cacheBust: true, backgroundColor: design.corFundo });
      return url;
    } catch (e) {
      console.error(e);
      toast.error("Falha ao exportar. Imagens externas podem bloquear o export por CORS.");
      return null;
    }
  };
  const guardarApp = async () => {
    const preview = (await exportarPNG()) ?? undefined;
    if (existente) {
      update("moodboards", existente.id, { titulo, design, preview } as Partial<Moodboard>);
      toast.success("Moodboard atualizado.");
    } else {
      const novo: Omit<Moodboard, "id"> = {
        titulo, descricao: undefined, tags: [], imagens: [], paleta: [], links: [],
        criadoEm: new Date().toISOString(), design, preview,
      };
      add("moodboards", novo);
      toast.success("Moodboard guardado na galeria.");
      navigate({ to: "/moodboards" });
    }
  };
  const guardarDispositivo = async () => {
    const url = await exportarPNG(); if (!url) return;
    const a = document.createElement("a"); a.href = url; a.download = `${titulo.replace(/\s+/g, "-")}.png`;
    document.body.appendChild(a); a.click(); a.remove();
  };
  const imprimir = async () => {
    const url = await exportarPNG(); if (!url) return;
    const w = window.open("", "_blank"); if (!w) return;
    w.document.write(`<html><head><title>${titulo}</title><style>@page{size:A4;margin:0}html,body{margin:0}img{width:210mm;height:297mm;object-fit:contain;display:block}</style></head><body><img src="${url}" onload="window.print();setTimeout(()=>window.close(),300)"/></body></html>`);
    w.document.close();
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Editor de Moodboards" description="Estúdio interativo · folha A4 vertical." />
      <div className="flex flex-wrap items-center gap-2">
        <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} className="max-w-xs" />
        <div className="ml-auto flex flex-wrap gap-2">
          <Button onClick={guardarApp}><Save className="mr-1 h-4 w-4" /> Guardar na aplicação</Button>
          <Button variant="secondary" onClick={guardarDispositivo}><Download className="mr-1 h-4 w-4" /> Guardar no dispositivo</Button>
          <Button variant="outline" onClick={imprimir}><Printer className="mr-1 h-4 w-4" /> Imprimir A4</Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[260px_1fr_300px]">
        {/* PAINEL ESQUERDO: ferramentas */}
        <Card><CardContent className="p-3">
          <Tabs defaultValue="fundo">
            <TabsList className="grid w-full grid-cols-3 text-xs">
              <TabsTrigger value="fundo"><PaletteIcon className="h-3.5 w-3.5" /></TabsTrigger>
              <TabsTrigger value="texto"><Type className="h-3.5 w-3.5" /></TabsTrigger>
              <TabsTrigger value="decor"><Sticker className="h-3.5 w-3.5" /></TabsTrigger>
            </TabsList>
            <TabsContent value="fundo" className="mt-3 space-y-3">
              <div>
                <Label className="text-xs">Cor de fundo</Label>
                <input type="color" value={design.corFundo} onChange={(e) => inserirFundoCor(e.target.value)} className="mt-1 h-9 w-full rounded border" />
              </div>
              <div>
                <Label className="text-xs">Upload imagem de fundo</Label>
                <Input type="file" accept="image/*" onChange={(e) => uploadFundoUser(e.target.files)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Biblioteca ({fundos.length})</Label>
                <div className="mt-1 grid max-h-60 grid-cols-3 gap-1 overflow-auto">
                  {fundos.map((f) => (
                    <button key={f.id} title={f.nome} onClick={() => inserirFundoImagem(f.url)} className="aspect-square overflow-hidden rounded border hover:ring-2 hover:ring-primary">
                      <img src={f.url} className="h-full w-full object-cover" loading="lazy" />
                    </button>
                  ))}
                </div>
                {design.imagemFundo && (
                  <Button size="sm" variant="ghost" className="mt-2 w-full" onClick={() => inserirFundoImagem(undefined)}>Remover imagem de fundo</Button>
                )}
              </div>
            </TabsContent>
            <TabsContent value="texto" className="mt-3 space-y-3">
              <Button onClick={inserirTexto} className="w-full"><Type className="mr-1 h-4 w-4" /> Inserir texto</Button>
              <div>
                <Label className="text-xs">Upload imagem</Label>
                <Input type="file" accept="image/*" multiple onChange={(e) => uploadImagem(e.target.files, false)} className="mt-1" />
              </div>
              <Dialog>
                <DialogTrigger asChild><Button variant="outline" className="w-full"><Wand2 className="mr-1 h-4 w-4" /> Gerar texto IA</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Gerar opções de texto</DialogTitle></DialogHeader>
                  <TextoIA gerar={gerarTextoIA} opcoes={texto3} busy={busy === "txt"} onPick={(t) => addEl({
                    tipo: "text", x: A4_W / 2 - 150, y: 100, w: 300, h: 70, rotacao: 0, texto: t,
                    fonte: "Playfair Display", tamanhoFonte: 32, corTexto: "#1f2937", alinhamento: "center",
                  })} />
                </DialogContent>
              </Dialog>
            </TabsContent>
            <TabsContent value="decor" className="mt-3 space-y-3">
              <Input type="file" accept="image/png" multiple onChange={(e) => uploadDecorUser(e.target.files)} placeholder="Adicionar PNG transparente" />
              <div className="grid max-h-[420px] grid-cols-3 gap-1 overflow-auto">
                {decor.map((d) => (
                  <button key={d.id} title={d.nome} onClick={() => addEl({
                    tipo: "decor", src: d.src, x: 150, y: 200, w: 160, h: 160, rotacao: 0,
                  })} className="aspect-square rounded border bg-white p-1 hover:ring-2 hover:ring-primary">
                    <img src={d.src} className="h-full w-full object-contain" loading="lazy" />
                  </button>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent></Card>

        {/* CENTRO: stage A4 */}
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Label className="text-xs">Zoom</Label>
            <Slider value={[zoom * 100]} min={25} max={150} step={5} onValueChange={([v]) => setZoom(v / 100)} className="max-w-xs" />
            <span className="text-xs text-muted-foreground">{Math.round(zoom * 100)}%</span>
          </div>
          <div ref={stageRef} className="flex items-start justify-center overflow-auto rounded-lg border bg-muted/30 p-6" onClick={() => setSelId(null)}>
            <div
              data-stage-export
              style={{
                width: A4_W * zoom, height: A4_H * zoom,
                background: design.imagemFundo ? `url(${design.imagemFundo}) center/cover no-repeat` : design.corFundo,
                position: "relative", overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,.08)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ width: A4_W, height: A4_H, transform: `scale(${zoom})`, transformOrigin: "top left", position: "relative" }}>
                {[...design.elementos].sort((a, b) => a.zIndex - b.zIndex).map((el) => (
                  <ElementoView key={el.id} el={el} selecionado={el.id === selId} onPointerDown={onPointerDownEl} onChange={(p) => updEl(el.id, p)} />
                ))}
              </div>
            </div>
          </div>

          {sel && (
            <Card className="mt-3"><CardContent className="p-3">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-medium">{sel.tipo === "text" ? "Texto" : sel.tipo === "decor" ? "Decoração" : "Imagem"}</span>
                <Button size="sm" variant="outline" onClick={() => trazerFrente(sel.id)}><ChevronUp className="h-3.5 w-3.5" /> Frente</Button>
                <Button size="sm" variant="outline" onClick={() => enviarTras(sel.id)}><ChevronDown className="h-3.5 w-3.5" /> Trás</Button>
                <Button size="sm" variant="destructive" onClick={() => remEl(sel.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                {(sel.tipo === "image" || sel.tipo === "decor") && (
                  <div className="flex items-center gap-2">
                    <Label className="text-xs">Cantos</Label>
                    <Slider value={[sel.raioCantos ?? 0]} min={0} max={120} step={2} onValueChange={([v]) => updEl(sel.id, { raioCantos: v })} className="w-32" />
                  </div>
                )}
                {sel.tipo === "image" && (
                  <Button size="sm" variant="outline" onClick={removerFundoSel} disabled={busy === "bg"}>
                    {busy === "bg" ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Wand2 className="mr-1 h-3.5 w-3.5" />} Remover fundo (IA)
                  </Button>
                )}
              </div>
              {sel.tipo === "text" && (
                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  <Input value={sel.texto ?? ""} onChange={(e) => updEl(sel.id, { texto: e.target.value })} placeholder="Texto" />
                  <Select value={sel.fonte ?? "Inter"} onValueChange={(v) => { ensureFont(v); updEl(sel.id, { fonte: v }); }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{FONTES.map((f) => <SelectItem key={f} value={f} style={{ fontFamily: f }}>{f}</SelectItem>)}</SelectContent>
                  </Select>
                  <div className="flex items-center gap-1">
                    <Label className="text-xs">Tamanho</Label>
                    <Slider value={[sel.tamanhoFonte ?? 24]} min={8} max={120} step={1} onValueChange={([v]) => updEl(sel.id, { tamanhoFonte: v })} className="w-24" />
                    <input type="color" value={sel.corTexto ?? "#000"} onChange={(e) => updEl(sel.id, { corTexto: e.target.value })} className="h-7 w-9 rounded border" />
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Button size="sm" variant={sel.negrito ? "default" : "outline"} onClick={() => updEl(sel.id, { negrito: !sel.negrito })}><Bold className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant={sel.italico ? "default" : "outline"} onClick={() => updEl(sel.id, { italico: !sel.italico })}><Italic className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant={sel.sublinhado ? "default" : "outline"} onClick={() => updEl(sel.id, { sublinhado: !sel.sublinhado })}><Underline className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant={sel.alinhamento === "left" ? "default" : "outline"} onClick={() => updEl(sel.id, { alinhamento: "left" })}><AlignLeft className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant={sel.alinhamento === "center" ? "default" : "outline"} onClick={() => updEl(sel.id, { alinhamento: "center" })}><AlignCenter className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant={sel.alinhamento === "right" ? "default" : "outline"} onClick={() => updEl(sel.id, { alinhamento: "right" })}><AlignRight className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              )}
            </CardContent></Card>
          )}
        </div>

        {/* PAINEL DIREITO: IA */}
        <Card><CardContent className="p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 font-display text-sm font-medium"><Sparkles className="h-4 w-4 text-rose-500" /> Assistente IA de Design</div>
            <Button size="sm" variant="ghost" onClick={() => setAiPanel((v) => !v)}>{aiPanel ? "−" : "+"}</Button>
          </div>
          {aiPanel && (
            <>
              <div className="space-y-1">
                <Label className="text-xs">Tema / paleta para começar</Label>
                <Input value={tema} onChange={(e) => setTema(e.target.value)} placeholder="ex.: Coleção de outono aconchegante" />
                <Button size="sm" onClick={aplicarTema} disabled={busy === "tema"} className="w-full">
                  {busy === "tema" ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Wand2 className="mr-1 h-3.5 w-3.5" />} Aplicar tema
                </Button>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1" onClick={pedirSugestoes} disabled={busy === "sug"}>
                  {busy === "sug" ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : null} Sugestões
                </Button>
                <Button size="sm" variant="outline" className="flex-1" onClick={pedirFeedback} disabled={busy === "fb"}>
                  {busy === "fb" ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : null} Feedback
                </Button>
              </div>
              {aiSugestoes && (
                <div className="rounded border bg-muted/40 p-2 text-xs whitespace-pre-wrap">{aiSugestoes}</div>
              )}
              {aiFeedback && (
                <div className="rounded border bg-muted/40 p-2 text-xs whitespace-pre-wrap">{aiFeedback}</div>
              )}
              <div className="rounded border border-dashed p-2 text-[11px] text-muted-foreground">
                <Layers className="mb-1 h-3.5 w-3.5" />
                {design.elementos.length} elemento(s) na tela · {design.imagemFundo ? "fundo imagem" : `fundo cor ${design.corFundo}`}
              </div>
            </>
          )}
        </CardContent></Card>
      </div>
    </div>
  );
}

// === Sub-componentes & utilitários ===

function ElementoView({
  el, selecionado, onPointerDown, onChange,
}: {
  el: MoodboardElement;
  selecionado: boolean;
  onPointerDown: (ev: React.PointerEvent, id: string, mode: "move" | "resize" | "rotate") => void;
  onChange: (p: Partial<MoodboardElement>) => void;
}) {
  useEffect(() => { if (el.tipo === "text" && el.fonte) ensureFont(el.fonte); }, [el.fonte]);
  const base: React.CSSProperties = {
    position: "absolute", left: el.x, top: el.y, width: el.w, height: el.h,
    transform: `rotate(${el.rotacao}deg)`, transformOrigin: "center center",
    outline: selecionado ? "2px dashed #ec4899" : "none",
    cursor: "move", userSelect: "none",
  };
  const content = el.tipo === "text" ? (
    <textarea
      value={el.texto ?? ""}
      onChange={(e) => onChange({ texto: e.target.value })}
      onPointerDown={(e) => e.stopPropagation()}
      style={{
        width: "100%", height: "100%", border: 0, outline: 0, resize: "none", background: "transparent",
        fontFamily: `'${el.fonte || "Inter"}', sans-serif`,
        fontSize: el.tamanhoFonte ?? 24, color: el.corTexto ?? "#111",
        fontWeight: el.negrito ? 700 : 400, fontStyle: el.italico ? "italic" : "normal",
        textDecoration: el.sublinhado ? "underline" : "none",
        textAlign: el.alinhamento ?? "left", padding: 4,
      }}
    />
  ) : el.src ? (
    <img src={el.src} alt="" draggable={false}
      style={{ width: "100%", height: "100%", objectFit: el.tipo === "decor" ? "contain" : "cover", borderRadius: el.raioCantos ?? 0, pointerEvents: "none" }} />
  ) : null;
  return (
    <div style={base} onPointerDown={(e) => onPointerDown(e, el.id, "move")}>
      {content}
      {selecionado && (
        <>
          <div onPointerDown={(e) => onPointerDown(e, el.id, "resize")}
            style={{ position: "absolute", right: -8, bottom: -8, width: 16, height: 16, background: "#ec4899", borderRadius: 4, cursor: "nwse-resize" }} />
          <div onPointerDown={(e) => onPointerDown(e, el.id, "rotate")}
            style={{ position: "absolute", left: "50%", top: -28, width: 14, height: 14, marginLeft: -7, background: "#fff", border: "2px solid #ec4899", borderRadius: "50%", cursor: "grab" }} />
        </>
      )}
    </div>
  );
}

function TextoIA({ gerar, opcoes, busy, onPick }: { gerar: (t: string) => void; opcoes: string[]; busy: boolean; onPick: (t: string) => void }) {
  const [topico, setTopico] = useState("");
  return (
    <div className="space-y-2">
      <Input placeholder="ex.: Título para post de cachecol de lã" value={topico} onChange={(e) => setTopico(e.target.value)} />
      <Button onClick={() => gerar(topico)} disabled={busy || !topico} className="w-full">
        {busy ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1 h-4 w-4" />} Gerar 3 opções
      </Button>
      <div className="space-y-1">
        {opcoes.map((o, i) => (
          <button key={i} onClick={() => onPick(o)} className="w-full rounded border p-2 text-left text-sm hover:bg-muted">{o}</button>
        ))}
      </div>
    </div>
  );
}

function fileToDataURL(f: File): Promise<string> {
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = rej; r.readAsDataURL(f); });
}

function loadCustom<T>(key: string, fallback: T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const extra = JSON.parse(raw) as T[];
    return [...fallback, ...extra];
  } catch { return fallback; }
}
function saveCustom<T>(key: string, allWithBase: T[]) {
  // guarda só os custom (a partir do padrão é fixo); usamos comprimento do padrão:
  const baseLen = key === "mb-fundos" ? FUNDOS_PADRAO.length : DECOR_PADRAO.length;
  const custom = allWithBase.slice(baseLen);
  localStorage.setItem(key, JSON.stringify(custom));
}

const loadedFonts = new Set<string>();
function ensureFont(name: string) {
  if (typeof document === "undefined" || loadedFonts.has(name)) return;
  loadedFonts.add(name);
  const family = name.replace(/\s+/g, "+");
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${family}:wght@400;700&display=swap`;
  document.head.appendChild(link);
}

function resumirDesign(d: MoodboardDesign): string {
  const tipos = d.elementos.reduce<Record<string, number>>((acc, e) => { acc[e.tipo] = (acc[e.tipo] || 0) + 1; return acc; }, {});
  const textos = d.elementos.filter((e) => e.tipo === "text").map((e) => `"${e.texto ?? ""}" (${e.fonte}, ${e.tamanhoFonte}px, ${e.corTexto})`);
  return [
    `Fundo: ${d.imagemFundo ? "imagem" : `cor ${d.corFundo}`}`,
    `Elementos: ${Object.entries(tipos).map(([k, v]) => `${k}=${v}`).join(", ") || "nenhum"}`,
    textos.length ? `Textos: ${textos.join(" · ")}` : "",
  ].filter(Boolean).join("\n");
}