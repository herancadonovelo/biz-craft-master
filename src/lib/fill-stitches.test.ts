import { describe, it, expect } from "vitest";
import { polygonsFromPath, generateFill, estimateFillStitches, type FillOptions } from "./fill-stitches";

const SQUARE = "M 0 0 L 100 0 L 100 100 L 0 100 Z";

const OPTS: FillOptions = {
  mode: "tatami", angleDeg: 0, spacingPx: 10, stitchPx: 5, stagger: 0.5,
  pullCompensationPx: 0, underlay: 0, underlayInsetPx: 2,
};

describe("polygonsFromPath", () => {
  it("extrai só sub-paths fechados (Z)", () => {
    expect(polygonsFromPath(SQUARE)).toHaveLength(1);
    expect(polygonsFromPath("M 0 0 L 10 0")).toHaveLength(0);
  });
});

describe("generateFill", () => {
  it("devolve path com múltiplos sub-M para o quadrado", () => {
    const d = generateFill(SQUARE, OPTS);
    expect(d).toMatch(/^M /);
    expect((d.match(/M /g) ?? []).length).toBeGreaterThan(3);
  });
  it("satin gera segmentos simples", () => {
    const d = generateFill(SQUARE, { ...OPTS, mode: "satin" });
    expect(d.length).toBeGreaterThan(0);
  });
  it("underlay=2 aumenta pontos", () => {
    const semUnd = estimateFillStitches(SQUARE, OPTS);
    const comUnd = estimateFillStitches(SQUARE, { ...OPTS, underlay: 2 });
    expect(comUnd).toBeGreaterThan(semUnd);
  });
  it("path sem polígonos → ''", () => {
    expect(generateFill("M 0 0 L 10 10", OPTS)).toBe("");
  });
});

describe("estimateFillStitches", () => {
  it("conta > 0 pontos em polígono válido", () => {
    expect(estimateFillStitches(SQUARE, OPTS)).toBeGreaterThan(0);
  });
  it("0 quando não há polígonos", () => {
    expect(estimateFillStitches("M 0 0", OPTS)).toBe(0);
  });
});