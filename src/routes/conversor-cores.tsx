import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Search, Package, Loader2 } from "lucide-react";
import { useStore, formatEUR } from "@/lib/store";
import { converter, carregarTabelaCompleta, getDMC, type Marca } from "@/lib/cores-linhas";
import { toast } from "sonner";

export const Route = createFileRoute("/conversor-cores")({
  head: () => ({ meta: [{ title: "Conversor de cores DMC/Anchor" }] }),
  component: ConversorPage,
});

function ConversorPage() {
  const [marca, setMarca] = useState<Marca>("DMC");
  const [codigo, setCodigo] = useState("");
  const [carregada, setCarregada] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const materiais = useStore((s) => s.materiais);

  useEffect(() => {
    carregarTabelaCompleta().then((r) => {
      setCarregada(true); setCarregando(false);
      if (r.dmc > 100) toast.success(`Tabela carregada: ${r.dmc} cores DMC`);
    });
  }, []);

  const resultado = useMemo(() => codigo ? converter(marca, codigo) : null, [marca, codigo, carregada]);

  const procurarStock = (m: Marca, cod: string) => {
    const found = materiais.filter((x) =>
      x.categoria === "meadas" && x.marca === m && (x.codigoCor || "").trim() === cod.trim(),
    );
    return found;
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Conversor de cores: DMC/ANCHOR..."
        description="Digita o código de uma linha e vê a correspondência aproximada em todas as marcas." />

      <Card><CardContent className="grid gap-3 p-4 md:grid-cols-[160px_1fr_auto]">
        <div>
          <Label className="text-xs">Marca de origem</Label>
          <Select value={marca} onValueChange={(v) => setMarca(v as Marca)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="DMC">DMC</SelectItem>
              <SelectItem value="Anchor">Anchor</SelectItem>
              <SelectItem value="Sulinha">Sulinha</SelectItem>
              <SelectItem value="Finca">Finca</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Código da linha</Label>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-8" placeholder="ex: 310" value={codigo} onChange={(e) => setCodigo(e.target.value)} />
          </div>
        </div>
        <div className="flex items-end">
          {carregando ? <Badge variant="outline"><Loader2 className="mr-1 h-3 w-3 animate-spin" />A carregar paleta</Badge>
            : <Badge variant="outline">{getDMC().length} cores DMC</Badge>}
        </div>
      </CardContent></Card>

      {codigo && !resultado?.origem && (
        <p className="text-sm text-muted-foreground">Código não encontrado em {marca}. Verifica a grafia (ex: 310, BLANC).</p>
      )}

      {resultado?.origem && (
        <Card><CardContent className="p-4 space-y-3">
          <div className="text-sm text-muted-foreground">Resultado para <span className="font-mono">{marca} {codigo}</span>{resultado.origem.nome ? ` — ${resultado.origem.nome}` : ""}.</div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {(Object.keys(resultado.mapa) as Marca[]).map((m) => {
              const c = resultado.mapa[m];
              if (!c) return null;
              const stock = procurarStock(m, c.codigo);
              const total = stock.reduce((a, b) => a + b.stock, 0);
              return (
                <Card key={m}><CardContent className="p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded border border-border" style={{ background: c.hex }} />
                    <div>
                      <div className="font-display font-semibold">{m}</div>
                      <div className="font-mono text-sm">{c.codigo}</div>
                      <div className="text-xs text-muted-foreground">{c.hex}</div>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="w-full"
                    onClick={() => {
                      const r = procurarStock(m, c.codigo);
                      if (r.length === 0) toast(`Não tens ${m} ${c.codigo} no Stock`);
                      else toast.success(`Tens ${r.reduce((a,b)=>a+b.stock,0)} un. em Stock`);
                    }}>
                    <Package className="mr-1 h-3.5 w-3.5" />Verificar no Stock
                  </Button>
                  {stock.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      Em stock: <span className="font-medium text-foreground">{total}</span> · {formatEUR(stock[0]?.precoCompra || 0)}/un
                    </div>
                  )}
                </CardContent></Card>
              );
            })}
          </div>
          <p className="text-[10px] text-muted-foreground">As equivalências entre marcas são aproximadas (vizinho cromático mais próximo). Para correspondência exata consulta o catálogo oficial de cada marca.</p>
        </CardContent></Card>
      )}
    </div>
  );
}