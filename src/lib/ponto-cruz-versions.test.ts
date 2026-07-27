import { describe, it, expect, beforeEach, vi } from "vitest";
import { emptyChart } from "./ponto-cruz";

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
  vi.stubGlobal("window", { localStorage: new MemStorage() });
});

describe("ponto-cruz-versions", async () => {
  const m = await import("./ponto-cruz-versions");

  it("save/list/restore round-trip", () => {
    const c = emptyChart(5, 5);
    c.cells["1,1"] = { hex: "#abcdef", type: "full" };
    const snap = m.saveSnapshot("pid", "v1", c);
    const list = m.listSnapshots("pid");
    expect(list).toHaveLength(1);
    expect(list[0].nome).toBe("v1");
    const restored = m.restoreSnapshot(snap);
    expect(restored.cells["1,1"].hex).toBe("#abcdef");
  });

  it("nome default quando vazio", () => {
    const s = m.saveSnapshot("p", "  ", emptyChart(2, 2));
    expect(s.nome).toMatch(/^Versão /);
  });

  it("delete remove por id", () => {
    const s = m.saveSnapshot("p2", "x", emptyChart(2, 2));
    m.deleteSnapshot("p2", s.id);
    expect(m.listSnapshots("p2")).toHaveLength(0);
  });
});