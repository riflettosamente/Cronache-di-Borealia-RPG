import fs from "fs";
import path from "path";
import sharp from "sharp";

const RIS = "risorse";
const OUT = "src/assets/game";
const MAP_W = 1920;
const MAP_H = 1080;

for (const dir of ["enemies", "regions", "items", "sprites", "fonts", "cutouts"]) {
  fs.mkdirSync(path.join(OUT, dir), { recursive: true });
}

const d = JSON.parse(fs.readFileSync(path.join(RIS, "data.js"), "utf8").replace(/^\uFEFF/, ""));
const types = d.project[3];

const basenameForType = (type) => {
  try { return type[7][0][7][0][0].replace(/-sheet\d\.png$/, ""); } catch { return null; }
};
const basenames = types.map(basenameForType);
const typeIndex = (name) => {
  const index = basenames.findIndex((v) => v === name);
  if (index < 0) throw new Error(`Construct 2 type not found: ${name}`);
  return index;
};

console.log("1. Generating map.jpg from sfondo-sheet0.png...");
const mapPng = await sharp(path.join(RIS, "sfondo-sheet0.png"))
  .resize(MAP_W, MAP_H, { fit: "fill" })
  .png()
  .toBuffer();

await sharp(mapPng)
  .jpeg({ quality: 86, mozjpeg: true })
  .toFile(path.join(OUT, "sprites/map.jpg"));
console.log("   Map generated successfully!");

console.log("2. Extracting 23 region backgrounds...");
const regionFrames = types[typeIndex("regionebackground")][7][0][7];
for (let i = 0; i < regionFrames.length; i++) {
  const [file, , x, y, width, height] = regionFrames[i];
  const outName = `region-${String(i).padStart(2, "0")}.jpg`;
  await sharp(path.join(RIS, file))
    .extract({ left: x, top: y, width, height })
    .jpeg({ quality: 85, mozjpeg: true })
    .toFile(path.join(OUT, "regions", outName));
}
console.log(`   ${regionFrames.length} region backgrounds extracted successfully!`);

console.log("3. Extracting 36 enemy monster cards...");
const enemyFrames = types[typeIndex("enemy")][7][0][7];
for (let i = 0; i < enemyFrames.length; i++) {
  const [file, , x, y, width, height] = enemyFrames[i];
  const outName = `enemy-${String(i).padStart(2, "0")}.jpg`;
  await sharp(path.join(RIS, file))
    .extract({ left: x, top: y, width, height })
    .jpeg({ quality: 85, mozjpeg: true })
    .toFile(path.join(OUT, "enemies", outName));
}
console.log(`   ${enemyFrames.length} enemy cards extracted successfully!`);

console.log("4. Extracting 23 region cutouts from alpha masks...");
for (let i = 0; i < 23; i++) {
  const sourceNum = i + 1;
  const maskFile = path.join(RIS, `regione${sourceNum}-sheet0.png`);
  if (!fs.existsSync(maskFile)) continue;

  const { data, info } = await sharp(maskFile)
    .resize(MAP_W, MAP_H, { fit: "fill" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let x0 = MAP_W, y0 = MAP_H, x1 = -1, y1 = -1;
  for (let p = 0, sIdx = 3; p < MAP_W * MAP_H; p++, sIdx += info.channels) {
    if (data[sIdx] > 40) {
      const px = p % MAP_W;
      const py = Math.floor(p / MAP_W);
      if (px < x0) x0 = px;
      if (px > x1) x1 = px;
      if (py < y0) y0 = py;
      if (py > y1) y1 = py;
    }
  }

  if (x1 >= x0 && y1 >= y0) {
    const pad = 4;
    x0 = Math.max(0, x0 - pad);
    y0 = Math.max(0, y0 - pad);
    x1 = Math.min(MAP_W - 1, x1 + pad);
    y1 = Math.min(MAP_H - 1, y1 + pad);
    const width = x1 - x0 + 1;
    const height = y1 - y0 + 1;

    const rawMask = Buffer.alloc(width * height * 4);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const sIndex = ((y0 + y) * MAP_W + (x0 + x)) * info.channels + 3;
        const oIndex = (y * width + x) * 4;
        const val = Math.min(255, data[sIndex] * 2);
        rawMask[oIndex] = 255;
        rawMask[oIndex + 1] = 255;
        rawMask[oIndex + 2] = 255;
        rawMask[oIndex + 3] = val;
      }
    }
    const maskBuf = await sharp(rawMask, { raw: { width, height, channels: 4 } }).png().toBuffer();
    const outName = `cut-${String(i).padStart(2, "0")}.webp`;
    await sharp(mapPng)
      .extract({ left: x0, top: y0, width, height })
      .composite([{ input: maskBuf, blend: "dest-in" }])
      .webp({ quality: 88, alphaQuality: 92 })
      .toFile(path.join(OUT, "cutouts", outName));
  }
}
console.log("   23 region cutouts extracted successfully!");

console.log("5. Extracting inventory icons...");
const invFrame = types[typeIndex("inventarioggetti")][7][0][7][0];
const [invFile] = invFrame;
const invPoints = invFrame[9].filter(([name]) => name !== "closebutton" && !/^imagepoint/i.test(String(name)));
const INVENTORY_W = 812, INVENTORY_H = 658, ICON_SIZE = 76;
for (const [name, fx, fy] of invPoints) {
  const cx = Math.round(fx * INVENTORY_W);
  const cy = Math.round(fy * INVENTORY_H);
  const left = Math.max(0, Math.min(INVENTORY_W - ICON_SIZE, cx - ICON_SIZE / 2));
  const top = Math.max(0, Math.min(INVENTORY_H - ICON_SIZE, cy - ICON_SIZE / 2));
  const safe = String(name).replace(/[^a-z0-9àèéìòù]+/gi, "_").toLowerCase();
  await sharp(path.join(RIS, invFile))
    .extract({ left, top, width: ICON_SIZE, height: ICON_SIZE })
    .webp({ quality: 88, alphaQuality: 92 })
    .toFile(path.join(OUT, "items", `${safe}.webp`));
}
console.log(`   ${invPoints.length} inventory icons extracted!`);

console.log("6. Converting common UI sprites...");
for (const name of ["avatarpg", "gameover", "lanciodado", "sangue", "loading-logo"]) {
  const srcPng = path.join(RIS, `${name}-sheet0.png`);
  const srcLogo = path.join(RIS, `${name}.png`);
  const chosen = fs.existsSync(srcPng) ? srcPng : (fs.existsSync(srcLogo) ? srcLogo : null);
  if (chosen && fs.statSync(chosen).size > 0) {
    await sharp(chosen).webp({ quality: 90, alphaQuality: 94 }).toFile(path.join(OUT, "sprites", `${name}.webp`));
  }
}

// Gatherable sprites
const game = JSON.parse(fs.readFileSync("src/game/data/game-data.json", "utf8"));
for (const g of game.gatherables) {
  const file = path.join(RIS, `${g.id}-sheet0.png`);
  if (fs.existsSync(file) && fs.statSync(file).size > 0) {
    await sharp(file).webp({ quality: 90, alphaQuality: 94 }).toFile(path.join(OUT, "sprites", `${g.id}.webp`));
  }
}
console.log("   Sprites converted successfully!");
console.log("Extraction complete!");
