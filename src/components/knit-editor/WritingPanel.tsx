// Fase 5 — Painel de Escrita & Dicionários.
// UI para auto-completar, gerar legenda, converter agulhas em qualquer sistema,
// pesquisar dicionário PT/US/UK, organizar fases em accordion e formatar
// blocos de repetição `*...* × N` (expandir/colapsar).

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  completar, gerarLegenda, converterAgulha, pesquisarDicionario,
  parseFases, fasesParaTexto, expandirRepeticoes, colapsarRepeticoes,
} from "@/lib/knit/escrita";
import type { Terminologia } from "@/lib/knit/dicionario";

export interface WritingPanelProps {
  terminologia: Terminologia;
  onChange: (p: { terminologia?: Terminologia }) => void;
}

export function WritingPanel({ terminologia, onChange }: WritingPanelProps) {
  const [linha, setLinha] = React.useState("mo");
  const [textoLegenda, setTextoLegenda] = React.useState(
    "Montar 60 malhas. C1: meia até ao fim. C2: liga. C3: *2 juntas à dir, laçada* × 4, meia.",
  );
  const [agMm, setAgMm] = React.useState<string>("4");
  const [agUs, setAgUs] = React.useState<string>("");
  const [agUk, setAgUk] = React.useState<string>("");
  const [dicQuery, setDicQuery] = React.useState("");
  const [fasesTexto, setFasesTexto] = React.useState(
    "## Gola\nMontar 96 malhas em circular. C1-C10: elástico 1×1.\n\n## Corpo\nContinuar em meia até 40cm da axila.",
  );
  const [repTexto, setRepTexto] = React.useState("meia, liga, meia, liga, meia, liga, meia, liga");

  const sugestoes = React.useMemo(() => completar(linha, terminologia), [linha, terminologia]);
  const legenda = React.useMemo(() => gerarLegenda(textoLegenda, terminologia), [textoLegenda, terminologia]);
  const dic = React.useMemo(() => pesquisarDicionario(dicQuery), [dicQuery]);
  const fases = React.useMemo(() => parseFases(fasesTexto), [fasesTexto]);

  const agulhaConv = React.useMemo(() => {
    const mmN = parseFloat(agMm);
    return converterAgulha({ mm: isNaN(mmN) ? undefined : mmN, us: agUs || undefined, uk: agUk || undefined });
  }, [agMm, agUs, agUk]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Auto-completar inteligente</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Label>Terminologia</Label>
            <Select value={terminologia} onValueChange={(v) => onChange({ terminologia: v as Terminologia })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pt">Português</SelectItem>
                <SelectItem value="us">US (knit/purl)</SelectItem>
                <SelectItem value="uk">UK (cast off)</SelectItem>
              </SelectContent>
            </Select>
            <Label>Comece a escrever</Label>
            <Input value={linha} onChange={(e) => setLinha(e.target.value)} placeholder="ex: mo" />
            <div className="flex flex-wrap gap-2">
              {sugestoes.length === 0 && <p className="text-sm text-muted-foreground">Sem sugestões.</p>}
              {sugestoes.map((s) => (
                <button key={s.id}
                  onClick={() => {
                    const partes = linha.split(/([,;\s]+)/);
                    partes[partes.length - 1] = s.abrev[terminologia];
                    setLinha(partes.join("") + " ");
                  }}
                  className="rounded border px-2 py-1 text-sm hover:bg-muted">
                  <span className="font-mono mr-1">{s.simbolo}</span>
                  <b>{s.abrev[terminologia]}</b> <span className="text-muted-foreground">— {s.nome[terminologia]}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Conversor de agulhas (mm ↔ US ↔ UK)</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-3 gap-2">
              <div><Label>mm</Label><Input value={agMm} onChange={(e) => { setAgMm(e.target.value); setAgUs(""); setAgUk(""); }} /></div>
              <div><Label>US</Label><Input value={agUs} onChange={(e) => { setAgUs(e.target.value); setAgMm(""); setAgUk(""); }} /></div>
              <div><Label>UK</Label><Input value={agUk} onChange={(e) => { setAgUk(e.target.value); setAgMm(""); setAgUs(""); }} /></div>
            </div>
            <div className="rounded border bg-muted/40 p-3 text-sm">
              <b>{agulhaConv.mm}mm</b> ≡ US <b>{agulhaConv.us}</b> ≡ UK <b>{agulhaConv.uk}</b>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Gerador automático de legenda</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <Textarea value={textoLegenda} onChange={(e) => setTextoLegenda(e.target.value)} className="min-h-[100px] font-mono text-sm" />
          <table className="w-full text-sm">
            <thead><tr className="text-left text-muted-foreground"><th>Símbolo</th><th>Abrev</th><th>Nome</th><th>Ocorrências</th></tr></thead>
            <tbody>
              {legenda.length === 0 && <tr><td colSpan={4} className="py-2 text-muted-foreground">Nenhum ponto detetado no texto.</td></tr>}
              {legenda.map((l) => (
                <tr key={l.abrev + l.nome}>
                  <td className="font-mono">{l.simbolo}</td>
                  <td>{l.abrev}</td>
                  <td>{l.nome}</td>
                  <td>{l.ocorrencias}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Dicionário PT / US / UK</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <Input placeholder="Pesquisar (ex: bind off, laçada, mate)"
            value={dicQuery} onChange={(e) => setDicQuery(e.target.value)} />
          <div className="max-h-72 overflow-y-auto rounded border">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-background text-left text-muted-foreground">
                <tr><th className="p-2">Símbolo</th><th className="p-2">PT</th><th className="p-2">US</th><th className="p-2">UK</th></tr>
              </thead>
              <tbody>
                {dic.map((l) => (
                  <tr key={l.id} className="border-t">
                    <td className="p-2 font-mono">{l.simbolo}</td>
                    <td className="p-2">{l.pt}</td>
                    <td className="p-2">{l.us}</td>
                    <td className="p-2">{l.uk}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">Diferenças críticas: <b>bind off</b> (US) vs <b>cast off</b> (UK); <b>kitchener</b> (US) vs <b>grafting</b> (UK).</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Organizador de fases</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <p className="text-xs text-muted-foreground">Usa <code>## Título</code> para separar fases. O accordion actualiza em tempo real.</p>
          <Textarea value={fasesTexto} onChange={(e) => setFasesTexto(e.target.value)} className="min-h-[140px] font-mono text-sm" />
          <Accordion type="single" collapsible className="w-full">
            {fases.map((f) => (
              <AccordionItem key={f.id} value={f.id}>
                <AccordionTrigger>{f.titulo}</AccordionTrigger>
                <AccordionContent>
                  <pre className="whitespace-pre-wrap text-sm">{f.conteudo}</pre>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <Button size="sm" variant="outline" onClick={() => {
            navigator.clipboard?.writeText(fasesParaTexto(fases));
            toast.success("Fases copiadas para o clipboard.");
          }}>Copiar fases normalizadas</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Blocos de repetição (asteriscos)</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <Textarea value={repTexto} onChange={(e) => setRepTexto(e.target.value)} className="min-h-[80px] font-mono text-sm" />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => setRepTexto(colapsarRepeticoes(repTexto))}>
              Colapsar em *...* × N
            </Button>
            <Button size="sm" variant="outline" onClick={() => setRepTexto(expandirRepeticoes(repTexto))}>
              Expandir para lista
            </Button>
          </div>
          <div className="rounded border bg-muted/40 p-2 text-sm font-mono">
            <b>Pré-visualização expandida:</b> {expandirRepeticoes(repTexto)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
