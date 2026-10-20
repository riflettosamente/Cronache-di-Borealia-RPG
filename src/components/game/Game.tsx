import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  DATA, REGIONS, GATHERABLES, ITEMS, EDIBLE, initPG, initProfessioni, rollSpawns, spawnEnemy,
  gatherLoot, professionLevelFor, xpForLevel, hasBoat, type PG, type Professione, type Spawn, type Enemy,
} from "@/game/engine";
import { MAP_W, MAP_H, findPath, isWalkable, regionAt, terrainAt, OVERLAY_CELLS, TERRAIN, TERRAIN_COLORS } from "@/game/terrain";
import cutouts from "@/game/data/cutouts.json";
import { asset } from "@/game/assets";
import RegionScene from "./RegionScene";
import CombatScene from "./CombatScene";
import RegionInspector from "./RegionInspector";
import {
  CharacterPanel, BagPanel, DiaryPanel, AtlasPanel, BestiaryPanel,
  PANEL_LABEL, PANEL_KEY, type PanelId, type LogEntry,
} from "./Panels";
import { Maximize, Minimize } from "lucide-react";

type View = "menu" | "map" | "region" | "combat" | "dead";
const SAVE = "rpg-alfa-015";
let logId = 1;

interface Save {
  pg: PG; professions: Record<string, Professione>; inventory: Record<string, number>;
  avatar: { x: number; y: number }; regionId: number | null; turno: number;
}

/** genera il layer "Zone" (tilebloczone originale) come immagine canvas 1920x1080 */
function buildZoneLayer(): string {
  const cv = document.createElement("canvas");
  cv.width = MAP_W; cv.height = MAP_H;
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

export default function Game() {
  const [view, setView] = useState<View>("menu");
  const [pg, setPg] = useState<PG>(initPG);
  const [professions, setProfessions] = useState(initProfessioni);
  const [inventory, setInventory] = useState<Record<string, number>>({ Rametti: 3, "Carne cruda": 1 });
  const [avatar, setAvatar] = useState({ x: 300, y: 700 });
  const [target, setTarget] = useState<{ x: number; y: number } | null>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const [regionId, setRegionId] = useState<number | null>(null);
  const [hoverId, setHoverId] = useState<number | null>(null);
  const [spawns, setSpawns] = useState<Spawn[]>([]);
  const [explored, setExplored] = useState(false);
  const [enemy, setEnemy] = useState<Enemy | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [moving, setMoving] = useState(false);
  const [turno, setTurno] = useState(0);
  const [hasSave, setHasSave] = useState(false);
  const [panel, setPanel] = useState<PanelId | null>(null);
  const [inspect, setInspect] = useState(false);
  const [showZones, setShowZones] = useState(false);
  const [zoneLayer, setZoneLayer] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const isPaused = inspect || showZones;

  const areaRef = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState({ w: 0, h: 0 });
  const walkTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const addLog = useCallback((text: string, kind: LogEntry["kind"] = "info") => {
    setLog((l) => [{ id: logId++, text, kind }, ...l].slice(0, 80));
  }, []);

  /* ---- gestione schermo intero ---- */
  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  /* ---- layer zone prerendered (una sola volta) ---- */
  useEffect(() => {
    if (showZones && !zoneLayer) {
      const id = requestAnimationFrame(() => setZoneLayer(buildZoneLayer()));
      return () => cancelAnimationFrame(id);
    }
  }, [showZones, zoneLayer]);

  /* ---- dimensione del "palco" 16:9 dentro l'area disponibile ---- */
  useLayoutEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      const s = Math.min(r.width / MAP_W, r.height / MAP_H);
      setStage({ w: MAP_W * s, h: MAP_H * s });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [view]);

  useEffect(() => { setHasSave(!!localStorage.getItem(SAVE)); }, []);
  // in pausa il riquadro info torna a mostrare la posizione del personaggio solo se in inspect regioni
  useEffect(() => { if (inspect) { setCursor(null); setHoverId(null); } }, [inspect]);
  useEffect(() => {
    if (view === "menu" || view === "dead") return;
    try { localStorage.setItem(SAVE, JSON.stringify({ pg, professions, inventory, avatar, regionId, turno } as Save)); setHasSave(true); } catch { }
  }, [pg, professions, inventory, avatar, regionId, turno, view]);
  useEffect(() => () => { if (walkTimer.current) clearInterval(walkTimer.current); }, []);

  /* ---- scorciatoie da tastiera ---- */
  useEffect(() => {
    if (view === "menu" || view === "dead") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setInspect(false); setShowZones(false); setPanel(null); return; }
      const k = e.key.toUpperCase();
      if (k === "R") { setInspect((v) => !v); return; }
      if (k === "Z") { setShowZones((v) => !v); return; }
      const hit = (Object.keys(PANEL_KEY) as PanelId[]).find((p) => PANEL_KEY[p] === k);
      if (hit) setPanel((cur) => (cur === hit ? null : hit));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view]);

  const start = (fresh: boolean) => {
    if (fresh) {
      localStorage.removeItem(SAVE);
      setPg(initPG()); setProfessions(initProfessioni());
      setInventory({ Rametti: 3, "Carne cruda": 1 });
      setAvatar({ x: 300, y: 700 }); setRegionId(null); setTurno(0); setLog([]);
      addLog("Inizia la tua avventura nelle terre selvagge.", "good");
    } else {
      try {
        const s: Save = JSON.parse(localStorage.getItem(SAVE) || "{}");
        if (s.pg) { setPg(s.pg); setProfessions(s.professions); setInventory(s.inventory); setAvatar(s.avatar); setRegionId(s.regionId); setTurno(s.turno ?? 0); }
        addLog("Riprendi il viaggio da dove lo avevi lasciato.", "info");
      } catch { }
    }
    setSpawns([]); setEnemy(null); setPanel(null); setView("map");
  };

  /* ---- conversione schermo -> coordinate mappa ---- */
  const toMap = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(MAP_W, ((e.clientX - r.left) / r.width) * MAP_W)),
      y: Math.max(0, Math.min(MAP_H, ((e.clientY - r.top) / r.height) * MAP_H)),
    };
  };

  /* ---- spostamento con pathfinding (gestione imbarcazione per mare aperto) ---- */
  const travel = (dest: { x: number; y: number }) => {
    if (moving || inspect || showZones) return;
    const boat = hasBoat(inventory);
    const wasWalkable = isWalkable(dest.x, dest.y, boat);
    const path = findPath(avatar, dest, boat);
    if (!path || path.length === 0) {
      addLog("Nessun cammino raggiungibile in quella direzione.", "warn");
      return;
    }
    setTarget(dest);
    setMoving(true);
    let i = 0;
    walkTimer.current = setInterval(() => {
      const step = path[i++];
      if (step) setAvatar(step);
      if (i >= path.length) {
        if (walkTimer.current) clearInterval(walkTimer.current);
        setMoving(false);
        setTarget(null);
        setTurno((t) => t + 1);
        const rid = regionAt(dest.x, dest.y);
        setRegionId(rid);
        if (rid !== null) {
          setSpawns([]); setExplored(false);
          addLog(`Giungi a ${REGIONS[rid].name} (${REGIONS[rid].biome}).`, "good");
          setView("region");
        } else {
          if (!wasWalkable && !boat) {
            addLog("Non puoi entrare in mare aperto senza una imbarcazione (zattera, barca, piroga, ecc.). Ti fermi al confine.", "warn");
          } else if (!wasWalkable) {
            addLog("Navighi in mare aperto con la tua imbarcazione.", "info");
          } else {
            addLog(`Ti sposti verso ${terrainAt(dest.x, dest.y).toLowerCase()}.`, "info");
          }
        }
      }
    }, 110);
  };

  const goToRegion = (id: number) => {
    setPanel(null);
    const r = REGIONS[id];
    travel({ x: r.centroid[0], y: r.centroid[1] });
  };

  const explore = () => {
    if (regionId === null) return;
    if (spawns.length > 0) { addLog("Hai già battuto questa zona: cerca un po' più in là…", "warn"); return; }
    const r = REGIONS[regionId];
    setTurno((t) => t + 1);
    if (Math.random() < DATA.spawnChance) { setEnemy(spawnEnemy(r.biome)); setView("combat"); return; }
    setSpawns(rollSpawns(r.biome)); setExplored(true);
    addLog("Esplori i dintorni e scorgi qualcosa fra la vegetazione.", "info");
  };

  const gather = (key: number) => {
    const sp = spawns.find((s) => s.key === key);
    const g = sp && GATHERABLES.find((x) => x.id === sp.gid);
    if (!sp || !g) return;
    const prof = professions[g.professione];
    const loot = gatherLoot(g, prof);
    setInventory((inv) => {
      const n = { ...inv };
      for (const [name, q] of loot) n[name] = (n[name] ?? 0) + q;
      return n;
    });
    addLog(`${g.azione} ${g.id}: ${loot.map(([n, q]) => `${n} +${q}`).join(", ")}.`, "loot");
    const nx = prof.xp + 1, nl = professionLevelFor(nx);
    if (nl > prof.livello) addLog(`${g.professione} sale al livello ${nl}!`, "good");
    setProfessions((p) => ({ ...p, [g.professione]: { xp: nx, livello: nl } }));
    setSpawns((s) => s.filter((x) => x.key !== key));
  };

  const camp = () => {
    if (regionId === null) return;
    setTurno((t) => t + 1);
    if (Math.random() < 0.12) {
      addLog("Il fuoco del campo ti ha tradito: qualcosa ti attacca!", "warn");
      setEnemy(spawnEnemy(REGIONS[regionId].biome)); setView("combat"); return;
    }
    setPg((p) => {
      const cure = Math.min(p.pvmax - p.pv, Math.ceil(p.pvmax * 0.4));
      addLog(cure > 0 ? `Ti accampi e recuperi ${cure} punti vita.` : "Ti accampi: sei già in piena forma.", cure > 0 ? "good" : "info");
      return { ...p, pv: p.pv + cure };
    });
  };

  const eat = (iconId: string) => {
    const item = ITEMS.find((i) => i.id === iconId);
    const eff = item ? EDIBLE[item.id] : undefined;
    if (!item || eff === undefined || (inventory[item.name] ?? 0) <= 0) return;
    setInventory((inv) => {
      const n = { ...inv, [item.name]: (inv[item.name] ?? 0) - 1 };
      if (n[item.name] <= 0) delete n[item.name];
      return n;
    });
    setPg((p) => ({ ...p, pv: Math.max(1, Math.min(p.pvmax, p.pv + eff)) }));
    addLog(eff >= 0 ? `Mangi ${item.name}: +${eff} vita.` : `${item.name} era velenoso: ${eff} vita!`, eff >= 0 ? "loot" : "warn");
  };

  const endCombat = (r: { outcome: "win" | "lose" | "flee"; pv: number }) => {
    if (r.outcome === "lose") { setPg((p) => ({ ...p, pv: 0 })); setEnemy(null); setView("dead"); return; }
    if (r.outcome === "win" && enemy) {
      setPg((p) => {
        let n = { ...p, pv: Math.max(1, r.pv), xp: p.xp + enemy.xpReward };
        while (n.xp >= xpForLevel(n.livello)) {
          n = { ...n, livello: n.livello + 1, pvmax: n.pvmax + 8 };
          n.pv = n.pvmax;
          if (n.livello % 2 === 0) n.att += 1;
          if (n.livello % 3 === 0) n.par += 1;
          addLog(`Sali al livello ${n.livello}! Vita ristorata.`, "good");
        }
        return n;
      });
      addLog(`Hai sconfitto ${enemy.name}: +${enemy.xpReward} esperienza.`, "loot");
    } else setPg((p) => ({ ...p, pv: Math.max(1, r.pv) }));
    setEnemy(null);
    setView(regionId !== null ? "region" : "map");
  };

  /* ---------------- MENU ---------------- */
  if (view === "menu") {
    return (
      <main className="relative flex min-h-screen items-center justify-center bg-cover bg-center" style={{ backgroundImage: `url(${asset("sprites/map.jpg")})` }}>
        <div className="absolute inset-0 bg-[var(--color-bg)]/80" />
        <div className="relative flex flex-col items-center gap-3 px-6">
          <img src={asset("sprites/loading-logo.webp")} alt="" className="mb-1 max-h-24 object-contain drop-shadow-[0_6px_18px_rgba(0,0,0,.8)]" />
          <h1 className="font-display text-center text-5xl md:text-6xl tracking-wide text-[var(--color-gold)] drop-shadow">RPG Sopravvivenza</h1>
          <p className="mb-5 italic text-[var(--color-muted)]">alfa 0.15 — ricostruzione dai dati recuperati</p>
          {hasSave && <button onClick={() => start(false)} className="btn btn-menu btn-gold">Continua</button>}
          <button onClick={() => start(true)} className="btn btn-menu">Nuova partita</button>
          <p className="mt-6 max-w-md text-center text-sm italic text-[var(--color-muted)]">
            23 regioni · 7 biomi · 36 mostri · 6 professioni — mappa, tabelle e creature originali.
          </p>
          <a href="/rpg-alfa-0.15-complete-project.zip" download
            className="mt-2 text-xs italic text-[var(--color-muted)] underline decoration-dotted underline-offset-4 hover:text-[var(--color-gold-soft)]">
            Scarica il progetto completo con asset originali (ZIP)
          </a>
        </div>
      </main>
    );
  }

  /* ---------------- MORTE ---------------- */
  if (view === "dead") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-5">
        <img src={asset("sprites/gameover.webp")} alt="Game over" className="max-h-[46vh] object-contain opacity-90" />
        <p className="italic text-[var(--color-muted)]">Le terre selvagge hanno avuto la meglio…</p>
        <button onClick={() => start(true)} className="btn btn-gold">Ricomincia</button>
      </main>
    );
  }

  const region = regionId !== null ? REGIONS[regionId] : null;
  const hoverRegion = hoverId !== null ? REGIONS[hoverId] : null;
  const info = cursor ?? avatar;
  const overlayOpen = view === "region" || view === "combat";

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* ---------- barra comandi ---------- */}
      <header className="flex shrink-0 items-center gap-5 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2">
        <h1 className="font-display text-lg tracking-wide text-[var(--color-gold)]">
          RPG Sopravvivenza <span className="ml-1 font-body text-xs italic text-[var(--color-muted)]">alfa 0.15</span>
        </h1>
        <nav className="flex items-center gap-1.5">
          {(Object.keys(PANEL_LABEL) as PanelId[]).map((p) => (
            <button key={p} onClick={() => setPanel((c) => (c === p ? null : p))}
              className={`btn btn-sm ${panel === p ? "btn-gold" : ""}`} title={`Tasto ${PANEL_KEY[p]}`}>
              {PANEL_LABEL[p]}
            </button>
          ))}
          <span className="mx-1 h-5 w-px bg-[var(--color-border)]" />
          <button onClick={() => setInspect((v) => !v)}
            className={`btn btn-sm ${inspect ? "btn-gold" : ""}`} title="Verifica regioni (tasto R)">
            Regioni
          </button>
          <button onClick={() => setShowZones((v) => !v)}
            className={`btn btn-sm ${showZones ? "btn-gold" : ""}`} title="Layer zone di terreno (tasto Z)">
            Zone
          </button>
        </nav>
        <div className="ml-auto flex items-center gap-3">
          {isPaused && <span className="pause-badge text-[10px]">IN PAUSA</span>}
          <span className="text-xs text-[var(--color-muted)]">Turno <b className="font-num text-[var(--color-gold-soft)]">{turno}</b></span>
          <button
            onClick={toggleFullscreen}
            className={`btn btn-sm ${isFullscreen ? "btn-gold" : ""}`}
            title={isFullscreen ? "Esci da Schermo Intero" : "Schermo Intero"}
          >
            {isFullscreen ? <Minimize className="h-3.5 w-3.5" /> : <Maximize className="h-3.5 w-3.5" />}
            <span>Full screen</span>
          </button>
          <button onClick={() => setView("menu")} className="btn btn-sm">Menu</button>
        </div>
      </header>

      {/* ---------- area di gioco: la mappa è la pagina ---------- */}
      <div ref={areaRef} className="relative min-h-0 flex-1 bg-black">
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className={`relative ${moving || overlayOpen || isPaused ? "" : "map-wrap"}`}
            style={{ width: stage.w || "100%", height: stage.h || "100%" }}
            onMouseMove={(e) => { if (overlayOpen || inspect) return; const p = toMap(e); setCursor(p); setHoverId(regionAt(p.x, p.y)); }}
            onMouseLeave={() => { if (inspect) return; setCursor(null); setHoverId(null); }}
            onClick={(e) => { if (overlayOpen || moving || isPaused) return; travel(toMap(e)); }}
          >
            {/* LAYER 0 — mappa del mondo (sfondo-sheet0.png originale) */}
            <img src={asset("sprites/map.jpg")} alt="Mappa del mondo" draggable={false} className="absolute inset-0 h-full w-full" />

            {/* LAYER 1 — sagome reali delle 23 regioni (alpha di regioneN-sheet0.png) */}
            {cutouts.map((c) => {
              const on = hoverId === c.id && !overlayOpen;
              const cur = regionId === c.id;
              return (
                <img key={c.id} src={asset(c.file)} alt="" draggable={false}
                  className={`cutout ${on ? "cutout-hover" : cur ? "cutout-active" : ""}`}
                  style={{ left: `${(c.x / MAP_W) * 100}%`, top: `${(c.y / MAP_H) * 100}%`, width: `${(c.w / MAP_W) * 100}%`, height: `${(c.h / MAP_H) * 100}%` }} />
              );
            })}

            {/* LAYER 2 — zone di terreno (tilebloczone: mare/palude/deserto/pianura/fiume/bosco/montagne) */}
            {showZones && zoneLayer && (
              <img src={zoneLayer} alt="Layer zone" draggable={false} className="zone-layer pointer-events-none absolute inset-0 h-full w-full" />
            )}

            {/* pin destinazione + avatar */}
            {target && <span className="map-pin" style={{ left: `${(target.x / MAP_W) * 100}%`, top: `${(target.y / MAP_H) * 100}%` }} />}
            <img src={asset("sprites/avatarpg.webp")} alt="Il tuo personaggio" draggable={false}
              className={`map-avatar pointer-events-none absolute w-[2.6%] ${moving ? "map-avatar-walk" : ""}`}
              style={{ left: `${(avatar.x / MAP_W) * 100}%`, top: `${(avatar.y / MAP_H) * 100}%`, transform: "translate(-50%,-50%)", transitionDuration: moving ? "110ms" : "700ms" }} />

            <div className="vignette pointer-events-none absolute inset-0" />

            {/* LAYER 3 — ispettore regioni (verifica sagome) */}
            {inspect && <RegionInspector current={regionId} onClose={() => setInspect(false)} />}

            {/* legenda zone */}
            {showZones && !overlayOpen && (
              <div className="panel absolute bottom-3 left-3 z-10 flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2">
                {(Object.keys(TERRAIN) as unknown as number[]).map((z) => (
                  <span key={z} className="flex items-center gap-1.5">
                    <i className="inline-block h-2.5 w-2.5" style={{ background: TERRAIN_COLORS[z as unknown as number] }} />
                    <span className="text-[10px] italic text-[var(--color-muted)]">{TERRAIN[z as unknown as number]}</span>
                  </span>
                ))}
              </div>
            )}

            {/* etichetta regione sotto il cursore */}
            {hoverRegion && !overlayOpen && !inspect && !showZones && (
              <div className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full"
                style={{ left: `${(hoverRegion.centroid[0] / MAP_W) * 100}%`, top: `${(hoverRegion.centroid[1] / MAP_H) * 100}%` }}>
                <span className="panel px-2.5 py-1 font-display text-sm text-[var(--color-gold-soft)]">{hoverRegion.name}</span>
              </div>
            )}

            {/* etichetta bioma sotto il cursore quando zone è attivo */}
            {showZones && cursor && !overlayOpen && !inspect && (
              <div className="pointer-events-none absolute z-20 -translate-x-1/2 translate-y-3"
                style={{ left: `${(cursor.x / MAP_W) * 100}%`, top: `${(cursor.y / MAP_H) * 100}%` }}>
                <span className="panel px-2.5 py-1 font-display text-xs text-[var(--color-gold-soft)] shadow-xl bg-black/90 border border-[var(--color-gold)]/60">
                  {terrainAt(cursor.x, cursor.y)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ---------- scene sovrapposte (72%) ---------- */}
        {overlayOpen && (
          <>
            <div className="absolute inset-0 z-20 bg-black/60" onClick={() => { if (view === "region") { setSpawns([]); setView("map"); } }} />
            <div className="absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2 overflow-hidden border border-[var(--color-border)] shadow-[0_30px_80px_rgba(0,0,0,.85)]"
              style={{ width: "72%", height: "78%" }} onClick={(e) => e.stopPropagation()}>
              {view === "region" && region && (
                <RegionScene region={region} spawns={spawns} explored={explored}
                  onExplore={explore} onGather={gather} onCamp={camp}
                  onLeave={() => { setSpawns([]); setView("map"); }} />
              )}
              {view === "combat" && enemy && region && (
                <CombatScene enemy={enemy} pg={pg} region={region} onLog={addLog} onEnd={endCombat} />
              )}
            </div>
          </>
        )}

        {/* ---------- pannello ancorato (uno alla volta) ---------- */}
        {panel && (
          <section className="panel absolute right-3 top-3 bottom-3 z-40 flex w-[420px] max-w-[92vw] flex-col shadow-[0_20px_60px_rgba(0,0,0,.8)]">
            <header className="flex shrink-0 items-center justify-between border-b border-[var(--color-border)] px-4 py-2.5">
              <h2 className="font-display text-lg text-[var(--color-gold)]">{PANEL_LABEL[panel]}</h2>
              <button onClick={() => setPanel(null)} className="btn btn-sm" title="Chiudi (Esc)">✕</button>
            </header>
            <div className="log-scroll min-h-0 flex-1 overflow-y-auto p-4">
              {panel === "pg" && <CharacterPanel pg={pg} professions={professions} />}
              {panel === "borsa" && <BagPanel inventory={inventory} onEat={eat} />}
              {panel === "diario" && <DiaryPanel log={log} />}
              {panel === "atlante" && <AtlasPanel current={regionId} onGo={goToRegion} />}
              {panel === "bestiario" && <BestiaryPanel />}
            </div>
          </section>
        )}
      </div>

      {/* ---------- riquadro info in basso ---------- */}
      <footer className="flex shrink-0 items-center border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 overflow-x-auto text-xs">
        <Field k="X" v={Math.round(info.x)} mono width="w-[72px]" />
        <span className="mx-1 h-3.5 w-px bg-[var(--color-border)] opacity-60 shrink-0" />
        <Field k="Y" v={Math.round(info.y)} mono width="w-[72px]" />
        <span className="mx-1 h-3.5 w-px bg-[var(--color-border)] opacity-60 shrink-0" />
        <Field k="Regione" v={(cursor ? hoverRegion?.name : region?.name) ?? "Mare aperto"} width="w-[285px]" truncate />
        <span className="mx-1 h-3.5 w-px bg-[var(--color-border)] opacity-60 shrink-0" />
        <Field k="Bioma" v={(cursor ? hoverRegion?.biome : region?.biome) ?? "—"} width="w-[130px]" />
        <span className="mx-1 h-3.5 w-px bg-[var(--color-border)] opacity-60 shrink-0" />
        <Field k="Tipo" v={terrainAt(info.x, info.y)} width="w-[175px]" />
        <span className="mx-1 h-3.5 w-px bg-[var(--color-border)] opacity-60 shrink-0" />
        <Field k="Turno" v={turno} mono width="w-[90px]" />
        <div className="ml-auto flex items-center gap-2 pl-4 shrink-0">
          <span className="stat-key">Vita</span>
          <div className="bar bar-hp w-28"><i style={{ width: `${(pg.pv / pg.pvmax) * 100}%` }} /></div>
          <span className="stat-val font-num">{pg.pv}/{pg.pvmax}</span>
          <span className="ml-3 stat-key">Liv.</span><span className="stat-val font-num">{pg.livello}</span>
        </div>
      </footer>
    </div>
  );
}

function Field({
  k,
  v,
  mono,
  width,
  truncate,
}: {
  k: string;
  v: string | number;
  mono?: boolean;
  width?: string;
  truncate?: boolean;
}) {
  return (
    <div className={`flex items-baseline gap-1.5 shrink-0 ${width ?? ""}`}>
      <span className="stat-key shrink-0">{k}:</span>
      <span
        className={`tabular-nums ${mono ? "stat-val font-num" : "text-sm text-[var(--color-ink)]"} ${
          truncate ? "truncate" : ""
        }`}
        title={typeof v === "string" ? v : undefined}
      >
        {v}
      </span>
    </div>
  );
}
