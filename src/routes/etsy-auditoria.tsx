import { createFileRoute, Link } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, FileDigit, Boxes } from "lucide-react";

export const Route = createFileRoute("/etsy-auditoria")({
  head: () => ({ meta: [{ title: "Auditoria Etsy" }] }),
  component: () => {
    const { etsyProdutos, materiais, ficheirosDigitais, auditoria, webhooksProcessados } = useStore();
    const linhas = etsyProdutos.map((p) => {
      const faltas = p.materiais
        .map((mu) => ({ mu, m: materiais.find((x) => x.id === mu.materialId) }))
        .filter((x) => !x.m || (x.m.stock ?? 0) < x.mu.quantidade);
      const downloads = ficheirosDigitais.filter((f) => (f as any).etsyListingId === p.etsyListingId);
      return { p, faltas, downloads };
    });
    const eventosEtsy = auditoria.filter((a) => /etsy/i.test(a.acao));
    const processados = Object.keys(webhooksProcessados).length;
    return (
      <div className="space-y-6">
        <PageHeader
          title="Auditoria Etsy"
          description="Mapeamento de variantes, materiais (BOM), downloads digitais e histórico de webhooks."
          actions={<Button asChild variant="outline"><Link to="/etsy">Voltar à Etsy</Link></Button>}
        />

        <div className="grid gap-3 sm:grid-cols-3">
          <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Produtos mapeados</div><div className="font-display text-2xl">{etsyProdutos.length}</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Eventos processados (idempotentes)</div><div className="font-display text-2xl">{processados}</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Ficheiros digitais</div><div className="font-display text-2xl">{ficheirosDigitais.length}</div></CardContent></Card>
        </div>

        <Card><CardContent className="space-y-2 p-4">
          <h3 className="font-display font-semibold">Mapeamento de produtos</h3>
          {linhas.length === 0 && <p className="text-sm text-muted-foreground">Sem produtos Etsy mapeados.</p>}
          {linhas.map(({ p, faltas, downloads }) => (
            <div key={p.id} className="rounded border border-border p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="font-medium">{p.nome}</div>
                  <div className="text-xs text-muted-foreground">Listing {p.etsyListingId}{(p as any).variacao ? ` · ${(p as any).variacao}` : ""} · tipo {(p as any).tipo || "físico"}</div>
                </div>
                {faltas.length === 0 ? (
                  <Badge className="bg-emerald-600"><CheckCircle2 className="mr-1 h-3 w-3" />Stock ok</Badge>
                ) : (
                  <Badge variant="destructive"><AlertTriangle className="mr-1 h-3 w-3" />Stock baixo</Badge>
                )}
              </div>
              <div className="mt-2 grid gap-2 md:grid-cols-2">
                <div>
                  <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground"><Boxes className="mr-1 inline h-3 w-3" />Materiais</div>
                  {p.materiais.length === 0 && <div className="text-xs">—</div>}
                  {p.materiais.map((mu, i) => {
                    const m = materiais.find((x) => x.id === mu.materialId);
                    return <div key={i} className="text-xs">{m?.nome || "?"} × {mu.quantidade} <span className="text-muted-foreground">(stock {m?.stock ?? 0})</span></div>;
                  })}
                </div>
                <div>
                  <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground"><FileDigit className="mr-1 inline h-3 w-3" />Downloads digitais</div>
                  {downloads.length === 0 && <div className="text-xs">—</div>}
                  {downloads.map((d) => <div key={d.id} className="text-xs">{d.nome}</div>)}
                </div>
              </div>
            </div>
          ))}
        </CardContent></Card>

        <Card><CardContent className="space-y-1 p-4">
          <h3 className="font-display font-semibold">Eventos Etsy recentes</h3>
          {eventosEtsy.length === 0 && <p className="text-sm text-muted-foreground">Sem eventos.</p>}
          {eventosEtsy.slice(0, 20).map((a) => (
            <div key={a.id} className="rounded border border-border p-2 text-xs">
              <div className="flex justify-between"><span className="font-medium">{a.acao}</span><span className="text-muted-foreground">{new Date(a.data).toLocaleString("pt-PT")}</span></div>
              {a.detalhes && <div className="text-muted-foreground">{a.detalhes}</div>}
            </div>
          ))}
        </CardContent></Card>
      </div>
    );
  },
});