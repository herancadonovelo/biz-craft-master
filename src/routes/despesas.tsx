import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore, formatEUR } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/despesas")({
  head: () => ({ meta: [{ title: "Despesas fixas" }] }),
  component: () => {
    const { despesas, add, remove } = useStore();
    const [form, setForm] = useState({ nome: "", valor: 0, periodicidade: "mensal" as const });
    const mensal = despesas.reduce((s, d) => s + (d.periodicidade === "mensal" ? d.valor : d.valor / 12), 0);
    return (
      <div className="space-y-6">
        <PageHeader title="Custos Fixos & Variáveis" description={`Total mensal estimado: ${formatEUR(mensal)}`} />
        <Card><CardContent className="grid gap-3 p-4 md:grid-cols-4">
          <div className="md:col-span-2"><Label>Nome</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
          <div><Label>Valor</Label><Input type="number" value={form.valor} onChange={(e) => setForm({ ...form, valor: +e.target.value })} /></div>
          <div><Label>Periodicidade</Label>
            <Select value={form.periodicidade} onValueChange={(v: any) => setForm({ ...form, periodicidade: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="mensal">Mensal</SelectItem><SelectItem value="anual">Anual</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="md:col-span-4"><Button onClick={() => { if (!form.nome) return toast.error("Nome obrigatório"); add("despesas", form); setForm({ nome: "", valor: 0, periodicidade: "mensal" }); toast.success("Despesa adicionada"); }}><Plus className="mr-1 h-4 w-4" />Adicionar</Button></div>
        </CardContent></Card>
        <Card><CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Periodicidade</TableHead><TableHead className="text-right">Valor</TableHead><TableHead></TableHead></TableRow></TableHeader>
            <TableBody>
              {despesas.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.nome}</TableCell>
                  <TableCell className="capitalize">{d.periodicidade}</TableCell>
                  <TableCell className="text-right font-display">{formatEUR(d.valor)}</TableCell>
                  <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => remove("despesas", d.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent></Card>
      </div>
    );
  },
});