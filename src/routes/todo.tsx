import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/todo")({
  head: () => ({ meta: [{ title: "To-do" }] }),
  component: () => {
    const { todos, add, update, remove } = useStore();
    const [titulo, setTitulo] = useState("");
    const [prioridade, setPrioridade] = useState<"baixa" | "media" | "alta">("media");
    return (
      <div className="space-y-6">
        <PageHeader title="To-do list" description="Tarefas do atelier." />
        <Card><CardContent className="flex flex-wrap gap-2 p-4">
          <Input className="flex-1 min-w-[200px]" placeholder="Nova tarefa…" value={titulo} onChange={(e) => setTitulo(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && titulo) { add("todos", { titulo, prioridade, feito: false }); setTitulo(""); } }} />
          <Select value={prioridade} onValueChange={(v: any) => setPrioridade(v)}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="baixa">Baixa</SelectItem><SelectItem value="media">Média</SelectItem><SelectItem value="alta">Alta</SelectItem></SelectContent>
          </Select>
          <Button onClick={() => { if (!titulo) return; add("todos", { titulo, prioridade, feito: false }); setTitulo(""); }}><Plus className="mr-1 h-4 w-4" />Adicionar</Button>
        </CardContent></Card>
        <div className="space-y-2">
          {todos.map((t) => (
            <div key={t.id} className="flex items-center justify-between rounded-md border border-border bg-card p-3">
              <div className="flex items-center gap-3">
                <Checkbox checked={t.feito} onCheckedChange={(c) => update("todos", t.id, { feito: !!c })} />
                <span className={t.feito ? "line-through text-muted-foreground" : ""}>{t.titulo}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={t.prioridade === "alta" ? "destructive" : t.prioridade === "media" ? "default" : "secondary"}>{t.prioridade}</Badge>
                <Button variant="ghost" size="icon" onClick={() => remove("todos", t.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  },
});