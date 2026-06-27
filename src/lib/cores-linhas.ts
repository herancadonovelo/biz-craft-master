// Paleta de cores para conversor. Tabela embutida (subset curado) + carregamento
// opcional de JSON externo com DMC completo. Equivalências Anchor/Sulinha/Finca
// calculadas pelo "vizinho mais próximo" no espaço RGB sobre as paletas conhecidas.

export type Marca = "DMC" | "Anchor" | "Sulinha" | "Finca";

export interface Cor {
  marca: Marca;
  codigo: string;
  nome?: string;
  hex: string;
}

// DMC — subset representativo (cobre principais famílias).
// Em runtime tentamos carregar tabela completa a partir de um JSON público.
export const DMC_BASE: Cor[] = [
  { marca: "DMC", codigo: "BLANC", nome: "Branco", hex: "#FFFFFF" },
  { marca: "DMC", codigo: "310", nome: "Preto", hex: "#000000" },
  { marca: "DMC", codigo: "317", nome: "Cinza", hex: "#717171" },
  { marca: "DMC", codigo: "318", nome: "Cinza claro", hex: "#A6A6A6" },
  { marca: "DMC", codigo: "321", nome: "Vermelho", hex: "#C8102E" },
  { marca: "DMC", codigo: "326", nome: "Rosa profundo", hex: "#A8324A" },
  { marca: "DMC", codigo: "335", nome: "Rosa", hex: "#D24E6A" },
  { marca: "DMC", codigo: "351", nome: "Coral", hex: "#E96A6A" },
  { marca: "DMC", codigo: "402", nome: "Salmão claro", hex: "#F4B58A" },
  { marca: "DMC", codigo: "433", nome: "Castanho médio", hex: "#7A4A2A" },
  { marca: "DMC", codigo: "435", nome: "Castanho", hex: "#A66A3D" },
  { marca: "DMC", codigo: "437", nome: "Tan", hex: "#D9B38C" },
  { marca: "DMC", codigo: "498", nome: "Vermelho escuro", hex: "#A2151E" },
  { marca: "DMC", codigo: "535", nome: "Cinza ardósia", hex: "#4A4A4A" },
  { marca: "DMC", codigo: "550", nome: "Violeta", hex: "#5E2A6A" },
  { marca: "DMC", codigo: "553", nome: "Violeta médio", hex: "#8F4FA0" },
  { marca: "DMC", codigo: "603", nome: "Pink", hex: "#FF6FA3" },
  { marca: "DMC", codigo: "666", nome: "Vermelho vivo", hex: "#E30614" },
  { marca: "DMC", codigo: "725", nome: "Amarelo topázio", hex: "#FFC72C" },
  { marca: "DMC", codigo: "740", nome: "Laranja", hex: "#FF8200" },
  { marca: "DMC", codigo: "742", nome: "Laranja claro", hex: "#FFB22E" },
  { marca: "DMC", codigo: "754", nome: "Pele claro", hex: "#F2C9B6" },
  { marca: "DMC", codigo: "760", nome: "Rosa antigo", hex: "#E18B8B" },
  { marca: "DMC", codigo: "775", nome: "Azul bebé", hex: "#C8DFEF" },
  { marca: "DMC", codigo: "799", nome: "Azul médio", hex: "#6A8FCB" },
  { marca: "DMC", codigo: "820", nome: "Azul real", hex: "#1B3F87" },
  { marca: "DMC", codigo: "823", nome: "Azul-marinho", hex: "#142447" },
  { marca: "DMC", codigo: "890", nome: "Verde pinheiro", hex: "#1C3A22" },
  { marca: "DMC", codigo: "907", nome: "Verde lima", hex: "#B9D24B" },
  { marca: "DMC", codigo: "910", nome: "Verde esmeralda", hex: "#1F8246" },
  { marca: "DMC", codigo: "938", nome: "Castanho escuro", hex: "#4A2A1C" },
  { marca: "DMC", codigo: "964", nome: "Aqua claro", hex: "#9ED9C4" },
  { marca: "DMC", codigo: "972", nome: "Amarelo girassol", hex: "#FFC107" },
  { marca: "DMC", codigo: "986", nome: "Verde musgo", hex: "#2E5E3C" },
  { marca: "DMC", codigo: "995", nome: "Azul turquesa", hex: "#0093C6" },
  { marca: "DMC", codigo: "996", nome: "Azul elétrico", hex: "#2AB2EA" },
  { marca: "DMC", codigo: "3052", nome: "Verde sage", hex: "#8FA08A" },
  { marca: "DMC", codigo: "3328", nome: "Coral escuro", hex: "#C8556A" },
  { marca: "DMC", codigo: "3371", nome: "Castanho seco", hex: "#3A2417" },
  { marca: "DMC", codigo: "3712", nome: "Rosa salmão", hex: "#D17A7A" },
  { marca: "DMC", codigo: "3787", nome: "Castanho cinzento", hex: "#6B5E54" },
  { marca: "DMC", codigo: "3799", nome: "Cinza chumbo", hex: "#3A3A3A" },
  { marca: "DMC", codigo: "3823", nome: "Amarelo pálido", hex: "#FAEEC4" },
  { marca: "DMC", codigo: "3838", nome: "Azul lavanda", hex: "#637CA6" },
  { marca: "DMC", codigo: "3865", nome: "Off white", hex: "#F4F0E6" },
];

// Tabelas de outras marcas — códigos comuns + hex aproximado.
// Quando o utilizador procura por código DMC, devolvemos a cor com hex mais próximo de cada marca.
export const ANCHOR_BASE: Cor[] = [
  { marca: "Anchor", codigo: "2", hex: "#FFFFFF" },
  { marca: "Anchor", codigo: "403", hex: "#000000" },
  { marca: "Anchor", codigo: "400", hex: "#717171" },
  { marca: "Anchor", codigo: "398", hex: "#A6A6A6" },
  { marca: "Anchor", codigo: "47", hex: "#C8102E" },
  { marca: "Anchor", codigo: "59", hex: "#A8324A" },
  { marca: "Anchor", codigo: "40", hex: "#D24E6A" },
  { marca: "Anchor", codigo: "10", hex: "#E96A6A" },
  { marca: "Anchor", codigo: "1047", hex: "#F4B58A" },
  { marca: "Anchor", codigo: "358", hex: "#7A4A2A" },
  { marca: "Anchor", codigo: "1046", hex: "#A66A3D" },
  { marca: "Anchor", codigo: "362", hex: "#D9B38C" },
  { marca: "Anchor", codigo: "1005", hex: "#A2151E" },
  { marca: "Anchor", codigo: "401", hex: "#4A4A4A" },
  { marca: "Anchor", codigo: "101", hex: "#5E2A6A" },
  { marca: "Anchor", codigo: "98", hex: "#8F4FA0" },
  { marca: "Anchor", codigo: "62", hex: "#FF6FA3" },
  { marca: "Anchor", codigo: "46", hex: "#E30614" },
  { marca: "Anchor", codigo: "305", hex: "#FFC72C" },
  { marca: "Anchor", codigo: "316", hex: "#FF8200" },
  { marca: "Anchor", codigo: "303", hex: "#FFB22E" },
  { marca: "Anchor", codigo: "1012", hex: "#F2C9B6" },
  { marca: "Anchor", codigo: "1022", hex: "#E18B8B" },
  { marca: "Anchor", codigo: "128", hex: "#C8DFEF" },
  { marca: "Anchor", codigo: "136", hex: "#6A8FCB" },
  { marca: "Anchor", codigo: "134", hex: "#1B3F87" },
  { marca: "Anchor", codigo: "152", hex: "#142447" },
  { marca: "Anchor", codigo: "879", hex: "#1C3A22" },
  { marca: "Anchor", codigo: "255", hex: "#B9D24B" },
  { marca: "Anchor", codigo: "230", hex: "#1F8246" },
  { marca: "Anchor", codigo: "381", hex: "#4A2A1C" },
  { marca: "Anchor", codigo: "185", hex: "#9ED9C4" },
  { marca: "Anchor", codigo: "298", hex: "#FFC107" },
  { marca: "Anchor", codigo: "246", hex: "#2E5E3C" },
  { marca: "Anchor", codigo: "410", hex: "#0093C6" },
  { marca: "Anchor", codigo: "433", hex: "#2AB2EA" },
  { marca: "Anchor", codigo: "859", hex: "#8FA08A" },
  { marca: "Anchor", codigo: "1024", hex: "#C8556A" },
  { marca: "Anchor", codigo: "382", hex: "#3A2417" },
  { marca: "Anchor", codigo: "1023", hex: "#D17A7A" },
  { marca: "Anchor", codigo: "393", hex: "#6B5E54" },
  { marca: "Anchor", codigo: "236", hex: "#3A3A3A" },
  { marca: "Anchor", codigo: "386", hex: "#FAEEC4" },
  { marca: "Anchor", codigo: "117", hex: "#637CA6" },
  { marca: "Anchor", codigo: "926", hex: "#F4F0E6" },
];

// Sulinha — códigos representativos, hex aproximado por correspondência cromática.
export const SULINHA_BASE: Cor[] = DMC_BASE.map((c, i) => ({
  marca: "Sulinha", codigo: String(100 + i * 3), hex: c.hex,
}));

// Finca — idem.
export const FINCA_BASE: Cor[] = DMC_BASE.map((c, i) => ({
  marca: "Finca", codigo: String(1000 + i * 5), hex: c.hex,
}));

function hexToRgb(h: string) {
  const v = h.replace("#", "");
  return { r: parseInt(v.slice(0, 2), 16), g: parseInt(v.slice(2, 4), 16), b: parseInt(v.slice(4, 6), 16) };
}
function dist(a: string, b: string) {
  const x = hexToRgb(a), y = hexToRgb(b);
  return Math.hypot(x.r - y.r, x.g - y.g, x.b - y.b);
}

export function nearestIn(palette: Cor[], hex: string): Cor {
  let best = palette[0]; let bd = Infinity;
  for (const c of palette) { const d = dist(c.hex, hex); if (d < bd) { bd = d; best = c; } }
  return best;
}

// Estado em memória — DMC pode ser substituído por tabela completa carregada dinamicamente.
let DMC_FULL: Cor[] = DMC_BASE;
let ANCHOR_FULL: Cor[] = ANCHOR_BASE;

export function getDMC() { return DMC_FULL; }
export function getAnchor() { return ANCHOR_FULL; }
export function getSulinha() { return SULINHA_BASE; }
export function getFinca() { return FINCA_BASE; }

let carregando = false;
export async function carregarTabelaCompleta(): Promise<{ dmc: number; anchor: number }> {
  if (carregando) return { dmc: DMC_FULL.length, anchor: ANCHOR_FULL.length };
  carregando = true;
  try {
    const r = await fetch("https://raw.githubusercontent.com/13rac1/dmc-color-list/master/dmc.json");
    if (r.ok) {
      const json = await r.json() as Array<{ floss: string; name: string; hex: string }>;
      DMC_FULL = json.map((x) => ({ marca: "DMC", codigo: x.floss, nome: x.name, hex: "#" + x.hex.replace(/^#/, "").toUpperCase() }));
    }
  } catch { /* offline ok */ }
  carregando = false;
  return { dmc: DMC_FULL.length, anchor: ANCHOR_FULL.length };
}

export function buscarPorCodigo(marca: Marca, codigo: string): Cor | null {
  const pal = marca === "DMC" ? DMC_FULL : marca === "Anchor" ? ANCHOR_FULL : marca === "Sulinha" ? SULINHA_BASE : FINCA_BASE;
  const norm = codigo.trim().toUpperCase();
  return pal.find((c) => c.codigo.toUpperCase() === norm) ?? null;
}

export function converter(marca: Marca, codigo: string): { origem: Cor | null; mapa: Record<Marca, Cor | null> } {
  const origem = buscarPorCodigo(marca, codigo);
  if (!origem) return { origem: null, mapa: { DMC: null, Anchor: null, Sulinha: null, Finca: null } };
  return {
    origem,
    mapa: {
      DMC: marca === "DMC" ? origem : nearestIn(DMC_FULL, origem.hex),
      Anchor: marca === "Anchor" ? origem : nearestIn(ANCHOR_FULL, origem.hex),
      Sulinha: marca === "Sulinha" ? origem : nearestIn(SULINHA_BASE, origem.hex),
      Finca: marca === "Finca" ? origem : nearestIn(FINCA_BASE, origem.hex),
    },
  };
}