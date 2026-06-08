import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore, formatEUR } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export const Route = createFileRoute("/faturacao")({
  head: () => ({ meta: [{ title: "Faturação" }] }),
  component: () => {
    const { faturas, clientes, encomendas, projetos, cursos, add, remove, update } = useStore();
    const [tipo, setTipo] = useState<"projeto" | "curso" | "outro">("projeto");
    const [form, setForm] = useState({ numero: "", clienteId: "", encomendaId: "", projetoId: "", cursoId: "", valor: 0, iva: 23, estado: "rascunho" as const, data: new Date().toISOString().slice(0, 10) });
    const faturasFiltradas = faturas.filter((f) => (f.tipo ?? "projeto") === tipo);
    return (
      <div className="space-y-6">
        <PageHeader title="Faturação" description="Emissão e acompanhamento de faturas de projetos e cursos." />
        <Tabs value={tipo} onValueChange={(v: any) => setTipo(v)}>
          <TabsList>
            <TabsTrigger value="projeto">Projetos</TabsTrigger>
            <TabsTrigger value="curso">Cursos</TabsTrigger>
            <TabsTrigger value="outro">Outras</TabsTrigger>
          </TabsList>
        </Tabs>
        <Card><CardContent className="grid gap-3 p-4 md:grid-cols-6">
          <div><Label>Nº</Label><Input value={form.numero} onChange={(e) => setForm({ ...form, numero: e.target.value })} placeholder="FT 2026/002" /></div>
          <div><Label>Cliente</Label>
            <Select value={form.clienteId} onValueChange={(v) => setForm({ ...form, clienteId: v })}>
              <SelectTrigger><SelectValue placeholder="Escolher" /></SelectTrigger>
              <SelectContent>{clientes.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {tipo === "projeto" && (
            <div><Label>Projeto</Label>
              <Select value={form.projetoId} onValueChange={(v) => setForm({ ...form, projetoId: v })}>
                <SelectTrigger><SelectValue placeholder="(opcional)" /></SelectTrigger>
                <SelectContent>{projetos.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          {tipo === "curso" && (
            <div><Label>Curso</Label>
              <Select value={form.cursoId} onValueChange={(v) => setForm({ ...form, cursoId: v })}>
                <SelectTrigger><SelectValue placeholder="(opcional)" /></SelectTrigger>
                <SelectContent>{cursos.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          {tipo === "outro" && (
            <div><Label>Encomenda</Label>
              <Select value={form.encomendaId} onValueChange={(v) => setForm({ ...form, encomendaId: v })}>
                <SelectTrigger><SelectValue placeholder="(opcional)" /></SelectTrigger>
                <SelectContent>{encomendas.map((e) => <SelectItem key={e.id} value={e.id}>{e.descricao}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          <div><Label>Valor</Label><Input type="number" value={form.valor} onChange={(e) => setForm({ ...form, valor: +e.target.value })} /></div>
          <div><Label>IVA %</Label><Input type="number" value={form.iva} onChange={(e) => setForm({ ...form, iva: +e.target.value })} /></div>
          <div><Label>Data</Label><Input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} /></div>
          <div className="md:col-span-6"><Button onClick={() => {
            if (!form.numero) return toast.error("Número obrigatório");
            add("faturas", { ...form, tipo } as any);
            setForm({ numero: "", clienteId: "", encomendaId: "", projetoId: "", cursoId: "", valor: 0, iva: 23, estado: "rascunho", data: new Date().toISOString().slice(0, 10) });
            toast.success("Fatura criada");
          }}><Plus className="mr-1 h-4 w-4" />Criar fatura</Button></div>
        </CardContent></Card>
        <Card><CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Nº</TableHead><TableHead>Cliente</TableHead><TableHead>Data</TableHead><TableHead>Valor s/ IVA</TableHead><TableHead>Total</TableHead><TableHead>Estado</TableHead><TableHead></TableHead></TableRow></TableHeader>
            <TableBody>
              {faturasFiltradas.map((f) => {
                const c = clientes.find((x) => x.id === f.clienteId);
                const total = f.valor * (1 + f.iva / 100);
                return (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">{f.numero}</TableCell>
                    <TableCell>{c?.nome ?? "—"}</TableCell>
                    <TableCell>{f.data}</TableCell>
                    <TableCell>{formatEUR(f.valor)}</TableCell>
                    <TableCell className="font-display">{formatEUR(total)}</TableCell>
                    <TableCell>
                      <Select value={f.estado} onValueChange={(v: any) => update("faturas", f.id, { estado: v })}>
                        <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="rascunho">Rascunho</SelectItem>
                          <SelectItem value="emitida">Emitida</SelectItem>
                          <SelectItem value="paga">Paga</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => remove("faturas", f.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
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