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
    <header className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
      <div>
        <h1 className="text-sm font-bold text-white flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
          AutoLoop RPA
        </h1>
        <p className="text-[11px] text-slate-400">{subtitle}</p>
      </div>
      <span
        className={`px-2.5 py-1 rounded-full text-[11px] font-medium border ${
          status === "running"
            ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/40"
            : status === "picking"
              ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40 animate-pulse"
              : status === "error"
                ? "bg-rose-500/15 text-rose-300 border-rose-500/40"
                : "bg-slate-800 text-slate-300 border-slate-700"
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
