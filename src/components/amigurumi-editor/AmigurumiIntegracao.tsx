import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Play, Pause, RotateCcw, Plus, Trash2, ShoppingCart, Calculator, Scale, Timer, Palette as YarnIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useStore, formatEUR, type Material } from "@/lib/store";

const uid = () => Math.random().toString(36).slice(2, 10);
const KEY = "amigurumi-integracao-v1";

/* -------------------- Types -------------------- */

interface FioSelecionado {
  id: string;
  materialId: string;
  gramas: number;       // quantidade estimada em gramas
  metrosPor100g?: number; // metragem informada pela artesã (opcional)
}
interface Estado {
  fios: FioSelecionado[];
  horas: number;
  precoHora: number;
  margem: number;         // 0.7 = 70%
  cronoAcumulado: number; // segundos
}
const DEFAULT: Estado = { fios: [], horas: 0, precoHora: 12, margem: 0.7, cronoAcumulado: 0 };

function load(): Estado {
  if (typeof window === "undefined") return DEFAULT;
  try { const raw = window.localStorage.getItem(KEY); if (raw) return { ...DEFAULT, ...JSON.parse(raw) }; } catch {}
  return DEFAULT;
}

/* -------------------- Root -------------------- */

export function AmigurumiIntegracao() {
  const [s, setS] = useState<Estado>(load);
  useEffect(() => { try { window.localStorage.setItem(KEY, JSON.stringify(s)); } catch {} }, [s]);

  return (
    <Tabs defaultValue="fios" className="space-y-3">
      <TabsList>
        <TabsTrigger value="fios"><YarnIcon className="mr-1 h-3.5 w-3.5" />Fios (stock)</TabsTrigger>
        <TabsTrigger value="consumo"><Scale className="mr-1 h-3.5 w-3.5" />Consumo</TabsTrigger>
        <TabsTrigger value="tempo"><Timer className="mr-1 h-3.5 w-3.5" />Tempo de produção</TabsTrigger>
        <TabsTrigger value="preco"><Calculator className="mr-1 h-3.5 w-3.5" />Precificador</TabsTrigger>
        <TabsTrigger value="kit"><ShoppingCart className="mr-1 h-3.5 w-3.5" />Kit → Compras</TabsTrigger>
      </TabsList>

      <TabsContent value="fios"><FiosPanel s={s} setS={setS} /></TabsContent>
      <TabsContent value="consumo"><ConsumoPanel s={s} setS={setS} /></TabsContent>
      <TabsContent value="tempo"><TempoPanel s={s} setS={setS} /></TabsContent>
      <TabsContent value="preco"><PrecoPanel s={s} setS={setS} /></TabsContent>
      <TabsContent value="kit"><KitPanel s={s} /></TabsContent>
    </Tabs>
  );
}

/* -------------------- Helpers -------------------- */

function useFiosStock() {
  const materiais = useStore((x) => x.materiais);
  return useMemo(
    () => materiais.filter((m) => !m.categoria || m.categoria === "fios" || m.categoria === "meadas"),
    [materiais],
  );
}

function custoUnitario(m: Material) { return m.precoCompra || 0; }

/* -------------------- 1) Fios do stock -------------------- */

function FiosPanel({ s, setS }: { s: Estado; setS: (fn: (x: Estado) => Estado) => void }) {
  const fios = useFiosStock();
  const materiais = useStore((x) => x.materiais);

  const adicionar = (materialId: string) => {
    if (s.fios.some((f) => f.materialId === materialId)) return;
    setS((x) => ({ ...x, fios: [...x.fios, { id: uid(), materialId, gramas: 50, metrosPor100g: undefined }] }));
  };

  return (
    <Card className="!bg-white/100 opacity-100">
      <CardHeader className="pb-2 flex-row items-center justify-between gap-2">
        <CardTitle className="text-sm font-display">Fios selecionados a partir do inventário</CardTitle>
        <div className="flex items-center gap-2">
          <Select value="" onValueChange={adicionar}>
            <SelectTrigger className="h-8 w-56"><SelectValue placeholder="+ adicionar fio do stock" /></SelectTrigger>
            <SelectContent>
              {fios.length === 0 && <SelectItem value="__none" disabled>Sem fios no inventário</SelectItem>}
              {fios.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.nome}{m.marca ? ` · ${m.marca}` : ""}{m.codigoCor ? ` · ${m.codigoCor}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Link to="/stock" className="text-xs underline text-muted-foreground">gerir stock →</Link>
        </div>
      </CardHeader>
      <CardContent>
        {s.fios.length === 0 ? (
          <p className="text-sm text-muted-foreground">Escolhe fios do teu inventário — o custo real e a disponibilidade são puxados automaticamente.</p>
        ) : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>Fio</TableHead>
              <TableHead>Marca / Cor</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead className="text-right">Preço</TableHead>
              <TableHead className="text-right">g necessários</TableHead>
              <TableHead className="text-right">Metros/100g</TableHead>
              <TableHead />
            </TableRow></TableHeader>
            <TableBody>
              {s.fios.map((f) => {
                const m = materiais.find((x) => x.id === f.materialId);
                if (!m) return null;
                const stockOk = m.stock * (m.unidade === "g" ? 1 : 50) >= f.gramas;
                return (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">{m.nome}</TableCell>
                    <TableCell className="text-xs">{m.marca ?? "—"}{m.codigoCor ? ` · ${m.codigoCor}` : ""}</TableCell>
                    <TableCell className="text-right">
                      {stockOk
                        ? <Badge variant="secondary">{m.stock} {m.unidade}</Badge>
                        : <Badge variant="destructive">{m.stock} {m.unidade}</Badge>}
                    </TableCell>
                    <TableCell className="text-right">{formatEUR(custoUnitario(m))}/{m.unidade}</TableCell>
                    <TableCell className="text-right">
                      <Input type="number" min={0} value={f.gramas} className="h-8 w-24"
                        onChange={(e) => setS((x) => ({ ...x, fios: x.fios.map((y) => y.id === f.id ? { ...y, gramas: +e.target.value } : y) }))} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Input type="number" min={0} value={f.metrosPor100g ?? ""} placeholder="ex: 300" className="h-8 w-24"
                        onChange={(e) => setS((x) => ({ ...x, fios: x.fios.map((y) => y.id === f.id ? { ...y, metrosPor100g: e.target.value ? +e.target.value : undefined } : y) }))} />
                    </TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost"
                        onClick={() => setS((x) => ({ ...x, fios: x.fios.filter((y) => y.id !== f.id) }))}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

/* -------------------- 2) Consumo (peso → metragem) -------------------- */

function ConsumoPanel({ s, setS }: { s: Estado; setS: (fn: (x: Estado) => Estado) => void }) {
  const materiais = useStore((x) => x.materiais);
  const linhas = s.fios.map((f) => {
    const m = materiais.find((x) => x.id === f.materialId);
    if (!m) return null;
    const metros = f.metrosPor100g ? (f.gramas / 100) * f.metrosPor100g : null;
    const custo = (f.gramas / 100) * custoUnitario(m) * (m.unidade === "novelo" ? 1 : m.unidade === "g" ? 1 : 1);
    // Se unidade for "g" o preço já é por grama; caso contrário assumimos por 100g/novelo.
    const custoAj = m.unidade === "g" ? f.gramas * custoUnitario(m)
                  : (f.gramas / 100) * custoUnitario(m);
    return { f, m, metros, custo: custoAj };
  }).filter(Boolean) as Array<{ f: FioSelecionado; m: Material; metros: number | null; custo: number }>;

  const totalGramas = linhas.reduce((a, x) => a + x.f.gramas, 0);
  const totalMetros = linhas.reduce((a, x) => a + (x.metros || 0), 0);
  const totalCusto  = linhas.reduce((a, x) => a + x.custo, 0);

  return (
    <Card className="!bg-white/100 opacity-100">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-display">Calculadora de consumo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {linhas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Adiciona fios na aba "Fios (stock)" para calcular consumo e custo.</p>
        ) : (
          <>
            <Table>
              <TableHeader><TableRow>
                <TableHead>Fio</TableHead>
                <TableHead className="text-right">Gramas</TableHead>
                <TableHead className="text-right">Metros</TableHead>
                <TableHead className="text-right">Custo</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {linhas.map(({ f, m, metros, custo }) => (
                  <TableRow key={f.id}>
                    <TableCell>{m.nome}</TableCell>
                    <TableCell className="text-right">{f.gramas} g</TableCell>
                    <TableCell className="text-right">{metros ? `${metros.toFixed(1)} m` : "—"}</TableCell>
                    <TableCell className="text-right">{formatEUR(custo)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/40 font-medium">
                  <TableCell>Total</TableCell>
                  <TableCell className="text-right">{totalGramas} g</TableCell>
                  <TableCell className="text-right">{totalMetros ? `${totalMetros.toFixed(0)} m` : "—"}</TableCell>
                  <TableCell className="text-right">{formatEUR(totalCusto)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <p className="text-xs text-muted-foreground">
              Dica: informa "Metros/100g" na aba Fios para converter automaticamente peso ↔ metragem.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

/* -------------------- 3) Cronómetro -------------------- */

function TempoPanel({ s, setS }: { s: Estado; setS: (fn: (x: Estado) => Estado) => void }) {
  const [running, setRunning] = useState(false);
  const [tick, setTick] = useState(0);
  const startedAt = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    startedAt.current = Date.now() - (s.cronoAcumulado * 1000);
    const id = window.setInterval(() => setTick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, [running]);

  const seg = running && startedAt.current
    ? Math.floor((Date.now() - startedAt.current) / 1000)
    : s.cronoAcumulado;

  const pause = () => {
    setRunning(false);
    setS((x) => ({ ...x, cronoAcumulado: seg }));
  };
  const reset = () => { setRunning(false); setS((x) => ({ ...x, cronoAcumulado: 0 })); };

  const guardarComoHoras = () => {
    const horas = +(seg / 3600).toFixed(2);
    setS((x) => ({ ...x, horas: +(x.horas + horas).toFixed(2) }));
    reset();
    toast.success(`+${horas} h somadas ao precificador`);
  };

  const fmt = (n: number) => {
    const h = Math.floor(n / 3600); const m = Math.floor((n % 3600) / 60); const s2 = n % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s2).padStart(2, "0")}`;
  };

  return (
    <Card className="!bg-white/100 opacity-100">
      <CardHeader className="pb-2"><CardTitle className="text-sm font-display">Cronómetro de sessão</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="text-center font-mono text-4xl tabular-nums" data-testid="crono-display">{fmt(seg)}</div>
        <div className="flex flex-wrap justify-center gap-2">
          {!running
            ? <Button onClick={() => setRunning(true)}><Play className="mr-1 h-4 w-4" />Iniciar</Button>
            : <Button variant="secondary" onClick={pause}><Pause className="mr-1 h-4 w-4" />Pausar</Button>}
          <Button variant="outline" onClick={reset}><RotateCcw className="mr-1 h-4 w-4" />Zerar</Button>
          <Button variant="outline" onClick={guardarComoHoras} disabled={seg < 60}>
            Somar como horas ({(seg / 3600).toFixed(2)}h)
          </Button>
        </div>
        <p className="text-center text-xs text-muted-foreground">
          Horas acumuladas para preço: <strong>{s.horas.toFixed(2)}h</strong>
        </p>
      </CardContent>
    </Card>
  );
}

/* -------------------- 4) Precificador -------------------- */

function PrecoPanel({ s, setS }: { s: Estado; setS: (fn: (x: Estado) => Estado) => void }) {
  const materiais = useStore((x) => x.materiais);

  const custoMateriais = s.fios.reduce((acc, f) => {
    const m = materiais.find((x) => x.id === f.materialId);
    if (!m) return acc;
    return acc + (m.unidade === "g" ? f.gramas * custoUnitario(m) : (f.gramas / 100) * custoUnitario(m));
  }, 0);

  const custoMaoObra = s.horas * s.precoHora;
  const custoTotal   = custoMateriais + custoMaoObra;
  const precoFinal   = custoTotal / (1 - s.margem);
  const lucro        = precoFinal - custoTotal;

  return (
    <Card className="!bg-white/100 opacity-100">
      <CardHeader className="pb-2 flex-row items-center justify-between gap-2">
        <CardTitle className="text-sm font-display">Precificador rápido</CardTitle>
        <Link to="/calculadora" className="text-xs underline text-muted-foreground">
          calculadora completa →
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-3">
          <div><Label>Horas</Label>
            <Input type="number" min={0} step={0.25} value={s.horas}
              onChange={(e) => setS((x) => ({ ...x, horas: +e.target.value }))} /></div>
          <div><Label>Preço/hora (€)</Label>
            <Input type="number" min={0} value={s.precoHora}
              onChange={(e) => setS((x) => ({ ...x, precoHora: +e.target.value }))} /></div>
          <div><Label>Margem</Label>
            <Select value={String(s.margem)} onValueChange={(v) => setS((x) => ({ ...x, margem: +v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="0.3">30%</SelectItem>
                <SelectItem value="0.5">50%</SelectItem>
                <SelectItem value="0.6">60%</SelectItem>
                <SelectItem value="0.7">70%</SelectItem>
                <SelectItem value="0.8">80%</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded border bg-muted/30 p-3 text-sm">
          <Row label="Custo materiais" value={formatEUR(custoMateriais)} />
          <Row label="Custo mão-de-obra" value={formatEUR(custoMaoObra)} />
          <Row label="Custo total" value={formatEUR(custoTotal)} strong />
          <hr className="my-2" />
          <Row label="Preço sugerido" value={formatEUR(precoFinal)} strong big />
          <Row label="Lucro estimado" value={formatEUR(lucro)} muted />
        </div>
      </CardContent>
    </Card>
  );
}

function Row({ label, value, strong, big, muted }: { label: string; value: string; strong?: boolean; big?: boolean; muted?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${muted ? "text-muted-foreground" : ""} ${big ? "text-base" : ""}`}>
      <span>{label}</span>
      <span className={strong ? "font-semibold" : ""}>{value}</span>
    </div>
  );
}

/* -------------------- 5) Kit → Lista de compras -------------------- */

function KitPanel({ s }: { s: Estado }) {
  const materiais = useStore((x) => x.materiais);
  const update = useStore((x) => x.update);

  const marcarNecessarios = () => {
    let touched = 0;
    s.fios.forEach((f) => {
      const m = materiais.find((x) => x.id === f.materialId);
      if (!m) return;
      const stockAtual = m.stock * (m.unidade === "g" ? 1 : 50);
      if (stockAtual < f.gramas) {
        // Sobe o stockMinimo para forçar aparecer em lista-compras (sem alterar preço).
        const novoMinimo = Math.max(m.stockMinimo || 0, Math.ceil((f.gramas - stockAtual) / (m.unidade === "g" ? 1 : 50)) + (m.stockMinimo || 0));
        update("materiais", m.id, { stockMinimo: novoMinimo });
        touched++;
      }
    });
    toast.success(`Kit gerado. ${touched} material(is) marcados para reposição.`);
  };

  return (
    <Card className="!bg-white/100 opacity-100">
      <CardHeader className="pb-2 flex-row items-center justify-between gap-2">
        <CardTitle className="text-sm font-display">Gerador de kit → Lista de compras</CardTitle>
        <div className="flex gap-2">
          <Button size="sm" onClick={marcarNecessarios} disabled={s.fios.length === 0}>
            <Plus className="mr-1 h-3.5 w-3.5" /> Enviar para lista de compras
          </Button>
          <Link to="/lista-compras" className="text-xs underline text-muted-foreground self-center">ver lista →</Link>
        </div>
      </CardHeader>
      <CardContent>
        {s.fios.length === 0 ? (
          <p className="text-sm text-muted-foreground">Adiciona fios primeiro; o kit calcula quanto falta comprar face ao stock.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {s.fios.map((f) => {
              const m = materiais.find((x) => x.id === f.materialId);
              if (!m) return null;
              const stockAtual = m.stock * (m.unidade === "g" ? 1 : 50);
              const falta = Math.max(0, f.gramas - stockAtual);
              return (
                <li key={f.id} className="flex items-center justify-between rounded border px-2 py-1">
                  <span>{m.nome}</span>
                  <span>
                    Precisa <strong>{f.gramas}g</strong>
                    {" · "}Tens <strong>{stockAtual}g</strong>
                    {falta > 0
                      ? <Badge variant="destructive" className="ml-2">Faltam {falta}g</Badge>
                      : <Badge variant="secondary" className="ml-2">OK</Badge>}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}