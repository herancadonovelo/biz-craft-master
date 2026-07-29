import { describe, it, expect } from "vitest";
import { EDITORS_GLOSSARY, EDITOR_UI_STRINGS, editorTranslate } from "./i18n";
import { KNIT_GLOSSARY } from "../knit/i18n";

const LANGS = ["en", "es", "fr"] as const;

/** Termos onde PT e o idioma alvo coincidem legitimamente. */
const SAME_OK = new Set([
  "Extras", "Stock", "Total", "Total:", "Zoom", "Material", "Design & PDF",
  "Formato", "Imagem", "Auto-save", "Motivo", "Perfil", "Template", "Nome",
  "Título", "Texto", "Fim", "Início", "Mosaico", "Centro", "Centrar",
  "Iniciar", "Restaurar", "Guardar", "Aplicar", "Adicionar", "Metros",
  "Gramas", "Horas", "Margem", "Consumo", "Contador", "Espiral", "Compasso",
  "Tangente", "Medir", "Dividir", "vertical", "Interseções", "Passos",
  "Ferramenta", "Ferramentas", "Versões", "Presets", "Nuvem", "Exportação",
  "Exportar", "Iniciante", "Intermédio", "Avançado", "Nível", "Autoria",
  "Autor", "Legenda", "Resumo", "Cor", "Cores", "Linha", "Linhas", "Colunas",
  "Grelha", "Tamanho", "Projeto", "Preço", "Custo", "Pontos", "Ponto",
  "Carreira", "Carreiras", "Fio", "Fios", "Fibra", "Arame", "Agulha",
  "Novo", "Nenhum", "Camadas", "Atalhos", "Comandos", "Correções", "Visuais",
  "Desenho", "Cálculos", "Estatísticas", "Monograma", "Moldura", "Cabeçalho",
  "Rodapé", "Índice", "Balde", "Lápis", "Retângulo", "Seleção", "Selecionar",
  "Substituir", "Reta", "Decalque", "Tempo", "Comprimento", "Dimensão",
  "Escalonamento", "Precificador", "Reserva (%)", "Pausar", "Zerar",
  "Marca de água", "Conta-gotas", "Vezes", "Distância", "Enviar",
  "Apagar", "Fechar", "fechar", "Limpar", "Repor", "Recuperar", "Gravar",
  "Fonte", "Orientação", "Retrato", "Mesclar", "Peças:", "Lados:",
  "Milímetros (mm)", "Centímetros (cm)", "Pixels (px)", "Escala %",
  "Margem (mm)", "Resolução PNG", "Nº de carreiras", "pontos", "Vídeos & QR",
  "Ponto atrás", "Nó francês", "½ ponto", "de fio", "sem match",
  "Sobreposição (mm)", "Bastidor L×A (mm)", "DPI de SVG", "Calibrar",
  "Fotos por carreira", "Modo Tester", "Padrão & Escrita", "Total linhas",
  "Desfazer", "Refazer", "desfazer", "refazer", "Granny square (layout)",
]);

describe("glossário dos editores técnicos", () => {
  it("cobre todos os idiomas para cada string", () => {
    for (const src of EDITOR_UI_STRINGS) {
      for (const lang of LANGS) {
        const value = EDITORS_GLOSSARY[lang][src];
        expect(value, `${src} → ${lang}`).toBeTruthy();
        expect(value.trim()).toBe(value);
      }
    }
  });

  it("não tem chaves duplicadas", () => {
    expect(new Set(EDITOR_UI_STRINGS).size).toBe(EDITOR_UI_STRINGS.length);
  });

  it("traduz de facto (salvo termos idênticos legítimos)", () => {
    for (const src of EDITOR_UI_STRINGS) {
      if (SAME_OK.has(src)) continue;
      const en = EDITORS_GLOSSARY.en[src];
      expect(en, `EN não traduzido: ${src}`).not.toBe(src);
    }
  });

  it("não contradiz o glossário do editor de tricô", () => {
    for (const lang of LANGS) {
      for (const [src, value] of Object.entries(EDITORS_GLOSSARY[lang])) {
        const knit = KNIT_GLOSSARY[lang][src];
        if (knit) expect(value, `${src} (${lang})`).toBe(knit);
      }
    }
  });

  it("editorTranslate ignora espaços e idiomas desconhecidos", () => {
    expect(editorTranslate("en", "  Guardar  ")).toBe("Save");
    expect(editorTranslate("de", "Guardar")).toBeUndefined();
    expect(editorTranslate("en", "string inexistente")).toBeUndefined();
  });
});

import fs from "node:fs";
import path from "node:path";
import { knitTranslate } from "../knit/i18n";

/** Ficheiros dos editores técnicos (excepto o editor de tricô). */
const SOURCES = [
  "src/components/amigurumi-editor",
  "src/components/embroidery",
  "src/components/CosturaEditor.tsx",
  "src/components/PontoCruzEditor.tsx",
  "src/components/TricotinProPanel.tsx",
];

function readPanels(): { file: string; src: string }[] {
  const out: { file: string; src: string }[] = [];
  for (const entry of SOURCES) {
    const abs = path.resolve(process.cwd(), entry);
    if (!fs.existsSync(abs)) continue;
    if (fs.statSync(abs).isDirectory()) {
      for (const f of fs.readdirSync(abs)) {
        if (f.endsWith(".tsx")) out.push({ file: f, src: fs.readFileSync(path.join(abs, f), "utf8") });
      }
    } else {
      out.push({ file: path.basename(abs), src: fs.readFileSync(abs, "utf8") });
    }
  }
  return out;
}

function extractHeadings(src: string): string[] {
  const out: string[] = [];
  const re = /<(CardTitle|TabsTrigger)\b[^>]*>([\s\S]*?)<\/\1>/g;
  for (const m of src.matchAll(re)) {
    const inner = m[2]
      .replace(/<[^>]*>/g, " ")
      .replace(/\{[^{}]*\}/g, " ")
      .replace(/\(\s*[×x·\-–]?\s*\)/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (inner && /[A-Za-zÀ-ÿ]{2}/.test(inner)) out.push(inner);
  }
  return out;
}

describe("cobertura dos painéis dos editores técnicos", () => {
  it("traduz todos os títulos e separadores visíveis", () => {
    const missing: string[] = [];
    for (const { file, src } of readPanels()) {
      for (const heading of extractHeadings(src)) {
        if (editorTranslate("en", heading) || knitTranslate("en", heading)) continue;
        missing.push(`${file}: "${heading}"`);
      }
    }
    expect(missing, `sem tradução no glossário:\n${missing.join("\n")}`).toEqual([]);
  });
});
