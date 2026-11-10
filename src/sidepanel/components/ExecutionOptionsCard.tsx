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
    <div className="bg-ember border border-rim rounded-lg p-3 space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-parchment flex items-center gap-1.5">
          <SlidersHorizontal className="w-3.5 h-3.5 text-coral-shimmer" />
          Resiliencia y rango de ejecución
        </span>
      </div>

      {/* Error handling policy */}
      <div className="space-y-1.5">
        <label className="block text-[11px] text-ash">
          Política cuando falle un paso:
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange({ ...options, onError: "stop" })}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded border text-[11px] font-medium transition disabled:opacity-50 ${
              options.onError === "stop"
                ? "bg-rose-950/40 border-rose-600/40 text-rose-300"
                : "bg-void-black border-rim text-ash hover:text-parchment hover:bg-obsidian"
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
                ? "bg-amber-950/40 border-amber-600/40 text-amber-300"
                : "bg-void-black border-rim text-ash hover:text-parchment hover:bg-obsidian"
            }`}>
            <FastForward className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Saltar y continuar</span>
          </button>
        </div>
      </div>

      {/* Iteration range */}
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-rim">
        <div className="space-y-1">
          <label className="block text-[11px] text-ash">
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
            className="w-full bg-void-black border border-rim rounded px-2 py-1 font-mono text-parchment focus:outline-none focus:border-coral-shimmer disabled:opacity-60"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-[11px] text-ash">
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
            className="w-full bg-void-black border border-rim rounded px-2 py-1 font-mono text-parchment focus:outline-none focus:border-coral-shimmer disabled:opacity-60"
          />
        </div>
      </div>
    </div>
  )
}
