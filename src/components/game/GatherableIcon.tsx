import React from "react";
import type { IconType } from "react-icons";
import {
  // Erboristeria
  GiAgave,
  GiAlgae,
  GiCactus,
  GiMushroom,
  GiMushroomsCluster,
  GiSpottedMushroom,
  GiGrass,
  GiFlowerStar,
  GiTreeRoots,
  GiVines,
  GiFlowers,
  GiDandelionFlower,

  // Taglialegna
  GiTreeGrowth,
  GiBeech,
  GiPineTree,
  GiTreeBranch,
  GiWillowTree,

  // Caccia & Fauna
  GiGoat,
  GiDeer,
  GiPigFace,
  GiRabbit,
  GiWolfHead,
  GiBearFace,
  GiSparrow,
  GiFrog,
  GiSalamander,
  GiNestEggs,
  GiButterfly,
  GiDragonfly,
  GiCrossedBones,
  GiFeather,
  GiSpiderWeb,

  // Pesca
  GiDoubleFish,
  GiSpiralShell,
  GiTwinShell,
  GiShrimp,
  GiCrab,
  GiOctopus,
  GiTropicalFish,
  GiFlatfish,
  GiSeaStar,
  GiFishEscape,
  GiFishCorpse,

  // Estrazione
  GiAmethyst,
  GiAnvil,
  GiFossil,
  GiDiamondHard,
  GiGoldBar,
  GiCrystalCluster,
  GiMetalBar,
  GiOre,
} from "react-icons/gi";

/** Mappa ufficiale dei 51 raccoglibili alle icone vettoriali Game-Icons.net */
export const GATHERABLE_ICONS: Record<string, IconType> = {
  // Erboristeria
  agave: GiAgave,
  alghe: GiAlgae,
  cactus: GiCactus,
  fungocommestibile: GiMushroom,
  fungomagico: GiMushroomsCluster,
  fungovelenoso: GiSpottedMushroom,
  muschio: GiGrass,
  primula: GiFlowerStar,
  radici: GiTreeRoots,
  rampicanti: GiVines,
  stellaalpina: GiFlowers,
  tarassaco: GiDandelionFlower,

  // Taglialegna
  ceppodilegno: GiTreeGrowth,
  faggio: GiBeech,
  pino: GiPineTree,
  rametti: GiTreeBranch,
  salice: GiWillowTree,

  // Caccia & Fauna
  capra: GiGoat,
  cervo: GiDeer,
  cinghiale: GiPigFace,
  lepre: GiRabbit,
  lupo: GiWolfHead,
  orso: GiBearFace,
  passero: GiSparrow,
  rana: GiFrog,
  salamandra: GiSalamander,
  uovadipassero: GiNestEggs,
  farfalla: GiButterfly,
  libellula: GiDragonfly,
  ossa: GiCrossedBones,
  piuma: GiFeather,
  uovadiragno: GiSpiderWeb,

  // Pesca (fiume, lago e mare)
  carpa: GiDoubleFish,
  conchiglia: GiSpiralShell,
  cozza: GiTwinShell,
  gamberetto: GiShrimp,
  granchio: GiCrab,
  polipo: GiOctopus,
  salmone: GiTropicalFish,
  sogliola: GiFlatfish,
  stellamarina: GiSeaStar,
  tonno: GiFishEscape,
  trota: GiFishCorpse,

  // Estrazione & Minerali
  ametista: GiAmethyst,
  ferro: GiAnvil,
  fossile: GiFossil,
  gemma: GiDiamondHard,
  oro: GiGoldBar,
  quarzo: GiCrystalCluster,
  rame: GiMetalBar,
  stagno: GiOre,
};

export interface GatherableBadgeProps {
  id: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

/** Componente icona vettoriale singola (senza contenitore) */
export function GatherableIcon({
  id,
  className = "w-6 h-6 text-white",
}: {
  id: string;
  className?: string;
}) {
  const IconComponent = GATHERABLE_ICONS[id.toLowerCase().trim()] || GiMushroom;
  return <IconComponent className={className} />;
}

/** Badge completo con sfondo nero circolare e icona bianca a sfondo trasparente */
export function GatherableBadge({
  id,
  size = "md",
  className = "",
}: GatherableBadgeProps) {
  const IconComponent = GATHERABLE_ICONS[id.toLowerCase().trim()] || GiMushroom;

  const sizeClasses = {
    sm: "w-7 h-7 p-1 text-sm",
    md: "w-10 h-10 p-1.5 text-xl",
    lg: "w-12 h-12 sm:w-14 sm:h-14 p-2.5 text-2xl sm:text-3xl",
    xl: "w-16 h-16 p-3 text-4xl",
  };

  return (
    <div
      className={`rounded-full bg-black border border-neutral-700/80 shadow-md flex items-center justify-center shrink-0 transition-transform ${sizeClasses[size]} ${className}`}
      title={id}
    >
      <IconComponent className="w-full h-full text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />
    </div>
  );
}
