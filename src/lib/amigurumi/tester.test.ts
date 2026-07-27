import { describe, it, expect, beforeEach, vi } from "vitest";

class MemStorage {
  store = new Map<string, string>();
  getItem(k: string) { return this.store.get(k) ?? null; }
  setItem(k: string, v: string) { this.store.set(k, v); }
  removeItem(k: string) { this.store.delete(k); }
  clear() { this.store.clear(); }
  key(i: number) { return Array.from(this.store.keys())[i] ?? null; }
  get length() { return this.store.size; }
}

beforeEach(() => {
  const ls = new MemStorage();
  vi.stubGlobal("window", {
    localStorage: ls,
    location: { origin: "https://example.com" },
    btoa: (s: string) => Buffer.from(s, "binary").toString("base64"),
    atob: (s: string) => Buffer.from(s, "base64").toString("binary"),
  });
});

describe("amigurumi tester (localStorage)", async () => {
  const t = await import("./tester");

  it("gera tokens distintos", () => {
    expect(t.gerarToken()).not.toBe(t.gerarToken());
  });

  it("save/load pacote round-trip", () => {
    const p = { token: "abc", titulo: "T", autor: "A", criadoEm: 1, estado: { foo: 1 } };
    t.savePacote(p);
    expect(t.loadPacote("abc")).toEqual(p);
  });

  it("loadPacote recupera do hash quando não há localStorage", () => {
    const p = { token: "x", titulo: "T", autor: "A", criadoEm: 1, estado: { n: 42 } };
    const url = t.buildShareUrl(p);
    const hash = url.split("#d=")[1];
    expect(t.loadPacote("x", hash)?.estado).toEqual({ n: 42 });
  });

  it("adiciona, alterna e remove comentários", () => {
    const c = t.addComentario("tk", { pecaId: "p1", carreiraIndex: 2, autor: "me", texto: "olá" });
    expect(t.listComentarios("tk")).toHaveLength(1);
    t.toggleResolvido("tk", c.id);
    expect(t.listComentarios("tk")[0].resolvido).toBe(true);
    t.removerComentario("tk", c.id);
    expect(t.listComentarios("tk")).toHaveLength(0);
  });

  it("import/export JSON deduplica por id", () => {
    const a = t.addComentario("tk", { pecaId: "p", carreiraIndex: 0, autor: "x", texto: "a" });
    const json = t.exportComentariosJSON("tk");
    const n = t.importComentariosJSON("tk", json);
    expect(n).toBe(1);
    expect(t.listComentarios("tk").filter((c) => c.id === a.id)).toHaveLength(1);
  });
});