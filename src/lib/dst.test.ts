import { describe, it, expect } from "vitest";
import {
  splitSubpaths,
  resample,
  orderNearest,
  buildStitches,
  encodeDst,
  estimateStitches,
  type StitchBlock,
} from "./dst";

describe("splitSubpaths", () => {
  it("separa por 'M'", () => {
    const subs = splitSubpaths("M 0 0 L 10 0 L 10 10 M 20 20 L 30 20");
    expect(subs).toHaveLength(2);
    expect(subs[0]).toHaveLength(3);
    expect(subs[1]).toHaveLength(2);
  });
});

describe("resample", () => {
  it("gera pontos igualmente espaçados", () => {
    const out = resample([{ x: 0, y: 0 }, { x: 10, y: 0 }], 2);
    expect(out.length).toBeGreaterThanOrEqual(5);
    expect(out[0]).toEqual({ x: 0, y: 0 });
    expect(out[out.length - 1].x).toBeCloseTo(10, 1);
  });
  it("devolve original para <2 pontos", () => {
    expect(resample([{ x: 1, y: 1 }], 2)).toEqual([{ x: 1, y: 1 }]);
  });
});

describe("orderNearest", () => {
  it("ordena por proximidade", () => {
    const subs = [
      [{ x: 0, y: 0 }, { x: 1, y: 0 }],
      [{ x: 100, y: 100 }, { x: 101, y: 100 }],
      [{ x: 2, y: 0 }, { x: 3, y: 0 }],
    ];
    const out = orderNearest(subs);
    // o segundo escolhido deve ser o próximo (idx 2), não o longínquo idx 1
    expect(out[1][0].x).toBeLessThan(50);
  });
});

describe("buildStitches", () => {
  const blocks: StitchBlock[] = [
    { color: "#f00", label: "a", points: [{ x: 0, y: 0 }, { x: 5, y: 0 }, { x: 5, y: 5 }] },
    { color: "#0f0", label: "b", points: [{ x: 10, y: 10 }, { x: 12, y: 10 }] },
  ];
  it("acaba com stitch de end", () => {
    const s = buildStitches(blocks, 1);
    expect(s[s.length - 1].end).toBe(true);
  });
  it("insere color change entre blocos", () => {
    const s = buildStitches(blocks, 1);
    expect(s.some((x) => x.colorChange)).toBe(true);
  });
  it("parte deslocamentos > 121 em vários registos jump", () => {
    const big: StitchBlock[] = [{ color: "#f00", label: "j", points: [{ x: 0, y: 0 }, { x: 500, y: 0 }] }];
    const s = buildStitches(big, 1); // 1 px = 10 units DST → 5000/121 ≈ 42 jumps
    expect(s.filter((x) => x.jump).length).toBeGreaterThan(5);
  });
});

describe("encodeDst", () => {
  it("produz Blob com cabeçalho 512 bytes + corpo múltiplo de 3", async () => {
    const blob = encodeDst([{ color: "#f00", label: "t", points: [{ x: 0, y: 0 }, { x: 5, y: 0 }] }], 1);
    const buf = new Uint8Array(await blob.arrayBuffer());
    expect(buf.length).toBeGreaterThan(512);
    expect((buf.length - 512) % 3).toBe(0);
    // header contém "LA:" no início
    expect(String.fromCharCode(...buf.slice(0, 3))).toBe("LA:");
  });
});

describe("estimateStitches", () => {
  it("conta segmentos e color changes", () => {
    const r = estimateStitches(
      [{ color: "#f", label: "a", points: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }] },
       { color: "#g", label: "b", points: [{ x: 10, y: 0 }, { x: 11, y: 0 }] }],
      1, 2,
    );
    expect(r.count).toBe(3);
    expect(r.colorChanges).toBe(1);
    expect(r.stepPx).toBe(2);
  });
});