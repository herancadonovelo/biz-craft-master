import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/clientes")({
  head: () => ({ meta: [{ title: "Clientes" }] }),
  component: ClientesPage,
});

function ClientesPage() {
  const { clientes, add, remove } = useStore();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nome: "", email: "", telefone: "", morada: "", notas: "" });

  const submit = () => {
    if (!form.nome.trim()) return toast.error("Nome é obrigatório");
    add("clientes", { ...form, criadoEm: new Date().toISOString() });
    setForm({ nome: "", email: "", telefone: "", morada: "", notas: "" });
    setOpen(false);
    toast.success("Cliente adicionado");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes"
        description="Detalhes e histórico de cada cliente."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-1 h-4 w-4" />Novo cliente</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Novo cliente</DialogTitle></DialogHeader>
              <div className="grid gap-3">
                <div><Label>Nome</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
                <div><Label>Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                <div><Label>Telefone</Label><Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} /></div>
                <div><Label>Morada</Label><Input value={form.morada} onChange={(e) => setForm({ ...form, morada: e.target.value })} /></div>
                <div><Label>Notas</Label><Textarea value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} /></div>
                <Button onClick={submit}>Guardar</Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />
      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Nome</TableHead><TableHead>Email</TableHead><TableHead>Telefone</TableHead><TableHead>Morada</TableHead><TableHead></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {clientes.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.nome}</TableCell>
                <TableCell>{c.email}</TableCell>
                <TableCell>{c.telefone}</TableCell>
                <TableCell>{c.morada}</TableCell>
                <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => remove("clientes", c.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
}