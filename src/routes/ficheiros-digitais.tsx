import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Download, FileDigit } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/ficheiros-digitais")({
  head: () => ({ meta: [{ title: "Biblioteca Digital" }] }),
  component: FicheirosDigitaisContent,
});

export function FicheirosDigitaisContent() {
    const { ficheirosDigitais, add, remove } = useStore();
    const [novo, setNovo] = useState({ nome: "", tipo: "receita" as "receita" | "molde" | "ebook" | "outro", origem: "manual" as "manual" | "etsy", etsyListingId: "", url: "", ficheiroBase64: "", notas: "" });
    const upload = (f?: File) => {
      if (!f) return;
      const r = new FileReader();
      r.onload = () => setNovo((s) => ({ ...s, ficheiroBase64: r.result as string, nome: s.nome || f.name }));
      r.readAsDataURL(f);
    };
    const guardar = () => {
      if (!novo.nome) return toast.error("Nome obrigatório");
      add("ficheirosDigitais", { ...novo, criadoEm: new Date().toISOString() } as any);
      setNovo({ nome: "", tipo: "receita", origem: "manual", etsyListingId: "", url: "", ficheiroBase64: "", notas: "" });
      toast.success("Ficheiro adicionado");
    };
    return (
      <div className="space-y-6">
        <PageHeader title="Biblioteca Digital" description="Receitas, moldes e PDFs comprados ou vendidos (inclui ligação à Etsy)." />
        <Card><CardContent className="grid gap-3 p-4 md:grid-cols-3">
          <Input placeholder="Nome" value={novo.nome} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} />
          <Select value={novo.tipo} onValueChange={(v: any) => setNovo({ ...novo, tipo: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="receita">Receita</SelectItem>
              <SelectItem value="molde">Molde</SelectItem>
              <SelectItem value="ebook">Ebook</SelectItem>
              <SelectItem value="outro">Outro</SelectItem>
            </SelectContent>
          </Select>
          <Select value={novo.origem} onValueChange={(v: any) => setNovo({ ...novo, origem: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">Manual</SelectItem>
              <SelectItem value="etsy">Etsy</SelectItem>
            </SelectContent>
          </Select>
          {novo.origem === "etsy" && <Input placeholder="Etsy listing ID" value={novo.etsyListingId} onChange={(e) => setNovo({ ...novo, etsyListingId: e.target.value })} />}
          <Input placeholder="URL (opcional)" value={novo.url} onChange={(e) => setNovo({ ...novo, url: e.target.value })} />
          <div>
            <Label className="text-xs">Ficheiro PDF/imagem</Label>
            <Input type="file" accept="application/pdf,image/*" onChange={(e) => upload(e.target.files?.[0])} />
          </div>
          <Input className="md:col-span-3" placeholder="Notas" value={novo.notas} onChange={(e) => setNovo({ ...novo, notas: e.target.value })} />
          <Button className="md:col-span-3" onClick={guardar}><Plus className="mr-1 h-4 w-4" />Adicionar</Button>
        </CardContent></Card>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {ficheirosDigitais.map((f) => (
            <Card key={f.id}><CardContent className="space-y-2 p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2"><FileDigit className="h-5 w-5 text-primary" /><span className="font-display font-semibold">{f.nome}</span></div>
                <Button size="icon" variant="ghost" onClick={() => remove("ficheirosDigitais", f.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
              <div className="text-xs text-muted-foreground">{f.tipo} · {f.origem}{f.etsyListingId ? ` · Etsy ${f.etsyListingId}` : ""}</div>
              {f.notas && <p className="text-sm">{f.notas}</p>}
              <div className="flex gap-2">
                {f.url && <a className="text-xs text-primary underline" href={f.url} target="_blank" rel="noreferrer">Link</a>}
                {f.ficheiroBase64 && <a className="text-xs inline-flex items-center gap-1 text-primary" href={f.ficheiroBase64} download={f.nome}><Download className="h-3 w-3" />Download</a>}
              </div>
            </CardContent></Card>
          ))}
          {ficheirosDigitais.length === 0 && <p className="text-sm text-muted-foreground">Sem ficheiros ainda.</p>}
        </div>
      </div>
    );
}