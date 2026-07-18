import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Pencil, Check, X } from "lucide-react";

export const Route = createFileRoute("/todo")({
  head: () => ({ meta: [{ title: "Tarefas" }] }),
  component: () => {
    const { todos, projetos, add, update, remove } = useStore();
    const [titulo, setTitulo] = useState("");
    const [prioridade, setPrioridade] = useState<"baixa" | "media" | "alta">("media");
    const [projetoId, setProjetoId] = useState<string>("none");
    const [filtroProjeto, setFiltroProjeto] = useState<string>("all");
    const [editId, setEditId] = useState<string | null>(null);
    const [editTitulo, setEditTitulo] = useState("");
    const [editProjetoId, setEditProjetoId] = useState<string>("none");
    const [editPrioridade, setEditPrioridade] = useState<"baixa" | "media" | "alta">("media");

    const criar = () => {
      if (!titulo.trim()) return;
      add("todos", {
        titulo: titulo.trim(),
        prioridade,
        feito: false,
        projetoId: projetoId === "none" ? undefined : projetoId,
      });
      setTitulo("");
    };

    const iniciarEdicao = (t: typeof todos[number]) => {
      setEditId(t.id);
      setEditTitulo(t.titulo);
      setEditProjetoId(t.projetoId ?? "none");
      setEditPrioridade(t.prioridade);
    };
    const guardarEdicao = () => {
      if (!editId || !editTitulo.trim()) return;
      update("todos", editId, {
        titulo: editTitulo.trim(),
        prioridade: editPrioridade,
        projetoId: editProjetoId === "none" ? undefined : editProjetoId,
      });
      setEditId(null);
    };

    const filtrados = useMemo(() => {
      if (filtroProjeto === "all") return todos;
      if (filtroProjeto === "none") return todos.filter((t) => !t.projetoId);
      return todos.filter((t) => t.projetoId === filtroProjeto);
    }, [todos, filtroProjeto]);

    const porProjeto = useMemo(() => {
      const map = new Map<string, number>();
      todos.forEach((t) => {
        const k = t.projetoId ?? "__none__";
        map.set(k, (map.get(k) ?? 0) + (t.feito ? 0 : 1));
      });
      return map;
    }, [todos]);

    const nomeProjeto = (id?: string) => projetos.find((p) => p.id === id)?.nome;

    return (
      <div className="space-y-6">
        <PageHeader title="Tarefas" description="Tarefas do atelier." />
        <Card>
          <CardContent className="flex flex-wrap gap-2 p-4">
            <Input
              className="flex-1 min-w-[200px]"
              placeholder="Nova tarefa…"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") criar(); }}
            />
            <Select value={prioridade} onValueChange={(v: any) => setPrioridade(v)}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="baixa">Baixa</SelectItem>
                <SelectItem value="media">Média</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
              </SelectContent>
            </Select>
            <Select value={projetoId} onValueChange={setProjetoId}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Projeto" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem projeto</SelectItem>
                {projetos.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={criar}><Plus className="mr-1 h-4 w-4" />Adicionar</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Filtrar por projeto</CardTitle></CardHeader>
          <CardContent className="p-4 pt-0">
            <Select value={filtroProjeto} onValueChange={setFiltroProjeto}>
              <SelectTrigger className="w-full sm:w-72"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os projetos ({todos.filter((t) => !t.feito).length} por fazer)</SelectItem>
                <SelectItem value="none">Sem projeto ({porProjeto.get("__none__") ?? 0})</SelectItem>
                {projetos.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.nome} ({porProjeto.get(p.id) ?? 0})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <div className="space-y-2">
          {filtrados.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">Sem tarefas neste filtro.</p>
          )}
          {filtrados.map((t) => {
            const emEdicao = editId === t.id;
            return (
              <div key={t.id} className="rounded-md border border-border bg-card p-3">
                {emEdicao ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <Input className="flex-1 min-w-[180px]" value={editTitulo} onChange={(e) => setEditTitulo(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") guardarEdicao(); }} />
                    <Select value={editPrioridade} onValueChange={(v: any) => setEditPrioridade(v)}>
                      <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="baixa">Baixa</SelectItem>
                        <SelectItem value="media">Média</SelectItem>
                        <SelectItem value="alta">Alta</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={editProjetoId} onValueChange={setEditProjetoId}>
                      <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sem projeto</SelectItem>
                        {projetos.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button size="icon" onClick={guardarEdicao}><Check className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => setEditId(null)}><X className="h-4 w-4" /></Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Checkbox checked={t.feito} onCheckedChange={(c) => update("todos", t.id, { feito: !!c })} />
                      <div className="min-w-0">
                        <div className={"truncate " + (t.feito ? "line-through text-muted-foreground" : "")}>{t.titulo}</div>
                        {t.projetoId && (
                          <div className="text-xs text-muted-foreground truncate">Projeto: {nomeProjeto(t.projetoId) ?? "—"}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={t.prioridade === "alta" ? "destructive" : t.prioridade === "media" ? "default" : "secondary"}>{t.prioridade}</Badge>
                      <Button variant="ghost" size="icon" onClick={() => iniciarEdicao(t)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => remove("todos", t.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  },
});