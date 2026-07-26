import { useMemo, useRef, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Copy, Sparkles, AlertTriangle, Check, Languages } from "lucide-react";
import { toast } from "sonner";
import {
  PONTOS, suggestions, convertText, type Terminologia,
} from "@/lib/amigurumi/dicionario";
import {
  parseCarreira, extractDeclaredTotal, validateCarreira,
  expandRepetition, collectAbreviaturasUsadas,
} from "@/lib/amigurumi/math-engine";

const uid = () => Math.random().toString(36).slice(2, 10);

interface Carreira { id: string; texto: string }
interface Peca { id: string; nome: string; carreiras: Carreira[] }
interface Tensao { pontos: number; carreiras: number; cm: number; agulha: string }
interface Olhos { entre: string; distancia: string; tamanho: string }
interface Estado {
  titulo: string;
  autor: string;
  nivel: "iniciante" | "intermedio" | "avancado";
  terminologia: Terminologia;
  intro: string;
  pecas: Peca[];
  tensao: Tensao;
  enchimento: string;
  arame: string;
  olhos: Olhos;
}

const DEFAULT_STATE: Estado = {
  titulo: "",
  autor: "",
  nivel: "iniciante",
  terminologia: "pt",
  intro: "",
  pecas: [
    { id: uid(), nome: "Cabeça",  carreiras: [{ id: uid(), texto: "am 6 pb (6)" }] },
    { id: uid(), nome: "Corpo",   carreiras: [] },
    { id: uid(), nome: "Braços",  carreiras: [] },
    { id: uid(), nome: "Pernas",  carreiras: [] },
    { id: uid(), nome: "Orelhas", carreiras: [] },
  ],
  tensao: { pontos: 0, carreiras: 0, cm: 10, agulha: "" },
  enchimento: "",
  arame: "",
  olhos: { entre: "", distancia: "", tamanho: "" },
};

const STORAGE_KEY = "amigurumi-editor-v1";

function loadInitial(): Estado {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_STATE;
}

export function AmigurumiEditor() {
  const [s, setS] = useState<Estado>(loadInitial);
  const [activeTab, setActiveTab] = useState<string>(() => DEFAULT_STATE.pecas[0].id);

  useEffect(() => {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
  }, [s]);

  const patch = (p: Partial<Estado>) => setS((x) => ({ ...x, ...p }));

  const upd = (pid: string, fn: (p: Peca) => Peca) =>
    setS((x) => ({ ...x, pecas: x.pecas.map((p) => (p.id === pid ? fn(p) : p)) }));

  const addPeca = () => {
    const np = { id: uid(), nome: "Nova peça", carreiras: [] };
    setS((x) => ({ ...x, pecas: [...x.pecas, np] }));
    setActiveTab(np.id);
  };

  const clonarEspelhado = (pid: string) => {
    const original = s.pecas.find((p) => p.id === pid);
    if (!original) return;
    // "Espelhar": inverte a ordem dos tokens de cada carreira, mantendo totais.
    const clone: Peca = {
      id: uid(),
      nome: `${original.nome} (espelhado)`,
      carreiras: original.carreiras.map((c) => ({
        id: uid(),
        texto: c.texto
          .split(/,\s*/)
          .reverse()
          .join(", "),
      })),
    };
    setS((x) => ({ ...x, pecas: [...x.pecas, clone] }));
    setActiveTab(clone.id);
    toast.success("Peça clonada e espelhada");
  };

  const converterTerminologia = (to: Terminologia) => {
    if (to === s.terminologia) return;
    setS((x) => ({
      ...x,
      terminologia: to,
      pecas: x.pecas.map((p) => ({
        ...p,
        carreiras: p.carreiras.map((c) => ({
          ...c,
          texto: convertText(c.texto, x.terminologia, to),
        })),
      })),
    }));
    toast.success(`Terminologia convertida para ${to.toUpperCase()}`);
  };

  const gerarEsfera = (pid: string, alvo: number) => {
    const linhas: string[] = [`am ${Math.min(6, alvo)} pb (${Math.min(6, alvo)})`];
    let atual = Math.min(6, alvo);
    let carr = 2;
    // Aumentos até atingir alvo (padrão clássico: +6/carreira, intercalar)
    while (atual < alvo) {
      const passo = Math.min(6, alvo - atual);
      const seg = Math.floor(atual / 6);
      // "5 pb, 1 aum" x N estilo para seg=1 já criado, etc.
      if (carr === 2) {
        linhas.push(`${passo} aum (${atual + passo})`);
      } else {
        const grupos = Math.floor(atual / 6);
        linhas.push(`[${grupos} pb, 1 aum] x 6 (${atual + 6})`);
      }
      atual += passo;
      carr++;
    }
    // Corpo reto (2 carreiras)
    linhas.push(`${atual} pb (${atual})`);
    linhas.push(`${atual} pb (${atual})`);
    // Diminuições simétricas
    while (atual > 6) {
      const grupos = Math.floor(atual / 6) - 1;
      const novoTotal = atual - 6;
      linhas.push(grupos > 0 ? `[${grupos} pb, 1 dim] x 6 (${novoTotal})` : `6 dim (${novoTotal})`);
      atual = novoTotal;
    }
    linhas.push("Fechar. Prender fio.");
    upd(pid, (p) => ({
      ...p,
      carreiras: linhas.map((t) => ({ id: uid(), texto: t })),
    }));
    toast.success(`Esfera de ${alvo} pontos gerada`);
  };

  const abreviaturas = useMemo(() => {
    const all = s.pecas.flatMap((p) => p.carreiras.map((c) => c.texto));
    return collectAbreviaturasUsadas(all, s.terminologia);
  }, [s.pecas, s.terminologia]);

  const consumoCabelo = (fios: number, cmPorFio: number) =>
    ((fios * cmPorFio) / 100).toFixed(2);

  const active = s.pecas.find((p) => p.id === activeTab) || s.pecas[0];

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      {/* ============================ EDITOR ============================ */}
      <Card className="!bg-white/100 opacity-100">
        <CardContent className="space-y-4 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Título da receita</Label>
              <Input value={s.titulo} onChange={(e) => patch({ titulo: e.target.value })}
                placeholder="Ex: Ursinho Nino" />
            </div>
            <div>
              <Label>Autoria</Label>
              <Input value={s.autor} onChange={(e) => patch({ autor: e.target.value })}
                placeholder="Nome da artesã" />
            </div>
            <div>
              <Label>Nível</Label>
              <Select value={s.nivel} onValueChange={(v) => patch({ nivel: v as Estado["nivel"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="iniciante">Iniciante</SelectItem>
                  <SelectItem value="intermedio">Intermédio</SelectItem>
                  <SelectItem value="avancado">Avançado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="flex items-center gap-1">
                <Languages className="h-3.5 w-3.5" /> Terminologia
              </Label>
              <Select value={s.terminologia} onValueChange={(v) => converterTerminologia(v as Terminologia)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt">Português (PT/BR)</SelectItem>
                  <SelectItem value="us">Inglês (US)</SelectItem>
                  <SelectItem value="uk">Inglês (UK)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Textarea
            placeholder="Introdução, história do projeto, materiais gerais…"
            value={s.intro}
            onChange={(e) => patch({ intro: e.target.value })}
            rows={3}
          />

          {/* ================= Peças (abas) ================= */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-display">Organizador de Peças</CardTitle>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={addPeca}>
                    <Plus className="mr-1 h-3.5 w-3.5" /> Peça
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => clonarEspelhado(activeTab)}>
                    <Copy className="mr-1 h-3.5 w-3.5" /> Clonar espelhado
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="flex-wrap justify-start">
                  {s.pecas.map((p) => (
                    <TabsTrigger key={p.id} value={p.id}>{p.nome}</TabsTrigger>
                  ))}
                </TabsList>
                {s.pecas.map((p) => (
                  <TabsContent key={p.id} value={p.id} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Input value={p.nome}
                        onChange={(e) => upd(p.id, (x) => ({ ...x, nome: e.target.value }))}
                        className="max-w-xs" />
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button size="sm" variant="outline">
                            <Sparkles className="mr-1 h-3.5 w-3.5" /> Gerar esfera
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-56 space-y-2">
                          <Label>Pontos máximos</Label>
                          <EsferaGen onGenerate={(n) => gerarEsfera(p.id, n)} />
                        </PopoverContent>
                      </Popover>
                      <Button size="sm" variant="ghost"
                        onClick={() => setS((x) => ({ ...x, pecas: x.pecas.filter((y) => y.id !== p.id) }))}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <CarreirasList
                      peca={p}
                      term={s.terminologia}
                      onChange={(nova) => upd(p.id, (x) => ({ ...x, carreiras: nova }))}
                    />
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>

          {/* ================= Tensão / Enchimento / Olhos ================= */}
          <div className="grid gap-3 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-display">Amostra (Tensão)</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-2">
                <div><Label>Pontos</Label><Input type="number" value={s.tensao.pontos || ""} onChange={(e) => patch({ tensao: { ...s.tensao, pontos: +e.target.value } })} /></div>
                <div><Label>Carreiras</Label><Input type="number" value={s.tensao.carreiras || ""} onChange={(e) => patch({ tensao: { ...s.tensao, carreiras: +e.target.value } })} /></div>
                <div><Label>= cm</Label><Input type="number" value={s.tensao.cm || ""} onChange={(e) => patch({ tensao: { ...s.tensao, cm: +e.target.value } })} /></div>
                <div><Label>Agulha</Label><Input value={s.tensao.agulha} onChange={(e) => patch({ tensao: { ...s.tensao, agulha: e.target.value } })} placeholder="2.5 mm" /></div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-display">Enchimento / Arame</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <div><Label>Fibra</Label><Input value={s.enchimento} onChange={(e) => patch({ enchimento: e.target.value })} placeholder="200 g fibra siliconada" /></div>
                <div><Label>Arame</Label><Input value={s.arame} onChange={(e) => patch({ arame: e.target.value })} placeholder="Arame 1.5 mm, 40 cm" /></div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-display">Olhos de Segurança</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <div><Label>Entre carreiras</Label><Input value={s.olhos.entre} onChange={(e) => patch({ olhos: { ...s.olhos, entre: e.target.value } })} placeholder="Carreira 8 e 9" /></div>
                <div><Label>Distância</Label><Input value={s.olhos.distancia} onChange={(e) => patch({ olhos: { ...s.olhos, distancia: e.target.value } })} placeholder="5 pontos" /></div>
                <div><Label>Tamanho</Label><Input value={s.olhos.tamanho} onChange={(e) => patch({ olhos: { ...s.olhos, tamanho: e.target.value } })} placeholder="9 mm" /></div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* ============================ SIDE PREVIEW ============================ */}
      <div className="space-y-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-display">Legenda (auto)</CardTitle></CardHeader>
          <CardContent>
            {abreviaturas.length === 0 ? (
              <p className="text-xs text-muted-foreground">Escreve pontos nas carreiras para gerar a legenda automaticamente.</p>
            ) : (
              <ul className="space-y-1 text-xs">
                {abreviaturas.map((p) => (
                  <li key={p.id}>
                    <strong className="font-mono">{p.abrev[s.terminologia]}</strong>
                    {" — "}{p.nome[s.terminologia]}
                    {p.descricao ? <span className="text-muted-foreground"> · {p.descricao}</span> : null}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-display">Resumo</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-xs">
            <div>Peças: <strong>{s.pecas.length}</strong></div>
            <div>Total de carreiras: <strong>{s.pecas.reduce((n, p) => n + p.carreiras.length, 0)}</strong></div>
            {s.tensao.pontos > 0 && s.tensao.cm > 0 && (
              <div>Tensão: <strong>{s.tensao.pontos} pts × {s.tensao.carreiras} car / {s.tensao.cm}cm</strong></div>
            )}
            <div className="pt-2 text-muted-foreground">
              Dica: cabelos consomem fio extra. Ex: 40 fios de 15 cm = <strong>{consumoCabelo(40, 15)} m</strong> adicionais.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ============================ CARREIRAS ============================ */

function CarreirasList({
  peca, term, onChange,
}: {
  peca: Peca;
  term: Terminologia;
  onChange: (cs: Carreira[]) => void;
}) {
  const previousTotals = useMemo(() => {
    const out: (number | null)[] = [];
    let prev: number | null = null;
    for (const c of peca.carreiras) {
      out.push(prev);
      const r = parseCarreira(c.texto, term);
      prev = r.produz || prev;
    }
    return out;
  }, [peca.carreiras, term]);

  const update = (idx: number, texto: string) =>
    onChange(peca.carreiras.map((c, i) => (i === idx ? { ...c, texto } : c)));

  const addCarreira = () =>
    onChange([...peca.carreiras, { id: uid(), texto: "" }]);

  const removeCarreira = (idx: number) =>
    onChange(peca.carreiras.filter((_, i) => i !== idx));

  const autoTotal = (idx: number) => {
    const c = peca.carreiras[idx];
    const r = parseCarreira(c.texto, term);
    if (!r.produz) return;
    const cleaned = c.texto.replace(/\s*\(\d+\)\s*$/, "").trim();
    update(idx, `${cleaned} (${r.produz})`);
  };

  return (
    <div className="space-y-2">
      {peca.carreiras.map((c, i) => (
        <CarreiraRow
          key={c.id}
          index={i}
          value={c.texto}
          previousTotal={previousTotals[i]}
          term={term}
          onChange={(v) => update(i, v)}
          onAutoTotal={() => autoTotal(i)}
          onRemove={() => removeCarreira(i)}
        />
      ))}
      <div className="flex flex-wrap gap-1">
        <Button size="sm" variant="outline" onClick={addCarreira}>
          <Plus className="mr-1 h-3.5 w-3.5" /> Carreira
        </Button>
        <RepeticaoBuilder onInsert={(txt) =>
          onChange([...peca.carreiras, { id: uid(), texto: txt }])
        } />
      </div>
    </div>
  );
}

function CarreiraRow({
  index, value, previousTotal, term, onChange, onAutoTotal, onRemove,
}: {
  index: number;
  value: string;
  previousTotal: number | null;
  term: Terminologia;
  onChange: (v: string) => void;
  onAutoTotal: () => void;
  onRemove: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [sug, setSug] = useState<{ text: string; from: number }[]>([]);

  const validation = useMemo(
    () => validateCarreira(value, previousTotal, term),
    [value, previousTotal, term],
  );

  const handleChange = (v: string) => {
    onChange(v);
    // Auto-complete: last word prefix
    const cur = ref.current;
    const pos = cur?.selectionStart ?? v.length;
    const before = v.slice(0, pos);
    const m = before.match(/([a-záàâãéèêíïóôõöúüç]{1,6})$/i);
    if (!m) { setSug([]); return; }
    const from = pos - m[1].length;
    const items = suggestions(m[1], term).map((p) => ({
      text: v.slice(0, from) + p.abrev[term] + v.slice(pos),
      from,
    }));
    setSug(items.slice(0, 4));
  };

  const okBadge = validation.usaOk && validation.totalOk && !validation.parsed.desconhecidos.length;
  const showTotal = validation.parsed.produz > 0;

  return (
    <div className="relative">
      <div className="grid grid-cols-[36px_1fr_auto] items-start gap-2">
        <div className="pt-2 text-xs font-mono text-muted-foreground">C{index + 1}:</div>
        <div className="space-y-1">
          <Input
            ref={ref}
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={() => setTimeout(() => setSug([]), 150)}
            placeholder="ex: [1 pb, 1 aum] x 6 (18)"
            data-testid={`carreira-input-${index}`}
          />
          {sug.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {sug.map((it, k) => (
                <button key={k} type="button"
                  className="rounded border bg-muted px-2 py-0.5 text-xs hover:bg-muted-foreground/10"
                  onMouseDown={(e) => { e.preventDefault(); onChange(it.text); setSug([]); }}>
                  {it.text.slice(it.from).split(/\s|,/)[0]}
                </button>
              ))}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-1 text-[11px]">
            {showTotal && (
              <Badge variant={okBadge ? "secondary" : "destructive"} className="font-mono">
                = {validation.parsed.produz} pts
              </Badge>
            )}
            {previousTotal != null && !validation.usaOk && !validation.parsed.temAnelMagico && (
              <span className="flex items-center gap-1 text-destructive">
                <AlertTriangle className="h-3 w-3" />
                Consome {validation.parsed.usa}, mas carreira anterior tem {previousTotal}.
              </span>
            )}
            {validation.declared != null && !validation.totalOk && (
              <span className="flex items-center gap-1 text-destructive">
                <AlertTriangle className="h-3 w-3" />
                Total escrito ({validation.declared}) não bate com calculado ({validation.parsed.produz}).
              </span>
            )}
            {validation.parsed.desconhecidos.length > 0 && (
              <span className="text-amber-600">Pontos desconhecidos: {validation.parsed.desconhecidos.join(", ")}</span>
            )}
            {okBadge && showTotal && (
              <span className="flex items-center gap-1 text-emerald-600">
                <Check className="h-3 w-3" /> matemática ok
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={onAutoTotal} title="Inserir total calculado">
            = ({validation.parsed.produz || "?"})
          </Button>
          <Button size="icon" variant="ghost" onClick={onRemove}><Trash2 className="h-3.5 w-3.5" /></Button>
        </div>
      </div>
    </div>
  );
}

function RepeticaoBuilder({ onInsert }: { onInsert: (t: string) => void }) {
  const [inner, setInner] = useState("1 pb, 1 aum");
  const [times, setTimes] = useState(6);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="sm" variant="outline">[…] × N</Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 space-y-2">
        <Label>Padrão a repetir</Label>
        <Input value={inner} onChange={(e) => setInner(e.target.value)} />
        <Label>Vezes</Label>
        <Input type="number" min={1} value={times} onChange={(e) => setTimes(Math.max(1, +e.target.value))} />
        <div className="flex gap-2">
          <Button size="sm" variant="outline"
            onClick={() => onInsert(`[${inner}] x ${times}`)}>
            Inserir compacto
          </Button>
          <Button size="sm"
            onClick={() => onInsert(expandRepetition(inner, times))}>
            Expandir
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function EsferaGen({ onGenerate }: { onGenerate: (n: number) => void }) {
  const [n, setN] = useState(60);
  return (
    <div className="space-y-2">
      <Input type="number" min={6} step={6} value={n} onChange={(e) => setN(+e.target.value)} />
      <Button size="sm" className="w-full" onClick={() => onGenerate(n)}>
        <Sparkles className="mr-1 h-3.5 w-3.5" /> Gerar
      </Button>
      <p className="text-[11px] text-muted-foreground">
        Gera anel mágico + aumentos até {n} pts + reta + diminuições finais.
      </p>
    </div>
  );
}

// Small helper so ferramentas-tecnicas can also show a legenda snapshot,
// but currently unused externally. Exported for tests.
export { PONTOS };