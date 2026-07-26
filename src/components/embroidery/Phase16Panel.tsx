/**
 * Fase 16 — Painel unificado: paleta rápida por camada, presets do projeto,
 * auto-save com recuperação, biblioteca de motivos/fontes SVG e ordenação
 * das camadas do aplique. Auto-contido: consome apenas hooks do React e o
 * módulo `embroidery-phase16.ts`.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  addMotif, blendPreviewHex, clearAutosave, deleteMotif, deletePreset,
  listMotifs, listPresets, readAutosave, savePreset, writeAutosave,
  normalizeAppliqueOrder, reorderApplique, setAppliqueScale,
  type AppliqueLayer, type EmbroideryPreset, type LayerPaletteEntry,
  type MotifItem, type StrandCount,
} from "@/lib/embroidery-phase16";

interface Phase16PanelProps {
  projectId?: string;
  /** Paleta ativa (uma entrada por camada de cor). */
  palette: LayerPaletteEntry[];
  onPaletteChange: (p: LayerPaletteEntry[]) => void;
  /** Snapshot serializável do estúdio para auto-save. */
  studioSnapshot?: unknown;
  /** Callback para restaurar o snapshot recuperado. */
  onRestore?: (data: unknown) => void;
  /** Presets aplicáveis: fornece um callback para aplicar ao editor. */
  onApplyPreset?: (p: EmbroideryPreset) => void;
  /** Dados atuais para gravar como preset. */
  currentPresetData?: EmbroideryPreset["data"];
  /** Callback para inserir SVG no canvas. */
  onInsertMotif?: (svg: string) => void;
}

export function Phase16Panel({
  projectId = "default",
  palette, onPaletteChange,
  studioSnapshot, onRestore,
  onApplyPreset, currentPresetData,
  onInsertMotif,
}: Phase16PanelProps) {
  // -------------------------- Auto-save ----------------------------
  const [autosaveOn, setAutosaveOn] = useState(true);
  const [recovered, setRecovered] = useState<number | null>(null);
  const lastSerializedRef = useRef<string>("");

  useEffect(() => {
    const snap = readAutosave(projectId);
    if (snap) setRecovered(snap.when);
  }, [projectId]);

  useEffect(() => {
    if (!autosaveOn || studioSnapshot === undefined) return;
    const s = JSON.stringify(studioSnapshot);
    if (s === lastSerializedRef.current) return;
    lastSerializedRef.current = s;
    const t = setTimeout(() => writeAutosave(projectId, studioSnapshot), 800);
    return () => clearTimeout(t);
  }, [autosaveOn, studioSnapshot, projectId]);

  const handleRestore = () => {
    const snap = readAutosave(projectId);
    if (!snap || !onRestore) return toast.info("Sem cópia recuperável.");
    onRestore(snap.data);
    toast.success("Sessão anterior restaurada.");
  };
  const handleClearAutosave = () => {
    clearAutosave(projectId); setRecovered(null); toast.success("Auto-save limpo.");
  };

  // -------------------------- Presets ------------------------------
  const [presets, setPresets] = useState<EmbroideryPreset[]>([]);
  const [presetName, setPresetName] = useState("");
  useEffect(() => { setPresets(listPresets(projectId)); }, [projectId]);

  const handleSavePreset = () => {
    if (!currentPresetData) return toast.error("Sem dados atuais para gravar.");
    if (!presetName.trim()) return toast.error("Dá um nome ao preset.");
    const p = savePreset(projectId, { nome: presetName.trim(), data: currentPresetData });
    setPresets([p, ...presets]);
    setPresetName("");
    toast.success(`Preset "${p.nome}" gravado.`);
  };
  const handleDeletePreset = (id: string) => {
    deletePreset(projectId, id);
    setPresets(presets.filter((p) => p.id !== id));
  };

  // -------------------------- Paleta rápida ------------------------
  const updateEntry = (idx: number, patch: Partial<LayerPaletteEntry>) => {
    onPaletteChange(palette.map((e, i) => (i === idx ? { ...e, ...patch } : e)));
  };
  const addBlend = (idx: number) => {
    const e = palette[idx];
    const blend = [...(e.blend ?? []), e.hex];
    if (blend.length > 2) return;
    updateEntry(idx, { blend });
  };
  const removeBlend = (idx: number, bi: number) => {
    const e = palette[idx];
    const blend = (e.blend ?? []).filter((_, i) => i !== bi);
    updateEntry(idx, { blend });
  };

  // -------------------------- Biblioteca ---------------------------
  const [libQuery, setLibQuery] = useState("");
  const [motifs, setMotifs] = useState<MotifItem[]>([]);
  const [motifName, setMotifName] = useState("");
  const [motifTags, setMotifTags] = useState("");
  const [motifKind, setMotifKind] = useState<MotifItem["kind"]>("motif");
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => { setMotifs(listMotifs(libQuery)); }, [libQuery]);

  const handleUploadSvg = async (file: File) => {
    if (!/\.svg$/i.test(file.name)) return toast.error("Só ficheiros .svg.");
    const txt = await file.text();
    if (!/<svg/i.test(txt)) return toast.error("SVG inválido.");
    const item = addMotif(
      motifName.trim() || file.name.replace(/\.svg$/i, ""),
      txt,
      motifTags.split(",").map((s) => s.trim()).filter(Boolean),
      motifKind,
    );
    setMotifs([item, ...motifs]);
    setMotifName(""); setMotifTags("");
    toast.success(`"${item.nome}" adicionado à biblioteca.`);
  };

  // -------------------------- Aplique ------------------------------
  const [applique, setApplique] = useState<AppliqueLayer[]>([]);
  const orderedApplique = useMemo(() => normalizeAppliqueOrder(applique), [applique]);
  const addAppliqueForColor = (colorIndex: number) => {
    const seed: AppliqueLayer[] = (["colocar", "fixar", "cobrir"] as const).map((role, i) => ({
      id: `${Date.now()}_${colorIndex}_${role}`,
      role, scale: 1, order: i, colorIndex,
    }));
    setApplique(normalizeAppliqueOrder([...applique, ...seed]));
  };

  return (
    <Card>
      <CardContent className="space-y-3 p-3">
        <Label className="text-xs font-semibold">Fase 16 — Paleta, presets & biblioteca</Label>

        {/* Recuperação */}
        <div className="rounded border border-dashed p-2 space-y-1">
          <div className="flex items-center justify-between">
            <Label className="text-[10px]">Auto-save</Label>
            <Button size="sm" variant={autosaveOn ? "default" : "outline"} onClick={() => setAutosaveOn((v) => !v)}>
              {autosaveOn ? "Ligado" : "Desligado"}
            </Button>
          </div>
          {recovered && (
            <div className="flex items-center gap-1">
              <p className="text-[10px] text-muted-foreground flex-1">
                Cópia de {new Date(recovered).toLocaleString()}
              </p>
              <Button size="sm" variant="outline" onClick={handleRestore}>Recuperar</Button>
              <Button size="sm" variant="ghost" onClick={handleClearAutosave}>Limpar</Button>
            </div>
          )}
        </div>

        {/* Paleta rápida por camada */}
        <div className="space-y-1">
          <Label className="text-[10px]">Paleta por camada ({palette.length})</Label>
          <div className="max-h-40 overflow-y-auto space-y-1">
            {palette.map((entry, idx) => (
              <div key={idx} className="flex items-center gap-1 border rounded p-1">
                <input
                  type="color"
                  value={entry.hex}
                  onChange={(e) => updateEntry(idx, { hex: e.target.value })}
                  className="h-6 w-6 rounded border cursor-pointer"
                  aria-label={`Cor camada ${idx + 1}`}
                />
                <select
                  value={entry.strands}
                  onChange={(e) => updateEntry(idx, { strands: Number(e.target.value) as StrandCount })}
                  className="text-[10px] rounded border px-1 py-0.5"
                  aria-label="Fios"
                >
                  {[1, 2, 3, 4, 6].map((n) => <option key={n} value={n}>{n} fio{n > 1 ? "s" : ""}</option>)}
                </select>
                <div className="flex items-center gap-0.5">
                  {(entry.blend ?? []).map((h, bi) => (
                    <input key={bi} type="color" value={h}
                      onChange={(e) => {
                        const blend = [...(entry.blend ?? [])];
                        blend[bi] = e.target.value;
                        updateEntry(idx, { blend });
                      }}
                      onDoubleClick={() => removeBlend(idx, bi)}
                      title="Duplo-clique para remover"
                      className="h-5 w-5 rounded border cursor-pointer"
                    />
                  ))}
                  {(entry.blend ?? []).length < 2 && (
                    <Button size="sm" variant="ghost" className="h-5 px-1 text-[10px]" onClick={() => addBlend(idx)}>+mix</Button>
                  )}
                </div>
                <div
                  className="h-6 w-6 rounded border ml-auto"
                  style={{ background: blendPreviewHex(entry) }}
                  title={`Preview ${entry.strands} fios`}
                />
              </div>
            ))}
            {palette.length === 0 && (
              <p className="text-[10px] text-muted-foreground italic">Sem camadas ativas.</p>
            )}
          </div>
        </div>

        {/* Presets */}
        <div className="space-y-1">
          <Label className="text-[10px]">Presets do projeto ({presets.length})</Label>
          <div className="flex gap-1">
            <Input value={presetName} onChange={(e) => setPresetName(e.target.value)}
              placeholder="Nome do preset" className="h-7 text-xs" />
            <Button size="sm" onClick={handleSavePreset}>Gravar</Button>
          </div>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {presets.map((p) => (
              <div key={p.id} className="flex items-center gap-1 border rounded p-1">
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium truncate">{p.nome}</p>
                  <p className="text-[9px] text-muted-foreground">{new Date(p.criadoEm).toLocaleDateString()}</p>
                </div>
                {onApplyPreset && (
                  <Button size="sm" variant="outline" className="h-6 px-2 text-[10px]"
                    onClick={() => { onApplyPreset(p); toast.success(`"${p.nome}" aplicado.`); }}>
                    Aplicar
                  </Button>
                )}
                <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]" onClick={() => handleDeletePreset(p.id)}>×</Button>
              </div>
            ))}
          </div>
        </div>

        {/* Biblioteca */}
        <div className="space-y-1">
          <Label className="text-[10px]">Biblioteca (motivos & fontes SVG)</Label>
          <div className="flex gap-1">
            <Input value={libQuery} onChange={(e) => setLibQuery(e.target.value)}
              placeholder="Pesquisar por nome / tag" className="h-7 text-xs" />
          </div>
          <div className="grid grid-cols-2 gap-1">
            <Input value={motifName} onChange={(e) => setMotifName(e.target.value)} placeholder="Nome" className="h-7 text-xs" />
            <select value={motifKind} onChange={(e) => setMotifKind(e.target.value as MotifItem["kind"])}
              className="h-7 text-xs rounded border px-1">
              <option value="motif">Motivo</option>
              <option value="font">Fonte</option>
            </select>
          </div>
          <Input value={motifTags} onChange={(e) => setMotifTags(e.target.value)}
            placeholder="tags separadas por vírgula" className="h-7 text-xs" />
          <input ref={fileRef} type="file" accept=".svg,image/svg+xml" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadSvg(f); e.currentTarget.value = ""; }} />
          <Button size="sm" className="w-full" onClick={() => fileRef.current?.click()}>Carregar SVG</Button>
          <div className="max-h-40 overflow-y-auto space-y-1">
            {motifs.map((m) => (
              <div key={m.id} className="flex items-center gap-1 border rounded p-1">
                <div
                  className="h-8 w-8 shrink-0 rounded border bg-white overflow-hidden flex items-center justify-center"
                  dangerouslySetInnerHTML={{ __html: m.svg.replace(/<svg /i, '<svg width="32" height="32" ') }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium truncate">{m.nome}</p>
                  <p className="text-[9px] text-muted-foreground truncate">
                    {m.kind} · {m.tags.join(", ") || "sem tags"}
                  </p>
                </div>
                {onInsertMotif && (
                  <Button size="sm" variant="outline" className="h-6 px-2 text-[10px]"
                    onClick={() => { onInsertMotif(m.svg); toast.success(`"${m.nome}" inserido.`); }}>
                    Inserir
                  </Button>
                )}
                <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]"
                  onClick={() => { deleteMotif(m.id); setMotifs(motifs.filter((x) => x.id !== m.id)); }}>×</Button>
              </div>
            ))}
            {motifs.length === 0 && (
              <p className="text-[10px] text-muted-foreground italic">Sem itens.</p>
            )}
          </div>
        </div>

        {/* Aplique — reordenar & escalar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label className="text-[10px]">Aplique (Colocar → Fixar → Cobrir)</Label>
            <Button size="sm" variant="outline" className="h-6 px-2 text-[10px]"
              onClick={() => addAppliqueForColor(palette.length)}>+ trio</Button>
          </div>
          <div className="max-h-40 overflow-y-auto space-y-1">
            {orderedApplique.map((l) => (
              <div key={l.id} className="flex items-center gap-1 border rounded p-1">
                <span className="text-[10px] capitalize w-14">{l.role}</span>
                <span className="text-[10px] text-muted-foreground w-10">#{l.colorIndex + 1}</span>
                <input type="range" min={0.5} max={2} step={0.05} value={l.scale}
                  onChange={(e) => setApplique(setAppliqueScale(orderedApplique, l.id, Number(e.target.value)))}
                  className="flex-1"
                />
                <span className="text-[10px] tabular-nums w-10">{l.scale.toFixed(2)}×</span>
                <Button size="sm" variant="ghost" className="h-6 px-1 text-[10px]"
                  onClick={() => setApplique(reorderApplique(orderedApplique, l.id, "up"))}>↑</Button>
                <Button size="sm" variant="ghost" className="h-6 px-1 text-[10px]"
                  onClick={() => setApplique(reorderApplique(orderedApplique, l.id, "down"))}>↓</Button>
                <Button size="sm" variant="ghost" className="h-6 px-1 text-[10px]"
                  onClick={() => setApplique(orderedApplique.filter((x) => x.id !== l.id))}>×</Button>
              </div>
            ))}
            {orderedApplique.length === 0 && (
              <p className="text-[10px] text-muted-foreground italic">Sem trios de aplique.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}