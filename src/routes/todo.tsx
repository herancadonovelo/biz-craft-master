import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { useStore, type Todo } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Trash2, Pencil, Check, X, GripVertical, Bell, CalendarClock, Search } from "lucide-react";

type Estado = "por_fazer" | "em_progresso" | "concluida";

const estadoDe = (t: Todo): Estado =>
  t.estado ?? (t.feito ? "concluida" : "por_fazer");

const prioRank: Record<Todo["prioridade"], number> = { alta: 0, media: 1, baixa: 2 };

const isVencida = (t: Todo) => {
  if (!t.prazo || estadoDe(t) === "concluida") return false;
  return new Date(t.prazo).getTime() < Date.now() - 24 * 3600 * 1000;
};
const venceEmBreve = (t: Todo) => {
  if (!t.prazo || estadoDe(t) === "concluida") return false;
  const d = new Date(t.prazo).getTime() - Date.now();
  return d >= -24 * 3600 * 1000 && d <= 3 * 24 * 3600 * 1000;
};

export const Route = createFileRoute("/todo")({
  head: () => ({ meta: [{ title: "Tarefas" }] }),
  component: () => {
    const { todos, projetos, add, update, remove } = useStore();
    const [titulo, setTitulo] = useState("");
    const [prioridade, setPrioridade] = useState<"baixa" | "media" | "alta">("media");
    const [projetoId, setProjetoId] = useState<string>("none");
    const [prazo, setPrazo] = useState<string>("");
    const [lembrete, setLembrete] = useState<string>("");

    const [filtroProjeto, setFiltroProjeto] = useState<string>("all");
    const [ordenar, setOrdenar] = useState<"manual" | "prazo" | "prioridade" | "projeto">("manual");
    const [pesquisa, setPesquisa] = useState("");
    const [aba, setAba] = useState<Estado | "todas">("todas");

    const [editId, setEditId] = useState<string | null>(null);
    const [editData, setEditData] = useState<Partial<Todo>>({});

    const criar = () => {
      if (!titulo.trim()) return;
      add("todos", {
        titulo: titulo.trim(),
        prioridade,
        feito: false,
        estado: "por_fazer",
        projetoId: projetoId === "none" ? undefined : projetoId,
        prazo: prazo || undefined,
        lembrete: lembrete || undefined,
        ordem: Date.now(),
      });
      setTitulo("");
      setPrazo("");
      setLembrete("");
    };

    const iniciarEdicao = (t: Todo) => {
      setEditId(t.id);
      setEditData({
        titulo: t.titulo,
        prioridade: t.prioridade,
        projetoId: t.projetoId,
        prazo: t.prazo,
        lembrete: t.lembrete,
        estado: estadoDe(t),
      });
    };
    const guardarEdicao = () => {
      if (!editId || !editData.titulo?.trim()) return;
      const est = (editData.estado ?? "por_fazer") as Estado;
      update("todos", editId, {
        titulo: editData.titulo.trim(),
        prioridade: editData.prioridade,
        projetoId: editData.projetoId || undefined,
        prazo: editData.prazo || undefined,
        lembrete: editData.lembrete || undefined,
        estado: est,
        feito: est === "concluida",
      });
      setEditId(null);
      setEditData({});
    };

    const setEstado = (t: Todo, est: Estado) => {
      update("todos", t.id, { estado: est, feito: est === "concluida" });
    };

    const filtrados = useMemo(() => {
      let arr = todos.slice();
      if (filtroProjeto !== "all") {
        arr = filtroProjeto === "none"
          ? arr.filter((t) => !t.projetoId)
          : arr.filter((t) => t.projetoId === filtroProjeto);
      }
      if (aba !== "todas") arr = arr.filter((t) => estadoDe(t) === aba);
      const q = pesquisa.trim().toLowerCase();
      if (q) arr = arr.filter((t) => t.titulo.toLowerCase().includes(q));
      if (ordenar === "prazo") {
        arr.sort((a, b) => (a.prazo ?? "9999").localeCompare(b.prazo ?? "9999"));
      } else if (ordenar === "prioridade") {
        arr.sort((a, b) => prioRank[a.prioridade] - prioRank[b.prioridade]);
      } else if (ordenar === "projeto") {
        arr.sort((a, b) => (a.projetoId ?? "zzz").localeCompare(b.projetoId ?? "zzz"));
      } else {
        arr.sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
      }
      return arr;
    }, [todos, filtroProjeto, aba, pesquisa, ordenar]);

    // Drag and drop reorder (manual only)
    const dragId = useRef<string | null>(null);
    const onDragStart = (id: string) => { dragId.current = id; };
    const onDropOn = (targetId: string) => {
      const src = dragId.current;
      dragId.current = null;
      if (!src || src === targetId || ordenar !== "manual") return;
      const arr = todos.slice().sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
      const from = arr.findIndex((t) => t.id === src);
      const to = arr.findIndex((t) => t.id === targetId);
      if (from < 0 || to < 0) return;
      const [it] = arr.splice(from, 1);
      arr.splice(to, 0, it);
      useStore.setState((s: any) => ({
        todos: s.todos.map((t: Todo) => ({
          ...t,
          ordem: arr.findIndex((x) => x.id === t.id),
        })),
      }));
    };

    const porProjeto = useMemo(() => {
      const map = new Map<string, number>();
      todos.forEach((t) => {
        const k = t.projetoId ?? "__none__";
        map.set(k, (map.get(k) ?? 0) + (estadoDe(t) === "concluida" ? 0 : 1));
      });
      return map;
    }, [todos]);

    const contas = useMemo(() => {
      const c = { todas: todos.length, por_fazer: 0, em_progresso: 0, concluida: 0 } as Record<string, number>;
      todos.forEach((t) => { c[estadoDe(t)]++; });
      return c;
    }, [todos]);

    const nomeProjeto = (id?: string) => projetos.find((p) => p.id === id)?.nome;

    return (
      <div className="space-y-6">
        <PageHeader title="Tarefas" description="Tarefas do atelier." />

        <Card>
          <CardContent className="grid gap-2 p-4 sm:grid-cols-2 lg:grid-cols-3">
            <Input
              className="sm:col-span-2 lg:col-span-3"
              placeholder="Nova tarefa…"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") criar(); }}
            />
            <Select value={prioridade} onValueChange={(v: any) => setPrioridade(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="baixa">Baixa</SelectItem>
                <SelectItem value="media">Média</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
              </SelectContent>
            </Select>
            <Select value={projetoId} onValueChange={setProjetoId}>
              <SelectTrigger><SelectValue placeholder="Projeto" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem projeto</SelectItem>
                {projetos.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Input type="date" value={prazo} onChange={(e) => setPrazo(e.target.value)} title="Data de entrega" />
              <Input type="datetime-local" value={lembrete} onChange={(e) => setLembrete(e.target.value)} title="Lembrete" />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <Button onClick={criar} className="w-full sm:w-auto"><Plus className="mr-1 h-4 w-4" />Adicionar</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="grid gap-2 p-4 md:grid-cols-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-8" placeholder="Pesquisar tarefas…" value={pesquisa} onChange={(e) => setPesquisa(e.target.value)} />
            </div>
            <Select value={filtroProjeto} onValueChange={setFiltroProjeto}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os projetos ({todos.filter((t) => estadoDe(t) !== "concluida").length} por fazer)</SelectItem>
                <SelectItem value="none">Sem projeto ({porProjeto.get("__none__") ?? 0})</SelectItem>
                {projetos.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.nome} ({porProjeto.get(p.id) ?? 0})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={ordenar} onValueChange={(v: any) => setOrdenar(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Ordem manual (drag)</SelectItem>
                <SelectItem value="prazo">Por data de entrega</SelectItem>
                <SelectItem value="prioridade">Por prioridade</SelectItem>
                <SelectItem value="projeto">Por projeto</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Tabs value={aba} onValueChange={(v: any) => setAba(v)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="todas">Todas ({contas.todas})</TabsTrigger>
            <TabsTrigger value="por_fazer">Por fazer ({contas.por_fazer})</TabsTrigger>
            <TabsTrigger value="em_progresso">Em progresso ({contas.em_progresso})</TabsTrigger>
            <TabsTrigger value="concluida">Concluídas ({contas.concluida})</TabsTrigger>
          </TabsList>
          <TabsContent value={aba} className="space-y-2 mt-4">
          {filtrados.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">Sem tarefas neste filtro.</p>
          )}
          {filtrados.map((t) => {
            const emEdicao = editId === t.id;
            const est = estadoDe(t);
            const vencida = isVencida(t);
            const embreve = !vencida && venceEmBreve(t);
            return (
              <div
                key={t.id}
                draggable={ordenar === "manual" && !emEdicao}
                onDragStart={() => onDragStart(t.id)}
                onDragOver={(e) => { if (ordenar === "manual") e.preventDefault(); }}
                onDrop={() => onDropOn(t.id)}
                className={`rounded-md border p-3 transition ${
                  vencida ? "border-destructive/60 bg-destructive/5"
                  : embreve ? "border-amber-400/60 bg-amber-50/40 dark:bg-amber-950/20"
                  : "border-border bg-card"
                }`}
              >
                {emEdicao ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input
                      className="sm:col-span-2"
                      value={editData.titulo ?? ""}
                      onChange={(e) => setEditData((d) => ({ ...d, titulo: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === "Enter") guardarEdicao(); }}
                    />
                    <Select value={editData.prioridade ?? "media"} onValueChange={(v: any) => setEditData((d) => ({ ...d, prioridade: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="baixa">Baixa</SelectItem>
                        <SelectItem value="media">Média</SelectItem>
                        <SelectItem value="alta">Alta</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={editData.projetoId ?? "none"} onValueChange={(v) => setEditData((d) => ({ ...d, projetoId: v === "none" ? undefined : v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sem projeto</SelectItem>
                        {projetos.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={(editData.estado ?? "por_fazer") as Estado} onValueChange={(v: any) => setEditData((d) => ({ ...d, estado: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="por_fazer">Por fazer</SelectItem>
                        <SelectItem value="em_progresso">Em progresso</SelectItem>
                        <SelectItem value="concluida">Concluída</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input type="date" value={editData.prazo ?? ""} onChange={(e) => setEditData((d) => ({ ...d, prazo: e.target.value }))} />
                    <Input type="datetime-local" value={editData.lembrete ?? ""} onChange={(e) => setEditData((d) => ({ ...d, lembrete: e.target.value }))} />
                    <div className="flex justify-end gap-2 sm:col-span-2">
                      <Button size="sm" variant="ghost" onClick={() => { setEditId(null); setEditData({}); }}><X className="mr-1 h-4 w-4" />Cancelar</Button>
                      <Button size="sm" onClick={guardarEdicao}><Check className="mr-1 h-4 w-4" />Guardar</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {ordenar === "manual" && (
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab shrink-0" />
                      )}
                      <Checkbox
                        checked={est === "concluida"}
                        onCheckedChange={(c) => setEstado(t, c ? "concluida" : "por_fazer")}
                      />
                      <div className="min-w-0">
                        <div className={"truncate " + (est === "concluida" ? "line-through text-muted-foreground" : "")}>{t.titulo}</div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                          {t.projetoId && <span className="truncate">Projeto: {nomeProjeto(t.projetoId) ?? "—"}</span>}
                          {t.prazo && (
                            <span className={`inline-flex items-center gap-1 ${vencida ? "text-destructive font-medium" : embreve ? "text-amber-600 dark:text-amber-400" : ""}`}>
                              <CalendarClock className="h-3 w-3" />{new Date(t.prazo).toLocaleDateString()}
                              {vencida && " · vencida"}
                              {embreve && " · em breve"}
                            </span>
                          )}
                          {t.lembrete && (
                            <span className="inline-flex items-center gap-1"><Bell className="h-3 w-3" />{new Date(t.lembrete).toLocaleString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Select value={est} onValueChange={(v: any) => setEstado(t, v)}>
                        <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="por_fazer">Por fazer</SelectItem>
                          <SelectItem value="em_progresso">Em progresso</SelectItem>
                          <SelectItem value="concluida">Concluída</SelectItem>
                        </SelectContent>
                      </Select>
                      <Badge variant={t.prioridade === "alta" ? "destructive" : t.prioridade === "media" ? "default" : "secondary"}>{t.prioridade}</Badge>
                      <Button variant="ghost" size="icon" onClick={() => iniciarEdicao(t)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => remove("todos", t.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          </TabsContent>
        </Tabs>
      </div>
    );
  },
});