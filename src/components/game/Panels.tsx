import { useState } from "react";
import {
  REGIONS,
  MONSTERS,
  EDIBLE,
  xpForLevel,
  iconForLoot,
  lootIconId,
  type PG,
  type Professione,
} from "@/game/engine";
import { asset } from "@/game/assets";

export type PanelId = "pg" | "borsa" | "diario" | "atlante" | "bestiario";

export const PANEL_LABEL: Record<PanelId, string> = {
  pg: "Personaggio",
  borsa: "Borsa",
  diario: "Diario",
  atlante: "Atlante",
  bestiario: "Bestiario",
};

export const PANEL_KEY: Record<PanelId, string> = {
  pg: "C",
  borsa: "I",
  diario: "L",
  atlante: "M",
  bestiario: "B",
};

export interface LogEntry {
  id: number;
  text: string;
  kind: "info" | "good" | "warn" | "loot";
}

/* ----------------------------------------------------
   1. SCHEDA PERSONAGGIO (Tasto C)
---------------------------------------------------- */
export function CharacterPanel({
  pg,
  professions,
}: {
  pg: PG;
  professions: Record<string, Professione>;
}) {
  const xpNeeded = xpForLevel(pg.livello);
  const xpPercent = Math.min(100, Math.round((pg.xp / xpNeeded) * 100));

  return (
    <div className="flex flex-col gap-5">
      {/* Intestazione PG */}
      <div className="panel-inset p-3.5 flex items-center gap-3.5">
        <div className="w-12 h-12 rounded bg-black/50 border border-[var(--color-border)] flex items-center justify-center shrink-0">
          <img
            src={asset("sprites/avatarpg.webp")}
            alt="Avatar"
            className="w-8 h-8 object-contain"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="font-display text-base text-[var(--color-gold)] truncate">
              Esploratore
            </h3>
            <span className="text-xs text-[var(--color-muted)]">
              Liv. <b className="font-num text-[var(--color-gold-soft)]">{pg.livello}</b>
            </span>
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs">
            <span className="stat-key">Arma:</span>
            <span className="text-xs text-[var(--color-ink)] truncate font-semibold">
              {pg.arma}
            </span>
          </div>
        </div>
      </div>

      {/* Barre Vita ed Esperienza */}
      <div className="flex flex-col gap-2.5 panel-inset p-3">
        <div>
          <div className="stat-row mb-1">
            <span className="stat-key">Punti Vita</span>
            <span className="stat-val font-num">
              {pg.pv} / {pg.pvmax}
            </span>
          </div>
          <div className="bar bar-hp w-full">
            <i style={{ width: `${(pg.pv / pg.pvmax) * 100}%` }} />
          </div>
        </div>

        <div>
          <div className="stat-row mb-1">
            <span className="stat-key">Esperienza</span>
            <span className="stat-val font-num">
              {pg.xp} / {xpNeeded} ({xpPercent}%)
            </span>
          </div>
          <div className="bar bar-xp w-full">
            <i style={{ width: `${xpPercent}%` }} />
          </div>
        </div>
      </div>

      {/* Attributi di Combattimento */}
      <div>
        <h4 className="font-display text-xs tracking-wider uppercase text-[var(--color-gold-soft)] mb-2 border-b border-[var(--color-border)] pb-1">
          Statistiche Combattimento
        </h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="panel-inset p-2">
            <div className="stat-key">Attacco (ATT)</div>
            <div className="font-num text-base text-[var(--color-gold)] mt-0.5">+{pg.att}</div>
          </div>
          <div className="panel-inset p-2">
            <div className="stat-key">Parata (PAR)</div>
            <div className="font-num text-base text-[var(--color-gold)] mt-0.5">+{pg.par}</div>
          </div>
          <div className="panel-inset p-2">
            <div className="stat-key">Impatto (IMP)</div>
            <div className="font-num text-base text-[var(--color-gold)] mt-0.5">+{pg.imp}</div>
          </div>
          <div className="panel-inset p-2">
            <div className="stat-key">Protezione (PRO)</div>
            <div className="font-num text-base text-[var(--color-gold)] mt-0.5">{pg.pro}</div>
          </div>
        </div>
      </div>

      {/* Progressioni Professioni */}
      <div>
        <h4 className="font-display text-xs tracking-wider uppercase text-[var(--color-gold-soft)] mb-2 border-b border-[var(--color-border)] pb-1">
          Maestrie & Professioni
        </h4>
        <div className="flex flex-col gap-2">
          {Object.entries(professions).map(([nome, prof]) => {
            const nextXp = prof.livello * 5;
            const pPct = Math.min(100, Math.round((prof.xp / nextXp) * 100));
            return (
              <div key={nome} className="panel-inset p-2.5">
                <div className="stat-row mb-1 text-xs">
                  <span className="font-medium text-[var(--color-ink)]">{nome}</span>
                  <span className="text-[var(--color-muted)]">
                    Liv. <b className="font-num text-[var(--color-gold-soft)]">{prof.livello}</b>
                    <span className="ml-1 opacity-70">({prof.xp} xp)</span>
                  </span>
                </div>
                <div className="bar bar-xp w-full h-1.5">
                  <i style={{ width: `${pPct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------
   2. BORSA / INVENTARIO (Tasto I)
---------------------------------------------------- */
export function BagPanel({
  inventory,
  onEat,
}: {
  inventory: Record<string, number>;
  onEat: (iconId: string) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const items = Object.entries(inventory).filter(([, q]) => q > 0);

  const selItem = selected ? { name: selected, qty: inventory[selected] ?? 0 } : null;
  const lootId = selected ? lootIconId(selected) : null;
  const edibleEff = lootId && EDIBLE[lootId] !== undefined ? EDIBLE[lootId] : null;

  return (
    <div className="flex flex-col gap-4">
      {items.length === 0 ? (
        <div className="panel-inset p-6 text-center text-xs italic text-[var(--color-muted)]">
          La borsa è vuota. Esplora le regioni per raccogliere risorse.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
            {items.map(([name, qty]) => {
              const isSel = selected === name;
              const iconPath = iconForLoot(name);
              return (
                <button
                  key={name}
                  onClick={() => setSelected(name)}
                  className={`slot border border-[var(--color-border)] rounded p-1 flex flex-col items-center justify-center transition-all ${
                    isSel ? "slot-sel" : ""
                  }`}
                  title={`${name} (${qty})`}
                >
                  <img
                    src={asset(iconPath)}
                    alt={name}
                    className="w-8 h-8 object-contain pointer-events-none drop-shadow"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = "none";
                    }}
                  />
                  <span className="slot-qty">{qty}</span>
                </button>
              );
            })}
          </div>

          {/* Dettaglio Oggetto Selezionato */}
          {selItem && (
            <div className="panel-inset p-3.5 flex flex-col gap-2.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-black/40 border border-[var(--color-border)] flex items-center justify-center shrink-0">
                  <img
                    src={asset(iconForLoot(selItem.name))}
                    alt=""
                    className="w-7 h-7 object-contain"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-display text-sm text-[var(--color-gold)] truncate">
                    {selItem.name}
                  </h4>
                  <p className="text-xs text-[var(--color-muted)]">
                    Quantità: <b className="font-num text-[var(--color-gold-soft)]">{selItem.qty}</b>
                  </p>
                </div>
              </div>

              {edibleEff !== null && (
                <div className="pt-2 border-t border-[var(--color-border)] flex items-center justify-between gap-3">
                  <span
                    className={`text-xs ${
                      edibleEff > 0 ? "text-[#a8bf86]" : "text-[#d99079]"
                    }`}
                  >
                    Effetto: {edibleEff > 0 ? `+${edibleEff} PV` : `${edibleEff} PV (Velenoso!)`}
                  </span>
                  <button
                    onClick={() => {
                      if (lootId) onEat(lootId);
                    }}
                    className="btn btn-sm btn-gold"
                  >
                    Mangia
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ----------------------------------------------------
   3. DIARIO DI VIAGGIO (Tasto L)
---------------------------------------------------- */
export function DiaryPanel({ log }: { log: LogEntry[] }) {
  if (log.length === 0) {
    return (
      <div className="panel-inset p-6 text-center text-xs italic text-[var(--color-muted)]">
        Il diario è ancora bianco. Comincia a esplorare per annotare eventi e scoperte.
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {log.map((entry) => {
        let cls = "log-info";
        if (entry.kind === "good") cls = "log-good";
        if (entry.kind === "warn") cls = "log-warn";
        if (entry.kind === "loot") cls = "log-loot";

        return (
          <div key={entry.id} className={`log-line ${cls}`}>
            {entry.text}
          </div>
        );
      })}
    </div>
  );
}

/* ----------------------------------------------------
   4. ATLANTE REGIONALE (Tasto M)
---------------------------------------------------- */
export function AtlasPanel({
  current,
  onGo,
}: {
  current: number | null;
  onGo: (id: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-[var(--color-muted)] mb-1 italic">
        23 regioni cartografate. Clicca su &quot;Viaggia&quot; per incamminarti.
      </p>
      {REGIONS.map((reg) => {
        const isHere = current === reg.id;
        return (
          <div
            key={reg.id}
            className={`tile p-2.5 rounded flex items-center justify-between gap-3 ${
              isHere ? "border-[var(--color-gold)] bg-[var(--color-gold)]/10" : ""
            }`}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-num text-xs text-[var(--color-muted)] opacity-70">
                  #{String(reg.id + 1).padStart(2, "0")}
                </span>
                <span className="font-display text-sm text-[var(--color-gold-soft)] truncate">
                  {reg.name}
                </span>
              </div>
              <div className="text-[11px] text-[var(--color-muted)] mt-0.5">
                Bioma: <span className="capitalize text-[var(--color-ink)]">{reg.biome}</span>
                <span className="mx-1.5 opacity-40">·</span>
                Coord: ({Math.round(reg.centroid[0])}, {Math.round(reg.centroid[1])})
              </div>
            </div>

            {isHere ? (
              <span className="text-[10px] tracking-wider uppercase text-[var(--color-gold)] px-2 py-0.5 bg-[var(--color-gold)]/20 border border-[var(--color-gold)]/40 rounded">
                Qui
              </span>
            ) : (
              <button
                onClick={() => onGo(reg.id)}
                className="btn btn-sm shrink-0"
              >
                Viaggia
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ----------------------------------------------------
   5. BESTIARIO (Tasto B)
---------------------------------------------------- */
export function BestiaryPanel() {
  const [selected, setSelected] = useState<number>(0);
  const m = MONSTERS[selected];

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-[var(--color-muted)] italic">
        36 creature avvistate nelle terre di Borealia.
      </p>

      {/* Riquadro Dettaglio Mostro */}
      {m && (
        <div className="panel-inset p-3.5 flex flex-col items-center gap-3">
          <div className="w-48 aspect-[400/569] overflow-hidden rounded border border-[var(--color-border)] shadow-lg bg-black/60 flex items-center justify-center">
            <img
              src={asset(m.img)}
              alt={m.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = "none";
              }}
            />
          </div>
          <div className="text-center">
            <h3 className="font-display text-base text-[var(--color-gold)]">{m.name}</h3>
            <span
              className={`text-xs font-semibold uppercase tracking-wider ${
                m.baseTier === "comune"
                  ? "rar-comune"
                  : m.baseTier === "noncomune"
                  ? "rar-noncomune"
                  : m.baseTier === "raro"
                  ? "rar-raro"
                  : "rar-mitico"
              }`}
            >
              Grado: {m.baseTier || "Sconosciuto"}
            </span>
          </div>
        </div>
      )}

      {/* Griglia Selezione Creature */}
      <div className="grid grid-cols-4 gap-1.5">
        {MONSTERS.map((monster) => {
          const isSel = selected === monster.frame;
          return (
            <button
              key={monster.frame}
              onClick={() => setSelected(monster.frame)}
              className={`p-1.5 rounded border text-center transition-all ${
                isSel
                  ? "border-[var(--color-gold)] bg-[var(--color-gold)]/15"
                  : "border-[var(--color-border)] bg-black/30 hover:border-[var(--color-gold)]/50"
              }`}
              title={monster.name}
            >
              <div className="font-num text-[10px] text-[var(--color-muted)]">
                #{String(monster.frame + 1).padStart(2, "0")}
              </div>
              <div className="text-[11px] truncate text-[var(--color-ink)] mt-0.5">
                {monster.name}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
