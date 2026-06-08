import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/fornecedores")({
  head: () => ({ meta: [{ title: "Fornecedores" }] }),
  component: () => {
    const { fornecedores, materiais, add, remove } = useStore();
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({ nome: "", contacto: "", email: "", website: "", notas: "", imagem: "" });
    const onImg = (file?: File) => { if (!file) return; const r = new FileReader(); r.onload = () => setForm((f) => ({ ...f, imagem: r.result as string })); r.readAsDataURL(file); };
    return (
      <div className="space-y-6">
        <PageHeader
          title="Fornecedores"
          description="Lista de fornecedores de material para os artigos."
          actions={
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button><Plus className="mr-1 h-4 w-4" />Novo fornecedor</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Novo fornecedor</DialogTitle></DialogHeader>
                <div className="grid gap-3">
                  {(["nome", "contacto", "email", "website", "notas"] as const).map((k) => (
                    <div key={k}><Label className="capitalize">{k}</Label><Input value={(form as any)[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} /></div>
                  ))}
                  <div><Label>Logo / Imagem</Label><Input type="file" accept="image/*" onChange={(e) => onImg(e.target.files?.[0])} />
                    {form.imagem && <img src={form.imagem} alt="" className="mt-2 h-16 w-16 rounded object-cover" />}</div>
                  <Button onClick={() => { if (!form.nome) return toast.error("Nome obrigatório"); add("fornecedores", form); setForm({ nome: "", contacto: "", email: "", website: "", notas: "", imagem: "" }); setOpen(false); toast.success("Fornecedor adicionado"); }}>Guardar</Button>
                </div>
              </DialogContent>
            </Dialog>
          }
        />
        <Card><CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead></TableHead><TableHead>Nome</TableHead><TableHead>Contacto</TableHead><TableHead>Email</TableHead><TableHead>Artigos</TableHead><TableHead></TableHead></TableRow></TableHeader>
            <TableBody>
              {fornecedores.map((f) => (
                <TableRow key={f.id}>
                  <TableCell>{f.imagem ? <img src={f.imagem} alt="" className="h-8 w-8 rounded object-cover" /> : <div className="h-8 w-8 rounded bg-muted" />}</TableCell>
                  <TableCell className="font-medium">{f.nome}</TableCell>
                  <TableCell>{f.contacto}</TableCell>
                  <TableCell>{f.email}</TableCell>
                  <TableCell>{materiais.filter((m) => m.fornecedorId === f.id).length}</TableCell>
                  <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => remove("fornecedores", f.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent></Card>
      </div>
    );
  },
});