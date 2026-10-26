import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  DATA, REGIONS, GATHERABLES, ITEMS, EDIBLE, initPG, initProfessioni, rollSpawns, spawnEnemy,
  gatherLoot, professionLevelFor, xpForLevel, hasBoat, type PG, type Professione, type Spawn, type Enemy,
} from "@/game/engine";
import { MAP_W, MAP_H, findPath, isWalkable, regionAt, terrainAt } from "@/game/terrain";
import { asset } from "@/game/assets";
import RegionScene, { type GatherResult } from "./RegionScene";
import CombatScene from "./CombatScene";
import TopNav from "./TopNav";
import BottomBar from "./BottomBar";
import WorldMap from "./WorldMap";
import {
  CharacterPanel, BagPanel, DiaryPanel, AtlasPanel, BestiaryPanel,
  PANEL_LABEL, PANEL_KEY, type PanelId, type LogEntry,
} from "./Panels";
import { playGatherSound } from "@/game/audio";

export const GAME_TITLE = "Cronache di Borealia";
export const GAME_VERSION = "alfa 0.22";
export const GAME_SUBTITLE = "Terre Inesplorate";

type View = "menu" | "map" | "region" | "combat" | "dead";
const SAVE = "rpg-alfa-022";
let logId = 1;

interface Save {
  pg: PG; professions: Record<string, Professione>; inventory: Record<string, number>;
  avatar: { x: number; y: number }; regionId: number | null; turno: number;
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [missingProfPopup, setMissingProfPopup] = useState<string | null>(null);

  const isPaused = inspect || showZones;

  const areaRef = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState({ w: 0, h: 0 });
  const walkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [stepDuration, setStepDuration] = useState(900);

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
  useEffect(() => () => { if (walkTimer.current) clearTimeout(walkTimer.current); }, []);

  const toggleInspect = () => {
    setInspect((prev) => {
      const next = !prev;
      if (next) {
        setShowZones(false);
        if (walkTimer.current) { clearTimeout(walkTimer.current); setMoving(false); setTarget(null); }
      }
      return next;
    });
  };

  const toggleZones = () => {
    setShowZones((prev) => {
      const next = !prev;
      if (next) {
        setInspect(false);
        if (walkTimer.current) { clearTimeout(walkTimer.current); setMoving(false); setTarget(null); }
      }
      return next;
    });
  };

  /* ---- scorciatoie da tastiera ---- */
  useEffect(() => {
    if (view === "menu" || view === "dead") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setInspect(false); setShowZones(false); setPanel(null); return; }
      const k = e.key.toUpperCase();
      if (k === "R") { toggleInspect(); return; }
      if (k === "Z") { toggleZones(); return; }
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
        if (s.pg) {
          setPg(s.pg);
          const baseProfs = initProfessioni();
          setProfessions({ ...baseProfs, ...(s.professions || {}) });
          setInventory(s.inventory);
          setAvatar(s.avatar);
          setRegionId(s.regionId);
          setTurno(s.turno ?? 0);
        }
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

  /* ---- spostamento con pathfinding (gestione imbarcazione per mare aperto e re-routing in tempo reale) ---- */
  const travel = (dest: { x: number; y: number }) => {
    if (inspect || showZones) return;
    if (walkTimer.current) clearTimeout(walkTimer.current);

    const boat = hasBoat(inventory);
    const wasWalkable = isWalkable(dest.x, dest.y, boat);
    const path = findPath(avatar, dest, boat);
    if (!path || path.length === 0) {
      addLog("Nessun cammino raggiungibile in quella direzione.", "warn");
      setMoving(false);
      setTarget(null);
      return;
    }
    const finalDest = path[path.length - 1];
    setTarget(finalDest);
    setMoving(true);
    let hasLoggedWade = false;

    const executeStep = (idx: number) => {
      if (idx >= path.length) {
        setMoving(false);
        setTarget(null);
        setStepDuration(900);
        setTurno((t) => t + 1);
        const rid = regionAt(finalDest.x, finalDest.y);
        setRegionId(rid);
        if (rid !== null) {
          setSpawns([]);
          setExplored(false);
          addLog(`Giungi a ${REGIONS[rid].name} (${REGIONS[rid].biome}). Clicca sul tuo personaggio per esplorare la zona.`, "good");
        } else {
          if (!wasWalkable && !boat) {
            addLog("Raggiungi il limite della costa in acqua bassa. Non puoi avventurarti in mare aperto senza una imbarcazione (zattera, barca, piroga, ecc.).", "warn");
          } else if (!wasWalkable) {
            addLog("Navighi in mare aperto con la tua imbarcazione.", "info");
          } else {
            addLog(`Ti sposti verso ${terrainAt(finalDest.x, finalDest.y).toLowerCase()}.`, "info");
          }
        }
        return;
      }

      const step = path[idx];
      setAvatar(step);

      // Ritmo del passo a piedi: cammino normale ~900ms, acqua bassa (Mare) o guado (Fiume) senza barca ~1800ms
      const currentTerrain = terrainAt(step.x, step.y);
      const isWater = currentTerrain === "Fiume o Lago" || currentTerrain === "Mare";
      const isWading = isWater && !boat;

      if (isWading && !hasLoggedWade) {
        hasLoggedWade = true;
        if (currentTerrain === "Mare") {
          addLog("Cammini nell'acqua bassa lungo la costa tra secche e pozze di marea.", "info");
        } else {
          addLog("Guadi a piedi il corso d'acqua: l'andatura si fa lenta e faticosa.", "info");
        }
      }

      const duration = isWading ? 1800 : 900;
      setStepDuration(duration);

      walkTimer.current = setTimeout(() => {
        executeStep(idx + 1);
      }, duration);
    };

    executeStep(0);
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

  const gather = (key: number): GatherResult | null => {
    const sp = spawns.find((s) => s.key === key);
    const g = sp && GATHERABLES.find((x) => x.id === sp.gid);
    if (!sp || !g) return null;

    const profName = g.professione;
    const prof = professions[profName];

    if (!prof) {
      setMissingProfPopup(profName || "Sconosciuta");
      addLog(`Attenzione: professione mancante per ${g.id} (${profName || "non configurata"}).`, "warn");
      return null;
    }

    const loot = gatherLoot(g, prof);
    setInventory((inv) => {
      const n = { ...inv };
      for (const [name, q] of loot) n[name] = (n[name] ?? 0) + q;
      return n;
    });

    const lootText = loot.map(([name, q]) => `+${q} ${name}`).join(", ");
    const xpText = `+1 XP ${profName}`;

    addLog(`${g.azione} ${g.id}: ${loot.map(([n, q]) => `${n} +${q}`).join(", ")}.`, "loot");
    const nx = prof.xp + 1, nl = professionLevelFor(nx);
    if (nl > prof.livello) addLog(`${profName} sale al livello ${nl}!`, "good");
    setProfessions((p) => ({ ...p, [profName]: { xp: nx, livello: nl } }));
    setSpawns((s) => s.filter((x) => x.key !== key));

    // Effetto sonoro procedurale dedicato
    playGatherSound(profName);

    return {
      x: sp.x,
      y: sp.y,
      lootText,
      xpText,
      professione: profName,
    };
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
        <div className="absolute inset-0 bg-[var(--color-bg)]/85 backdrop-blur-[2px]" />
        <div className="relative flex flex-col items-center gap-3 px-6 max-w-xl text-center">
          <h1 className="font-display text-center text-5xl md:text-6xl tracking-wide text-[var(--color-gold)] drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]">
            {GAME_TITLE}
          </h1>
          <p className="mb-6 font-display text-sm tracking-widest uppercase text-[var(--color-gold-soft)]/90">
            {GAME_VERSION} — {GAME_SUBTITLE}
          </p>
          <div className="flex flex-col gap-2.5 w-full max-w-xs items-center">
            {hasSave && <button onClick={() => start(false)} className="btn btn-menu btn-gold w-full py-2.5 text-base shadow-lg">Continua</button>}
            <button onClick={() => start(true)} className="btn btn-menu w-full py-2.5 text-base shadow-lg">Nuova partita</button>
          </div>
          <p className="mt-8 text-center text-base md:text-lg italic text-[var(--color-muted)] leading-relaxed border-t border-[var(--color-border)]/50 pt-5 max-w-lg">
            «Nessuna mappa conosce ancora la tua storia. Addentrati nelle terre selvagge e scrivi le tue Cronache.»
          </p>
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
  const distRef = moving && target ? target : cursor;
  const distKm = distRef
    ? Math.round((Math.hypot(distRef.x - avatar.x, distRef.y - avatar.y) / 32) * 10)
    : null;

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* ---------- barra comandi ---------- */}
      <TopNav
        title={GAME_TITLE}
        version={GAME_VERSION}
        subtitle={GAME_SUBTITLE}
        panel={panel}
        onTogglePanel={(p) => setPanel((c) => (c === p ? null : p))}
        inspect={inspect}
        onToggleInspect={toggleInspect}
        showZones={showZones}
        onToggleZones={toggleZones}
        isPaused={isPaused}
        turno={turno}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        onGoMenu={() => setView("menu")}
      />

      {/* ---------- area di gioco: la mappa è la pagina ---------- */}
      <div ref={areaRef} className="relative min-h-0 flex-1 bg-black">
        <WorldMap
          stage={stage}
          avatar={avatar}
          target={target}
          moving={moving}
          stepDuration={stepDuration}
          regionId={regionId}
          currentRegionName={region?.name}
          inspect={inspect}
          onCloseInspect={() => setInspect(false)}
          showZones={showZones}
          overlayOpen={overlayOpen}
          isPaused={isPaused}
          cursor={cursor}
          distKm={distKm}
          onMapClick={(e) => {
            if (overlayOpen || isPaused) return;
            travel(toMap(e));
          }}
          onMouseMove={(e) => {
            if (overlayOpen || inspect) return;
            const p = toMap(e);
            setCursor(p);
            setHoverId(regionAt(p.x, p.y));
          }}
          onMouseLeave={() => {
            if (inspect) return;
            setCursor(null);
            setHoverId(null);
          }}
          onAvatarClick={() => {
            if (regionId !== null) {
              setView("region");
            } else {
              addLog("Ti trovi in mare aperto o fuori dai confini di una regione.", "info");
            }
          }}
        />

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
      <BottomBar
        x={info.x}
        y={info.y}
        regionName={(cursor ? hoverRegion?.name : region?.name) ?? "Mare aperto"}
        biomeName={(cursor ? hoverRegion?.biome : region?.biome) ?? "—"}
        terrainType={terrainAt(info.x, info.y)}
        turno={turno}
        pv={pg.pv}
        pvmax={pg.pvmax}
        livello={pg.livello}
      />

      {/* Pop-up Professione Mancante */}
      {missingProfPopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={() => setMissingProfPopup(null)}
        >
          <div
            className="panel p-6 max-w-sm w-full text-center flex flex-col items-center gap-3.5 border border-amber-600/80 shadow-[0_20px_60px_rgba(0,0,0,0.9)] bg-[#120f0d]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/60 flex items-center justify-center text-amber-400 text-2xl font-bold">
              !
            </div>
            <h3 className="font-display text-xl text-[var(--color-gold)]">
              Professione mancante
            </h3>
            <p className="text-xs text-[var(--color-muted)] leading-relaxed">
              La professione richiesta (<b className="text-[var(--color-ink)]">{missingProfPopup}</b>) non è configurata nelle maestrie del personaggio.
            </p>
            <button
              onClick={() => setMissingProfPopup(null)}
              className="btn btn-gold btn-sm px-6 py-1.5 mt-1 shadow-lg"
            >
              Chiudi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
