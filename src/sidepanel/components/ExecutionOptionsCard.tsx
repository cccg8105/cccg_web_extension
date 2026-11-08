import { FastForward, OctagonAlert, SlidersHorizontal } from "lucide-react"
import type { ExecutionOptions, WorkflowMode } from "~types/workflow"

interface ExecutionOptionsCardProps {
  options: ExecutionOptions
  onChange: (nextOptions: ExecutionOptions) => void
  mode: WorkflowMode
  disabled?: boolean
}

export function ExecutionOptionsCard({
  options,
  onChange,
  mode,
  disabled
}: ExecutionOptionsCardProps) {
  const itemLabel = mode === "dom_list_extract" ? "Ítem" : "Fila"

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-slate-200 flex items-center gap-1.5">
          <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
          Resiliencia y rango de ejecución
        </span>
      </div>

      {/* Error handling policy (F-08) */}
      <div className="space-y-1.5">
        <label className="block text-[11px] text-slate-400">
          Política cuando falle un paso:
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange({ ...options, onError: "stop" })}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded border text-[11px] font-medium transition disabled:opacity-50 ${
              options.onError === "stop"
                ? "bg-rose-500/15 border-rose-500/40 text-rose-200"
                : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
            }`}>
            <OctagonAlert className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Detener al fallar</span>
          </button>

          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange({ ...options, onError: "skip" })}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded border text-[11px] font-medium transition disabled:opacity-50 ${
              options.onError === "skip"
                ? "bg-amber-500/15 border-amber-500/40 text-amber-200"
                : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
            }`}>
            <FastForward className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Saltar y continuar</span>
          </button>
        </div>
      </div>

      {/* Iteration range (F-09) */}
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80">
        <div className="space-y-1">
          <label className="block text-[11px] text-slate-400">
            Desde {itemLabel} #:
          </label>
          <input
            type="number"
            disabled={disabled}
            min={1}
            step={1}
            value={options.startRow ?? 1}
            onChange={(e) =>
              onChange({
                ...options,
                startRow: Math.max(1, Number(e.target.value) || 1)
              })
            }
            className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 font-mono text-slate-200 focus:outline-none focus:border-indigo-500 disabled:opacity-60"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-[11px] text-slate-400">
            Hasta {itemLabel} # (0 = final):
          </label>
          <input
            type="number"
            disabled={disabled}
            min={0}
            step={1}
            value={options.endRow ?? 0}
            onChange={(e) =>
              onChange({
                ...options,
                endRow: Math.max(0, Number(e.target.value) || 0)
              })
            }
            className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 font-mono text-slate-200 focus:outline-none focus:border-indigo-500 disabled:opacity-60"
          />
        </div>
      </div>
    </div>
  )
}
