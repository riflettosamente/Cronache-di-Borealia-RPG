import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const versionFilePath = path.join(root, 'src', 'game', 'version.ts');
const packageJsonPath = path.join(root, 'package.json');
const indexHtmlPath = path.join(root, 'index.html');

// Leggi o determina la versione corrente
let currentMinor = 22;
if (fs.existsSync(versionFilePath)) {
  const content = fs.readFileSync(versionFilePath, 'utf8');
  const match = content.match(/Alfa\s+0\.(\d+)/i) || content.match(/GAME_BUILD\s*=\s*(\d+)/);
  if (match) {
    currentMinor = parseInt(match[1], 10);
  }
}

const nextMinor = currentMinor + 1;
const nextVersionStr = `Alfa 0.${nextMinor}`;
const nextPkgVersion = `0.${nextMinor}.0`;

// 1. Scrivi src/game/version.ts
const versionContent = `/**
 * Versione progressiva del gioco generata automaticamente.
 * Aggiornabile tramite comando: npm run bump
 */
export const GAME_VERSION = "${nextVersionStr}";
export const GAME_BUILD = ${nextMinor};
`;
fs.writeFileSync(versionFilePath, versionContent, 'utf8');

// 2. Aggiorna package.json
if (fs.existsSync(packageJsonPath)) {
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  pkg.version = nextPkgVersion;
  fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
}

// 3. Aggiorna il titolo in index.html
if (fs.existsSync(indexHtmlPath)) {
  let html = fs.readFileSync(indexHtmlPath, 'utf8');
  html = html.replace(/<title>Cronache di Borealia — Alfa 0\.\d+<\/title>/, `<title>Cronache di Borealia — ${nextVersionStr}</title>`);
  fs.writeFileSync(indexHtmlPath, html, 'utf8');
}

console.log(`Versione aggiornata a: ${nextVersionStr} (package.json v${nextPkgVersion})`);
