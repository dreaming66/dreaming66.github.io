// Procedural, tileable ground materials (colour + normal + roughness maps), generated on a canvas at load time:
// no image assets, nothing to license. Visual only: the physics floor (friction etc.) is unchanged.
import * as THREE from "three";

let N = 1024;                         // texture resolution (one tile); phones use 512
export function setGroundResolution(n) { N = n; }

// ---------------------------------------------------------------- tileable noise
function hash(x, y, seed) {
  let h = (x * 374761393 + y * 668265263 + seed * 1442695041) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
// value noise on a periodic lattice of `cells` cells per tile (so the texture tiles seamlessly)
function vnoise(u, v, cells, seed, cellsV = cells) {     // cellsV != cells: stretched (wood grain)
  const x = u * cells, y = v * cellsV, xi = Math.floor(x), yi = Math.floor(y);
  const fx = x - xi, fy = y - yi, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  const wx = c => ((c % cells) + cells) % cells, wy = c => ((c % cellsV) + cellsV) % cellsV;
  const a = hash(wx(xi), wy(yi), seed), b = hash(wx(xi + 1), wy(yi), seed);
  const c = hash(wx(xi), wy(yi + 1), seed), d = hash(wx(xi + 1), wy(yi + 1), seed);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}
function fbm(u, v, cells, oct, seed, cellsV = cells) {
  let s = 0, amp = 0.5, norm = 0;
  for (let o = 0; o < oct; o++) {
    s += amp * vnoise(u, v, cells << o, seed + o * 17, cellsV << o); norm += amp; amp *= 0.5;
  }
  return s / norm;
}

// ---------------------------------------------------------------- material recipes: fill rgb[3N²], h[N²], rough[N²]
const RECIPES = {
  concrete: { label: "混凝土", tile: 2.0, fill(rgb, h, r) {        // 2 m tile, saw-cut joints at 1 m
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const u = i / N, v = j / N, k = j * N + i;
      const base = fbm(u, v, 6, 5, 1), grit = vnoise(u, v, 256, 7), stain = fbm(u, v, 3, 3, 9);
      let hh = 0.5 + 0.25 * (fbm(u, v, 24, 4, 3) - 0.5);
      if (grit > 0.93) hh -= 0.35 * (grit - 0.93) / 0.07;           // small pores
      const g = 0.62 + 0.16 * (base - 0.5) + 0.06 * (grit - 0.5) - 0.10 * Math.max(0, stain - 0.6);
      let c = [g * 0.98, g * 0.98, g * 1.0];
      const ju = Math.min(u % 0.5, 0.5 - (u % 0.5)), jv = Math.min(v % 0.5, 0.5 - (v % 0.5));
      const joint = Math.min(ju, jv) * N;                           // px to the nearest joint line
      if (joint < 2.2) { hh -= 0.6 * (1 - joint / 2.2); c = c.map(x => x * 0.62); }
      rgb.set(c, 3 * k); h[k] = hh; r[k] = 0.78 + 0.15 * (base - 0.5) + (joint < 2.2 ? 0.1 : 0);
    }
  } },
  wood: { label: "木地板", tile: 1.6, fill(rgb, h, r) {            // 8 planks of 20 cm, staggered ends
    const planks = 8, pieces = [2, 3, 2, 4, 3, 2, 3, 4];           // boards per row: lengths divide the tile
    for (let j = 0; j < N; j++) {
      const v = j / N, p = Math.floor(v * planks), pv = v * planks - p;
      for (let i = 0; i < N; i++) {
        const u = i / N, k = j * N + i;
        const off = hash(p, 3, 5), L = 1 / pieces[p];
        const x = (u + off) % 1, pu = (x % L) / L, seg = Math.floor(x / L);
        const tint = hash(p, seg, 11) - 0.5;
        // grain: noise stretched along the plank, plus fine streaks
        const grain = fbm(x, v, 3, 4, 21 + p, 128);                  // long along the board, fine across
        const figure = fbm(x, v, 2, 2, 61 + p, 16);                   // broad light/dark figure per board
        const streak = Math.sin((v * planks * 6 + 4 * figure + 2 * grain) * 2 * Math.PI) * 0.5 + 0.5;
        const lum = 0.56 + 0.16 * tint + 0.16 * (grain - 0.5) + 0.08 * (figure - 0.5) + 0.03 * (streak - 0.5);
        let c = [lum * 0.80, lum * 0.57, lum * 0.37];
        let hh = 0.5 + 0.015 * (grain - 0.5);                         // almost flat: varnished boards
        const edge = Math.min(pv, 1 - pv) * N / planks, endEdge = Math.min(pu, 1 - pu) * L * N;
        if (edge < 1.6 || endEdge < 1.6) { hh -= 0.5; c = c.map(x => x * 0.55); }
        rgb.set(c, 3 * k); h[k] = hh; r[k] = 0.34 + 0.1 * (grain - 0.5);
      }
    }
  } },
  grass: { label: "草地", tile: 2.5, fill(rgb, h, r) {
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const u = i / N, v = j / N, k = j * N + i;
      const patch = fbm(u, v, 5, 4, 41), blades = vnoise(u, v, 320, 43), fine = vnoise(u, v, 640, 47);
      const dry = Math.max(0, fbm(u, v, 3, 3, 49) - 0.62) * 2.5;
      const lum = 0.42 + 0.16 * (patch - 0.5) + 0.22 * (blades - 0.5) + 0.1 * (fine - 0.5);
      const c = [lum * (0.42 + 0.5 * dry), lum * (0.78 - 0.1 * dry), lum * (0.28 + 0.05 * dry)];
      rgb.set(c, 3 * k); h[k] = 0.5 + 0.35 * (blades - 0.5) + 0.2 * (fine - 0.5); r[k] = 0.9;
    }
  } },
  checker: { label: "棋盘格", tile: 1.0, fill(rgb, h, r, dark) {   // the original look, 8 x 12.5 cm squares
    const a = dark ? [0.105, 0.105, 0.094] : [0.91, 0.89, 0.84], b = dark ? [0.135, 0.135, 0.12] : [0.86, 0.83, 0.77];
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const k = j * N + i, odd = (Math.floor(i * 8 / N) + Math.floor(j * 8 / N)) % 2;
      rgb.set(odd ? a : b, 3 * k); h[k] = 0.5; r[k] = 0.95;
    }
  } },
};

export const GROUNDS = Object.fromEntries(Object.entries(RECIPES).map(([k, v]) => [k, v.label]));

function toTexture(fillPixel, srgb) {
  const cv = document.createElement("canvas");
  cv.width = cv.height = N;
  const g = cv.getContext("2d"), img = g.createImageData(N, N);
  for (let k = 0; k < N * N; k++) {
    const [r, gg, b] = fillPixel(k);
    img.data[4 * k] = r; img.data[4 * k + 1] = gg; img.data[4 * k + 2] = b; img.data[4 * k + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(cv);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const cache = new Map();
export function groundMaterial(kind, renderer, dark) {
  const key = kind + (kind === "checker" && dark ? "-dark" : "");
  if (cache.has(key)) return cache.get(key);
  const R = RECIPES[kind] || RECIPES.concrete;
  const rgb = new Float32Array(3 * N * N), h = new Float32Array(N * N), rough = new Float32Array(N * N);
  R.fill(rgb, h, rough, dark);
  const clamp = x => Math.max(0, Math.min(255, Math.round(x * 255)));
  const map = toTexture(k => [clamp(rgb[3 * k]), clamp(rgb[3 * k + 1]), clamp(rgb[3 * k + 2])], true);
  // tangent-space normal map from the height field (wrapped central differences)
  const strength = 6.0;
  const normalMap = toTexture(k => {
    const i = k % N, j = (k - i) / N;
    const dx = h[j * N + (i + 1) % N] - h[j * N + (i + N - 1) % N];
    const dy = h[((j + 1) % N) * N + i] - h[((j + N - 1) % N) * N + i];
    let nx = -dx * strength, ny = dy * strength, nz = 1;
    const l = Math.hypot(nx, ny, nz);
    return [clamp(0.5 + 0.5 * nx / l), clamp(0.5 + 0.5 * ny / l), clamp(0.5 + 0.5 * nz / l)];
  }, false);
  const roughnessMap = toTexture(k => { const v = clamp(rough[k]); return [v, v, v]; }, false);
  const aniso = renderer.capabilities.getMaxAnisotropy();
  for (const t of [map, normalMap, roughnessMap]) { t.anisotropy = aniso; t.repeat.set(80 / R.tile, 80 / R.tile); }
  const mat = new THREE.MeshStandardMaterial({ map, normalMap, roughnessMap, roughness: 1, metalness: 0 });
  mat.normalScale.set(1, 1);
  cache.set(key, mat);
  return mat;
}
