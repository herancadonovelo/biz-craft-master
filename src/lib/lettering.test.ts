import { describe, it, expect } from "vitest";
import { rdp, motifPath, MOTIF_PRESETS, LETTERING_FONTS, buildAppliqueLayers } from "./lettering";

describe("rdp", () => {
  it("colapsa colineares", () => {
    const pts = [[0, 0], [5, 0], [10, 0]];
    expect(rdp(pts, 0.5)).toEqual([[0, 0], [10, 0]]);
  });
  it("mantém desvio > eps", () => {
    const pts = [[0, 0], [5, 5], [10, 0]];
    expect(rdp(pts, 0.5)).toHaveLength(3);
  });
  it("devolve original quando pequeno ou eps<=0", () => {
    expect(rdp([[0, 0], [1, 1]], 1)).toEqual([[0, 0], [1, 1]]);
    expect(rdp([[0, 0], [5, 5], [10, 0]], 0)).toHaveLength(3);
  });
});

describe("motifPath", () => {
  for (const preset of MOTIF_PRESETS) {
    it(`${preset.id} devolve path fechado`, () => {
      const d = motifPath(preset.id, 50, 50, 20);
      expect(d.startsWith("M ")).toBe(true);
      expect(d.endsWith("Z")).toBe(true);
      expect(d.length).toBeGreaterThan(20);
    });
  }
});

describe("LETTERING_FONTS", () => {
  it("todos os presets têm família e peso", () => {
    for (const f of LETTERING_FONTS) {
      expect(f.family).toBeTruthy();
      expect(f.weight).toBeTruthy();
    }
  });
});

describe("buildAppliqueLayers", () => {
  it("vazio quando não há caminhos", () => {
    expect(buildAppliqueLayers([], "#000")).toEqual([]);
  });
  it("gera 3 passes (colocar/fixar/cobrir)", () => {
    const layers = buildAppliqueLayers(["M 0 0 L 10 0 L 10 10 Z"], "#abc");
    expect(layers).toHaveLength(3);
    expect(layers.map((l) => l.stitch)).toEqual(["running", "running", "satin"]);
    expect(layers[2].color).toBe("#abc");
  });
});