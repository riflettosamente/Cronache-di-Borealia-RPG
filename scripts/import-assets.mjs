// Rigenera gli asset runtime partendo esclusivamente dai sorgenti locali.
// Non richiede GitHub: tutto il materiale originale e in assets-source/construct2.
// Uso: node scripts/import-assets.mjs
import fs from "fs";
import path from "path";
import sharp from "sharp";

const SOURCE = "assets-source/construct2";
const RIS = path.join(SOURCE, "risorse");
const OUT = "src/assets/game";
const DATA_DIR = "src/game/data";
const MAP_W = 1920;
const MAP_H = 1080;
const MASK_W = 640;
const MASK_H = 360;

if (!fs.existsSync(path.join(SOURCE, "data.js")) || !fs.existsSync(RIS)) {
  throw new Error("Sorgenti locali mancanti. Ripristina prima il backup con scripts/restore-backup.mjs");
}

fs.rmSync(OUT, { recursive: true, force: true });
for (const dir of ["enemies", "regions", "items", "sprites", "fonts", "cutouts"]) {
  fs.mkdirSync(path.join(OUT, dir), { recursive: true });
}

const project = JSON.parse(fs.readFileSync(path.join(SOURCE, "data.js"), "utf8").replace(/^﻿/, ""));
const types = project.project[3];
const basenameForType = (type) => {
  try {
    return type[7][0][7][0][0].replace(/-sheet\d\.png$/, "");
  } catch {
    return null;
  }
};
const basenames = types.map(basenameForType);
const typeIndex = (name) => {
  const index = basenames.findIndex((value) => value === name);
  if (index < 0) throw new Error(`Tipo Construct 2 non trovato: ${name}`);
  return index;
};

const game = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "game-data.json"), "utf8"));

// 1. Mappa originale convertita solo per il runtime. Il PNG originale resta nei sorgenti.
const mapPng = await sharp(path.join(RIS, "sfondo-sheet0.png"))
  .resize(MAP_W, MAP_H, { fit: "fill" })
  .png()
  .toBuffer();
const mapJpg = await sharp(mapPng).jpeg({ quality: 84, mozjpeg: true }).toBuffer();
fs.writeFileSync(path.join(OUT, "sprites/map.jpg"), mapJpg);

// 2. Estrazione dei frame dagli atlas originali Construct 2.
async function extractFrames(typeName, outputDir, prefix, quality) {
  const frames = types[typeIndex(typeName)][7][0][7];
  for (let i = 0; i < frames.length; i++) {
    const [file, , x, y, width, height] = frames[i];
    const output = `${prefix}-${String(i).padStart(2, "0")}.jpg`;
    await sharp(path.join(RIS, file))
      .extract({ left: x, top: y, width, height })
      .jpeg({ quality, mozjpeg: true })
      .toFile(path.join(OUT, outputDir, output));
  }
  return frames.length;
}

const enemyCount = await extractFrames("enemy", "enemies", "enemy", 78);
const regionBackgroundCount = await extractFrames("regionebackground", "regions", "region", 80);

// 3. Icone inventario: ritagli centrate sugli image point nominati originali.
const inventoryFrame = types[typeIndex("inventarioggetti")][7][0][7][0];
const [inventoryFile] = inventoryFrame;
const inventoryPoints = inventoryFrame[9].filter(
  ([name]) => name !== "closebutton" && !/^imagepoint/i.test(String(name)),
);
const INVENTORY_W = 812;
const INVENTORY_H = 658;
const ICON_SIZE = 76;
for (const [name, fx, fy] of inventoryPoints) {
  const cx = Math.round(fx * INVENTORY_W);
  const cy = Math.round(fy * INVENTORY_H);
  const left = Math.max(0, Math.min(INVENTORY_W - ICON_SIZE, cx - ICON_SIZE / 2));
  const top = Math.max(0, Math.min(INVENTORY_H - ICON_SIZE, cy - ICON_SIZE / 2));
  const safeName = String(name).replace(/[^a-z0-9àèéìòù]+/gi, "_").toLowerCase();
  await sharp(path.join(RIS, inventoryFile))
    .extract({ left, top, width: ICON_SIZE, height: ICON_SIZE })
    .webp({ quality: 88, alphaQuality: 92 })
    .toFile(path.join(OUT, "items", `${safeName}.webp`));
}

// 4. Raccoglibili e UI usati nella nuova versione.
for (const gatherable of game.gatherables) {
  const source = path.join(RIS, `${gatherable.id}-sheet0.png`);
  if (!fs.existsSync(source)) throw new Error(`Sprite raccoglibile mancante: ${source}`);
  await sharp(source)
    .webp({ quality: 90, alphaQuality: 94 })
    .toFile(path.join(OUT, "sprites", `${gatherable.id}.webp`));
}

for (const name of ["avatarpg", "sangue", "lanciodado", "gameover"]) {
  await sharp(path.join(RIS, `${name}-sheet0.png`))
    .webp({ quality: 90, alphaQuality: 94 })
    .toFile(path.join(OUT, "sprites", `${name}.webp`));
}
await sharp(path.join(RIS, "loading-logo.png"))
  .webp({ quality: 90, alphaQuality: 94 })
  .toFile(path.join(OUT, "sprites/loading-logo.webp"));
fs.copyFileSync(path.join(RIS, "primitive.ttf"), path.join(OUT, "fonts/primitive.ttf"));

// 5. Maschera hit-test e ritagli delle regioni dalle 23 alpha-map originali.
const regionOrder = game.regions.map((region) => ({
  region,
  sourceNumber: Number(region.key.replace("regione", "")),
}));
const alphaMaps = new Map();

for (const { region, sourceNumber } of regionOrder) {
  const source = path.join(RIS, `regione${sourceNumber}-sheet0.png`);
  const { data, info } = await sharp(source)
    .resize(MAP_W, MAP_H, { fit: "fill" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const alpha = new Uint8Array(MAP_W * MAP_H);
  let pixelCount = 0;
  for (let i = 0, sourceIndex = 3; i < alpha.length; i++, sourceIndex += info.channels) {
    alpha[i] = data[sourceIndex];
    if (alpha[i] > 40) pixelCount++;
  }
  alphaMaps.set(region.id, { alpha, pixelCount });
}

// Le regioni piccole prevalgono nelle sovrapposizioni, come nel progetto originale.
regionOrder.sort(
  (a, b) => alphaMaps.get(b.region.id).pixelCount - alphaMaps.get(a.region.id).pixelCount,
);

const maskIndex = new Uint8Array(MASK_W * MASK_H);
for (const { region } of regionOrder) {
  const { alpha } = alphaMaps.get(region.id);
  for (let y = 0; y < MASK_H; y++) {
    const sy = Math.min(MAP_H - 1, Math.floor(((y + 0.5) / MASK_H) * MAP_H));
    for (let x = 0; x < MASK_W; x++) {
      const sx = Math.min(MAP_W - 1, Math.floor(((x + 0.5) / MASK_W) * MAP_W));
      if (alpha[sy * MAP_W + sx] > 40) maskIndex[y * MASK_W + x] = region.id + 1;
    }
  }
}

const rle = [];
for (let i = 0; i < maskIndex.length;) {
  const value = maskIndex[i];
  let count = 0;
  while (i < maskIndex.length && maskIndex[i] === value) {
    count++;
    i++;
  }
  rle.push(value, count);
}
fs.writeFileSync(path.join(DATA_DIR, "regionmask.json"), JSON.stringify({ w: MASK_W, h: MASK_H, rle }));

const cutouts = [];
for (const { region } of regionOrder) {
  const { alpha } = alphaMaps.get(region.id);
  let x0 = MAP_W;
  let y0 = MAP_H;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      if (alpha[y * MAP_W + x] <= 40) continue;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  const padding = 4;
  x0 = Math.max(0, x0 - padding);
  y0 = Math.max(0, y0 - padding);
  x1 = Math.min(MAP_W - 1, x1 + padding);
  y1 = Math.min(MAP_H - 1, y1 + padding);
  const width = x1 - x0 + 1;
  const height = y1 - y0 + 1;
  const rawMask = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const sourceIndex = (y0 + y) * MAP_W + (x0 + x);
      const outputIndex = (y * width + x) * 4;
      const value = Math.min(255, alpha[sourceIndex] * 2);
      rawMask[outputIndex] = 255;
      rawMask[outputIndex + 1] = 255;
      rawMask[outputIndex + 2] = 255;
      rawMask[outputIndex + 3] = value;
    }
  }
  const mask = await sharp(rawMask, { raw: { width, height, channels: 4 } }).png().toBuffer();
  const file = `cutouts/cut-${String(region.id).padStart(2, "0")}.webp`;
  await sharp(mapPng)
    .extract({ left: x0, top: y0, width, height })
    .composite([{ input: mask, blend: "dest-in" }])
    .webp({ quality: 88, alphaQuality: 94 })
    .toFile(path.join(OUT, file));
  cutouts.push({ id: region.id, x: x0, y: y0, w: width, h: height, file });
}
cutouts.sort((a, b) => a.id - b.id);
fs.writeFileSync(path.join(DATA_DIR, "cutouts.json"), JSON.stringify(cutouts, null, 1));

// Percorsi runtime idempotenti.
game.monsters.forEach((monster) => {
  monster.img = monster.img.replace(/\/(enemy-\d+)\.[^/]+$/, "/$1.jpg");
});
game.regions.forEach((region) => {
  region.bg = region.bg.replace(/\/(region-\d+)\.[^/]+$/, "/$1.jpg");
});
game.gatherables.forEach((gatherable) => {
  gatherable.sprite = gatherable.sprite.replace(/\.[^/.]+$/, ".webp");
});
game.items = game.items.filter((item) => !/^imagepoint/i.test(item.id));
game.items.forEach((item) => {
  item.icon = item.icon.replace(/\.[^/.]+$/, ".webp");
});
fs.writeFileSync(path.join(DATA_DIR, "game-data.json"), JSON.stringify(game, null, 1));

console.log(`Importazione completata:
  mappa: ${MAP_W}x${MAP_H}
  maschere originali: ${regionOrder.length}
  ritagli regione: ${cutouts.length}
  sfondi regione: ${regionBackgroundCount}
  carte mostro: ${enemyCount}
  raccoglibili: ${game.gatherables.length}
  icone inventario: ${inventoryPoints.length}`);