import React from "react";
import { PANEL_LABEL, PANEL_KEY, NAV_PANELS, type PanelId } from "./Panels";
import { Maximize, Minimize } from "lucide-react";

interface TopNavProps {
  title: string;
  version: string;
  subtitle: string;
  panel: PanelId | null;
  onTogglePanel: (p: PanelId) => void;
  inspect: boolean;
  onToggleInspect: () => void;
  showZones: boolean;
  onToggleZones: () => void;
  isPaused: boolean;
  turno: number;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onGoMenu: () => void;
}

export default function TopNav({
  title,
  version,
  subtitle,
  panel,
  onTogglePanel,
  inspect,
  onToggleInspect,
  showZones,
  onToggleZones,
  isPaused,
  turno,
  isFullscreen,
  onToggleFullscreen,
  onGoMenu,
}: TopNavProps) {
  return (
    <header className="flex shrink-0 items-center gap-5 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 select-none">
      <h1 className="font-display text-lg tracking-wide text-[var(--color-gold)]">
        {title}{" "}
        <span className="ml-1 font-body text-xs italic text-[var(--color-muted)]">
          {version} — {subtitle}
        </span>
      </h1>
      <nav className="flex items-center gap-1.5">
        {NAV_PANELS.map((p) => (
          <button
            key={p}
            onClick={() => onTogglePanel(p)}
            className={`btn btn-sm ${panel === p ? "btn-gold" : ""}`}
            title={`Tasto ${PANEL_KEY[p] ?? ""}`}
          >
            {PANEL_LABEL[p]}
          </button>
        ))}
        <span className="mx-1 h-5 w-px bg-[var(--color-border)]" />
        <button
          onClick={onToggleInspect}
          className={`btn btn-sm ${inspect ? "btn-gold" : ""}`}
          title="Verifica regioni (tasto R)"
        >
          Regioni
        </button>
        <button
          onClick={onToggleZones}
          className={`btn btn-sm ${showZones ? "btn-gold" : ""}`}
          title="Layer zone di terreno (tasto Z)"
        >
          Zone
        </button>
      </nav>
      <div className="ml-auto flex items-center gap-3">
        {isPaused && <span className="pause-badge text-[10px]">IN PAUSA</span>}
        <span className="text-xs text-[var(--color-muted)]">
          Turno <b className="font-num text-[var(--color-gold-soft)]">{turno}</b>
        </span>
        <button
          onClick={onToggleFullscreen}
          className={`btn btn-sm ${isFullscreen ? "btn-gold" : ""}`}
          title={isFullscreen ? "Esci da Schermo Intero" : "Schermo Intero"}
        >
          {isFullscreen ? <Minimize className="h-3.5 w-3.5" /> : <Maximize className="h-3.5 w-3.5" />}
          <span>Full screen</span>
        </button>
        <button onClick={onGoMenu} className="btn btn-sm">
          Menu
        </button>
      </div>
    </header>
  );
}
