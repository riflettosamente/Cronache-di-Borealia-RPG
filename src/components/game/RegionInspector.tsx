import { useState } from "react";
import { REGIONS, type RegionData } from "@/game/engine";
import { MAP_W, MAP_H } from "@/game/terrain";
import { Info, X } from "lucide-react";

interface RegionInspectorProps {
  current: number | null;
}

const BIOME_COLORS: Record<string, string> = {
  pianura: "#7fa055",
  foresta: "#3e6b34",
  montagna: "#8d8d94",
  deserto: "#c9a24b",
  palude: "#6b7c46",
  isola: "#2e6b8a",
  mare: "#2e6b8a",
};

export default function RegionInspector({ current }: RegionInspectorProps) {
  const [selectedId, setSelectedId] = useState<number | null>(current);
  const [showList, setShowList] = useState(true);

  const selectedRegion =
    selectedId !== null ? REGIONS.find((r) => r.id === selectedId) : null;

  return (
    <div className="absolute inset-0 pointer-events-auto z-20 overflow-hidden">
      {/* Layer SVG per le 23 Regioni (poligoni e numeri identificativi) */}
      <svg
        viewBox={`0 0 ${MAP_W} ${MAP_H}`}
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="none"
      >
        {REGIONS.map((region) => {
          const isSel = selectedId === region.id;
          const isCur = current === region.id;
          const color = BIOME_COLORS[region.biome.toLowerCase()] || "#c8a567";
          const pointsStr = region.poly.map(([x, y]) => `${x},${y}`).join(" ");

          return (
            <g
              key={region.id}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedId(region.id);
              }}
              className="cursor-pointer group"
            >
              {/* Sagoma poligono */}
              <polygon
                points={pointsStr}
                fill={color}
                fillOpacity={isSel ? 0.65 : isCur ? 0.45 : 0.25}
                stroke={isSel ? "#ffdf9b" : isCur ? "#ffffff" : color}
                strokeWidth={isSel ? 5 : 2}
                strokeDasharray={isCur && !isSel ? "6,4" : undefined}
                className="transition-all duration-200 group-hover:fill-opacity-50"
              />

              {/* Numero identificativo al centroide */}
              <text
                x={region.centroid[0]}
                y={region.centroid[1]}
                textAnchor="middle"
                dominantBaseline="central"
                className={`insp-num ${isSel ? "insp-num-on" : ""}`}
              >
                {region.id + 1}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Pannello Dettaglio Regione Selezionata (in basso a sinistra) */}
      {selectedRegion && (
        <div className="panel absolute bottom-4 left-4 z-30 p-3.5 max-w-sm bg-black/90 border border-[var(--color-gold)] shadow-2xl">
          <div className="flex items-center justify-between gap-3 mb-2 border-b border-[var(--color-border)] pb-1.5">
            <div className="flex items-center gap-2">
              <span className="font-num text-xs px-1.5 py-0.5 rounded bg-[var(--color-gold)]/20 text-[var(--color-gold)] font-bold">
                #{String(selectedRegion.id + 1).padStart(2, "0")}
              </span>
              <h3 className="font-display text-base text-[var(--color-gold)]">
                {selectedRegion.name}
              </h3>
            </div>
            <button
              onClick={() => setSelectedId(null)}
              className="text-[var(--color-muted)] hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="stat-key">Bioma:</span>
              <div className="capitalize font-medium text-[var(--color-ink)] mt-0.5">
                {selectedRegion.biome}
              </div>
            </div>
            <div>
              <span className="stat-key">Centroide:</span>
              <div className="font-num text-[var(--color-gold-soft)] mt-0.5">
                ({Math.round(selectedRegion.centroid[0])},{" "}
                {Math.round(selectedRegion.centroid[1])})
              </div>
            </div>
          </div>
          {current === selectedRegion.id && (
            <div className="mt-2 text-[11px] text-green-400 italic">
              Il tuo personaggio si trova attualmente qui.
            </div>
          )}
        </div>
      )}

      {/* Lista laterale scorrevole delle 23 regioni (a destra) */}
      <div className="absolute right-3 top-3 bottom-14 z-30 flex flex-col items-end pointer-events-none">
        <button
          onClick={() => setShowList((v) => !v)}
          className="btn btn-sm pointer-events-auto mb-2 flex items-center gap-1.5 bg-black/80 shadow-md"
        >
          <Info className="w-3.5 h-3.5" />
          <span>{showList ? "Nascondi Lista" : "Mostra Lista (23)"}</span>
        </button>

        {showList && (
          <div className="panel pointer-events-auto w-64 max-h-full overflow-y-auto log-scroll p-2 bg-black/90 shadow-2xl border border-[var(--color-border)]">
            <h4 className="font-display text-xs text-[var(--color-gold-soft)] px-2 py-1 mb-1 border-b border-[var(--color-border)]">
              Tutte le 23 Regioni
            </h4>
            <div className="flex flex-col gap-0.5">
              {REGIONS.map((reg) => {
                const isSel = selectedId === reg.id;
                const isCur = current === reg.id;
                return (
                  <button
                    key={reg.id}
                    onClick={() => setSelectedId(reg.id)}
                    className={`insp-row text-left rounded text-xs transition-colors ${
                      isSel ? "insp-row-on text-[var(--color-gold)] font-semibold" : ""
                    } ${isCur ? "border-l-2 border-l-white" : ""}`}
                  >
                    <span className="font-num text-[11px] text-[var(--color-muted)] shrink-0 w-6">
                      #{String(reg.id + 1).padStart(2, "0")}
                    </span>
                    <span className="truncate flex-1 text-[var(--color-ink)]">
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
