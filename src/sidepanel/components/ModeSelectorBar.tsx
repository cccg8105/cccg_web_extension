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
    <div className="px-3 py-2 bg-void-black/80 border-b border-rim space-y-1.5">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-ash">
        Modo de automatización
      </div>
      <div className="grid grid-cols-2 gap-1.5 p-1 bg-obsidian border border-rim rounded-lg">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChangeMode("records_loop")}
          className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-[11px] font-medium transition disabled:opacity-50 ${mode === "records_loop"
              ? "bg-forest-deep text-parchment shadow-sm"
              : "text-ash hover:text-parchment hover:bg-ember"
            }`}>
          <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Iterar Registros (CSV)</span>
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={() => onChangeMode("dom_list_extract")}
          className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-[11px] font-medium transition disabled:opacity-50 ${mode === "dom_list_extract"
              ? "bg-forest-deep text-parchment shadow-sm"
              : "text-ash hover:text-parchment hover:bg-ember"
            }`}>
          <LayoutList className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Extraer Lista Web</span>
        </button>
      </div>
    </div>
  )
}
