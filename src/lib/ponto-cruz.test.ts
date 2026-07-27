import { describe, it, expect } from "vitest";
import {
  emptyChart,
  hexToRgb,
  rgbToHex,
  blend,
  dist,
  floodFill,
  mirror,
  replaceColor,
  chartStats,
  fabricSizeCm,
  chartToJson,
  jsonToChart,
  chartToOxs,
  type Cell,
} from "./ponto-cruz";

describe("cor helpers", () => {
  it("hexToRgb / rgbToHex round-trip", () => {
    expect(rgbToHex(255, 0, 128)).toBe("#ff0080");
    expect(hexToRgb("#ff0080")).toEqual({ r: 255, g: 0, b: 128 });
  });
  it("blend faz média", () => {
    expect(blend("#000000", "#ffffff")).toBe("#808080");
  });
  it("dist é 0 para iguais e >0 caso contrário", () => {
    expect(dist("#000000", "#000000")).toBe(0);
    expect(dist("#000000", "#ffffff")).toBeGreaterThan(0);
  });
});

describe("grid ops", () => {
  const seed = (): Record<string, Cell> => ({
    "0,0": { hex: "#ff0000", type: "full" },
    "0,1": { hex: "#ff0000", type: "full" },
    "1,0": { hex: "#ff0000", type: "full" },
    "2,2": { hex: "#00ff00", type: "full" },
  });

  it("floodFill substitui região conexa", () => {
    const out = floodFill(seed(), 4, 4, 0, 0, "#0000ff");
    expect(out["0,0"].hex).toBe("#0000ff");
    expect(out["1,0"].hex).toBe("#0000ff");
    expect(out["2,2"].hex).toBe("#00ff00");
  });

  it("mirror horizontal reposiciona", () => {
    const out = mirror({ "0,0": { hex: "#f00", type: "full" } }, 4, 4, "h");
    expect(out["0,3"]).toBeTruthy();
  });

  it("replaceColor troca globalmente", () => {
    const out = replaceColor(seed(), "#ff0000", "#123456");
    expect(out["0,0"].hex).toBe("#123456");
    expect(out["2,2"].hex).toBe("#00ff00");
  });
});

describe("chartStats", () => {
  it("agrega full/half/knots/backstitch e ordena por uso", () => {
    const c = emptyChart(10, 10);
    c.cells = {
      "0,0": { hex: "#ff0000", type: "full" },
      "0,1": { hex: "#ff0000", type: "full" },
      "0,2": { hex: "#00ff00", type: "half-tl" },
    };
    c.knots = [{ r: 0, c: 0, hex: "#ff0000" }];
    c.back = [{ r1: 0, c1: 0, r2: 0, c2: 3, hex: "#00ff00" }];
    const stats = chartStats(c);
    expect(stats[0].hex).toBe("#ff0000");
    expect(stats[0].full).toBe(2);
    expect(stats[0].knots).toBe(1);
    const green = stats.find((s) => s.hex === "#00ff00")!;
    expect(green.backstitchLen).toBeGreaterThan(0);
    expect(green.meadas).toBeGreaterThanOrEqual(1);
  });
});

describe("fabricSizeCm", () => {
  it("Aida 14 → cm", () => {
    const { w, h } = fabricSizeCm(140, 140, 14);
    expect(w).toBeCloseTo(25.4, 2);
    expect(h).toBeCloseTo(25.4, 2);
  });
});

describe("JSON round-trip + OXS export", () => {
  it("chartToJson / jsonToChart preservam", () => {
    const c = emptyChart(5, 5);
    c.cells["1,1"] = { hex: "#abc123", type: "full" };
    const back = jsonToChart(chartToJson(c));
    expect(back.cells["1,1"].hex).toBe("#abc123");
  });
  it("jsonToChart rejeita versão inválida", () => {
    expect(() => jsonToChart(JSON.stringify({ version: 999 }))).toThrow();
  });
  it("chartToOxs emite XML com paleta e stitches", () => {
    const c = emptyChart(3, 3);
    c.cells["0,0"] = { hex: "#ff0000", type: "full" };
    const xml = chartToOxs(c, "T");
    expect(xml).toMatch(/<\?xml/);
    expect(xml).toMatch(/<stitch /);
    expect(xml).toMatch(/palette_item/);
  });
});