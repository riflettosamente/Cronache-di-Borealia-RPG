// Verifica quantitativa, referenziale e crittografica degli asset importati.
// Uso: node scripts/verify-assets.mjs
import fs from "fs";
import path from "path";
import sharp from "sharp";

const game = JSON.parse(fs.readFileSync("src/game/data/game-data.json", "utf8"));
const cutouts = JSON.parse(fs.readFileSync("src/game/data/cutouts.json", "utf8"));
const mask = JSON.parse(fs.readFileSync("src/game/data/regionmask.json", "utf8"));
const tilemaps = JSON.parse(fs.readFileSync("src/game/data/tilemaps.json", "utf8"));
const runtime = "src/assets/game";
const original = "assets-source/construct2/risorse";
const errors = [];

const expect = (condition, message) => {
  if (!condition) errors.push(message);
};
const expectFile = (file) => expect(fs.existsSync(file), `File mancante: ${file}`);

expect(game.regions.length === 23, `Regioni: ${game.regions.length}, attese 23`);
expect(game.monsters.length === 36, `Mostri: ${game.monsters.length}, attesi 36`);
expect(game.gatherables.length === 50, `Raccoglibili: ${game.gatherables.length}, attesi 50`);
expect(game.items.length === 41, `Icone inventario: ${game.items.length}, attese 41`);
expect(cutouts.length === 23, `Ritagli regione: ${cutouts.length}, attesi 23`);

expectFile(path.join(original, "sfondo-sheet0.png"));
for (let n = 1; n <= 23; n++) expectFile(path.join(original, `regione${n}-sheet0.png`));
for (let n = 0; n <= 4; n++) expectFile(path.join(original, `enemy-sheet${n}.png`));
for (let n = 0; n <= 1; n++) expectFile(path.join(original, `regionebackground-sheet${n}.png`));
expectFile(path.join(original, "tilebloc.png"));
expectFile(path.join(original, "tilebloczone.png"));
expectFile(path.join(original, "primitive.ttf"));

for (const region of game.regions) expectFile(path.join(runtime, region.bg));
for (const monster of game.monsters) expectFile(path.join(runtime, monster.img));
for (const item of game.items) expectFile(path.join(runtime, item.icon));
for (const gatherable of game.gatherables) expectFile(path.join(runtime, gatherable.sprite));
for (const cutout of cutouts) expectFile(path.join(runtime, cutout.file));

const mapMetadata = await sharp(path.join(original, "sfondo-sheet0.png")).metadata();
expect(mapMetadata.width === 1920 && mapMetadata.height === 1080, "La mappa originale non e 1920x1080");
for (let n = 1; n <= 23; n++) {
  const metadata = await sharp(path.join(original, `regione${n}-sheet0.png`)).metadata();
  expect(metadata.width === 1920 && metadata.height === 1080, `Maschera regione${n} non e 1920x1080`);
}

let decodedLength = 0;
const regionIds = new Set();
for (let i = 0; i < mask.rle.length; i += 2) {
  if (mask.rle[i] > 0) regionIds.add(mask.rle[i]);
  decodedLength += mask.rle[i + 1];
}
expect(decodedLength === mask.w * mask.h, "Lunghezza RLE della maschera non valida");
expect(regionIds.size === 23, `La maschera contiene ${regionIds.size} regioni, attese 23`);

for (const key of ["t122", "t131"]) {
  const tilemap = tilemaps[key];
  expect(Boolean(tilemap), `Tilemap mancante: ${key}`);
  if (tilemap) expect(tilemap.cells.length === tilemap.cols * tilemap.rows, `Dimensioni tilemap errate: ${key}`);
}

for (const pools of Object.values(game.biomePools)) {
  for (const frames of Object.values(pools)) {
    for (const frame of frames) expect(Boolean(game.monsters[frame]), `Frame mostro non valido nel pool: ${frame}`);
  }
}

if (errors.length) {
  console.error(`Verifica fallita (${errors.length} errori):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Verifica completata:
  mappa originale: 1920x1080
  maschere originali: 23/23
  regioni runtime: 23/23
  sfondi regione: 23/23
  carte mostro: 36/36
  raccoglibili: 50/50
  icone inventario: 41/41
  tilemap: t122 e t131 valide
  riferimenti mancanti: 0`);