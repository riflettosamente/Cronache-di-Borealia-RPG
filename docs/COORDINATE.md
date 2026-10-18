# Coordinate e layer recuperati

## Sistema mappa

- Dimensione originale: **1920 x 1080 px**.
- Origine: angolo in alto a sinistra.
- Asse X: verso destra. Asse Y: verso il basso.
- Maschere originali: `assets-source/construct2/risorse/regione1-sheet0.png` ... `regione23-sheet0.png`.
- Ogni maschera originale e un PNG trasparente 1920 x 1080, gia allineato alla mappa.
- Maschera hit-test runtime: `src/game/data/regionmask.json`, griglia 640 x 360; 0 = nessuna regione, N = id regione + 1.
- Ritagli visuali: `src/assets/game/cutouts/`; posizionamento in `src/game/data/cutouts.json`.

## Regioni

| ID | Chiave | Nome | Bioma | Centro X,Y | Ritaglio X,Y,W,H |
|---:|---|---|---|---:|---:|
| 01 | regione1 | Scogliera di Borealia | pianura | 179, 188 | 64, 58, 249, 310 |
| 02 | regione2 | Boschetto Tranquillo | foresta | 291, 424 | 87, 122, 373, 531 |
| 03 | regione3 | Vetta del Teschio di Drago | montagna | 533, 126 | 383, 7, 351, 324 |
| 04 | regione4 | Radura della Nebbia Eterna | pianura | 404, 667 | 231, 567, 328, 207 |
| 05 | regione5 | Foresta di Karplus | foresta | 566, 291 | 416, 86, 294, 402 |
| 06 | regione6 | Distesa Tranquilla | pianura | 826, 223 | 659, 17, 372, 416 |
| 07 | regione7 | Prateria Accidentata | pianura | 1046, 215 | 949, 115, 208, 202 |
| 08 | regione8 | Fronde dell'Orizzonte | foresta | 1263, 267 | 1077, 67, 356, 361 |
| 09 | regione9 | Valle dei Fiocchi Lucenti | pianura | 1629, 128 | 1400, 37, 469, 179 |
| 10 | regione10 | Giardino Sereno | foresta | 1516, 271 | 1361, 140, 303, 261 |
| 11 | regione11 | Gola Boscosa | foresta | 1735, 293 | 1620, 150, 222, 285 |
| 12 | regione12 | Steppa di Sejiri | pianura | 1038, 402 | 801, 272, 437, 225 |
| 13 | regione13 | Costa di Beyeen | mare | 1474, 428 | 1217, 329, 516, 210 |
| 14 | regione14 | Brughiera Brulla | pianura | 1777, 515 | 1659, 408, 229, 232 |
| 15 | regione15 | Bassopiani Thalakos | montagna | 1008, 569 | 890, 445, 293, 265 |
| 16 | regione16 | Territori Selvaggi | montagna | 1089, 698 | 805, 516, 492, 352 |
| 17 | regione17 | Altopiano di Kabira | montagna | 1656, 683 | 1504, 565, 346, 223 |
| 18 | regione18 | Palude delle Sanguisughe | palude | 751, 722 | 663, 618, 166, 195 |
| 19 | regione19 | Acquitrino di Bojuka | palude | 1186, 780 | 1015, 645, 305, 232 |
| 20 | regione20 | Antiche Pianure di Stokejour | pianura | 862, 893 | 636, 767, 436, 243 |
| 21 | regione21 | Distesa Lontana senza Speranza | deserto | 1581, 866 | 1349, 745, 451, 267 |
| 22 | regione22 | Distesa Paludosa | palude | 587, 909 | 393, 821, 393, 169 |
| 23 | regione23 | Isola del Mare di Vetro | isola | 200, 872 | 125, 778, 148, 173 |

I poligoni completi sono conservati nel campo `regions[].poly` di `src/game/data/game-data.json`.

## Tilemap zone e blocchi

- `t122`: layer blocchi, 60 x 33 celle.
- `t131`: layer zone, 60 x 33 celle.
- Dimensione logica cella: 32 x circa 32,727 px sulla mappa 1920 x 1080.
- Valori zona: 1 Mare, 2 Palude, 3 Deserto, 4 Pianura, 5 Fiume/Lago, 6 Bosco/Foresta, 7 Montagne.
- Sprite originali: `tilebloc.png` e `tilebloczone.png` nei sorgenti Construct 2.

## Carte mostro

- Dimensione frame: **400 x 569 px**.
- Le coordinate normalizzate provengono dagli image point originali Construct 2.

| Punto | Coordinate normalizzate | Pixel X,Y su 400x569 |
|---|---:|---:|
| PuntiVita | 0.855000, 0.105448 | 342, 60 |
| PImp | 0.190000, 0.910369 | 76, 518 |
| PPro | 0.345000, 0.912127 | 138, 519 |
| PATT | 0.502500, 0.913884 | 201, 520 |
| PPAR | 0.660000, 0.910369 | 264, 518 |
| XP | 0.815000, 0.912127 | 326, 519 |
| Imagepoint 7 | 0.497500, 0.891037 | 199, 507 |

Ogni mostro conserva i propri punti nel campo `monsters[].points` di `game-data.json`.
