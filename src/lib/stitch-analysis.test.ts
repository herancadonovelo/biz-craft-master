import { describe, it, expect } from "vitest";
import { buildDensityGrid, analyzeQuality, heatColor } from "./stitch-analysis";
import type { StitchBlock } from "./dst";

const bounds = { x0: 0, y0: 0, w: 100, h: 100 };

describe("buildDensityGrid", () => {
  it("acumula por célula e track max", () => {
    const blocks: StitchBlock[] = [{
      color: "#f", label: "a",
      points: Array.from({ length: 10 }, () => ({ x: 5, y: 5 })),
    }];
    const g = buildDensityGrid(blocks, bounds, 10);
    expect(g.cols).toBe(10);
    expect(g.rows).toBe(10);
    expect(g.max).toBe(10);
    expect(g.data[0]).toBe(10);
  });
  it("ignora pontos fora de bounds", () => {
    const g = buildDensityGrid([{ color: "#f", label: "a", points: [{ x: 999, y: 999 }] }], bounds, 10);
    expect(g.max).toBe(0);
  });
});

describe("analyzeQuality", () => {
  it("classifica pontos curtos e longos", () => {
    const blocks: StitchBlock[] = [{
      color: "#f", label: "a",
      points: [{ x: 0, y: 0 }, { x: 0.1, y: 0 }, { x: 30, y: 0 }],
    }];
    const r = analyzeQuality(blocks, 1);
    expect(r.shortStitches).toBe(1);
    expect(r.longStitches).toBe(1);
    expect(r.totalPoints).toBe(3);
    expect(r.warnings.some((w) => /partir a agulha/.test(w))).toBe(true);
  });
  it("conta jumps entre blocos", () => {
    const r = analyzeQuality([
      { color: "#a", label: "1", points: [{ x: 0, y: 0 }, { x: 5, y: 0 }] },
      { color: "#b", label: "2", points: [{ x: 100, y: 0 }, { x: 105, y: 0 }] },
    ], 1);
    expect(r.colorChanges).toBe(1);
    expect(r.jumps.longestMm).toBeGreaterThan(0);
  });
  it("hotspots vindos do grid", () => {
    const blocks: StitchBlock[] = [{
      color: "#f", label: "a",
      points: Array.from({ length: 30 }, () => ({ x: 5, y: 5 })),
    }];
    const grid = buildDensityGrid(blocks, bounds, 10);
    const r = analyzeQuality(blocks, 1, { grid, hotspotThreshold: 25 });
    expect(r.densityHotspots).toBeGreaterThan(0);
  });
});

describe("heatColor", () => {
  it("t=0 azul, t=1 vermelho", () => {
    expect(heatColor(0)).toMatch(/hsl\(220/);
    expect(heatColor(1)).toMatch(/hsl\(0/);
  });
  it("clamp fora de [0,1]", () => {
    expect(heatColor(-1)).toMatch(/hsl\(220/);
    expect(heatColor(2)).toMatch(/hsl\(0/);
  });
});