import { useState } from "react";
import { GATHERABLES, type RegionData, type Spawn } from "@/game/engine";
import { asset } from "@/game/assets";
import { Compass, Flame, ArrowLeft, Eye } from "lucide-react";

export interface GatherResult {
  x: number;
  y: number;
  lootText: string;
  xpText: string;
  professione: string;
}

interface RegionSceneProps {
  region: RegionData;
  spawns: Spawn[];
  explored: boolean;
  onExplore: () => void;
  onGather: (key: number) => GatherResult | null;
  onCamp: () => void;
  onLeave: () => void;
}

export default function RegionScene({
  region,
  spawns,
  explored,
  onExplore,
  onGather,
  onCamp,
  onLeave,
}: RegionSceneProps) {
  const [floatingNotices, setFloatingNotices] = useState<
    { id: number; x: number; y: number; lootText: string; xpText: string }[]
  >([]);

  const handleGatherClick = (key: number) => {
    const res = onGather(key);
    if (!res) return;

    const id = Date.now() + Math.random();
    setFloatingNotices((prev) => [
      ...prev,
      { id, x: res.x, y: res.y, lootText: res.lootText, xpText: res.xpText },
    ]);

    setTimeout(() => {
      setFloatingNotices((prev) => prev.filter((n) => n.id !== id));
    }, 1400);
  };
  return (
    <div className="scene relative w-full h-full flex flex-col justify-between overflow-hidden bg-black select-none">
      {/* Sfondo illustrato con animazione Ken Burns */}
      <img
        src={asset(region.bg)}
        alt={region.name}
        className="scene-bg absolute inset-0 w-full h-full object-cover pointer-events-none"
        onError={(e) => {
          // Fallback con gradiente e pattern se il JPG non è ancora generato
          (e.currentTarget as HTMLElement).style.display = "none";
        }}
      />

      {/* Sfumatura e vignettatura cinematografica */}
      <div className="vignette absolute inset-0 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/70 pointer-events-none" />

      {/* Testata Superiore: Nome Regione, Bioma e Tasto Esci */}
      <header className="relative z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="font-num text-xs text-[var(--color-gold)] opacity-70">
              #{String(region.id + 1).padStart(2, "0")}
            </span>
            <h2 className="font-display text-xl sm:text-2xl text-[var(--color-gold)] drop-shadow-md">
              {region.name}
            </h2>
            <span className="text-xs uppercase tracking-wider px-2 py-0.5 rounded bg-black/60 border border-[var(--color-border)] text-[var(--color-ink)]">
              {region.biome}
            </span>
          </div>
          <p className="text-xs italic text-[var(--color-muted)] mt-0.5">
            Terre selvagge di Borealia · Coord ({Math.round(region.centroid[0])},{" "}
            {Math.round(region.centroid[1])})
          </p>
        </div>

        <button
          onClick={onLeave}
          className="btn btn-sm flex items-center gap-1.5 shadow-lg"
          title="Ritorna alla mappa del mondo"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Mappa</span>
        </button>
      </header>

      {/* Area Centrale: Nodi di Raccolta (Spawns) posizionati nel paesaggio */}
      <div className="relative flex-1 min-h-0">
        {spawns.map((spawn) => {
          const g = GATHERABLES.find((x) => x.id === spawn.gid);
          if (!g) return null;

          return (
            <button
              key={spawn.key}
              onClick={() => handleGatherClick(spawn.key)}
              className="pickup group"
              style={{
                left: `${spawn.x}%`,
                top: `${spawn.y}%`,
                transform: "translate(-50%, -50%)",
              }}
              title={`${g.azione} ${g.id}`}
            >
              {/* Alone pulsante di interazione */}
              <div className="pickup-halo bg-[var(--color-gold)]/20 animate-pulse border border-[var(--color-gold)]/30" />

              <img
                src={asset(g.sprite)}
                alt={g.id}
                className="w-12 h-12 sm:w-14 sm:h-14 object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,.9)]"
                onError={(e) => {
                  // Fallback etichetta se sprite non ancora presente
                  (e.currentTarget as HTMLElement).style.display = "none";
                }}
              />

              {/* Tooltip hovering con azione e nome */}
              <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="panel px-2 py-0.5 text-[11px] font-display text-[var(--color-gold-soft)] whitespace-nowrap shadow-xl">
                  {g.azione} {g.id}
                </span>
              </div>
            </button>
          );
        })}

        {/* Testo Fluttuante di Raccolta (Loot ed XP che scorrono verso l'alto) */}
        {floatingNotices.map((notice) => (
          <div
            key={notice.id}
            className="floating-gather-notice"
            style={{
              left: `${notice.x}%`,
              top: `${notice.y}%`,
            }}
          >
            {/* Scritta Oggetto Raccolto (oro / bianco brillante con badge) */}
            <span className="font-display font-bold text-xs sm:text-sm tracking-wide text-amber-200 bg-black/85 px-2.5 py-0.5 rounded border border-amber-500/70 shadow-xl whitespace-nowrap">
              {notice.lootText}
            </span>
            {/* Scritta XP di avvenuta raccolta (verde smeraldo brillante) */}
            <span className="font-display font-semibold text-[11px] sm:text-xs tracking-wider text-emerald-300 bg-black/85 px-2 py-0.5 rounded border border-emerald-500/60 shadow-lg whitespace-nowrap">
              ✦ {notice.xpText}
            </span>
          </div>
        ))}

        {/* Messaggio centrale se non ci sono elementi attivi */}
        {spawns.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="panel p-4 text-center max-w-sm mx-4 bg-black/75 border border-[var(--color-border)] shadow-2xl">
              {explored ? (
                <>
                  <p className="font-display text-sm text-[var(--color-gold-soft)]">
                    Zona Perlustrata
                  </p>
                  <p className="text-xs text-[var(--color-muted)] mt-1">
                    Hai raccolto tutte le risorse in vista. Puoi accamparti per riposare o tornare
                    alla mappa.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-display text-sm text-[var(--color-gold)]">
                    Territorio Inesplorato
                  </p>
                  <p className="text-xs text-[var(--color-muted)] mt-1">
                    Usa il comando &quot;Esplora&quot; in basso per perlustrare la zona in cerca di risorse
                    o fare attenzione a eventuali pericoli.
                  </p>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Barra Inferiore dei Comandi Regionali */}
      <footer className="relative z-10 flex flex-wrap items-center justify-between gap-3 p-4 bg-gradient-to-t from-black/85 via-black/60 to-transparent border-t border-[var(--color-border)]/50">
        <div className="flex items-center gap-2">
          {/* Tasto Esplora */}
          <button
            onClick={onExplore}
            disabled={spawns.length > 0}
            className={`btn btn-sm flex items-center gap-2 ${
              spawns.length === 0 ? "btn-gold" : "opacity-50 cursor-not-allowed"
            }`}
            title={
              spawns.length > 0
                ? "Hai già risorse visibili da raccogliere"
                : "Perlustra i dintorni (può rivelare risorse o attirare creature)"
            }
          >
            <Compass className="w-4 h-4 text-[var(--color-gold)]" />
            <span>Esplora</span>
          </button>

          {/* Tasto Accampati */}
          <button
            onClick={onCamp}
            className="btn btn-sm flex items-center gap-2"
            title="Riposa per recuperare fino al 40% dei PV (12% rischio di attacco notturno)"
          >
            <Flame className="w-4 h-4 text-orange-400" />
            <span>Accampati</span>
          </button>
        </div>

        {/* Indicatore di stato nodi */}
        <div className="flex items-center gap-3 text-xs text-[var(--color-muted)]">
          {spawns.length > 0 ? (
            <div className="flex items-center gap-1.5 text-[var(--color-gold-soft)]">
              <Eye className="w-3.5 h-3.5" />
              <span>
                <b>{spawns.length}</b> nodi di raccolta visibili
              </span>
            </div>
          ) : (
            <span>Nessun nodo attivo</span>
          )}
        </div>
      </footer>
    </div>
  );
}
