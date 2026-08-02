import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  camposEmFalta, detetarReset, registarEventoDesign, lerEventosDesign,
  limparEventosDesign, marcarRestauroIntencional, consumirRestauroIntencional,
  MAX_EVENTOS, RESTAURO_JANELA_MS,
} from "@/lib/design-telemetry";
import { migrateStore } from "@/lib/store-migrations";
import { DESIGN_DEFAULTS } from "@/lib/design-defaults";


/** Ambiente node: stub mínimo de window com storages em memória. */
function criarStorage() {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => (m.has(k) ? m.get(k)! : null),
    setItem: (k: string, v: string) => void m.set(k, String(v)),
    removeItem: (k: string) => void m.delete(k),
    clear: () => m.clear(),
  };
}
(globalThis as any).window = (globalThis as any).window ?? {
  localStorage: criarStorage(),
  sessionStorage: criarStorage(),
  location: { pathname: "/design" },
  dispatchEvent: () => true,
};
(globalThis as any).CustomEvent = (globalThis as any).CustomEvent ?? class { constructor(public type: string, public init?: any) {} };

const defaults = DESIGN_DEFAULTS as unknown as Record<string, unknown>;

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  vi.spyOn(console, "info").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

describe("campos em falta", () => {
  it("lista as chaves ausentes ou undefined", () => {
    const faltam = camposEmFalta({ modo: "dark", accent: undefined }, defaults);
    expect(faltam).toContain("accent");
    expect(faltam).not.toContain("modo");
  });
  it("devolve tudo quando não há design", () => {
    expect(camposEmFalta(null, defaults).length).toBe(Object.keys(defaults).length);
  });
});

describe("deteção de reset", () => {
  it("assinala quando vários campos personalizados voltam ao default", () => {
    const anterior = { ...defaults, modo: "dark", raio: 0.2, accent: "0.1 0.1 10" };
    const r = detetarReset(anterior, { ...defaults }, defaults);
    expect(r.reset).toBe(true);
    expect(r.camposRepostos.sort()).toEqual(["accent", "modo", "raio"]);
  });
  it("ignora alterações isoladas", () => {
    const anterior = { ...defaults, modo: "dark" };
    expect(detetarReset(anterior, { ...defaults }, defaults).reset).toBe(false);
  });
  it("ignora mudanças que não são reposições", () => {
    const anterior = { ...defaults };
    const atual = { ...defaults, modo: "dark", raio: 0.2, accent: "0.1 0.1 10" };
    expect(detetarReset(anterior, atual, defaults).reset).toBe(false);
  });
});

describe("registo de eventos", () => {
  it("guarda e lê eventos", () => {
    registarEventoDesign({ tipo: "reset_inesperado", campos: ["modo"] });
    const evs = lerEventosDesign();
    expect(evs).toHaveLength(1);
    expect(evs[0].tipo).toBe("reset_inesperado");
    expect(evs[0].em).toBeTruthy();
  });
  it("limita o anel de eventos", () => {
    for (let i = 0; i < MAX_EVENTOS + 10; i++) registarEventoDesign({ tipo: "restauro_intencional", detalhe: String(i) });
    const evs = lerEventosDesign();
    expect(evs).toHaveLength(MAX_EVENTOS);
    expect(evs[evs.length - 1].detalhe).toBe(String(MAX_EVENTOS + 9));
  });
  it("limpa os eventos", () => {
    registarEventoDesign({ tipo: "restauro_intencional" });
    limparEventosDesign();
    expect(lerEventosDesign()).toEqual([]);
  });
});

describe("marca de restauro intencional", () => {
  it("consome uma marca recente uma única vez", () => {
    marcarRestauroIntencional("teste");
    expect(consumirRestauroIntencional()).toBe(true);
    expect(consumirRestauroIntencional()).toBe(false);
  });
  it("expira fora da janela", () => {
    marcarRestauroIntencional();
    expect(consumirRestauroIntencional(Date.now() + RESTAURO_JANELA_MS + 1)).toBe(false);
  });
});

describe("migração emite telemetria", () => {
  it("regista os campos preenchidos", () => {
    migrateStore({ design: { modo: "dark" } }, 2);
    const ev = lerEventosDesign().find((e) => e.tipo === "migracao_campos_preenchidos");
    expect(ev).toBeTruthy();
    expect(ev!.totalCampos).toBe(Object.keys(defaults).length - 1);
    expect(ev!.versaoAnterior).toBe(2);
  });
  it("regista quando não havia design guardado", () => {
    migrateStore({}, 2);
    expect(lerEventosDesign().some((e) => e.tipo === "migracao_sem_design")).toBe(true);
  });
  it("não regista nada quando o design já está completo", () => {
    migrateStore({ design: { ...defaults } }, 2);
    expect(lerEventosDesign()).toEqual([]);
  });
});
