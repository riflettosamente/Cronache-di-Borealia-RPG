// Genera inventario, coordinate e checksum degli asset locali.
// Uso: node scripts/generate-documentation.mjs
import crypto from "crypto";
import fs from "fs";
import path from "path";
import sharp from "sharp";

const DOCS = "docs";
const SOURCE = "assets-source/construct2";
const RUNTIME = "src/assets/game";
const DATA = "src/game/data";
fs.mkdirSync(DOCS, { recursive: true });

const game = JSON.parse(fs.readFileSync(path.join(DATA, "game-data.json"), "utf8"));
const cutouts = JSON.parse(fs.readFileSync(path.join(DATA, "cutouts.json"), "utf8"));
const tilemaps = JSON.parse(fs.readFileSync(path.join(DATA, "tilemaps.json"), "utf8"));

function allFiles(root) {
  if (!fs.existsSync(root)) return [];
  const result = [];
  const visit = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) visit(file);
      else result.push(file);
    }
  };
  visit(root);
  return result.sort();
}

const manifestFiles = [
  ...allFiles(SOURCE),
  ...allFiles(RUNTIME),
  ...allFiles(DATA),
].map((file) => {
  const content = fs.readFileSync(file);
  return {
    path: file.replaceAll("\\", "/"),
    bytes: content.length,
    sha256: crypto.createHash("sha256").update(content).digest("hex"),
  };
});

const sourceFiles = allFiles(path.join(SOURCE, "risorse"));
const runtimeFiles = allFiles(RUNTIME);
const groups = {
  sourceTotal: sourceFiles.length,
  sourceRegionMasks: sourceFiles.filter((file) => /regione\d+-sheet0\.png$/.test(file)).length,
  sourceEnemyAtlases: sourceFiles.filter((file) => /enemy-sheet\d\.png$/.test(file)).length,
  sourceRegionAtlases: sourceFiles.filter((file) => /regionebackground-sheet\d\.png$/.test(file)).length,
  runtimeEnemies: runtimeFiles.filter((file) => /enemies\/enemy-\d+\.jpg$/.test(file)).length,
  runtimeRegionBackgrounds: runtimeFiles.filter((file) => /regions\/region-\d+\.jpg$/.test(file)).length,
  runtimeCutouts: runtimeFiles.filter((file) => /cutouts\/cut-\d+\.webp$/.test(file)).length,
  runtimeItems: runtimeFiles.filter((file) => /items\/.*\.webp$/.test(file)).length,
  runtimeGatherables: game.gatherables.length,
};

fs.writeFileSync(
  path.join(DOCS, "asset-manifest.json"),
  JSON.stringify({ generatedAt: new Date().toISOString(), groups, files: manifestFiles }, null, 2),
);

const regionRows = game.regions.map((region) => {
  const cutout = cutouts.find((item) => item.id === region.id);
  const [cx, cy] = region.centroid.map((value) => Math.round(value));
  return `| ${String(region.id + 1).padStart(2, "0")} | ${region.key} | ${region.name} | ${region.biome} | ${cx}, ${cy} | ${cutout.x}, ${cutout.y}, ${cutout.w}, ${cutout.h} |`;
});

const cardWidth = 400;
const cardHeight = 569;
const samplePoints = game.monsters[0].points;
const pointRows = Object.entries(samplePoints).map(([name, [x, y]]) =>
  `| ${name} | ${x.toFixed(6)}, ${y.toFixed(6)} | ${Math.round(x * cardWidth)}, ${Math.round(y * cardHeight)} |`,
);

fs.writeFileSync(path.join(DOCS, "COORDINATE.md"), `# Coordinate e layer recuperati

## Sistema mappa

- Dimensione originale: **1920 x 1080 px**.
- Origine: angolo in alto a sinistra.
- Asse X: verso destra. Asse Y: verso il basso.
- Maschere originali: \`assets-source/construct2/risorse/regione1-sheet0.png\` ... \`regione23-sheet0.png\`.
- Ogni maschera originale e un PNG trasparente 1920 x 1080, gia allineato alla mappa.
- Maschera hit-test runtime: \`src/game/data/regionmask.json\`, griglia 640 x 360; 0 = nessuna regione, N = id regione + 1.
- Ritagli visuali: \`src/assets/game/cutouts/\`; posizionamento in \`src/game/data/cutouts.json\`.

## Regioni

| ID | Chiave | Nome | Bioma | Centro X,Y | Ritaglio X,Y,W,H |
|---:|---|---|---|---:|---:|
${regionRows.join("\n")}

I poligoni completi sono conservati nel campo \`regions[].poly\` di \`src/game/data/game-data.json\`.

## Tilemap zone e blocchi

- \`t122\`: layer blocchi, ${tilemaps.t122.cols} x ${tilemaps.t122.rows} celle.
- \`t131\`: layer zone, ${tilemaps.t131.cols} x ${tilemaps.t131.rows} celle.
- Dimensione logica cella: 32 x circa 32,727 px sulla mappa 1920 x 1080.
- Valori zona: 1 Mare, 2 Palude, 3 Deserto, 4 Pianura, 5 Fiume/Lago, 6 Bosco/Foresta, 7 Montagne.
- Sprite originali: \`tilebloc.png\` e \`tilebloczone.png\` nei sorgenti Construct 2.

## Carte mostro

- Dimensione frame: **400 x 569 px**.
- Le coordinate normalizzate provengono dagli image point originali Construct 2.

| Punto | Coordinate normalizzate | Pixel X,Y su 400x569 |
|---|---:|---:|
${pointRows.join("\n")}

Ogni mostro conserva i propri punti nel campo \`monsters[].points\` di \`game-data.json\`.
`);

const dimensions = {};
for (const file of [
  path.join(SOURCE, "risorse/sfondo-sheet0.png"),
  path.join(SOURCE, "risorse/regione1-sheet0.png"),
  path.join(SOURCE, "risorse/enemy-sheet0.png"),
  path.join(SOURCE, "risorse/regionebackground-sheet0.png"),
  path.join(SOURCE, "risorse/inventarioggetti-sheet0.png"),
  path.join(SOURCE, "risorse/tilebloc.png"),
  path.join(SOURCE, "risorse/tilebloczone.png"),
]) {
  const metadata = await sharp(file).metadata();
  dimensions[path.basename(file)] = { width: metadata.width, height: metadata.height, format: metadata.format };
}

fs.writeFileSync(path.join(DOCS, "coordinates.json"), JSON.stringify({
  map: { width: 1920, height: 1080, origin: "top-left" },
  dimensions,
  regions: game.regions.map((region) => ({
    ...region,
    cutout: cutouts.find((item) => item.id === region.id),
  })),
  enemyCard: { width: cardWidth, height: cardHeight, points: samplePoints },
  tilemaps: {
    block: { key: "t122", cols: tilemaps.t122.cols, rows: tilemaps.t122.rows },
    zones: { key: "t131", cols: tilemaps.t131.cols, rows: tilemaps.t131.rows },
  },
}, null, 2));

fs.writeFileSync(path.join(DOCS, "ASSET-INVENTORY.md"), `# Inventario degli asset importati

Tutti i file sono locali. Il gioco e gli script non devono piu scaricare materiali da GitHub.

## Sorgenti originali

Percorso: \`assets-source/construct2/\`

- ${groups.sourceTotal} file originali nella cartella \`risorse\`.
- Mappa originale PNG 1920 x 1080: \`risorse/sfondo-sheet0.png\`.
- ${groups.sourceRegionMasks} maschere regione PNG originali 1920 x 1080.
- ${groups.sourceEnemyAtlases} atlas originali delle carte mostro.
- ${groups.sourceRegionAtlases} atlas originali degli sfondi regione.
- Fogli inventario, tilemap, raccoglibili, UI, font TTF/WOFF/WOFF2.
- \`data.js\`, dump degli event sheet, dump oggetti e testi recuperati.

## Asset runtime modificabili

Percorso: \`src/assets/game/\`

- 1 mappa ottimizzata per la preview.
- ${groups.runtimeCutouts} ritagli regione WebP con trasparenza.
- ${groups.runtimeRegionBackgrounds} sfondi regione JPG separati.
- ${groups.runtimeEnemies} carte mostro JPG separate.
- ${groups.runtimeItems} icone inventario WebP separate.
- ${groups.runtimeGatherables} sprite raccoglibili WebP separati.
- UI necessaria al gioco e font Primitive.

## Dati

Percorso: \`src/game/data/\`

- \`game-data.json\`: regioni, biomi, mostri, rarita, loot, professioni e statistiche.
- \`tilemaps.json\`: blocchi e zone originali.
- \`regionmask.json\`: hit-test delle 23 regioni.
- \`cutouts.json\`: coordinate dei ritagli regione.

## Verifica integrita

\`docs/asset-manifest.json\` contiene dimensione e SHA-256 di ogni sorgente, asset runtime e file dati.
`);

fs.writeFileSync(path.join(DOCS, "RECOVERY.md"), `# Ripristino e rigenerazione

## Lavoro normale

1. Modifica i file separati in \`src/assets/game/\` e i JSON in \`src/game/data/\`.
2. Avvia la preview o esegui \`npm run build\`.

## Rigenerare dagli originali locali

1. Assicurati che esista \`assets-source/construct2/\`.
2. Esegui \`node scripts/import-assets.mjs\`.
3. Esegui \`node scripts/generate-documentation.mjs\`.
4. Esegui \`node scripts/verify-assets.mjs\`.

Non e richiesta una connessione a GitHub.

## Backup completo

- Lo ZIP scaricabile dalla preview e \`/rpg-alfa-0.15-complete-project.zip\`.
- Una copia testuale Base64 e conservata in \`recovery/base64/\` per gli export Arena che omettono i binari.
- Per ripristinare i binari dai file testuali: \`node scripts/restore-backup.mjs\`.
- Per ricreare ZIP e copia Base64: \`node scripts/create-backup.mjs\`.
`);

console.log("Documentazione generata:", groups);