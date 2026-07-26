import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Minus, Plus, RotateCcw, Package, Focus, Ruler, Grid3x3, AlertCircle, Check,
} from "lucide-react";
import { toast } from "sonner";
import {
  recomendarAgulhaMM, pontosEsferaParaDiametro, escalaPorAgulha,
  parseTapestryGrid, grannyLayout, validarAgulhaFio, consumoCabelo, metrosDeFio,
} from "@/lib/amigurumi/extras";

type Checklist = { id: string; texto: string; feito: boolean };

const CHK_KEY = "amig-extras-checklist-v1";
const FOCUS_KEY = "amig-extras-focus-v1";
const COUNTER_KEY = "amig-extras-counter-v1";

const DEFAULT_CHK: Checklist[] = [
  { id: "a", texto: "Ler a receita completa antes de começar", feito: false },
  { id: "b", texto: "Fazer amostra de tensão", feito: false },
  { id: "c", texto: "Verificar quantidade de fio disponível", feito: false },
  { id: "d", texto: "Preparar olhos, enchimento e agulhas", feito: false },
  { id: "e", texto: "Marcar carreira inicial", feito: false },
];

export function AmigurumiExtras({
  pecas, exportZip,
}: {
  pecas: { id: string; nome: string; carreiras: { texto: string }[] }[];
  exportZip: () => void;
}) {
  /* ---------- Checklist de leitura ---------- */
  const [chk, setChk] = useState<Checklist[]>(() => {
    if (typeof window === "undefined") return DEFAULT_CHK;
    try {
      const raw = window.localStorage.getItem(CHK_KEY);
      if (raw) return JSON.parse(raw) as Checklist[];
    } catch {}
    return DEFAULT_CHK;
  });
  useEffect(() => {
    try { window.localStorage.setItem(CHK_KEY, JSON.stringify(chk)); } catch {}
  }, [chk]);
  const [novoChk, setNovoChk] = useState("");

  /* ---------- Contador virtual (por carreira global) ---------- */
  const [counter, setCounter] = useState<{ carreira: number; pontos: number }>(() => {
    if (typeof window === "undefined") return { carreira: 1, pontos: 0 };
    try {
      const raw = window.localStorage.getItem(COUNTER_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return { carreira: 1, pontos: 0 };
  });
  useEffect(() => {
    try { window.localStorage.setItem(COUNTER_KEY, JSON.stringify(counter)); } catch {}
  }, [counter]);

  const totalCarreiras = pecas.reduce((n, p) => n + p.carreiras.length, 0);

  /* ---------- Modo Foco ---------- */
  const [focus, setFocus] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(FOCUS_KEY) === "1";
  });
  useEffect(() => {
    try { window.localStorage.setItem(FOCUS_KEY, focus ? "1" : "0"); } catch {}
    if (typeof document !== "undefined") {
      document.body.classList.toggle("amig-focus", focus);
    }
  }, [focus]);

  /* ---------- Calculadora fio ---------- */
  const [gPer100, setGPer100] = useState<number>(0);
  const [gTotais, setGTotais] = useState<number>(0);
  const rec = useMemo(() => recomendarAgulhaMM(gPer100), [gPer100]);
  const metros = useMemo(() => metrosDeFio(gTotais, gPer100), [gTotais, gPer100]);

  const [agulhaMM, setAgulhaMM] = useState<number>(0);
  const val = useMemo(() => validarAgulhaFio(agulhaMM, gPer100), [agulhaMM, gPer100]);

  /* ---------- Escalonamento por agulha ---------- */
  const [ptsOrig, setPtsOrig] = useState<number>(0);
  const [mmOrig, setMmOrig] = useState<number>(0);
  const [mmNova, setMmNova] = useState<number>(0);
  const novoTotal = useMemo(() => escalaPorAgulha(ptsOrig, mmOrig, mmNova), [ptsOrig, mmOrig, mmNova]);

  /* ---------- Esfera por diâmetro ---------- */
  const [diam, setDiam] = useState<number>(0);
  const [tensao, setTensao] = useState<number>(0);
  const ptsEsfera = useMemo(() => pontosEsferaParaDiametro(diam, tensao), [diam, tensao]);

  /* ---------- Cabelo ---------- */
  const [nFios, setNFios] = useState<number>(0);
  const [cmFio, setCmFio] = useState<number>(0);
  const mCabelo = useMemo(() => consumoCabelo(nFios, cmFio), [nFios, cmFio]);

  /* ---------- Granny ---------- */
  const [grannyN, setGrannyN] = useState<number>(0);
  const granny = useMemo(() => grannyLayout(grannyN), [grannyN]);

  /* ---------- Tapestry ---------- */
  const [tapText, setTapText] = useState("AAABBB\nAABBBB\nABBBBB");
  const tapGrid = useMemo(() => parseTapestryGrid(tapText), [tapText]);

  return (
    <Tabs defaultValue="ler" className="space-y-3">
      <TabsList className="flex-wrap">
        <TabsTrigger value="ler">Leitura & Foco</TabsTrigger>
        <TabsTrigger value="contador">Contador</TabsTrigger>
        <TabsTrigger value="fio">Fio & Agulha</TabsTrigger>
        <TabsTrigger value="escala">Escalonamento</TabsTrigger>
        <TabsTrigger value="tapestry">Tapestry / Granny</TabsTrigger>
        <TabsTrigger value="export">Exportar</TabsTrigger>
      </TabsList>

      {/* ---------- Checklist + Foco ---------- */}
      <TabsContent value="ler">
        <div className="grid gap-3 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-display">Checklist de leitura</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {chk.map((c) => (
                <label key={c.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={c.feito}
                    onChange={(e) => setChk((x) => x.map((y) => y.id === c.id ? { ...y, feito: e.target.checked } : y))} />
                  <span className={c.feito ? "line-through opacity-60" : ""}>{c.texto}</span>
                  <Button size="sm" variant="ghost" className="ml-auto"
                    onClick={() => setChk((x) => x.filter((y) => y.id !== c.id))}>×</Button>
                </label>
              ))}
              <div className="flex gap-1 pt-2">
                <Input value={novoChk} onChange={(e) => setNovoChk(e.target.value)} placeholder="Nova tarefa" />
                <Button size="sm" onClick={() => {
                  if (!novoChk.trim()) return;
                  setChk((x) => [...x, { id: Math.random().toString(36).slice(2, 8), texto: novoChk.trim(), feito: false }]);
                  setNovoChk("");
                }}>Adicionar</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-display flex items-center gap-2">
                <Focus className="h-4 w-4" /> Modo Foco
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Reduzir distrações no editor</Label>
                <Switch checked={focus} onCheckedChange={setFocus} />
              </div>
              <p className="text-xs text-muted-foreground">
                Escurece a barra lateral e diminui a opacidade dos elementos fora do editor
                ativo. Podes ativar antes de sessões longas de tricô.
              </p>
              <style>{`
                body.amig-focus [data-sidebar],
                body.amig-focus header,
                body.amig-focus nav { opacity: 0.35; filter: grayscale(0.4); transition: opacity .2s; }
                body.amig-focus [data-sidebar]:hover,
                body.amig-focus header:hover,
                body.amig-focus nav:hover { opacity: 1; filter: none; }
              `}</style>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* ---------- Contador ---------- */}
      <TabsContent value="contador">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-display">Contador virtual</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-lg border p-3 text-center">
                <div className="text-xs text-muted-foreground">Carreira</div>
                <div className="font-display text-3xl">{counter.carreira}<span className="text-sm text-muted-foreground">/{totalCarreiras || "?"}</span></div>
                <div className="mt-1 flex gap-1 justify-center">
                  <Button size="sm" variant="outline" onClick={() => setCounter((x) => ({ ...x, carreira: Math.max(1, x.carreira - 1), pontos: 0 }))}>
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" onClick={() => setCounter((x) => ({ ...x, carreira: x.carreira + 1, pontos: 0 }))}>
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <div className="text-xs text-muted-foreground">Pontos nesta carreira</div>
                <div className="font-display text-3xl">{counter.pontos}</div>
                <div className="mt-1 flex gap-1 justify-center">
                  <Button size="sm" variant="outline" onClick={() => setCounter((x) => ({ ...x, pontos: Math.max(0, x.pontos - 1) }))}>
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" onClick={() => setCounter((x) => ({ ...x, pontos: x.pontos + 1 }))}>
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setCounter({ carreira: 1, pontos: 0 })}>
                <RotateCcw className="mr-1 h-3.5 w-3.5" /> Reset
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Contagem persiste automaticamente. Usa em vez de contador físico durante o crochê.
            </p>
          </CardContent>
        </Card>
      </TabsContent>

      {/* ---------- Fio & Agulha ---------- */}
      <TabsContent value="fio">
        <div className="grid gap-3 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-display">Espessura do fio</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <div>
                <Label>Fio: g por 100m</Label>
                <Input type="number" value={gPer100 || ""} onChange={(e) => setGPer100(+e.target.value)} placeholder="Ex: 40" />
              </div>
              {rec.min > 0 && (
                <Badge variant="secondary">Agulha recomendada: {rec.min}–{rec.max} mm</Badge>
              )}
              <p className="text-xs text-muted-foreground">{rec.nota}</p>
              <div>
                <Label>Peso total de fio (g)</Label>
                <Input type="number" value={gTotais || ""} onChange={(e) => setGTotais(+e.target.value)} placeholder="Ex: 200" />
              </div>
              {metros > 0 && <div className="text-sm">= <strong>{metros} m</strong> de fio</div>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-display">Validador agulha × fio</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <div>
                <Label>Agulha (mm)</Label>
                <Input type="number" step="0.25" value={agulhaMM || ""} onChange={(e) => setAgulhaMM(+e.target.value)} placeholder="Ex: 2.5" />
              </div>
              <div className={`flex items-start gap-2 rounded p-2 text-sm ${val.ok ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>
                {val.ok ? <Check className="mt-0.5 h-4 w-4" /> : <AlertCircle className="mt-0.5 h-4 w-4" />}
                <span>{val.msg}</span>
              </div>
              <div>
                <Label>Consumo de cabelo/franja</Label>
                <div className="grid grid-cols-2 gap-1">
                  <Input type="number" value={nFios || ""} onChange={(e) => setNFios(+e.target.value)} placeholder="nº fios" />
                  <Input type="number" value={cmFio || ""} onChange={(e) => setCmFio(+e.target.value)} placeholder="cm por fio" />
                </div>
                {mCabelo > 0 && <div className="mt-1 text-sm">≈ <strong>{mCabelo} m</strong> adicionais</div>}
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* ---------- Escalonamento ---------- */}
      <TabsContent value="escala">
        <div className="grid gap-3 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-display flex items-center gap-2">
                <Ruler className="h-4 w-4" /> Redimensionar por agulha
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div><Label>Pontos originais (última carreira)</Label>
                <Input type="number" value={ptsOrig || ""} onChange={(e) => setPtsOrig(+e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Agulha original (mm)</Label>
                  <Input type="number" step="0.25" value={mmOrig || ""} onChange={(e) => setMmOrig(+e.target.value)} /></div>
                <div><Label>Agulha nova (mm)</Label>
                  <Input type="number" step="0.25" value={mmNova || ""} onChange={(e) => setMmNova(+e.target.value)} /></div>
              </div>
              {novoTotal > 0 && (
                <div className="text-sm">Novo total ajustado: <strong>{novoTotal}</strong> pontos</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-display">Esfera por diâmetro alvo</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <div><Label>Diâmetro alvo (cm)</Label>
                <Input type="number" step="0.5" value={diam || ""} onChange={(e) => setDiam(+e.target.value)} placeholder="8" /></div>
              <div><Label>Tensão (pontos por 10 cm)</Label>
                <Input type="number" value={tensao || ""} onChange={(e) => setTensao(+e.target.value)} placeholder="24" /></div>
              {ptsEsfera > 0 && (
                <div className="text-sm">Pontos máximos sugeridos: <strong>{ptsEsfera}</strong></div>
              )}
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* ---------- Tapestry ---------- */}
      <TabsContent value="tapestry">
        <div className="grid gap-3 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-display flex items-center gap-2">
                <Grid3x3 className="h-4 w-4" /> Matriz tapestry / C2C
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Textarea rows={6} value={tapText} onChange={(e) => setTapText(e.target.value)}
                className="font-mono text-xs" placeholder="Ex: AAABBB\nAABBBB" />
              <div className="overflow-auto rounded border p-2">
                <table className="border-collapse text-[10px]">
                  <tbody>
                    {tapGrid.map((linha, i) => (
                      <tr key={i}>
                        {linha.map((cel, j) => (
                          <td key={j} className="h-4 w-4 border text-center"
                            style={{ background: colorFor(cel), color: contrast(cel) }}>{cel}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground">
                Cada letra representa uma cor. Total: {tapGrid.length} linhas × {tapGrid[0]?.length || 0} colunas.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-display">Granny square (layout)</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <div><Label>Nº de carreiras</Label>
                <Input type="number" value={grannyN || ""} onChange={(e) => setGrannyN(+e.target.value)} placeholder="6" /></div>
              {grannyN > 0 && (
                <div className="text-sm space-y-1">
                  <div>Lados: <strong>{granny.lados}</strong></div>
                  <div>Pontos por canto: <strong>{granny.ptsPorCanto}</strong></div>
                  <div>Total aproximado: <strong>{granny.total}</strong> pontos altos</div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* ---------- Export ---------- */}
      <TabsContent value="export">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-display flex items-center gap-2">
              <Package className="h-4 w-4" /> Pacote Ravelry / Etsy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Gera um pacote <code>.zip</code> com o PDF da receita, o JSON estruturado e um
              ficheiro <code>README</code> pronto para submissão em plataformas como Ravelry ou Etsy.
            </p>
            <Button onClick={exportZip}>
              <Package className="mr-1 h-4 w-4" /> Gerar pacote .zip
            </Button>
            <p className="text-xs text-muted-foreground">
              Sugestão: incluir fotos do produto acabado antes de submeter.
            </p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

// paleta simples para o preview tapestry
const PALETTE: Record<string, string> = {
  A: "#fde68a", B: "#fca5a5", C: "#a5b4fc", D: "#86efac", E: "#f9a8d4",
  F: "#fdba74", G: "#67e8f9", H: "#c4b5fd", I: "#fef3c7", J: "#bef264",
};
function colorFor(k: string): string { return PALETTE[k.toUpperCase()] || "#e5e7eb"; }
function contrast(_k: string): string { return "#1f2937"; }