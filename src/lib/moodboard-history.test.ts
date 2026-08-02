import { describe, it, expect } from "vitest";
import {
  criarHistorico, registar, desfazer, refazer,
  podeDesfazer, podeRefazer, reiniciar, tamanhoHistorico,
} from "./moodboard-history";

const h0 = () => criarHistorico({ n: 0 });

describe("registar", () => {
  it("empilha estados e limpa o futuro", () => {
    let h = registar(h0(), { n: 1 });
    h = registar(h, { n: 2 });
    expect(h.presente).toEqual({ n: 2 });
    expect(h.passado).toHaveLength(2);
    h = desfazer(h);
    expect(h.futuro).toHaveLength(1);
    h = registar(h, { n: 9 });
    expect(h.futuro).toHaveLength(0);
  });

  it("ignora registos idênticos ao presente", () => {
    const estado = { n: 1 };
    const h = registar(criarHistorico(estado), estado);
    expect(h.passado).toHaveLength(0);
  });

  it("agrupa edições dentro da janela de coalescência", () => {
    let h = registar(h0(), { n: 1 }, { agora: 0 });
    h = registar(h, { n: 2 }, { coalescerMs: 400, agora: 100 });
    h = registar(h, { n: 3 }, { coalescerMs: 400, agora: 200 });
    expect(h.presente).toEqual({ n: 3 });
    expect(h.passado).toHaveLength(1); // arrasto contínuo = um só passo
    h = registar(h, { n: 4 }, { coalescerMs: 400, agora: 5000 });
    expect(h.passado).toHaveLength(2);
  });

  it("respeita o limite descartando os estados mais antigos", () => {
    let h = h0();
    for (let i = 1; i <= 10; i++) h = registar(h, { n: i }, { limite: 3 });
    expect(h.passado).toHaveLength(3);
    expect(h.passado[0]).toEqual({ n: 7 });
  });
});

describe("desfazer/refazer", () => {
  it("volta atrás e avança repondo o mesmo estado", () => {
    let h = registar(registar(h0(), { n: 1 }), { n: 2 });
    h = desfazer(h);
    expect(h.presente).toEqual({ n: 1 });
    h = desfazer(h);
    expect(h.presente).toEqual({ n: 0 });
    expect(podeDesfazer(h)).toBe(false);
    h = refazer(refazer(h));
    expect(h.presente).toEqual({ n: 2 });
    expect(podeRefazer(h)).toBe(false);
  });

  it("é inerte quando não há nada para desfazer ou refazer", () => {
    const h = h0();
    expect(desfazer(h)).toBe(h);
    expect(refazer(h)).toBe(h);
  });

  it("desfazer imediatamente após uma edição não é coalescido", () => {
    let h = registar(h0(), { n: 1 }, { coalescerMs: 400, agora: 10 });
    h = desfazer(h);
    h = registar(h, { n: 5 }, { coalescerMs: 400, agora: 20 });
    expect(h.passado).toHaveLength(1);
    expect(desfazer(h).presente).toEqual({ n: 0 });
  });
});

describe("reiniciar", () => {
  it("descarta passado e futuro", () => {
    const h = reiniciar({ n: 42 });
    expect(tamanhoHistorico(h)).toBe(0);
    expect(h.presente).toEqual({ n: 42 });
  });
});
