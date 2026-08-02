import { describe, expect, it } from "vitest";
import { DESIGN_DEFAULTS, DESIGN_PRESERVED_KEYS, restoreDesignDefaults } from "@/lib/design-defaults";

const defaults = DESIGN_DEFAULTS as unknown as Record<string, unknown>;

const personalizado = {
  // aparência (deve ser reposta)
  modo: "dark",
  accent: "0.5 0.2 20",
  fonteTitulos: "Georgia, serif",
  janelasOpacidade: 0.4,
  raio: 0.2,
  imagemFundo: "data:image/png;base64,xxx",
  fontSizeBase: 21,
  // negócio/conta (deve ser preservada)
  idioma: "fr",
  idiomaAuto: true,
  moeda: "BRL",
  nomeNegocio: "Atelier da Júlia",
  precoHoraBase: 23.5,
  pinContas: "4821",
} as any;

describe("Restaurar personalização default", () => {
  const out = restoreDesignDefaults(personalizado) as unknown as Record<string, unknown>;

  it("repõe exactamente DESIGN_DEFAULTS nos campos de aparência", () => {
    for (const [k, v] of Object.entries(defaults)) {
      if ((DESIGN_PRESERVED_KEYS as readonly string[]).includes(k)) continue;
      expect(out[k], `campo de aparência ${k}`).toEqual(v);
    }
  });

  it("preserva idioma, moeda, nomeNegocio, precoHoraBase e pinContas", () => {
    expect(out["idioma"]).toBe("fr");
    expect(out["idiomaAuto"]).toBe(true);
    expect(out["moeda"]).toBe("BRL");
    expect(out["nomeNegocio"]).toBe("Atelier da Júlia");
    expect(out["precoHoraBase"]).toBe(23.5);
    expect(out["pinContas"]).toBe("4821");
  });

  it("não deixa chaves a mais nem a menos face aos defaults", () => {
    expect(Object.keys(out).sort()).toEqual(Object.keys(defaults).sort());
  });

  it("usa o default quando o campo preservado não existe", () => {
    const out2 = restoreDesignDefaults({ modo: "dark" } as any) as unknown as Record<string, unknown>;
    for (const k of DESIGN_PRESERVED_KEYS) {
      expect(out2[k], `preservado em falta ${k}`).toEqual(defaults[k]);
    }
    expect(out2["modo"]).toBe(defaults["modo"]);
  });

  it("tolera design nulo/indefinido", () => {
    expect(restoreDesignDefaults(null)).toEqual({ ...DESIGN_DEFAULTS });
    expect(restoreDesignDefaults(undefined)).toEqual({ ...DESIGN_DEFAULTS });
  });

  it("não muta o design de entrada nem os defaults", () => {
    const entrada = { ...personalizado };
    restoreDesignDefaults(entrada);
    expect(entrada).toEqual(personalizado);
    expect((DESIGN_DEFAULTS as any).modo).toBe("light");
  });

  it("é idempotente", () => {
    expect(restoreDesignDefaults(out as any)).toEqual(out);
  });
});
