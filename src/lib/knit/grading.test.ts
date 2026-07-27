import { describe, it, expect } from "vitest";
import {
  graduar,
  formatarParenteses,
  calcularCava,
  calcularDecote,
  validarSimetriaChart,
  verificarMultiploComBordas,
  espacamentoBotoesAvancado,
  malhasProduzidas,
  SIZES_STD,
} from "./grading";
import { emptyChart, type Gauge } from "./engine";

const gauge: Gauge = { pontos: 22, carreiras: 30, cm: 10 };

describe("graduar", () => {
  it("gera uma linha por tamanho standard", () => {
    const rows = graduar(100, gauge, 1);
    expect(rows).toHaveLength(SIZES_STD.length);
    const m = rows.find((r) => r.size === "M")!;
    expect(m.peitoCm).toBe(100);
    expect(m.malhas).toBe(220);
    expect(m.ajuste).toBe(0);
  });
  it("ajusta ao múltiplo mais próximo", () => {
    const rows = graduar(100, gauge, 8);
    for (const r of rows) expect(r.malhasAjustadas % 8).toBe(0);
  });
  it("empate arredonda para cima", () => {
    // multiplo 10, resto = 5 → sobe (5 * 2 >= 10)
    const rows = graduar(100, gauge, 10);
    const m = rows.find((r) => r.size === "M")!;
    expect(m.malhasAjustadas).toBe(220); // já múltiplo
  });
});

describe("formatarParenteses", () => {
  it("formato clássico de padrão profissional", () => {
    expect(formatarParenteses([60, 64, 68, 72, 76, 80])).toBe("60 (64, 68, 72, 76, 80)");
    expect(formatarParenteses([48])).toBe("48");
    expect(formatarParenteses([])).toBe("");
  });
});

describe("calcularCava", () => {
  it("primeiro passo é sempre bind-off na carreira 1", () => {
    const r = calcularCava({ malhasPeito: 100, larguraCavaCm: 18, gauge });
    expect(r.passos[0]).toMatchObject({ carreira: 1, tipo: "bind-off" });
    expect(r.bindOffCadaLado).toBeGreaterThan(0);
    expect(r.malhasFinaisOmbro).toBe(100 - r.totalDiminuicoes * 2);
  });
  it("respeita bindOffInicial passado explicitamente", () => {
    const r = calcularCava({ malhasPeito: 120, larguraCavaCm: 20, gauge, bindOffInicial: 8 });
    expect(r.bindOffCadaLado).toBe(8);
    expect(r.passos[0].malhas).toBe(8);
  });
});

describe("calcularDecote", () => {
  it("decote redondo tem malhas ao centro; V tem 1 malha", () => {
    const red = calcularDecote({ malhasPeito: 100, tipo: "redondo", larguraDecoteCm: 20, profundidadeCm: 8, gauge });
    const v = calcularDecote({ malhasPeito: 100, tipo: "V", larguraDecoteCm: 20, profundidadeCm: 8, gauge });
    expect(red.malhasCentro).toBeGreaterThan(1);
    expect(v.malhasCentro).toBe(1);
    expect(red.diminuicoesPorLado).toBeGreaterThan(0);
    expect(red.passo).toBeGreaterThanOrEqual(1);
  });
});

describe("validarSimetriaChart", () => {
  it("chart limpo não reporta problemas", () => {
    expect(validarSimetriaChart(emptyChart(4, 2))).toEqual({ ok: true, problemas: [] });
  });
  it("detecta linha assimétrica", () => {
    const c = emptyChart(4, 1);
    c.grid[0] = [
      { pontoId: "k2tog" }, { pontoId: "meia" }, { pontoId: "meia" }, { pontoId: "k2tog" },
    ];
    const r = validarSimetriaChart(c);
    expect(r.ok).toBe(false);
    expect(r.problemas[0].row).toBe(1);
  });
});

describe("verificarMultiploComBordas", () => {
  it("desconta as bordas antes de validar o múltiplo", () => {
    // 22 malhas com 2 bordas cada lado → 18, múltiplo de 6 → ok
    expect(verificarMultiploComBordas(22, 6, 2)).toEqual({ ok: true });
  });
  it("devolve sugestão com bordas repostas", () => {
    const r = verificarMultiploComBordas(24, 6, 2);
    if (r.ok) throw new Error("esperava falha");
    expect(r.sugestao?.[0]).toBeLessThan(24);
    expect(r.sugestao?.[1]).toBeGreaterThan(24);
  });
});

describe("espacamentoBotoesAvancado", () => {
  it("um botão → centro", () => {
    expect(espacamentoBotoesAvancado(100, 1, 10, 10)).toEqual([50]);
  });
  it("respeita margens topo/base", () => {
    const s = espacamentoBotoesAvancado(100, 3, 10, 10);
    expect(s[0]).toBe(10);
    expect(s.at(-1)).toBe(90);
  });
  it("edge cases", () => {
    expect(espacamentoBotoesAvancado(100, 0)).toEqual([]);
  });
});

describe("malhasProduzidas", () => {
  it("soma o produz de cada célula", () => {
    const row = [{ pontoId: "meia" }, { pontoId: "kfb" }, { pontoId: "nostitch" }];
    // meia=1 + kfb=2 + nostitch=0 = 3
    expect(malhasProduzidas(row)).toBe(3);
  });
});