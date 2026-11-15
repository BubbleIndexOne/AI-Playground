/**
 * Blobbies Living Avatar Engine
 * Pure mathematical vector contour calculations, procedural RNG, and cubic morphing.
 */

export interface BlobbieConfig {
  sides: number; // 0 for circle, 3 (triangle), 4 (square), 5 (pentagon), 6 (hexagon)
  round: number; // Contour roundness: 0.0 - 1.0
  bumps: number; // Cloud bumps: 0.0 - 0.14
  point: number; // Teardrop tip: 0.0 - 0.6
  pa: number; // Point angle: -3.0 to -1.8
  sx: number; // Width scale: 0.7 - 1.3
  sy: number; // Height scale: 0.7 - 1.3
  rot: number; // Rotation angle: -1.6 - 1.6
  color: string; // Hex color code
  es: number; // Eye size: 0.6 - 1.4
  tilt: number; // Eye tilt: -0.5 - 0.7
  sp: number; // Eye spacing: 0.15 - 0.55
  fx: number; // Face position X: -0.25 - 0.35
  fy: number; // Face position Y: -0.4 - 0.15
}

export const BLOBBIE_PALETTE = [
  '#ffffff',
  '#ff9500',
  '#825b35',
  '#0e72e8',
  '#e2233a',
  '#e0308a',
  '#00a05a',
  '#00a590',
  '#737373',
  '#8a4fe0',
  '#ff6a00',
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ec4899',
  '#6366f1',
] as const;

export const CONTOUR_POINTS = 96;
const TAU = Math.PI * 2;

/**
 * SplitMix32 / Murmur-inspired pseudo-random generator seeded from string.
 */
function createSeededRng(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

/**
 * Deterministically generates a unique Blobbie configuration from a seed string.
 */
export function fromSeed(seed: string): BlobbieConfig {
  const r = createSeededRng(seed || 'agent');
  const isCircle = r() < 0.28;
  const isTeardrop = r() < 0.35;
  const polygonSides = [3, 4, 4, 5, 6, 6];

  return {
    sides: isCircle ? 0 : polygonSides[(r() * polygonSides.length) | 0],
    round: 0.25 + r() * 0.55,
    bumps: r() < 0.12 ? 0.07 : 0,
    point: isTeardrop ? 0.25 + r() * 0.25 : 0,
    pa: -2.4 + (r() - 0.5) * 1.2,
    sx: 0.88 + r() * 0.24,
    sy: 0.88 + r() * 0.24,
    rot: (r() - 0.5) * 0.9,
    color: BLOBBIE_PALETTE[(r() * BLOBBIE_PALETTE.length) | 0],
    es: 0.85 + r() * 0.3,
    tilt: 0.15 + r() * 0.25,
    sp: 0.3 + r() * 0.12,
    fx: r() * 0.22 - 0.02,
    fy: -0.12 - r() * 0.12,
  };
}

/**
 * Generates a completely new random Blobbie configuration.
 */
export function generateRandomBlobbie(): BlobbieConfig {
  const randomSeed = Math.random().toString(36).substring(2, 10);
  return fromSeed(randomSeed);
}

/**
 * Pre-calculates 96 normalized 2D contour points for a Blobbie configuration.
 */
export function calculateContourPoints(p: BlobbieConfig): Float32Array {
  const a = new Float32Array(CONTOUR_POINTS * 2);
  const cosRot = Math.cos(p.rot);
  const sinRot = Math.sin(p.rot);
  let maxHypot = 0;

  for (let i = 0; i < CONTOUR_POINTS; i++) {
    const t = (i / CONTOUR_POINTS) * TAU;
    let r = 1;

    if (p.sides >= 3) {
      const q = TAU / p.sides;
      const m = ((((t + 1.5708) % q) + q) % q) - q / 2;
      r = Math.cos(Math.PI / p.sides) / Math.cos(m);
      r += (1 - r) * p.round;
    }

    r *= 1 + p.bumps * Math.cos(6 * t + 1);
    const d = Math.atan2(Math.sin(t - p.pa), Math.cos(t - p.pa));
    r += p.point * Math.exp((-d * d) / 0.3);

    const x = r * Math.cos(t) * p.sx;
    const y = r * Math.sin(t) * p.sy;

    a[2 * i] = x * cosRot - y * sinRot;
    a[2 * i + 1] = x * sinRot + y * cosRot;
    maxHypot = Math.max(maxHypot, Math.hypot(a[2 * i], a[2 * i + 1]));
  }

  const normalizer = maxHypot > 0 ? maxHypot : 1;
  for (let i = 0; i < a.length; i++) {
    a[i] /= normalizer;
  }
  return a;
}

/**
 * Hex color parsing helper.
 */
function parseHex(hex: string): [number, number, number] {
  const clean = hex.startsWith('#') ? hex.slice(1) : hex;
  if (clean.length === 3) {
    return [
      parseInt(clean[0] + clean[0], 16) || 0,
      parseInt(clean[1] + clean[1], 16) || 0,
      parseInt(clean[2] + clean[2], 16) || 0,
    ];
  }
  return [
    parseInt(clean.slice(0, 2), 16) || 0,
    parseInt(clean.slice(2, 4), 16) || 0,
    parseInt(clean.slice(4, 6), 16) || 0,
  ];
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Cubic smooth easing: m * m * (3 - 2 * m)
 */
export function easeInOutCubic(m: number): number {
  const clamped = Math.max(0, Math.min(1, m));
  return clamped * clamped * (3 - 2 * clamped);
}

const INTERPOLATABLE_KEYS: Array<keyof BlobbieConfig> = [
  'round',
  'bumps',
  'point',
  'pa',
  'sx',
  'sy',
  'rot',
  'es',
  'tilt',
  'sp',
  'fx',
  'fy',
];

/**
 * Interpolates smoothly between two Blobbie configs.
 */
export function interpolateBlobbie(
  from: BlobbieConfig,
  to: BlobbieConfig,
  progress: number
): BlobbieConfig {
  const k = easeInOutCubic(progress);
  const result: BlobbieConfig = { ...to };

  for (const key of INTERPOLATABLE_KEYS) {
    result[key] = lerp(from[key] as number, to[key] as number, k);
  }

  // Interpolate color in RGB space
  const rgbA = parseHex(from.color);
  const rgbB = parseHex(to.color);
  const r = Math.round(lerp(rgbA[0], rgbB[0], k));
  const g = Math.round(lerp(rgbA[1], rgbB[1], k));
  const b = Math.round(lerp(rgbA[2], rgbB[2], k));
  result.color = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;

  return result;
}
