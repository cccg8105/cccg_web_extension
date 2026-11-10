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
    <div className="bg-ember border border-rim rounded-lg p-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold text-parchment flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-coral-shimmer" />
          Componente repetitivo de la lista (Contenedor)
        </span>
        {executionState?.detectedListCount !== undefined && (
          <span className="px-2 py-0.5 rounded-full bg-forest-moss border border-forest-deep text-fog font-medium text-[10px]">
            {executionState.detectedListCount} ítems detectados
          </span>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="block text-[11px] text-ash">
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
            className="flex-1 bg-void-black border border-rim rounded px-2.5 py-1.5 font-mono text-[11px] text-parchment placeholder:text-ash/60 focus:outline-none focus:border-coral-shimmer disabled:opacity-60"
          />
          <button
            type="button"
            disabled={isRunning}
            onClick={togglePickContainer}
            className={`px-2.5 py-1.5 rounded font-medium flex items-center gap-1 shrink-0 transition disabled:opacity-40 ${isPickingContainer
                ? "bg-coral-shimmer text-void-black font-semibold"
                : "bg-forest-moss hover:bg-forest-deep text-parchment border border-forest-deep"
              }`}>
            <Crosshair className="w-3.5 h-3.5" />
            {isPickingContainer ? "Cancelar" : "Elegir lista"}
          </button>
        </div>
        <p className="text-[10px] text-ash">
          Luego agrega pasos <strong>+ Extraer</strong> abajo para capturar cada
          dato dentro de cada tarjeta.
        </p>
      </div>

      <div className="flex items-center justify-between gap-2 pt-1 border-t border-rim">
        <label className="text-[11px] text-ash">
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
          className="w-20 bg-void-black border border-rim rounded px-2 py-1 text-right font-mono text-parchment focus:outline-none focus:border-coral-shimmer disabled:opacity-60"
        />
      </div>

      {/* Pagination section */}
      <div className="pt-2 border-t border-rim space-y-2.5">
        <label className="flex items-center justify-between gap-2 cursor-pointer">
          <span className="text-[11px] font-semibold text-parchment flex items-center gap-1.5">
            <ArrowRightCircle className="w-3.5 h-3.5 text-forest-deep" />
            Recorrer múltiples páginas (Paginación automática)
          </span>
          <input
            type="checkbox"
            disabled={isRunning}
            checked={Boolean(pagination.enabled)}
            onChange={(e) => updatePagination({ enabled: e.target.checked })}
            className="rounded border-rim bg-void-black text-forest-deep focus:ring-forest-deep accent-forest-deep"
          />
        </label>

        {pagination.enabled && (
          <div className="space-y-2 pl-2 border-l-2 border-forest-deep">
            <div className="space-y-1">
              <label className="block text-[11px] text-ash">
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
                  className="flex-1 bg-void-black border border-rim rounded px-2.5 py-1.5 font-mono text-[11px] text-parchment placeholder:text-ash/60 focus:outline-none focus:border-coral-shimmer disabled:opacity-60"
                />
                <button
                  type="button"
                  disabled={isRunning}
                  onClick={togglePickNextButton}
                  className={`px-2.5 py-1.5 rounded font-medium flex items-center gap-1 shrink-0 transition disabled:opacity-40 ${isPickingNextButton
                      ? "bg-coral-shimmer text-void-black font-semibold"
                      : "bg-forest-moss hover:bg-forest-deep text-parchment border border-forest-deep"
                    }`}>
                  <Crosshair className="w-3.5 h-3.5" />
                  {isPickingNextButton ? "Cancelar" : "Elegir"}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="block text-[11px] text-ash">
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
                  className="w-full bg-void-black border border-rim rounded px-2 py-1 font-mono text-parchment focus:outline-none focus:border-coral-shimmer disabled:opacity-60"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] text-ash">
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
                  className="w-full bg-void-black border border-rim rounded px-2 py-1 font-mono text-parchment focus:outline-none focus:border-coral-shimmer disabled:opacity-60"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
