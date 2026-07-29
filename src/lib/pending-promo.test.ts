import { describe, it, expect, beforeEach } from "vitest";

// Ambiente de teste é node: simulamos apenas o que o módulo usa.
const store = new Map<string, string>();
(globalThis as any).window = {
  localStorage: {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
  },
};

import {
  PROMO_CODE_PATTERN,
  normalizePromoCode,
  savePendingPromoCode,
  readPendingPromoCode,
  clearPendingPromoCode,
} from "./pending-promo";

describe("pending-promo", () => {
  beforeEach(() => window.localStorage.clear());

  it("normaliza espaços e maiúsculas", () => {
    expect(normalizePromoCode("  bemvinda2026 ")).toBe("BEMVINDA2026");
  });

  it("aceita apenas formatos válidos", () => {
    expect(PROMO_CODE_PATTERN.test("CAYDO_LIFETIME_PREMIUM")).toBe(true);
    expect(PROMO_CODE_PATTERN.test("AB")).toBe(false);
    expect(PROMO_CODE_PATTERN.test("COM ESPAÇO")).toBe(false);
    expect(PROMO_CODE_PATTERN.test("X".repeat(41))).toBe(false);
  });

  it("guarda e lê o código normalizado", () => {
    savePendingPromoCode(" pai_te_amo_lifetime_premium ");
    expect(readPendingPromoCode()).toBe("PAI_TE_AMO_LIFETIME_PREMIUM");
  });

  it("ignora códigos inválidos", () => {
    savePendingPromoCode("no");
    expect(readPendingPromoCode()).toBeNull();
  });

  it("limpa o código pendente", () => {
    savePendingPromoCode("BEMVINDA2026");
    clearPendingPromoCode();
    expect(readPendingPromoCode()).toBeNull();
  });

  it("descarta valores corrompidos no storage", () => {
    window.localStorage.setItem("cbm:pendingPromoCode", "in valido!!");
    expect(readPendingPromoCode()).toBeNull();
  });
});