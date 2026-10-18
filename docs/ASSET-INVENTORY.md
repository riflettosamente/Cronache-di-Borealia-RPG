# Inventario degli asset importati

Tutti i file sono locali. Il gioco e gli script non devono piu scaricare materiali da GitHub.

## Sorgenti originali

Percorso: `assets-source/construct2/`

- 129 file originali nella cartella `risorse`.
- Mappa originale PNG 1920 x 1080: `risorse/sfondo-sheet0.png`.
- 23 maschere regione PNG originali 1920 x 1080.
- 5 atlas originali delle carte mostro.
- 2 atlas originali degli sfondi regione.
- Fogli inventario, tilemap, raccoglibili, UI, font TTF/WOFF/WOFF2.
- `data.js`, dump degli event sheet, dump oggetti e testi recuperati.

## Asset runtime modificabili

Percorso: `src/assets/game/`

- 1 mappa ottimizzata per la preview.
- 23 ritagli regione WebP con trasparenza.
- 23 sfondi regione JPG separati.
- 36 carte mostro JPG separate.
- 41 icone inventario WebP separate.
- 50 sprite raccoglibili WebP separati.
- UI necessaria al gioco e font Primitive.

## Dati

Percorso: `src/game/data/`

- `game-data.json`: regioni, biomi, mostri, rarita, loot, professioni e statistiche.
- `tilemaps.json`: blocchi e zone originali.
- `regionmask.json`: hit-test delle 23 regioni.
- `cutouts.json`: coordinate dei ritagli regione.

## Verifica integrita

`docs/asset-manifest.json` contiene dimensione e SHA-256 di ogni sorgente, asset runtime e file dati.
