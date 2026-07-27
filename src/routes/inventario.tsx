import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useStore, formatEUR } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, Package, Truck, ShoppingCart, TrendingDown } from "lucide-react";
import { CsvImportInventarioDialog } from "@/components/CsvImportInventarioDialog";
import { CsvImportHistoryDialog } from "@/components/CsvImportHistoryDialog";

export const Route = createFileRoute("/inventario")({
  head: () => ({
    meta: [
      { title: "Visão Geral do Inventário — Craft Business Master" },
      { name: "description", content: "Resumo de fornecedores, custos por artigo e alertas de stock (baixo / sem stock) com sugestões de reposição." },
      { property: "og:title", content: "Visão Geral do Inventário" },
      { property: "og:description", content: "Resumo de fornecedores, custos por artigo e alertas de reposição." },
    ],
  }),
  component: InventarioOverview,
});

function InventarioOverview() {
  const materiais = useStore((s) => s.materiais);
  const fornecedores = useStore((s) => s.fornecedores);
  const projetos = useStore((s) => s.projetos);

  const consumoPorMaterial = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of projetos) {
      for (const mu of p.materiais ?? []) {
        map.set(mu.materialId, (map.get(mu.materialId) ?? 0) + (mu.quantidade || 0));
      }
    }
    return map;
  }, [projetos]);

  const enriched = useMemo(() => {
    return materiais.map((m) => {
      const min = m.stockMinimo ?? 5;
      const consumido = consumoPorMaterial.get(m.id) ?? 0;
      const consumoMedio = consumido / Math.max(1, projetos.length);
      const sugerido = Math.max(min, Math.ceil(consumoMedio * 3));
      const semStock = m.stock <= 0;
      const baixo = !semStock && m.stock <= min;
      const forn = fornecedores.find((f) => f.id === m.fornecedorId);
      const valorEmStock = (m.stock || 0) * (m.precoCompra || 0);
      return { m, min, consumido, consumoMedio, sugerido, semStock, baixo, forn, valorEmStock };
    });
  }, [materiais, consumoPorMaterial, projetos.length, fornecedores]);

  const totalValor = enriched.reduce((a, x) => a + x.valorEmStock, 0);
  const semStock = enriched.filter((x) => x.semStock);
  const baixos = enriched.filter((x) => x.baixo);
  const precisaRepor = [...semStock, ...baixos];

  const porFornecedor = useMemo(() => {
    const map = new Map<string, { forn: typeof fornecedores[number] | undefined; count: number; valor: number }>();
    for (const x of enriched) {
      const key = x.forn?.id ?? "__sem__";
      const cur = map.get(key) ?? { forn: x.forn, count: 0, valor: 0 };
      cur.count += 1;
      cur.valor += x.valorEmStock;
      map.set(key, cur);
    }
    return Array.from(map.values()).sort((a, b) => b.valor - a.valor);
  }, [enriched, fornecedores]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-4">
      <PageHeader
        title="Visão Geral do Inventário"
        description="Resumo de fornecedores, custos por artigo e alertas de reposição."
        actions={
          <div className="flex flex-wrap gap-2">
            <CsvImportInventarioDialog />
            <CsvImportHistoryDialog />
            <Button asChild variant="outline"><Link to="/stock">Ver stock</Link></Button>
            <Button asChild variant="outline"><Link to="/gestao-fornecedores">Fornecedores</Link></Button>
            <Button asChild><Link to="/lista-compras">Lista de compras</Link></Button>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<Package className="h-4 w-4" />} label="Artigos" value={String(materiais.length)} />
        <StatCard icon={<Truck className="h-4 w-4" />} label="Fornecedores" value={String(fornecedores.length)} />
        <StatCard icon={<TrendingDown className="h-4 w-4" />} label="Valor em stock" value={formatEUR(totalValor)} />
        <StatCard
          icon={<AlertTriangle className="h-4 w-4 text-destructive" />}
          label="A repor"
          value={String(precisaRepor.length)}
          hint={`${semStock.length} sem stock · ${baixos.length} baixo`}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4 text-destructive" /> Alertas de reposição
          </CardTitle>
          <Button asChild size="sm" variant="secondary">
            <Link to="/lista-compras"><ShoppingCart className="mr-1 h-4 w-4" /> Adicionar à lista</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {precisaRepor.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem artigos abaixo do mínimo. Bom trabalho!</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Artigo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Mínimo</TableHead>
                  <TableHead className="text-right">Consumo (proj.)</TableHead>
                  <TableHead className="text-right">Sugerido repor</TableHead>
                  <TableHead>Fornecedor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {precisaRepor.map((x) => (
                  <TableRow key={x.m.id}>
                    <TableCell className="font-medium">{x.m.nome}</TableCell>
                    <TableCell>
                      {x.semStock ? (
                        <Badge variant="destructive">Sem stock</Badge>
                      ) : (
                        <Badge variant="secondary">Baixo</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{x.m.stock} {x.m.unidade}</TableCell>
                    <TableCell className="text-right">{x.min}</TableCell>
                    <TableCell className="text-right">{x.consumido.toFixed(1)}</TableCell>
                    <TableCell className="text-right font-medium">{x.sugerido} {x.m.unidade}</TableCell>
                    <TableCell>{x.forn?.nome ?? <span className="text-muted-foreground">—</span>}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="h-4 w-4" /> Custos por artigo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {enriched.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem artigos registados.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Artigo</TableHead>
                    <TableHead className="text-right">Preço/un.</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...enriched].sort((a, b) => b.valorEmStock - a.valorEmStock).slice(0, 12).map((x) => (
                    <TableRow key={x.m.id}>
                      <TableCell className="font-medium">{x.m.nome}</TableCell>
                      <TableCell className="text-right">{formatEUR(x.m.precoCompra || 0)}</TableCell>
                      <TableCell className="text-right">{x.m.stock}</TableCell>
                      <TableCell className="text-right">{formatEUR(x.valorEmStock)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Truck className="h-4 w-4" /> Resumo por fornecedor
            </CardTitle>
          </CardHeader>
          <CardContent>
            {porFornecedor.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem fornecedores associados.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead className="text-right">Artigos</TableHead>
                    <TableHead className="text-right">Valor stock</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {porFornecedor.map((f, i) => (
                    <TableRow key={f.forn?.id ?? i}>
                      <TableCell className="font-medium">
                        {f.forn ? (
                          <Link to="/gestao-fornecedores" className="hover:underline">{f.forn.nome}</Link>
                        ) : (
                          <span className="text-muted-foreground">Sem fornecedor</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">{f.count}</TableCell>
                      <TableCell className="text-right">{formatEUR(f.valor)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1 p-4">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
          {icon}<span>{label}</span>
        </div>
        <div className="text-2xl font-semibold">{value}</div>
        {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
      </CardContent>
    </Card>
  );
}