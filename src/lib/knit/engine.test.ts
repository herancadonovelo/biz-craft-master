import { describe, it, expect } from "vitest";
import {
  emptyChart,
  chartToText,
  malhasPorCarreira,
  malhasParaCm,
  carreirasParaCm,
  escalonar,
  verificarMultiplo,
  espacamentoBotoes,
  validarSimetriaDiminuicoes,
  consumoPorCor,
  detectarFloats,
  inverterCores,
  gerarRaglanTopDown,
  gerarMeia,
  chartToSvg,
  type Chart,
  type Gauge,
} from "./engine";

const gauge: Gauge = { pontos: 22, carreiras: 30, cm: 10 };

describe("emptyChart", () => {
  it("cria uma grelha do tamanho pedido preenchida com meia", () => {
    const c = emptyChart(5, 3);
    expect(c.cols).toBe(5);
    expect(c.rows).toBe(3);
    expect(c.grid).toHaveLength(3);
    expect(c.grid[0]).toHaveLength(5);
    expect(c.grid[0][0].pontoId).toBe("meia");
  });
});

describe("chartToText", () => {
  it("agrupa pontos consecutivos e alterna RS/WS", () => {
    const c = emptyChart(4, 2);
    c.grid[0] = [
      { pontoId: "meia" }, { pontoId: "meia" },
      { pontoId: "liga" }, { pontoId: "liga" },
    ];
    // esconderWS=true → linha WS colapsada
    const linhas = chartToText(c, "pt");
    expect(linhas).toHaveLength(2);
    expect(linhas[0]).toMatch(/C1/);
    expect(linhas[0]).toMatch(/2× liga/);
    expect(linhas[0]).toMatch(/2× meia/);
    expect(linhas[1]).toMatch(/avesso/);
  });

  it("respeita a terminologia us/uk", () => {
    const c = emptyChart(2, 1);
    const linhas = chartToText(c, "us");
    expect(linhas[0]).toMatch(/knit/i);
  });

  it("ignora nostitch na tradução", () => {
    const c = emptyChart(3, 1);
    c.grid[0] = [{ pontoId: "meia" }, { pontoId: "nostitch" }, { pontoId: "meia" }];
    const [linha] = chartToText(c, "pt");
    expect(linha).not.toMatch(/nostitch|sem malha/);
  });
});

describe("matemática de gauge", () => {
  it("malhasParaCm e carreirasParaCm arredondam correctamente", () => {
    expect(malhasParaCm(gauge, 50)).toBe(110); // 22/10 * 50
    expect(carreirasParaCm(gauge, 20)).toBe(60);
  });
  it("devolve 0 quando faltam parâmetros", () => {
    expect(malhasParaCm({ pontos: 0, carreiras: 0, cm: 10 }, 20)).toBe(0);
    expect(carreirasParaCm({ pontos: 10, carreiras: 0, cm: 10 }, 20)).toBe(0);
  });
  it("escalonar soma delta a partir da base", () => {
    expect(escalonar(100, gauge, 5)).toBe(100 + 11);
    expect(escalonar(100, gauge, -5)).toBe(100 - 11);
  });
});

describe("verificarMultiplo", () => {
  it("retorna ok=true quando alinhado", () => {
    expect(verificarMultiplo(48, 8)).toEqual({ ok: true });
  });
  it("sugere valor abaixo e acima quando não alinhado", () => {
    expect(verificarMultiplo(50, 8)).toEqual({ ok: false, sugestao: [48, 56] });
  });
  it("é permissivo com multiplo <= 0", () => {
    expect(verificarMultiplo(10, 0)).toEqual({ ok: true });
  });
});

describe("espacamentoBotoes", () => {
  it("distribui uniformemente", () => {
    const s = espacamentoBotoes(120, 5);
    expect(s).toHaveLength(5);
    expect(s[0]).toBe(20);
    expect(s.at(-1)).toBe(100);
  });
  it("edge cases", () => {
    expect(espacamentoBotoes(0, 5)).toEqual([]);
    expect(espacamentoBotoes(120, 0)).toEqual([]);
  });
});

describe("validarSimetriaDiminuicoes", () => {
  it("aceita ssk no início + k2tog no fim", () => {
    const row = [
      { pontoId: "ssk" }, { pontoId: "meia" }, { pontoId: "meia" }, { pontoId: "k2tog" },
    ];
    expect(validarSimetriaDiminuicoes(row)).toEqual({ ok: true });
  });
  it("detecta assimetria (k2tog nas duas pontas)", () => {
    const row = [
      { pontoId: "k2tog" }, { pontoId: "meia" }, { pontoId: "k2tog" },
    ];
    const v = validarSimetriaDiminuicoes(row);
    expect(v.ok).toBe(false);
    expect(v.msg).toBeTruthy();
  });
});

describe("malhasPorCarreira", () => {
  it("conta pontos consumidos incluindo aumentos (produz>1)", () => {
    const c = emptyChart(3, 1);
    c.grid[0] = [{ pontoId: "meia" }, { pontoId: "kfb" }, { pontoId: "meia" }];
    // kfb produz 2 → total = 4
    expect(malhasPorCarreira(c)).toEqual([4]);
  });
});

describe("colorwork engine helpers", () => {
  const chart: Chart = {
    cols: 4, rows: 2,
    grid: [
      [{ pontoId: "meia", cor: "#000" }, { pontoId: "meia", cor: "#000" }, { pontoId: "meia", cor: "#fff" }, { pontoId: "meia", cor: "#fff" }],
      [{ pontoId: "meia", cor: "#000" }, { pontoId: "meia", cor: "#fff" }, { pontoId: "meia", cor: "#fff" }, { pontoId: "meia", cor: "#fff" }],
    ],
  };

  it("consumoPorCor soma malhas e calcula gramas > 0", () => {
    const c = consumoPorCor(chart, gauge, 50);
    expect(c["#000"].malhas).toBe(3);
    expect(c["#fff"].malhas).toBe(5);
    expect(c["#000"].gramas).toBeGreaterThan(0);
  });

  it("detectarFloats sinaliza corridas maiores que max", () => {
    const f = detectarFloats(chart, 2);
    // linha 0: run de 2 (#000) + run de 2 (#fff) → nenhum > 2
    // linha 1: run de 1 (#000) + run de 3 (#fff) → 1 float
    expect(f).toHaveLength(1);
    expect(f[0]).toMatchObject({ row: 1, length: 3, cor: "#fff" });
  });

  it("inverterCores troca pares e mantém intocadas as restantes", () => {
    const flipped = inverterCores(chart, "#000", "#fff");
    expect(flipped.grid[0][0].cor).toBe("#fff");
    expect(flipped.grid[0][2].cor).toBe("#000");
  });
});

describe("construção helpers", () => {
  it("gerarRaglanTopDown calcula um total coerente", () => {
    const r = gerarRaglanTopDown({ peitoCm: 100, gauge });
    expect(r.totalMalhas).toBe(220);
    expect(r.gola).toBeGreaterThan(0);
    expect(r.manga).toBeGreaterThan(0);
  });
  it("gerarMeia devolve montar/calcanhar/ponte positivos", () => {
    const m = gerarMeia({ peCm: 24, gauge });
    expect(m.montar).toBeGreaterThan(0);
    expect(m.calcanhar * 2).toBeCloseTo(m.montar, 0);
  });
});

describe("chartToSvg", () => {
  it("gera um SVG válido com background e cell rects", () => {
    const svg = chartToSvg(emptyChart(2, 2));
    expect(svg).toMatch(/^<svg /);
    expect(svg).toMatch(/viewBox="0 0 44 44"/);
    expect(svg).toMatch(/<rect/);
    expect(svg).toMatch(/<\/svg>$/);
  });
  it("insere caixa de repeat quando definida", () => {
    const c = emptyChart(4, 2);
    c.repeatCols = { start: 1, end: 2 };
    const svg = chartToSvg(c);
    expect(svg).toMatch(/stroke="#dc2626"/);
  });
});