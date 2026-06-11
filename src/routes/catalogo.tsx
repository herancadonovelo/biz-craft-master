import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore, formatEUR } from "@/lib/store";
import { useTT } from "@/lib/i18n";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Package } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/catalogo")({
  head: () => ({ meta: [{ title: "Catálogo" }] }),
  component: () => {
    const { catalogo, add, remove, update } = useStore();
    const tt = useTT();
    const [novo, setNovo] = useState({ nome: "", descricao: "", precoVenda: 0, imagem: "" });
    const upload = (f?: File) => { if (!f) return; const r = new FileReader(); r.onload = () => setNovo((s) => ({ ...s, imagem: r.result as string })); r.readAsDataURL(f); };
    const guardar = () => {
      if (!novo.nome || novo.precoVenda <= 0) return toast.error("Nome e preço obrigatórios");
      add("catalogo", { ...novo, ativo: true, criadoEm: new Date().toISOString() } as any);
      setNovo({ nome: "", descricao: "", precoVenda: 0, imagem: "" });
    };
    return (
      <div className="space-y-6">
        <PageHeader title="Catálogo" description="Peças à venda. Liga-se à Calculadora para guardar o preço final como Preço de Venda." />
        <Card><CardContent className="grid gap-3 p-4 md:grid-cols-4">
          <Input placeholder="Nome" value={novo.nome} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} />
          <Input type="number" min={0} step={0.5} placeholder="Preço (€)" value={novo.precoVenda || ""} onChange={(e) => setNovo({ ...novo, precoVenda: +e.target.value })} />
          <Input type="file" accept="image/*" onChange={(e) => upload(e.target.files?.[0])} />
          <Button onClick={guardar}><Plus className="mr-1 h-4 w-4" />Adicionar</Button>
          <Textarea className="md:col-span-4" rows={2} placeholder="Descrição" value={novo.descricao} onChange={(e) => setNovo({ ...novo, descricao: e.target.value })} />
        </CardContent></Card>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {catalogo.map((c) => (
            <Card key={c.id}><CardContent className="space-y-2 p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2"><Package className="h-5 w-5 text-primary" /><span className="font-display font-semibold">{tt(c.nome)}</span></div>
                <Button size="icon" variant="ghost" onClick={() => remove("catalogo", c.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
              {c.imagem && <img src={c.imagem} alt={c.nome} className="h-32 w-full rounded object-cover" />}
              {c.descricao && <p className="text-sm text-muted-foreground">{tt(c.descricao)}</p>}
              <div className="flex items-center justify-between">
                <span className="font-display text-lg">{formatEUR(c.precoVenda)}</span>
                <label className="flex items-center gap-2 text-xs"><Switch checked={c.ativo} onCheckedChange={(v) => update("catalogo", c.id, { ativo: v })} /> ativo</label>
              </div>
              {(c.custoMateriais !== undefined || c.custoHoras !== undefined) && (
                <div className="text-xs text-muted-foreground">
                  mat {formatEUR(c.custoMateriais || 0)} · horas {formatEUR(c.custoHoras || 0)}{c.margem !== undefined ? ` · margem ${c.margem}%` : ""}
                </div>
              )}
            </CardContent></Card>
          ))}
          {catalogo.length === 0 && <p className="text-sm text-muted-foreground">Sem itens no catálogo.</p>}
        </div>
      </div>
    );
  },
});