# Guida alle Regole e al Contesto IA — Cronache di Borealia

Questo documento definisce l'architettura tecnica, le regole sull'uso delle librerie e gli standard di sviluppo per gli assistenti IA (DYAD, LM Studio, ecc.) che operano sul codice di **Cronache di Borealia**.

## 🛠 Panoramica dello Stack Tecnologico

* **Framework Principale**: React (Componenti Funzionali, Hooks)
* **Linguaggio**: TypeScript (Tipizzazione rigorosa, uso minimo di `any`)
* **Strumenti di Build**: Vite (HMR veloce, build di produzione ottimizzate)
* **Stilizzazione**: Tailwind CSS (Stilizzazione utility-first con colori di tema personalizzati)
* **Iconografia**: Lucide React (Set di icone UI standardizzato)
* **Gestione dello Stato**: React Context API / Hook Personalizzati (Gestione modulare dello stato)
* **Rendering Matematico / Scientifico**: Sintassi matematica in stile LaTeX parsata tramite KaTeX o componenti dedicati ove applicabile
* **Package Manager**: `npm`

## 📐 Regole di Architettura e Codifica

### 1. Struttura dei Componenti e Stilizzazione

* **Approccio Utility-First**: Utilizzare direttamente le classi di Tailwind CSS all'interno dei componenti JSX/TSX per layout, spaziatura e stile. Evitare file `.css` separati a meno che non si debbano definire keyframe personalizzati o importare font.
* **Componenti Singoli per UI Dinamiche**: Mantenere la logica del componente, gli eventuali sotto-componenti inline (se piccoli) e lo stile Tailwind consolidati in modo logico per ciascun modulo.
* **Coerenza delle Icone**: Importare le icone visive esclusivamente da `lucide-react`.

### 2. TypeScript e Sicurezza dei Tipi

* **Interfacce Rigorose**: Definire interfacce o tipi espliciti per tutte le prop dei componenti, gli oggetti di stato e le entità di gioco (es. oggetti dell'inventario, statistiche del giocatore, registro delle quest).
* **Nessun `any` Implicito**: Dichiarare esplicitamente le firme delle callback e i tipi di evento (`React.MouseEvent`, `React.ChangeEvent`, ecc.).

### 3. Linee Guida per le Librerie

* **UI e Layout**: Elementi HTML5 standard potenziati con Tailwind CSS.
* **Icone**: ESCLUSIVAMENTE `lucide-react`. Non introdurre pacchetti di icone alternativi (es. `font-awesome`, `react-icons`).
* **Formule Matematiche**: Formattare le notazioni scientifiche e matematiche inline usando i singoli simboli del dollaro (`$...$`) o in blocco usando i doppi simboli del dollaro (`$$...$$`). Evitare i caratteri matematici Unicode standard nel testo.

### 4. Logica di Gioco e Gestione dello Stato

* Mantenere gli aggiornamenti dello stato del gioco immutabili (usare aggiornamenti funzionali per `useState` o azioni pulite con `useReducer`).
* Separare i componenti di visualizzazione (`src/components/`) dalla logica di gioco o dagli hook di business (`src/hooks/` o `src/utils/`).

## 🚀 Linee Guida per gli Assistenti IA

1. **Modifiche Incrementali**: Fornire modifiche localizzate o sostituzioni complete di file che non interrompano i tipi TypeScript esistenti.
2. **Sviluppo Locale Prima di Tutto**: Assicurarsi che tutte le soluzioni funzionino completamente offline senza dipendenze SaaS esterne in esecuzione.
3. **Preservare i Percorsi degli Asset/Audio**: Mantenere gli import degli asset statici relativi alla cartella `public/` o ai protocolli standard di Vite.