# Ripristino e rigenerazione

## Lavoro normale

1. Modifica i file separati in `src/assets/game/` e i JSON in `src/game/data/`.
2. Avvia la preview o esegui `npm run build`.

## Rigenerare dagli originali locali

1. Assicurati che esista `assets-source/construct2/`.
2. Esegui `node scripts/import-assets.mjs`.
3. Esegui `node scripts/generate-documentation.mjs`.
4. Esegui `node scripts/verify-assets.mjs`.

Non e richiesta una connessione a GitHub.

## Backup completo

- Lo ZIP scaricabile dalla preview e `/rpg-alfa-0.15-complete-project.zip`.
- Una copia testuale Base64 e conservata in `recovery/base64/` per gli export Arena che omettono i binari.
- Per ripristinare i binari dai file testuali: `node scripts/restore-backup.mjs`.
- Per ricreare ZIP e copia Base64: `node scripts/create-backup.mjs`.
