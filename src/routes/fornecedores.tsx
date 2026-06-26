import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { useTT } from "@/lib/i18n";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { ImagePicker } from "@/components/ImagePicker";

export const Route = createFileRoute("/fornecedores")({
  head: () => ({ meta: [{ title: "Fornecedores" }] }),
  component: () => {
    const { fornecedores, materiais, add, remove, update } = useStore();
    const tt = useTT();
    const [open, setOpen] = useState(false);
    const [q, setQ] = useState("");
    const [form, setForm] = useState({ nome: "", contacto: "", email: "", website: "", notas: "", imagem: "" });
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
                  <div><Label>Logo / Imagem</Label>
                    <div className="mt-1"><ImagePicker value={form.imagem} onChange={(v) => setForm({ ...form, imagem: v })} size="h-20 w-20" /></div>
                  </div>
                  <Button onClick={() => { if (!form.nome) return toast.error("Nome obrigatório"); add("fornecedores", form); setForm({ nome: "", contacto: "", email: "", website: "", notas: "", imagem: "" }); setOpen(false); toast.success("Fornecedor adicionado"); }}>Guardar</Button>
                </div>
              </DialogContent>
            </Dialog>
          }
        />
        <div className="relative max-w-md">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Pesquisar fornecedor…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Card><CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead></TableHead><TableHead>Nome</TableHead><TableHead>Contacto</TableHead><TableHead>Email</TableHead><TableHead>Artigos</TableHead><TableHead></TableHead></TableRow></TableHeader>
            <TableBody>
              {fornecedores.filter((f) => (f.nome + " " + (f.email ?? "") + " " + (f.contacto ?? "")).toLowerCase().includes(q.toLowerCase())).map((f) => (
                <TableRow key={f.id}>
                  <TableCell><ImagePicker value={f.imagem} onChange={(v) => update("fornecedores", f.id, { imagem: v })} size="h-8 w-8" /></TableCell>
                  <TableCell className="font-medium">{tt(f.nome)}</TableCell>
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