import { ArrowRightCircle, Crosshair, Layers } from "lucide-react"
import { sendOrchestratorCommand } from "~sidepanel/utils/step-helpers"
import { DEFAULT_DOM_LIST_CONFIG } from "~storage/workflow-storage"
import type { DomListConfig, ExecutionState } from "~types/workflow"

interface DomListConfigCardProps {
  config: DomListConfig
  onChange: (nextConfig: DomListConfig) => void
  executionState?: ExecutionState
  isRunning: boolean
}

export function DomListConfigCard({
  config,
  onChange,
  executionState,
  isRunning
}: DomListConfigCardProps) {
  const isPickingContainer =
    executionState?.status === "picking" &&
    executionState?.pickingTarget === "list_container"

  const isPickingNextButton =
    executionState?.status === "picking" &&
    executionState?.pickingTarget === "pagination_next"

  const pagination = config.pagination ?? DEFAULT_DOM_LIST_CONFIG.pagination!

  const togglePickContainer = () => {
    if (isPickingContainer) {
      sendOrchestratorCommand({ type: "CANCEL_PICKING" })
      return
    }
    sendOrchestratorCommand({
      type: "START_PICKING",
      pickingTarget: "list_container"
    })
  }

  const togglePickNextButton = () => {
    if (isPickingNextButton) {
      sendOrchestratorCommand({ type: "CANCEL_PICKING" })
      return
    }
    sendOrchestratorCommand({
      type: "START_PICKING",
      pickingTarget: "pagination_next"
    })
  }

  const updatePagination = (patch: Partial<typeof pagination>) => {
    onChange({
      ...config,
      pagination: {
        ...pagination,
        ...patch
      }
    })
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold text-slate-200 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-pink-400" />
          Componente repetitivo de la lista (Contenedor)
        </span>
        {executionState?.detectedListCount !== undefined && (
          <span className="px-2 py-0.5 rounded-full bg-pink-500/15 border border-pink-500/30 text-pink-300 font-medium text-[10px]">
            {executionState.detectedListCount} ítems detectados
          </span>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="block text-[11px] text-slate-400">
          Selector CSS de cada tarjeta o fila que se repite:
        </label>
        <div className="flex gap-1.5">
          <input
            type="text"
            disabled={isRunning}
            value={config.itemSelector ?? ""}
            onChange={(e) =>
              onChange({
                ...config,
                itemSelector: e.target.value
              })
            }
            placeholder="Ej: .product-card, ul.results > li, table tbody tr"
            className="flex-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 font-mono text-[11px] text-slate-200 focus:outline-none focus:border-pink-500 disabled:opacity-60"
          />
          <button
            type="button"
            disabled={isRunning}
            onClick={togglePickContainer}
            className={`px-2.5 py-1.5 rounded font-medium flex items-center gap-1 shrink-0 transition disabled:opacity-40 ${
              isPickingContainer
                ? "bg-pink-600 text-white"
                : "bg-pink-500/15 hover:bg-pink-500/25 text-pink-300 border border-pink-500/30"
            }`}>
            <Crosshair className="w-3.5 h-3.5" />
            {isPickingContainer ? "Cancelar" : "Elegir lista"}
          </button>
        </div>
        <p className="text-[10px] text-slate-500">
          Luego agrega pasos <strong>+ Extraer</strong> abajo para capturar cada
          dato dentro de cada tarjeta.
        </p>
      </div>

      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
        <label className="text-[11px] text-slate-400">
          Límite máximo de elementos a extraer (0 = todos):
        </label>
        <input
          type="number"
          disabled={isRunning}
          min={0}
          step={1}
          value={config.maxItems ?? 0}
          onChange={(e) =>
            onChange({
              ...config,
              maxItems: Math.max(0, Number(e.target.value))
            })
          }
          className="w-20 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-right font-mono text-slate-200 focus:outline-none focus:border-pink-500 disabled:opacity-60"
        />
      </div>

      {/* Pagination section (F-13) */}
      <div className="pt-2 border-t border-slate-800 space-y-2.5">
        <label className="flex items-center justify-between gap-2 cursor-pointer">
          <span className="text-[11px] font-semibold text-slate-200 flex items-center gap-1.5">
            <ArrowRightCircle className="w-3.5 h-3.5 text-indigo-400" />
            Recorrer múltiples páginas (Paginación automática)
          </span>
          <input
            type="checkbox"
            disabled={isRunning}
            checked={Boolean(pagination.enabled)}
            onChange={(e) => updatePagination({ enabled: e.target.checked })}
            className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
          />
        </label>

        {pagination.enabled && (
          <div className="space-y-2 pl-2 border-l-2 border-indigo-500/40">
            <div className="space-y-1">
              <label className="block text-[11px] text-slate-400">
                Selector CSS del botón &ldquo;Siguiente página&rdquo;:
              </label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  disabled={isRunning}
                  value={pagination.nextButtonSelector ?? ""}
                  onChange={(e) =>
                    updatePagination({ nextButtonSelector: e.target.value })
                  }
                  placeholder="Ej: a.next, button[aria-label='Siguiente']"
                  className="flex-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 font-mono text-[11px] text-slate-200 focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                />
                <button
                  type="button"
                  disabled={isRunning}
                  onClick={togglePickNextButton}
                  className={`px-2.5 py-1.5 rounded font-medium flex items-center gap-1 shrink-0 transition disabled:opacity-40 ${
                    isPickingNextButton
                      ? "bg-indigo-600 text-white"
                      : "bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30"
                  }`}>
                  <Crosshair className="w-3.5 h-3.5" />
                  {isPickingNextButton ? "Cancelar" : "Elegir"}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="block text-[11px] text-slate-400">
                  Máximo de páginas:
                </label>
                <input
                  type="number"
                  disabled={isRunning}
                  min={1}
                  max={500}
                  value={pagination.maxPages ?? 5}
                  onChange={(e) =>
                    updatePagination({
                      maxPages: Math.max(1, Number(e.target.value))
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 font-mono text-slate-200 focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] text-slate-400">
                  Espera tras clic (ms):
                </label>
                <input
                  type="number"
                  disabled={isRunning}
                  min={300}
                  step={200}
                  value={pagination.waitAfterClickMs ?? 2000}
                  onChange={(e) =>
                    updatePagination({
                      waitAfterClickMs: Math.max(300, Number(e.target.value))
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 font-mono text-slate-200 focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
