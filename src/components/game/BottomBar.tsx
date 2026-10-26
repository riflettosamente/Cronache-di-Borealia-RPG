import React from "react";

interface BottomBarProps {
  x: number;
  y: number;
  regionName: string;
  biomeName: string;
  terrainType: string;
  turno: number;
  pv: number;
  pvmax: number;
  livello: number;
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

export default function BottomBar({
  x,
  y,
  regionName,
  biomeName,
  terrainType,
  turno,
  pv,
  pvmax,
  livello,
}: BottomBarProps) {
  const hpPercent = Math.max(0, Math.min(100, (pv / pvmax) * 100));

  return (
    <footer className="flex shrink-0 items-center border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 overflow-x-auto text-xs select-none">
      <Field k="X" v={Math.round(x)} mono width="w-[72px]" />
      <span className="mx-1 h-3.5 w-px bg-[var(--color-border)] opacity-60 shrink-0" />
      <Field k="Y" v={Math.round(y)} mono width="w-[72px]" />
      <span className="mx-1 h-3.5 w-px bg-[var(--color-border)] opacity-60 shrink-0" />
      <Field k="Regione" v={regionName} width="w-[285px]" truncate />
      <span className="mx-1 h-3.5 w-px bg-[var(--color-border)] opacity-60 shrink-0" />
      <Field k="Bioma" v={biomeName} width="w-[130px]" />
      <span className="mx-1 h-3.5 w-px bg-[var(--color-border)] opacity-60 shrink-0" />
      <Field k="Tipo" v={terrainType} width="w-[175px]" />
      <span className="mx-1 h-3.5 w-px bg-[var(--color-border)] opacity-60 shrink-0" />
      <Field k="Turno" v={turno} mono width="w-[90px]" />
      <div className="ml-auto flex items-center gap-2 pl-4 shrink-0">
        <span className="stat-key">Vita</span>
        <div className="bar bar-hp w-28">
          <i style={{ width: `${hpPercent}%` }} />
        </div>
        <span className="stat-val font-num">
          {pv}/{pvmax}
        </span>
        <span className="ml-3 stat-key">Liv.</span>
        <span className="stat-val font-num">{livello}</span>
      </div>
    </footer>
  );
}
