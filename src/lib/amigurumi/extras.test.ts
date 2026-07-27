import { describe, it, expect } from "vitest";
import {
  recomendarAgulhaMM,
  pontosEsferaParaDiametro,
  escalaPorAgulha,
  parseTapestryGrid,
  grannyLayout,
  validarAgulhaFio,
  consumoCabelo,
  metrosDeFio,
} from "./extras";

describe("recomendarAgulhaMM", () => {
  it("faixas típicas", () => {
    expect(recomendarAgulhaMM(0).min).toBe(0);
    expect(recomendarAgulhaMM(25).max).toBe(2.0);
    expect(recomendarAgulhaMM(80)).toMatchObject({ min: 2.5, max: 3.5 });
    expect(recomendarAgulhaMM(200).min).toBe(5.0);
  });
});

describe("pontosEsferaParaDiametro", () => {
  it("aplica circunferência π·d", () => {
    // tensao 20/10 * π * 10 = 20π ≈ 63
    expect(pontosEsferaParaDiametro(10, 20)).toBe(Math.round(20 * Math.PI));
  });
  it("0 quando falta input", () => {
    expect(pontosEsferaParaDiametro(0, 20)).toBe(0);
    expect(pontosEsferaParaDiametro(10, 0)).toBe(0);
  });
});

describe("escalaPorAgulha", () => {
  it("dobra quando agulha nova é metade", () => {
    expect(escalaPorAgulha(60, 4, 2)).toBe(120);
  });
  it("devolve original se input incompleto", () => {
    expect(escalaPorAgulha(60, 0, 3)).toBe(60);
  });
});

describe("parseTapestryGrid", () => {
  it("cria matriz de caracteres", () => {
    expect(parseTapestryGrid("AB\nCD")).toEqual([["A","B"],["C","D"]]);
  });
  it("ignora linhas vazias", () => {
    expect(parseTapestryGrid("A\n\nB")).toEqual([["A"],["B"]]);
  });
});

describe("grannyLayout", () => {
  it("aplica fórmula 4·N·3 + 4·3", () => {
    expect(grannyLayout(5)).toEqual({ lados: 4, ptsPorCanto: 3, total: 4 * 5 * 3 + 12 });
  });
});

describe("validarAgulhaFio", () => {
  it("ok quando dentro da faixa", () => {
    expect(validarAgulhaFio(3, 80).ok).toBe(true);
  });
  it("erro pequena", () => {
    const v = validarAgulhaFio(1, 80);
    expect(v.ok).toBe(false);
    expect(v.msg).toMatch(/pequena/);
  });
  it("erro grande", () => {
    const v = validarAgulhaFio(6, 80);
    expect(v.ok).toBe(false);
    expect(v.msg).toMatch(/grande/);
  });
});

describe("consumoCabelo & metrosDeFio", () => {
  it("consumoCabelo em metros", () => {
    expect(consumoCabelo(50, 20)).toBe(10);
  });
  it("metrosDeFio", () => {
    expect(metrosDeFio(50, 50)).toBe(100);
    expect(metrosDeFio(0, 50)).toBe(0);
  });
});