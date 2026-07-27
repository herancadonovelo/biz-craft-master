import { describe, it, expect } from "vitest";
import {
  consumoAvancado,
  estatisticasFloats,
  contrastRatio,
  trocarCores,
  aplicarCorFundo,
  pixelArtFromMatrix,
  coresDominantes,
} from "./colorwork";
import { emptyChart, type Chart, type Gauge } from "./engine";

const gauge: Gauge = { pontos: 22, carreiras: 30, cm: 10 };

function chartFromMatrix(matriz: string[][]): Chart {
  const rows = matriz.length;
  const cols = matriz[0]?.length ?? 0;
  const c = emptyChart(cols, rows);
  c.grid = matriz.map((row) => row.map((cor) => ({ pontoId: "meia", cor })));
  return c;
}

describe("consumoAvancado", () => {
  it("ordena por nº de malhas e devolve novelos >= 1", () => {
    const c = chartFromMatrix([
      ["#000", "#000", "#fff"],
      ["#000", "#fff", "#fff"],
    ]);
    const linhas = consumoAvancado(c, gauge);
    expect(linhas).toHaveLength(2);
    expect(linhas[0].malhas).toBeGreaterThanOrEqual(linhas[1].malhas);
    for (const l of linhas) {
      expect(l.novelos).toBeGreaterThanOrEqual(1);
      expect(l.metros).toBeGreaterThan(0);
      expect(l.gramas).toBeGreaterThan(0);
    }
  });

  it("aplica floatMultiplier apenas às cores minoritárias", () => {
    const c = chartFromMatrix([
      ["#000", "#000", "#000", "#000"],
      ["#000", "#000", "#000", "#fff"],
    ]);
    const semFloat = consumoAvancado(c, gauge, { floatMultiplier: 1 });
    const comFloat = consumoAvancado(c, gauge, { floatMultiplier: 3 });
    const branco = (arr: typeof semFloat) => arr.find((l) => l.cor === "#fff")!;
    const preto = (arr: typeof semFloat) => arr.find((l) => l.cor === "#000")!;
    // cor dominante não muda
    expect(preto(comFloat).metros).toBeCloseTo(preto(semFloat).metros, 5);
    // cor minoritária cresce com o multiplier
    expect(branco(comFloat).metros).toBeGreaterThan(branco(semFloat).metros);
  });
});

describe("estatisticasFloats", () => {
  it("resume total, pior e média por cor", () => {
    const c = chartFromMatrix([
      ["#000", "#000", "#000", "#000", "#000", "#fff"],
      ["#fff", "#fff", "#fff", "#fff", "#fff", "#000"],
    ]);
    const s = estatisticasFloats(c, 3);
    expect(s.total).toBe(2);
    expect(s.pior).toBeGreaterThanOrEqual(5);
    expect(s.porCor["#000"]).toBe(1);
    expect(s.porCor["#fff"]).toBe(1);
  });
});

describe("contrastRatio (WCAG)", () => {
  it("preto vs branco ≈ 21", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 0);
  });
  it("é simétrico e >= 1 para cores iguais", () => {
    expect(contrastRatio("#123456", "#654321")).toBe(contrastRatio("#654321", "#123456"));
    expect(contrastRatio("#abcdef", "#abcdef")).toBe(1);
  });
  it("aceita hex de 3 dígitos", () => {
    expect(contrastRatio("#000", "#fff")).toBeGreaterThan(20);
  });
});

describe("operações de chart", () => {
  it("trocarCores é imutável e troca as duas cores", () => {
    const c = chartFromMatrix([["#a", "#b"]]);
    const t = trocarCores(c, "#a", "#b");
    expect(c.grid[0][0].cor).toBe("#a");
    expect(t.grid[0][0].cor).toBe("#b");
    expect(t.grid[0][1].cor).toBe("#a");
  });

  it("aplicarCorFundo só preenche células sem cor", () => {
    const c = emptyChart(2, 1);
    c.grid[0][0].cor = "#f00";
    const bg = aplicarCorFundo(c, "#000");
    expect(bg.grid[0][0].cor).toBe("#f00");
    expect(bg.grid[0][1].cor).toBe("#000");
  });

  it("pixelArtFromMatrix aplica pixels na grelha existente", () => {
    const c = emptyChart(3, 2);
    const painted = pixelArtFromMatrix(c, [["#111", "", "#222"], ["", "#333", ""]]);
    expect(painted.grid[0][0].cor).toBe("#111");
    expect(painted.grid[0][1].cor).toBeUndefined();
    expect(painted.grid[1][1].cor).toBe("#333");
  });

  it("coresDominantes devolve top-N por frequência", () => {
    const c = chartFromMatrix([
      ["#a", "#a", "#b"],
      ["#a", "#b", "#c"],
    ]);
    expect(coresDominantes(c, 2)).toEqual(["#a", "#b"]);
    expect(coresDominantes(c, 5)).toEqual(["#a", "#b", "#c"]);
  });
});