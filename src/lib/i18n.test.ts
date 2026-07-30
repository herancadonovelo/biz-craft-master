import { describe, expect, it, beforeEach } from "vitest";
import { translate, getStaticDict } from "./i18n";
import { useStore } from "./store";
import ptDict from "@/i18n/pt.json";
import enDict from "@/i18n/en.json";
import contentEn from "@/i18n/content/en.json";
import contentPt from "@/i18n/content/pt.json";

describe("dicionários centralizados", () => {
  it("todas as chaves traduzidas existem em pt.json (fallback garantido)", () => {
    const orphans = Object.keys(enDict).filter((k) => !(k in ptDict));
    expect(orphans).toEqual([]);
  });

  it("todo o texto listado em en.json está registado em content/pt.json", () => {
    const untracked = Object.keys(contentEn).filter((t) => !(t in contentPt));
    expect(untracked).toEqual([]);
  });
});

describe("fallback para português", () => {
  it("usa a tradução inglesa quando existe", () => {
    expect(translate("en", "common.save")).toBe((enDict as Record<string, string>)["common.save"]);
  });

  it("cai para português quando a tradução inglesa falta", () => {
    expect(translate("en", "nav.help")).toBe((ptDict as Record<string, string>)["nav.help"]);
  });

  it("devolve a chave apenas quando não existe em lado nenhum", () => {
    expect(translate("en", "chave.inexistente")).toBe("chave.inexistente");
  });

  it("interpola variáveis", () => {
    expect(translate("pt", "{{n}} itens" as string, { n: 3 })).toBe("{{n}} itens");
  });

  it("ignora traduções vazias no dicionário de conteúdo", () => {
    const dict = getStaticDict("en");
    for (const value of Object.values(dict)) expect(value.trim().length).toBeGreaterThan(0);
  });
});

describe("troca de idioma global", () => {
  beforeEach(() => {
    useStore.setState((s) => ({ design: { ...s.design, idioma: "pt" } }) as never);
  });

  it("atualiza o estado partilhado para todos os consumidores", () => {
    const seen: string[] = [];
    const unsub = useStore.subscribe((s) => {
      seen.push(s.design.idioma);
    });
    useStore.setState((s) => ({ design: { ...s.design, idioma: "en" } }) as never);
    unsub();
    expect(seen.at(-1)).toBe("en");
    expect(translate(useStore.getState().design.idioma, "common.save")).toBe(
      (enDict as Record<string, string>)["common.save"],
    );
  });
});
