import * as React from "react";
import { toast } from "sonner";
import {
  chaikin, rdp, yarnEstimateMeters, materialCost, mirror, offsetPolyline,
  centroid, exportGCode, nestRects, textileMetadata, computeA4Tiles,
  type P,
} from "@/lib/tricotin-pro";
import { SHARED_TEMPLATES, BRAND_PALETTES } from "@/lib/cloud-templates";

type Props = {
  getPoints: () => P[];
  setPoints: (pts: P[]) => void;
  pxPerMm: number;
  sheetW: number;
  sheetH: number;
};

export function TricotinProPanel({ getPoints, setPoints, pxPerMm, sheetW, sheetH }: Props) {
  const [cordMm, setCordMm] = React.useState(10);
  const [pricePerM, setPricePerM] = React.useState(0.8);
  const [scaleFactor, setScaleFactor] = React.useState(1);
  const [offsetMm, setOffsetMm] = React.useState(0);
  const [tileCols, setTileCols] = React.useState(2);
  const [tileRows, setTileRows] = React.useState(2);
  const [author, setAuthor] = React.useState("Art Fusion");
  const [designName, setDesignName] = React.useState("Novo Molde");

  const meters = React.useMemo(() => yarnEstimateMeters(getPoints(), pxPerMm), [getPoints, pxPerMm]);
  const cost = React.useMemo(() => materialCost(meters, pricePerM), [meters, pricePerM]);

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
      <div className="font-medium text-sm">Toolbox Pro — Fases 3 a 12</div>

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
          <label>Preço €/m <input type="number" step={0.1} value={pricePerM} onChange={(e) => setPricePerM(+e.target.value)} className="w-full rounded border px-2 py-1" /></label>
          <div className="col-span-2 rounded bg-muted p-2 text-[11px]">
            Lã estimada: <b data-testid="yarn-meters">{meters.toFixed(2)} m</b> · Custo material: <b>{cost.toFixed(2)} €</b>
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
          <button data-testid="export-gcode" className="rounded border px-2 py-1" onClick={() => {
            const pts = getPoints();
            if (!pts.length) return toast.error("Desenha algo primeiro.");
            const g = exportGCode(pts, { pxPerMm });
            downloadText(`${slug(designName)}.gcode`, "text/plain", g);
          }}>Exportar G-Code (CNC)</button>
          <button className="rounded border px-2 py-1" onClick={() => {
            const pts = getPoints();
            const placed = nestRects(
              [{ id: "current", w: 100, h: 100 }, { id: "copy1", w: 80, h: 60 }, { id: "copy2", w: 60, h: 60 }],
              210, 297,
            );
            downloadText("nesting.json", "application/json", JSON.stringify({ pieces: placed, source: pts.length }, null, 2));
          }}>Nesting otimizado (JSON)</button>
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
              <button key={t.id} className="rounded border px-2 py-1"
                onClick={() => {
                  const cx = sheetW / 2, cy = sheetH / 2;
                  const scaled = t.pointsMm.map((p) => ({ x: cx + p.x * pxPerMm, y: cy + p.y * pxPerMm }));
                  setPoints(scaled);
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