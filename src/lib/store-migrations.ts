import { DESIGN_DEFAULTS } from "@/lib/design-defaults";

/**
 * Migração do estado persistido do atelier.
 * Regra crítica: nunca sobrescrever personalizações já guardadas em
 * `persisted.design` — só preencher campos em falta/indefinidos.
 */
export const migrateStore = (persisted: any, version: number) => {
  if (!persisted) return persisted;
  if (version < 1) {
    const d = persisted.design;
    if (d && typeof d === "object") {
      if (d.accent === "0.72 0.06 230") d.accent = "0.65 0.15 290";
      if (d.raio === 0.625) d.raio = 1.35;
      if (d.nomeNegocio === "Atelier Tricotin") d.nomeNegocio = "Craftme Business Master";
      if (d.precoHoraBase === 12) d.precoHoraBase = 7;
    }
  }
  if (version < 2) {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem("cbm-language-picked-v1", "1");
      }
    } catch {}
  }
  if (version < 3) {
    const d = (persisted.design ?? {}) as Record<string, unknown>;
    const merged: Record<string, unknown> = { ...DESIGN_DEFAULTS };
    for (const [k, v] of Object.entries(d)) {
      if (v !== undefined) merged[k] = v;
    }
    persisted.design = merged;
  }
  return persisted;
};
