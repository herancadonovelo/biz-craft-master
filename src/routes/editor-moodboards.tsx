import { createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { PremiumRoute } from "@/components/PremiumRoute";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  ZoomIn, ZoomOut, Maximize, Grid3X3, Magnet, Play, Copy, LayoutGrid, Droplets,
  Lock, Unlock, Eye, EyeOff, AlignHorizontalJustifyCenter, AlignVerticalJustifyCenter,
} from "lucide-react";
import { toast } from "sonner";
import { FUNDOS_PADRAO, DECOR_PADRAO, FONTES, type FundoItem, type DecorItem } from "@/lib/moodboard-assets";
import { buildTargets, snapRect, clampZoom, normalizeWheel } from "@/lib/moodboard-snap";
import { alinharNaPagina, distribuir, type AlinhamentoPagina } from "@/lib/moodboard-align";
import {
  MOODBOARD_LAYOUTS, aplicarLayout, retanguloMarcaAgua, sugerirLayouts,
  type MoodboardLayout, type PosicaoMarcaAgua,
} from "@/lib/moodboard-layouts";
import {
  sugerirTemaMoodboard, gerarTextosMoodboard, criticarComposicao, sugestaoContextual, removerFundoImagem,
} from "@/lib/moodboard-ai.functions";

// A4 a 72dpi: 595 x 842
const A4_W = 595;
const A4_H = 842;

const searchSchema = z.object({ id: z.string().optional() });

export const Route = createFileRoute("/editor-moodboards")({
  head: () => ({ meta: [{ title: "Editor De Moodboards" }] }),
  validateSearch: (s) => searchSchema.parse(s),
  component: () => (
    <PremiumRoute feature="Editor de Moodboards">
      <EditorPage />
    </PremiumRoute>
  ),
});

export function EditorMoodboardsPage() { return <EditorPage />; }

const novoDesign = (): MoodboardDesign => ({
  largura: A4_W, altura: A4_H, corFundo: "#ffffff", elementos: [],
});

function uid() { return Math.random().toString(36).slice(2, 9); }

function EditorPage() {
  const navigate = useNavigate();
  // Read search non-strictly so this component works both as the route
  // component AND when embedded inside /ferramentas-tecnicas (where the
  // active route is different and useSearch({ from }) would throw
  // "Could not find an active match from /editor-moodboards").
  const search = useRouterState({
    select: (s) => (s.location.search ?? {}) as { id?: string },
  });
  const { moodboards, add, update } = useStore();
  const existente = useMemo(() => moodboards.find((m) => m.id === search.id), [moodboards, search.id]);

  const [titulo, setTitulo] = useState(existente?.titulo ?? "Novo Moodboard");
  const [design, setDesign] = useState<MoodboardDesign>(existente?.design ?? novoDesign());
  const [selId, setSelId] = useState<string | null>(null);
  // Canvas infinito: z = escala, x/y = deslocamento do viewport (px de ecrã).
  const [view, setView] = useState({ z: 0.7, x: 0, y: 0 });
  const zoom = view.z;
  const viewRef = useRef(view);
  viewRef.current = view;
  const [grelha, setGrelha] = useState(true);
  const [magnetico, setMagnetico] = useState(true);
  const [guias, setGuias] = useState<{ v: number[]; h: number[] }>({ v: [], h: [] });
  const [apresentacao, setApresentacao] = useState(false);
  const artRef = useRef<HTMLDivElement>(null);
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

  const duplicarEl = (id: string) => {
    const el = design.elementos.find((e) => e.id === id);
    if (!el) return;
    const maxZ = design.elementos.reduce((m, x) => Math.max(m, x.zIndex), 0);
    const novo: MoodboardElement = { ...el, id: uid(), x: el.x + 16, y: el.y + 16, zIndex: maxZ + 1 };
    setDesign((d) => ({ ...d, elementos: [...d.elementos, novo] }));
    setSelId(novo.id);
  };

  // === alinhamento, distribuição e camadas ===
  const alinharSel = (modo: AlinhamentoPagina) => {
    if (!sel) return;
    updEl(sel.id, alinharNaPagina({ id: sel.id, x: sel.x, y: sel.y, w: sel.w, h: sel.h }, modo, { w: A4_W, h: A4_H }));
  };
  const distribuirTudo = (eixo: "h" | "v") => {
    const visiveis = design.elementos.filter((e) => !e.oculto && !e.bloqueado);
    const ajustes = distribuir(visiveis.map((e) => ({ id: e.id, x: e.x, y: e.y, w: e.w, h: e.h })), eixo);
    if (!ajustes.length) { toast.info("São precisos pelo menos 3 elementos livres para distribuir."); return; }
    setDesign((d) => ({
      ...d,
      elementos: d.elementos.map((e) => {
        const a = ajustes.find((x) => x.id === e.id);
        return a ? { ...e, ...(a.x !== undefined ? { x: a.x } : {}), ...(a.y !== undefined ? { y: a.y } : {}) } : e;
      }),
    }));
  };
  const alternarBloqueio = (id: string) => {
    const el = design.elementos.find((e) => e.id === id);
    if (el) updEl(id, { bloqueado: !el.bloqueado });
  };
  const alternarVisibilidade = (id: string) => {
    const el = design.elementos.find((e) => e.id === id);
    if (el) updEl(id, { oculto: !el.oculto });
  };
  const rotuloElemento = (el: MoodboardElement) =>
    el.tipo === "text" ? (el.texto?.trim().slice(0, 24) || "Texto")
      : el.marcaAgua ? "Marca de água"
      : el.tipo === "decor" ? "Decoração"
      : el.src ? "Imagem" : "Moldura vazia";

  /** Ordem visual do painel de camadas: topo da pilha primeiro. */
  const camadasOrdenadas = useMemo(
    () => [...design.elementos].sort((a, b) => b.zIndex - a.zIndex),
    [design.elementos],
  );

  /** Foca a linha da camada indicada (roving tabindex do listbox). */
  const focarCamada = (id: string) => {
    setSelId(id);
    requestAnimationFrame(() => {
      document.querySelector<HTMLElement>(`[data-camada-id="${id}"]`)?.focus();
    });
  };

  /**
   * Navegação completa por teclado do painel de Camadas, para uso sem rato:
   * setas = mover seleção, Ctrl/Alt+setas = reordenar, B = bloquear,
   * O = ocultar, Delete = apagar, Home/End = extremos.
   */
  const onKeyCamada = (e: React.KeyboardEvent, id: string, indice: number) => {
    const irPara = (i: number) => {
      const alvo = camadasOrdenadas[Math.max(0, Math.min(camadasOrdenadas.length - 1, i))];
      if (alvo) focarCamada(alvo.id);
    };
    const k = e.key;
    const reordenar = e.ctrlKey || e.metaKey || e.altKey;
    let tratado = true;
    if (k === "ArrowDown") reordenar ? enviarTras(id) : irPara(indice + 1);
    else if (k === "ArrowUp") reordenar ? trazerFrente(id) : irPara(indice - 1);
    else if (k === "Home") irPara(0);
    else if (k === "End") irPara(camadasOrdenadas.length - 1);
    else if (k === "Enter" || k === " ") setSelId(id);
    else if (k === "b" || k === "B") alternarBloqueio(id);
    else if (k === "o" || k === "O") alternarVisibilidade(id);
    else if (k === "Delete" || k === "Backspace") remEl(id);
    else tratado = false;
    if (tratado) { e.preventDefault(); e.stopPropagation(); }
  };

  // === canvas infinito: zoom, pan, ajustar ===
  const setZoom = (z: number) => zoomEmTorno(clampZoom(z));

  /** Aplica um zoom mantendo fixo um ponto do viewport (por defeito, o centro). */
  function zoomEmTorno(nz: number, px?: number, py?: number) {
    const vp = stageRef.current?.getBoundingClientRect();
    const cx = px ?? (vp ? vp.width / 2 : 0);
    const cy = py ?? (vp ? vp.height / 2 : 0);
    setView((v) => {
      const z = clampZoom(nz);
      const k = z / v.z;
      return { z, x: cx - (cx - v.x) * k, y: cy - (cy - v.y) * k };
    });
  }

  /** Enquadra a folha A4 no viewport. */
  const ajustar = useCallback(() => {
    const vp = stageRef.current?.getBoundingClientRect();
    if (!vp || !vp.width) return;
    const pad = 48;
    const z = clampZoom(Math.min((vp.width - pad) / A4_W, (vp.height - pad) / A4_H));
    setView({ z, x: (vp.width - A4_W * z) / 2, y: (vp.height - A4_H * z) / 2 });
  }, []);

  useEffect(() => { const t = setTimeout(ajustar, 60); return () => clearTimeout(t); }, [ajustar]);

  // Roda do rato / trackpad: zoom ancorado no cursor; com shift/sem ctrl faz pan.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const dy = normalizeWheel(e.deltaY, e.deltaMode);
      if (e.ctrlKey || e.metaKey || !e.shiftKey) {
        const v = viewRef.current;
        zoomEmTorno(v.z * Math.exp(-dy * 0.0018), px, py);
      } else {
        const dx = normalizeWheel(e.deltaX, e.deltaMode);
        setView((v) => ({ ...v, x: v.x - dx, y: v.y - dy }));
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // Atalhos de teclado do canvas.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable)) return;
      if (e.key === "Escape") { setApresentacao(false); setSelId(null); return; }
      if (e.key === "0") { e.preventDefault(); ajustar(); return; }
      if (e.key === "1") { e.preventDefault(); setZoom(1); return; }
      if (e.key === "+" || e.key === "=") { e.preventDefault(); zoomEmTorno(viewRef.current.z * 1.25); return; }
      if (e.key === "-") { e.preventDefault(); zoomEmTorno(viewRef.current.z / 1.25); return; }
      if (!selId) return;
      if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); remEl(selId); return; }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d") { e.preventDefault(); duplicarEl(selId); return; }
      const passo = e.shiftKey ? 10 : 1;
      const atual = design.elementos.find((x) => x.id === selId);
      if (!atual) return;
      if (e.key === "ArrowLeft") { e.preventDefault(); updEl(selId, { x: atual.x - passo }); }
      else if (e.key === "ArrowRight") { e.preventDefault(); updEl(selId, { x: atual.x + passo }); }
      else if (e.key === "ArrowUp") { e.preventDefault(); updEl(selId, { y: atual.y - passo }); }
      else if (e.key === "ArrowDown") { e.preventDefault(); updEl(selId, { y: atual.y + passo }); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selId, design.elementos, ajustar]);

  /** Pan ao arrastar o fundo do canvas (ou com botão do meio). */
  const iniciarPan = (ev: React.PointerEvent) => {
    if (ev.button !== 0 && ev.button !== 1) return;
    const startX = ev.clientX, startY = ev.clientY;
    const origem = { x: viewRef.current.x, y: viewRef.current.y };
    const onMove = (e: PointerEvent) => {
      setView((v) => ({ ...v, x: origem.x + (e.clientX - startX), y: origem.y + (e.clientY - startY) }));
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  // === ferramentas de inserção ===
  const inserirTexto = () => addEl({
    tipo: "text", x: A4_W / 2 - 120, y: 80, w: 240, h: 60, rotacao: 0,
    texto: "Escreve aqui...", fonte: "Playfair Display", tamanhoFonte: 32, corTexto: "#1f2937", alinhamento: "center",
  });
  const uploadImagem = async (files: FileList | null, isDecor = false) => {
    if (!files?.length) return;
    for (const f of Array.from(files)) {
      const url = await fileToDataURL(f);
      if (isDecor) {
        addEl({ tipo: "decor", src: url, x: 100, y: 100, w: 200, h: 200, rotacao: 0, raioCantos: 0 });
        continue;
      }
      // Preenche primeiro as molduras vazias criadas por um modelo de esteira.
      let preenchida = false;
      setDesign((d) => {
        const alvo = d.elementos.find((e) => e.tipo === "image" && !e.src);
        if (!alvo) return d;
        preenchida = true;
        return { ...d, elementos: d.elementos.map((e) => (e.id === alvo.id ? { ...e, src: url } : e)) };
      });
      if (!preenchida) {
        addEl({ tipo: "image", src: url, x: 100, y: 100, w: 200, h: 200, rotacao: 0, raioCantos: 0 });
      }
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

  // === modelos de esteira (30 grelhas) ===
  const [nImagensAlvo, setNImagensAlvo] = useState(6);
  const modelosSugeridos = useMemo(() => sugerirLayouts(nImagensAlvo), [nImagensAlvo]);

  /**
   * Reorganiza as imagens existentes pelo modelo escolhido. Se ainda não
   * houver imagens suficientes, cria molduras vazias para o utilizador
   * preencher com upload.
   */
  const aplicarModelo = (layout: MoodboardLayout) => {
    setDesign((d) => {
      const imagens = d.elementos.filter((e) => e.tipo === "image").sort((a, b) => a.zIndex - b.zIndex);
      const outros = d.elementos.filter((e) => e.tipo !== "image");
      const n = Math.max(imagens.length, layout.capacidade);
      const rects = aplicarLayout(layout, n, d.largura, d.altura);
      const novas: MoodboardElement[] = rects.map((r, i) => {
        const base = imagens[i];
        return base
          ? { ...base, ...r, rotacao: 0 }
          : {
              id: uid(), tipo: "image" as const, ...r, rotacao: 0, raioCantos: 0,
              zIndex: i + 1, src: undefined,
            };
      });
      // Imagens a mais do que o modelo comporta ficam onde estão.
      const sobras = imagens.slice(rects.length);
      return { ...d, elementos: [...novas, ...sobras, ...outros] };
    });
    setSelId(null);
    toast.success(`Modelo aplicado: ${layout.nome}`);
  };

  // === marca de água ===
  const [marcaTexto, setMarcaTexto] = useState("© Craft Business Master");
  const [marcaPos, setMarcaPos] = useState<PosicaoMarcaAgua>("inferior-direita");
  const [marcaOpacidade, setMarcaOpacidade] = useState(45);
  const inserirMarcaAgua = (src?: string) => {
    const r = retanguloMarcaAgua(marcaPos, design.largura, design.altura);
    const maxZ = design.elementos.reduce((m, x) => Math.max(m, x.zIndex), 0);
    const el: MoodboardElement = src
      ? { id: uid(), tipo: "decor", src, ...r, rotacao: 0, zIndex: maxZ + 1, opacidade: marcaOpacidade / 100, marcaAgua: true }
      : {
          id: uid(), tipo: "text", ...r, rotacao: 0, zIndex: maxZ + 1,
          texto: marcaTexto, fonte: "Montserrat", tamanhoFonte: 18, corTexto: "#111827",
          alinhamento: "center", opacidade: marcaOpacidade / 100, marcaAgua: true,
        };
    setDesign((d) => ({ ...d, elementos: [...d.elementos, el] }));
    setSelId(el.id);
    toast.success("Marca de água inserida.");
  };
  const uploadMarcaAgua = async (files: FileList | null) => {
    const f = files?.[0];
    if (!f) return;
    inserirMarcaAgua(await fileToDataURL(f));
  };

  // === drag/resize/rotate ===
  const onPointerDownEl = (ev: React.PointerEvent, id: string, mode: "move" | "resize" | "rotate") => {
    ev.stopPropagation();
    (ev.target as Element).setPointerCapture?.(ev.pointerId);
    setSelId(id);
    const el = design.elementos.find((e) => e.id === id);
    if (!el || !artRef.current) return;
    if (el.bloqueado) return; // camada bloqueada: seleciona, mas não move
    const rect = artRef.current.getBoundingClientRect();
    const startX = ev.clientX, startY = ev.clientY;
    const startEl = { ...el };
    const outros = design.elementos.filter((e) => e.id !== id).map((e) => ({ x: e.x, y: e.y, w: e.w, h: e.h }));
    const alvos = buildTargets(outros, A4_W, A4_H);
    const centerX = rect.left + (startEl.x + startEl.w / 2) * zoom;
    const centerY = rect.top + (startEl.y + startEl.h / 2) * zoom;
    const startAngle = Math.atan2(startY - centerY, startX - centerX);
    const onMove = (e: PointerEvent) => {
      const dx = (e.clientX - startX) / zoom;
      const dy = (e.clientY - startY) / zoom;
      if (mode === "move") {
        let nx = startEl.x + dx, ny = startEl.y + dy;
        if (magnetico && !e.altKey) {
          const s = snapRect({ x: nx, y: ny, w: startEl.w, h: startEl.h }, alvos, 6 / zoom, grelha ? 8 : 0);
          nx = s.x; ny = s.y;
          setGuias({ v: s.guiasV, h: s.guiasH });
        } else setGuias({ v: [], h: [] });
        updEl(id, { x: nx, y: ny });
      }
      else if (mode === "resize") updEl(id, { w: Math.max(20, startEl.w + dx), h: Math.max(20, startEl.h + dy) });
      else if (mode === "rotate") {
        const ang = Math.atan2(e.clientY - centerY, e.clientX - centerX);
        updEl(id, { rotacao: startEl.rotacao + (ang - startAngle) * (180 / Math.PI) });
      }
    };
    const onUp = () => {
      setGuias({ v: [], h: [] });
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
    const esc = (s: string) => s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
    w.document.write(`<html><head><title>${esc(titulo)}</title><style>@page{size:A4;margin:0}html,body{margin:0}img{width:210mm;height:297mm;object-fit:contain;display:block}</style></head><body><img src="${esc(url)}" onload="window.print();setTimeout(()=>window.close(),300)"/></body></html>`);
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
            <TabsList className="grid w-full grid-cols-4 text-xs">
              <TabsTrigger value="fundo" aria-label="Fundo"><PaletteIcon className="h-3.5 w-3.5" /></TabsTrigger>
              <TabsTrigger value="texto" aria-label="Texto"><Type className="h-3.5 w-3.5" /></TabsTrigger>
              <TabsTrigger value="decor" aria-label="Decoração"><Sticker className="h-3.5 w-3.5" /></TabsTrigger>
              <TabsTrigger value="modelos" aria-label="Modelos de esteira" data-testid="tab-modelos"><LayoutGrid className="h-3.5 w-3.5" /></TabsTrigger>
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
            <TabsContent value="modelos" className="mt-3 space-y-3">
              <div>
                <Label className="text-xs">Quantas imagens queres colocar?</Label>
                <div className="mt-1 flex items-center gap-2">
                  <Slider
                    value={[nImagensAlvo]} min={1} max={20} step={1}
                    onValueChange={([v]) => setNImagensAlvo(v)} className="flex-1"
                  />
                  <span data-testid="modelos-n" className="w-8 text-center text-xs tabular-nums">{nImagensAlvo}</span>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Os modelos abaixo estão ordenados pelos que melhor acomodam esse número.
                </p>
              </div>
              <div data-testid="lista-modelos" className="grid max-h-[380px] grid-cols-2 gap-2 overflow-auto pr-1">
                {modelosSugeridos.map((l) => (
                  <button
                    key={l.id}
                    data-testid={`modelo-${l.id}`}
                    title={`${l.nome} · ${l.capacidade} imagens`}
                    onClick={() => aplicarModelo(l)}
                    className="rounded border p-1.5 text-left transition hover:border-primary hover:ring-2 hover:ring-primary/40"
                  >
                    <div className="relative aspect-[595/842] w-full overflow-hidden rounded bg-muted/50">
                      {l.slots.map((s, i) => (
                        <span
                          key={i}
                          className="absolute rounded-[2px] bg-primary/35"
                          style={{
                            left: `${s.x * 100}%`, top: `${s.y * 100}%`,
                            width: `${s.w * 100}%`, height: `${s.h * 100}%`,
                          }}
                        />
                      ))}
                    </div>
                    <p className="mt-1 truncate text-[11px] font-medium">{l.nome}</p>
                    <p className="text-[10px] text-muted-foreground">{l.capacidade} imagens</p>
                  </button>
                ))}
              </div>
              <div className="space-y-2 rounded border border-dashed p-2">
                <div className="flex items-center gap-1 text-xs font-medium">
                  <Droplets className="h-3.5 w-3.5" /> Marca de água
                </div>
                <Input
                  value={marcaTexto} onChange={(e) => setMarcaTexto(e.target.value)}
                  placeholder="Texto da marca de água" data-testid="marca-texto" className="h-8 text-xs"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Select value={marcaPos} onValueChange={(v) => setMarcaPos(v as PosicaoMarcaAgua)}>
                    <SelectTrigger className="h-8 text-xs" data-testid="marca-posicao"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inferior-direita">Inferior direita</SelectItem>
                      <SelectItem value="inferior-esquerda">Inferior esquerda</SelectItem>
                      <SelectItem value="superior-direita">Superior direita</SelectItem>
                      <SelectItem value="superior-esquerda">Superior esquerda</SelectItem>
                      <SelectItem value="centro">Centro</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-2">
                    <Slider value={[marcaOpacidade]} min={10} max={100} step={5}
                      onValueChange={([v]) => setMarcaOpacidade(v)} className="flex-1" />
                    <span className="w-8 text-right text-[11px] tabular-nums">{marcaOpacidade}%</span>
                  </div>
                </div>
                <Button size="sm" className="w-full" data-testid="inserir-marca" onClick={() => inserirMarcaAgua()}>
                  <Droplets className="mr-1 h-3.5 w-3.5" /> Inserir marca de água
                </Button>
                <div>
                  <Label className="text-[11px]">Ou usar logótipo (PNG)</Label>
                  <Input type="file" accept="image/png" className="mt-1 h-8 text-xs"
                    onChange={(e) => uploadMarcaAgua(e.target.files)} />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent></Card>


        {/* CENTRO: canvas infinito com a folha A4 */}
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <Button size="sm" variant="outline" data-testid="zoom-out" onClick={() => zoomEmTorno(zoom / 1.25)} aria-label="Reduzir zoom"><ZoomOut className="h-3.5 w-3.5" /></Button>
            <Button size="sm" variant="outline" data-testid="zoom-in" onClick={() => zoomEmTorno(zoom * 1.25)} aria-label="Aumentar zoom"><ZoomIn className="h-3.5 w-3.5" /></Button>
            <span data-testid="zoom-valor" className="min-w-14 text-center text-xs tabular-nums text-muted-foreground">{Math.round(zoom * 100)}%</span>
            <Button size="sm" variant="outline" data-testid="zoom-fit" onClick={ajustar}><Maximize className="mr-1 h-3.5 w-3.5" /> Ajustar</Button>
            <Button size="sm" variant="outline" onClick={() => setZoom(1)}>100%</Button>
            <Button size="sm" variant={grelha ? "default" : "outline"} data-testid="toggle-grelha" onClick={() => setGrelha((v) => !v)} aria-label="Grelha"><Grid3X3 className="h-3.5 w-3.5" /></Button>
            <Button size="sm" variant={magnetico ? "default" : "outline"} data-testid="toggle-magnetico" onClick={() => setMagnetico((v) => !v)} aria-label="Guias magnéticas"><Magnet className="h-3.5 w-3.5" /></Button>
            <Button size="sm" variant="outline" data-testid="apresentar" onClick={() => setApresentacao(true)}><Play className="mr-1 h-3.5 w-3.5" /> Apresentar</Button>
          </div>
          <div
            ref={stageRef}
            data-testid="canvas-viewport"
            className="relative h-[70vh] min-h-[420px] touch-none overflow-hidden rounded-lg border bg-muted/30"
            style={{
              backgroundImage: grelha
                ? "linear-gradient(to right, color-mix(in oklab, var(--border) 60%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklab, var(--border) 60%, transparent) 1px, transparent 1px)"
                : undefined,
              backgroundSize: grelha ? `${24 * zoom}px ${24 * zoom}px` : undefined,
              backgroundPosition: grelha ? `${view.x}px ${view.y}px` : undefined,
              cursor: "grab",
            }}
            onPointerDown={(e) => { if (e.currentTarget === e.target) { setSelId(null); iniciarPan(e); } }}
          >
            <div
              style={{
                position: "absolute", top: 0, left: 0,
                transform: `translate(${view.x}px, ${view.y}px) scale(${zoom})`,
                transformOrigin: "0 0",
              }}
            >
              <div
                ref={artRef}
                data-stage-export
                style={{
                  width: A4_W, height: A4_H,
                  background: design.imagemFundo ? `url(${design.imagemFundo}) center/cover no-repeat` : design.corFundo,
                  position: "relative", overflow: "hidden", boxShadow: "0 8px 40px rgba(0,0,0,.18)",
                }}
                onPointerDown={(e) => { if (e.currentTarget === e.target) setSelId(null); }}
              >
                {[...design.elementos].sort((a, b) => a.zIndex - b.zIndex).filter((el) => !el.oculto).map((el) => (
                  <ElementoView key={el.id} el={el} selecionado={el.id === selId} onPointerDown={onPointerDownEl} onChange={(p) => updEl(el.id, p)} />
                ))}
                {/* guias magnéticas */}
                {guias.v.map((x, i) => (
                  <div key={`v${i}`} style={{ position: "absolute", left: x, top: 0, width: 1 / zoom, height: A4_H, background: "#e11d48", pointerEvents: "none" }} />
                ))}
                {guias.h.map((y, i) => (
                  <div key={`h${i}`} style={{ position: "absolute", top: y, left: 0, height: 1 / zoom, width: A4_W, background: "#e11d48", pointerEvents: "none" }} />
                ))}
              </div>
            </div>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Roda do rato = zoom no cursor · arrastar fundo = mover tela · Shift+roda = deslocar · Alt ao arrastar = ignorar guias · 0 = ajustar · 1 = 100% · Del = apagar · Ctrl+D = duplicar
          </p>

          <Card className="mt-3"><CardContent className="p-3">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-medium">Alinhar na página</span>
              <Button size="sm" variant="outline" disabled={!sel} data-testid="alinhar-esquerda" onClick={() => alinharSel("esquerda")} aria-label="Alinhar à esquerda"><AlignLeft className="h-3.5 w-3.5" /></Button>
              <Button size="sm" variant="outline" disabled={!sel} data-testid="alinhar-centro-h" onClick={() => alinharSel("centro-h")} aria-label="Centrar na horizontal"><AlignHorizontalJustifyCenter className="h-3.5 w-3.5" /></Button>
              <Button size="sm" variant="outline" disabled={!sel} data-testid="alinhar-direita" onClick={() => alinharSel("direita")} aria-label="Alinhar à direita"><AlignRight className="h-3.5 w-3.5" /></Button>
              <Button size="sm" variant="outline" disabled={!sel} data-testid="alinhar-topo" onClick={() => alinharSel("topo")} aria-label="Alinhar ao topo"><ChevronUp className="h-3.5 w-3.5" /></Button>
              <Button size="sm" variant="outline" disabled={!sel} data-testid="alinhar-centro-v" onClick={() => alinharSel("centro-v")} aria-label="Centrar na vertical"><AlignVerticalJustifyCenter className="h-3.5 w-3.5" /></Button>
              <Button size="sm" variant="outline" disabled={!sel} data-testid="alinhar-fundo" onClick={() => alinharSel("fundo")} aria-label="Alinhar ao fundo"><ChevronDown className="h-3.5 w-3.5" /></Button>
              <span className="ml-2 font-medium">Distribuir</span>
              <Button size="sm" variant="outline" data-testid="distribuir-h" onClick={() => distribuirTudo("h")}>Horizontal</Button>
              <Button size="sm" variant="outline" data-testid="distribuir-v" onClick={() => distribuirTudo("v")}>Vertical</Button>
            </div>
          </CardContent></Card>

          <Card className="mt-3"><CardContent className="p-3">
            <div className="mb-2 flex items-center gap-2 text-xs font-medium">
              <Layers className="h-3.5 w-3.5" /> Camadas ({design.elementos.length})
            </div>
            {design.elementos.length === 0 ? (
              <p className="text-xs text-muted-foreground">Sem elementos ainda.</p>
            ) : (
              <ul
                data-testid="painel-camadas"
                role="listbox"
                aria-label="Camadas do moodboard"
                aria-activedescendant={selId ? `camada-${selId}` : undefined}
                className="max-h-56 space-y-1 overflow-auto"
              >
                {camadasOrdenadas.map((el, indice) => (
                  <li
                    key={el.id}
                    data-testid="camada-item"
                    id={`camada-${el.id}`}
                    data-camada-id={el.id}
                    role="option"
                    aria-selected={el.id === selId}
                    aria-label={`${rotuloElemento(el)}${el.oculto ? ", oculta" : ""}${el.bloqueado ? ", bloqueada" : ""}`}
                    tabIndex={el.id === selId || (!selId && indice === 0) ? 0 : -1}
                    onFocus={() => setSelId(el.id)}
                    onKeyDown={(e) => onKeyCamada(e, el.id, indice)}
                    className={`flex items-center gap-1 rounded-md border px-2 py-1 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring ${el.id === selId ? "border-primary bg-primary/5" : "border-transparent"}`}
                  >
                    <button type="button" tabIndex={-1} className="flex-1 truncate text-left" onClick={() => setSelId(el.id)} title={rotuloElemento(el)}>
                      {rotuloElemento(el)}
                    </button>
                    <Button size="sm" variant="ghost" tabIndex={-1} className="h-7 w-7 p-0" onClick={() => trazerFrente(el.id)} aria-label="Trazer para a frente"><ChevronUp className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="ghost" tabIndex={-1} className="h-7 w-7 p-0" onClick={() => enviarTras(el.id)} aria-label="Enviar para trás"><ChevronDown className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="ghost" tabIndex={-1} className="h-7 w-7 p-0" data-testid="camada-visibilidade" aria-pressed={!!el.oculto} onClick={() => alternarVisibilidade(el.id)} aria-label={el.oculto ? "Mostrar camada" : "Ocultar camada"}>
                      {el.oculto ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </Button>
                    <Button size="sm" variant="ghost" tabIndex={-1} className="h-7 w-7 p-0" data-testid="camada-bloqueio" aria-pressed={!!el.bloqueado} onClick={() => alternarBloqueio(el.id)} aria-label={el.bloqueado ? "Desbloquear camada" : "Bloquear camada"}>
                      {el.bloqueado ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                    </Button>
                    <Button size="sm" variant="ghost" tabIndex={-1} className="h-7 w-7 p-0 text-destructive" onClick={() => remEl(el.id)} aria-label="Apagar camada"><Trash2 className="h-3.5 w-3.5" /></Button>
                  </li>
                ))}
              </ul>
            )}
            {design.elementos.length > 0 && (
              <p className="mt-2 text-[11px] text-muted-foreground" data-testid="camadas-ajuda">
                Teclado: ↑/↓ navegar · Ctrl+↑/↓ reordenar · B bloquear · O ocultar · Del apagar
              </p>
            )}
          </CardContent></Card>

          {sel && (
            <Card className="mt-3"><CardContent className="p-3">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-medium">{sel.tipo === "text" ? "Texto" : sel.tipo === "decor" ? "Decoração" : "Imagem"}</span>
                <Button size="sm" variant="outline" onClick={() => trazerFrente(sel.id)}><ChevronUp className="h-3.5 w-3.5" /> Frente</Button>
                <Button size="sm" variant="outline" onClick={() => enviarTras(sel.id)}><ChevronDown className="h-3.5 w-3.5" /> Trás</Button>
                <Button size="sm" variant="outline" onClick={() => duplicarEl(sel.id)}><Copy className="mr-1 h-3.5 w-3.5" /> Duplicar</Button>
                <Button size="sm" variant="destructive" onClick={() => remEl(sel.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                <div className="flex items-center gap-2">
                  <Label className="text-xs">Opacidade</Label>
                  <Slider value={[Math.round((sel.opacidade ?? 1) * 100)]} min={10} max={100} step={5}
                    onValueChange={([v]) => updEl(sel.id, { opacidade: v / 100 })} className="w-28" />
                </div>
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

      {apresentacao && (
        <div
          data-testid="modo-apresentacao"
          className="fixed inset-0 z-[95] grid place-items-center bg-black/90 p-6"
          onClick={() => setApresentacao(false)}
        >
          <div
            style={{
              width: A4_W, height: A4_H,
              transform: `scale(${Math.min((typeof window !== "undefined" ? window.innerHeight - 80 : A4_H) / A4_H, 1.2)})`,
              background: design.imagemFundo ? `url(${design.imagemFundo}) center/cover no-repeat` : design.corFundo,
              position: "relative", overflow: "hidden", boxShadow: "0 20px 80px rgba(0,0,0,.6)",
            }}
          >
            {[...design.elementos].sort((a, b) => a.zIndex - b.zIndex).filter((el) => !el.oculto).map((el) => (
              <ElementoView key={el.id} el={el} selecionado={false} onPointerDown={() => {}} onChange={() => {}} />
            ))}
          </div>
          <span className="absolute bottom-4 text-xs text-white/70">Clica ou prime Esc para sair</span>
        </div>
      )}
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
    opacity: el.opacidade ?? 1,
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
  ) : el.tipo === "image" ? (
    // Moldura vazia criada por um modelo de esteira: aguarda uma imagem.
    <div
      data-testid="slot-vazio"
      style={{
        width: "100%", height: "100%", borderRadius: el.raioCantos ?? 0,
        border: "1px dashed #c4b5fd", background: "rgba(196,181,253,.12)",
        display: "grid", placeItems: "center", color: "#8b5cf6", fontSize: 11, pointerEvents: "none",
      }}
    >
      imagem
    </div>
  ) : null;
  return (
    <div
      style={base}
      data-testid="elemento-canvas"
      data-el-id={el.id}
      data-bloqueado={el.bloqueado ? "1" : undefined}
      onPointerDown={(e) => onPointerDown(e, el.id, "move")}
    >
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