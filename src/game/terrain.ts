// Terreno e navigazione, dai tilemap originali del progetto Construct 2
// t122 = tilebloc  (tile presente = zona invalicabile: mare / barriere)
// t131 = tilebloczone (1..7 = tipo di terreno mostrato nel riquadro info)
import maps from "@/game/data/tilemaps.json";
import mask from "@/game/data/regionmask.json";

interface TileMap { cols: number; rows: number; cells: number[] }
const BLOCK = (maps as Record<string, TileMap>).t122;
const ZONE = (maps as Record<string, TileMap>).t131;

export const MAP_W = 1920;
export const MAP_H = 1080;
export const COLS = BLOCK.cols;
export const ROWS = BLOCK.rows;
const CW = MAP_W / COLS;
const CH = MAP_H / ROWS;

/** nomi originali delle 7 zone (dall'event sheet "overlay zone") */
export const TERRAIN: Record<number, string> = {
  1: "Mare", 2: "Palude", 3: "Deserto", 4: "Pianura",
  5: "Fiume o Lago", 6: "Bosco o Foresta", 7: "Montagne",
};

/** colori del layer zone (overlay tattico sulla mappa) */
export const TERRAIN_COLORS: Record<number, string> = {
  1: "#2e6b8a", 2: "#6b7c46", 3: "#c9a24b", 4: "#7fa055",
  5: "#3d8fa8", 6: "#3e6b34", 7: "#8d8d94",
};

export const toCell = (x: number, y: number) => ({ c: Math.floor(x / CW), r: Math.floor(y / CH) });
export const toPoint = (c: number, r: number) => ({ x: (c + 0.5) * CW, y: (r + 0.5) * CH });

function cellVal(m: TileMap, c: number, r: number) {
  if (c < 0 || r < 0 || c >= m.cols || r >= m.rows) return -1;
  return m.cells[r * m.cols + c];
}

/** tipo di terreno sotto un punto ("Mare aperto" se fuori dalle zone mappate) */
export function terrainAt(x: number, y: number): string {
  const { c, r } = toCell(x, y);
  const v = cellVal(ZONE, c, r);
  return TERRAIN[v] ?? "Mare aperto";
}

/* ---- maschera delle regioni: sagome reali prese dall'alpha di regioneN-sheet0.png ---- */
const MW = mask.w, MH = mask.h;
const REGION_MASK = (() => {
  const a = new Uint8Array(MW * MH);
  const rle = mask.rle as number[];
  let p = 0;
  for (let i = 0; i < rle.length; i += 2) {
    const v = rle[i], n = rle[i + 1];
    if (v !== 0) a.fill(v, p, p + n);
    p += n;
  }
  return a;
})();

const AVATAR_RADIUS = 18; // px on 1920x1080 map

function regionAtPoint(x: number, y: number): number | null {
  const gx = Math.floor((x / MAP_W) * MW);
  const gy = Math.floor((y / MAP_H) * MH);
  if (gx < 0 || gy < 0 || gx >= MW || gy >= MH) return null;
  const v = REGION_MASK[gy * MW + gx];
  return v === 0 ? null : v - 1;
}

/** regione sotto il bounding box circolare del personaggio */
export function regionAt(x: number, y: number): number | null {
  const rId = regionAtPoint(x, y);
  if (rId !== null) return rId;

  const offsets = [
    [AVATAR_RADIUS, 0],
    [-AVATAR_RADIUS, 0],
    [0, AVATAR_RADIUS],
    [0, -AVATAR_RADIUS],
    [AVATAR_RADIUS * 0.7, AVATAR_RADIUS * 0.7],
    [-AVATAR_RADIUS * 0.7, AVATAR_RADIUS * 0.7],
    [AVATAR_RADIUS * 0.7, -AVATAR_RADIUS * 0.7],
    [-AVATAR_RADIUS * 0.7, -AVATAR_RADIUS * 0.7],
  ];
  for (const [dx, dy] of offsets) {
    const id = regionAtPoint(x + dx, y + dy);
    if (id !== null) return id;
  }
  return null;
}

/* ---- layer zone + blocchi, per gli overlay sulla mappa ---- */
export interface OverlayCell { c: number; r: number; x: number; y: number; w: number; h: number; zone: number; blocked: boolean }
export const OVERLAY_CELLS: OverlayCell[] = (() => {
  const out: OverlayCell[] = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const zone = cellVal(ZONE, c, r);
    const blocked = cellVal(BLOCK, c, r) !== -1 && regionAtPoint((c + 0.5) * CW, (r + 0.5) * CH) === null;
    if (zone === -1 && !blocked) continue;
    out.push({ c, r, x: c * CW, y: r * CH, w: CW, h: CH, zone, blocked });
  }
  return out;
})();

/** una cella è percorribile se non ha tile di blocco, oppure se cade dentro una regione (o se è mare/acqua aperta e si ha la barca) */
function walkableCell(c: number, r: number, hasBoat: boolean = false): boolean {
  if (c < 0 || r < 0 || c >= COLS || r >= ROWS) return false;
  const zone = cellVal(ZONE, c, r);
  const p = toPoint(c, r);
  const isBlocked = cellVal(BLOCK, c, r) !== -1;
  const isSea = zone === 1 || (isBlocked && regionAtPoint(p.x, p.y) === null);

  if (isSea) {
    return hasBoat;
  }
  if (cellVal(BLOCK, c, r) === -1) return true;
  return regionAtPoint(p.x, p.y) !== null;
}

export function isWalkable(x: number, y: number, hasBoat: boolean = false): boolean {
  const offsets = [
    [0, 0],
    [AVATAR_RADIUS, 0],
    [-AVATAR_RADIUS, 0],
    [0, AVATAR_RADIUS],
    [0, -AVATAR_RADIUS],
    [AVATAR_RADIUS * 0.7, AVATAR_RADIUS * 0.7],
    [-AVATAR_RADIUS * 0.7, AVATAR_RADIUS * 0.7],
    [AVATAR_RADIUS * 0.7, -AVATAR_RADIUS * 0.7],
    [-AVATAR_RADIUS * 0.7, -AVATAR_RADIUS * 0.7],
  ];
  for (const [dx, dy] of offsets) {
    const nx = x + dx;
    const ny = y + dy;
    const { c, r } = toCell(nx, ny);
    if (!walkableCell(c, r, hasBoat)) return false;
  }
  return true;
}

/** Ricerca del percorso sulla griglia 60x33: l'avatar aggira mare e barriere e si ferma al confine se destinazione non calpestabile */
export function findPath(from: { x: number; y: number }, to: { x: number; y: number }, hasBoat: boolean = false) {
  const s = toCell(from.x, from.y);
  let g = toCell(to.x, to.y);

  if (!walkableCell(g.c, g.r, hasBoat)) {
    let bestC = -1, bestR = -1, minDst = Infinity;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (walkableCell(c, r, hasBoat)) {
          const pt = toPoint(c, r);
          const dst = (pt.x - to.x) ** 2 + (pt.y - to.y) ** 2;
          if (dst < minDst) {
            minDst = dst;
            bestC = c;
            bestR = r;
          }
        }
      }
    }
    if (bestC === -1) return null;
    g = { c: bestC, r: bestR };
  }

  if (s.c === g.c && s.r === g.r) return [{ x: to.x, y: to.y }];

  const key = (c: number, r: number) => r * COLS + c;
  const prev = new Map<number, number>();
  const seen = new Set<number>([key(s.c, s.r)]);
  let frontier = [[s.c, s.r] as [number, number]];
  const DIRS: [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
  let found = false;

  while (frontier.length && !found) {
    const next: [number, number][] = [];
    for (const [c, r] of frontier) {
      for (const [dc, dr] of DIRS) {
        const nc = c + dc, nr = r + dr;
        if (!walkableCell(nc, nr, hasBoat)) continue;
        // niente "taglio" diagonale fra due ostacoli
        if (dc && dr && (!walkableCell(c + dc, r, hasBoat) || !walkableCell(c, r + dr, hasBoat))) continue;
        const k = key(nc, nr);
        if (seen.has(k)) continue;
        seen.add(k);
        prev.set(k, key(c, r));
        if (nc === g.c && nr === g.r) { found = true; break; }
        next.push([nc, nr]);
      }
      if (found) break;
    }
    frontier = next;
  }
  if (!found) return null;

  const path: { x: number; y: number }[] = [];
  let cur = key(g.c, g.r);
  const start = key(s.c, s.r);
  while (cur !== start) {
    const r = Math.floor(cur / COLS), c = cur % COLS;
    path.push(toPoint(c, r));
    const p = prev.get(cur);
    if (p === undefined) break;
    cur = p;
  }
  path.reverse();
  // l'ultimo passo va esattamente dove ho cliccato
  if (path.length) path[path.length - 1] = { x: to.x, y: to.y };
  return path;
}
