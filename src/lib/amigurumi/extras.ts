// Fase 6 — utilitários matemáticos e helpers dos extras

// Recomenda tamanho de agulha a partir da espessura do fio (g/m).
// Baseado em tabelas de fabricantes; devolve intervalo mínimo/máximo em mm.
export function recomendarAgulhaMM(gramasPer100m: number): { min: number; max: number; nota: string } {
  if (!gramasPer100m || gramasPer100m <= 0) return { min: 0, max: 0, nota: "Introduz a espessura do fio (g/100m)." };
  // Regra prática para amigurumi: agulha 1 número abaixo do recomendado pelo fabricante
  // Faixas típicas:
  if (gramasPer100m <= 25)  return { min: 1.5, max: 2.0, nota: "Fio muito fino (linha). Amigurumi miniatura." };
  if (gramasPer100m <= 50)  return { min: 2.0, max: 2.5, nota: "Fio fino. Amigurumi pequeno." };
  if (gramasPer100m <= 100) return { min: 2.5, max: 3.5, nota: "Fio médio (padrão amigurumi)." };
  if (gramasPer100m <= 150) return { min: 3.5, max: 4.5, nota: "Fio grosso." };
  return { min: 5.0, max: 8.0, nota: "Fio chunky/gigante." };
}

// Escalonamento: quantos pontos base para atingir um diâmetro alvo, dada a tensão.
// tensao: pontos por 10cm. diametroAlvoCm: diâmetro final da esfera.
// Para esfera: circunferência = π·d, pontos = tensao/10 · π·d.
export function pontosEsferaParaDiametro(diametroAlvoCm: number, tensao10cm: number): number {
  if (!diametroAlvoCm || !tensao10cm) return 0;
  return Math.round((tensao10cm / 10) * Math.PI * diametroAlvoCm);
}

// Redimensionamento por agulha: novo total ≈ total · (agulhaOriginal / agulhaNova)
export function escalaPorAgulha(totalOriginal: number, mmOriginal: number, mmNova: number): number {
  if (!totalOriginal || !mmOriginal || !mmNova) return totalOriginal;
  return Math.round(totalOriginal * (mmOriginal / mmNova));
}

// Matriz tapestry / C2C — converte um bloco de texto tipo "AABBB\nBBAAA" numa matriz
export function parseTapestryGrid(texto: string): string[][] {
  return texto
    .split(/\r?\n/)
    .filter((l) => l.length > 0)
    .map((linha) => Array.from(linha));
}

// Gera cabo de granny (canto) — quantos aumentos por lado para um quadrado NxN carreiras
export function grannyLayout(carreiras: number): { lados: number; ptsPorCanto: number; total: number } {
  const lados = 4;
  const ptsPorCanto = 3; // 3 pontos altos por canto
  const totalPontos = 4 * (carreiras * 3) + 4 * ptsPorCanto;
  return { lados, ptsPorCanto, total: totalPontos };
}

// Validador agulha x fio
export function validarAgulhaFio(agulhaMM: number, gramasPer100m: number): { ok: boolean; msg: string } {
  const rec = recomendarAgulhaMM(gramasPer100m);
  if (!agulhaMM || !rec.min) return { ok: true, msg: "Introduz agulha e fio para validar." };
  if (agulhaMM < rec.min) return { ok: false, msg: `Agulha ${agulhaMM}mm é pequena — recomendado ${rec.min}-${rec.max}mm. Pontos ficarão apertados demais.` };
  if (agulhaMM > rec.max) return { ok: false, msg: `Agulha ${agulhaMM}mm é grande — recomendado ${rec.min}-${rec.max}mm. Pontos ficarão frouxos e o enchimento aparecerá.` };
  return { ok: true, msg: `Agulha adequada (${rec.min}-${rec.max}mm).` };
}

// Consumo de cabelo/franja
export function consumoCabelo(numFios: number, cmPorFio: number): number {
  return +((numFios * cmPorFio) / 100).toFixed(2);
}

// Estimativa de metros por peso: g_total / g_por_metro
export function metrosDeFio(gramasTotais: number, gramasPor100m: number): number {
  if (!gramasTotais || !gramasPor100m) return 0;
  return +((gramasTotais / gramasPor100m) * 100).toFixed(1);
}