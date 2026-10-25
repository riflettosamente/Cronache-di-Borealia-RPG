// Motore di gioco — ricostruzione fedele dei dati decodificati da rpg.alfa.0.15
import raw from "@/game/data/game-data.json";

// ---------- Tipi dati recuperati ----------
export interface RegionData { id: number; key: string; name: string; biome: string; bg: string; poly: [number, number][]; centroid: [number, number]; }
export interface MonsterData {
  frame: number;
  name: string;
  img: string;
  points: Record<string, [number, number]>;
  baseTier: string | null;
  pv: number;
  att: number;
  par: number;
  imp: string;
  pro: number;
  xp: number;
}
export interface TierStat { pv: number; att: number; par: number; imp: string; pro: number; xp: number; }
export interface GatherData { id: string; sprite: string; categoria: string; professione: string; loot: [string, number][]; azione: string; }
export interface ItemData { id: string; name: string; icon: string; }

interface Raw {
  regions: RegionData[]; monsters: MonsterData[]; tierStats: Record<string, TierStat>;
  biomePools: Record<string, Record<string, number[]>>; zoneTables: Record<string, string[]>;
  gatherables: GatherData[]; items: ItemData[]; fuga: string[];
  rarityChances: [number, string][]; spawnChance: number;
  statsPG: { PATT: number; PPAR: number; PPRO: number; PIMP: number; PV: number; PVmax: number; arma: string };
}
export const DATA = raw as unknown as Raw;

export const REGIONS = DATA.regions;
export const MONSTERS = DATA.monsters;
export const ITEMS = DATA.items.filter((i) => !i.id.startsWith("imagepoint"));
export const GATHERABLES = DATA.gatherables;
export const FUGA_TEXTS = DATA.fuga;

// zona -> tabella raccolta (bioma regione, dal tilebloczone originale)
const BIOME_TO_ZONE: Record<string, string> = {
  pianura: "pianura", foresta: "bosco", montagna: "montagne",
  deserto: "deserto", palude: "palude", isola: "mare", mare: "mare",
};

// alias display loot -> id icona inventario (dai punti immagine originali)
const LOOT_ICON_ALIAS: Record<string, string> = {
  "Rametti": "rametto", "Ceppo di legno": "ceppo", "Fungo commestibile": "fungo_commestibile",
  "Fungo velenoso": "fungo_velenoso", "Fungo magico": "fungo_magico", "Tarassaco": "tarassaco",
  "Stella alpina": "stella_alpina", "Primule": "primula", "Radici": "radici", "Rampicanti": "rampicanti",
  "Muschio": "muschio", "Agave": "agave", "Cactus": "cactus", "Libellula": "libellula",
  "Uova di ragno": "uova_di_ragno", "Farfalla": "farfalla", "Piuma": "piuma", "Ossa": "ossa",
  "Uovo": "uovo", "Cosce di rana": "cosce_di_rana", "Coda di salamandra": "coda_di_salamandra",
  "Carne cruda": "carne_cruda", "Corna di cervo": "corna_di_cervo", "Artigli": "artigli",
  "Pelliccia": "pelliccia", "Alghe": "alghe", "Conchiglie": "conchiglia", "Cozza": "cozza",
  "Stella marina": "stella_marina", "Gamberetto": "gamberetto", "Polipo": "polipo",
  "Trancio di pesce": "trancio_di_pesce", "Chele di granchio": "chele_di_granchio", "Stagno": "stagno",
  "Rame": "rame", "Ferro": "ferro", "Fossili": "fossili", "Quarzo": "quarzo", "Ametista": "ametista",
  "Oro": "oro", "Gemma": "gemma",
};
export function iconForLoot(name: string): string {
  const id = LOOT_ICON_ALIAS[name];
  const it = ITEMS.find((i) => i.id === id);
  return it ? it.icon : "items/rametto.webp";
}
export function lootIconId(name: string): string | null { return LOOT_ICON_ALIAS[name] ?? null; }

export function hasBoat(inventory: Record<string, number>): boolean {
  return Object.keys(inventory).some((k) =>
    /zattera|barca|canoa|piroga|nave|imbarcazione|raft|boat/i.test(k) && (inventory[k] ?? 0) > 0
  );
}

// ---------- Utilità ----------
export const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
export const choice = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
export function rollSpec(spec: string): number {
  // "1D4", "1D6"...
  const m = spec.match(/(\d+)D(\d+)/i);
  if (!m) return 1;
  const n = parseInt(m[1], 10), f = parseInt(m[2], 10);
  let s = 0;
  for (let i = 0; i < n; i++) s += rand(1, f);
  return s;
}

// ---------- Stato del PG (valori iniziali decodificati) ----------
export interface PG {
  att: number; par: number; pro: number; imp: number;
  pv: number; pvmax: number; arma: string;
  xp: number; livello: number;
}
export interface Professione { livello: number; xp: number; }
export interface Spawn { key: number; gid: string; x: number; y: number; }
export interface Enemy {
  frame: number; name: string; img: string; tier: string;
  pv: number; pvmax: number; att: number; par: number; imp: string; pro: number; xpReward: number;
}

export const PROFESSIONI = [
  "Erboristeria",
  "Taglialegna",
  "Caccia",
  "Pesca",
  "Estrazione",
] as const;

export function initPG(): PG {
  const s = DATA.statsPG;
  return { att: s.PATT, par: s.PPAR, pro: s.PPRO, imp: s.PIMP, pv: s.PV, pvmax: s.PVmax, arma: s.arma, xp: 0, livello: 1 };
}
export function initProfessioni(): Record<string, Professione> {
  const o: Record<string, Professione> = {};
  for (const p of PROFESSIONI) o[p] = { livello: 1, xp: 0 };
  return o;
}

// ---------- Rarità e generazione nemici (decodificato) ----------
export function rollRarity(): string {
  const r = rand(1, 100);
  for (const [lim, tier] of DATA.rarityChances) if (r <= lim) return tier;
  return "comune";
}
export function spawnEnemy(biome: string): Enemy {
  const tier0 = rollRarity();
  const pools = DATA.biomePools[biome] ?? DATA.biomePools.pianura;
  let tier = tier0;
  let pool = pools[tier0];
  if (!pool || pool.length === 0) { tier = "comune"; pool = pools.comune; }
  const frame = choice(pool);
  const m = MONSTERS[frame];
  const effTier = m.baseTier ?? tier;
  const ts = DATA.tierStats[effTier] ?? DATA.tierStats.comune;
  const basePv = m.pv ?? ts.pv;
  const jitter = Math.max(1, Math.round(basePv * (0.85 + Math.random() * 0.3)));
  return {
    frame, name: m.name, img: m.img, tier: effTier,
    pv: jitter, pvmax: jitter,
    att: m.att ?? ts.att,
    par: m.par ?? ts.par,
    imp: m.imp ?? ts.imp,
    pro: m.pro ?? ts.pro,
    xpReward: m.xp ?? ts.xp,
  };
}

// ---------- Esplorazione ----------
export function zoneTableFor(biome: string): string[] {
  const z = BIOME_TO_ZONE[biome] ?? "pianura";
  return DATA.zoneTables[z] ?? [];
}
export function rollSpawns(biome: string): Spawn[] {
  const table = zoneTableFor(biome);
  const n = rand(3, 6);
  const picked = new Set<string>();
  let guard = 0;
  while (picked.size < n && guard++ < 30) picked.add(choice(table));
  let key = 0;
  return [...picked].map((gid) => ({
    key: key++, gid,
    x: 12 + Math.random() * 70, y: 22 + Math.random() * 60,
  }));
}
export function professionLevelFor(xp: number): number { return 1 + Math.floor(xp / 5); }

/** Linee loot di una raccolta; a livello professione alto chance di raddoppio */
export function gatherLoot(g: GatherData, prof?: Professione): [string, number][] {
  const level = prof ? prof.livello : 1;
  const mult = Math.random() < Math.min(0.45, (level - 1) * 0.08) ? 2 : 1;
  return g.loot.map(([n, q]) => [n, q * mult] as [string, number]);
}

// ---------- Cibi (survival) ----------
export const EDIBLE: Record<string, number> = {
  carne_cruda: 8, trancio_di_pesce: 8, cosce_di_rana: 5, coda_di_salamandra: 5,
  cozza: 4, polipo: 6, gamberetto: 4, alghe: 3, fungo_commestibile: 12, fungo_magico: 30,
  fungo_velenoso: -25, uovo: 5,
};

// ---------- Combattimento (D20 + dado arma, ricostruito sui dati decodificati) ----------
export interface AttackResult { hit: boolean; roll: number; total: number; target: number; dmg: number; crit: boolean; }
export function attack(attacker: { att: number; dado: string; imp: number }, defender: { par: number }): AttackResult {
  const roll = rand(1, 20);
  const total = roll + attacker.att;
  const target = 10 + defender.par;
  const crit = roll === 20;
  const hit = crit || (roll > 1 && total >= target);
  const dmg = hit ? Math.max(1, rollSpec(attacker.dado) + attacker.imp + (crit ? attacker.att : 0)) : 0;
  return { hit, roll, total, target, dmg, crit };
}
export function tryFuga(pgImp: number): boolean {
  return rand(1, 20) + pgImp >= 12;
}
export function xpForLevel(livello: number): number { return livello * 150; }
