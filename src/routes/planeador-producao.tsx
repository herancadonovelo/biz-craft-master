import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { useStore, type ProducaoPlano, type EtapaProducao } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Trash2, Calendar as CalIcon, Download, Filter, Upload, Eye } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  downloadICS, planoToICS, parseICS, applyIcsToPlano, type IcsOptions,
} from "@/lib/ics";

const uid = () => Math.random().toString(36).slice(2, 10);

const ETAPAS_PADRAO = ["Materiais", "Corte / Preparação", "Produção", "Acabamento", "Embalagem", "Envio"];

const TIMEZONES = [
  "", "Europe/Lisbon", "Europe/Madrid", "Europe/London", "Europe/Paris",
  "Europe/Berlin", "America/New_York", "America/Sao_Paulo", "America/Los_Angeles",
  "UTC",
];

type StatusKey = "nao_iniciado" | "em_progresso" | "feito";
const STATUS_LABEL: Record<StatusKey, string> = {
  nao_iniciado: "Não iniciado",
  em_progresso: "Em progresso",
  feito: "Feito",
};

export const Route = createFileRoute("/planeador-producao")({
  head: () => ({
    meta: [
      { title: "Planeador De Produção" },
      { name: "description", content: "Organiza etapas, tarefas e prazos dos teus projetos." },
    ],
  }),
  component: PlaneadorProducaoPage,
});

function PlaneadorProducaoPage() {
  const { producaoPlanos, projetos, add, update, remove } = useStore();
  const [selId, setSelId] = useState<string | null>(producaoPlanos[0]?.id ?? null);
  const plano = producaoPlanos.find((p) => p.id === selId);

  const [respFilter, setRespFilter] = useState<string>("__all");
  const [statusFilter, setStatusFilter] = useState<"__all" | StatusKey>("__all");
  const [groupBy, setGroupBy] = useState<"etapa" | "responsavel" | "status">("etapa");

  const [icsOpts, setIcsOpts] = useState<IcsOptions>({
    timezone: "Europe/Lisbon",
    includeDescription: true,
    defaultDurationDays: 1,
    taskDurationDays: 1,
  });
  const [icsOpen, setIcsOpen] = useState(false);
  const [icsPreviewOpen, setIcsPreviewOpen] = useState(false);
  const icsImportRef = useRef<HTMLInputElement>(null);

  const icsPreview = useMemo(() => (plano ? planoToICS(plano, icsOpts) : ""), [plano, icsOpts]);
  const icsSummary = useMemo(() => {
    if (!plano) return { etapas: 0, tarefas: 0, comData: 0 };
    const etapas = plano.etapas.length;
    const tarefas = plano.etapas.reduce((n, e) => n + e.tarefas.length, 0);
    const comData = plano.etapas.filter((e) => e.inicio).length
      + plano.etapas.reduce((n, e) => n + e.tarefas.filter((t) => t.prazo).length, 0);
    return { etapas, tarefas, comData };
  }, [plano]);

  const importarICS = async (file: File) => {
    if (!plano) return;
    try {
      const text = await file.text();
      const parsed = parseICS(text);
      const { plano: novo, result } = applyIcsToPlano(plano, parsed);
      patch({ etapas: novo.etapas });
      toast.success(
        `.ics importado — etapas: +${result.etapasCriadas}/~${result.etapasAtualizadas}, ` +
        `tarefas: +${result.tarefasCriadas}/~${result.tarefasAtualizadas}` +
        (result.ignoradas ? ` (${result.ignoradas} ignoradas)` : ""),
      );
    } catch (e: any) {
      toast.error("Falha ao importar .ics: " + (e?.message ?? e));
    }
  };

  const criarPlano = () => {
    const novo: Omit<ProducaoPlano, "id"> = {
      nome: "Novo plano de produção",
      etapas: ETAPAS_PADRAO.map((n): EtapaProducao => ({
        id: uid(), nome: n, concluida: false, tarefas: [],
      })),
      criadoEm: new Date().toISOString(),
    };
    add("producaoPlanos", novo);
    setTimeout(() => {
      const c = useStore.getState().producaoPlanos.slice(-1)[0];
      if (c) setSelId(c.id);
    }, 0);
    toast.success("Plano criado");
  };

  const patch = (p: Partial<ProducaoPlano>) => plano && update("producaoPlanos", plano.id, p);

  const patchEtapa = (eid: string, fn: (e: EtapaProducao) => EtapaProducao) =>
    plano && patch({ etapas: plano.etapas.map((e) => (e.id === eid ? fn(e) : e)) });

  const progresso = useMemo(() => {
    if (!plano) return 0;
    const t = plano.etapas.flatMap((e) => e.tarefas);
    if (!t.length) {
      const feitas = plano.etapas.filter((e) => e.concluida).length;
      return plano.etapas.length ? Math.round((feitas / plano.etapas.length) * 100) : 0;
    }
    return Math.round((t.filter((x) => x.status === "feito" || x.feito).length / t.length) * 100);
  }, [plano]);

  const responsaveis = useMemo(() => {
    if (!plano) return [] as string[];
    return Array.from(
      new Set(plano.etapas.flatMap((e) => e.tarefas.map((t) => t.responsavel).filter((x): x is string => !!x))),
    ).sort();
  }, [plano]);

  const matchesFilter = (t: EtapaProducao["tarefas"][number]) => {
    const st = (t.status ?? (t.feito ? "feito" : "nao_iniciado")) as StatusKey;
    if (statusFilter !== "__all" && st !== statusFilter) return false;
    if (respFilter !== "__all" && (t.responsavel ?? "") !== respFilter) return false;
    return true;
  };

  const grouped = useMemo(() => {
    if (!plano) return [] as { label: string; items: { etapa: string; tarefa: EtapaProducao["tarefas"][number] }[] }[];
    const flat = plano.etapas.flatMap((e) => e.tarefas.filter(matchesFilter).map((t) => ({ etapa: e.nome, tarefa: t })));
    const buckets = new Map<string, typeof flat>();
    for (const it of flat) {
      const key =
        groupBy === "etapa" ? it.etapa
          : groupBy === "responsavel" ? (it.tarefa.responsavel || "— sem responsável")
          : STATUS_LABEL[(it.tarefa.status ?? (it.tarefa.feito ? "feito" : "nao_iniciado")) as StatusKey];
      const arr = buckets.get(key) ?? [];
      arr.push(it);
      buckets.set(key, arr);
    }
    return Array.from(buckets.entries()).map(([label, items]) => ({ label, items }));
  }, [plano, groupBy, statusFilter, respFilter]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Planeador De Produção"
        description="Divide cada projeto em etapas, lista tarefas por etapa e define prazos."
      />

      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-56 flex-1">
          <Label>Plano ativo</Label>
          <Select value={selId ?? ""} onValueChange={setSelId}>
            <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
            <SelectContent>
              {producaoPlanos.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={criarPlano}><Plus className="mr-1 h-4 w-4" />Novo plano</Button>
        {plano && (
          <Dialog open={icsOpen} onOpenChange={setIcsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Download className="mr-1 h-4 w-4" />Exportar .ics
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Opções de exportação .ics</DialogTitle></DialogHeader>
              <div className="grid gap-3">
                <div className="rounded-md border bg-muted/40 p-2 text-xs text-muted-foreground">
                  Calendário: <b>{plano.nome}</b> · Timezone: <b>{icsOpts.timezone || "flutuante"}</b> ·
                  Etapas: <b>{icsSummary.etapas}</b> · Tarefas: <b>{icsSummary.tarefas}</b> ·
                  Eventos com data: <b>{icsSummary.comData}</b> ·
                  Descrição: <b>{icsOpts.includeDescription ? "completa" : "resumida"}</b>
                </div>
                <div>
                  <Label>Fuso horário (TZID)</Label>
                  <Select
                    value={icsOpts.timezone || "__floating"}
                    onValueChange={(v) => setIcsOpts((o) => ({ ...o, timezone: v === "__floating" ? "" : v }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__floating">Sem TZID (flutuante)</SelectItem>
                      {TIMEZONES.filter(Boolean).map((tz) => (
                        <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between rounded-md border p-2">
                  <div>
                    <div className="text-sm font-medium">Descrição completa</div>
                    <div className="text-xs text-muted-foreground">
                      Inclui progresso, tarefas com estado, responsáveis e prazos.
                    </div>
                  </div>
                  <Switch
                    checked={!!icsOpts.includeDescription}
                    onCheckedChange={(c) => setIcsOpts((o) => ({ ...o, includeDescription: c }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Duração etapa (dias) sem fim</Label>
                    <Input
                      type="number" min={1}
                      value={icsOpts.defaultDurationDays ?? 1}
                      onChange={(e) => setIcsOpts((o) => ({ ...o, defaultDurationDays: Math.max(1, +e.target.value || 1) }))}
                    />
                  </div>
                  <div>
                    <Label>Duração tarefa (dias)</Label>
                    <Input
                      type="number" min={1}
                      value={icsOpts.taskDurationDays ?? 1}
                      onChange={(e) => setIcsOpts((o) => ({ ...o, taskDurationDays: Math.max(1, +e.target.value || 1) }))}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIcsPreviewOpen(true)}>
                  <Eye className="mr-1 h-4 w-4" />Pré-visualizar
                </Button>
                <Button
                  onClick={() => {
                    downloadICS(plano, icsOpts);
                    setIcsOpen(false);
                    toast.success("Calendário .ics exportado");
                  }}
                >
                  <Download className="mr-1 h-4 w-4" />Exportar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
        {plano && (
          <>
            <input
              ref={icsImportRef} type="file" accept=".ics,text/calendar" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) importarICS(f); e.target.value = ""; }}
            />
            <Button variant="outline" onClick={() => icsImportRef.current?.click()}>
              <Upload className="mr-1 h-4 w-4" />Importar .ics
            </Button>
          </>
        )}
        {plano && (
          <Button variant="ghost" onClick={() => { remove("producaoPlanos", plano.id); setSelId(null); }}>
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <Dialog open={icsPreviewOpen} onOpenChange={setIcsPreviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Pré-visualização do .ics</DialogTitle></DialogHeader>
          {plano && (
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">
                Calendário <b>{plano.nome}</b> · Timezone <b>{icsOpts.timezone || "flutuante"}</b> ·
                {" "}{icsSummary.etapas} etapas, {icsSummary.tarefas} tarefas, {icsSummary.comData} eventos com data.
                Descrição {icsOpts.includeDescription ? "completa" : "resumida"}.
              </div>
              <pre className="max-h-[50vh] overflow-auto rounded-md border bg-muted/30 p-2 text-[11px] leading-relaxed">
{icsPreview}
              </pre>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIcsPreviewOpen(false)}>Fechar</Button>
            {plano && (
              <Button onClick={() => { downloadICS(plano, icsOpts); setIcsPreviewOpen(false); setIcsOpen(false); toast.success("Calendário .ics exportado"); }}>
                <Download className="mr-1 h-4 w-4" />Descarregar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {!plano ? (
        <Card className="p-10 text-center text-muted-foreground">
          Cria o teu primeiro plano para organizar prazos.
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="grid gap-3 p-4 sm:grid-cols-[1fr_240px_auto]">
              <div>
                <Label>Nome</Label>
                <Input value={plano.nome} onChange={(e) => patch({ nome: e.target.value })} />
              </div>
              <div>
                <Label>Projeto associado</Label>
                <Select value={plano.projetoId ?? ""} onValueChange={(v) => patch({ projetoId: v || undefined })}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    {projetos.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <div className="w-full space-y-1">
                  <div className="text-xs text-muted-foreground">Progresso</div>
                  <Progress value={progresso} />
                  <div className="text-right text-xs font-medium">{progresso}%</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-display flex items-center gap-2">
                <Filter className="h-4 w-4" /> Filtros & vistas
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              <div>
                <Label>Responsável</Label>
                <Select value={respFilter} onValueChange={setRespFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all">Todos</SelectItem>
                    <SelectItem value="">— sem responsável</SelectItem>
                    {responsaveis.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all">Todos</SelectItem>
                    <SelectItem value="nao_iniciado">Não iniciado</SelectItem>
                    <SelectItem value="em_progresso">Em progresso</SelectItem>
                    <SelectItem value="feito">Feito</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Agrupar por</Label>
                <Select value={groupBy} onValueChange={(v) => setGroupBy(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="etapa">Etapa</SelectItem>
                    <SelectItem value="responsavel">Responsável</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {(respFilter !== "__all" || statusFilter !== "__all" || groupBy !== "etapa") && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-display">Vista agrupada</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {grouped.length === 0 && (
                  <div className="text-sm text-muted-foreground">Nenhuma tarefa corresponde aos filtros.</div>
                )}
                {grouped.map((g) => (
                  <div key={g.label} className="rounded-md border p-2">
                    <div className="mb-1 flex items-center justify-between">
                      <div className="font-medium">{g.label}</div>
                      <Badge variant="outline">{g.items.length}</Badge>
                    </div>
                    <ul className="space-y-1 text-sm">
                      {g.items.map(({ etapa, tarefa }) => {
                        const st = (tarefa.status ?? (tarefa.feito ? "feito" : "nao_iniciado")) as StatusKey;
                        return (
                          <li key={tarefa.id} className="flex flex-wrap items-center gap-2">
                            <Badge variant="secondary" className="text-[10px]">{etapa}</Badge>
                            <span className={st === "feito" ? "line-through text-muted-foreground" : ""}>
                              {tarefa.texto || "(sem texto)"}
                            </span>
                            {tarefa.responsavel && (
                              <Badge variant="outline" className="text-[10px]">{tarefa.responsavel}</Badge>
                            )}
                            {tarefa.prazo && (
                              <span className="text-xs text-muted-foreground">· {tarefa.prazo}</span>
                            )}
                            <Badge className="ml-auto text-[10px]" variant={st === "feito" ? "default" : "outline"}>
                              {STATUS_LABEL[st]}
                            </Badge>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <div className="space-y-3">
            {plano.etapas.map((etapa, i) => (
              <Card key={etapa.id}>
                <CardHeader className="flex flex-row items-center gap-2 pb-2">
                  <Checkbox
                    checked={etapa.concluida}
                    onCheckedChange={(c) => patchEtapa(etapa.id, (e) => ({ ...e, concluida: !!c }))}
                  />
                  <Input
                    value={etapa.nome}
                    onChange={(e) => patchEtapa(etapa.id, (x) => ({ ...x, nome: e.target.value }))}
                    className="font-display max-w-xs"
                  />
                  <Badge variant="outline" className="text-xs">Etapa {i + 1}</Badge>
                  <div className="ml-auto flex items-center gap-2">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <CalIcon className="h-3 w-3" /> Início
                    </div>
                    <Input
                      type="date" className="h-8 w-36"
                      value={etapa.inicio ?? ""}
                      onChange={(e) => patchEtapa(etapa.id, (x) => ({ ...x, inicio: e.target.value }))}
                    />
                    <div className="text-xs text-muted-foreground">Fim</div>
                    <Input
                      type="date" className="h-8 w-36"
                      value={etapa.fim ?? ""}
                      onChange={(e) => patchEtapa(etapa.id, (x) => ({ ...x, fim: e.target.value }))}
                    />
                    <Button
                      variant="ghost" size="icon"
                      onClick={() => patch({ etapas: plano.etapas.filter((e) => e.id !== etapa.id) })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {etapa.tarefas.map((t) => (
                    <div key={t.id} className="grid grid-cols-[auto_1fr_160px_150px_140px_auto] items-center gap-2">
                      <Checkbox
                        checked={t.status === "feito" || t.feito}
                        onCheckedChange={(c) => patchEtapa(etapa.id, (e) => ({
                          ...e, tarefas: e.tarefas.map((x) => x.id === t.id ? { ...x, feito: !!c, status: c ? "feito" : "nao_iniciado" } : x),
                        }))}
                      />
                      <Input
                        value={t.texto}
                        onChange={(e) => patchEtapa(etapa.id, (x) => ({
                          ...x, tarefas: x.tarefas.map((y) => y.id === t.id ? { ...y, texto: e.target.value } : y),
                        }))}
                        className={(t.status === "feito" || t.feito) ? "line-through text-muted-foreground" : ""}
                      />
                      <Input
                        placeholder="Responsável"
                        value={t.responsavel ?? ""}
                        onChange={(e) => patchEtapa(etapa.id, (x) => ({
                          ...x, tarefas: x.tarefas.map((y) => y.id === t.id ? { ...y, responsavel: e.target.value } : y),
                        }))}
                      />
                      <Input
                        type="date"
                        value={t.prazo ?? ""}
                        onChange={(e) => patchEtapa(etapa.id, (x) => ({
                          ...x, tarefas: x.tarefas.map((y) => y.id === t.id ? { ...y, prazo: e.target.value } : y),
                        }))}
                      />
                      <Select
                        value={t.status ?? (t.feito ? "feito" : "nao_iniciado")}
                        onValueChange={(v) => patchEtapa(etapa.id, (x) => ({
                          ...x, tarefas: x.tarefas.map((y) => y.id === t.id ? { ...y, status: v as any, feito: v === "feito" } : y),
                        }))}
                      >
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="nao_iniciado">Não iniciado</SelectItem>
                          <SelectItem value="em_progresso">Em progresso</SelectItem>
                          <SelectItem value="feito">Feito</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost" size="icon"
                        onClick={() => patchEtapa(etapa.id, (x) => ({
                          ...x, tarefas: x.tarefas.filter((y) => y.id !== t.id),
                        }))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    size="sm" variant="outline"
                    onClick={() => patchEtapa(etapa.id, (x) => ({
                      ...x, tarefas: [...x.tarefas, { id: uid(), texto: "", feito: false, status: "nao_iniciado" }],
                    }))}
                  >
                    <Plus className="mr-1 h-4 w-4" />Tarefa
                  </Button>
                </CardContent>
              </Card>
            ))}
            <Button
              variant="outline"
              onClick={() => patch({
                etapas: [...plano.etapas, { id: uid(), nome: "Nova etapa", concluida: false, tarefas: [] }],
              })}
            >
              <Plus className="mr-1 h-4 w-4" />Adicionar etapa
            </Button>
          </div>
        </>
      )}
    </div>
  );
}