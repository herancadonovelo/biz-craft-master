import { describe, it, expect } from "vitest";
import { alinharNaPagina, distribuir, moverNaPilha } from "./moodboard-align";

const PAGINA = { w: 595, h: 842 };

describe("alinharNaPagina", () => {
  const r = { id: "a", x: 10, y: 20, w: 100, h: 50 };
  it("alinha à esquerda e à direita", () => {
    expect(alinharNaPagina(r, "esquerda", PAGINA).x).toBe(0);
    expect(alinharNaPagina(r, "direita", PAGINA).x).toBe(495);
  });
  it("centra nos dois eixos", () => {
    expect(alinharNaPagina(r, "centro-h", PAGINA).x).toBe(248);
    expect(alinharNaPagina(r, "centro-v", PAGINA).y).toBe(396);
  });
  it("alinha ao topo e ao fundo", () => {
    expect(alinharNaPagina(r, "topo", PAGINA).y).toBe(0);
    expect(alinharNaPagina(r, "fundo", PAGINA).y).toBe(792);
  });
});

describe("distribuir", () => {
  it("iguala o espaçamento horizontal mantendo extremos", () => {
    const out = distribuir([
      { id: "a", x: 0, y: 0, w: 100, h: 10 },
      { id: "b", x: 150, y: 0, w: 100, h: 10 },
      { id: "c", x: 400, y: 0, w: 100, h: 10 },
    ], "h");
    expect(out).toEqual([{ id: "b", x: 200 }]);
  });
  it("ignora conjuntos com menos de três elementos", () => {
    expect(distribuir([{ id: "a", x: 0, y: 0, w: 1, h: 1 }], "h")).toEqual([]);
  });
});

describe("moverNaPilha", () => {
  it("troca com o vizinho", () => {
    expect(moverNaPilha(["a", "b", "c"], "b", "cima")).toEqual(["a", "c", "b"]);
    expect(moverNaPilha(["a", "b", "c"], "a", "baixo")).toEqual(["a", "b", "c"]);
  });
});
