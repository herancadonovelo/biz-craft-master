import { describe, it, expect } from "vitest";
import { caixaEnvolvente, alinharConjunto, alternarNaSelecao, limparSelecao } from "./moodboard-multi";

const a = { id: "a", x: 0, y: 0, w: 100, h: 50 };
const b = { id: "b", x: 200, y: 100, w: 50, h: 100 };

describe("moodboard-multi", () => {
  it("calcula a caixa envolvente", () => {
    expect(caixaEnvolvente([a, b])).toEqual({ x: 0, y: 0, w: 250, h: 200 });
    expect(caixaEnvolvente([])).toBeNull();
  });

  it("alinha à esquerda da caixa do conjunto", () => {
    expect(alinharConjunto([a, b], "esquerda")).toEqual([{ id: "a", x: 0 }, { id: "b", x: 0 }]);
  });

  it("alinha à direita e ao fundo", () => {
    expect(alinharConjunto([a, b], "direita")).toEqual([{ id: "a", x: 150 }, { id: "b", x: 200 }]);
    expect(alinharConjunto([a, b], "fundo")).toEqual([{ id: "a", y: 150 }, { id: "b", y: 100 }]);
  });

  it("centra na horizontal e vertical", () => {
    expect(alinharConjunto([a, b], "centro-h")).toEqual([{ id: "a", x: 75 }, { id: "b", x: 100 }]);
    expect(alinharConjunto([a, b], "centro-v")).toEqual([{ id: "a", y: 75 }, { id: "b", y: 50 }]);
  });

  it("não alinha com menos de dois elementos", () => {
    expect(alinharConjunto([a], "esquerda")).toEqual([]);
  });

  it("alterna e limpa seleções", () => {
    expect(alternarNaSelecao(["a"], "b")).toEqual(["a", "b"]);
    expect(alternarNaSelecao(["a", "b"], "a")).toEqual(["b"]);
    expect(limparSelecao(["a", "b"], ["b"])).toEqual(["b"]);
  });
});
