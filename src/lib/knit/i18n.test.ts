import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { KNIT_GLOSSARY, KNIT_UI_STRINGS, knitTranslate } from "./i18n";

const LANGS = ["en", "es", "fr"] as const;
const DIR = path.resolve(process.cwd(), "src/components/knit-editor");

/** Strings idênticas em PT e no idioma alvo (nomes próprios, siglas, unidades). */
const SAME_OK = new Set([
  "Dark mode", "Sock Wizard", "Extras", "Stock", "CSV BOM", "JSON completo",
  "JSON Ravelry", "Material", "Testers", "Consumo", "Consumo real",
  "Consumo real (g)", "Consumo médio (g)", "Consumo estimado", "Erro", "Erros",
  "Nota", "Tipo", "Marca", "Cor", "Alertas", "Novelos", "Pontos", "Sugestões",
  "Sugestão", "Abrev", "Estim. (g)", "Estimado", "Nome", "Tamanho", "Redondo",
  "Distribuir", "Reiniciar", "Remover", "Concluído", "Concluídos", "Custo",
  "Instruções", "Terminologia", "Ação", "Carreira", "Carreiras", "Malhas",
]);

function readPanels(): { file: string; src: string }[] {
  return fs
    .readdirSync(DIR)
    .filter((f) => f.endsWith(".tsx"))
    .map((f) => ({ file: f, src: fs.readFileSync(path.join(DIR, f), "utf8") }));
}

/** Extrai o texto literal de títulos e separadores do editor. */
function extractHeadings(src: string): string[] {
  const out: string[] = [];
  const re = /<(CardTitle|TabsTrigger)\b[^>]*>([\s\S]*?)<\/\1>/g;
  for (const m of src.matchAll(re)) {
    const inner = m[2]
      .replace(/<[^>]*>/g, " ")      // remove ícones/elementos
      .replace(/\{[^{}]*\}/g, " ")   // remove expressões JS
      .replace(/\s+/g, " ")
      .trim();
    if (inner && /[A-Za-zÀ-ÿ]{2}/.test(inner)) out.push(inner);
  }
  return out;
}

describe("glossário do editor de tricô", () => {
  it("tem tradução não vazia em EN/ES/FR para todas as chaves", () => {
    for (const key of KNIT_UI_STRINGS) {
      for (const lang of LANGS) {
        const v = KNIT_GLOSSARY[lang][key];
        expect(v, `${lang} em falta para "${key}"`).toBeTruthy();
        expect(v.trim().length, `${lang} vazio para "${key}"`).toBeGreaterThan(0);
      }
    }
  });

  it("não tem chaves duplicadas", () => {
    expect(new Set(KNIT_UI_STRINGS).size).toBe(KNIT_UI_STRINGS.length);
  });

  it("traduz efectivamente (sem cópia do PT) fora da lista de excepções", () => {
    const copied: string[] = [];
    for (const key of KNIT_UI_STRINGS) {
      if (SAME_OK.has(key)) continue;
      for (const lang of LANGS) {
        if (KNIT_GLOSSARY[lang][key] === key) copied.push(`${lang}: ${key}`);
      }
    }
    expect(copied, `traduções idênticas ao PT: ${copied.join(" | ")}`).toEqual([]);
  });

  it("cobre todos os títulos e separadores visíveis dos painéis", () => {
    const missing: string[] = [];
    for (const { file, src } of readPanels()) {
      for (const heading of extractHeadings(src)) {
        if (!knitTranslate("en", heading)) missing.push(`${file}: "${heading}"`);
      }
    }
    expect(missing, `sem tradução no glossário:\n${missing.join("\n")}`).toEqual([]);
  });

  it("knitTranslate ignora espaços e devolve undefined para desconhecidos", () => {
    expect(knitTranslate("en", "  Paleta de fios  ")).toBe("Yarn palette");
    expect(knitTranslate("pt", "Paleta de fios")).toBeUndefined();
    expect(knitTranslate("en", "string inexistente xyz")).toBeUndefined();
  });
});