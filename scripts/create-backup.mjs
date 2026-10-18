// Crea un archivio completo scaricabile e una copia Base64 testuale.
// La copia testuale sopravvive agli export Arena che omettono i file binari.
// Uso: node scripts/create-backup.mjs
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";

const STAGE = ".backup-staging";
const PUBLIC = "public";
const RECOVERY = "recovery/base64";
const ARCHIVE_NAME = "rpg-alfa-0.15-complete-project.zip";
const ARCHIVE = path.join(PUBLIC, ARCHIVE_NAME);
const CHUNK_CHARS = 1_000_000; // multiplo di 4: ogni parte resta Base64 valida

fs.rmSync(STAGE, { recursive: true, force: true });
fs.rmSync(RECOVERY, { recursive: true, force: true });
fs.mkdirSync(STAGE, { recursive: true });
fs.mkdirSync(PUBLIC, { recursive: true });
fs.mkdirSync(RECOVERY, { recursive: true });

const include = [
  "assets-source",
  "docs",
  "reference",
  "scripts",
  "src",
  "index.html",
  "package.json",
  "package-lock.json",
  "tsconfig.json",
  "vite.config.ts",
  "PROJECT-README.md",
];

for (const entry of include) {
  if (!fs.existsSync(entry)) throw new Error(`Elemento richiesto dal backup mancante: ${entry}`);
  fs.cpSync(entry, path.join(STAGE, entry), { recursive: true });
}

fs.rmSync(ARCHIVE, { force: true });
const zip = spawnSync("zip", ["-qr", path.resolve(ARCHIVE), "."], {
  cwd: STAGE,
  encoding: "utf8",
});
if (zip.status !== 0) throw new Error(`Creazione ZIP fallita: ${zip.stderr}`);

const archive = fs.readFileSync(ARCHIVE);
const sha256 = crypto.createHash("sha256").update(archive).digest("hex");
const encoded = archive.toString("base64");
const chunks = [];
for (let offset = 0, part = 1; offset < encoded.length; offset += CHUNK_CHARS, part++) {
  const name = `complete-project.part-${String(part).padStart(3, "0")}.b64.txt`;
  const content = encoded.slice(offset, offset + CHUNK_CHARS);
  fs.writeFileSync(path.join(RECOVERY, name), content);
  chunks.push({ name, chars: content.length });
}

fs.writeFileSync("recovery/manifest.json", JSON.stringify({
  archive: ARCHIVE_NAME,
  bytes: archive.length,
  sha256,
  encoding: "base64",
  chunkChars: CHUNK_CHARS,
  chunks,
  restoreCommand: "node scripts/restore-backup.mjs",
}, null, 2));

fs.writeFileSync("recovery/LEGGIMI.txt", `BACKUP TESTUALE RPG ALFA 0.15
================================

Questa cartella contiene lo ZIP completo codificato come testo Base64.
Serve quando un export di Arena include il codice ma omette PNG, JPG, WebP,
font o archivi ZIP.

Ripristino automatico:
  node scripts/restore-backup.mjs

Non modificare o riordinare i file complete-project.part-*.b64.txt.
Il checksum SHA-256 atteso e registrato in manifest.json.
`);

fs.rmSync(STAGE, { recursive: true, force: true });
console.log(`Backup creato:
  ZIP: ${ARCHIVE} (${(archive.length / 1024 / 1024).toFixed(2)} MB)
  SHA-256: ${sha256}
  parti Base64: ${chunks.length}
  testo Base64: ${(encoded.length / 1024 / 1024).toFixed(2)} MB`);