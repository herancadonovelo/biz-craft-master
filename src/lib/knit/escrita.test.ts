import { describe, it, expect } from "vitest";
import {
  gerarLegenda,
  converterAgulha,
  dicionarioCompleto,
  pesquisarDicionario,
  parseFases,
  fasesParaTexto,
  expandirRepeticoes,
  colapsarRepeticoes,
  completar,
} from "./escrita";

describe("gerarLegenda", () => {
  it("conta ocorrências e ordena por frequência", () => {
    const legenda = gerarLegenda("meia, meia, liga, meia, laçada", "pt");
    const meia = legenda.find((l) => l.abrev === "m");
    const liga = legenda.find((l) => l.abrev === "l");
    expect(meia?.ocorrencias).toBeGreaterThanOrEqual(3);
    expect(liga?.ocorrencias).toBeGreaterThanOrEqual(1);
    expect(legenda[0].ocorrencias).toBeGreaterThanOrEqual(legenda[legenda.length - 1].ocorrencias);
  });
  it("devolve lista vazia para texto sem pontos", () => {
    expect(gerarLegenda("lorem ipsum dolor")).toEqual([]);
  });
});

describe("converterAgulha", () => {
  it("mm → us/uk", () => {
    const r = converterAgulha({ mm: 4 });
    expect(r.us).toBe("6");
    expect(r.uk).toBe("8");
  });
  it("us → mm", () => {
    expect(converterAgulha({ us: "8" }).mm).toBe(5);
  });
  it("uk → mm", () => {
    expect(converterAgulha({ uk: "4" }).mm).toBe(6);
  });
  it("mm aproxima ao valor tabelado mais próximo", () => {
    expect(converterAgulha({ mm: 4.1 }).mm).toBe(4);
  });
});

describe("dicionário", () => {
  it("dicionarioCompleto inclui pontos e expressões", () => {
    const d = dicionarioCompleto();
    expect(d.some((l) => l.pt === "malha meia")).toBe(true);
    expect(d.some((l) => l.pt === "montar")).toBe(true);
  });
  it("pesquisarDicionario filtra por qualquer coluna", () => {
    expect(pesquisarDicionario("kitchener").length).toBeGreaterThan(0);
    expect(pesquisarDicionario("grafting").some((l) => l.uk === "grafting")).toBe(true);
    expect(pesquisarDicionario("").length).toBe(dicionarioCompleto().length);
  });
});

describe("parseFases / fasesParaTexto", () => {
  it("round-trip preserva os títulos e o conteúdo", () => {
    const src = "## Corpo\nMontar 100 malhas.\n\n## Cava\nDiminuir 5 malhas.";
    const fases = parseFases(src);
    expect(fases).toHaveLength(2);
    expect(fases[0].titulo).toBe("Corpo");
    expect(fases[1].conteudo).toContain("Diminuir");
    const back = fasesParaTexto(fases);
    expect(back).toContain("## Corpo");
    expect(back).toContain("## Cava");
  });
  it("texto sem cabeçalhos → fase Introdução", () => {
    const [f] = parseFases("sem cabeçalhos aqui");
    expect(f.titulo).toBe("Introdução");
  });
});

describe("expandir / colapsar repetições", () => {
  it("expandirRepeticoes materializa os blocos", () => {
    expect(expandirRepeticoes("*m, l* × 3")).toBe("m, l, m, l, m, l");
  });
  it("aceita x/× minúsculo/maiúsculo", () => {
    expect(expandirRepeticoes("*a* x 2")).toBe("a, a");
    expect(expandirRepeticoes("*a* X 2")).toBe("a, a");
  });
  it("colapsarRepeticoes agrupa runs consecutivos", () => {
    const c = colapsarRepeticoes("m, l, m, l, m, l, m, l");
    expect(c).toMatch(/\*m, l\*\s*×\s*4/);
  });
  it("round-trip aproximado", () => {
    const original = "m, l, m, l, m, l";
    const colapsado = colapsarRepeticoes(original);
    expect(expandirRepeticoes(colapsado)).toBe(original);
  });
});

describe("completar", () => {
  it("devolve sugestões que começam pelo prefixo do último token", () => {
    const sug = completar("meia, la", "pt");
    expect(sug.some((s) => s.id === "lac")).toBe(true);
  });
  it("array vazio se não há prefixo", () => {
    expect(completar("", "pt")).toEqual([]);
  });
});