// Ripristina l'intero progetto dai chunk Base64 testuali in recovery/base64.
// Uso: node scripts/restore-backup.mjs
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";

const manifest = JSON.parse(fs.readFileSync("recovery/manifest.json", "utf8"));
const chunks = manifest.chunks.map(({ name }) =>
  fs.readFileSync(path.join("recovery/base64", name), "utf8").trim(),
);
const archive = Buffer.from(chunks.join(""), "base64");
const sha256 = crypto.createHash("sha256").update(archive).digest("hex");
if (sha256 !== manifest.sha256) {
  throw new Error(`Checksum backup non valido. Atteso ${manifest.sha256}, ottenuto ${sha256}`);
}
if (archive.length !== manifest.bytes) {
  throw new Error(`Dimensione backup non valida. Attesa ${manifest.bytes}, ottenuta ${archive.length}`);
}

const tempZip = ".restore-backup.zip";
const tempDir = ".restore-backup";
fs.rmSync(tempDir, { recursive: true, force: true });
fs.writeFileSync(tempZip, archive);
fs.mkdirSync(tempDir, { recursive: true });
const unzip = spawnSync("unzip", ["-oq", tempZip, "-d", tempDir], { encoding: "utf8" });
if (unzip.status !== 0) throw new Error(`Estrazione backup fallita: ${unzip.stderr}`);

for (const entry of fs.readdirSync(tempDir)) {
  fs.cpSync(path.join(tempDir, entry), entry, { recursive: true, force: true });
}
fs.rmSync(tempZip, { force: true });
fs.rmSync(tempDir, { recursive: true, force: true });

console.log(`Backup ripristinato e verificato (SHA-256 ${sha256}).
Esegui ora:
  npm install
  node scripts/verify-assets.mjs
  npm run build`);