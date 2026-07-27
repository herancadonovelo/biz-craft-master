// Fase 6 — Testadores & UX do Editor de Gráficos: Tricô.
// Contador mobile-friendly com progresso persistido, row highlighter,
// notas por carreira, atalhos de teclado e geração de link público para testers.

import * as React from "react";
import { Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Copy, Link2, RotateCcw, Minus, Plus, CheckCircle2, Users } from "lucide-react";
import {
  loadProgress, newProgress, saveProgress, stepRow, addNote,
  pctCompleto, encodePackage, type TesterProgress, type TesterNote,
} from "@/lib/knit/tester";

interface Props {
  token: string;
  linhas: string[];
  packagePayload: unknown;
  onProgressChange?: (p: TesterProgress) => void;
}

export function TesterPanel({ token, linhas, packagePayload, onProgressChange }: Props) {
  const totalRows = linhas.length || 1;
  const [progress, setProgress] = React.useState<TesterProgress>(() =>
    loadProgress(token) ?? newProgress(token, totalRows),
  );
  const [destaque, setDestaque] = React.useState(1);
  const [nota, setNota] = React.useState("");
  const [tipo, setTipo] = React.useState<TesterNote["tipo"]>("sugestao");
  const [autor, setAutor] = React.useState(progress.autor);

  React.useEffect(() => { saveProgress(progress); onProgressChange?.(progress); }, [progress, onProgressChange]);

  // Sync totalRows se o gráfico mudou.
  React.useEffect(() => {
    setProgress((p) => (p.totalRows === totalRows ? p : { ...p, totalRows }));
  }, [totalRows]);

  // Atalhos: ArrowRight/Space avança, ArrowLeft recua.
  React.useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && ["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); setProgress((p) => stepRow(p, +1)); }
      if (e.key === "ArrowLeft") { e.preventDefault(); setProgress((p) => stepRow(p, -1)); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const submeterNota = () => {
    if (!nota.trim()) { toast.error("Escreve algo antes de submeter."); return; }
    setProgress((p) => addNote(p, { row: progress.atual, autor, texto: nota.trim(), tipo }));
    setNota("");
    toast.success(`Nota gravada na carreira C${progress.atual}.`);
  };

  const gerarLink = () => {
    if (typeof window === "undefined") return;
    const packed = encodePackage(packagePayload);
    const url = `${window.location.origin}/receita-tester-tricot/${token}#pkg=${packed}`;
    navigator.clipboard.writeText(url).then(() => toast.success("Link copiado — envia à tua equipa de testes."));
  };

  const exportarFeedback = () => {
    const blob = new Blob([JSON.stringify(progress, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `tester-${token}.json`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  };

  const pct = pctCompleto(progress);

  return (
    <div className="space-y-4" data-testid="knit-tester">
      <Card>
        <CardHeader><CardTitle className="text-base">Contador de carreiras (mobile-friendly)</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <Button size="lg" variant="outline" className="h-16 w-20 text-2xl"
              onClick={() => setProgress((p) => stepRow(p, -1))} data-testid="knit-tester-prev">
              <Minus className="h-6 w-6" />
            </Button>
            <div className="flex-1 text-center">
              <div className="text-6xl font-mono tabular-nums" data-testid="knit-tester-atual">{progress.atual}</div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">de {progress.totalRows} carreiras · {pct}%</div>
            </div>
            <Button size="lg" className="h-16 w-20 text-2xl"
              onClick={() => setProgress((p) => stepRow(p, +1))} data-testid="knit-tester-next">
              <Plus className="h-6 w-6" />
            </Button>
          </div>
          <div className="h-2 rounded bg-muted overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="ghost" onClick={() => setProgress(newProgress(token, totalRows, autor))}>
              <RotateCcw className="mr-2 h-4 w-4" /> Reiniciar
            </Button>
            {progress.concluido && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1 text-xs text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5" /> Concluído
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Atalhos: <kbd className="rounded bg-muted px-1">←</kbd> anterior,
            <kbd className="rounded bg-muted px-1">→</kbd> ou <kbd className="rounded bg-muted px-1">espaço</kbd> próxima.
            O progresso fica guardado neste dispositivo.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Row Highlighter</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Destacar carreira</Label>
            <Slider value={[destaque]} min={1} max={totalRows} onValueChange={(v) => setDestaque(v[0])} />
          </div>
          <div className="max-h-72 overflow-y-auto rounded border">
            {linhas.map((linha, i) => {
              const n = i + 1;
              const passada = n < progress.atual;
              const atual = n === progress.atual;
              const highlight = n === destaque;
              return (
                <div key={i} data-testid={`knit-tester-row-${n}`}
                  className={`px-3 py-1 font-mono text-sm ${highlight ? "bg-yellow-200/60 dark:bg-yellow-500/20" : ""} ${atual ? "border-l-4 border-primary bg-primary/5 font-semibold" : ""} ${passada ? "opacity-40 line-through" : ""}`}>
                  {linha}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Notas da tester (por carreira)</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-3">
            <div>
              <Label>Nome</Label>
              <Input value={autor} onChange={(e) => { setAutor(e.target.value); setProgress((p) => ({ ...p, autor: e.target.value })); }} />
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as TesterNote["tipo"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="erro">Erro</SelectItem>
                  <SelectItem value="sugestao">Sugestão</SelectItem>
                  <SelectItem value="tamanho">Tamanho</SelectItem>
                  <SelectItem value="consumo">Consumo real</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Consumo real (g)</Label>
              <Input type="number" value={progress.consumoRealG ?? ""}
                onChange={(e) => setProgress((p) => ({ ...p, consumoRealG: e.target.value ? Number(e.target.value) : undefined }))} />
            </div>
          </div>
          <Textarea placeholder={`Nota para C${progress.atual}…`} value={nota} onChange={(e) => setNota(e.target.value)} />
          <Button onClick={submeterNota} data-testid="knit-tester-add-note">Gravar nota em C{progress.atual}</Button>
          {progress.notas.length > 0 && (
            <ul className="space-y-1 text-sm" data-testid="knit-tester-notes">
              {progress.notas.map((n, i) => (
                <li key={i} className="rounded border-l-2 border-primary/40 bg-muted/30 px-2 py-1">
                  <b>C{n.row}</b> · <span className="text-xs uppercase text-muted-foreground">{n.tipo}</span> — {n.texto}
                  <span className="ml-2 text-xs text-muted-foreground">({n.autor})</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Partilhar com testers</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button onClick={gerarLink}><Link2 className="mr-2 h-4 w-4" /> Copiar link público</Button>
          <Button variant="outline" onClick={exportarFeedback}><Copy className="mr-2 h-4 w-4" /> Exportar feedback (JSON)</Button>
          <Button asChild variant="secondary" data-testid="knit-tester-consolidate-cta">
            <Link to="/consolidar-feedback">
              <Users className="mr-2 h-4 w-4" /> Consolidar feedback
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}