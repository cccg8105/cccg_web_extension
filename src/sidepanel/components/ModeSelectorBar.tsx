import { FileSpreadsheet, LayoutList } from "lucide-react"
import type { WorkflowMode } from "~types/workflow"

interface ModeSelectorBarProps {
  mode: WorkflowMode
  onChangeMode: (nextMode: WorkflowMode) => void
  disabled?: boolean
}

export function ModeSelectorBar({
  mode,
  onChangeMode,
  disabled
}: ModeSelectorBarProps) {
  return (
    <div className="px-3 py-2 bg-slate-900/90 border-b border-slate-800 space-y-1.5">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        Modo de automatización
      </div>
      <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-lg">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChangeMode("records_loop")}
          className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-[11px] font-medium transition disabled:opacity-50 ${
            mode === "records_loop"
              ? "bg-indigo-600/90 text-white shadow"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
          }`}>
          <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Iterar Registros (CSV)</span>
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={() => onChangeMode("dom_list_extract")}
          className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-[11px] font-medium transition disabled:opacity-50 ${
            mode === "dom_list_extract"
              ? "bg-pink-600/90 text-white shadow"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
          }`}>
          <LayoutList className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Extraer Lista Web</span>
        </button>
      </div>
    </div>
  )
}
