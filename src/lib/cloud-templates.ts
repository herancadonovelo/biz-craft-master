/**
 * cloud-templates.ts — Phase 12: shared templates catalog + real-brand paletas.
 *
 * Ships an in-memory catalog. Callers can persist favorites in the local
 * Zustand store; the shape is intentionally small so we can later back this
 * by a Supabase table without changing consumers.
 */

export type SharedTemplate = {
  id: string;
  name: string;
  author: string;
  category: "Tricotin" | "Crochet" | "Bordado" | "Costura" | "Amigurumi";
  tags: string[];
  /** Optional preview URL (SVG data URI or hosted image). */
  preview?: string;
  /** Polyline in mm — importer scales to A4. */
  pointsMm: { x: number; y: number }[];
  /**
   * Recommended parameters — importer can pre-fill the editor.
   * Sizes are hints in millimetres; consumers may scale accordingly.
   */
  preset?: {
    sizeMm?: number;
    cordDiameterMm?: number;
    difficulty?: "iniciante" | "intermédio" | "avançado";
    yarnMetersHint?: number;
    strokePx?: number;
  };
};

export type BrandPalette = {
  id: string;
  brand: string;
  name: string;
  colors: { name: string; hex: string }[];
};

export const SHARED_TEMPLATES: SharedTemplate[] = [
  {
    id: "tpl-heart",
    name: "Coração clássico",
    author: "Comunidade CBM",
    category: "Tricotin",
    tags: ["coração", "amor", "iniciante"],
    pointsMm: heartMm(60),
    preset: { sizeMm: 60, cordDiameterMm: 10, difficulty: "iniciante", yarnMetersHint: 1.8, strokePx: 12 },
  },
  {
    id: "tpl-star",
    name: "Estrela 5 pontas",
    author: "Comunidade CBM",
    category: "Tricotin",
    tags: ["estrela", "decoração"],
    pointsMm: starMm(50, 5),
    preset: { sizeMm: 50, cordDiameterMm: 8, difficulty: "iniciante", yarnMetersHint: 1.4, strokePx: 10 },
  },
  {
    id: "tpl-spiral",
    name: "Espiral fibonacci",
    author: "Sara Afonso",
    category: "Tricotin",
    tags: ["espiral", "avançado"],
    pointsMm: spiralMm(2, 40, 3.5),
    preset: { sizeMm: 80, cordDiameterMm: 6, difficulty: "avançado", yarnMetersHint: 2.4, strokePx: 8 },
  },
  {
    id: "tpl-flower",
    name: "Flor 6 pétalas",
    author: "Comunidade CBM",
    category: "Tricotin",
    tags: ["flor", "natureza", "intermédio"],
    pointsMm: flowerMm(45, 6),
    preset: { sizeMm: 90, cordDiameterMm: 10, difficulty: "intermédio", yarnMetersHint: 2.6, strokePx: 12 },
  },
  {
    id: "tpl-infinity",
    name: "Infinito",
    author: "Comunidade CBM",
    category: "Tricotin",
    tags: ["infinito", "loop"],
    pointsMm: infinityMm(60, 25),
    preset: { sizeMm: 120, cordDiameterMm: 8, difficulty: "intermédio", yarnMetersHint: 2.0, strokePx: 10 },
  },
  {
    id: "tpl-wave",
    name: "Onda contínua",
    author: "Comunidade CBM",
    category: "Tricotin",
    tags: ["onda", "mar", "decoração"],
    pointsMm: waveMm(160, 12, 3),
    preset: { sizeMm: 160, cordDiameterMm: 6, difficulty: "iniciante", yarnMetersHint: 1.6, strokePx: 8 },
  },
  {
    id: "tpl-keychain",
    name: "Porta-chaves oval",
    author: "Comunidade CBM",
    category: "Tricotin",
    tags: ["porta-chaves", "pequeno", "presente"],
    pointsMm: ovalMm(40, 25),
    preset: { sizeMm: 40, cordDiameterMm: 8, difficulty: "iniciante", yarnMetersHint: 1.0, strokePx: 10 },
  },
  {
    id: "tpl-name-loop",
    name: "Aro para lettering",
    author: "Sara Afonso",
    category: "Tricotin",
    tags: ["lettering", "moldura"],
    pointsMm: ovalMm(90, 55),
    preset: { sizeMm: 180, cordDiameterMm: 10, difficulty: "intermédio", yarnMetersHint: 3.4, strokePx: 12 },
  },
];

export const BRAND_PALETTES: BrandPalette[] = [
  {
    id: "pantone-2026",
    brand: "Pantone",
    name: "Color of the Year 2026 — Mocha Mousse",
    colors: [
      { name: "Mocha Mousse", hex: "#A47864" },
      { name: "Warm Sand", hex: "#D4B896" },
      { name: "Deep Espresso", hex: "#4A3428" },
      { name: "Cream", hex: "#F5E9D7" },
    ],
  },
  {
    id: "dmc-pastels",
    brand: "DMC",
    name: "Pastéis clássicos",
    colors: [
      { name: "Rosé 963", hex: "#FBC4CB" },
      { name: "Céu 3841", hex: "#B8D9E5" },
      { name: "Menta 964", hex: "#B5E6D2" },
      { name: "Manteiga 745", hex: "#FBE6A2" },
    ],
  },
  {
    id: "lang-yarns-earth",
    brand: "Lang Yarns",
    name: "Earth Tones",
    colors: [
      { name: "Terracota", hex: "#B85C3E" },
      { name: "Musgo", hex: "#6B7B3F" },
      { name: "Areia", hex: "#D4B896" },
      { name: "Barro", hex: "#8B5A3C" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Generators (mm-space).
// ---------------------------------------------------------------------------

function heartMm(size: number) {
  const pts: { x: number; y: number }[] = [];
  for (let t = 0; t <= Math.PI * 2 + 0.01; t += 0.08) {
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    pts.push({ x: (x / 16) * (size / 2), y: (y / 13) * (size / 2) });
  }
  return pts;
}

function starMm(radius: number, points: number) {
  const pts: { x: number; y: number }[] = [];
  const inner = radius * 0.4;
  const step = Math.PI / points;
  for (let i = 0; i <= points * 2; i++) {
    const r = i % 2 === 0 ? radius : inner;
    const a = i * step - Math.PI / 2;
    pts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
  }
  return pts;
}

function spiralMm(startR: number, endR: number, turns: number) {
  const pts: { x: number; y: number }[] = [];
  const steps = 200;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const r = startR + (endR - startR) * t;
    const a = t * turns * Math.PI * 2;
    pts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
  }
  return pts;
}

function flowerMm(radius: number, petals: number) {
  const pts: { x: number; y: number }[] = [];
  const steps = 240;
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const r = radius * (0.55 + 0.45 * Math.abs(Math.cos(petals * t / 2)));
    pts.push({ x: Math.cos(t) * r, y: Math.sin(t) * r });
  }
  return pts;
}

function infinityMm(width: number, height: number) {
  const pts: { x: number; y: number }[] = [];
  const steps = 200;
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const s = Math.sin(t), c = Math.cos(t);
    const d = 1 + s * s;
    pts.push({ x: (width * c) / d, y: (height * s * c) / d });
  }
  return pts;
}

function waveMm(length: number, amplitude: number, cycles: number) {
  const pts: { x: number; y: number }[] = [];
  const steps = 200;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    pts.push({ x: -length / 2 + t * length, y: Math.sin(t * cycles * Math.PI * 2) * amplitude });
  }
  return pts;
}

function ovalMm(rx: number, ry: number) {
  const pts: { x: number; y: number }[] = [];
  const steps = 120;
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    pts.push({ x: Math.cos(t) * rx, y: Math.sin(t) * ry });
  }
  return pts;
}