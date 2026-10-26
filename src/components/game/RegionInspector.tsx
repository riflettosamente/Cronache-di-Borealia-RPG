import { useState } from "react";
import { REGIONS } from "@/game/engine";
import { MAP_W, MAP_H } from "@/game/terrain";
import cutouts from "@/game/data/cutouts.json";
import { asset } from "@/game/assets";
import { Info, X } from "lucide-react";

interface RegionInspectorProps {
  current: number | null;
  onClose?: () => void;
}

const BIOME_COLORS: Record<string, string> = {
  pianura: "#7fa055",
  foresta: "#3e6b34",
  montagna: "#8d8d94",
  deserto: "#c9a24b",
  palude: "#6b7c46",
  isola: "#2e6b8a",
  mare: "#2e6b8a",
  fiume: "#3d8fa8",
  lago: "#3d8fa8",
  "fiume o lago": "#3d8fa8",
  fiume_lago: "#3d8fa8",
};

export default function RegionInspector({ current, onClose }: RegionInspectorProps) {
  const [selectedId, setSelectedId] = useState<number | null>(current);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [showList, setShowList] = useState(true);

  const selectedRegion =
    selectedId !== null ? REGIONS.find((r) => r.id === selectedId) : null;

  return (
    <div className="absolute inset-0 pointer-events-auto z-20 overflow-hidden">
      {/* Sfondo scuro semitrasparente per far risaltare le regioni ispezionate */}
      <div className="absolute inset-0 bg-black/40 pointer-events-none" />

      {/* LAYER DEI VERO CUTOUT (sagome pixel-perfect con trasparenza) */}
      <div className="absolute inset-0 pointer-events-none">
        {cutouts.map((c) => {
          const reg = REGIONS.find((r) => r.id === c.id);
          const isSel = selectedId === c.id;
          const isCur = current === c.id;
          const isHov = hoveredId === c.id;
          const active = isSel || isHov;

          return (
            <div
              key={c.id}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedId(c.id);
              }}
              onMouseEnter={() => setHoveredId(c.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                position: "absolute",
                left: `${(c.x / MAP_W) * 100}%`,
                top: `${(c.y / MAP_H) * 100}%`,
                width: `${(c.w / MAP_W) * 100}%`,
                height: `${(c.h / MAP_H) * 100}%`,
                cursor: "pointer",
              }}
              className="pointer-events-auto select-none"
              title={reg ? `#${reg.id + 1} - ${reg.name} (${reg.biome})` : ""}
            >
              <img
                src={asset(c.file)}
                alt={reg?.name ?? `Regione ${c.id + 1}`}
                draggable={false}
                className={`w-full h-full object-fill transition-all duration-200 ${
                  active
                    ? "insp-lit opacity-100 z-10"
                    : isCur
                    ? "opacity-85 brightness-110 drop-shadow-[0_0_10px_rgba(100,200,255,0.7)]"
                    : "opacity-40 hover:opacity-90"
                }`}
              />
            </div>
          );
        })}
      </div>

      {/* Numeri identificativi al centroide di ciascuna regione */}
      <svg
        viewBox={`0 0 ${MAP_W} ${MAP_H}`}
        className="absolute inset-0 w-full h-full pointer-events-none"
        preserveAspectRatio="none"
      >
        {REGIONS.map((region) => {
          const isSel = selectedId === region.id;
          const isCur = current === region.id;
          const isHov = hoveredId === region.id;
          const active = isSel || isHov;

          return (
            <g key={region.id}>
              {/* Cerchio di sfondo al numero se selezionato o attivo */}
              {active && (
                <circle
                  cx={region.centroid[0]}
                  cy={region.centroid[1]}
                  r="24"
                  fill="rgba(0, 0, 0, 0.65)"
                  stroke="#ffdf9b"
                  strokeWidth="2"
                />
              )}
              <text
                x={region.centroid[0]}
                y={region.centroid[1]}
                textAnchor="middle"
                dominantBaseline="central"
                className={`insp-num transition-all duration-200 ${
                  active ? "insp-num-on" : ""
                }`}
                style={{
                  fill: isSel ? "#ffe89d" : isCur ? "#88ddff" : undefined,
                }}
              >
                {region.id + 1}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Pulsante rapido chiudi inspector in alto a sinistra */}
      {onClose && (
        <button
          onClick={onClose}
          className="btn btn-sm absolute top-3 left-3 z-30 flex items-center gap-1.5 bg-black/80 hover:bg-black text-white border border-[var(--color-border)]"
          title="Esci dalla modalità Regioni"
        >
          <X className="w-3.5 h-3.5 text-[var(--color-gold)]" />
          <span>Chiudi Regioni</span>
        </button>
      )}

      {/* Pannello Dettaglio Regione Selezionata (in basso a sinistra) */}
      {selectedRegion && (
        <div className="panel absolute bottom-4 left-4 z-30 p-3 w-80 max-w-[90vw] bg-black/95 border border-[var(--color-gold)] shadow-2xl animate-fadein">
          {/* Immagine di panorama della regione */}
          <div className="relative mb-2.5 h-28 w-full overflow-hidden rounded border border-[var(--color-border)] shadow-inner">
            <img
              src={asset(selectedRegion.bg)}
              alt={selectedRegion.name}
              className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />
            <span className="font-num absolute bottom-2 left-2 text-xs px-1.5 py-0.5 rounded bg-black/70 text-[var(--color-gold)] font-bold border border-[var(--color-gold)]/40 shadow">
              #{String(selectedRegion.id + 1).padStart(2, "0")}
            </span>
            <span
              className="absolute bottom-2 right-2 text-[10px] px-2 py-0.5 rounded-full font-medium capitalize text-white shadow"
              style={{
                backgroundColor:
                  BIOME_COLORS[selectedRegion.biome.toLowerCase()] || "#c8a567",
              }}
            >
              {selectedRegion.biome}
            </span>
            <button
              onClick={() => setSelectedId(null)}
              className="absolute top-1.5 right-1.5 rounded bg-black/60 p-1 text-white/80 hover:text-white hover:bg-black/90 transition-colors"
              title="Deseleziona"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center justify-between gap-2 mb-2 border-b border-[var(--color-border)] pb-1.5">
            <h3 className="font-display text-base text-[var(--color-gold)] truncate">
              {selectedRegion.name}
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="stat-key text-[var(--color-muted)]">Bioma:</span>
              <div className="capitalize font-medium text-[var(--color-ink)] mt-0.5 flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                  style={{
                    backgroundColor:
                      BIOME_COLORS[selectedRegion.biome.toLowerCase()] || "#c8a567",
                  }}
                />
                <span>{selectedRegion.biome}</span>
              </div>
            </div>
            <div>
              <span className="stat-key text-[var(--color-muted)]">Centroide:</span>
              <div className="font-num text-[var(--color-gold-soft)] mt-0.5">
                ({Math.round(selectedRegion.centroid[0])},{" "}
                {Math.round(selectedRegion.centroid[1])})
              </div>
            </div>
          </div>
          {current === selectedRegion.id && (
            <div className="mt-2.5 pt-2 border-t border-[var(--color-border)]/60 text-[11px] text-green-400 font-medium">
              📍 Il tuo personaggio si trova attualmente qui.
            </div>
          )}
        </div>
      )}

      {/* Lista laterale scorrevole delle 23 regioni (a destra) */}
      <div className="absolute right-3 top-3 bottom-14 z-30 flex flex-col items-end pointer-events-none">
        <button
          onClick={() => setShowList((v) => !v)}
          className="btn btn-sm pointer-events-auto mb-2 flex items-center gap-1.5 bg-black/85 shadow-md border border-[var(--color-border)]"
        >
          <Info className="w-3.5 h-3.5 text-[var(--color-gold)]" />
          <span>{showList ? "Nascondi Lista" : "Mostra Lista (23)"}</span>
        </button>

        {showList && (
          <div className="panel pointer-events-auto w-64 max-h-full overflow-y-auto log-scroll p-2 bg-black/95 shadow-2xl border border-[var(--color-border)]">
            <h4 className="font-display text-xs text-[var(--color-gold-soft)] px-2 py-1 mb-1 border-b border-[var(--color-border)]">
              Tutte le 23 Regioni
            </h4>
            <div className="flex flex-col gap-0.5">
              {REGIONS.map((reg) => {
                const isSel = selectedId === reg.id;
                const isCur = current === reg.id;
                const isHov = hoveredId === reg.id;
                return (
                  <button
                    key={reg.id}
                    onClick={() => setSelectedId(reg.id)}
                    onMouseEnter={() => setHoveredId(reg.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    className={`insp-row text-left rounded text-xs transition-colors ${
                      isSel
                        ? "insp-row-on text-[var(--color-gold)] font-semibold border-[var(--color-gold)]/60 bg-[var(--color-gold)]/15"
                        : isHov
                        ? "bg-white/10 text-white"
                        : "text-[var(--color-ink)]"
                    } ${isCur ? "border-l-2 border-l-cyan-400" : ""}`}
                  >
                    <span className="font-num text-[11px] text-[var(--color-muted)] shrink-0 w-6">
                      #{String(reg.id + 1).padStart(2, "0")}
                    </span>
                    <span className="truncate flex-1">
                      {reg.name}
                    </span>
                    <span
                      className="w-2 h-2 rounded-full shrink-0 opacity-80"
                      style={{
                        backgroundColor:
                          BIOME_COLORS[reg.biome.toLowerCase()] || "#c8a567",
                      }}
                      title={reg.biome}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
