import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore, formatEUR } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/stock")({
  head: () => ({ meta: [{ title: "Stock de material" }] }),
  component: () => {
    const { materiais, fornecedores, add, remove, update } = useStore();
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({ nome: "", unidade: "novelo", stock: 0, precoCompra: 0, fornecedorId: "", notas: "", imagem: "" });
    const onImg = (file?: File) => { if (!file) return; const r = new FileReader(); r.onload = () => setForm((f) => ({ ...f, imagem: r.result as string })); r.readAsDataURL(file); };
    return (
      <div className="space-y-6">
        <PageHeader title="Stock de material" description="Materiais em stock, com fornecedor e preço praticado."
          actions={
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button><Plus className="mr-1 h-4 w-4" />Novo material</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Novo material</DialogTitle></DialogHeader>
                <div className="grid gap-3">
                  <div><Label>Nome</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Unidade</Label><Input value={form.unidade} onChange={(e) => setForm({ ...form, unidade: e.target.value })} /></div>
                    <div><Label>Stock</Label><Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: +e.target.value })} /></div>
                  </div>
                  <div><Label>Preço de compra (€/un)</Label><Input type="number" step="0.01" value={form.precoCompra} onChange={(e) => setForm({ ...form, precoCompra: +e.target.value })} /></div>
                  <div><Label>Fornecedor</Label>
                    <Select value={form.fornecedorId} onValueChange={(v) => setForm({ ...form, fornecedorId: v })}>
                      <SelectTrigger><SelectValue placeholder="Escolher" /></SelectTrigger>
                      <SelectContent>{fornecedores.map((f) => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Imagem</Label><Input type="file" accept="image/*" onChange={(e) => onImg(e.target.files?.[0])} />
                    {form.imagem && <img src={form.imagem} alt="" className="mt-2 h-16 w-16 rounded object-cover" />}</div>
                  <Button onClick={() => { if (!form.nome) return toast.error("Nome obrigatório"); add("materiais", form); setForm({ nome: "", unidade: "novelo", stock: 0, precoCompra: 0, fornecedorId: "", notas: "", imagem: "" }); setOpen(false); toast.success("Material adicionado"); }}>Guardar</Button>
                </div>
              </DialogContent>
            </Dialog>
          }
        />
        <Card><CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead></TableHead><TableHead>Material</TableHead><TableHead>Fornecedor</TableHead><TableHead>Preço</TableHead><TableHead>Stock</TableHead><TableHead>Valor</TableHead><TableHead></TableHead></TableRow></TableHeader>
            <TableBody>
              {materiais.map((m) => {
                const f = fornecedores.find((x) => x.id === m.fornecedorId);
                const baixo = m.stock < 5;
                return (
                  <TableRow key={m.id}>
                    <TableCell>{m.imagem ? <img src={m.imagem} alt="" className="h-8 w-8 rounded object-cover" /> : <div className="h-8 w-8 rounded bg-muted" />}</TableCell>
                    <TableCell className="font-medium">{m.nome}</TableCell>
                    <TableCell>{f?.nome ?? "—"}</TableCell>
                    <TableCell>{formatEUR(m.precoCompra)}/{m.unidade}</TableCell>
                    <TableCell><Input type="number" className="h-8 w-20" value={m.stock} onChange={(e) => update("materiais", m.id, { stock: +e.target.value })} /> {baixo && <Badge variant="destructive" className="ml-2">baixo</Badge>}</TableCell>
                    <TableCell className="font-display">{formatEUR(m.stock * m.precoCompra)}</TableCell>
                    <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => remove("materiais", m.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
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