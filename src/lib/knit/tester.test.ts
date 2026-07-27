import { describe, it, expect, beforeEach } from "vitest";
import {
  progressKey,
  newProgress,
  loadProgress,
  saveProgress,
  stepRow,
  addNote,
  pctCompleto,
  agregarFeedback,
  encodePackage,
  decodePackage,
  type TesterProgress,
} from "./tester";

// jsdom-like polyfill for localStorage in node env
class MemStorage {
  private m = new Map<string, string>();
  getItem(k: string) { return this.m.get(k) ?? null; }
  setItem(k: string, v: string) { this.m.set(k, v); }
  removeItem(k: string) { this.m.delete(k); }
  clear() { this.m.clear(); }
}

beforeEach(() => {
  // @ts-expect-error attach window/localStorage
  globalThis.window = { localStorage: new MemStorage() };
});

describe("progressKey / newProgress", () => {
  it("chave é prefixada com cbm:knit-tester:", () => {
    expect(progressKey("abc")).toBe("cbm:knit-tester:abc");
  });
  it("newProgress inicia em atual=1", () => {
    const p = newProgress("t", 40);
    expect(p.atual).toBe(1);
    expect(p.totalRows).toBe(40);
    expect(p.notas).toEqual([]);
  });
});

describe("save/load progress", () => {
  it("persiste e recupera do localStorage", () => {
    const p = newProgress("tok", 10, "Ana");
    saveProgress(p);
    const loaded = loadProgress("tok");
    expect(loaded?.autor).toBe("Ana");
    expect(loaded?.totalRows).toBe(10);
  });
  it("loadProgress devolve null se não existe", () => {
    expect(loadProgress("inexistente")).toBeNull();
  });
});

describe("stepRow", () => {
  it("avança e marca concluido quando chega ao topo", () => {
    let p = newProgress("t", 3);
    p = stepRow(p, 1); expect(p.atual).toBe(2);
    p = stepRow(p, 5); expect(p.atual).toBe(3);
    expect(p.concluido).toBe(true);
  });
  it("não desce abaixo de 1", () => {
    const p = stepRow(newProgress("t", 3), -10);
    expect(p.atual).toBe(1);
  });
});

describe("addNote / pctCompleto", () => {
  it("adiciona nota com timestamp", () => {
    const p = addNote(newProgress("t", 10), { row: 3, autor: "x", texto: "erro", tipo: "erro" });
    expect(p.notas).toHaveLength(1);
    expect(p.notas[0].ts).toBeGreaterThan(0);
  });
  it("pctCompleto é 0..100", () => {
    expect(pctCompleto({ ...newProgress("t", 4), atual: 1 })).toBeCloseTo(25, 1);
    expect(pctCompleto({ ...newProgress("t", 4), atual: 4 })).toBe(100);
    expect(pctCompleto({ ...newProgress("t", 0), atual: 0 })).toBe(0);
  });
});

describe("agregarFeedback", () => {
  it("resume várias progressões (concluidos, notas, tamanhos)", () => {
    const base = (over: Partial<TesterProgress>): TesterProgress => ({
      ...newProgress("t", 10), ...over,
    });
    const lista: TesterProgress[] = [
      base({ concluido: true, consumoRealG: 200, tamanhoUsado: "M", notas: [
        { row: 5, autor: "a", texto: "x", tipo: "erro", ts: 1 },
        { row: 5, autor: "a", texto: "y", tipo: "sugestao", ts: 2 },
      ] }),
      base({ concluido: false, consumoRealG: 300, tamanhoUsado: "L", notas: [
        { row: 8, autor: "b", texto: "z", tipo: "erro", ts: 3 },
      ] }),
    ];
    const r = agregarFeedback(lista);
    expect(r.testers).toBe(2);
    expect(r.concluidos).toBe(1);
    expect(r.mediaConsumoG).toBe(250);
    expect(r.notasPorTipo).toEqual({ erro: 2, sugestao: 1, tamanho: 0, consumo: 0 });
    expect(r.notasPorRow[0]).toEqual({ row: 5, count: 2 });
    expect(r.tamanhosUsados).toEqual({ M: 1, L: 1 });
  });
});

describe("encode/decodePackage", () => {
  it("round-trip base64url", () => {
    const payload = { titulo: "Chapéu Fair Isle", cores: ["#000", "#fff"], nº: 42, uni: "malhas/10cm" };
    const token = encodePackage(payload);
    expect(token).not.toMatch(/[+/=]/);
    expect(decodePackage(token)).toEqual(payload);
  });
  it("decodePackage devolve null para lixo", () => {
    expect(decodePackage("!!!")).toBeNull();
  });
});