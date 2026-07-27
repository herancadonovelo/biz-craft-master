import { describe, it, expect } from "vitest";
import {
  parseCarreira,
  extractDeclaredTotal,
  validateCarreira,
  expandRepetition,
  collectAbreviaturasUsadas,
} from "./math-engine";

describe("parseCarreira", () => {
  it("conta pontos base simples", () => {
    const r = parseCarreira("6 pb");
    expect(r.produz).toBe(6);
    expect(r.usa).toBe(6);
    expect(r.temAnelMagico).toBe(false);
  });

  it("expande aum como produz>1", () => {
    const r = parseCarreira("6 aum");
    expect(r.produz).toBe(12);
    expect(r.usa).toBe(6);
  });

  it("expande blocos [ ... ] x N", () => {
    const r = parseCarreira("[1 pb, 1 aum] x 6");
    expect(r.produz).toBe(18);
    expect(r.usa).toBe(12);
  });

  it("suporta anel mágico 'am'", () => {
    const r = parseCarreira("am 6 pb");
    expect(r.temAnelMagico).toBe(true);
    expect(r.produz).toBe(6);
    expect(r.usa).toBe(0);
  });

  it("marca desconhecidos sem falhar", () => {
    const r = parseCarreira("3 xyz");
    expect(r.desconhecidos.length).toBeGreaterThan(0);
  });

  it("ignora total declarado no fim", () => {
    const r = parseCarreira("6 pb (6)");
    expect(r.produz).toBe(6);
  });
});

describe("extractDeclaredTotal", () => {
  it("lê (N) no fim", () => {
    expect(extractDeclaredTotal("6 pb (12)")).toBe(12);
    expect(extractDeclaredTotal("6 pb")).toBeNull();
  });
});

describe("validateCarreira", () => {
  it("aceita quando usa === previousTotal e declared === produz", () => {
    const v = validateCarreira("[1 pb, 1 aum] x 6 (18)", 12);
    expect(v.usaOk).toBe(true);
    expect(v.totalOk).toBe(true);
  });
  it("aceita anel mágico independente do previousTotal", () => {
    const v = validateCarreira("am 6 pb", 999);
    expect(v.usaOk).toBe(true);
  });
  it("rejeita declared errado", () => {
    const v = validateCarreira("6 pb (10)", 6);
    expect(v.totalOk).toBe(false);
  });
});

describe("expandRepetition", () => {
  it("repete N vezes", () => {
    expect(expandRepetition("1 pb, 1 aum", 3)).toBe("1 pb, 1 aum, 1 pb, 1 aum, 1 pb, 1 aum");
  });
});

describe("collectAbreviaturasUsadas", () => {
  it("devolve pontos únicos usados", () => {
    const abrevs = collectAbreviaturasUsadas(["am 6 pb", "[1 pb, 1 aum] x 6"]);
    const ids = abrevs.map((p) => p.abrev.pt);
    expect(ids).toContain("pb");
    expect(ids).toContain("aum");
  });
});