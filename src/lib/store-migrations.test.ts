import { describe, expect, it } from "vitest";
import { migrateStore } from "@/lib/store-migrations";
import { DESIGN_DEFAULTS } from "@/lib/design-defaults";

// Cópia plana dos defaults: evita conversões de tipo (TS2352) entre
// `DesignSettings` e um índice genérico ao iterar as chaves nos testes.
const defaults: Record<string, unknown> = { ...DESIGN_DEFAULTS };

const custom = () => ({
  design: {
    modo: "dark",
    accent: "0.5 0.2 20",
    sidebarBg: "0.1 0 0",
    fonte: "Georgia",
    nomeNegocio: "O Meu Atelier",
    raio: 0.25,
  },
});

describe("migração v3 do estado persistido", () => {
  it("preserva todas as preferências personalizadas", () => {
    const before = custom().design;
    const out = migrateStore(custom(), 2);
    for (const [k, v] of Object.entries(before)) {
      expect(out.design[k]).toEqual(v);
    }
  });

  it("preenche apenas os campos em falta com os defaults", () => {
    const out = migrateStore({ design: { modo: "dark" } }, 2);
    expect(out.design.modo).toBe("dark");
    for (const [k, v] of Object.entries(defaults)) {
      if (k === "modo") continue;
      expect(out.design[k]).toEqual(v);
    }
  });

  it("ignora campos undefined e usa o default nesse caso", () => {
    const out = migrateStore({ design: { accent: undefined, modo: "light" } }, 2);
    expect(out.design.accent).toEqual(defaults.accent);
    expect(out.design.modo).toBe("light");
  });

  it("aplica os defaults quando não existe design guardado", () => {
    const out = migrateStore({}, 2);
    expect(out.design).toEqual(defaults);
  });

  it("não altera nada quando já está na versão 3", () => {
    const out = migrateStore({ design: { modo: "dark" } }, 3);
    expect(out.design).toEqual({ modo: "dark" });
  });

  it("é idempotente ao correr duas vezes", () => {
    const once = migrateStore(custom(), 2);
    const twice = migrateStore(JSON.parse(JSON.stringify(once)), 2);
    expect(twice).toEqual(once);
  });

  it("mantém personalizações vindas da versão 0 (migração completa)", () => {
    const out = migrateStore({ design: { accent: "0.9 0.1 40", nomeNegocio: "Loja X" } }, 0);
    expect(out.design.accent).toBe("0.9 0.1 40");
    expect(out.design.nomeNegocio).toBe("Loja X");
  });

  it("tolera estado persistido nulo", () => {
    expect(migrateStore(null, 2)).toBeNull();
  });
});
