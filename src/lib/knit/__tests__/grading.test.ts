import { describe, it, expect } from "vitest";
import {
  graduar, formatarParenteses, calcularCava, calcularDecote,
  verificarMultiploComBordas, espacamentoBotoesAvancado,
} from "../grading";

const gauge = { pontos: 20, carreiras: 28, cm: 10 };

describe("grading — auto-grading", () => {
  it("gera as 6 sizes com peito relativo à base", () => {
    const rows = graduar(96, gauge, 1);
    expect(rows).toHaveLength(6);
    expect(rows[0]).toMatchObject({ size: "XS", peitoCm: 86 });
    expect(rows[2]).toMatchObject({ size: "M", peitoCm: 96 });
    expect(rows[5]).toMatchObject({ size: "XXL", peitoCm: 111 });
  });

  it("ajusta as malhas ao múltiplo mais próximo", () => {
    const rows = graduar(96, gauge, 8);
    for (const r of rows) expect(r.malhasAjustadas % 8).toBe(0);
  });
});

describe("grading — formatarParenteses", () => {
  it("formata primeiro sem parênteses e resto entre parênteses", () => {
    expect(formatarParenteses([60, 64, 68, 72])).toBe("60 (64, 68, 72)");
    expect(formatarParenteses([60])).toBe("60");
    expect(formatarParenteses([])).toBe("");
  });
});

describe("grading — múltiplos com bordas", () => {
  it("valida excluindo malhas de borda", () => {
    // 100 malhas totais, 2 bordas por lado → 96 úteis; múltiplo 8 → ok.
    expect(verificarMultiploComBordas(100, 8, 2).ok).toBe(true);
    // 101 → 97 úteis → falha, com sugestões que incluem as bordas.
    const r = verificarMultiploComBordas(101, 8, 2);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.sugestao?.[0]).toBeLessThan(101);
      expect(r.sugestao?.[1]).toBeGreaterThan(101);
    }
  });
});

describe("grading — cava", () => {
  it("total de diminuições é ≥ bind-off e restam malhas para o ombro", () => {
    const out = calcularCava({ malhasPeito: 100, larguraCavaCm: 20, gauge });
    expect(out.bindOffCadaLado).toBeGreaterThan(0);
    expect(out.totalDiminuicoes).toBeGreaterThanOrEqual(out.bindOffCadaLado);
    expect(out.malhasFinaisOmbro).toBe(100 - out.totalDiminuicoes * 2);
    expect(out.passos[0].tipo).toBe("bind-off");
  });
});

describe("grading — decote", () => {
  it("redondo remata mais malhas ao centro do que V", () => {
    const v = calcularDecote({ malhasPeito: 100, tipo: "V", larguraDecoteCm: 18, profundidadeCm: 8, gauge });
    const r = calcularDecote({ malhasPeito: 100, tipo: "redondo", larguraDecoteCm: 18, profundidadeCm: 8, gauge });
    expect(r.malhasCentro).toBeGreaterThan(v.malhasCentro);
  });
});

describe("grading — casas de botão", () => {
  it("respeita margens topo/base", () => {
    const rows = espacamentoBotoesAvancado(100, 5, 10, 10);
    expect(rows[0]).toBeGreaterThanOrEqual(10);
    expect(rows[rows.length - 1]).toBeLessThanOrEqual(90);
    expect(rows).toHaveLength(5);
  });
  it("um botão fica no centro", () => {
    expect(espacamentoBotoesAvancado(100, 1, 0, 0)).toEqual([50]);
  });
});