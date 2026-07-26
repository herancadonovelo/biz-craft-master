import * as React from "react";
import { toast } from "sonner";
import {
  chaikin, rdp, yarnEstimateMeters, materialCost, mirror, offsetPolyline,
  centroid, exportGCode, exportGCodeArcs, nestRectsRotational, textileMetadata, computeA4Tiles,
  analyzeArcApproximation,
  type P,
} from "@/lib/tricotin-pro";
import { SHARED_TEMPLATES, BRAND_PALETTES } from "@/lib/cloud-templates";
import { formatCurrency } from "@/lib/store";

type Props = {
  getPoints: () => P[];
  setPoints: (pts: P[]) => void;
  pxPerMm: number;
  sheetW: number;
  sheetH: number;
  /** Optional scope so presets / tolerance persist per project. */
  projectId?: string;
};

export function TricotinProPanel({ getPoints, setPoints, pxPerMm, sheetW, sheetH, projectId }: Props) {
  // ---- Project scope (persisted). Every keyed value below is namespaced
  // by this id so the user resumes the exact same config per project. ----
  const ACTIVE_PROJECT_KEY = "tricotin-pro-active-project";
  const [project, setProject] = React.useState<string>(
    () => projectId || readLS<string>(ACTIVE_PROJECT_KEY, "default") || "default",
  );
  React.useEffect(() => {
    if (projectId && projectId !== project) setProject(projectId);
  }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps
  React.useEffect(() => { writeLS(ACTIVE_PROJECT_KEY, project); }, [project]);
  const scope = (k: string) => `${k}:${project}`;

  const TOL_KEY = "tricotin-pro-tol-v1";
  const MAX_DISC_KEY = "tricotin-pro-max-disc-v1";

  const [cordMm, setCordMm] = React.useState(10);
  const [pricePerM, setPricePerM] = React.useState(0.8);
  const [scaleFactor, setScaleFactor] = React.useState(1);
  const [offsetMm, setOffsetMm] = React.useState(0);
  const [tileCols, setTileCols] = React.useState(2);
  const [tileRows, setTileRows] = React.useState(2);
  const [author, setAuthor] = React.useState("Art Fusion");
  const [designName, setDesignName] = React.useState("Novo Molde");
  const [arcTolMm, setArcTolMm] = React.useState<number>(() => readLS<number>(scope(TOL_KEY), 0.1));
  const [maxDiscontinuities, setMaxDiscontinuities] = React.useState<number>(
    () => readLS<number>(scope(MAX_DISC_KEY), 20),
  );
  const [nestMarginMm, setNestMarginMm] = React.useState(2);
  const [allowRotate, setAllowRotate] = React.useState(true);

  // ---------------- Presets & histórico ----------------
  type Preset = {
    id: string; name: string; savedAt: string;
    cordMm: number; pricePerM: number; scaleFactor: number; offsetMm: number;
    tileCols: number; tileRows: number; arcTolMm: number; nestMarginMm: number;
    designName: string; author: string;
  };
  const PRESETS_KEY = "tricotin-pro-presets-v1";
  const HISTORY_KEY = "tricotin-pro-history-v1";
  const [presets, setPresets] = React.useState<Preset[]>(() => readLS<Preset[]>(scope(PRESETS_KEY), []));
  const [history, setHistory] = React.useState<Preset[]>(() => readLS<Preset[]>(scope(HISTORY_KEY), []));
  // Reload scoped values whenever the active project changes.
  React.useEffect(() => {
    setPresets(readLS<Preset[]>(scope(PRESETS_KEY), []));
    setHistory(readLS<Preset[]>(scope(HISTORY_KEY), []));
    setArcTolMm(readLS<number>(scope(TOL_KEY), 0.1));
    setMaxDiscontinuities(readLS<number>(scope(MAX_DISC_KEY), 20));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project]);
  // Persist tolerance / limit per project.
  React.useEffect(() => { writeLS(scope(TOL_KEY), arcTolMm); }, [arcTolMm, project]); // eslint-disable-line react-hooks/exhaustive-deps
  React.useEffect(() => { writeLS(scope(MAX_DISC_KEY), maxDiscontinuities); }, [maxDiscontinuities, project]); // eslint-disable-line react-hooks/exhaustive-deps

  function snapshot(): Preset {
    return {
      id: crypto.randomUUID(), name: designName || "Sessão", savedAt: new Date().toISOString(),
      cordMm, pricePerM, scaleFactor, offsetMm, tileCols, tileRows, arcTolMm, nestMarginMm,
      designName, author,
    };
  }
  function applyPreset(p: Preset) {
    setCordMm(p.cordMm); setPricePerM(p.pricePerM); setScaleFactor(p.scaleFactor);
    setOffsetMm(p.offsetMm); setTileCols(p.tileCols); setTileRows(p.tileRows);
    setArcTolMm(p.arcTolMm); setNestMarginMm(p.nestMarginMm);
    setDesignName(p.designName); setAuthor(p.author);
    toast.success(`Preset "${p.name}" aplicado.`);
  }
  function savePreset() {
    const name = window.prompt("Nome do preset:", designName) || "Sem nome";
    const next = [{ ...snapshot(), name }, ...presets].slice(0, 20);
    setPresets(next); writeLS(scope(PRESETS_KEY), next);
    toast.success("Preset guardado.");
  }
  function deletePreset(id: string) {
    const next = presets.filter((p) => p.id !== id);
    setPresets(next); writeLS(scope(PRESETS_KEY), next);
  }
  // Push to history whenever the user changes a knob (debounced).
  React.useEffect(() => {
    const t = window.setTimeout(() => {
      const snap = snapshot();
      const next = [snap, ...history].slice(0, 10);
      setHistory(next); writeLS(scope(HISTORY_KEY), next);
    }, 800);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cordMm, pricePerM, scaleFactor, offsetMm, tileCols, tileRows, arcTolMm, nestMarginMm, designName, author]);

  const meters = React.useMemo(() => yarnEstimateMeters(getPoints(), pxPerMm), [getPoints, pxPerMm]);
  const cost = React.useMemo(() => materialCost(meters, pricePerM), [meters, pricePerM]);

  // ------- Tolerance preview (arcs vs. original) -------
  // Recomputed whenever the tolerance changes or the user re-opens the panel;
  // getPoints is called eagerly here so the preview reflects the live canvas.
  const arcStats = React.useMemo(() => {
    const pts = getPoints();
    return analyzeArcApproximation(pts, { pxPerMm, arcToleranceMm: arcTolMm });
  }, [getPoints, pxPerMm, arcTolMm]);
  const originalPts = React.useMemo(() => getPoints(), [getPoints]);
  const previewBox = React.useMemo(() => {
    const src = originalPts.length > 1 ? originalPts : arcStats.polylineForPreview;
    if (!src.length) return null;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of src) {
      if (p.x < minX) minX = p.x; if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x; if (p.y > maxY) maxY = p.y;
    }
    const pad = 8;
    return { minX: minX - pad, minY: minY - pad, w: maxX - minX + pad * 2, h: maxY - minY + pad * 2 };
  }, [originalPts, arcStats]);
  const toPolyStr = (pts: P[]) => pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

  // ------- Discontinuity gate: block arc export if noisy path -------
  const arcExportBlocked = arcStats.discontinuities > maxDiscontinuities;

  function apply(name: string, fn: (pts: P[]) => P[]) {
    const pts = getPoints();
    if (!pts.length) return toast.error("Desenha algo primeiro.");
    setPoints(fn(pts));
    toast.success(name);
  }

  function downloadText(name: string, mime: string, content: string) {
    const url = URL.createObjectURL(new Blob([content], { type: mime }));
    const a = document.createElement("a");
    a.href = url; a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div data-testid="tricotin-pro" className="rounded-md border bg-card p-3 text-xs space-y-3">
      <div className="font-medium text-sm">Ferramentas Avançadas</div>

      <details>
        <summary className="cursor-pointer font-medium">Folha De Molde & Histórico de Sessão</summary>
        <div className="mt-2 space-y-2">
          <label className="flex items-center gap-2 text-[11px]">
            <span className="text-muted-foreground">Projeto</span>
            <input
              data-testid="pro-project-id"
              value={project}
              onChange={(e) => setProject(e.target.value.trim() || "default")}
              className="flex-1 rounded border px-2 py-1"
              placeholder="default"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button data-testid="save-preset" className="rounded border px-2 py-1" onClick={savePreset}>Guardar Folha De Molde Atual</button>
            <button className="rounded border px-2 py-1" onClick={() => { setPresets([]); writeLS(scope(PRESETS_KEY), []); toast.success("Folhas de moldes limpas."); }}>Limpar Folhas De Moldes</button>
          </div>
          {presets.length > 0 && (
            <div className="space-y-1">
              <div className="text-[11px] text-muted-foreground">Presets guardados</div>
              {presets.map((p) => (
                <div key={p.id} className="flex items-center gap-2 rounded border bg-background px-2 py-1">
                  <button className="flex-1 text-left" onClick={() => applyPreset(p)}>
                    <b>{p.name}</b> <span className="text-muted-foreground">· ⌀{p.cordMm}mm · {formatCurrency(p.pricePerM)}/m</span>
                  </button>
                  <button className="text-destructive" onClick={() => deletePreset(p.id)}>×</button>
                </div>
              ))}
            </div>
          )}
          {history.length > 0 && (
            <div className="space-y-1">
              <div className="text-[11px] text-muted-foreground">Últimas sessões (auto)</div>
              {history.slice(0, 5).map((p) => (
                <button key={p.id} className="block w-full rounded border bg-background px-2 py-1 text-left hover:bg-muted"
                  onClick={() => applyPreset(p)}>
                  {new Date(p.savedAt).toLocaleString("pt-PT")} — ⌀{p.cordMm}mm ×{p.scaleFactor}
                </button>
              ))}
            </div>
          )}
        </div>
      </details>

      <details open>
        <summary className="cursor-pointer font-medium">Desenho — suavização & esqueleto</summary>
        <div className="mt-2 flex flex-wrap gap-2">
          <button className="rounded border px-2 py-1" onClick={() => apply("Suavização Chaikin aplicada", (p) => chaikin(p, 2))}>Suavizar (Chaikin ×2)</button>
          <button className="rounded border px-2 py-1" onClick={() => apply("Simplificação RDP aplicada", (p) => rdp(p, 1.5))}>Simplificar (RDP ε=1.5)</button>
        </div>
      </details>

      <details>
        <summary className="cursor-pointer font-medium">Cálculos automáticos</summary>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <label>Diâm. cordão (mm) <input type="number" min={4} max={20} value={cordMm} onChange={(e) => setCordMm(+e.target.value)} className="w-full rounded border px-2 py-1" /></label>
          <label>Preço /m <input type="number" step={0.1} value={pricePerM} onChange={(e) => setPricePerM(+e.target.value)} className="w-full rounded border px-2 py-1" /></label>
          <div className="col-span-2 rounded bg-muted p-2 text-[11px]">
            Lã estimada: <b data-testid="yarn-meters">{meters.toFixed(2)} m</b> · Custo material: <b>{formatCurrency(cost)}</b>
          </div>
          <label className="col-span-2">Redimensionar (fator) <input type="number" step={0.05} value={scaleFactor} onChange={(e) => setScaleFactor(+e.target.value)} className="w-full rounded border px-2 py-1" /></label>
          <button className="col-span-2 rounded border px-2 py-1" onClick={() => {
            const c = centroid(getPoints());
            apply(`Redimensionado ×${scaleFactor}`, (p) => p.map((pt) => ({ x: c.x + (pt.x - c.x) * scaleFactor, y: c.y + (pt.y - c.y) * scaleFactor })));
          }}>Aplicar redimensionamento proporcional</button>
        </div>
      </details>

      <details>
        <summary className="cursor-pointer font-medium">Camadas, snap & espelho</summary>
        <div className="mt-2 flex flex-wrap gap-2">
          <button className="rounded border px-2 py-1" onClick={() => apply("Espelhado na vertical", (p) => mirror(p, "x", sheetW / 2))}>Espelhar Horizontal</button>
          <button className="rounded border px-2 py-1" onClick={() => apply("Espelhado na horizontal", (p) => mirror(p, "y", sheetH / 2))}>Espelhar Vertical</button>
          <label className="w-full">Offset dinâmico (mm) <input type="number" step={0.5} value={offsetMm} onChange={(e) => setOffsetMm(+e.target.value)} className="w-full rounded border px-2 py-1" /></label>
          <button className="rounded border px-2 py-1" onClick={() => apply(`Offset ${offsetMm}mm aplicado`, (p) => offsetPolyline(p, offsetMm * pxPerMm))}>Aplicar offset</button>
        </div>
      </details>

      <details>
        <summary className="cursor-pointer font-medium">Impressão avançada (tiling A4)</summary>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <label>Colunas <input type="number" min={1} max={4} value={tileCols} onChange={(e) => setTileCols(+e.target.value)} className="w-full rounded border px-2 py-1" /></label>
          <label>Linhas <input type="number" min={1} max={4} value={tileRows} onChange={(e) => setTileRows(+e.target.value)} className="w-full rounded border px-2 py-1" /></label>
          <button data-testid="tile-preview" className="col-span-2 rounded border px-2 py-1" onClick={() => {
            const tiles = computeA4Tiles(sheetW, sheetH, tileCols, tileRows);
            toast.success(`${tiles.length} folhas A4 preparadas (${tileCols}×${tileRows}).`);
          }}>Gerar plano de tiling</button>
        </div>
      </details>

      <details>
        <summary className="cursor-pointer font-medium">Exportação industrial</summary>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <label className="col-span-2">Nome do design <input value={designName} onChange={(e) => setDesignName(e.target.value)} className="w-full rounded border px-2 py-1" /></label>
          <label className="col-span-2">Autor <input value={author} onChange={(e) => setAuthor(e.target.value)} className="w-full rounded border px-2 py-1" /></label>
          <label>Tolerância arco (mm) <input type="number" step={0.05} min={0.02} max={1} value={arcTolMm} onChange={(e) => setArcTolMm(+e.target.value)} className="w-full rounded border px-2 py-1" /></label>
          <label>Margem nesting (mm) <input type="number" step={0.5} min={0} max={20} value={nestMarginMm} onChange={(e) => setNestMarginMm(+e.target.value)} className="w-full rounded border px-2 py-1" /></label>
          <label className="col-span-2">Máx. descontinuidades permitidas
            <input
              data-testid="max-discontinuities"
              type="number" min={0} max={9999} step={1}
              value={maxDiscontinuities}
              onChange={(e) => setMaxDiscontinuities(Math.max(0, Math.floor(+e.target.value || 0)))}
              className="w-full rounded border px-2 py-1"
            />
            <span className="mt-0.5 block text-[10.5px] text-muted-foreground">
              Se a estimativa passar este limite, o export G-Code (arcos) é bloqueado para evitar CNC ruidoso.
            </span>
          </label>
          <p className="col-span-2 rounded bg-muted/60 p-2 text-[11px] leading-snug text-muted-foreground">
            <b>Efeito da tolerância no G-code com arcos:</b>{" "}
            {arcTolMm <= 0.05
              ? "Muito fina — arcos quase perfeitos, mas mais G2/G3 curtos → CNC pode acelerar/desacelerar mais vezes."
              : arcTolMm <= 0.2
              ? "Equilibrada — boa fidelidade ao traço e movimento contínuo (recomendada para peças médias)."
              : "Grosseira — poucos arcos longos, movimento muito suave, mas desvio visível do desenho original."}
            {" "}Menor tolerância = mais precisão + mais descontinuidades; maior tolerância = movimento mais fluido + menos aceleração.
          </p>
          <div data-testid="arc-tolerance-preview" className="col-span-2 rounded border bg-background p-2 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-medium">
              <span>Pré-visualização da tolerância</span>
              <span className="text-muted-foreground">tol {arcTolMm} mm</span>
            </div>
            {previewBox ? (
              <svg viewBox={`${previewBox.minX} ${previewBox.minY} ${previewBox.w} ${previewBox.h}`}
                   className="h-32 w-full rounded bg-muted/30" preserveAspectRatio="xMidYMid meet">
                {originalPts.length > 1 && (
                  <polyline points={toPolyStr(originalPts)} fill="none" stroke="#94a3b8" strokeWidth={1.2} strokeDasharray="3 3" />
                )}
                {arcStats.polylineForPreview.length > 1 && (
                  <polyline points={toPolyStr(arcStats.polylineForPreview)} fill="none" stroke="#2563eb" strokeWidth={1.6} />
                )}
              </svg>
            ) : (
              <div className="grid h-32 place-items-center text-[11px] text-muted-foreground">
                Desenha um traçado para pré-visualizar a aproximação por arcos.
              </div>
            )}
            <div className="grid grid-cols-4 gap-1 text-[10.5px]">
              <Metric label="Arcos" value={arcStats.arcs} testid="metric-arcs" />
              <Metric label="Retas" value={arcStats.lines} testid="metric-lines" />
              <Metric label="Descont." value={arcStats.discontinuities} testid="metric-disc"
                     hint="Mudanças de direção ≥ 5° entre comandos (paragens/aceleração do CNC)." />
              <Metric label="Seg. médio" value={`${arcStats.avgSegmentMm.toFixed(1)} mm`} testid="metric-avg"
                     hint="Comprimento médio por comando. Maior = movimento mais fluido." />
            </div>
            <div className="flex items-center gap-1 text-[10.5px] text-muted-foreground">
              <span>Legenda:</span>
              <span className="inline-block h-1.5 w-4 bg-[#94a3b8]" /> original
              <span className="inline-block h-1.5 w-4 bg-[#2563eb] ml-2" /> arcos @ {arcTolMm} mm
            </div>
            {arcExportBlocked && (
              <div
                data-testid="arc-export-blocked"
                role="alert"
                className="rounded border border-destructive/40 bg-destructive/10 px-2 py-1 text-[11px] text-destructive"
              >
                Exportação bloqueada: {arcStats.discontinuities} descontinuidades &gt; limite {maxDiscontinuities}.
                Aumenta a tolerância ou suaviza o traçado antes de exportar.
              </div>
            )}
          </div>
          <button data-testid="export-gcode" className="rounded border px-2 py-1" onClick={() => {
            const pts = getPoints();
            if (!pts.length) return toast.error("Desenha algo primeiro.");
            const g = exportGCode(pts, { pxPerMm });
            downloadText(`${slug(designName)}.gcode`, "text/plain", g);
          }}>Exportar G-Code (CNC)</button>
          <button data-testid="export-gcode-arcs"
            disabled={arcExportBlocked}
            title={arcExportBlocked ? `Bloqueado: ${arcStats.discontinuities} > ${maxDiscontinuities}` : undefined}
            className="rounded border px-2 py-1 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => {
            if (arcExportBlocked) {
              toast.error(`Export bloqueado: ${arcStats.discontinuities} descontinuidades acima do limite (${maxDiscontinuities}).`);
              return;
            }
            const pts = getPoints();
            if (!pts.length) return toast.error("Desenha algo primeiro.");
            const g = exportGCodeArcs(pts, { pxPerMm, arcToleranceMm: arcTolMm });
            downloadText(`${slug(designName)}-arcs.gcode`, "text/plain", g);
            toast.success(`G-Code com arcos (tol. ${arcTolMm} mm)`);
          }}>Exportar G-Code (arcos)</button>
          <button className="rounded border px-2 py-1" onClick={() => {
            const pts = getPoints();
            const result = nestRectsRotational(
              [
                { id: "current", w: 100, h: 100, allowRotate },
                { id: "copy1", w: 80, h: 60, allowRotate },
                { id: "copy2", w: 60, h: 60, allowRotate },
              ],
              210, 297,
              { marginMm: nestMarginMm, rotations: allowRotate ? [0, 90] : [0] },
            );
            downloadText("nesting.json", "application/json", JSON.stringify({ ...result, source: pts.length }, null, 2));
            toast.success(`Nesting rotacional · eficiência ${(result.efficiency * 100).toFixed(1)}%`);
          }}>Nesting rotacional (JSON)</button>
          <label className="col-span-2 flex items-center gap-2">
            <input type="checkbox" checked={allowRotate} onChange={(e) => setAllowRotate(e.target.checked)} /> Permitir rotação 90° das peças
          </label>
          <button className="col-span-2 rounded border px-2 py-1" onClick={() => {
            const pts = getPoints();
            const meta = textileMetadata({
              designName, authorId: author,
              yarnMeters: yarnEstimateMeters(pts, pxPerMm),
            });
            downloadText("metadata.json", "application/json", JSON.stringify(meta, null, 2));
          }}>Metadados CMYK / rastreabilidade</button>
        </div>
      </details>

      <details>
        <summary className="cursor-pointer font-medium">Nuvem — templates & paletas</summary>
        <div className="mt-2 space-y-2">
          <div className="text-[11px] text-muted-foreground">Templates partilhados</div>
          <div className="flex flex-wrap gap-1">
            {SHARED_TEMPLATES.map((t) => (
              <button key={t.id} title={t.preset ? `⌀${t.preset.cordDiameterMm}mm · ${t.preset.sizeMm}mm · ${t.preset.difficulty}` : undefined}
                className="rounded border px-2 py-1"
                onClick={() => {
                  const cx = sheetW / 2, cy = sheetH / 2;
                  const scaled = t.pointsMm.map((p) => ({ x: cx + p.x * pxPerMm, y: cy + p.y * pxPerMm }));
                  setPoints(scaled);
                  if (t.preset?.cordDiameterMm) setCordMm(t.preset.cordDiameterMm);
                  toast.success(`Template "${t.name}" importado.`);
                }}>{t.name}</button>
            ))}
          </div>
          <div className="text-[11px] text-muted-foreground">Paletas de marcas</div>
          {BRAND_PALETTES.map((pal) => (
            <div key={pal.id} className="flex items-center gap-2">
              <div className="min-w-[110px] text-[11px]">{pal.brand}</div>
              {pal.colors.map((c) => (
                <div key={c.hex} title={`${c.name} ${c.hex}`} className="h-5 w-5 rounded border" style={{ background: c.hex }} />
              ))}
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}

function slug(s: string) {
  return s.toLowerCase().normalize("NFKD").replace(/[^\w]+/g, "-").replace(/^-+|-+$/g, "") || "molde";
}

function Metric({ label, value, testid, hint }: { label: string; value: React.ReactNode; testid?: string; hint?: string }) {
  return (
    <div className="rounded bg-muted/40 px-1.5 py-1" title={hint} data-testid={testid}>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-[11px] font-semibold">{value}</div>
    </div>
  );
}

function readLS<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try { const v = window.localStorage.getItem(key); return v ? JSON.parse(v) as T : fallback; } catch { return fallback; }
}
function writeLS(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* noop */ }
}