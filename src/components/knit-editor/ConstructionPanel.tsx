// Fase 4 — Painel de Construção & Acessórios.
// UI para wizards de raglan top-down e meia, tipo de agulha recomendado
// e gestão de marcadores de ponto (adicionar/remover/distribuir).

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  gerarRaglanTopDown, gerarMeia, recomendarAgulha,
  addMarcador, removerMarcador, distribuirMarcadores,
  type Marcador,
} from "@/lib/knit/construction";
import type { Gauge } from "@/lib/knit/engine";

export interface ConstructionPanelProps {
  gauge: Gauge;
  peitoCm: number;
  peCm: number;
  circular: boolean;
  marcadores: Marcador[];
  onChange: (
    p: Partial<{
      peitoCm: number;
      peCm: number;
      circular: boolean;
      marcadores: Marcador[];
    }>,
  ) => void;
}

export function ConstructionPanel(props: ConstructionPanelProps) {
  const { gauge, peitoCm, peCm, circular, marcadores, onChange } = props;

  const [ease, setEase] = React.useState(5);
  const [golaCm, setGolaCm] = React.useState(42);
  const [alturaCavaCm, setAlturaCavaCm] = React.useState(20);
  const [circPe, setCircPe] = React.useState(22);
  const [alturaCanoCm, setAlturaCanoCm] = React.useState(15);
  const [metodoMeia, setMetodoMeia] = React.useState<"toe-up" | "cuff-down">("cuff-down");

  const raglan = React.useMemo(
    () => gerarRaglanTopDown({ peitoCm, gauge, ease, golaCm, alturaCavaCm }),
    [peitoCm, gauge, ease, golaCm, alturaCavaCm],
  );
  const meia = React.useMemo(
    () => gerarMeia({
      peCm, gauge, alturaCanoCm, metodo: metodoMeia,
      circunferenciaPeCm: circPe,
    }),
    [peCm, gauge, alturaCanoCm, metodoMeia, circPe],
  );
  const agulhaCorpo = recomendarAgulha(peitoCm + ease, circular);
  const agulhaMeia = recomendarAgulha(circPe, true);

  // Marcadores
  const [novaPos, setNovaPos] = React.useState(0);
  const [novaCor, setNovaCor] = React.useState("#ef4444");
  const [novaNota, setNovaNota] = React.useState("");
  const [distN, setDistN] = React.useState(4);

  return (
    <div className="space-y-4" data-testid="construction-panel">
      <div className="grid gap-4 md:grid-cols-2">
        {/* Raglan */}
        <Card>
          <CardHeader><CardTitle className="text-base">Wizard Top-Down (Raglan)</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div><Label>Peito (cm)</Label>
                <Input type="number" value={peitoCm}
                  onChange={(e) => onChange({ peitoCm: Number(e.target.value) })} /></div>
              <div><Label>Folga (cm)</Label>
                <Input type="number" value={ease}
                  onChange={(e) => setEase(Number(e.target.value))} /></div>
              <div><Label>Gola (cm)</Label>
                <Input type="number" value={golaCm}
                  onChange={(e) => setGolaCm(Number(e.target.value))} /></div>
              <div className="col-span-3"><Label>Altura da cava/raglan (cm)</Label>
                <Input type="number" value={alturaCavaCm}
                  onChange={(e) => setAlturaCavaCm(Number(e.target.value))} /></div>
            </div>
            <ul className="text-sm space-y-1 border rounded p-2 bg-muted/30">
              <li>Total peito: <b>{raglan.totalMalhas}</b> malhas</li>
              <li>Montar na gola: <b>{raglan.gola}</b> malhas</li>
              <li>Aumentos totais: <b>{raglan.aumentos}</b> ({raglan.carreirasRaglan} carreiras)</li>
              <li>Cada manga: <b>{raglan.manga}</b> · meio-corpo: <b>{raglan.corpo}</b></li>
            </ul>
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer">Ver plano completo</summary>
              <ol className="mt-2 list-decimal pl-4 space-y-1">
                {raglan.schedule.map((s, i) => <li key={i}>{s}</li>)}
              </ol>
            </details>
            <div className="text-xs rounded bg-primary/5 border border-primary/20 p-2">
              Agulha sugerida: <b>{agulhaCorpo.tipo}</b>
              {agulhaCorpo.comprimentoCm ? ` ${agulhaCorpo.comprimentoCm} cm` : ""}
              &nbsp;— {agulhaCorpo.motivo}
            </div>
          </CardContent>
        </Card>

        {/* Meia */}
        <Card>
          <CardHeader><CardTitle className="text-base">Sock Wizard</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div><Label>Pé (cm)</Label>
                <Input type="number" value={peCm}
                  onChange={(e) => onChange({ peCm: Number(e.target.value) })} /></div>
              <div><Label>Circunf. (cm)</Label>
                <Input type="number" value={circPe}
                  onChange={(e) => setCircPe(Number(e.target.value))} /></div>
              <div><Label>Cano (cm)</Label>
                <Input type="number" value={alturaCanoCm}
                  onChange={(e) => setAlturaCanoCm(Number(e.target.value))} /></div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Switch checked={metodoMeia === "toe-up"}
                onCheckedChange={(v) => setMetodoMeia(v ? "toe-up" : "cuff-down")} />
              <span>{metodoMeia === "toe-up" ? "Toe-up (do bico ao cano)" : "Cuff-down (do cano ao bico)"}</span>
            </div>
            <ul className="text-sm space-y-1 border rounded p-2 bg-muted/30">
              <li>Montar: <b>{meia.montar}</b> · calcanhar: <b>{meia.calcanhar}</b> · ponte: <b>{meia.ponte}</b></li>
              <li>Cano: <b>{meia.cano}</b> carreiras · bico fecha em <b>{meia.puxaresBico}</b></li>
            </ul>
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer">Ver plano completo</summary>
              <ol className="mt-2 list-decimal pl-4 space-y-1">
                {meia.schedule.map((s, i) => <li key={i}>{s}</li>)}
              </ol>
            </details>
            <div className="text-xs rounded bg-primary/5 border border-primary/20 p-2">
              Agulha sugerida: <b>{agulhaMeia.tipo}</b>
              {agulhaMeia.comprimentoCm ? ` ${agulhaMeia.comprimentoCm} cm` : ""}
              &nbsp;— {agulhaMeia.motivo}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Circular vs reta */}
      <Card>
        <CardHeader><CardTitle className="text-base">Circular vs Retas</CardTitle></CardHeader>
        <CardContent className="flex items-center gap-3">
          <Switch checked={circular} onCheckedChange={(v) => onChange({ circular: v })} />
          <span className="text-sm">
            {circular
              ? "Circular (todas as carreiras RS, direita → esquerda)"
              : "Retas (virar o trabalho a cada carreira)"}
          </span>
        </CardContent>
      </Card>

      {/* Marcadores */}
      <Card>
        <CardHeader><CardTitle className="text-base">Marcadores de Ponto</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-4 gap-2 items-end">
            <div><Label>Posição (malha)</Label>
              <Input type="number" value={novaPos}
                onChange={(e) => setNovaPos(Number(e.target.value))} /></div>
            <div><Label>Cor</Label>
              <Input type="color" value={novaCor}
                onChange={(e) => setNovaCor(e.target.value)} /></div>
            <div className="col-span-2"><Label>Nota</Label>
              <Input value={novaNota}
                onChange={(e) => setNovaNota(e.target.value)}
                placeholder="ex: início do raglan" /></div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm"
              onClick={() => {
                onChange({ marcadores: addMarcador(marcadores, novaPos, novaCor, novaNota || undefined) });
                setNovaNota("");
                toast.success("Marcador adicionado.");
              }}
            >+ Adicionar marcador</Button>
            <div className="flex items-center gap-2">
              <Input type="number" className="h-9 w-20" value={distN}
                onChange={(e) => setDistN(Number(e.target.value))} />
              <Button size="sm" variant="outline"
                onClick={() => {
                  onChange({ marcadores: distribuirMarcadores(raglan.totalMalhas, distN) });
                  toast.success(`Distribuídos ${distN} marcadores igualmente.`);
                }}
              >Distribuir</Button>
            </div>
            <Button size="sm" variant="ghost"
              onClick={() => onChange({ marcadores: [] })}>Limpar todos</Button>
          </div>
          {marcadores.length === 0
            ? <p className="text-xs text-muted-foreground">Sem marcadores. Adiciona um ou usa "Distribuir".</p>
            : (
              <ul className="text-sm space-y-1">
                {marcadores.map((m) => (
                  <li key={m.id} className="flex items-center gap-2 border rounded px-2 py-1">
                    <span className="inline-block h-3 w-3 rounded-full" style={{ background: m.cor }} />
                    <span className="font-mono">m {m.posicao}</span>
                    {m.nota ? <span className="text-muted-foreground">— {m.nota}</span> : null}
                    <Button size="sm" variant="ghost" className="ml-auto h-6"
                      onClick={() => onChange({ marcadores: removerMarcador(marcadores, m.id) })}
                    >Remover</Button>
                  </li>
                ))}
              </ul>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
