import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/etsy")({
  head: () => ({ meta: [{ title: "Etsy" }] }),
  component: () => {
    const { etsyConfig, setEtsy, etsyProdutos, materiais, add, remove, consumirStockPorEtsy, update } = useStore();
    const [novo, setNovo] = useState({ etsyListingId: "", nome: "", materialId: "", qtd: 1 });
    const adicionar = () => {
      if (!novo.etsyListingId || !novo.nome) return toast.error("Listing ID e nome são obrigatórios");
      add("etsyProdutos", { etsyListingId: novo.etsyListingId, nome: novo.nome, materiais: novo.materialId ? [{ materialId: novo.materialId, quantidade: novo.qtd }] : [] } as any);
      setNovo({ etsyListingId: "", nome: "", materialId: "", qtd: 1 });
    };
    const simularVenda = (listingId: string) => {
      const r = consumirStockPorEtsy(listingId, 1);
      if (r.ok) toast.success("Stock descontado");
      else toast.error(`Falta: ${r.faltas.join(", ")}`);
    };
    return (
      <div className="space-y-6">
        <PageHeader title="Integração Etsy" description="Sincroniza encomendas físicas (stock) e gere ficheiros digitais comprados/vendidos." />

        <Card><CardContent className="grid gap-3 p-4 md:grid-cols-4">
          <div><Label>Shop ID</Label><Input value={etsyConfig.shopId} onChange={(e) => setEtsy({ shopId: e.target.value })} /></div>
          <div className="md:col-span-2"><Label>API Key</Label><Input type="password" value={etsyConfig.apiKey} onChange={(e) => setEtsy({ apiKey: e.target.value })} /></div>
          <div className="flex items-end justify-between gap-2">
            <div className="flex items-center gap-2"><Switch checked={etsyConfig.ativo} onCheckedChange={(v) => setEtsy({ ativo: v })} /><span className="text-sm">Ativo</span></div>
            <Button variant="outline" onClick={() => { setEtsy({ ultimaSync: new Date().toISOString() }); toast.success("Sincronização simulada"); }}><RefreshCw className="mr-1 h-4 w-4" />Sync</Button>
          </div>
        </CardContent></Card>

        <Card><CardContent className="space-y-3 p-4">
          <h3 className="font-display font-semibold">Mapear produto Etsy → materiais (BOM)</h3>
          <div className="grid gap-2 md:grid-cols-5">
            <Input placeholder="Etsy listing ID" value={novo.etsyListingId} onChange={(e) => setNovo({ ...novo, etsyListingId: e.target.value })} />
            <Input placeholder="Nome do produto" value={novo.nome} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} />
            <Select value={novo.materialId} onValueChange={(v) => setNovo({ ...novo, materialId: v })}>
              <SelectTrigger><SelectValue placeholder="Material" /></SelectTrigger>
              <SelectContent>{materiais.map((m) => <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>)}</SelectContent>
            </Select>
            <Input type="number" min={0} step={0.1} value={novo.qtd} onChange={(e) => setNovo({ ...novo, qtd: +e.target.value })} />
            <Button onClick={adicionar}><Plus className="mr-1 h-4 w-4" />Adicionar</Button>
          </div>
          <div className="space-y-2">
            {etsyProdutos.map((p) => (
              <div key={p.id} className="rounded border border-border p-2 text-sm">
                <div className="flex items-center justify-between">
                  <div><span className="font-medium">{p.nome}</span><span className="ml-2 text-xs text-muted-foreground">Listing {p.etsyListingId}</span></div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => simularVenda(p.etsyListingId)}>Simular venda</Button>
                    <Button size="icon" variant="ghost" onClick={() => remove("etsyProdutos", p.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {p.materiais.map((mu) => {
                    const m = materiais.find((x) => x.id === mu.materialId);
                    return `${m?.nome ?? "?"} × ${mu.quantidade}`;
                  }).join(" · ") || "Sem materiais associados"}
                </div>
              </div>
            ))}
          </div>
        </CardContent></Card>
      </div>
    );
  },
});