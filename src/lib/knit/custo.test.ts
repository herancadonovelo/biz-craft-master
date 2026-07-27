import { describe, it, expect } from "vitest";
import {
  calcularLinhasCusto,
  calcularBreakdown,
  linhasParaCsvBom,
  type MaterialLite,
} from "./custo";
import { emptyChart, type Chart, type Gauge } from "./engine";

const gauge: Gauge = { pontos: 22, carreiras: 30, cm: 10 };

function chart2Cores(): Chart {
  const c = emptyChart(4, 2);
  c.grid = [
    [{ pontoId: "meia", cor: "#000" }, { pontoId: "meia", cor: "#000" }, { pontoId: "meia", cor: "#fff" }, { pontoId: "meia", cor: "#fff" }],
    [{ pontoId: "meia", cor: "#000" }, { pontoId: "meia", cor: "#fff" }, { pontoId: "meia", cor: "#fff" }, { pontoId: "meia", cor: "#fff" }],
  ];
  return c;
}

describe("calcularLinhasCusto", () => {
  it("ordena por gramas descendentes e devolve novelos >= 1", () => {
    const linhas = calcularLinhasCusto({ chart: chart2Cores(), gauge, gramasPor100m: 50 });
    expect(linhas).toHaveLength(2);
    expect(linhas[0].gramasComBuffer).toBeGreaterThanOrEqual(linhas[1].gramasComBuffer);
    for (const l of linhas) expect(l.novelos).toBeGreaterThanOrEqual(1);
  });

  it("buffer aumenta gramas e novelos", () => {
    const a = calcularLinhasCusto({ chart: chart2Cores(), gauge, gramasPor100m: 5000, bufferPct: 0 });
    const b = calcularLinhasCusto({ chart: chart2Cores(), gauge, gramasPor100m: 5000, bufferPct: 100 });
    expect(b[0].gramasComBuffer).toBeGreaterThan(a[0].gramasComBuffer);
  });

  it("mapCorMaterial gera custo e calcula falta face ao stock", () => {
    const mat: MaterialLite = {
      id: "m1", nome: "Fio Preto", unidade: "novelo", stock: 1, precoCompra: 4.5,
    };
    const linhas = calcularLinhasCusto({
      chart: chart2Cores(),
      gauge,
      gramasPor100m: 50,
      gramasPorNoveloDefault: 50,
      mapCorMaterial: { "#000": "m1" },
      materiais: [mat],
    });
    const preto = linhas.find((l) => l.cor === "#000")!;
    expect(preto.material?.id).toBe("m1");
    expect(preto.custo).toBeCloseTo(preto.novelos * 4.5, 2);
    expect(preto.falta).toBe(Math.max(0, preto.novelos - 1));
  });

  it("cores sem material têm custo=0", () => {
    const linhas = calcularLinhasCusto({ chart: chart2Cores(), gauge, gramasPor100m: 50 });
    for (const l of linhas) expect(l.custo).toBe(0);
  });
});

describe("calcularBreakdown", () => {
  it("agrega mão de obra, extras, overhead, margem e IVA", () => {
    const linhas = calcularLinhasCusto({ chart: chart2Cores(), gauge, gramasPor100m: 50 });
    const b = calcularBreakdown({
      linhas,
      horas: 10, precoHora: 8,
      precoFioGramaFallback: 0.1,
      extras: [{ nome: "etiquetas", valor: 2.5 }],
      overheadPct: 10, margemPct: 30, ivaPct: 23,
    });
    expect(b.custoMaoObra).toBeCloseTo(80, 2);
    expect(b.custoExtras).toBeCloseTo(2.5, 2);
    expect(b.subtotal).toBeGreaterThan(0);
    expect(b.overhead).toBeCloseTo(b.subtotal * 0.1, 1);
    expect(b.custoTotal).toBeCloseTo(b.subtotal + b.overhead, 1);
    expect(b.margem).toBeCloseTo(b.custoTotal * 0.3, 1);
    expect(b.precoSemIva).toBeCloseTo(b.custoTotal + b.margem, 1);
    expect(b.iva).toBeCloseTo(b.precoSemIva * 0.23, 1);
    expect(b.precoComIva).toBeCloseTo(b.precoSemIva + b.iva, 1);
  });

  it("percentagens a zero → preco sem iva == custoTotal", () => {
    const b = calcularBreakdown({
      linhas: [],
      horas: 0, precoHora: 0,
      precoFioGramaFallback: 0,
      extras: [], overheadPct: 0, margemPct: 0, ivaPct: 0,
    });
    expect(b.subtotal).toBe(0);
    expect(b.precoComIva).toBe(0);
  });
});

describe("linhasParaCsvBom", () => {
  it("gera header + N linhas com vírgulas escapadas", () => {
    const mat: MaterialLite = {
      id: "m", nome: 'Fio "Suave", Extra', unidade: "novelo", stock: 0, precoCompra: 3.2, marca: "AF",
    };
    const linhas = calcularLinhasCusto({
      chart: chart2Cores(), gauge, gramasPor100m: 50,
      mapCorMaterial: { "#000": "m" }, materiais: [mat],
    });
    const csv = linhasParaCsvBom(linhas);
    const rows = csv.split("\n");
    expect(rows[0]).toMatch(/^cor,material/);
    expect(rows).toHaveLength(linhas.length + 1);
    expect(csv).toMatch(/"Fio ""Suave"", Extra"/);
  });
});