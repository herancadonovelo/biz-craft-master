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
  },
  {
    id: "tpl-star",
    name: "Estrela 5 pontas",
    author: "Comunidade CBM",
    category: "Tricotin",
    tags: ["estrela", "decoração"],
    pointsMm: starMm(50, 5),
  },
  {
    id: "tpl-spiral",
    name: "Espiral fibonacci",
    author: "Sara Afonso",
    category: "Tricotin",
    tags: ["espiral", "avançado"],
    pointsMm: spiralMm(2, 40, 3.5),
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