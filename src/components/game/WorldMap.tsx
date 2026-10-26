import React, { useEffect, useState } from "react";
import cutouts from "@/game/data/cutouts.json";
import { asset } from "@/game/assets";
import { MAP_W, MAP_H, terrainAt, TERRAIN, TERRAIN_COLORS, OVERLAY_CELLS } from "@/game/terrain";
import RegionInspector from "./RegionInspector";
import { Compass } from "lucide-react";

/** genera il layer "Zone" (tilebloczone originale) come immagine canvas 1920x1080 */
function buildZoneLayer(): string {
  const cv = document.createElement("canvas");
  cv.width = MAP_W;
  cv.height = MAP_H;
  const ctx = cv.getContext("2d")!;
  ctx.globalAlpha = 1.0;
  for (const cell of OVERLAY_CELLS) {
    if (cell.zone > 0) {
      ctx.fillStyle = TERRAIN_COLORS[cell.zone] ?? "#888";
      ctx.fillRect(cell.x, cell.y, cell.w, cell.h);
      ctx.strokeStyle = "rgba(0,0,0,0.3)";
      ctx.lineWidth = 1;
      ctx.strokeRect(cell.x, cell.y, cell.w, cell.h);
    }
  }
  return cv.toDataURL("image/png");
}

interface WorldMapProps {
  stage: { w: number; h: number };
  avatar: { x: number; y: number };
  target: { x: number; y: number } | null;
  moving: boolean;
  stepDuration: number;
  regionId: number | null;
  currentRegionName?: string;
  inspect: boolean;
  onCloseInspect: () => void;
  showZones: boolean;
  overlayOpen: boolean;
  isPaused: boolean;
  cursor: { x: number; y: number } | null;
  distKm: number | null;
  onMapClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseLeave: () => void;
  onAvatarClick: () => void;
}

export default function WorldMap({
  stage,
  avatar,
  target,
  moving,
  stepDuration,
  regionId,
  currentRegionName,
  inspect,
  onCloseInspect,
  showZones,
  overlayOpen,
  isPaused,
  cursor,
  distKm,
  onMapClick,
  onMouseMove,
  onMouseLeave,
  onAvatarClick,
}: WorldMapProps) {
  const [zoneLayer, setZoneLayer] = useState<string | null>(null);

  useEffect(() => {
    if (showZones && !zoneLayer) {
      setZoneLayer(buildZoneLayer());
    }
  }, [showZones, zoneLayer]);
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div
        className={`relative ${moving || overlayOpen || isPaused ? "" : "map-wrap"}`}
        style={{ width: stage.w || "100%", height: stage.h || "100%" }}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        onClick={onMapClick}
      >
        {/* LAYER 0 — mappa del mondo (sfondo-sheet0.png originale) */}
        <img
          src={asset("sprites/map.jpg")}
          alt="Mappa del mondo"
          draggable={false}
          className="absolute inset-0 h-full w-full"
        />

        {/* LAYER 1 — sagome reali delle 23 regioni (alpha di regioneN-sheet0.png) */}
        {cutouts.map((c) => {
          const cur = regionId === c.id;
          return (
            <img
              key={c.id}
              src={asset(c.file)}
              alt=""
              draggable={false}
              className={`cutout ${cur ? "cutout-active" : ""}`}
              style={{
                left: `${(c.x / MAP_W) * 100}%`,
                top: `${(c.y / MAP_H) * 100}%`,
                width: `${(c.w / MAP_W) * 100}%`,
                height: `${(c.h / MAP_H) * 100}%`,
              }}
            />
          );
        })}

        {/* LAYER 2 — zone di terreno (tilebloczone: mare/palude/deserto/pianura/fiume/bosco/montagne) */}
        {showZones && zoneLayer && (
          <img
            src={zoneLayer}
            alt="Layer zone"
            draggable={false}
            className="zone-layer pointer-events-none absolute inset-0 h-full w-full"
          />
        )}

        {/* pin destinazione */}
        {target && (
          <span
            className="map-pin"
            style={{
              left: `${(target.x / MAP_W) * 100}%`,
              top: `${(target.y / MAP_H) * 100}%`,
            }}
          />
        )}

        {/* LAYER 5 — avatar del giocatore */}
        <div
          className={`map-avatar absolute w-[2.8%] z-10 select-none ${
            moving ? "map-avatar-walk pointer-events-none" : "pointer-events-auto cursor-pointer"
          }`}
          style={{
            left: `${(avatar.x / MAP_W) * 100}%`,
            top: `${(avatar.y / MAP_H) * 100}%`,
            transform: "translate(-50%,-50%)",
            transitionDuration: moving ? `${stepDuration}ms` : "600ms",
            transitionTimingFunction: "linear",
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (moving || overlayOpen || isPaused) return;
            onAvatarClick();
          }}
          title={
            currentRegionName
              ? `Clicca per esplorare ${currentRegionName}`
              : "Il tuo personaggio"
          }
        >
          <img
            src={asset("sprites/avatarpg.webp")}
            alt="Il tuo personaggio"
            draggable={false}
            className="w-full h-full object-contain filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.85)]"
          />
        </div>

        <div className="vignette pointer-events-none absolute inset-0" />

        {/* LAYER 3 — ispettore regioni (verifica sagome) */}
        {inspect && <RegionInspector current={regionId} onClose={onCloseInspect} />}

        {/* Legenda zone */}
        {showZones && !overlayOpen && (
          <div className="panel absolute bottom-3 left-3 z-10 flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2">
            {(Object.keys(TERRAIN) as unknown as number[]).map((z) => (
              <span key={z} className="flex items-center gap-1.5">
                <i
                  className="inline-block h-2.5 w-2.5"
                  style={{ background: TERRAIN_COLORS[z as unknown as number] }}
                />
                <span className="text-[10px] italic text-[var(--color-muted)]">
                  {TERRAIN[z as unknown as number]}
                </span>
              </span>
            ))}
          </div>
        )}

        {/* Etichetta bioma sotto il cursore quando zone è attivo */}
        {showZones && cursor && !overlayOpen && !inspect && (
          <div
            className="pointer-events-none absolute z-20 -translate-x-1/2 translate-y-3"
            style={{
              left: `${(cursor.x / MAP_W) * 100}%`,
              top: `${(cursor.y / MAP_H) * 100}%`,
            }}
          >
            <span className="panel px-2.5 py-1 font-display text-xs text-[var(--color-gold-soft)] shadow-xl bg-black/90 border border-[var(--color-gold)]/60">
              {terrainAt(cursor.x, cursor.y)}
            </span>
          </div>
        )}

        {/* Badge scala cartografica e distanza (in basso a destra) */}
        {!overlayOpen && !inspect && (
          <div className="panel pointer-events-none absolute bottom-3 right-3 z-10 p-2.5 bg-black/85 backdrop-blur-sm border border-[var(--color-gold)]/60 shadow-2xl min-w-[155px]">
            <div className="flex items-center justify-between gap-2 border-b border-[var(--color-border)] pb-1 mb-1.5">
              <div className="flex items-center gap-1.5 text-[var(--color-gold)]">
                <Compass className="w-3.5 h-3.5 text-[var(--color-gold)] shrink-0" />
                <span className="font-display text-[11px] uppercase tracking-wider">
                  {moving ? "In Cammino" : "Distanza"}
                </span>
              </div>
              <span className="font-num text-xs text-[var(--color-gold-soft)] font-bold">
                {distKm !== null ? `${distKm} km` : "—"}
              </span>
            </div>

            {/* Mini-scala cartografica */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[9px] font-num text-[var(--color-muted)] px-0.5">
                <span>0</span>
                <span className="text-[var(--color-gold-soft)] font-medium">10 km</span>
                <span>20 km</span>
              </div>
              <div className="flex h-1.5 w-full border border-[var(--color-border)] rounded-sm overflow-hidden bg-black/80">
                <div className="w-1/2 bg-[var(--color-gold)]/80 border-r border-black" />
                <div className="w-1/2 bg-white/35" />
              </div>
              <span className="text-[9px] text-center italic text-[var(--color-muted)] mt-0.5">
                1 cella = 10 km
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
