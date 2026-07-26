import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore, formatEUR, formatCurrency } from "@/lib/store";
import { useTT } from "@/lib/i18n";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { ImagePicker } from "@/components/ImagePicker";
import { CsvImportInventarioDialog } from "@/components/CsvImportInventarioDialog";

function aplicarDesconto(subtotal: number, fornecedor: { valorDesconto?: number; tipoDesconto?: "percentagem" | "fixo" } | undefined) {
  if (!fornecedor?.valorDesconto || fornecedor.valorDesconto <= 0) return { desconto: 0, final: subtotal };
  const desconto = fornecedor.tipoDesconto === "fixo"
    ? Math.min(fornecedor.valorDesconto, subtotal)
    : subtotal * (fornecedor.valorDesconto / 100);
  return { desconto, final: Math.max(0, subtotal - desconto) };
}

export const Route = createFileRoute("/stock")({
  head: () => ({ meta: [{ title: "Stock de material" }] }),
  component: () => {
    const { materiais, fornecedores, add, remove, update } = useStore();
    const tt = useTT();
    const [open, setOpen] = useState(false);
    const [q, setQ] = useState("");
    const [filtro, setFiltro] = useState<"todos" | "fios" | "meadas" | "acessorios">("todos");
    const [form, setForm] = useState({
      nome: "", codigo: "", unidade: "novelo", stock: 0, stockMinimo: 5, precoCompra: 0,
      fornecedorId: "", notas: "", imagem: "",
      categoria: "fios" as "fios" | "meadas" | "acessorios",
      marca: "", codigoCor: "", tipoLinha: "mulinê" as "mulinê" | "étoile" | "metalizada" | "outro",
    });
    const addFornecedorAlt = (id: string) => {
      const fid = window.prompt("ID/Nome do fornecedor (escolhe da lista — copia o nome):", fornecedores[0]?.nome ?? "");
      if (!fid) return;
      const f = fornecedores.find((x) => x.nome === fid || x.id === fid);
      if (!f) return toast.error("Fornecedor não encontrado");
      const p = Number(window.prompt(`Preço praticado por ${f.nome} (€):`, "0") || 0);
      const m = materiais.find((x) => x.id === id);
      const list = [...(m?.fornecedoresExtra ?? []), { fornecedorId: f.id, preco: p }];
      update("materiais", id, { fornecedoresExtra: list });
      toast.success("Fornecedor adicionado");
    };
    return (
      <div className="space-y-6">
        <PageHeader title="Stock de material" description="Materiais em stock, com fornecedor e preço praticado."
          actions={
            <div className="flex flex-wrap gap-2">
            <CsvImportInventarioDialog />
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button><Plus className="mr-1 h-4 w-4" />Novo material</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Novo material</DialogTitle></DialogHeader>
                <div className="grid gap-3">
                  <div className="grid grid-cols-3 gap-2">
                    {(["fios","meadas","acessorios"] as const).map((c) => (
                      <Button key={c} type="button" variant={form.categoria === c ? "default" : "outline"} size="sm"
                        onClick={() => setForm({ ...form, categoria: c })}>{c}</Button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Nome</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
                    <div><Label>Código</Label><Input value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} placeholder="MAT-001" /></div>
                  </div>
                  {form.categoria === "meadas" && (
                    <div className="grid grid-cols-2 gap-3 rounded-md border border-dashed border-border p-3">
                      <div><Label>Marca *</Label>
                        <Select value={form.marca} onValueChange={(v) => setForm({ ...form, marca: v })}>
                          <SelectTrigger><SelectValue placeholder="DMC, Anchor..." /></SelectTrigger>
                          <SelectContent>{["DMC","Anchor","Sulinha","Finca"].map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div><Label>Código/Nº da cor *</Label><Input value={form.codigoCor} onChange={(e) => setForm({ ...form, codigoCor: e.target.value })} placeholder="310" /></div>
                      <div><Label>Tipo de linha *</Label>
                        <Select value={form.tipoLinha} onValueChange={(v) => setForm({ ...form, tipoLinha: v as any })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>{["mulinê","étoile","metalizada","outro"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2 text-[10px] text-muted-foreground">Estes dados permitem ao Conversor de Cores e ao Editor de Ponto Cruz fazer o cruzamento correto.</div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Unidade</Label><Input value={form.unidade} onChange={(e) => setForm({ ...form, unidade: e.target.value })} /></div>
                    <div><Label>Stock</Label><Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: +e.target.value })} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Preço de compra (€/un)</Label><Input type="number" step="0.01" value={form.precoCompra} onChange={(e) => setForm({ ...form, precoCompra: +e.target.value })} /></div>
                    <div><Label>Stock mínimo</Label><Input type="number" value={form.stockMinimo} onChange={(e) => setForm({ ...form, stockMinimo: +e.target.value })} /></div>
                  </div>
                  <div><Label>Fornecedor</Label>
                    <Select value={form.fornecedorId} onValueChange={(v) => setForm({ ...form, fornecedorId: v })}>
                      <SelectTrigger><SelectValue placeholder="Escolher" /></SelectTrigger>
                      <SelectContent>{fornecedores.map((f) => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  {(() => {
                    const f = fornecedores.find((x) => x.id === form.fornecedorId);
                    const subtotal = (form.precoCompra || 0) * (form.stock || 0);
                    if (!f?.valorDesconto || subtotal <= 0) return null;
                    const { desconto, final } = aplicarDesconto(subtotal, f);
                    return (
                      <div className="rounded-md border border-[hsl(var(--muted))] bg-[hsl(var(--muted))/0.3] p-3 space-y-1 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span>{formatEUR(subtotal)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            Desconto
                            <Badge variant="secondary" className="bg-[hsl(150_40%_88%)] text-[hsl(150_40%_25%)] text-[10px]">
                              {f.codigoDesconto ?? "auto"} · -{f.tipoDesconto === "fixo" ? formatCurrency(f.valorDesconto) : `${f.valorDesconto}%`}
                            </Badge>
                          </span>
                          <span className="text-[hsl(150_40%_35%)]">−{formatEUR(desconto)}</span>
                        </div>
                        <div className="flex items-center justify-between border-t pt-1 font-medium">
                          <span>Custo real</span>
                          <span className="font-display">{formatEUR(final)}</span>
                        </div>
                      </div>
                    );
                  })()}
                  <div><Label>Imagem</Label>
                    <div className="mt-1"><ImagePicker value={form.imagem} onChange={(v) => setForm({ ...form, imagem: v })} size="h-20 w-20" /></div>
                  </div>
                  <Button onClick={() => {
                    if (!form.nome) return toast.error("Nome obrigatório");
                    if (form.categoria === "meadas" && (!form.marca || !form.codigoCor)) return toast.error("Marca e código da cor são obrigatórios para meadas");
                    add("materiais", form as any);
                    setForm({ nome: "", codigo: "", unidade: "novelo", stock: 0, stockMinimo: 5, precoCompra: 0, fornecedorId: "", notas: "", imagem: "", categoria: "fios", marca: "", codigoCor: "", tipoLinha: "mulinê" });
                    setOpen(false); toast.success("Material adicionado");
                  }}>Guardar</Button>
                </div>
              </DialogContent>
            </Dialog>
            </div>
          }
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex gap-1">
            {(["todos","fios","meadas","acessorios"] as const).map((c) => (
              <Button key={c} size="sm" variant={filtro === c ? "default" : "outline"} onClick={() => setFiltro(c)}>
                {c === "todos" ? "Todos" : c === "fios" ? "Fios e Novelos" : c === "meadas" ? "Meadas" : "Acessórios"}
              </Button>
            ))}
          </div>
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-8" placeholder="Pesquisar material por nome ou código…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
        <Card><CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead></TableHead><TableHead>Código</TableHead><TableHead>Material</TableHead><TableHead>Fornecedor(es)</TableHead><TableHead>Preço</TableHead><TableHead>Stock</TableHead><TableHead>Valor</TableHead><TableHead></TableHead></TableRow></TableHeader>
            <TableBody>
              {materiais
                .filter((m) => filtro === "todos" || (m.categoria || "fios") === filtro)
                .filter((m) => (m.nome + " " + (m.codigo ?? "") + " " + (m.marca ?? "") + " " + (m.codigoCor ?? "")).toLowerCase().includes(q.toLowerCase()))
                .map((m) => {
                const f = fornecedores.find((x) => x.id === m.fornecedorId);
                const baixo = m.stock <= (m.stockMinimo ?? 5);
                return (
                  <TableRow key={m.id}>
                    <TableCell>
                      <ImagePicker value={m.imagem} onChange={(v) => update("materiais", m.id, { imagem: v })} size="h-8 w-8" />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{m.codigo ?? "—"}</TableCell>
                    <TableCell className="font-medium">
                      <div>{tt(m.nome)}</div>
                      {m.categoria === "meadas" && (
                        <div className="text-[10px] text-muted-foreground">{m.marca} · {m.codigoCor} · {m.tipoLinha}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5 text-xs">
                        <div>{f?.nome ?? "—"} · {formatEUR(m.precoCompra)}</div>
                        {(m.fornecedoresExtra ?? []).map((fe, i) => {
                          const fx = fornecedores.find((x) => x.id === fe.fornecedorId);
                          return <div key={i} className="text-muted-foreground">{fx?.nome ?? "?"} · {formatEUR(fe.preco)}</div>;
                        })}
                        <button onClick={() => addFornecedorAlt(m.id)} className="text-primary underline">+ alt</button>
                      </div>
                    </TableCell>
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