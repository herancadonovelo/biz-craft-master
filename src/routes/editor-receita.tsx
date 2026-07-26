import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { useStore, type ReceitaEditor } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { PremiumRoute } from "@/components/PremiumRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Trash2, Save, FileDown, Upload, Download, History as HistoryIcon, Search, X } from "lucide-react";
import { toast } from "sonner";

const uid = () => Math.random().toString(36).slice(2, 10);

type HorasMode = "keep" | "replace" | "max" | "sum" | "recalc";
type MargemMode = "keep" | "replace" | "max" | "avg";

interface MergeRules {
  horas: HorasMode;
  /** Recalc: horas = sum(materiais.qtd * horasPorUnidade). */
  horasPorUnidade: number;
  margem: MargemMode;
  atualizarPrecos: boolean;
  adicionarMateriaisNovos: boolean;
  unirTags: boolean;
  anexarNotas: boolean;
}

const DEFAULT_RULES: MergeRules = {
  horas: "max",
  horasPorUnidade: 0.5,
  margem: "max",
  atualizarPrecos: true,
  adicionarMateriaisNovos: true,
  unirTags: true,
  anexarNotas: true,
};
const RULES_KEY = "editor-receita-merge-rules";
const RULES_PRESETS_KEY = "editor-receita-merge-rules-presets";

interface MergePreset { id: string; nome: string; rules: MergeRules }

export const Route = createFileRoute("/editor-receita")({
  head: () => ({ meta: [{ title: "Editor De Receitas" }] }),
  component: () => (
    <PremiumRoute feature="Editor de Receitas">
      <Page />
    </PremiumRoute>
  ),
});

export function EditorReceitaPage() { return <Page />; }
function Page() {
  const { receitasEditor, add, update, remove } = useStore();
  const [editId, setEditId] = useState<string | null>(receitasEditor[0]?.id || null);
  const r = receitasEditor.find((x) => x.id === editId);
  const [query, setQuery] = useState("");
  const [tagInput, setTagInput] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [rules, setRules] = useState<MergeRules>(() => {
    try {
      const raw = typeof window !== "undefined" && window.localStorage.getItem(RULES_KEY);
      return raw ? { ...DEFAULT_RULES, ...JSON.parse(raw) } : DEFAULT_RULES;
    } catch { return DEFAULT_RULES; }
  });
  const [rulesOpen, setRulesOpen] = useState(false);
  const [presets, setPresets] = useState<MergePreset[]>(() => {
    try {
      const raw = typeof window !== "undefined" && window.localStorage.getItem(RULES_PRESETS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });
  const [presetName, setPresetName] = useState("");
  const savePresets = (list: MergePreset[]) => {
    setPresets(list);
    try { window.localStorage.setItem(RULES_PRESETS_KEY, JSON.stringify(list)); } catch {}
  };
  const gravarPreset = () => {
    const nome = presetName.trim();
    if (!nome) { toast.error("Dá um nome ao preset"); return; }
    const existente = presets.find((p) => p.nome.toLowerCase() === nome.toLowerCase());
    const entry: MergePreset = { id: existente?.id ?? uid(), nome, rules };
    const next = existente
      ? presets.map((p) => (p.id === existente.id ? entry : p))
      : [...presets, entry];
    savePresets(next);
    setPresetName("");
    toast.success(existente ? `Preset "${nome}" atualizado` : `Preset "${nome}" gravado`);
  };
  const aplicarPreset = (id: string) => {
    const p = presets.find((x) => x.id === id);
    if (!p) return;
    setAndSaveRules(p.rules);
    toast.success(`Preset "${p.nome}" aplicado`);
  };
  const removerPreset = (id: string) => {
    savePresets(presets.filter((p) => p.id !== id));
  };
  const setAndSaveRules = (r: MergeRules) => {
    setRules(r);
    try { window.localStorage.setItem(RULES_KEY, JSON.stringify(r)); } catch {}
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return receitasEditor;
    return receitasEditor.filter((x) => {
      const hay = [
        x.nome, x.categoria, x.notas ?? "",
        ...(x.tags ?? []),
        ...x.materiais.map((m) => m.nome),
        ...x.seccoes.map((s) => s.nome),
      ].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [receitasEditor, query]);

  const novo = () => {
    const novo: Omit<ReceitaEditor, "id"> = {
      nome: "Nova receita",
      categoria: "amigurumi",
      materiais: [],
      seccoes: [{ id: uid(), nome: "Cabeça", carreiras: [] }],
      criadoEm: new Date().toISOString(),
    };
    add("receitasEditor", novo);
    setTimeout(() => { const c = useStore.getState().receitasEditor.slice(-1)[0]; if (c) setEditId(c.id); }, 0);
  };

  const patch = (p: Partial<ReceitaEditor>) => r && update("receitasEditor", r.id, p);

  const snapshot = (label?: string) => {
    if (!r) return;
    const hist = r.historico ?? [];
    const entry = {
      id: uid(),
      data: new Date().toISOString(),
      label,
      snapshot: JSON.stringify({ ...r, historico: undefined }),
    };
    patch({ historico: [entry, ...hist].slice(0, 30) });
  };
  const guardar = () => {
    try { snapshot("guardado"); toast.success("Receita guardada (versão registada)"); }
    catch (e: any) { toast.error("Erro ao guardar: " + (e?.message ?? e)); }
  };
  const restaurar = (snap: NonNullable<ReceitaEditor["historico"]>[number]) => {
    if (!r) return;
    try {
      const parsed = JSON.parse(snap.snapshot);
      update("receitasEditor", r.id, { ...parsed, id: r.id, historico: r.historico });
      toast.success("Versão restaurada");
    } catch { toast.error("Não foi possível restaurar esta versão"); }
  };
  const exportarJSON = () => {
    if (!r) return;
    const blob = new Blob([JSON.stringify(r, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${(r.nome || "receita").replace(/[^\w-]+/g, "_")}.json`;
    a.click();
    toast.success("receita.json exportada");
  };
  const importarJSON = async (file: File) => {
    try {
      const data = JSON.parse(await file.text());
      const norm = (s: string) => String(s ?? "").trim().toLowerCase();
      const existente = receitasEditor.find((x) => norm(x.nome) === norm(data.nome));
      const mesclar =
        existente &&
        typeof window !== "undefined" &&
        window.confirm(
          `Já existe uma receita "${existente.nome}". OK = mesclar aplicando as regras configuradas (horas=${rules.horas}, margem=${rules.margem}). Cancelar = criar nova.`,
        );

      const materiaisImportados = Array.isArray(data.materiais)
        ? data.materiais.map((m: any) => ({
            id: m.id ?? uid(),
            nome: String(m.nome ?? ""),
            quantidade: String(m.quantidade ?? ""),
            precoUnitario:
              typeof m.precoUnitario === "number"
                ? m.precoUnitario
                : typeof m.precoCompra === "number"
                ? m.precoCompra
                : undefined,
          }))
        : [];

      if (mesclar && existente) {
        const mapExist = new Map(existente.materiais.map((m) => [norm(m.nome), m]));
        let precosAtualizados = 0;
        let materiaisNovos = 0;
        const mergedMats = [...existente.materiais];
        for (const im of materiaisImportados) {
          const key = norm(im.nome);
          const cur = mapExist.get(key);
          if (cur) {
            const idx = mergedMats.findIndex((m) => m.id === cur.id);
            const antigoPreco = cur.precoUnitario;
            const novoPreco = rules.atualizarPrecos ? (im.precoUnitario ?? antigoPreco) : antigoPreco;
            if (rules.atualizarPrecos && im.precoUnitario != null && im.precoUnitario !== antigoPreco) precosAtualizados++;
            mergedMats[idx] = {
              ...cur,
              quantidade: im.quantidade || cur.quantidade,
              precoUnitario: novoPreco,
            };
          } else if (rules.adicionarMateriaisNovos) {
            mergedMats.push(im);
            materiaisNovos++;
          }
        }

        const seccoesImportadas = Array.isArray(data.seccoes) ? data.seccoes : [];
        const mapSec = new Map(existente.seccoes.map((s) => [norm(s.nome), s]));
        const mergedSec = [...existente.seccoes];
        for (const s of seccoesImportadas) {
          if (!mapSec.has(norm(s.nome))) {
            mergedSec.push({
              id: s.id ?? uid(),
              nome: String(s.nome ?? "Secção"),
              imagem: s.imagem,
              carreiras: Array.isArray(s.carreiras)
                ? s.carreiras.map((c: any) => ({
                    id: c.id ?? uid(),
                    texto: String(c.texto ?? ""),
                    totalPontos: typeof c.totalPontos === "number" ? c.totalPontos : undefined,
                  }))
                : [],
            });
          }
        }

        // Horas: apply configured rule.
        const horasImport = typeof data.horasEstimadas === "number" ? data.horasEstimadas : undefined;
        const horasCur = existente.horasEstimadas;
        let horas = horasCur;
        switch (rules.horas) {
          case "keep": horas = horasCur; break;
          case "replace": horas = horasImport ?? horasCur; break;
          case "max":
            horas = horasImport != null ? Math.max(horasCur ?? 0, horasImport) : horasCur;
            break;
          case "sum":
            horas = horasImport != null ? (horasCur ?? 0) + horasImport : horasCur;
            break;
          case "recalc": {
            const totalUnidades = mergedMats.reduce((n, m) => {
              const q = parseFloat(String(m.quantidade).replace(",", ".")) || 0;
              return n + q;
            }, 0);
            horas = +(totalUnidades * (rules.horasPorUnidade || 0)).toFixed(2);
            break;
          }
        }

        // Margem: apply configured rule.
        const margemImport = typeof data.margemPercent === "number" ? data.margemPercent : undefined;
        const margemCur = existente.margemPercent;
        let margem = margemCur;
        switch (rules.margem) {
          case "keep": margem = margemCur; break;
          case "replace": margem = margemImport ?? margemCur; break;
          case "max":
            margem = margemImport != null ? Math.max(margemCur ?? 0, margemImport) : margemCur;
            break;
          case "avg":
            margem = margemImport != null && margemCur != null
              ? +((margemImport + margemCur) / 2).toFixed(2)
              : (margemImport ?? margemCur);
            break;
        }

        const tags = rules.unirTags
          ? Array.from(new Set([...(existente.tags ?? []), ...(Array.isArray(data.tags) ? data.tags.map(String) : [])]))
          : existente.tags;
        const notas = rules.anexarNotas && data.notas
          ? `${existente.notas ?? ""}\n---\n${data.notas}`.trim()
          : existente.notas;

        update("receitasEditor", existente.id, {
          materiais: mergedMats,
          seccoes: mergedSec,
          horasEstimadas: horas,
          margemPercent: margem,
          tags,
          notas,
        });
        setEditId(existente.id);
        const bits = [
          `+${materiaisNovos} materiais`,
          `${precosAtualizados} preços`,
          horas !== horasCur ? `horas → ${horas}h` : null,
          margem !== margemCur ? `margem → ${margem}%` : null,
        ].filter(Boolean).join(", ");
        toast.success(`Mesclado: ${bits}`);
        return;
      }

      const clean: Omit<ReceitaEditor, "id"> = {
        nome: data.nome ?? "Receita importada",
        categoria: (["amigurumi", "crochet", "tricotin"].includes(data.categoria) ? data.categoria : "amigurumi"),
        materiais: materiaisImportados,
        seccoes: Array.isArray(data.seccoes) ? data.seccoes.map((s: any) => ({
          id: s.id ?? uid(), nome: String(s.nome ?? "Secção"),
          imagem: s.imagem,
          carreiras: Array.isArray(s.carreiras) ? s.carreiras.map((c: any) => ({
            id: c.id ?? uid(), texto: String(c.texto ?? ""),
            totalPontos: typeof c.totalPontos === "number" ? c.totalPontos : undefined,
          })) : [],
        })) : [],
        notas: data.notas,
        criadoEm: data.criadoEm ?? new Date().toISOString(),
        tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
        horasEstimadas: typeof data.horasEstimadas === "number" ? data.horasEstimadas : undefined,
        margemPercent: typeof data.margemPercent === "number" ? data.margemPercent : undefined,
        materiaisRef: Array.isArray(data.materiaisRef) ? data.materiaisRef : undefined,
        historico: [],
      };
      add("receitasEditor", clean);
      setTimeout(() => {
        const c = useStore.getState().receitasEditor.slice(-1)[0];
        if (c) setEditId(c.id);
      }, 0);
      toast.success("Receita importada");
    } catch (e: any) { toast.error("JSON inválido: " + (e?.message ?? e)); }
  };
  const addTag = () => {
    if (!r || !tagInput.trim()) return;
    patch({ tags: Array.from(new Set([...(r.tags ?? []), tagInput.trim()])) });
    setTagInput("");
  };
  const removeTag = (t: string) => r && patch({ tags: (r.tags ?? []).filter((x) => x !== t) });

  return (
    <div className="space-y-6">
      <PageHeader title="Hub de Criação · Editor de Receita" description="Cria receitas estruturadas de amigurumi e crochê com pré-visualização." />

      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-56 flex-1">
          <Label className="flex items-center gap-1"><Search className="h-3 w-3" />Pesquisar</Label>
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nome, tag, material, secção…" />
        </div>
        <div className="flex-1 min-w-48">
          <Label>Receita</Label>
          <Select value={editId || ""} onValueChange={setEditId}>
            <SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger>
            <SelectContent>{filtered.map((x) => <SelectItem key={x.id} value={x.id}>{x.nome}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <Button onClick={novo} className="bg-violet-300 hover:bg-violet-400 text-violet-950"><Plus className="mr-1 h-4 w-4" />Novo Projeto</Button>
        <input
          ref={fileRef} type="file" accept="application/json,.json" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) importarJSON(f); e.target.value = ""; }}
        />
        <Button variant="outline" onClick={() => fileRef.current?.click()}>
          <Upload className="mr-1 h-4 w-4" />Importar JSON
        </Button>
        <Button variant="outline" onClick={() => setRulesOpen(true)}>Regras de merge</Button>
        {r && <Button variant="ghost" onClick={() => { remove("receitasEditor", r.id); setEditId(null); }}><Trash2 className="h-4 w-4" /></Button>}
      </div>

      <Dialog open={rulesOpen} onOpenChange={setRulesOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Regras de merge ao importar receita.json</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>Horas estimadas</Label>
              <Select value={rules.horas} onValueChange={(v) => setAndSaveRules({ ...rules, horas: v as HorasMode })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="keep">Manter as existentes</SelectItem>
                  <SelectItem value="replace">Substituir pelas importadas</SelectItem>
                  <SelectItem value="max">Usar o maior valor</SelectItem>
                  <SelectItem value="sum">Somar</SelectItem>
                  <SelectItem value="recalc">Recalcular por materiais</SelectItem>
                </SelectContent>
              </Select>
              {rules.horas === "recalc" && (
                <div className="mt-2">
                  <Label>Horas por unidade de material</Label>
                  <Input
                    type="number" min={0} step={0.05}
                    value={rules.horasPorUnidade}
                    onChange={(e) => setAndSaveRules({ ...rules, horasPorUnidade: +e.target.value || 0 })}
                  />
                </div>
              )}
            </div>
            <div>
              <Label>Margem (%)</Label>
              <Select value={rules.margem} onValueChange={(v) => setAndSaveRules({ ...rules, margem: v as MargemMode })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="keep">Manter a existente</SelectItem>
                  <SelectItem value="replace">Substituir pela importada</SelectItem>
                  <SelectItem value="max">Usar a maior</SelectItem>
                  <SelectItem value="avg">Média das duas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={rules.atualizarPrecos}
                onChange={(e) => setAndSaveRules({ ...rules, atualizarPrecos: e.target.checked })} />
              Atualizar preços de materiais existentes
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={rules.adicionarMateriaisNovos}
                onChange={(e) => setAndSaveRules({ ...rules, adicionarMateriaisNovos: e.target.checked })} />
              Adicionar materiais novos
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={rules.unirTags}
                onChange={(e) => setAndSaveRules({ ...rules, unirTags: e.target.checked })} />
              Unir tags
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={rules.anexarNotas}
                onChange={(e) => setAndSaveRules({ ...rules, anexarNotas: e.target.checked })} />
              Anexar notas importadas
            </label>
            <div className="mt-2 rounded-md border p-2">
              <div className="mb-1 text-xs font-medium">Presets guardados</div>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  placeholder="Nome do preset (ex.: Encomendas grandes)"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  className="h-8 flex-1 min-w-40"
                />
                <Button size="sm" variant="outline" onClick={gravarPreset}>Gravar preset</Button>
              </div>
              {presets.length === 0 ? (
                <div className="mt-2 text-xs text-muted-foreground">Sem presets. Grava o conjunto atual para reutilizar depois.</div>
              ) : (
                <ul className="mt-2 space-y-1">
                  {presets.map((p) => (
                    <li key={p.id} className="flex items-center gap-2 text-sm">
                      <Badge variant="outline" className="text-[10px]">{p.rules.horas}/{p.rules.margem}</Badge>
                      <span className="truncate">{p.nome}</span>
                      <Button size="sm" variant="ghost" className="ml-auto h-7" onClick={() => aplicarPreset(p.id)}>Aplicar</Button>
                      <Button size="sm" variant="ghost" className="h-7" onClick={() => removerPreset(p.id)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAndSaveRules(DEFAULT_RULES)}>Repor padrão</Button>
            <Button onClick={() => setRulesOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {!r ? (
        <Card className="p-10 text-center text-muted-foreground">Cria a tua primeira receita.</Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Lado esquerdo — editor */}
          <div className="space-y-4">
            <Card>
              <CardContent className="grid gap-3 p-4 sm:grid-cols-2">
                <div><Label>Nome</Label><Input value={r.nome} onChange={(e) => patch({ nome: e.target.value })} /></div>
                <div>
                  <Label>Categoria</Label>
                  <Select value={r.categoria} onValueChange={(v) => patch({ categoria: v as ReceitaEditor["categoria"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="amigurumi">Amigurumi</SelectItem>
                      <SelectItem value="crochet">Crochê Tradicional</SelectItem>
                      <SelectItem value="tricotin">Tricotin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2">
                  <Label>Tags</Label>
                  <div className="flex flex-wrap items-center gap-2 rounded-md border border-input p-2">
                    {(r.tags ?? []).map((t) => (
                      <Badge key={t} variant="secondary" className="gap-1">
                        {t}
                        <button onClick={() => removeTag(t)} className="ml-1 hover:text-destructive" aria-label="Remover tag">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                    <Input
                      value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                      placeholder="Nova tag + Enter"
                      className="h-7 min-w-32 flex-1 border-0 focus-visible:ring-0"
                    />
                  </div>
                </div>
                <div>
                  <Label>Horas estimadas</Label>
                  <Input
                    type="number" min={0} step={0.5}
                    value={r.horasEstimadas ?? ""}
                    onChange={(e) => patch({ horasEstimadas: e.target.value ? +e.target.value : undefined })}
                    placeholder="Ex.: 6"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-display">Materiais</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {r.materiais.map((m) => (
                  <div key={m.id} className="grid grid-cols-[1fr_120px_auto] gap-2">
                    <Input placeholder="Material" value={m.nome} onChange={(e) => patch({ materiais: r.materiais.map((x) => x.id === m.id ? { ...x, nome: e.target.value } : x) })} />
                    <Input placeholder="Qtd" value={m.quantidade} onChange={(e) => patch({ materiais: r.materiais.map((x) => x.id === m.id ? { ...x, quantidade: e.target.value } : x) })} />
                    <Button variant="ghost" size="icon" onClick={() => patch({ materiais: r.materiais.filter((x) => x.id !== m.id) })}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
                <Button size="sm" variant="outline" onClick={() => patch({ materiais: [...r.materiais, { id: uid(), nome: "", quantidade: "" }] })}><Plus className="mr-1 h-4 w-4" />Material</Button>
              </CardContent>
            </Card>

            {r.seccoes.map((sec, si) => (
              <Card key={sec.id}>
                <CardHeader className="flex flex-row items-center gap-2 pb-2">
                  <Input value={sec.nome} onChange={(e) => patch({ seccoes: r.seccoes.map((s) => s.id === sec.id ? { ...s, nome: e.target.value } : s) })} className="font-display text-sm" />
                  <Button size="sm" variant="ghost" onClick={() => patch({ seccoes: r.seccoes.filter((s) => s.id !== sec.id) })}><Trash2 className="h-4 w-4" /></Button>
                </CardHeader>
                <CardContent className="space-y-2">
                  {sec.carreiras.map((c, ci) => (
                    <div key={c.id} className="grid grid-cols-[40px_1fr_90px_auto] items-center gap-2">
                      <div className="text-xs font-medium text-muted-foreground">C{ci + 1}:</div>
                      <Input placeholder="ex: 6 pa no anel mágico" value={c.texto} onChange={(e) => patch({ seccoes: r.seccoes.map((s) => s.id === sec.id ? { ...s, carreiras: s.carreiras.map((x) => x.id === c.id ? { ...x, texto: e.target.value } : x) } : s) })} />
                      <Input type="number" placeholder="Pts" value={c.totalPontos ?? ""} onChange={(e) => patch({ seccoes: r.seccoes.map((s) => s.id === sec.id ? { ...s, carreiras: s.carreiras.map((x) => x.id === c.id ? { ...x, totalPontos: +e.target.value } : x) } : s) })} />
                      <Button variant="ghost" size="icon" onClick={() => patch({ seccoes: r.seccoes.map((s) => s.id === sec.id ? { ...s, carreiras: s.carreiras.filter((x) => x.id !== c.id) } : s) })}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  ))}
                  <Button size="sm" variant="outline" onClick={() => patch({ seccoes: r.seccoes.map((s) => s.id === sec.id ? { ...s, carreiras: [...s.carreiras, { id: uid(), texto: "" }] } : s) })}><Plus className="mr-1 h-4 w-4" />Adicionar Carreira</Button>
                  <div className="text-xs text-muted-foreground">Secção {si + 1} de {r.seccoes.length}</div>
                </CardContent>
              </Card>
            ))}
            <Button variant="outline" onClick={() => patch({ seccoes: [...r.seccoes, { id: uid(), nome: "Nova secção", carreiras: [] }] })}><Plus className="mr-1 h-4 w-4" />Adicionar Secção</Button>

            <Textarea placeholder="Notas gerais" value={r.notas || ""} onChange={(e) => patch({ notas: e.target.value })} />
            <div className="flex flex-wrap gap-2">
              <Button onClick={guardar}><Save className="mr-1 h-4 w-4" />Guardar (versão)</Button>
              <Button variant="outline" onClick={exportarJSON}><Download className="mr-1 h-4 w-4" />Exportar JSON</Button>
              <Button variant="outline" onClick={() => window.print()}><FileDown className="mr-1 h-4 w-4" />Exportar PDF (imprimir)</Button>
            </div>

            {(r.historico?.length ?? 0) > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="font-display flex items-center gap-2 text-sm">
                    <HistoryIcon className="h-4 w-4" />Histórico de versões
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 max-h-64 overflow-auto">
                  {(r.historico ?? []).map((h) => (
                    <div key={h.id} className="flex items-center justify-between rounded-md border border-border p-2 text-xs">
                      <div>
                        <div className="font-medium">{h.label || "Versão"}</div>
                        <div className="text-muted-foreground">{new Date(h.data).toLocaleString()}</div>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => restaurar(h)}>Restaurar</Button>
                        <Button size="sm" variant="ghost"
                          onClick={() => patch({ historico: (r.historico ?? []).filter((x) => x.id !== h.id) })}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Preview */}
          <div className="lg:sticky lg:top-20 lg:h-fit">
            <Card className="bg-gradient-to-br from-violet-50 to-pink-50">
              <CardContent className="space-y-4 p-6">
                <div className="border-b border-violet-200 pb-3">
                  <h1 className="font-display text-2xl font-bold text-violet-900">{r.nome}</h1>
                  <p className="text-sm uppercase tracking-widest text-violet-700">{r.categoria}</p>
                </div>
                {r.materiais.length > 0 && (
                  <div>
                    <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-violet-800">Materiais</h3>
                    <ul className="mt-1 space-y-0.5 text-sm">
                      {r.materiais.map((m) => <li key={m.id}>• {m.nome} <span className="text-muted-foreground">— {m.quantidade}</span></li>)}
                    </ul>
                  </div>
                )}
                {r.seccoes.map((sec) => (
                  <div key={sec.id}>
                    <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-violet-800">{sec.nome}</h3>
                    <ol className="mt-1 space-y-1 text-sm">
                      {sec.carreiras.map((c, i) => (
                        <li key={c.id}>
                          <strong>Carreira {i + 1}:</strong> {c.texto} {c.totalPontos ? <span className="text-violet-600">({c.totalPontos} pts)</span> : null}
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
                {r.notas && <div className="border-t border-violet-200 pt-3 text-xs italic text-violet-700">{r.notas}</div>}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}