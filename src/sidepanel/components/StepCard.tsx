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
    className: "bg-forest-moss text-parchment border-forest-deep"
  },
  input: {
    text: "TEXTO",
    className: "bg-forest-deep/30 text-fog border-forest-deep/60"
  },
  select: {
    text: "SELECT",
    className: "bg-ember text-limestone border-rim"
  },
  keypress: {
    text: "TECLA",
    className: "bg-ember text-copper border-rim"
  },
  extract: {
    text: "EXTRAER",
    className: "bg-coral-shimmer/20 text-coral-shimmer border-coral-shimmer/40"
  },
  wait: {
    text: "ESPERA",
    className: "bg-amber-950/30 text-amber-300 border-amber-600/30"
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
      className={`rounded-lg border p-3 space-y-2.5 transition ${isPickingThis
          ? "bg-forest-moss/60 border-coral-shimmer shadow-[0_0_12px_rgba(232,118,80,0.25)]"
          : "bg-ember border-rim hover:border-copper/50"
        }`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <span className="w-5 h-5 rounded-full bg-void-black border border-rim text-ash font-bold flex items-center justify-center text-[11px] shrink-0">
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
            className="bg-transparent border-b border-transparent focus:border-coral-shimmer focus:outline-none font-medium text-parchment truncate w-full disabled:opacity-60"
          />
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => onMove(index, -1)}
            disabled={index === 0 || isRunning}
            title="Subir paso"
            className="p-1 rounded bg-void-black hover:bg-obsidian border border-rim text-ash hover:text-parchment disabled:opacity-30">
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onMove(index, 1)}
            disabled={index === totalSteps - 1 || isRunning}
            title="Bajar paso"
            className="p-1 rounded bg-void-black hover:bg-obsidian border border-rim text-ash hover:text-parchment disabled:opacity-30">
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDuplicate(index)}
            disabled={isRunning}
            title="Duplicar paso"
            className="p-1 rounded bg-void-black hover:bg-obsidian border border-rim text-ash hover:text-parchment disabled:opacity-30">
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onRemove(step.id)}
            disabled={isRunning}
            title="Eliminar paso"
            className="p-1 rounded text-rose-400 hover:bg-rose-950/20 border border-transparent hover:border-rose-600/30 disabled:opacity-30">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Selector Config for DOM steps */}
      {step.type !== "wait" && (
        <div className="space-y-1.5">
          <label className="block text-[11px] text-ash">
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
              className="flex-1 bg-void-black border border-rim rounded px-2.5 py-1.5 font-mono text-[11px] text-parchment placeholder:text-ash/60 focus:outline-none focus:border-coral-shimmer focus:ring-1 focus:ring-coral-shimmer/30 disabled:opacity-60"
            />
            <button
              type="button"
              disabled={isRunning}
              onClick={() => onTogglePick(step.id)}
              className={`px-2.5 py-1.5 rounded font-medium flex items-center gap-1 shrink-0 transition disabled:opacity-40 ${isPickingThis
                  ? "bg-coral-shimmer text-void-black font-semibold"
                  : "bg-forest-moss hover:bg-forest-deep text-parchment border border-forest-deep"
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
          <label className="block text-[11px] text-ash">
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
            className="w-full bg-void-black border border-rim rounded px-2.5 py-1.5 text-parchment placeholder:text-ash/60 focus:outline-none focus:border-coral-shimmer focus:ring-1 focus:ring-coral-shimmer/30 disabled:opacity-60"
          />
          {mode === "records_loop" && columns.length > 0 && (
            <div className="flex items-center flex-wrap gap-1 pt-0.5">
              <span className="text-[10px] text-ash">Insertar:</span>
              {columns.map((col) => (
                <button
                  key={col}
                  type="button"
                  disabled={isRunning}
                  onClick={() => appendVariableToStep(col)}
                  className="px-1.5 py-0.5 rounded bg-void-black hover:bg-obsidian border border-rim text-limestone hover:text-parchment font-mono text-[10px] flex items-center gap-0.5 disabled:opacity-40 transition">
                  <Plus className="w-2.5 h-2.5 text-coral-shimmer" />
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
          <label className="text-[11px] text-ash">
            Tecla a presionar:
          </label>
          <select
            disabled={isRunning}
            value={step.key ?? "Enter"}
            onChange={(e) => onUpdate(step.id, { key: e.target.value })}
            className="w-40 bg-void-black border border-rim rounded px-2.5 py-1 font-mono text-[11px] text-parchment focus:outline-none focus:border-coral-shimmer disabled:opacity-60">
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
              <label className="block text-[11px] text-ash">
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
                className="w-full bg-void-black border border-rim rounded px-2 py-1 font-mono text-[11px] text-parchment placeholder:text-ash/60 focus:outline-none focus:border-coral-shimmer disabled:opacity-60"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] text-ash">
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
                className="w-full bg-void-black border border-rim rounded px-2 py-1 text-[11px] text-parchment focus:outline-none focus:border-coral-shimmer disabled:opacity-60">
                <option value="textContent">Texto visible</option>
                <option value="value">Valor (value)</option>
                <option value="attribute">Atributo HTML</option>
              </select>
            </div>
          </div>

          {step.extractSource === "attribute" && (
            <div className="space-y-1">
              <label className="block text-[11px] text-ash">
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
                className="w-full bg-void-black border border-rim rounded px-2.5 py-1 font-mono text-[11px] text-parchment placeholder:text-ash/60 focus:outline-none focus:border-coral-shimmer disabled:opacity-60"
              />
            </div>
          )}
        </div>
      )}

      {/* Wait duration */}
      {step.type === "wait" && (
        <div className="flex items-center justify-between gap-2">
          <label className="text-[11px] text-ash">
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
            className="w-28 bg-void-black border border-rim rounded px-2.5 py-1 text-right font-mono text-parchment focus:outline-none focus:border-coral-shimmer disabled:opacity-60"
          />
        </div>
      )}
    </div>
  )
}
