/**
 * tricotin-pro.ts — utilities for Tricotin editor backlog phases 3–11.
 *
 * All functions are pure and operate on simple {x,y} point arrays in
 * A4-pixel space (see PX_PER_CM in ferramentas-tecnicas.tsx: 1cm ≈ 28.35px).
 */

export type P = { x: number; y: number };

// ---------------------------------------------------------------------------
// Phase 3 — Drawing: Single-Line, Smoothing, Medial Axis (skeleton) helpers.
// ---------------------------------------------------------------------------

/** Chaikin corner-cutting smoothing (n iterations). Preserves endpoints. */
export function chaikin(points: P[], iterations = 2): P[] {
  let pts = points.slice();
  for (let it = 0; it < iterations; it++) {
    if (pts.length < 3) break;
    const out: P[] = [pts[0]];
    for (let i = 0; i < pts.length - 1; i++) {
      const p = pts[i], q = pts[i + 1];
      out.push({ x: p.x * 0.75 + q.x * 0.25, y: p.y * 0.75 + q.y * 0.25 });
      out.push({ x: p.x * 0.25 + q.x * 0.75, y: p.y * 0.25 + q.y * 0.75 });
    }
    out.push(pts[pts.length - 1]);
    pts = out;
  }
  return pts;
}

/** Ramer–Douglas–Peucker (used to keep single-line output stable). */
export function rdp(points: P[], epsilon = 1.5): P[] {
  if (points.length < 3) return points.slice();
  const first = 0, last = points.length - 1;
  let maxD = 0, index = 0;
  const [a, b] = [points[first], points[last]];
  for (let i = first + 1; i < last; i++) {
    const d = perpDist(points[i], a, b);
    if (d > maxD) { maxD = d; index = i; }
  }
  if (maxD > epsilon) {
    const left = rdp(points.slice(first, index + 1), epsilon);
    const right = rdp(points.slice(index, last + 1), epsilon);
    return left.slice(0, -1).concat(right);
  }
  return [a, b];
}
function perpDist(p: P, a: P, b: P) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const L2 = dx * dx + dy * dy;
  if (L2 === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  const t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / L2;
  const cx = a.x + dx * t, cy = a.y + dy * t;
  return Math.hypot(p.x - cx, p.y - cy);
}

// ---------------------------------------------------------------------------
// Phase 4 — Volume simulation. Given a centerline and cord diameter (mm),
// draw a stroked outline suggesting yarn thickness + a "ghost" centerline.
// ---------------------------------------------------------------------------

export function drawVolume(
  ctx: CanvasRenderingContext2D,
  points: P[],
  opts: { diameterMm: number; pxPerMm: number; showGhost?: boolean; color?: string },
) {
  if (points.length < 2) return;
  const w = Math.max(1, opts.diameterMm * opts.pxPerMm);
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  // Outer casing
  ctx.strokeStyle = opts.color ?? "#c9a27a";
  ctx.globalAlpha = 0.85;
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
  ctx.stroke();
  // Bump / texture (light striping perpendicular to segments)
  ctx.globalAlpha = 0.18;
  ctx.strokeStyle = "#7a5a38";
  ctx.lineWidth = Math.max(0.5, w * 0.15);
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i];
    const dx = b.x - a.x, dy = b.y - a.y;
    const L = Math.hypot(dx, dy);
    if (L < 4) continue;
    const nx = -dy / L, ny = dx / L;
    const step = Math.max(3, w * 0.5);
    for (let s = step; s < L; s += step) {
      const cx = a.x + (dx * s) / L, cy = a.y + (dy * s) / L;
      ctx.beginPath();
      ctx.moveTo(cx - nx * w * 0.4, cy - ny * w * 0.4);
      ctx.lineTo(cx + nx * w * 0.4, cy + ny * w * 0.4);
      ctx.stroke();
    }
  }
  // Ghost centerline
  if (opts.showGhost) {
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Phase 5 — Production guides: numbered direction arrows, angle alerts,
// start/end markers.
// ---------------------------------------------------------------------------

export function drawGuides(
  ctx: CanvasRenderingContext2D,
  points: P[],
  opts?: { arrowEveryPx?: number; criticalAngleDeg?: number },
) {
  if (points.length < 2) return;
  const every = opts?.arrowEveryPx ?? 90;
  const critical = (opts?.criticalAngleDeg ?? 45) * (Math.PI / 180);
  ctx.save();
  ctx.font = "bold 10px system-ui";
  ctx.fillStyle = "#2563eb";
  ctx.strokeStyle = "#2563eb";
  let acc = 0;
  let arrowIdx = 1;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i];
    const L = Math.hypot(b.x - a.x, b.y - a.y);
    acc += L;
    if (acc >= every) {
      acc = 0;
      const ang = Math.atan2(b.y - a.y, b.x - a.x);
      drawArrow(ctx, b.x, b.y, ang, 10);
      ctx.fillText(String(arrowIdx++), b.x + 6, b.y - 6);
    }
    if (i < points.length - 1) {
      const c = points[i + 1];
      const v1x = a.x - b.x, v1y = a.y - b.y;
      const v2x = c.x - b.x, v2y = c.y - b.y;
      const cos = (v1x * v2x + v1y * v2y) / (Math.hypot(v1x, v1y) * Math.hypot(v2x, v2y) || 1);
      const angle = Math.acos(Math.max(-1, Math.min(1, cos)));
      if (angle < critical) {
        ctx.save();
        ctx.fillStyle = "#dc2626";
        ctx.beginPath();
        ctx.arc(b.x, b.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }
  // start/end markers
  drawMarker(ctx, points[0], "#16a34a", "S");
  drawMarker(ctx, points[points.length - 1], "#dc2626", "F");
  ctx.restore();
}

function drawArrow(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, size: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-size, -size * 0.5);
  ctx.moveTo(0, 0);
  ctx.lineTo(-size, size * 0.5);
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}
function drawMarker(ctx: CanvasRenderingContext2D, p: P, color: string, letter: string) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = "bold 10px system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(letter, p.x, p.y);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Phase 6 — Automatic calculations (yarn length, resize, cost).
// ---------------------------------------------------------------------------

export function pathLengthPx(points: P[]): number {
  let sum = 0;
  for (let i = 1; i < points.length; i++) sum += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  return sum;
}

export function yarnEstimateMeters(points: P[], pxPerMm: number, waste = 0.1): number {
  const mm = pathLengthPx(points) / pxPerMm;
  return (mm * (1 + waste)) / 1000;
}

export function resizeProportional(points: P[], scale: number, center: P): P[] {
  return points.map((p) => ({ x: center.x + (p.x - center.x) * scale, y: center.y + (p.y - center.y) * scale }));
}

export function materialCost(meters: number, pricePerMeter: number, extras = 0): number {
  return meters * pricePerMeter + extras;
}

// ---------------------------------------------------------------------------
// Phase 7 — Layers + snap + mirror helpers.
// ---------------------------------------------------------------------------

export function mirror(points: P[], axis: "x" | "y", pivot: number): P[] {
  return points.map((p) =>
    axis === "x"
      ? { x: 2 * pivot - p.x, y: p.y }
      : { x: p.x, y: 2 * pivot - p.y },
  );
}

export function snapToObjects(p: P, refs: P[], toleranceMm: number, pxPerMm: number): P {
  const tol = toleranceMm * pxPerMm;
  let best: P = p;
  let bestD = tol;
  for (const r of refs) {
    const d = Math.hypot(p.x - r.x, p.y - r.y);
    if (d < bestD) { bestD = d; best = { x: r.x, y: r.y }; }
  }
  return best;
}

// ---------------------------------------------------------------------------
// Phase 8 — Advanced printing: A4 tiling.
// ---------------------------------------------------------------------------

/** Splits an A4 render into N×M A4 sheets at real 1:1 scale. Returns tile bounds in source px. */
export function computeA4Tiles(sourceW: number, sourceH: number, cols: number, rows: number) {
  const tileW = sourceW / cols;
  const tileH = sourceH / rows;
  const tiles: { row: number; col: number; sx: number; sy: number; sw: number; sh: number }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      tiles.push({ row: r, col: c, sx: c * tileW, sy: r * tileH, sw: tileW, sh: tileH });
    }
  }
  return tiles;
}

// ---------------------------------------------------------------------------
// Phase 9 — Advanced vector: boolean union of segments (proxy via concat +
// tangent-fusion) and dynamic offset.
// ---------------------------------------------------------------------------

export function offsetPolyline(points: P[], distancePx: number): P[] {
  const out: P[] = [];
  for (let i = 0; i < points.length; i++) {
    const a = points[Math.max(0, i - 1)];
    const b = points[i];
    const c = points[Math.min(points.length - 1, i + 1)];
    const dx = c.x - a.x, dy = c.y - a.y;
    const L = Math.hypot(dx, dy) || 1;
    const nx = -dy / L, ny = dx / L;
    out.push({ x: b.x + nx * distancePx, y: b.y + ny * distancePx });
  }
  return out;
}

/** Fuse two polylines end-to-end using nearest-endpoint matching. */
export function fuse(a: P[], b: P[]): P[] {
  if (!a.length) return b.slice();
  if (!b.length) return a.slice();
  const aEnd = a[a.length - 1];
  const dStart = Math.hypot(aEnd.x - b[0].x, aEnd.y - b[0].y);
  const dEnd = Math.hypot(aEnd.x - b[b.length - 1].x, aEnd.y - b[b.length - 1].y);
  return dStart <= dEnd ? a.concat(b) : a.concat(b.slice().reverse());
}

// ---------------------------------------------------------------------------
// Phase 10 — Physics: naive tension analysis + center of gravity.
// ---------------------------------------------------------------------------

export function centroid(points: P[]): P {
  if (!points.length) return { x: 0, y: 0 };
  let sx = 0, sy = 0;
  for (const p of points) { sx += p.x; sy += p.y; }
  return { x: sx / points.length, y: sy / points.length };
}

/** Returns tension scores per node in [0..1] where 1 = sharpest bend (spring-like stress). */
export function tensionScores(points: P[]): number[] {
  const scores: number[] = new Array(points.length).fill(0);
  for (let i = 1; i < points.length - 1; i++) {
    const a = points[i - 1], b = points[i], c = points[i + 1];
    const v1x = a.x - b.x, v1y = a.y - b.y;
    const v2x = c.x - b.x, v2y = c.y - b.y;
    const cos = (v1x * v2x + v1y * v2y) / (Math.hypot(v1x, v1y) * Math.hypot(v2x, v2y) || 1);
    const angle = Math.acos(Math.max(-1, Math.min(1, cos)));
    // 0° = fully bent = high stress; 180° = straight = 0 stress
    scores[i] = 1 - angle / Math.PI;
  }
  return scores;
}

// ---------------------------------------------------------------------------
// Phase 11 — Industrial export: G-Code for a CNC bending/plotter, plus
// naive rectangular nesting and CMYK-textile metadata bundle.
// ---------------------------------------------------------------------------

export function exportGCode(points: P[], opts: { pxPerMm: number; feed?: number; safeZ?: number; workZ?: number }): string {
  const { pxPerMm } = opts;
  const feed = opts.feed ?? 1200;
  const safeZ = opts.safeZ ?? 5;
  const workZ = opts.workZ ?? 0;
  const lines: string[] = [
    "; G-Code exported from Craft Business Master — Tricotin Editor",
    "G21 ; mm",
    "G90 ; absolute",
    `G0 Z${safeZ}`,
  ];
  if (!points.length) { lines.push("M30"); return lines.join("\n"); }
  const [p0, ...rest] = points;
  lines.push(`G0 X${(p0.x / pxPerMm).toFixed(3)} Y${(p0.y / pxPerMm).toFixed(3)}`);
  lines.push(`G1 Z${workZ} F${feed}`);
  for (const p of rest) {
    lines.push(`G1 X${(p.x / pxPerMm).toFixed(3)} Y${(p.y / pxPerMm).toFixed(3)} F${feed}`);
  }
  lines.push(`G0 Z${safeZ}`);
  lines.push("M30");
  return lines.join("\n");
}

/**
 * Arc-aware G-Code exporter. Groups consecutive points that lie on a common
 * circle (within `arcToleranceMm`) into a single G2/G3 command, and emits
 * G1 for the remaining straight segments. Reduces controller decelerations
 * on curved paths. Tolerance is in millimetres.
 */
export function exportGCodeArcs(
  points: P[],
  opts: {
    pxPerMm: number;
    feed?: number;
    safeZ?: number;
    workZ?: number;
    /** Max deviation (mm) from the fitted circle to accept an arc. */
    arcToleranceMm?: number;
    /** Minimum consecutive points to attempt an arc fit. */
    minArcPoints?: number;
  },
): string {
  const { pxPerMm } = opts;
  const feed = opts.feed ?? 1200;
  const safeZ = opts.safeZ ?? 5;
  const workZ = opts.workZ ?? 0;
  const tolMm = opts.arcToleranceMm ?? 0.1;
  const minPts = Math.max(3, opts.minArcPoints ?? 4);
  const tolPx = tolMm * pxPerMm;

  const out: string[] = [
    "; G-Code (arcs) — Craft Business Master",
    `; arc tolerance = ${tolMm} mm`,
    "G21", "G90", `G0 Z${safeZ}`,
  ];
  if (points.length < 2) { out.push("M30"); return out.join("\n"); }
  const toMm = (v: number) => (v / pxPerMm).toFixed(3);

  out.push(`G0 X${toMm(points[0].x)} Y${toMm(points[0].y)}`);
  out.push(`G1 Z${workZ} F${feed}`);

  let i = 0;
  while (i < points.length - 1) {
    // Try to grow an arc starting at i using points [i..j].
    let bestJ = -1;
    let bestCircle: { cx: number; cy: number; r: number; cw: boolean } | null = null;
    for (let j = i + minPts - 1; j < points.length; j++) {
      const c = fitCircle(points, i, j);
      if (!c) break;
      let ok = true;
      for (let k = i; k <= j; k++) {
        const d = Math.abs(Math.hypot(points[k].x - c.cx, points[k].y - c.cy) - c.r);
        if (d > tolPx) { ok = false; break; }
      }
      if (!ok) break;
      bestJ = j;
      bestCircle = c;
    }
    if (bestJ >= 0 && bestCircle) {
      const end = points[bestJ];
      const start = points[i];
      const iCode = bestCircle.cw ? "G2" : "G3";
      const iOff = (bestCircle.cx - start.x);
      const jOff = (bestCircle.cy - start.y);
      out.push(`${iCode} X${toMm(end.x)} Y${toMm(end.y)} I${toMm(iOff)} J${toMm(jOff)} F${feed}`);
      i = bestJ;
    } else {
      const p = points[i + 1];
      out.push(`G1 X${toMm(p.x)} Y${toMm(p.y)} F${feed}`);
      i += 1;
    }
  }
  out.push(`G0 Z${safeZ}`, "M30");
  return out.join("\n");
}

/**
 * Analyse how the arc-aware exporter would segment a path at a given
 * tolerance, without emitting G-code. Powers the tolerance preview in the
 * Pro panel so the user can weigh precision vs. controller smoothness before
 * exporting.
 *
 * Returned metrics:
 *  - `arcs`, `lines`   → count of G2/G3 vs. G1 commands.
 *  - `segments`        → total command count.
 *  - `discontinuities` → number of direction changes ≥ ~5° between
 *    consecutive commands (proxy for controller decelerations).
 *  - `avgSegmentMm`    → average segment length (higher = smoother motion).
 *  - `polylineForPreview` → resampled polyline of the reconstructed arcs +
 *    straight moves, in the same px space, so the panel can render both the
 *    original and the approximated path overlapped.
 */
export function analyzeArcApproximation(
  points: P[],
  opts: { pxPerMm: number; arcToleranceMm?: number; minArcPoints?: number },
): {
  arcs: number;
  lines: number;
  segments: number;
  discontinuities: number;
  avgSegmentMm: number;
  polylineForPreview: P[];
} {
  const { pxPerMm } = opts;
  const tolPx = (opts.arcToleranceMm ?? 0.1) * pxPerMm;
  const minPts = Math.max(3, opts.minArcPoints ?? 4);
  const zero = { arcs: 0, lines: 0, segments: 0, discontinuities: 0, avgSegmentMm: 0, polylineForPreview: [] as P[] };
  if (points.length < 2) return zero;

  type Cmd = { kind: "G1"; from: P; to: P } | { kind: "G2" | "G3"; from: P; to: P; cx: number; cy: number; r: number };
  const cmds: Cmd[] = [];
  let i = 0;
  while (i < points.length - 1) {
    let bestJ = -1;
    let bestCircle: { cx: number; cy: number; r: number; cw: boolean } | null = null;
    for (let j = i + minPts - 1; j < points.length; j++) {
      const c = fitCircle(points, i, j);
      if (!c) break;
      let ok = true;
      for (let k = i; k <= j; k++) {
        const d = Math.abs(Math.hypot(points[k].x - c.cx, points[k].y - c.cy) - c.r);
        if (d > tolPx) { ok = false; break; }
      }
      if (!ok) break;
      bestJ = j; bestCircle = c;
    }
    if (bestJ >= 0 && bestCircle) {
      cmds.push({ kind: bestCircle.cw ? "G2" : "G3", from: points[i], to: points[bestJ], cx: bestCircle.cx, cy: bestCircle.cy, r: bestCircle.r });
      i = bestJ;
    } else {
      cmds.push({ kind: "G1", from: points[i], to: points[i + 1] });
      i += 1;
    }
  }

  // Resample arcs into small line segments for the visual preview.
  const poly: P[] = [cmds[0].from];
  let totalLenPx = 0;
  for (const c of cmds) {
    if (c.kind === "G1") {
      poly.push(c.to);
      totalLenPx += Math.hypot(c.to.x - c.from.x, c.to.y - c.from.y);
    } else {
      const a0 = Math.atan2(c.from.y - c.cy, c.from.x - c.cx);
      const a1 = Math.atan2(c.to.y - c.cy, c.to.x - c.cx);
      let delta = a1 - a0;
      // Normalise sweep direction according to cw/ccw
      const cw = c.kind === "G2";
      if (cw && delta > 0) delta -= Math.PI * 2;
      if (!cw && delta < 0) delta += Math.PI * 2;
      const steps = Math.max(6, Math.round(Math.abs(delta) * c.r / 3));
      for (let s = 1; s <= steps; s++) {
        const t = s / steps;
        const a = a0 + delta * t;
        poly.push({ x: c.cx + Math.cos(a) * c.r, y: c.cy + Math.sin(a) * c.r });
      }
      totalLenPx += Math.abs(delta) * c.r;
    }
  }

  // Discontinuities: direction changes between consecutive commands' entry vectors.
  let disc = 0;
  for (let k = 1; k < cmds.length; k++) {
    const prev = cmds[k - 1], cur = cmds[k];
    const v1x = prev.to.x - prev.from.x, v1y = prev.to.y - prev.from.y;
    const v2x = cur.to.x - cur.from.x, v2y = cur.to.y - cur.from.y;
    const L1 = Math.hypot(v1x, v1y) || 1;
    const L2 = Math.hypot(v2x, v2y) || 1;
    const cos = (v1x * v2x + v1y * v2y) / (L1 * L2);
    const angle = Math.acos(Math.max(-1, Math.min(1, cos)));
    if (angle > (5 * Math.PI) / 180) disc += 1;
  }

  const arcs = cmds.filter((c) => c.kind !== "G1").length;
  const lines = cmds.length - arcs;
  return {
    arcs, lines,
    segments: cmds.length,
    discontinuities: disc,
    avgSegmentMm: cmds.length ? (totalLenPx / pxPerMm) / cmds.length : 0,
    polylineForPreview: poly,
  };
}

/** Least-squares circle fit through points[i..j]. Returns null if degenerate. */
function fitCircle(points: P[], i: number, j: number):
  { cx: number; cy: number; r: number; cw: boolean } | null {
  const n = j - i + 1;
  if (n < 3) return null;
  let sx = 0, sy = 0, sxx = 0, syy = 0, sxy = 0, sxxx = 0, syyy = 0, sxyy = 0, syxx = 0;
  for (let k = i; k <= j; k++) {
    const x = points[k].x, y = points[k].y;
    sx += x; sy += y; sxx += x * x; syy += y * y; sxy += x * y;
    sxxx += x * x * x; syyy += y * y * y; sxyy += x * y * y; syxx += y * x * x;
  }
  const C = n * sxx - sx * sx;
  const D = n * sxy - sx * sy;
  const E = n * sxxx + n * sxyy - (sxx + syy) * sx;
  const G = n * syy - sy * sy;
  const H = n * syyy + n * syxx - (sxx + syy) * sy;
  const denom = 2 * (C * G - D * D);
  if (Math.abs(denom) < 1e-9) return null;
  const cx = (E * G - D * H) / denom;
  const cy = (C * H - D * E) / denom;
  const r = Math.hypot(points[i].x - cx, points[i].y - cy);
  if (!Number.isFinite(r) || r < 1) return null;
  // Direction: signed area of first three vertices
  const a = points[i], b = points[i + 1], c = points[Math.min(j, i + 2)];
  const cross = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  return { cx, cy, r, cw: cross < 0 };
}

/** Naive shelf-packing nesting of axis-aligned rects into a sheet. */
export function nestRects(
  rects: { w: number; h: number; id: string }[],
  sheetW: number,
  sheetH: number,
  gap = 2,
) {
  const sorted = rects.slice().sort((a, b) => b.h - a.h);
  const placed: { id: string; x: number; y: number; w: number; h: number }[] = [];
  let x = 0, y = 0, rowH = 0;
  for (const r of sorted) {
    if (x + r.w > sheetW) { x = 0; y += rowH + gap; rowH = 0; }
    if (y + r.h > sheetH) break;
    placed.push({ id: r.id, x, y, w: r.w, h: r.h });
    x += r.w + gap;
    rowH = Math.max(rowH, r.h);
  }
  return placed;
}

/**
 * Rotational nesting: for each piece, tries the supplied rotations (0°/90°
 * by default) and picks the orientation that fits the current shelf with
 * least wasted height. Applies a safety margin around every piece.
 */
export function nestRectsRotational(
  rects: { w: number; h: number; id: string; allowRotate?: boolean }[],
  sheetW: number,
  sheetH: number,
  opts: { marginMm?: number; rotations?: number[] } = {},
) {
  const margin = opts.marginMm ?? 2;
  const rotations = opts.rotations ?? [0, 90];
  const sorted = rects.slice().sort((a, b) => Math.max(b.w, b.h) - Math.max(a.w, a.h));
  const placed: { id: string; x: number; y: number; w: number; h: number; rot: number }[] = [];
  const skipped: string[] = [];
  let x = 0, y = 0, rowH = 0;
  for (const r of sorted) {
    const options = (r.allowRotate === false ? [0] : rotations).map((rot) => {
      const rad = (rot * Math.PI) / 180;
      const s = Math.abs(Math.sin(rad)), c = Math.abs(Math.cos(rad));
      return { rot, w: r.w * c + r.h * s + margin * 2, h: r.w * s + r.h * c + margin * 2 };
    });
    // Prefer the option that fits current shelf; else the smallest overall.
    const fits = options.filter((o) => x + o.w <= sheetW && o.h <= rowH + 1e-6);
    const chosen = fits[0] ?? options.slice().sort((a, b) => a.w * a.h - b.w * b.h)[0];
    if (x + chosen.w > sheetW) { x = 0; y += rowH + margin; rowH = 0; }
    if (y + chosen.h > sheetH) { skipped.push(r.id); continue; }
    placed.push({ id: r.id, x: x + margin, y: y + margin, w: chosen.w - margin * 2, h: chosen.h - margin * 2, rot: chosen.rot });
    x += chosen.w + margin;
    rowH = Math.max(rowH, chosen.h);
  }
  const usedArea = placed.reduce((s, p) => s + p.w * p.h, 0);
  return { placed, skipped, efficiency: usedArea / (sheetW * sheetH) };
}

export function textileMetadata(input: {
  designName: string;
  authorId: string;
  yarnMeters: number;
  cmykProfile?: string;
  batchId?: string;
}) {
  return {
    schema: "cbm.textile.v1",
    createdAt: new Date().toISOString(),
    cmykProfile: input.cmykProfile ?? "Coated FOGRA39",
    batchId: input.batchId ?? crypto.randomUUID(),
    ...input,
  };
}
