import { describe, it, expect } from "vitest";
import { agregarFeedback, newProgress, addNote, type TesterProgress } from "@/lib/knit/tester";

// Simula o parsing feito pelo FeedbackConsolidator: um ficheiro pode conter
// um TesterProgress isolado ou um array. Só entradas válidas são agregadas.
function isTesterProgress(v: unknown): v is TesterProgress {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return typeof o.token === "string"
    && typeof o.atual === "number"
    && typeof o.totalRows === "number"
    && Array.isArray(o.notas);
}

function parseFiles(raws: string[]): TesterProgress[] {
  const out: TesterProgress[] = [];
  for (const raw of raws) {
    try {
      const parsed = JSON.parse(raw);
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      for (const p of arr) if (isTesterProgress(p)) out.push(p);
    } catch { /* ignore */ }
  }
  return out;
}

describe("FeedbackConsolidator — parsing + agregação", () => {
  it("aceita ficheiro único e array, ignora lixo", () => {
    const p1 = newProgress("t1", 10, "Ana");
    const p2 = { ...newProgress("t2", 10, "Rita"), concluido: true, consumoRealG: 120, tamanhoUsado: "M", atual: 10 };
    const files = [JSON.stringify(p1), JSON.stringify([p2]), "{}", "não é json"];
    const parsed = parseFiles(files);
    expect(parsed).toHaveLength(2);
    expect(parsed.map((x) => x.token).sort()).toEqual(["t1", "t2"]);
  });

  it("agrega heatmap, tipos, tamanhos e consumo médio", () => {
    let a = newProgress("t1", 20, "Ana");
    a = addNote(a, { row: 5, autor: "Ana", texto: "erro no aumento", tipo: "erro" });
    a = addNote(a, { row: 5, autor: "Ana", texto: "confuso", tipo: "sugestao" });
    a = addNote(a, { row: 12, autor: "Ana", texto: "ok", tipo: "sugestao" });

    let b: TesterProgress = { ...newProgress("t2", 20, "Rita"), consumoRealG: 100, tamanhoUsado: "M", concluido: true, atual: 20 };
    b = addNote(b, { row: 5, autor: "Rita", texto: "erro repetido", tipo: "erro" });

    const c: TesterProgress = { ...newProgress("t3", 20, "Zoé"), consumoRealG: 140, tamanhoUsado: "M", concluido: true, atual: 20 };

    const resumo = agregarFeedback([a, b, c]);
    expect(resumo.testers).toBe(3);
    expect(resumo.concluidos).toBe(2);
    expect(resumo.mediaConsumoG).toBe(120);
    expect(resumo.tamanhosUsados.M).toBe(2);
    expect(resumo.notasPorTipo.erro).toBe(2);
    expect(resumo.notasPorTipo.sugestao).toBe(2);
    // C5 é a mais reportada (3 notas), depois C12.
    expect(resumo.notasPorRow[0]).toEqual({ row: 5, count: 3 });
    expect(resumo.notasPorRow[1]).toEqual({ row: 12, count: 1 });
  });
});