import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
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
import { Plus, Trash2, Calendar as CalIcon, CalendarDown, Download } from "lucide-react";
import { toast } from "sonner";
import { downloadICS } from "@/lib/ics";

const uid = () => Math.random().toString(36).slice(2, 10);

const ETAPAS_PADRAO = ["Materiais", "Corte / Preparação", "Produção", "Acabamento", "Embalagem", "Envio"];

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
          <Button variant="outline" onClick={() => { downloadICS(plano); toast.success("Calendário .ics exportado"); }}>
            <Download className="mr-1 h-4 w-4" />Exportar .ics
          </Button>
        )}
        {plano && (
          <Button variant="ghost" onClick={() => { remove("producaoPlanos", plano.id); setSelId(null); }}>
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

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
                    <div key={t.id} className="grid grid-cols-[auto_1fr_150px_auto] items-center gap-2">
                      <Checkbox
                        checked={t.feito}
                        onCheckedChange={(c) => patchEtapa(etapa.id, (e) => ({
                          ...e, tarefas: e.tarefas.map((x) => x.id === t.id ? { ...x, feito: !!c } : x),
                        }))}
                      />
                      <Input
                        value={t.texto}
                        onChange={(e) => patchEtapa(etapa.id, (x) => ({
                          ...x, tarefas: x.tarefas.map((y) => y.id === t.id ? { ...y, texto: e.target.value } : y),
                        }))}
                        className={t.feito ? "line-through text-muted-foreground" : ""}
                      />
                      <Input
                        type="date"
                        value={t.prazo ?? ""}
                        onChange={(e) => patchEtapa(etapa.id, (x) => ({
                          ...x, tarefas: x.tarefas.map((y) => y.id === t.id ? { ...y, prazo: e.target.value } : y),
                        }))}
                      />
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
                      ...x, tarefas: [...x.tarefas, { id: uid(), texto: "", feito: false }],
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