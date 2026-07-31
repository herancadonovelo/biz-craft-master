import { describe, expect, it } from "vitest";
import {
  MOODBOARD_LAYOUTS, aplicarLayout, grelha, retanguloMarcaAgua, sugerirLayouts,
} from "./moodboard-layouts";

describe("modelos de esteira do moodboard", () => {
  it("disponibiliza 30 modelos com ids únicos", () => {
    expect(MOODBOARD_LAYOUTS).toHaveLength(30);
    expect(new Set(MOODBOARD_LAYOUTS.map((l) => l.id)).size).toBe(30);
  });

  it("cada modelo tem slots suficientes e dentro da folha", () => {
    for (const l of MOODBOARD_LAYOUTS) {
      expect(l.slots.length, l.id).toBeGreaterThanOrEqual(l.capacidade);
      for (const s of l.slots) {
        expect(s.w, l.id).toBeGreaterThan(0);
        expect(s.h, l.id).toBeGreaterThan(0);
        expect(s.x, l.id).toBeGreaterThanOrEqual(0);
        expect(s.y, l.id).toBeGreaterThanOrEqual(0);
        expect(s.x + s.w, l.id).toBeLessThanOrEqual(1.001);
        expect(s.y + s.h, l.id).toBeLessThanOrEqual(1.001);
      }
    }
  });

  it("grelha regular gera cols x rows sem sobreposição vertical", () => {
    const g = grelha(3, 2);
    expect(g).toHaveLength(6);
    expect(g[0].y).toBeLessThan(g[3].y);
  });

  it("sugere primeiro os modelos com capacidade próxima", () => {
    expect(sugerirLayouts(9)[0].capacidade).toBe(9);
    expect(sugerirLayouts(1)[0].capacidade).toBe(1);
  });

  it("aplica o modelo em píxeis da folha A4", () => {
    const rects = aplicarLayout(MOODBOARD_LAYOUTS[0], 1, 595, 842);
    expect(rects).toHaveLength(1);
    expect(rects[0].w).toBeLessThanOrEqual(595);
    expect(rects[0].h).toBeLessThanOrEqual(842);
  });

  it("posiciona a marca de água dentro da folha", () => {
    for (const p of ["inferior-direita", "centro", "superior-esquerda"] as const) {
      const r = retanguloMarcaAgua(p, 595, 842);
      expect(r.x).toBeGreaterThanOrEqual(0);
      expect(r.x + r.w).toBeLessThanOrEqual(595);
      expect(r.y + r.h).toBeLessThanOrEqual(842);
    }
  });
});
