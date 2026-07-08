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
import { Plus, Trash2, Search, Copy } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ImagePicker } from "@/components/ImagePicker";

export const Route = createFileRoute("/fornecedores")({
  head: () => ({ meta: [{ title: "Fornecedores" }] }),
  component: () => {
    const { fornecedores, materiais, add, remove, update } = useStore();
    const tt = useTT();
    const [open, setOpen] = useState(false);
    const [q, setQ] = useState("");
    const [form, setForm] = useState({
      nome: "", contacto: "", email: "", website: "", notas: "", imagem: "",
      codigoDesconto: "", valorDesconto: 0, tipoDesconto: "percentagem" as "percentagem" | "fixo",
    });
    const copiar = async (code: string) => {
      try {
        await navigator.clipboard.writeText(code);
        toast.success(`Código "${code}" copiado`);
      } catch {
        toast.error("Não foi possível copiar");
      }
    };
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
                  <div className="rounded-md border border-dashed border-border p-3 space-y-3 bg-[hsl(var(--muted))/0.3]">
                    <div className="text-xs font-medium text-muted-foreground">Código de Desconto de Membro</div>
                    <div><Label>Código</Label><Input value={form.codigoDesconto} onChange={(e) => setForm({ ...form, codigoDesconto: e.target.value })} placeholder="ex: SARA10" /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Valor do desconto</Label><Input type="number" step="0.01" value={form.valorDesconto} onChange={(e) => setForm({ ...form, valorDesconto: +e.target.value })} /></div>
                      <div><Label>Tipo</Label>
                        <Select value={form.tipoDesconto} onValueChange={(v) => setForm({ ...form, tipoDesconto: v as "percentagem" | "fixo" })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentagem">Percentagem %</SelectItem>
                            <SelectItem value="fixo">Valor Fixo €</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <Button onClick={() => {
                    if (!form.nome) return toast.error("Nome obrigatório");
                    add("fornecedores", form);
                    setForm({ nome: "", contacto: "", email: "", website: "", notas: "", imagem: "", codigoDesconto: "", valorDesconto: 0, tipoDesconto: "percentagem" });
                    setOpen(false); toast.success("Fornecedor adicionado");
                  }}>Guardar</Button>
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
            <TableHeader><TableRow><TableHead></TableHead><TableHead>Nome</TableHead><TableHead>Contacto</TableHead><TableHead>Email</TableHead><TableHead>Código de Desconto</TableHead><TableHead>Artigos</TableHead><TableHead></TableHead></TableRow></TableHeader>
            <TableBody>
              {fornecedores.filter((f) => (f.nome + " " + (f.email ?? "") + " " + (f.contacto ?? "")).toLowerCase().includes(q.toLowerCase())).map((f) => (
                <TableRow key={f.id}>
                  <TableCell><ImagePicker value={f.imagem} onChange={(v) => update("fornecedores", f.id, { imagem: v })} size="h-8 w-8" /></TableCell>
                  <TableCell className="font-medium">{tt(f.nome)}</TableCell>
                  <TableCell>{f.contacto}</TableCell>
                  <TableCell>{f.email}</TableCell>
                  <TableCell>
                    {f.codigoDesconto ? (
                      <div className="flex items-center gap-1.5">
                        <code className="rounded bg-[hsl(var(--muted))] px-2 py-0.5 text-xs font-mono">{f.codigoDesconto}</code>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copiar(f.codigoDesconto!)} title="Copiar código">
                          <Copy className="h-3 w-3" />
                        </Button>
                        {f.valorDesconto ? (
                          <Badge variant="secondary" className="text-[10px]">
                            -{f.valorDesconto}{f.tipoDesconto === "fixo" ? "€" : "%"}
                          </Badge>
                        ) : null}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
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