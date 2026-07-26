/**
 * Fase 17 — Painel de edição manual, undo/redo, tutorial e revisão por cor.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  canRedo, canUndo, createHistory, pushHistory, redo, undo,
  EMBROIDERY_SHORTCUTS, EMBROIDERY_TUTORIAL,
  isolateColor, scoreColor, type ColorBlockLite, type History,
} from "@/lib/embroidery-phase17";

interface Phase17PanelProps {
  blocks: ColorBlockLite[];
  activeColor?: string;
  onActiveColor?: (hex: string | null) => void;
  /** Recebe callbacks para inscrever undo/redo do editor principal. */
  onUndoRegister?: (fn: () => void) => void;
  onRedoRegister?: (fn: () => void) => void;
}

/** Estado de exemplo (stitch selector + estimador). No editor real, os deltas
 *  serão empurrados por cada slider através do hook exportado abaixo. */
interface Phase3State {
  stitchIndex: number;
  densityAdj: number;
  costFactor: number;
}

export function Phase17Panel({
  blocks, activeColor, onActiveColor, onUndoRegister, onRedoRegister,
}: Phase17PanelProps) {
  const [hist, setHist] = useState<History<Phase3State>>(() =>
    createHistory({ stitchIndex: 0, densityAdj: 1, costFactor: 1 }),
  );

  const doUndo = useCallback(() => {
    setHist((h) => {
      if (!canUndo(h)) return h;
      toast.info("Ação desfeita.");
      return undo(h);
    });
  }, []);
  const doRedo = useCallback(() => {
    setHist((h) => {
      if (!canRedo(h)) return h;
      toast.info("Ação refeita.");
      return redo(h);
    });
  }, []);

  // Regista handlers para o editor pai também poder invocar undo/redo.
  useEffect(() => { onUndoRegister?.(doUndo); }, [onUndoRegister, doUndo]);
  useEffect(() => { onRedoRegister?.(doRedo); }, [onRedoRegister, doRedo]);

  // Atalhos globais Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z / ? / R
  const [reviewOn, setReviewOn] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && /INPUT|TEXTAREA|SELECT/.test(target.tagName)) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        e.shiftKey ? doRedo() : doUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault(); doRedo();
      } else if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        (document.getElementById("phase17-help-trigger") as HTMLElement | null)?.click();
      } else if (e.key.toLowerCase() === "r" && !e.ctrlKey && !e.metaKey) {
        setReviewOn((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [doUndo, doRedo]);

  // Empurra uma ação exemplo (o editor real chamaria `pushChange` por slider)
  const pushChange = (patch: Partial<Phase3State>) => {
    setHist((h) => pushHistory(h, { ...h.present, ...patch }));
  };

  // Revisão por cor: agrupa cores únicas
  const uniqueColors = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const b of blocks) {
      const c = b.color.toLowerCase();
      if (!seen.has(c)) { seen.add(c); out.push(b.color); }
    }
    return out;
  }, [blocks]);

  const reviewScore = useMemo(() => {
    if (!activeColor) return null;
    const iso = isolateColor(blocks, activeColor);
    return { count: iso.length, score: scoreColor(iso) };
  }, [blocks, activeColor]);

  return (
    <Card>
      <CardContent className="space-y-3 p-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold">Fase 17 — Edição & revisão</Label>
          <Dialog>
            <DialogTrigger asChild>
              <Button id="phase17-help-trigger" size="sm" variant="outline" className="h-6 px-2 text-[10px]">? Ajuda</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Tutorial rápido & atalhos</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                <div>
                  <p className="text-xs font-semibold mb-1">Passos</p>
                  <ol className="space-y-1 text-xs">
                    {EMBROIDERY_TUTORIAL.map((s, i) => (
                      <li key={i} className="border rounded p-2">
                        <p className="font-medium">{s.title}</p>
                        <p className="text-muted-foreground">{s.body}</p>
                      </li>
                    ))}
                  </ol>
                </div>
                <div>
                  <p className="text-xs font-semibold mb-1">Mapa de atalhos</p>
                  <table className="w-full text-xs">
                    <tbody>
                      {EMBROIDERY_SHORTCUTS.map((s, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="py-1 pr-2 font-mono">{s.keys}</td>
                          <td className="py-1 pr-2">{s.description}</td>
                          <td className="py-1 text-muted-foreground text-right">{s.scope}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Undo/redo state (Fase 3) */}
        <div className="grid grid-cols-2 gap-1">
          <Button size="sm" variant="outline" disabled={!canUndo(hist)} onClick={doUndo}>
            ↶ Desfazer
          </Button>
          <Button size="sm" variant="outline" disabled={!canRedo(hist)} onClick={doRedo}>
            ↷ Refazer
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground">
          Histórico: {hist.past.length} passos · Ctrl+Z / Ctrl+Shift+Z.
        </p>
        <div className="grid grid-cols-3 gap-1">
          <Button size="sm" variant="ghost" className="h-6 text-[10px]"
            onClick={() => pushChange({ stitchIndex: hist.present.stitchIndex + 1 })}>
            +stitch
          </Button>
          <Button size="sm" variant="ghost" className="h-6 text-[10px]"
            onClick={() => pushChange({ densityAdj: +(hist.present.densityAdj + 0.1).toFixed(2) })}>
            +densidade
          </Button>
          <Button size="sm" variant="ghost" className="h-6 text-[10px]"
            onClick={() => pushChange({ costFactor: +(hist.present.costFactor + 0.05).toFixed(2) })}>
            +custo
          </Button>
        </div>

        {/* Revisão por cor */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label className="text-[10px]">Revisão por cor (R)</Label>
            <Button size="sm" variant={reviewOn ? "default" : "outline"} className="h-6 text-[10px]"
              onClick={() => setReviewOn((v) => !v)}>
              {reviewOn ? "Ligado" : "Desligado"}
            </Button>
          </div>
          {reviewOn && (
            <>
              <div className="flex flex-wrap gap-1">
                {uniqueColors.map((c) => (
                  <button key={c}
                    onClick={() => onActiveColor?.(activeColor === c ? null : c)}
                    className="h-6 w-6 rounded border shadow-sm"
                    style={{ background: c, outline: activeColor === c ? "2px solid #000" : "none" }}
                    title={c}
                    aria-label={`Focar ${c}`}
                  />
                ))}
                {uniqueColors.length === 0 && (
                  <p className="text-[10px] text-muted-foreground italic">Sem cores ativas.</p>
                )}
              </div>
              {reviewScore && (
                <div className="text-[10px] rounded border p-2 bg-muted/50">
                  Cor focada: <span className="font-mono">{activeColor}</span> ·
                  {" "}{reviewScore.count} bloco{reviewScore.count !== 1 ? "s" : ""} ·
                  {" "}pontuação{" "}
                  <span className={reviewScore.score >= 80 ? "text-emerald-600 font-semibold"
                    : reviewScore.score >= 60 ? "text-amber-600 font-semibold"
                    : "text-rose-600 font-semibold"}>
                    {reviewScore.score}/100
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}