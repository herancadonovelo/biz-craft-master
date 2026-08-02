import { describe, expect, it } from "vitest";
import { filtrarCamadas, ordenarCamadas, normalizarTexto } from "./moodboard-layers";

const els = [
  { id: "a", x: 30, y: 10, zIndex: 1, nome: "Imagem" },
  { id: "b", x: 10, y: 40, zIndex: 3, nome: "Decoração" },
  { id: "c", x: 20, y: 20, zIndex: 2, nome: "Marca de água" },
];
const rot = (e: (typeof els)[number]) => e.nome;

describe("ordenarCamadas", () => {
  it("ordena por pilha descendente por defeito", () => {
    expect(ordenarCamadas(els, "pilha-desc", rot).map((e) => e.id)).toEqual(["b", "c", "a"]);
  });
  it("ordena por pilha ascendente", () => {
    expect(ordenarCamadas(els, "pilha-asc", rot).map((e) => e.id)).toEqual(["a", "c", "b"]);
  });
  it("ordena por posição vertical e horizontal", () => {
    expect(ordenarCamadas(els, "posicao-y", rot).map((e) => e.id)).toEqual(["a", "c", "b"]);
    expect(ordenarCamadas(els, "posicao-x", rot).map((e) => e.id)).toEqual(["b", "c", "a"]);
  });
  it("ordena por nome ignorando acentos", () => {
    expect(ordenarCamadas(els, "nome", rot).map((e) => e.id)).toEqual(["b", "a", "c"]);
  });
  it("não muta a lista original", () => {
    const copia = [...els];
    ordenarCamadas(els, "nome", rot);
    expect(els).toEqual(copia);
  });
});

describe("filtrarCamadas", () => {
  it("devolve tudo com procura vazia", () => {
    expect(filtrarCamadas(els, "  ", rot)).toHaveLength(3);
  });
  it("filtra sem sensibilidade a acentos/maiúsculas", () => {
    expect(filtrarCamadas(els, "decoracao", rot).map((e) => e.id)).toEqual(["b"]);
    expect(filtrarCamadas(els, "MARCA", rot).map((e) => e.id)).toEqual(["c"]);
  });
  it("devolve vazio quando não há correspondência", () => {
    expect(filtrarCamadas(els, "zzz", rot)).toEqual([]);
  });
});

describe("normalizarTexto", () => {
  it("remove acentos e espaços", () => {
    expect(normalizarTexto("  Ámigo ")).toBe("amigo");
  });
});
