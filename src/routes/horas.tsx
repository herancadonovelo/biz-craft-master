import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/horas")({
  head: () => ({ meta: [{ title: "Registo de horas" }] }),
  component: () => {
    const { horas, projetos, add, remove, update } = useStore();
    const [form, setForm] = useState({ projetoId: "", data: new Date().toISOString().slice(0, 10), horas: 1, descricao: "" });

    const submit = () => {
      if (!form.projetoId) return toast.error("Escolhe um projeto");
      add("horas", form);
      // also bump project hours
      const p = projetos.find((x) => x.id === form.projetoId);
      if (p) update("projetos", p.id, { horasTrabalhadas: p.horasTrabalhadas + form.horas });
      toast.success("Registo adicionado");
      setForm({ projetoId: "", data: new Date().toISOString().slice(0, 10), horas: 1, descricao: "" });
    };

    return (
      <div className="space-y-6">
        <PageHeader title="Registo de horas" description="Tempo trabalhado em cada projeto." />
        <Card><CardContent className="grid gap-3 p-4 md:grid-cols-5">
          <div><Label>Projeto</Label>
            <Select value={form.projetoId} onValueChange={(v) => setForm({ ...form, projetoId: v })}>
              <SelectTrigger><SelectValue placeholder="Escolher" /></SelectTrigger>
              <SelectContent>{projetos.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Data</Label><Input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} /></div>
          <div><Label>Horas</Label><Input type="number" step="0.25" value={form.horas} onChange={(e) => setForm({ ...form, horas: +e.target.value })} /></div>
          <div className="md:col-span-2"><Label>Descrição</Label><Input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} /></div>
          <div className="md:col-span-5"><Button onClick={submit}><Plus className="mr-1 h-4 w-4" />Registar</Button></div>
        </CardContent></Card>
        <Card><CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Projeto</TableHead><TableHead>Horas</TableHead><TableHead>Descrição</TableHead><TableHead></TableHead></TableRow></TableHeader>
            <TableBody>
              {horas.map((h) => {
                const p = projetos.find((x) => x.id === h.projetoId);
                return (
                  <TableRow key={h.id}>
                    <TableCell>{h.data}</TableCell>
                    <TableCell>{p?.nome ?? "—"}</TableCell>
                    <TableCell className="font-display">{h.horas}h</TableCell>
                    <TableCell className="text-muted-foreground">{h.descricao}</TableCell>
                    <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => remove("horas", h.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent></Card>
      </div>
    );
  },
});