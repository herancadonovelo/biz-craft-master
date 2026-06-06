import { createFileRoute, Link } from "@tanstack/react-router";
import { useStore, formatEUR } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/gestao-fornecedores")({
  head: () => ({ meta: [{ title: "Gestão de fornecedores" }] }),
  component: () => {
    const { fornecedores, materiais } = useStore();
    return (
      <div className="space-y-6">
        <PageHeader
          title="Gestão de fornecedores"
          description="Informação detalhada de cada fornecedor e os artigos que disponibiliza."
          actions={<Button asChild variant="outline"><Link to="/fornecedores">Editar fornecedores</Link></Button>}
        />
        <div className="grid gap-4 md:grid-cols-2">
          {fornecedores.map((f) => {
            const arts = materiais.filter((m) => m.fornecedorId === f.id);
            const total = arts.reduce((s, m) => s + m.precoCompra * m.stock, 0);
            return (
              <Card key={f.id}>
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <CardTitle className="font-display">{f.nome}</CardTitle>
                    <p className="text-sm text-muted-foreground">{f.email} · {f.contacto}</p>
                  </div>
                  <Badge variant="secondary">{arts.length} artigos</Badge>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1 text-sm">
                    {arts.map((m) => (
                      <li key={m.id} className="flex justify-between border-b border-border/60 py-1">
                        <span>{m.nome}</span>
                        <span className="font-display">{formatEUR(m.precoCompra)}/{m.unidade}</span>
                      </li>
                    ))}
                    {arts.length === 0 && <li className="text-muted-foreground">Sem artigos associados.</li>}
                  </ul>
                  <div className="mt-3 flex justify-between text-sm">
                    <span className="text-muted-foreground">Stock atual valor</span>
                    <span className="font-display font-semibold">{formatEUR(total)}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  },
});