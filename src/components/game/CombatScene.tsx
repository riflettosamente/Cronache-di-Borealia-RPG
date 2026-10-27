import { useState, useRef } from "react";
import {
  attack,
  tryFuga,
  FUGA_TEXTS,
  type Enemy,
  type PG,
  type RegionData,
} from "@/game/engine";
import { asset } from "@/game/assets";
import { Swords, Footprints, Shield, Heart } from "lucide-react";
import { MonsterCard } from "./MonsterCard";

interface CombatSceneProps {
  enemy: Enemy;
  pg: PG;
  region: RegionData;
  onLog: (text: string, kind?: "info" | "good" | "warn" | "loot") => void;
  onEnd: (r: { outcome: "win" | "lose" | "flee"; pv: number }) => void;
}

type CombatState = "player-turn" | "animating" | "enemy-turn" | "finished";

export default function CombatScene({
  enemy,
  pg,
  region,
  onLog,
  onEnd,
}: CombatSceneProps) {
  const [playerPv, setPlayerPv] = useState(pg.pv);
  const [enemyPv, setEnemyPv] = useState(enemy.pv);
  const [state, setState] = useState<CombatState>("player-turn");
  const [shakeCard, setShakeCard] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [diceRoll, setDiceRoll] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);

  const lockRef = useRef(false);

  /* ---- Esecuzione Attacco del Giocatore ---- */
  const handleAttack = () => {
    if (state !== "player-turn" || lockRef.current) return;
    lockRef.current = true;
    setState("animating");
    setIsRolling(true);

    setTimeout(() => {
      // Tiro per colpire
      const pRes = attack(
        { att: pg.att, dado: "1D4", imp: pg.imp },
        { par: enemy.par }
      );
      setDiceRoll(pRes.roll);
      setIsRolling(false);

      if (pRes.hit) {
        // Danno calcolato sottraendo la protezione nemica
        const finalDmg = Math.max(1, pRes.dmg - enemy.pro);
        const newEnemyPv = Math.max(0, enemyPv - finalDmg);
        setEnemyPv(newEnemyPv);
        setShakeCard(true);
        setTimeout(() => setShakeCard(false), 400);

        const hitMsg = pRes.crit
          ? `COLPO CRITICO! (Dado ${pRes.roll}) Infliggi ${finalDmg} danni a ${enemy.name}!`
          : `Colpisci ${enemy.name} (Dado ${pRes.roll} + ${pg.att} vs ${pRes.target}) per ${finalDmg} danni.`;
        setLastAction(hitMsg);
        onLog(hitMsg, "good");

        // Verifica Vittoria
        if (newEnemyPv <= 0) {
          setState("finished");
          setTimeout(() => {
            onEnd({ outcome: "win", pv: playerPv });
          }, 900);
          return;
        }
      } else {
        const missMsg = `Mancato! Il tuo attacco (Dado ${pRes.roll} + ${pg.att}) viene parato da ${enemy.name}.`;
        setLastAction(missMsg);
        onLog(missMsg, "info");
      }

      // Turno di Controffensiva del Nemico dopo breve pausa
      setTimeout(() => {
        setState("enemy-turn");
        const eRes = attack(
          { att: enemy.att, dado: enemy.imp || "1D6", imp: 0 },
          { par: pg.par }
        );

        if (eRes.hit) {
          const finalEnemyDmg = Math.max(1, eRes.dmg - pg.pro);
          const newPlayerPv = Math.max(0, playerPv - finalEnemyDmg);
          setPlayerPv(newPlayerPv);

          const eHitMsg = `${enemy.name} contrattacca feroce! Subisci ${finalEnemyDmg} danni.`;
          setLastAction(eHitMsg);
          onLog(eHitMsg, "warn");

          // Verifica Sconfitta
          if (newPlayerPv <= 0) {
            setState("finished");
            setTimeout(() => {
              onEnd({ outcome: "lose", pv: 0 });
            }, 1000);
            return;
          }
        } else {
          const eMissMsg = `Schivi con destrezza l'attacco di ${enemy.name}!`;
          setLastAction(eMissMsg);
          onLog(eMissMsg, "good");
        }

        lockRef.current = false;
        setState("player-turn");
      }, 800);
    }, 450);
  };

  /* ---- Esecuzione Fuga ---- */
  const handleFlee = () => {
    if (state !== "player-turn" || lockRef.current) return;
    lockRef.current = true;
    setState("animating");

    const success = tryFuga(pg.imp);
    if (success) {
      const fleeText =
        FUGA_TEXTS[Math.floor(Math.random() * FUGA_TEXTS.length)] ||
        "Riesci a fuggire con successo!";
      setLastAction(fleeText);
      onLog(fleeText, "good");
      setState("finished");
      setTimeout(() => {
        onEnd({ outcome: "flee", pv: playerPv });
      }, 700);
    } else {
      // Attacco di opportunità subito durante la fuga fallita
      const oppBase = parseInt(enemy.imp.replace(/\D/g, ""), 10) || 4;
      const oppDmg = Math.max(1, oppBase - pg.pro);
      const newPlayerPv = Math.max(0, playerPv - oppDmg);
      setPlayerPv(newPlayerPv);

      const failMsg = `La fuga fallisce! ${enemy.name} sferra un attacco di opportunità: -${oppDmg} PV.`;
      setLastAction(failMsg);
      onLog(failMsg, "warn");

      if (newPlayerPv <= 0) {
        setState("finished");
        setTimeout(() => {
          onEnd({ outcome: "lose", pv: 0 });
        }, 900);
        return;
      }

      lockRef.current = false;
      setState("player-turn");
    }
  };

  return (
    <div className="scene relative w-full h-full flex flex-col justify-between overflow-hidden bg-black select-none">
      {/* Sfondo regionale sfocato dietro l'arena */}
      <img
        src={asset(region.bg)}
        alt=""
        className="absolute inset-0 w-full h-full object-cover filter blur-sm opacity-40 pointer-events-none"
        onError={(e) => {
          (e.currentTarget as HTMLElement).style.display = "none";
        }}
      />
      <div className="vignette absolute inset-0 pointer-events-none" />

      {/* Intestazione Combattimento */}
      <header className="relative z-10 flex items-center justify-between p-3.5 bg-gradient-to-b from-black/80 to-transparent border-b border-[var(--color-border)]/40">
        <div>
          <h2 className="font-display text-lg text-[var(--color-gold)] flex items-center gap-2">
            <Swords className="w-4 h-4 text-red-500" />
            <span>Scontro a {region.name}</span>
          </h2>
          <span className="text-[11px] text-[var(--color-muted)]">
            Minaccia: <b className="capitalize text-[var(--color-ink)]">{enemy.tier}</b>
          </span>
        </div>

        {/* Indicatore Stato Turno */}
        <div className="flex items-center gap-2">
          {state === "player-turn" && (
            <span className="text-xs font-display text-[var(--color-gold-soft)] animate-pulse">
              Tuo Turno
            </span>
          )}
          {state === "enemy-turn" && (
            <span className="text-xs font-display text-red-400 animate-pulse">
              Turno Nemico…
            </span>
          )}
          {state === "animating" && (
            <span className="text-xs font-display text-[var(--color-muted)]">
              Risoluzione…
            </span>
          )}
        </div>
      </header>

      {/* Area Centrale: La Carta Mostro e i Punti Immagine */}
      <div className="relative flex-1 min-h-0 flex items-center justify-center p-2">
        <MonsterCard
          name={enemy.name}
          tier={enemy.tier}
          pv={enemyPv}
          pvmax={enemy.pvmax}
          att={enemy.att}
          par={enemy.par}
          imp={enemy.imp}
          pro={enemy.pro}
          xp={enemy.xpReward}
          frame={enemy.frame}
          shake={shakeCard}
        />

        {/* Dado D20 / Animazione Tiro */}
        {diceRoll !== null && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 panel-inset p-3 rounded-lg border border-[var(--color-gold)]/60 bg-black/90 flex flex-col items-center gap-1 shadow-2xl animate-fadein">
            <span className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
              Tiro d20
            </span>
            <div
              className={`w-12 h-12 flex items-center justify-center font-num text-2xl font-bold text-[var(--color-gold)] ${
                isRolling ? "die-rolling" : ""
              }`}
            >
              {diceRoll}
            </div>
            {diceRoll === 20 && (
              <span className="text-[9px] uppercase font-bold text-yellow-400">Critico!</span>
            )}
            {diceRoll === 1 && (
              <span className="text-[9px] uppercase font-bold text-red-400">Fallimento</span>
            )}
          </div>
        )}
      </div>

      {/* Barra Inferiore: Stato Vita PG, Feedback Ultimo Colpo e Comandi */}
      <footer className="relative z-10 flex flex-col gap-2 p-3 bg-gradient-to-t from-black/95 via-black/80 to-transparent border-t border-[var(--color-border)]">
        {/* Registro ultimo scambio di colpi */}
        {lastAction && (
          <div className="text-center text-xs font-display text-[var(--color-gold-soft)] truncate px-2">
            {lastAction}
          </div>
        )}

        <div className="flex items-center justify-between gap-4">
          {/* Barra Vita del Giocatore */}
          <div className="flex items-center gap-2.5 min-w-0">
            <Shield className="w-4 h-4 text-[var(--color-gold)] shrink-0" />
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center justify-between text-xs gap-3">
                <span className="stat-key text-[11px]">Tua Vita</span>
                <span className="font-num text-xs text-[var(--color-gold-soft)]">
                  {playerPv} / {pg.pvmax}
                </span>
              </div>
              <div className="bar bar-hp w-32 sm:w-44">
                <i style={{ width: `${(playerPv / pg.pvmax) * 100}%` }} />
              </div>
            </div>
          </div>

          {/* Pulsanti Azione: Attacca & Fuga */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleAttack}
              disabled={state !== "player-turn"}
              className="btn btn-sm btn-gold flex items-center gap-1.5 shadow-md"
              title="Sferra un attacco con la tua arma (Dado d20 + ATT vs PAR nemica)"
            >
              <Swords className="w-3.5 h-3.5 text-red-400" />
              <span>Attacca</span>
            </button>

            <button
              onClick={handleFlee}
              disabled={state !== "player-turn"}
              className="btn btn-sm flex items-center gap-1.5"
              title="Tenta la fuga sfruttando il tuo impatto (rischio di attacco di opportunità)"
            >
              <Footprints className="w-3.5 h-3.5 text-blue-300" />
              <span>Fuggi</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
