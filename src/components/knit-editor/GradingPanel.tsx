// Painel completo da Fase 2 — Matemática e Escalonamento (Grading).
// Consome `src/lib/knit/grading.ts` (motor puro) para tudo o que é cálculo.

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import type { Chart, Gauge } from "@/lib/knit/engine";
import { malhasParaCm, carreirasParaCm } from "@/lib/knit/engine";
import {
  graduar, formatarParenteses, calcularCava, calcularDecote,
  validarSimetriaChart, verificarMultiploComBordas, espacamentoBotoesAvancado,
} from "@/lib/knit/grading";

export interface GradingPanelProps {
  chart: Chart;
  gauge: Gauge;
  peitoBaseCm: number;
  multiplo: number;
  bordas: number;
  carreirasTotais: number;
  botoes: number;
  margemBotoesInferior: number;
  margemBotoesSuperior: number;
  cavaCm: number;
  decoteTipo: "V" | "redondo";
  decoteLarguraCm: number;
  decoteProfundidadeCm: number;
  onChange: (partial: Partial<GradingPanelProps>) => void;
}

export function GradingPanel(p: GradingPanelProps) {
  const linhas = React.useMemo(
    () => graduar(p.peitoBaseCm, p.gauge, p.multiplo),
    [p.peitoBaseCm, p.gauge, p.multiplo],
  );
  const parentesesMalhas = React.useMemo(
    () => formatarParenteses(linhas.map((l) => l.malhasAjustadas)),
    [linhas],
  );
  const parentesesPeito = React.useMemo(
    () => formatarParenteses(linhas.map((l) => l.peitoCm)),
    [linhas],
  );

  const totalMalhasC1 = React.useMemo(() => {
    // usamos peito base como referência para o check inicial
    return malhasParaCm(p.gauge, p.peitoBaseCm);
  }, [p.gauge, p.peitoBaseCm]);

  const chkMult = React.useMemo(
    () => verificarMultiploComBordas(totalMalhasC1, p.multiplo, p.bordas),
    [totalMalhasC1, p.multiplo, p.bordas],
  );

  const cava = React.useMemo(
    () => calcularCava({ malhasPeito: totalMalhasC1, larguraCavaCm: p.cavaCm, gauge: p.gauge }),
    [totalMalhasC1, p.cavaCm, p.gauge],
  );

  const decote = React.useMemo(
    () => calcularDecote({
      malhasPeito: totalMalhasC1, tipo: p.decoteTipo,
      larguraDecoteCm: p.decoteLarguraCm, profundidadeCm: p.decoteProfundidadeCm, gauge: p.gauge,
    }),
    [totalMalhasC1, p.decoteTipo, p.decoteLarguraCm, p.decoteProfundidadeCm, p.gauge],
  );

  const carreirasBotoes = React.useMemo(
    () => espacamentoBotoesAvancado(p.carreirasTotais, p.botoes, p.margemBotoesInferior, p.margemBotoesSuperior),
    [p.carreirasTotais, p.botoes, p.margemBotoesInferior, p.margemBotoesSuperior],
  );

  const simetria = React.useMemo(() => validarSimetriaChart(p.chart), [p.chart]);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader><CardTitle className="text-base">Tensão / Amostra</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div><Label>Pontos</Label>
              <Input type="number" value={p.gauge.pontos}
                onChange={(e) => p.onChange({ gauge: { ...p.gauge, pontos: Number(e.target.value) } as Gauge })} /></div>
            <div><Label>Carreiras</Label>
              <Input type="number" value={p.gauge.carreiras}
                onChange={(e) => p.onChange({ gauge: { ...p.gauge, carreiras: Number(e.target.value) } as Gauge })} /></div>
            <div><Label>em cm</Label>
              <Input type="number" value={p.gauge.cm}
                onChange={(e) => p.onChange({ gauge: { ...p.gauge, cm: Number(e.target.value) } as Gauge })} /></div>
          </div>
          <p className="text-sm text-muted-foreground">
            Base para escalonamento automático dos tamanhos (XS–XXL).
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Verificador de múltiplos</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Múltiplo (padrão)</Label>
              <Input type="number" value={p.multiplo}
                onChange={(e) => p.onChange({ multiplo: Number(e.target.value) })} /></div>
            <div><Label>Malhas de borda (por lado)</Label>
              <Input type="number" value={p.bordas}
                onChange={(e) => p.onChange({ bordas: Number(e.target.value) })} /></div>
          </div>
          <p className="text-sm">Malhas de partida (M): <b>{totalMalhasC1}</b> · repetição sobre <b>{Math.max(0, totalMalhasC1 - p.bordas * 2)}</b> malhas.</p>
          {chkMult.ok ? (
            <p className="text-sm text-green-600 flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> Divisível por {p.multiplo}.</p>
          ) : (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <AlertTriangle className="h-4 w-4" /> Não divide. Ajusta para {chkMult.sugestao?.[0]} ou {chkMult.sugestao?.[1]}.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Escalonamento automático (XS–XXL)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2 max-w-md">
            <div><Label>Peito base (M) em cm</Label>
              <Input type="number" value={p.peitoBaseCm}
                onChange={(e) => p.onChange({ peitoBaseCm: Number(e.target.value) })} /></div>
          </div>
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="p-2 text-left">Tamanho</th>
                  <th className="p-2 text-center">Peito (cm)</th>
                  <th className="p-2 text-center">Malhas</th>
                  <th className="p-2 text-center">Ajustadas ao múltiplo</th>
                  <th className="p-2 text-center">Δ ajuste</th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((l) => (
                  <tr key={l.size} className="border-t">
                    <td className="p-2 font-medium">{l.size}</td>
                    <td className="p-2 text-center">{l.peitoCm}</td>
                    <td className="p-2 text-center font-mono">{l.malhas}</td>
                    <td className="p-2 text-center font-mono">{l.malhasAjustadas}</td>
                    <td className="p-2 text-center">
                      {l.ajuste === 0 ? <Badge variant="secondary">ok</Badge> :
                        <Badge variant={Math.abs(l.ajuste) <= 2 ? "secondary" : "destructive"}>{l.ajuste > 0 ? `+${l.ajuste}` : l.ajuste}</Badge>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="rounded-md bg-muted/30 p-3 space-y-1 text-sm font-mono">
            <div>Peito: <b>{parentesesPeito}</b> cm</div>
            <div>Montar: <b>{parentesesMalhas}</b> malhas</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Calculadora de Cavas</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Profundidade da cava (cm)</Label>
            <Input type="number" value={p.cavaCm}
              onChange={(e) => p.onChange({ cavaCm: Number(e.target.value) })} />
          </div>
          <p className="text-sm">Bind-off inicial (por lado): <b>{cava.bindOffCadaLado}</b> · Total: <b>{cava.totalDiminuicoes}</b> por lado · Ombro final: <b>{cava.malhasFinaisOmbro}</b> malhas.</p>
          <div className="rounded-md border max-h-40 overflow-auto">
            <table className="w-full text-xs font-mono">
              <thead className="bg-muted/40"><tr><th className="p-1 text-left">Carreira</th><th className="p-1 text-left">Ação</th><th className="p-1 text-right">Malhas</th></tr></thead>
              <tbody>
                {cava.passos.map((s, i) => (
                  <tr key={i} className="border-t"><td className="p-1">{s.carreira}</td><td className="p-1">{s.tipo}</td><td className="p-1 text-right">{s.malhas}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Calculadora de Decotes</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Tipo</Label>
              <Select value={p.decoteTipo} onValueChange={(v) => p.onChange({ decoteTipo: v as "V" | "redondo" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="redondo">Redondo</SelectItem>
                  <SelectItem value="V">V</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Largura (cm)</Label>
              <Input type="number" value={p.decoteLarguraCm}
                onChange={(e) => p.onChange({ decoteLarguraCm: Number(e.target.value) })} /></div>
            <div className="col-span-2"><Label>Profundidade (cm)</Label>
              <Input type="number" value={p.decoteProfundidadeCm}
                onChange={(e) => p.onChange({ decoteProfundidadeCm: Number(e.target.value) })} /></div>
          </div>
          <p className="text-sm">Rematar ao centro: <b>{decote.malhasCentro}</b> malhas · Diminuir <b>{decote.diminuicoesPorLado}</b> por lado ao longo de <b>{decote.carreiras}</b> carreiras (a cada <b>{decote.passo}</b>).</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Casas de botão</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Carreiras totais</Label>
              <Input type="number" value={p.carreirasTotais}
                onChange={(e) => p.onChange({ carreirasTotais: Number(e.target.value) })} /></div>
            <div><Label>Nº de botões</Label>
              <Input type="number" value={p.botoes}
                onChange={(e) => p.onChange({ botoes: Number(e.target.value) })} /></div>
            <div><Label>Margem inferior</Label>
              <Input type="number" value={p.margemBotoesInferior}
                onChange={(e) => p.onChange({ margemBotoesInferior: Number(e.target.value) })} /></div>
            <div><Label>Margem superior</Label>
              <Input type="number" value={p.margemBotoesSuperior}
                onChange={(e) => p.onChange({ margemBotoesSuperior: Number(e.target.value) })} /></div>
          </div>
          <p className="text-sm">Casas nas carreiras: <b>{carreirasBotoes.join(", ") || "—"}</b></p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Validador de simetria (chart)</CardTitle></CardHeader>
        <CardContent>
          {simetria.ok ? (
            <p className="text-sm text-green-600 flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> Todas as carreiras têm simetria coerente.</p>
          ) : (
            <div className="space-y-1">
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" /> {simetria.problemas.length} carreira(s) com problemas:
              </p>
              <ul className="text-xs list-disc pl-6 max-h-32 overflow-auto">
                {simetria.problemas.map((pr) => (
                  <li key={pr.row}>C{pr.row}: {pr.msg}</li>
                ))}
              </ul>
            </div>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            Peito escolhido dá {carreirasParaCm(p.gauge, p.cavaCm)} carreiras de cava — usado nos cálculos.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}