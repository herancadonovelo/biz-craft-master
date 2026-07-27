import { describe, it, expect } from "vitest";
import {
  gerarRaglanTopDown,
  gerarMeia,
  recomendarAgulha,
  addMarcador,
  removerMarcador,
  distribuirMarcadores,
} from "./construction";
import type { Gauge } from "./engine";

const gauge: Gauge = { pontos: 22, carreiras: 30, cm: 10 };

describe("gerarRaglanTopDown", () => {
  it("devolve valores positivos e schedule com pelo menos 3 passos", () => {
    const r = gerarRaglanTopDown({ peitoCm: 100, gauge });
    expect(r.totalMalhas).toBeGreaterThan(0);
    expect(r.gola).toBeGreaterThanOrEqual(60);
    expect(r.raglan).toBe(2);
    expect(r.corpo).toBeGreaterThan(0);
    expect(r.manga).toBeGreaterThan(0);
    expect(r.schedule.length).toBeGreaterThanOrEqual(3);
  });
  it("ease aumenta o total de malhas", () => {
    const a = gerarRaglanTopDown({ peitoCm: 100, gauge, ease: 0 });
    const b = gerarRaglanTopDown({ peitoCm: 100, gauge, ease: 10 });
    expect(b.totalMalhas).toBeGreaterThan(a.totalMalhas);
  });
});

describe("gerarMeia", () => {
  it("cuff-down: schedule menciona kitchener", () => {
    const m = gerarMeia({ peCm: 24, gauge, metodo: "cuff-down" });
    expect(m.metodo).toBe("cuff-down");
    expect(m.schedule.some((s) => /kitchener/i.test(s))).toBe(true);
  });
  it("toe-up: schedule menciona Judy", () => {
    const m = gerarMeia({ peCm: 24, gauge, metodo: "toe-up" });
    expect(m.schedule.some((s) => /Judy/i.test(s))).toBe(true);
  });
  it("mínimo de 24 malhas ao montar", () => {
    const m = gerarMeia({ peCm: 4, gauge });
    expect(m.montar).toBeGreaterThanOrEqual(24);
  });
});

describe("recomendarAgulha", () => {
  it("reta quando circular=false", () => {
    expect(recomendarAgulha(100, false).tipo).toBe("reta");
  });
  it("faixas circulares", () => {
    expect(recomendarAgulha(15, true).tipo).toBe("dpn");
    expect(recomendarAgulha(30, true)).toMatchObject({ tipo: "circular", comprimentoCm: 40 });
    expect(recomendarAgulha(60, true)).toMatchObject({ tipo: "circular", comprimentoCm: 60 });
    expect(recomendarAgulha(120, true)).toMatchObject({ tipo: "circular", comprimentoCm: 100 });
  });
});

describe("marcadores", () => {
  it("addMarcador mantém a lista ordenada por posição", () => {
    let l = addMarcador([], 10);
    l = addMarcador(l, 3);
    l = addMarcador(l, 7);
    expect(l.map((m) => m.posicao)).toEqual([3, 7, 10]);
  });
  it("removerMarcador remove por id", () => {
    const l = addMarcador([], 5);
    expect(removerMarcador(l, l[0].id)).toEqual([]);
  });
  it("distribuirMarcadores devolve N posições uniformes", () => {
    const d = distribuirMarcadores(80, 4);
    expect(d).toHaveLength(4);
    expect(d[0].posicao).toBe(0);
    expect(d[1].posicao).toBe(20);
    expect(d[3].posicao).toBe(60);
    expect(d[0].nota).toBe("início");
  });
  it("edge cases", () => {
    expect(distribuirMarcadores(0, 4)).toEqual([]);
    expect(distribuirMarcadores(80, 0)).toEqual([]);
  });
});