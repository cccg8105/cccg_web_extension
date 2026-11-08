import {
  ChevronDown,
  ChevronUp,
  Copy,
  Crosshair,
  Plus,
  Trash2
} from "lucide-react"
import type {
  ActionType,
  ExtractSourceType,
  WorkflowMode,
  WorkflowStep
} from "~types/workflow"

const BADGE_CONFIG: Record<ActionType, { text: string; className: string }> = {
  click: {
    text: "CLIC",
    className: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30"
  },
  input: {
    text: "TEXTO",
    className: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
  },
  select: {
    text: "SELECT",
    className: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30"
  },
  keypress: {
    text: "TECLA",
    className: "bg-purple-500/15 text-purple-300 border-purple-500/30"
  },
  extract: {
    text: "EXTRAER",
    className: "bg-pink-500/15 text-pink-300 border-pink-500/30"
  },
  wait: {
    text: "ESPERA",
    className: "bg-amber-500/15 text-amber-300 border-amber-500/30"
  }
}

interface StepCardProps {
  step: WorkflowStep
  index: number
  totalSteps: number
  columns: string[]
  mode?: WorkflowMode
  isRunning: boolean
  isPickingThis: boolean
  onUpdate: (id: string, patch: Partial<WorkflowStep>) => void
  onRemove: (id: string) => void
  onMove: (index: number, direction: -1 | 1) => void
  onDuplicate: (index: number) => void
  onTogglePick: (stepId: string) => void
}

export function StepCard({
  step,
  index,
  totalSteps,
  columns,
  mode = "records_loop",
  isRunning,
  isPickingThis,
  onUpdate,
  onRemove,
  onMove,
  onDuplicate,
  onTogglePick
}: StepCardProps) {
  const badge = BADGE_CONFIG[step.type] ?? BADGE_CONFIG.click

  const appendVariableToStep = (colName: string) => {
    const current = step.valueTemplate ?? ""
    onUpdate(step.id, {
      valueTemplate: `${current}{{${colName}}}`
    })
  }

  return (
    <div
      className={`rounded-lg border p-3 space-y-2.5 transition ${
        isPickingThis
          ? "bg-indigo-950/30 border-indigo-500"
          : "bg-slate-900 border-slate-800"
      }`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 font-bold flex items-center justify-center text-[11px] shrink-0">
            {index + 1}
          </span>
          <span
            className={`px-1.5 py-0.5 rounded text-[9px] font-bold border shrink-0 ${badge.className}`}>
            {badge.text}
          </span>
          <input
            type="text"
            disabled={isRunning}
            value={step.label}
            onChange={(e) => onUpdate(step.id, { label: e.target.value })}
            className="bg-transparent border-b border-transparent focus:border-indigo-500 focus:outline-none font-medium text-slate-100 truncate w-full disabled:opacity-60"
          />
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => onMove(index, -1)}
            disabled={index === 0 || isRunning}
            title="Subir paso"
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30">
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onMove(index, 1)}
            disabled={index === totalSteps - 1 || isRunning}
            title="Bajar paso"
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30">
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDuplicate(index)}
            disabled={isRunning}
            title="Duplicar paso"
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30">
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onRemove(step.id)}
            disabled={isRunning}
            title="Eliminar paso"
            className="p-1 rounded text-rose-400 hover:bg-rose-500/15 disabled:opacity-30">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Selector Config for DOM steps */}
      {step.type !== "wait" && (
        <div className="space-y-1.5">
          <label className="block text-[11px] text-slate-400">
            {mode === "dom_list_extract"
              ? "Selector CSS dentro del ítem (o :scope para el contenedor):"
              : "Selector CSS del componente:"}
          </label>
          <div className="flex gap-1.5">
            <input
              type="text"
              disabled={isRunning}
              value={step.selector ?? ""}
              onChange={(e) => onUpdate(step.id, { selector: e.target.value })}
              placeholder={
                mode === "dom_list_extract"
                  ? "Ej: h2.title, .price, a.link o :scope"
                  : step.type === "select"
                    ? "Ej: select[name='rol'] o #pais"
                    : "Ej: #submit-btn o input[name='email']"
              }
              className="flex-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 font-mono text-[11px] text-slate-200 focus:outline-none focus:border-indigo-500 disabled:opacity-60"
            />
            <button
              type="button"
              disabled={isRunning}
              onClick={() => onTogglePick(step.id)}
              className={`px-2.5 py-1.5 rounded font-medium flex items-center gap-1 shrink-0 transition disabled:opacity-40 ${
                isPickingThis
                  ? "bg-indigo-600 text-white"
                  : "bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30"
              }`}>
              <Crosshair className="w-3.5 h-3.5" />
              {isPickingThis ? "Cancelar" : "Elegir"}
            </button>
          </div>
        </div>
      )}

      {/* Value template for input & select */}
      {(step.type === "input" || step.type === "select") && (
        <div className="space-y-1.5">
          <label className="block text-[11px] text-slate-400">
            {step.type === "select"
              ? "Valor o texto de la opción a seleccionar:"
              : "Valor a escribir (usa variables o texto fijo):"}
          </label>
          <input
            type="text"
            disabled={isRunning}
            value={step.valueTemplate ?? ""}
            onChange={(e) =>
              onUpdate(step.id, {
                valueTemplate: e.target.value
              })
            }
            placeholder={
              step.type === "select"
                ? "Ej: {{rol}} o Admin"
                : "Ej: {{nombre}} o texto fijo"
            }
            className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500 disabled:opacity-60"
          />
          {mode === "records_loop" && columns.length > 0 && (
            <div className="flex items-center flex-wrap gap-1 pt-0.5">
              <span className="text-[10px] text-slate-500">Insertar:</span>
              {columns.map((col) => (
                <button
                  key={col}
                  type="button"
                  disabled={isRunning}
                  onClick={() => appendVariableToStep(col)}
                  className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 font-mono text-[10px] flex items-center gap-0.5 disabled:opacity-40">
                  <Plus className="w-2.5 h-2.5" />
                  {col}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Key selector for keypress */}
      {step.type === "keypress" && (
        <div className="flex items-center justify-between gap-2">
          <label className="text-[11px] text-slate-400">
            Tecla a presionar:
          </label>
          <select
            disabled={isRunning}
            value={step.key ?? "Enter"}
            onChange={(e) => onUpdate(step.id, { key: e.target.value })}
            className="w-40 bg-slate-950 border border-slate-800 rounded px-2.5 py-1 font-mono text-[11px] text-slate-200 focus:outline-none focus:border-indigo-500 disabled:opacity-60">
            <option value="Enter">Enter (Enviar)</option>
            <option value="Tab">Tab (Siguiente)</option>
            <option value="Escape">Escape (Cerrar)</option>
            <option value="Space">Space (Espacio)</option>
            <option value="Backspace">Backspace (Borrar)</option>
            <option value="ArrowDown">ArrowDown (↓)</option>
            <option value="ArrowUp">ArrowUp (↑)</option>
          </select>
        </div>
      )}

      {/* Extract configuration */}
      {step.type === "extract" && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="block text-[11px] text-slate-400">
                Columna de salida (CSV):
              </label>
              <input
                type="text"
                disabled={isRunning}
                value={step.outputColumn ?? ""}
                onChange={(e) =>
                  onUpdate(step.id, {
                    outputColumn: e.target.value
                  })
                }
                placeholder="Ej: titulo_producto"
                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 font-mono text-[11px] text-slate-200 focus:outline-none focus:border-indigo-500 disabled:opacity-60"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] text-slate-400">
                Propiedad a leer:
              </label>
              <select
                disabled={isRunning}
                value={step.extractSource ?? "textContent"}
                onChange={(e) =>
                  onUpdate(step.id, {
                    extractSource: e.target.value as ExtractSourceType
                  })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-indigo-500 disabled:opacity-60">
                <option value="textContent">Texto visible</option>
                <option value="value">Valor (value)</option>
                <option value="attribute">Atributo HTML</option>
              </select>
            </div>
          </div>

          {step.extractSource === "attribute" && (
            <div className="space-y-1">
              <label className="block text-[11px] text-slate-400">
                Nombre del atributo HTML:
              </label>
              <input
                type="text"
                disabled={isRunning}
                value={step.extractAttribute ?? ""}
                onChange={(e) =>
                  onUpdate(step.id, {
                    extractAttribute: e.target.value
                  })
                }
                placeholder="Ej: href, src, data-id"
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 font-mono text-[11px] text-slate-200 focus:outline-none focus:border-indigo-500 disabled:opacity-60"
              />
            </div>
          )}
        </div>
      )}

      {/* Wait duration */}
      {step.type === "wait" && (
        <div className="flex items-center justify-between gap-2">
          <label className="text-[11px] text-slate-400">
            Tiempo de espera (milisegundos):
          </label>
          <input
            type="number"
            disabled={isRunning}
            min={100}
            step={100}
            value={step.waitMs ?? 1000}
            onChange={(e) =>
              onUpdate(step.id, {
                waitMs: Number(e.target.value)
              })
            }
            className="w-28 bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-right font-mono text-slate-200 focus:outline-none focus:border-indigo-500 disabled:opacity-60"
          />
        </div>
      )}
    </div>
  )
}
