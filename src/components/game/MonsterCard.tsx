import React from "react";
import { Heart, Sparkles } from "lucide-react";
import type { IconType } from "react-icons";
import {
  GiEagleHead,
  GiHarpy,
  GiBandit,
  GiHornedReptile,
  GiBoar,
  GiDwarfFace,
  GiDevilMask,
  GiDrakkarDragon,
  GiDragonHead,
  GiSpikedDragonHead,
  GiFairy,
  GiGhost,
  GiAnt,
  GiSparkSpirit,
  GiDjinn,
  GiGoblinCamp,
  GiGriffinSymbol,
  GiLion,
  GiWolfHead,
  GiWerewolf,
  GiMummyHead,
  GiOgre,
  GiBearFace,
  GiBat,
  GiSwampBat,
  GiSpiderAlt,
  GiCondorEmblem,
  GiLeechingWorm,
  GiSkeleton,
  GiScorpion,
  GiRat,
  GiTroll,
  GiWyvern,
  GiFly,
  GiShamblingZombie,
  GiRogue,
  GiBeastEye,
} from "react-icons/gi";

export interface MonsterCardProps {
  name: string;
  tier?: string | null;
  pv: number;
  pvmax?: number;
  att: number;
  par: number;
  imp?: string | null;
  pro: number;
  xp: number;
  frame?: number;
  className?: string;
  shake?: boolean;
}

const TIER_THEMES: Record<
  string,
  {
    label: string;
    border: string;
    badgeBg: string;
    badgeText: string;
    cardBg: string;
    glow: string;
    accent: string;
  }
> = {
  mitico: {
    label: "Mitico",
    border: "border-amber-500",
    badgeBg: "bg-amber-950/90 border-amber-500/80",
    badgeText: "text-amber-300",
    cardBg: "from-amber-950/30 via-[#120d06] to-[#0a0704]",
    glow: "shadow-[0_0_30px_rgba(245,158,11,0.25)]",
    accent: "text-amber-400",
  },
  raro: {
    label: "Raro",
    border: "border-sky-500",
    badgeBg: "bg-sky-950/90 border-sky-500/80",
    badgeText: "text-sky-300",
    cardBg: "from-sky-950/30 via-[#070f16] to-[#04080d]",
    glow: "shadow-[0_0_30px_rgba(14,165,233,0.25)]",
    accent: "text-sky-400",
  },
  noncomune: {
    label: "Non comune",
    border: "border-emerald-500",
    badgeBg: "bg-emerald-950/90 border-emerald-500/80",
    badgeText: "text-emerald-300",
    cardBg: "from-emerald-950/30 via-[#09140c] to-[#050a06]",
    glow: "shadow-[0_0_25px_rgba(16,185,129,0.2)]",
    accent: "text-emerald-400",
  },
  comune: {
    label: "Comune",
    border: "border-neutral-600",
    badgeBg: "bg-neutral-900 border-neutral-600",
    badgeText: "text-neutral-300",
    cardBg: "from-neutral-900/40 via-[#101010] to-[#080808]",
    glow: "shadow-[0_0_20px_rgba(0,0,0,0.7)]",
    accent: "text-neutral-300",
  },
};

interface MonsterEmblemInfo {
  icon: IconType;
  color: string;
}

/** Mappa fedele per ciascuno dei 36 mostri originali del gioco */
const MONSTER_EMBLEMS: Record<string, MonsterEmblemInfo> = {
  aquila: { icon: GiEagleHead, color: "text-amber-300" },
  arpia: { icon: GiHarpy, color: "text-violet-300" },
  bandito: { icon: GiBandit, color: "text-stone-300" },
  basilisco: { icon: GiHornedReptile, color: "text-emerald-400" },
  cinghiale: { icon: GiBoar, color: "text-amber-600" },
  coboldo: { icon: GiDwarfFace, color: "text-orange-400" },
  demone: { icon: GiDevilMask, color: "text-rose-500" },
  "drago d'ossa": { icon: GiDrakkarDragon, color: "text-neutral-200" },
  "drago rosso": { icon: GiDragonHead, color: "text-red-500" },
  "drago verde": { icon: GiSpikedDragonHead, color: "text-emerald-400" },
  driade: { icon: GiFairy, color: "text-lime-300" },
  fantasma: { icon: GiGhost, color: "text-cyan-300" },
  "formica gigante": { icon: GiAnt, color: "text-amber-500" },
  "fuoco fatuo": { icon: GiSparkSpirit, color: "text-amber-400" },
  efreet: { icon: GiDjinn, color: "text-orange-500" },
  goblin: { icon: GiGoblinCamp, color: "text-emerald-500" },
  grifone: { icon: GiGriffinSymbol, color: "text-amber-300" },
  leone: { icon: GiLion, color: "text-amber-400" },
  lupo: { icon: GiWolfHead, color: "text-slate-300" },
  "lupo mannaro": { icon: GiWerewolf, color: "text-purple-400" },
  mummia: { icon: GiMummyHead, color: "text-yellow-600" },
  orco: { icon: GiOgre, color: "text-green-600" },
  orso: { icon: GiBearFace, color: "text-amber-700" },
  "pipistrello gigante": { icon: GiBat, color: "text-slate-400" },
  "pipistrello vampiro": { icon: GiSwampBat, color: "text-red-400" },
  "ragno gigante": { icon: GiSpiderAlt, color: "text-purple-400" },
  roc: { icon: GiCondorEmblem, color: "text-amber-400" },
  sanguisuga: { icon: GiLeechingWorm, color: "text-rose-400" },
  scheletro: { icon: GiSkeleton, color: "text-zinc-200" },
  scorpione: { icon: GiScorpion, color: "text-amber-500" },
  topo: { icon: GiRat, color: "text-stone-400" },
  troll: { icon: GiTroll, color: "text-teal-400" },
  viverna: { icon: GiWyvern, color: "text-sky-400" },
  "mosca gigante": { icon: GiFly, color: "text-lime-400" },
  zombie: { icon: GiShamblingZombie, color: "text-teal-300" },
  ladro: { icon: GiRogue, color: "text-neutral-300" },
};

/** Restituisce l'emblema SVG corrispondente alla creatura */
function getEmblem(name: string) {
  const key = name.toLowerCase().trim();
  const entry = MONSTER_EMBLEMS[key];
  if (entry) {
    const Icon = entry.icon;
    return (
      <Icon
        className={`w-16 h-16 sm:w-20 sm:h-20 ${entry.color} drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]`}
      />
    );
  }
  return (
    <GiBeastEye className="w-16 h-16 sm:w-20 sm:h-20 text-amber-400/90 drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]" />
  );
}

export function MonsterCard({
  name,
  tier,
  pv,
  pvmax,
  att,
  par,
  imp,
  pro,
  xp,
  frame,
  className = "",
  shake = false,
}: MonsterCardProps) {
  const maxHealth = pvmax ?? pv;
  const healthPercent = Math.max(0, Math.min(100, Math.round((pv / maxHealth) * 100)));
  const safeTier = (tier || "comune").toLowerCase();
  const safeImp = imp || "1D6";
  const theme = TIER_THEMES[safeTier] ?? TIER_THEMES.comune;

  return (
    <div
      className={`enemy-card relative w-[250px] sm:w-[280px] aspect-[400/569] rounded-xl overflow-hidden border-2 ${
        theme.border
      } ${theme.glow} bg-gradient-to-b ${theme.cardBg} flex flex-col justify-between p-3.5 select-none shadow-2xl transition-all ${
        shake ? "card-shake" : ""
      } ${className}`}
    >
      {/* Texture decorativa di sfondo araldico */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,var(--color-gold)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

      {/* Fascia Superiore: Indice e Grado di Pericolosità */}
      <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center gap-1.5">
          <Sparkles className={`w-3.5 h-3.5 ${theme.accent}`} />
          {frame !== undefined && (
            <span className="font-num text-[11px] text-[var(--color-muted)] font-medium">
              #{String(frame + 1).padStart(2, "0")}
            </span>
          )}
        </div>
        <span
          className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border shadow-sm ${theme.badgeBg} ${theme.badgeText}`}
        >
          {theme.label}
        </span>
      </div>

      {/* Sezione Centrale: Nome e Stemma Araldico dedicato */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto py-2 text-center">
        {/* Emblema con cerchio luminoso */}
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-black/70 border border-white/15 flex items-center justify-center shadow-inner mb-2.5">
          <div className="absolute inset-0 rounded-full bg-radial from-white/10 to-transparent pointer-events-none" />
          {getEmblem(name)}
        </div>

        {/* Nome del Mostro */}
        <h2 className="font-display text-lg sm:text-xl font-bold text-[var(--color-gold)] drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] tracking-wide">
          {name}
        </h2>
        <span className="text-[11px] text-[var(--color-muted)] italic mt-0.5">
          Creatura di Borealia
        </span>
      </div>

      {/* Sezione Inferiore: Punti Vita e Caratteristiche di Combattimento */}
      <div className="relative z-10 flex flex-col gap-2.5 bg-black/80 border border-white/10 rounded-lg p-2.5 backdrop-blur-sm">
        {/* Barra Punti Vita */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <div className="flex items-center gap-1 text-red-400 font-semibold">
              <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500" />
              <span className="text-[11px] uppercase tracking-wider font-display">Punti Vita</span>
            </div>
            <span className="font-num font-bold text-white text-xs">
              {pv} <span className="text-[var(--color-muted)] font-normal">/ {maxHealth}</span>
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-neutral-900 border border-neutral-700/60 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-600 to-rose-400 transition-all duration-300"
              style={{ width: `${healthPercent}%` }}
            />
          </div>
        </div>

        {/* Griglia Caratteristiche (Danno, Attacco, Parata, Difesa, XP) */}
        <div className="grid grid-cols-5 gap-1 text-center pt-1 border-t border-white/10">
          {/* Danno / Impatto */}
          <div className="chip flex flex-col items-center justify-center p-1 rounded bg-black/60 border border-[var(--color-border)]">
            <span className="text-[9px] text-[var(--color-muted)] font-medium">DANNO</span>
            <b className="font-num text-[11px] text-amber-300 font-bold leading-tight mt-0.5">
              {safeImp}
            </b>
          </div>

          {/* Attacco */}
          <div className="chip flex flex-col items-center justify-center p-1 rounded bg-black/60 border border-[var(--color-border)]">
            <span className="text-[9px] text-[var(--color-muted)] font-medium">ATT</span>
            <b className="font-num text-[11px] text-[var(--color-gold-soft)] font-bold leading-tight mt-0.5">
              +{att}
            </b>
          </div>

          {/* Parata */}
          <div className="chip flex flex-col items-center justify-center p-1 rounded bg-black/60 border border-[var(--color-border)]">
            <span className="text-[9px] text-[var(--color-muted)] font-medium">PAR</span>
            <b className="font-num text-[11px] text-sky-300 font-bold leading-tight mt-0.5">
              +{par}
            </b>
          </div>

          {/* Protezione */}
          <div className="chip flex flex-col items-center justify-center p-1 rounded bg-black/60 border border-[var(--color-border)]">
            <span className="text-[9px] text-[var(--color-muted)] font-medium">PRO</span>
            <b className="font-num text-[11px] text-emerald-300 font-bold leading-tight mt-0.5">
              {pro}
            </b>
          </div>

          {/* Esperienza */}
          <div className="chip flex flex-col items-center justify-center p-1 rounded bg-black/60 border border-[var(--color-border)]">
            <span className="text-[9px] text-[var(--color-muted)] font-medium">XP</span>
            <b className="font-num text-[10px] text-amber-200 font-bold leading-tight mt-0.5">
              +{xp}
            </b>
          </div>
        </div>
      </div>
    </div>
  );
}
