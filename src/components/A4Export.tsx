import { useState, type ReactNode, type RefObject } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Printer, Save, Lock } from "lucide-react";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

export type AreaTecnica = "Tricotin" | "Amigurumi" | "Crochê" | "Costura" | "Ponto cruz" | "Bordado";
export const AREAS: AreaTecnica[] = ["Tricotin", "Amigurumi", "Crochê", "Costura", "Ponto cruz", "Bordado"];

/* -------- Formatos de papel (portrait, em mm) -------- */
export type PaperSize = "A3" | "A4" | "A5" | "Letter" | "Legal";
export const PAPER_SIZES: { id: PaperSize; label: string; w: number; h: number }[] = [
  { id: "A3", label: "A3 (297 × 420 mm)", w: 297, h: 420 },
  { id: "A4", label: "A4 (210 × 297 mm)", w: 210, h: 297 },
  { id: "A5", label: "A5 (148 × 210 mm)", w: 148, h: 210 },
  { id: "Letter", label: "Letter (216 × 279 mm)", w: 216, h: 279 },
  { id: "Legal", label: "Legal (216 × 356 mm)", w: 216, h: 356 },
];
export type Orientacao = "portrait" | "landscape";
export function useSheet(defaultSize: PaperSize = "A4", defaultOr: Orientacao = "portrait") {
  const [size, setSize] = useState<PaperSize>(defaultSize);
  const [orientacao, setOrientacao] = useState<Orientacao>(defaultOr);
  return { size, setSize, orientacao, setOrientacao };
}
export function SheetControls({
  size, setSize, orientacao, setOrientacao,
}: {
  size: PaperSize; setSize: (s: PaperSize) => void;
  orientacao: Orientacao; setOrientacao: (o: Orientacao) => void;
}) {
  return (
    <Card><CardContent className="space-y-3 p-3">
      <div>
        <Label className="text-xs">Tamanho da folha</Label>
        <Select value={size} onValueChange={(v) => setSize(v as PaperSize)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{PAPER_SIZES.map((p) => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs">Orientação</Label>
        <div className="mt-1 flex gap-2">
          <Button size="sm" variant={orientacao === "portrait" ? "default" : "outline"} onClick={() => setOrientacao("portrait")}>Vertical</Button>
          <Button size="sm" variant={orientacao === "landscape" ? "default" : "outline"} onClick={() => setOrientacao("landscape")}>Horizontal</Button>
        </div>
      </div>
    </CardContent></Card>
  );
}

export interface MarcaDAgua {
  ativa: boolean;
  texto: string;
  tamanho: number; // 10-100 (%)
  opacidade: number; // 0-100
  bloqueada: boolean;
}

export function useMarcaDAgua(): [MarcaDAgua, (p: Partial<MarcaDAgua>) => void] {
  const perfil = useStore((s) => s.perfilNegocio);
  const [w, setW] = useState<MarcaDAgua>({
    ativa: false, texto: perfil.nome || "Herança do Novelo",
    tamanho: 60, opacidade: 18, bloqueada: false,
  });
  return [w, (p) => setW((s) => ({ ...s, ...p }))];
}

export function Watermark({ w }: { w: MarcaDAgua }) {
  const perfil = useStore((s) => s.perfilNegocio);
  if (!w.ativa) return null;
  const size = w.bloqueada ? 60 : w.tamanho;
  return (
    <div className="pointer-events-none absolute inset-0 grid place-items-center select-none"
         style={{ opacity: w.opacidade / 100 }}>
      {perfil.logo ? (
        <img src={perfil.logo} alt="" style={{ width: `${size}%`, transform: "rotate(-25deg)" }} />
      ) : (
        <div className="font-display font-bold text-center"
             style={{ fontSize: `${size * 0.6}px`, transform: "rotate(-25deg)", color: "#111" }}>
          {w.texto}
        </div>
      )}
    </div>
  );
}

export function WatermarkControls({ w, set }: { w: MarcaDAgua; set: (p: Partial<MarcaDAgua>) => void }) {
  return (
    <Card><CardContent className="space-y-3 p-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Aplicar marca d&apos;água</Label>
        <Switch checked={w.ativa} onCheckedChange={(v) => set({ ativa: v })} />
      </div>
      <div>
        <Label className="text-xs">Texto (se sem logo)</Label>
        <Input value={w.texto} onChange={(e) => set({ texto: e.target.value })} />
      </div>
      <div>
        <div className="flex items-center justify-between">
          <Label className="text-xs">Tamanho ({w.tamanho}%)</Label>
          <Button size="sm" variant={w.bloqueada ? "default" : "outline"} onClick={() => set({ bloqueada: !w.bloqueada })}>
            <Lock className="mr-1 h-3 w-3" />{w.bloqueada ? "Padrão fixo" : "Bloquear padrão"}
          </Button>
        </div>
        <Slider value={[w.tamanho]} min={10} max={100} step={1} disabled={w.bloqueada} onValueChange={(v) => set({ tamanho: v[0] })} />
      </div>
      <div>
        <Label className="text-xs">Opacidade ({w.opacidade}%)</Label>
        <Slider value={[w.opacidade]} min={0} max={100} step={1} onValueChange={(v) => set({ opacidade: v[0] })} />
      </div>
    </CardContent></Card>
  );
}

/**
 * Painel de Exportação reutilizável: Guardar na Biblioteca / PDF / Imprimir.
 * `targetRef` aponta para o nó DOM A4 a capturar (já com a marca d'água sobreposta).
 */
export function ExportPanel({
  targetRef, defaultArea, defaultTitulo, orientacao = "portrait", size = "A4", extra,
}: {
  targetRef: RefObject<HTMLDivElement | null>;
  defaultArea: AreaTecnica;
  defaultTitulo: string;
  orientacao?: Orientacao;
  size?: PaperSize;
  extra?: ReactNode;
}) {
  const add = useStore((s) => s.add);
  const [area, setArea] = useState<AreaTecnica>(defaultArea);
  const [titulo, setTitulo] = useState(defaultTitulo);

  const capturar = async () => {
    if (!targetRef.current) throw new Error("Tela não encontrada");
    return toPng(targetRef.current, { pixelRatio: 2, cacheBust: true, backgroundColor: "#ffffff" });
  };

  const guardarBib = async () => {
    try {
      const data = await capturar();
      add("biblioteca", {
        titulo: titulo || "Sem título", categoria: area, tipo: "molde",
        descricao: `Criado no editor (${area})`, ficheiroBase64: data,
        criadoEm: new Date().toISOString(),
      } as any);
      toast.success(`Guardado em Biblioteca › ${area}`);
    } catch (e) { toast.error("Falha ao guardar: " + (e as Error).message); }
  };

  const exportarPDF = async () => {
    try {
      const data = await capturar();
      const spec = PAPER_SIZES.find((p) => p.id === size) ?? PAPER_SIZES[1];
      const format: [number, number] = orientacao === "portrait" ? [spec.w, spec.h] : [spec.h, spec.w];
      const pdf = new jsPDF({ orientation: orientacao, unit: "mm", format });
      const w = format[0];
      const h = format[1];
      pdf.addImage(data, "PNG", 0, 0, w, h);
      pdf.save(`${(titulo || "trabalho").replace(/\s+/g, "-")}.pdf`);
    } catch (e) { toast.error("Falha ao gerar PDF: " + (e as Error).message); }
  };

  const imprimir = async () => {
    try {
      const data = await capturar();
      const win = window.open("", "_blank");
      if (!win) return;
      const cssSize = size === "Letter" || size === "Legal"
        ? `${size.toLowerCase()} ${orientacao}`
        : `${size} ${orientacao}`;
      win.document.write(`<html><head><title>${titulo}</title>
        <style>@page{size:${cssSize};margin:0}body{margin:0}img{width:100%;height:100vh;object-fit:contain}</style>
        </head><body><img src="${data}" onload="window.print();setTimeout(()=>window.close(),300)"/></body></html>`);
      win.document.close();
    } catch (e) { toast.error("Falha ao imprimir: " + (e as Error).message); }
  };

  return (
    <Card><CardContent className="space-y-3 p-3">
      <div>
        <Label className="text-xs">Título do trabalho</Label>
        <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} />
      </div>
      <div>
        <Label className="text-xs">Categoria (Biblioteca)</Label>
        <Select value={area} onValueChange={(v) => setArea(v as AreaTecnica)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{AREAS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      {extra}
      <div className="grid grid-cols-1 gap-2">
        <Button onClick={guardarBib}><Save className="mr-1 h-4 w-4" />Guardar na Biblioteca</Button>
        <Button variant="secondary" onClick={exportarPDF}><Download className="mr-1 h-4 w-4" />Criar PDF</Button>
        <Button variant="outline" onClick={imprimir}><Printer className="mr-1 h-4 w-4" />Imprimir A4</Button>
      </div>
    </CardContent></Card>
  );
}

/** Wrapper de tela com proporção A4 e marca d'água sobreposta. */
export function A4Stage({
  innerRef, orientacao = "portrait", size = "A4", children, className = "",
  watermark,
}: {
  innerRef: RefObject<HTMLDivElement | null>;
  orientacao?: Orientacao;
  size?: PaperSize;
  children: ReactNode;
  className?: string;
  watermark: MarcaDAgua;
}) {
  const spec = PAPER_SIZES.find((p) => p.id === size) ?? PAPER_SIZES[1];
  const ratio = orientacao === "portrait" ? `${spec.w}/${spec.h}` : `${spec.h}/${spec.w}`;
  return (
    <div ref={innerRef} className={`relative mx-auto w-full max-w-3xl overflow-hidden border border-border bg-white shadow ${className}`}
         style={{ aspectRatio: ratio }}>
      {children}
      <Watermark w={watermark} />
    </div>
  );
}