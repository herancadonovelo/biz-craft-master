/**
 * Fase 6: utilitários de exportação que tocam no DOM/canvas (browser-only).
 * A matemática vive em moodboard-export.ts (pura e testada).
 */
import type { Caixa } from "./moodboard-multi";
import type { PlanoExport } from "./moodboard-export";

function carregarImagem(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("imagem inválida"));
    img.src = src;
  });
}

/**
 * Recorta a área pedida de um render completo da folha e reescala para as
 * dimensões finais do plano.
 */
export async function recortarRaster(
  dataUrl: string,
  area: Caixa,
  plano: PlanoExport,
  opcoes: { formato: "png" | "jpeg"; qualidade: number; fundo: string },
): Promise<string> {
  const img = await carregarImagem(dataUrl);
  const escalaOrigem = img.width / Math.max(1, area.x + area.w) >= 0 ? img : img;
  void escalaOrigem;
  const canvas = document.createElement("canvas");
  canvas.width = plano.larguraPx;
  canvas.height = plano.alturaPx;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas indisponível");
  if (opcoes.formato === "jpeg") {
    ctx.fillStyle = opcoes.fundo || "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  const pr = plano.pixelRatio;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, area.x * pr, area.y * pr, area.w * pr, area.h * pr, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL(opcoes.formato === "jpeg" ? "image/jpeg" : "image/png", opcoes.qualidade);
}

/** Descarrega um data URL com o nome indicado. */
export function descarregar(dataUrl: string, nome: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
