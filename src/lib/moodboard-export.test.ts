import { describe, expect, it } from "vitest";
import {
  areaExportacao, nomeFicheiro, planoExport, presetPorId, qualidadeJpeg, recortarSvgDataUrl,
} from "./moodboard-export";

const folha = { largura: 595, altura: 842 };

describe("areaExportacao", () => {
  it("devolve a folha inteira sem seleção", () => {
    expect(areaExportacao(folha, null)).toEqual({ x: 0, y: 0, w: 595, h: 842 });
  });
  it("acrescenta margem à seleção", () => {
    expect(areaExportacao(folha, { x: 100, y: 100, w: 200, h: 100 }, 10))
      .toEqual({ x: 90, y: 90, w: 220, h: 120 });
  });
  it("recorta aos limites da folha", () => {
    const a = areaExportacao(folha, { x: 0, y: 800, w: 595, h: 100 }, 20);
    expect(a).toEqual({ x: 0, y: 780, w: 595, h: 62 });
  });
});

describe("planoExport", () => {
  it("mantém a área a 72 dpi no preset original", () => {
    const p = planoExport({ x: 0, y: 0, w: 595, h: 842 }, presetPorId("original"), 72);
    expect(p).toMatchObject({ larguraPx: 595, alturaPx: 842, pixelRatio: 1 });
  });
  it("duplica em 150 dpi (aprox.)", () => {
    const p = planoExport({ x: 0, y: 0, w: 100, h: 100 }, presetPorId("original"), 144);
    expect(p.pixelRatio).toBe(2);
    expect(p.larguraPx).toBe(200);
  });
  it("ajusta ao preset mantendo a proporção", () => {
    const p = planoExport({ x: 0, y: 0, w: 595, h: 842 }, presetPorId("quadrado"), 72);
    expect(p.larguraPt).toBe(763);
    expect(p.alturaPt).toBe(1080);
  });
  it("limita o lado máximo em pixéis", () => {
    const p = planoExport({ x: 0, y: 0, w: 595, h: 842 }, presetPorId("story"), 1200);
    expect(Math.max(p.larguraPx, p.alturaPx)).toBeLessThanOrEqual(12000);
  });
});

describe("auxiliares", () => {
  it("converte a qualidade", () => {
    expect(qualidadeJpeg(92)).toBeCloseTo(0.92);
    expect(qualidadeJpeg(0)).toBe(0.1);
    expect(qualidadeJpeg(500)).toBe(1);
  });
  it("gera nomes de ficheiro seguros", () => {
    expect(nomeFicheiro("Coleção Primavera", "png")).toBe("colecao-primavera.png");
    expect(nomeFicheiro("Coleção Primavera", "jpeg", true)).toBe("colecao-primavera-selecao.jpg");
    expect(nomeFicheiro("", "pdf")).toBe("moodboard.pdf");
  });
  it("reenquadra o SVG com viewBox da área", () => {
    const inner = "data:image/svg+xml;charset=utf-8," + encodeURIComponent("<svg><rect/></svg>");
    const out = decodeURIComponent(recortarSvgDataUrl(inner, { x: 10, y: 20, w: 30, h: 40 }, { w: 60, h: 80 }).split(",")[1]);
    expect(out).toContain('viewBox="10 20 30 40"');
    expect(out).toContain('width="60"');
    expect(out).toContain("<rect/>");
  });
});
