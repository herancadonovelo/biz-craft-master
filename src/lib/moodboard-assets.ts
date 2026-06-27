// Bibliotecas internas do Editor de Moodboards.
// Fundos: cores sólidas + texturas SVG inline + texturas loremflickr para 30 padrão.
// Decoração: 50 elementos via emoji + SVGs simples para colagem.

export type FundoItem = { id: string; nome: string; url: string; cor?: string };
export type DecorItem = { id: string; nome: string; src: string };

const tx = (seed: string, tag: string) =>
  `https://loremflickr.com/600/800/${encodeURIComponent(tag)}?lock=${seed}`;

export const FUNDOS_PADRAO: FundoItem[] = [
  { id: "kraft", nome: "Papel Kraft", url: tx("1", "kraft,paper") },
  { id: "linho", nome: "Linho cru", url: tx("2", "linen,fabric") },
  { id: "madeira-clara", nome: "Madeira clara", url: tx("3", "light,wood") },
  { id: "madeira-escura", nome: "Madeira escura", url: tx("4", "dark,wood") },
  { id: "marmore", nome: "Mármore", url: tx("5", "marble,white") },
  { id: "veludo-rosa", nome: "Veludo rosa", url: tx("6", "pink,velvet") },
  { id: "tricotado", nome: "Tricotado", url: tx("7", "knit,wool") },
  { id: "tweed", nome: "Tweed", url: tx("8", "tweed,fabric") },
  { id: "papel-aguarela", nome: "Papel aguarela", url: tx("9", "watercolor,paper") },
  { id: "papel-pontilhado", nome: "Papel pontilhado", url: tx("10", "dotted,paper") },
  { id: "papel-quadriculado", nome: "Papel quadriculado", url: tx("11", "grid,paper") },
  { id: "cortica", nome: "Cortiça", url: tx("12", "cork,board") },
  { id: "feltro-bege", nome: "Feltro bege", url: tx("13", "felt,beige") },
  { id: "feltro-verde", nome: "Feltro verde", url: tx("14", "felt,green") },
  { id: "juta", nome: "Juta", url: tx("15", "burlap,jute") },
  { id: "renda", nome: "Renda branca", url: tx("16", "lace,white") },
  { id: "papel-amassado", nome: "Papel amassado", url: tx("17", "crumpled,paper") },
  { id: "pergaminho", nome: "Pergaminho", url: tx("18", "parchment,old") },
  { id: "ardosia", nome: "Ardósia", url: tx("19", "slate,stone") },
  { id: "pedra", nome: "Pedra", url: tx("20", "stone,texture") },
  { id: "tecido-floral", nome: "Tecido floral", url: tx("21", "floral,fabric") },
  { id: "tecido-listras", nome: "Listras", url: tx("22", "stripes,fabric") },
  { id: "tecido-xadrez", nome: "Xadrez", url: tx("23", "tartan,fabric") },
  { id: "papel-rosa", nome: "Papel rosa pastel", url: tx("24", "pastel,pink,paper") },
  { id: "papel-azul", nome: "Papel azul pastel", url: tx("25", "pastel,blue,paper") },
  { id: "papel-amarelo", nome: "Papel amarelo pastel", url: tx("26", "pastel,yellow,paper") },
  { id: "papel-verde", nome: "Papel verde sálvia", url: tx("27", "sage,green,paper") },
  { id: "papel-terracota", nome: "Terracota", url: tx("28", "terracotta,paper") },
  { id: "papel-lavanda", nome: "Lavanda", url: tx("29", "lavender,paper") },
  { id: "papel-mostarda", nome: "Mostarda", url: tx("30", "mustard,paper") },
];

// Helper para gerar SVGs em dataURL.
function svg(inner: string, w = 200, h = 200, vb = "0 0 200 200") {
  return `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='${vb}' width='${w}' height='${h}'>${inner}</svg>`,
  )}`;
}
const tape = (cor: string) =>
  svg(
    `<rect x='0' y='60' width='200' height='80' fill='${cor}' opacity='0.7'/><line x1='0' y1='60' x2='200' y2='60' stroke='${cor}' stroke-dasharray='4 4' opacity='0.4'/><line x1='0' y1='140' x2='200' y2='140' stroke='${cor}' stroke-dasharray='4 4' opacity='0.4'/>`,
    200, 60,
  );
const polaroid = svg(
  `<rect x='10' y='10' width='180' height='180' rx='4' fill='white' stroke='#ddd'/><rect x='20' y='20' width='160' height='130' fill='#f3eee8'/>`,
  220, 220, "0 0 200 200",
);
const alfinete = (cor: string) => svg(`<circle cx='100' cy='100' r='30' fill='${cor}'/><circle cx='100' cy='100' r='10' fill='${cor}' opacity='0.6'/>`, 80, 80);
const moldura = svg(`<rect x='5' y='5' width='190' height='190' rx='8' fill='none' stroke='#8b6f47' stroke-width='12'/>`, 240, 240);
const linhaCosida = (cor: string) => svg(`<path d='M0 100 Q50 80 100 100 T200 100' stroke='${cor}' stroke-width='4' stroke-dasharray='8 6' fill='none'/>`, 200, 50);
const estrela = (cor: string) => svg(`<polygon points='100,20 122,80 188,80 134,118 154,182 100,142 46,182 66,118 12,80 78,80' fill='${cor}'/>`, 100, 100);
const coracao = (cor: string) => svg(`<path d='M100 175s-65-40-65-95a35 35 0 0 1 65-18 35 35 0 0 1 65 18c0 55-65 95-65 95z' fill='${cor}'/>`, 100, 100);
const circulo = (cor: string) => svg(`<circle cx='100' cy='100' r='90' fill='${cor}'/>`, 100, 100);
const arco = (cor: string) => svg(`<path d='M20 180 A80 80 0 0 1 180 180 Z' fill='${cor}'/>`, 100, 100);
const folha = (cor: string) => svg(`<path d='M40 160 C 40 60 100 20 160 40 C 140 100 100 160 40 160 Z' fill='${cor}'/>`, 120, 120);
const flor = (cor: string) => svg(
  `<g><circle cx='100' cy='60' r='30' fill='${cor}'/><circle cx='60' cy='100' r='30' fill='${cor}'/><circle cx='140' cy='100' r='30' fill='${cor}'/><circle cx='100' cy='140' r='30' fill='${cor}'/><circle cx='100' cy='100' r='18' fill='#fff3c4'/></g>`,
  120, 120,
);
const ramo = svg(
  `<g stroke='#5e7c4f' stroke-width='3' fill='none'><path d='M30 180 Q100 100 170 30'/><path d='M70 140 q-20 -10 -40 -10'/><path d='M110 100 q-20 -10 -40 -10'/><path d='M150 60 q-20 -10 -40 -10'/></g>`,
  200, 200,
);
const triangulo = (cor: string) => svg(`<polygon points='100,20 180,180 20,180' fill='${cor}'/>`, 100, 100);
const linhaWashi = (cor: string) => svg(`<rect width='200' height='40' fill='${cor}' opacity='0.7'/><circle cx='30' cy='20' r='3' fill='white'/><circle cx='80' cy='20' r='3' fill='white'/><circle cx='130' cy='20' r='3' fill='white'/><circle cx='180' cy='20' r='3' fill='white'/>`, 200, 40);

export const DECOR_PADRAO: DecorItem[] = [
  { id: "tape-rosa", nome: "Washi rosa", src: tape("#f4a8b8") },
  { id: "tape-azul", nome: "Washi azul", src: tape("#a8c5e0") },
  { id: "tape-bege", nome: "Washi bege", src: tape("#d9bfa0") },
  { id: "tape-verde", nome: "Washi verde", src: tape("#a9c5a0") },
  { id: "tape-amarelo", nome: "Washi amarelo", src: tape("#f1d27a") },
  { id: "tape-pontos", nome: "Washi pontilhada", src: linhaWashi("#e6a3b5") },
  { id: "tape-pontos-2", nome: "Washi azul pontos", src: linhaWashi("#92b8d8") },
  { id: "polaroid", nome: "Polaroid", src: polaroid },
  { id: "moldura", nome: "Moldura madeira", src: moldura },
  { id: "alfinete-vermelho", nome: "Alfinete vermelho", src: alfinete("#c0392b") },
  { id: "alfinete-azul", nome: "Alfinete azul", src: alfinete("#2c4a6b") },
  { id: "alfinete-amarelo", nome: "Alfinete amarelo", src: alfinete("#f1c40f") },
  { id: "alfinete-verde", nome: "Alfinete verde", src: alfinete("#27ae60") },
  { id: "linha-rosa", nome: "Linha cosida rosa", src: linhaCosida("#d96b8a") },
  { id: "linha-creme", nome: "Linha cosida creme", src: linhaCosida("#e8d8b5") },
  { id: "ramo", nome: "Ramo seco", src: ramo },
  { id: "folha-verde", nome: "Folha verde", src: folha("#7fa367") },
  { id: "folha-outono", nome: "Folha outono", src: folha("#c97b3b") },
  { id: "flor-rosa", nome: "Flor rosa", src: flor("#f3a3b5") },
  { id: "flor-amarela", nome: "Flor amarela", src: flor("#f1d27a") },
  { id: "flor-lavanda", nome: "Flor lavanda", src: flor("#b89edc") },
  { id: "estrela-dourada", nome: "Estrela dourada", src: estrela("#e0b94f") },
  { id: "estrela-prateada", nome: "Estrela prateada", src: estrela("#bdc3c7") },
  { id: "coracao-vermelho", nome: "Coração vermelho", src: coracao("#e74c3c") },
  { id: "coracao-rosa", nome: "Coração rosa", src: coracao("#f5a3b3") },
  { id: "circulo-bege", nome: "Círculo bege", src: circulo("#e3c9a8") },
  { id: "circulo-rosa", nome: "Círculo rosa", src: circulo("#f5c2c7") },
  { id: "circulo-azul", nome: "Círculo azul", src: circulo("#b4c9dc") },
  { id: "arco-rosa", nome: "Arco rosa", src: arco("#f4b6c2") },
  { id: "arco-verde", nome: "Arco verde", src: arco("#a9c5a0") },
  { id: "triangulo-mostarda", nome: "Triângulo mostarda", src: triangulo("#d4a44a") },
  { id: "triangulo-bordeaux", nome: "Triângulo bordeaux", src: triangulo("#8b3a4a") },
  { id: "tape-kraft", nome: "Washi kraft", src: tape("#b69274") },
  { id: "tape-creme", nome: "Washi creme", src: tape("#ecd9b5") },
  { id: "linha-azul", nome: "Linha azul", src: linhaCosida("#5c7a9c") },
  { id: "linha-verde", nome: "Linha verde", src: linhaCosida("#7a9c5c") },
  { id: "flor-branca", nome: "Flor branca", src: flor("#fdf7ee") },
  { id: "folha-sálvia", nome: "Folha sálvia", src: folha("#9bb389") },
  { id: "alfinete-rosa", nome: "Alfinete rosa", src: alfinete("#d96b8a") },
  { id: "estrela-rosa", nome: "Estrela rosa", src: estrela("#f4a8b8") },
  { id: "coracao-creme", nome: "Coração creme", src: coracao("#f0e1c8") },
  { id: "circulo-mostarda", nome: "Círculo mostarda", src: circulo("#d4a44a") },
  { id: "circulo-verde", nome: "Círculo verde", src: circulo("#a9c5a0") },
  { id: "arco-mostarda", nome: "Arco mostarda", src: arco("#d4a44a") },
  { id: "triangulo-verde", nome: "Triângulo verde", src: triangulo("#7a9c5c") },
  { id: "polaroid-2", nome: "Polaroid pequena", src: polaroid },
  { id: "moldura-fina", nome: "Moldura fina", src: svg(`<rect x='5' y='5' width='190' height='190' fill='none' stroke='#8b6f47' stroke-width='4'/>`, 200, 200) },
  { id: "moldura-dupla", nome: "Moldura dupla", src: svg(`<rect x='5' y='5' width='190' height='190' fill='none' stroke='#5e4a32' stroke-width='3'/><rect x='15' y='15' width='170' height='170' fill='none' stroke='#5e4a32' stroke-width='1'/>`, 200, 200) },
  { id: "ponto-rosa", nome: "Ponto rosa", src: circulo("#f5a3b3") },
  { id: "ponto-azul", nome: "Ponto azul", src: circulo("#a3c5e0") },
];

export const FONTES: string[] = [
  "Inter", "Playfair Display", "Lora", "Merriweather", "Cormorant Garamond",
  "EB Garamond", "Crimson Text", "DM Serif Display", "Libre Baskerville", "Source Serif Pro",
  "Poppins", "Montserrat", "Raleway", "Quicksand", "Nunito",
  "Lato", "Open Sans", "Roboto", "Work Sans", "Karla",
  "Manrope", "Outfit", "DM Sans", "Plus Jakarta Sans", "Space Grotesk",
  "Bebas Neue", "Oswald", "Anton", "Archivo Black", "Abril Fatface",
  "Caveat", "Dancing Script", "Pacifico", "Sacramento", "Great Vibes",
  "Amatic SC", "Permanent Marker", "Indie Flower", "Shadows Into Light", "Patrick Hand",
  "Kalam", "Satisfy", "Cookie", "Allura", "Parisienne",
  "Lobster", "Righteous", "Fredoka", "Comfortaa", "Josefin Sans",
];