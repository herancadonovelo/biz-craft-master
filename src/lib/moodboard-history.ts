/**
 * Histórico de edição (undo/redo) do editor de Moodboards.
 *
 * Funções puras sobre um estado imutável, para poderem ser testadas sem DOM
 * e reutilizadas por qualquer editor que trabalhe com snapshots.
 */
export interface Historico<T> {
  passado: T[];
  presente: T;
  futuro: T[];
  /** Momento (ms) do último registo, usado para agrupar edições contínuas. */
  ultimoEm: number;
}

export interface RegistarOpcoes {
  /** Máximo de estados guardados no passado (o mais antigo é descartado). */
  limite?: number;
  /**
   * Janela em ms dentro da qual duas edições são agrupadas num único passo.
   * Evita que um arrasto crie centenas de entradas no histórico.
   */
  coalescerMs?: number;
  /** Relógio injetável (testes). */
  agora?: number;
}

const LIMITE_PADRAO = 60;

export function criarHistorico<T>(inicial: T, agora = 0): Historico<T> {
  return { passado: [], presente: inicial, futuro: [], ultimoEm: agora };
}

/**
 * Regista um novo estado. Estados idênticos ao presente são ignorados;
 * edições dentro da janela de coalescência substituem o presente sem
 * criar um novo passo, e qualquer registo limpa o futuro (redo).
 */
export function registar<T>(h: Historico<T>, proximo: T, opts: RegistarOpcoes = {}): Historico<T> {
  const { limite = LIMITE_PADRAO, coalescerMs = 0, agora = 0 } = opts;
  if (Object.is(h.presente, proximo)) return h;
  const agrupar = coalescerMs > 0 && agora - h.ultimoEm < coalescerMs && h.passado.length > 0;
  if (agrupar) return { ...h, presente: proximo, futuro: [], ultimoEm: agora };
  const passado = [...h.passado, h.presente];
  return {
    passado: passado.length > limite ? passado.slice(passado.length - limite) : passado,
    presente: proximo,
    futuro: [],
    ultimoEm: agora,
  };
}

export const podeDesfazer = <T,>(h: Historico<T>) => h.passado.length > 0;
export const podeRefazer = <T,>(h: Historico<T>) => h.futuro.length > 0;

export function desfazer<T>(h: Historico<T>): Historico<T> {
  if (!podeDesfazer(h)) return h;
  const passado = [...h.passado];
  const anterior = passado.pop() as T;
  return { passado, presente: anterior, futuro: [h.presente, ...h.futuro], ultimoEm: 0 };
}

export function refazer<T>(h: Historico<T>): Historico<T> {
  if (!podeRefazer(h)) return h;
  const [proximo, ...resto] = h.futuro;
  return { passado: [...h.passado, h.presente], presente: proximo, futuro: resto, ultimoEm: 0 };
}

/** Descarta o histórico e recomeça a partir de um estado (ex.: abrir outro moodboard). */
export function reiniciar<T>(inicial: T, agora = 0): Historico<T> {
  return criarHistorico(inicial, agora);
}

/** Um passo de undo/redo é sempre um snapshot completo; útil para o rótulo da UI. */
export const tamanhoHistorico = <T,>(h: Historico<T>) => h.passado.length + h.futuro.length;
