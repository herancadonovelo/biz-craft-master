/**
 * Subconjunto curado da paleta DMC (48 cores) com equivalência aproximada Anchor.
 * Usado pelo Estúdio de Bordado (Fase 3) para o seletor de cor por camada.
 * Fonte pública: catálogo DMC / tabelas de conversão publicadas por DMC e Anchor.
 */
export type DmcColor = { code: string; name: string; hex: string; anchor?: string };

export const DMC_PALETTE: DmcColor[] = [
  { code: "310",  name: "Preto",              hex: "#000000", anchor: "403" },
  { code: "3865", name: "Branco polar",       hex: "#FBFBF3", anchor: "926" },
  { code: "BLANC",name: "Branco",             hex: "#FFFFFF", anchor: "2" },
  { code: "ECRU", name: "Cru",                hex: "#EFE6D2", anchor: "387" },
  { code: "435",  name: "Castanho",           hex: "#8A5B33", anchor: "1046" },
  { code: "433",  name: "Castanho médio",     hex: "#6E3D1A", anchor: "358" },
  { code: "801",  name: "Castanho escuro",    hex: "#4B2A16", anchor: "359" },
  { code: "938",  name: "Café ultra-escuro",  hex: "#2A140A", anchor: "381" },
  { code: "3371", name: "Preto castanho",     hex: "#1A0F07", anchor: "382" },
  { code: "738",  name: "Ocre claro",         hex: "#E7C591", anchor: "361" },
  { code: "436",  name: "Amêndoa",            hex: "#B58150", anchor: "1045" },
  { code: "676",  name: "Ouro claro",         hex: "#E1B57A", anchor: "891" },
  { code: "729",  name: "Ouro médio",         hex: "#C99C55", anchor: "890" },
  { code: "782",  name: "Mostarda",           hex: "#A97C29", anchor: "308" },
  { code: "725",  name: "Amarelo topázio",    hex: "#FFC94C", anchor: "305" },
  { code: "744",  name: "Amarelo pálido",     hex: "#FFE380", anchor: "301" },
  { code: "742",  name: "Tangerina",          hex: "#FFB94A", anchor: "303" },
  { code: "740",  name: "Laranja",            hex: "#F58426", anchor: "316" },
  { code: "946",  name: "Laranja escuro",     hex: "#D5561B", anchor: "332" },
  { code: "606",  name: "Vermelho brilhante", hex: "#F32115", anchor: "334" },
  { code: "666",  name: "Vermelho",           hex: "#D9241C", anchor: "46" },
  { code: "321",  name: "Vermelho carmim",    hex: "#B71B24", anchor: "9046" },
  { code: "498",  name: "Vermelho escuro",    hex: "#8C1421", anchor: "1005" },
  { code: "816",  name: "Grená",              hex: "#6E1220", anchor: "1005" },
  { code: "3350", name: "Rosa escuro",        hex: "#B8365B", anchor: "77" },
  { code: "3731", name: "Rosa antigo",        hex: "#D66A88", anchor: "76" },
  { code: "776",  name: "Rosa pastel",        hex: "#F6B8C5", anchor: "24" },
  { code: "819",  name: "Rosa muito claro",   hex: "#FBE1E5", anchor: "271" },
  { code: "718",  name: "Magenta",            hex: "#B03A73", anchor: "88" },
  { code: "550",  name: "Púrpura escuro",     hex: "#5B1D5E", anchor: "102" },
  { code: "553",  name: "Violeta",            hex: "#8B4A8C", anchor: "98" },
  { code: "210",  name: "Lavanda",            hex: "#B694C6", anchor: "108" },
  { code: "3747", name: "Lavanda pálida",     hex: "#C7CBE1", anchor: "120" },
  { code: "820",  name: "Azul rei",           hex: "#1C3C89", anchor: "134" },
  { code: "796",  name: "Azul escuro",        hex: "#1A3E85", anchor: "133" },
  { code: "798",  name: "Azul cobalto",       hex: "#3467B0", anchor: "146" },
  { code: "799",  name: "Azul médio",         hex: "#6A96CF", anchor: "145" },
  { code: "800",  name: "Azul pálido",        hex: "#B7CEE8", anchor: "144" },
  { code: "3810", name: "Turquesa",           hex: "#1F7F94", anchor: "1066" },
  { code: "959",  name: "Água-marinha",       hex: "#7BC7B8", anchor: "186" },
  { code: "913",  name: "Verde ninfa",        hex: "#5DAE7A", anchor: "204" },
  { code: "701",  name: "Verde bandeira",     hex: "#2E8B3D", anchor: "227" },
  { code: "699",  name: "Verde escuro",       hex: "#0F6B27", anchor: "923" },
  { code: "895",  name: "Verde musgo",        hex: "#295F2F", anchor: "1044" },
  { code: "471",  name: "Verde-oliva claro",  hex: "#B8C46A", anchor: "265" },
  { code: "832",  name: "Bronze",             hex: "#8E7130", anchor: "907" },
  { code: "413",  name: "Cinza escuro",       hex: "#565759", anchor: "236" },
  { code: "318",  name: "Cinza claro",        hex: "#BEBEBE", anchor: "399" },
];

/** Encontra a cor DMC mais próxima do hex dado (distância RGB simples). */
export function nearestDmc(hex: string): DmcColor {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  let best = DMC_PALETTE[0];
  let bd = Infinity;
  for (const c of DMC_PALETTE) {
    const cr = parseInt(c.hex.slice(1, 3), 16);
    const cg = parseInt(c.hex.slice(3, 5), 16);
    const cb = parseInt(c.hex.slice(5, 7), 16);
    const d = (r - cr) ** 2 + (g - cg) ** 2 + (b - cb) ** 2;
    if (d < bd) { bd = d; best = c; }
  }
  return best;
}