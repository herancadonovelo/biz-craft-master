// Fase 6 — Consolidador de feedback dos testers.
// A autora importa vários ficheiros JSON exportados pelos testers e vê um
// resumo agregado (heatmap de carreiras problemáticas, contagens por tipo,
// consumo médio, tamanhos usados e lista completa de notas).

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Trash2, Upload, FileJson, CloudDownload } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { listTesterFeedback, deleteTesterFeedback } from "@/lib/tester-feedback.functions";
import { agregarFeedback, type TesterProgress } from "@/lib/knit/tester";

function isTesterProgress(v: unknown): v is TesterProgress {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return typeof o.token === "string"
    && typeof o.atual === "number"
    && typeof o.totalRows === "number"
    && Array.isArray(o.notas);
}

export function FeedbackConsolidator() {
  const [items, setItems] = React.useState<(TesterProgress & { dbId?: string })[]>([]);
  const [aCarregar, setACarregar] = React.useState(false);
  const carregarNuvem = useServerFn(listTesterFeedback);
  const apagarNuvem = useServerFn(deleteTesterFeedback);

  const importarNuvem = async () => {
    setACarregar(true);
    try {
      const { rows } = await carregarNuvem({ data: {} } as never);
      const mapped: (TesterProgress & { dbId?: string })[] = rows.map((r) => ({
        dbId: r.id,
        token: r.token,
        autor: r.autor,
        atual: r.atual,
        totalRows: r.total_rows,
        iniciado: 0,
        ultimo: new Date(r.updated_at).getTime(),
        concluido: r.concluido,
        notas: (Array.isArray(r.notas) ? r.notas : []) as TesterProgress["notas"],
        consumoRealG: r.consumo_real_g == null ? undefined : Number(r.consumo_real_g),
        tamanhoUsado: r.tamanho_usado ?? undefined,
      }));
      setItems((prev) => {
        const semNuvem = prev.filter((p) => !p.dbId);
        return [...mapped, ...semNuvem];
      });
      toast.success(mapped.length ? `${mapped.length} feedback(s) sincronizado(s) da nuvem.` : "Ainda não há feedback enviado pelas testers.");
    } catch {
      toast.error("Não foi possível carregar o feedback da nuvem.");
    } finally {
      setACarregar(false);
    }
  };

  const addFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const novos: (TesterProgress & { dbId?: string })[] = [];
    for (const file of Array.from(files)) {
      try {
        const parsed = JSON.parse(await file.text());
        const arr = Array.isArray(parsed) ? parsed : [parsed];
        for (const p of arr) if (isTesterProgress(p)) novos.push(p);
      } catch { /* ignore */ }
    }
    if (!novos.length) { toast.error("Nenhum feedback válido encontrado."); return; }
    setItems((prev) => [...prev, ...novos]);
    toast.success(`${novos.length} feedback(s) importado(s).`);
  };

  const remover = (idx: number) => {
    const alvo = items[idx];
    if (alvo?.dbId) {
      void apagarNuvem({ data: { id: alvo.dbId } })
        .then(() => toast.success("Feedback removido da nuvem."))
        .catch(() => toast.error("Não foi possível remover o feedback da nuvem."));
    }
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };
  const limpar = () => setItems([]);

  const resumo = React.useMemo(() => agregarFeedback(items), [items]);
  const maxCount = resumo.notasPorRow[0]?.count ?? 0;

  return (
    <div className="space-y-4" data-testid="feedback-consolidator">
      <Card>
        <CardHeader><CardTitle className="text-base">Importar feedback dos testers</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <label className="flex cursor-pointer items-center gap-2 rounded border border-dashed p-4 text-sm text-muted-foreground hover:bg-muted/40">
            <Upload className="h-4 w-4" />
            <span>Arrasta ou seleciona ficheiros JSON exportados pelos testers</span>
            <Input
              type="file"
              accept="application/json,.json"
              multiple
              className="hidden"
              data-testid="feedback-file-input"
              onChange={(e) => addFiles(e.target.files)}
            />
          </label>
          <Button size="sm" variant="outline" disabled={aCarregar} onClick={() => void importarNuvem()} data-testid="feedback-load-cloud">
            <CloudDownload className="mr-2 h-4 w-4" /> Carregar feedback da nuvem
          </Button>
          {items.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">{items.length} feedback(s) carregado(s)</span>
              <Button size="sm" variant="ghost" onClick={limpar}>
                <Trash2 className="mr-1 h-3 w-3" /> Limpar tudo
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {items.length > 0 && (
        <>
          <Card>
            <CardHeader><CardTitle className="text-base">Resumo agregado</CardTitle></CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label="Testers" value={resumo.testers} testId="stat-testers" />
              <Stat label="Concluídos" value={resumo.concluidos} testId="stat-concluidos" />
              <Stat label="Consumo médio (g)" value={resumo.mediaConsumoG} testId="stat-consumo" />
              <Stat label="Notas totais"
                value={Object.values(resumo.notasPorTipo).reduce((a, b) => a + b, 0)}
                testId="stat-notas" />
              <Stat label="Erros" value={resumo.notasPorTipo.erro} tone="danger" />
              <Stat label="Sugestões" value={resumo.notasPorTipo.sugestao} />
              <Stat label="Tamanho" value={resumo.notasPorTipo.tamanho} />
              <Stat label="Consumo" value={resumo.notasPorTipo.consumo} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Carreiras mais reportadas</CardTitle></CardHeader>
            <CardContent>
              {resumo.notasPorRow.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem notas por carreira.</p>
              ) : (
                <ul className="space-y-1" data-testid="rows-heatmap">
                  {resumo.notasPorRow.slice(0, 20).map(({ row, count }) => {
                    const pct = maxCount ? (count / maxCount) * 100 : 0;
                    return (
                      <li key={row} className="flex items-center gap-2 text-sm">
                        <span className="w-14 font-mono">C{row}</span>
                        <div className="h-3 flex-1 rounded bg-muted overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-10 text-right font-mono tabular-nums">{count}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Tamanhos usados</CardTitle></CardHeader>
            <CardContent>
              {Object.keys(resumo.tamanhosUsados).length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum tester indicou tamanho.</p>
              ) : (
                <ul className="flex flex-wrap gap-2 text-sm">
                  {Object.entries(resumo.tamanhosUsados).map(([tam, n]) => (
                    <li key={tam} className="rounded-full bg-muted px-3 py-1">
                      <b>{tam}</b> · {n}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Feedbacks individuais</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {items.map((p, i) => (
                <div key={i} className="rounded border p-3 text-sm" data-testid={`feedback-item-${i}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <FileJson className="h-4 w-4 text-muted-foreground" />
                      <b>{p.autor || "tester"}</b>
                      <span className="text-xs text-muted-foreground">
                        · {p.atual}/{p.totalRows} carreiras{p.concluido ? " · concluído" : ""}
                        {p.tamanhoUsado ? ` · ${p.tamanhoUsado}` : ""}
                        {typeof p.consumoRealG === "number" ? ` · ${p.consumoRealG}g` : ""}
                      </span>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => remover(i)} data-testid={`feedback-item-${i}-remove`}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  {p.notas.length > 0 && (
                    <ul className="mt-2 space-y-1 text-xs">
                      {p.notas.map((n, j) => (
                        <li key={j} className="border-l-2 border-primary/40 pl-2">
                          <b>C{n.row}</b> · <span className="uppercase text-muted-foreground">{n.tipo}</span> — {n.texto}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, tone, testId }: { label: string; value: number; tone?: "danger"; testId?: string }) {
  return (
    <div className="rounded border p-3" data-testid={testId}>
      <div className={`font-mono text-2xl tabular-nums ${tone === "danger" ? "text-destructive" : ""}`}>{value}</div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}