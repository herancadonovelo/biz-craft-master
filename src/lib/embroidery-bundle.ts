/**
 * Fase 14 — Bundle de exportação de bordado (.zip)
 *
 * Empacota, num único ficheiro, todos os formatos gerados pelas fases
 * anteriores: DST (Tajima), PES (Brother v1), EXP (Melco), JSON do
 * projeto (.cbmbord), PDF de padrão e um README com metadados.
 * Assim o utilizador entrega uma pasta única ao bordador ou cliente.
 */
import JSZip from "jszip";
import { encodeDst, type StitchBlock } from "./dst";
import { encodePes } from "./pes";
import { encodeExp } from "./exp";

export interface BundleInput {
  slug: string;
  blocks: StitchBlock[];
  pxPerMm: number;
  projectJson: string;   // texto já serializado (.cbmbord.json)
  patternPdf?: Uint8Array;
  readme?: string;
}

export interface BundleStats {
  files: string[];
  totalStitches: number;
  totalColors: number;
  sizeKb: number;
}

export async function buildEmbroideryBundle(inp: BundleInput): Promise<{ blob: Blob; stats: BundleStats }> {
  const zip = new JSZip();
  const slug = (inp.slug || "bordado").replace(/[^a-z0-9\-_]/gi, "_");

  const dst = encodeDst(inp.blocks, inp.pxPerMm, slug.toUpperCase().slice(0, 16));
  const pes = encodePes(inp.blocks, inp.pxPerMm, slug.toUpperCase().slice(0, 8));
  const exp = encodeExp(inp.blocks, inp.pxPerMm);

  zip.file(`${slug}.dst`, await dst.arrayBuffer());
  zip.file(`${slug}.pes`, await pes.arrayBuffer());
  zip.file(`${slug}.exp`, await exp.arrayBuffer());
  zip.file(`${slug}.cbmbord.json`, inp.projectJson);
  if (inp.patternPdf) zip.file(`${slug}-padrao.pdf`, inp.patternPdf);

  const totalStitches = inp.blocks.reduce((s, b) => s + b.points.length, 0);
  const totalColors = inp.blocks.length;
  const readme =
    inp.readme ??
    [
      `# Bundle de bordado — ${slug}`,
      `Gerado em ${new Date().toISOString()}`,
      ``,
      `Pontos totais: ${totalStitches.toLocaleString()}`,
      `Cores: ${totalColors}`,
      ``,
      `## Ficheiros`,
      `- ${slug}.dst — Tajima (compatibilidade universal)`,
      `- ${slug}.pes — Brother / Babylock`,
      `- ${slug}.exp — Melco / Bernina`,
      `- ${slug}.cbmbord.json — projeto editável no CBM`,
      inp.patternPdf ? `- ${slug}-padrao.pdf — folha de padrão / lista DMC` : ``,
    ]
      .filter(Boolean)
      .join("\n");
  zip.file("README.md", readme);

  const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
  const files = Object.keys(zip.files);
  return {
    blob,
    stats: { files, totalStitches, totalColors, sizeKb: Math.round(blob.size / 1024) },
  };
}

export function downloadBundle(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}