import type { ExecutionState, WorkflowMode } from "~types/workflow"

interface SidePanelHeaderProps {
  status?: ExecutionState["status"]
  mode?: WorkflowMode
}

export function SidePanelHeader({ status, mode }: SidePanelHeaderProps) {
  const subtitle =
    mode === "dom_list_extract"
      ? "Extracción de datos sobre listas repetitivas del DOM"
      : "Automatización iterativa por lista de registros (CSV/JSON)"

  return (
    <header className="px-4 py-3 bg-void-black border-b border-rim flex items-center justify-between">
      <div>
        <h1 className="text-sm font-medium tracking-tight text-parchment flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-coral-shimmer shadow-[0_0_8px_rgba(232,118,80,0.6)]" />
          AutoLoop RPA
        </h1>
        <p className="text-[11px] text-ash">{subtitle}</p>
      </div>
      <span
        className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border transition ${status === "running"
            ? "bg-forest-moss text-fog border-forest-deep"
            : status === "picking"
              ? "bg-forest-moss text-coral-shimmer border-coral-shimmer/60 animate-pulse"
              : status === "paused"
                ? "bg-amber-950/40 text-amber-300 border-amber-600/40"
                : status === "completed"
                  ? "bg-forest-moss text-fog border-forest-deep"
                  : status === "error"
                    ? "bg-rose-950/40 text-rose-300 border-rose-600/40"
                    : "bg-ember text-ash border-rim"
          }`}>
        {status === "running" && "Ejecutando"}
        {status === "picking" && "Seleccionando DOM"}
        {status === "paused" && "En pausa"}
        {status === "completed" && "Completado"}
        {status === "error" && "Con error"}
        {(!status || status === "idle") && "Listo"}
      </span>
    </header>
  )
}
