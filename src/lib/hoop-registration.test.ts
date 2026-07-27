import { describe, it, expect } from "vitest";
import { splitByHoopWithRegistration, buildRehoopGuideSvg } from "./hoop-registration";
import type { StitchBlock } from "./dst";

function grid(w = 400, h = 300, step = 10): StitchBlock {
  const points: { x: number; y: number }[] = [];
  for (let y = 0; y < h; y += step) for (let x = 0; x < w; x += step) points.push({ x, y });
  return { color: "#0af", label: "g", points };
}

describe("splitByHoopWithRegistration", () => {
  it("vazio quando não há blocos", () => {
    expect(splitByHoopWithRegistration([], { hoopWpx: 200, hoopHpx: 200, overlapPx: 20, marginPx: 10 })).toEqual([]);
  });
  it("divide em vários tiles com marcas de registo", () => {
    const tiles = splitByHoopWithRegistration([grid(400, 300, 20)], {
      hoopWpx: 200, hoopHpx: 200, overlapPx: 20, marginPx: 10,
    });
    expect(tiles.length).toBeGreaterThan(1);
    const anyMarks = tiles.some((t) => t.registrationMarks.length > 0);
    expect(anyMarks).toBe(true);
    // último bloco de cada tile com marcas deve ter cor de registo
    const withMarks = tiles.find((t) => t.registrationMarks.length > 0)!;
    expect(withMarks.blocks[withMarks.blocks.length - 1].label).toBe("registo");
  });
  it("coords locais nunca excedem tamanho do bastidor", () => {
    const tiles = splitByHoopWithRegistration([grid(400, 300, 25)], {
      hoopWpx: 200, hoopHpx: 200, overlapPx: 20, marginPx: 10,
    });
    for (const t of tiles) for (const b of t.blocks) for (const p of b.points) {
      expect(p.x).toBeLessThanOrEqual(220);
      expect(p.y).toBeLessThanOrEqual(220);
    }
  });
});

describe("buildRehoopGuideSvg", () => {
  it("string vazia sem tiles", () => {
    expect(buildRehoopGuideSvg([], { hoopWpx: 200, hoopHpx: 200, overlapPx: 10, marginPx: 5, pageWpx: 800, pageHpx: 600 })).toBe("");
  });
  it("SVG contém numeração e cores de marca", () => {
    const tiles = splitByHoopWithRegistration([grid(400, 300, 25)], {
      hoopWpx: 200, hoopHpx: 200, overlapPx: 20, marginPx: 10,
    });
    const svg = buildRehoopGuideSvg(tiles, {
      hoopWpx: 200, hoopHpx: 200, overlapPx: 20, marginPx: 10, pageWpx: 800, pageHpx: 600,
    });
    expect(svg).toMatch(/<svg /);
    expect(svg).toMatch(/#1/);
    expect(svg).toMatch(/#ff2d55/);
  });
});