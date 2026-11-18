import {
  Crosshair,
  Link2,
  Plus,
  RefreshCw,
  Table,
  Trash2
} from "lucide-react"
import { useState } from "react"
import type {
  ExecutionState,
  ExtractSourceType,
  InspectTablePageResponse,
  OrchestratorCommand,
  TableExtractColumnConfig,
  TableExtractConfig
} from "~types/workflow"

interface TableExtractConfigCardProps {
  config: TableExtractConfig
  executionState?: ExecutionState
  isRunning?: boolean
  detectedRowCount?: number
  detectedColumnCount?: number
  onChange: (next: TableExtractConfig) => void
  onSyncSuccess?: (rowCount: number, colCount: number) => void
  onPickTableContainer: () => void
  onPickHeaderRow: () => void
  onPickPaginationNext: () => void
}

export function TableExtractConfigCard({
  config,
  executionState,
  isRunning = false,
  detectedRowCount,
  detectedColumnCount,
  onChange,
  onSyncSuccess,
  onPickTableContainer,
  onPickHeaderRow,
  onPickPaginationNext
}: TableExtractConfigCardProps) {
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState<{
    ok: boolean
    text: string
  } | null>(null)

  const isPickingTableContainer =
    executionState?.status === "picking" &&
    executionState?.pickingTarget === "table_container"

  const isPickingHeaderRow =
    executionState?.status === "picking" &&
    executionState?.pickingTarget === "table_header_row"

  const isPickingNextButton =
    executionState?.status === "picking" &&
    executionState?.pickingTarget === "pagination_next"

  const pagination = config.pagination ?? {
    enabled: false,
    nextButtonSelector: "",
    waitAfterClickMs: 2000,
    maxPages: 5
  }

  const columns = config.columns ?? []
  const displayColumnCount =
    columns.length > 0 ? columns.length : detectedColumnCount

  const handleSyncColumns = async () => {
    const trimmed = config.tableSelector.trim()
    if (!trimmed) {
      setSyncMessage({
        ok: false,
        text: "Primero indica o selecciona una tabla en la página."
      })
      return
    }

    setIsSyncing(true)
    setSyncMessage(null)

    try {
      const response = await chrome.runtime.sendMessage<
        OrchestratorCommand,
        InspectTablePageResponse
      >({
        type: "INSPECT_TABLE_IN_ACTIVE_TAB",
        tableSelector: trimmed,
        headerRowIndex: Math.max(1, config.headerRowIndex || 1)
      })

      if (!response || !response.ok) {
        setSyncMessage({
          ok: false,
          text:
            response?.message ??
            "No se recibió respuesta de la página (recarga la pestaña e intenta de nuevo)."
        })
        return
      }

      const nextColumns: TableExtractColumnConfig[] = response.headers.map(
        (headerName, idx) => {
          const prev = columns[idx]
          return {
            index: idx,
            name: headerName,
            source: prev?.source ?? "textContent",
            attribute: prev?.attribute
          }
        }
      )

      onChange({
        ...config,
        columns: nextColumns
      })
      onSyncSuccess?.(response.dataRowCount, nextColumns.length)
      setSyncMessage({
        ok: true,
        text: `${nextColumns.length} columnas y ${response.dataRowCount} filas detectadas.`
      })
    } catch (err) {
      const errText = err instanceof Error ? err.message : String(err)
      setSyncMessage({
        ok: false,
        text: `No se pudo inspeccionar la tabla (recarga la pestaña): ${errText}`
      })
    } finally {
      setIsSyncing(false)
    }
  }

  const updateColumn = (
    arrayIdx: number,
    patch: Partial<TableExtractColumnConfig>
  ) => {
    const updated = columns.map((col, idx) =>
      idx === arrayIdx ? { ...col, ...patch } : col
    )
    onChange({
      ...config,
      columns: updated
    })
  }

  const removeColumn = (arrayIdx: number) => {
    onChange({
      ...config,
      columns: columns.filter((_, idx) => idx !== arrayIdx)
    })
  }

  const addManualColumn = () => {
    const maxColIdx = columns.reduce(
      (acc, col) => Math.max(acc, col.index),
      -1
    )
    const nextIndex = maxColIdx + 1
    onChange({
      ...config,
      columns: [
        ...columns,
        {
          index: nextIndex,
          name: `columna_${nextIndex + 1}`,
          source: "textContent"
        }
      ]
    })
  }

  return (
    <div className="bg-ember border border-rim rounded-lg p-3 space-y-3 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <Table className="w-3.5 h-3.5 text-coral-shimmer shrink-0" />
          <h3 className="text-[11px] font-semibold uppercase tracking-wide text-fog truncate">
            Configuración de Tabla HTML
          </h3>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {displayColumnCount !== undefined && displayColumnCount > 0 && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-obsidian text-limestone border border-rim">
              {displayColumnCount} cols
            </span>
          )}
          {detectedRowCount !== undefined && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-forest-moss/50 text-parchment border border-forest-deep/70">
              {detectedRowCount} filas
            </span>
          )}
        </div>
      </div>

      {/* Selector de tabla */}
      <div>
        <label className="block text-[10px] font-semibold uppercase tracking-wider text-ash mb-1">
          Selector CSS de la tabla (&lt;table&gt;)
        </label>
        <div className="flex gap-1.5">
          <input
            type="text"
            value={config.tableSelector}
            onChange={(e) =>
              onChange({ ...config, tableSelector: e.target.value })
            }
            placeholder="Ej: table.data-grid, #tabla-resultados"
            className="flex-1 min-w-0 px-2.5 py-1.5 text-xs font-mono bg-void-black border border-rim text-parchment placeholder:text-copper/60 rounded focus:outline-none focus:border-coral-shimmer"
          />
          <button
            type="button"
            disabled={isRunning}
            onClick={onPickTableContainer}
            title="Seleccionar tabla HTML visualmente en la página"
            className={`px-2.5 py-1.5 rounded text-xs font-medium flex items-center gap-1 shrink-0 transition disabled:opacity-40 ${
              isPickingTableContainer
                ? "bg-coral-shimmer text-void-black font-semibold"
                : "bg-coral-shimmer/15 hover:bg-coral-shimmer/25 text-coral-shimmer border border-coral-shimmer/40"
            }`}>
            <Crosshair className="w-3.5 h-3.5" />
            {isPickingTableContainer ? "Cancelar" : "Elegir tabla"}
          </button>
        </div>
      </div>

      {/* Fila de cabecera */}
      <div className="pt-2 border-t border-rim/60 space-y-2">
        <div className="flex items-end gap-2">
          <div className="w-24 shrink-0">
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-ash mb-1">
              Fila cabecera
            </label>
            <input
              type="number"
              min={1}
              value={config.headerRowIndex || 1}
              onChange={(e) =>
                onChange({
                  ...config,
                  headerRowIndex: Math.max(1, Number(e.target.value) || 1)
                })
              }
              className="w-full px-2 py-1.5 text-xs font-mono bg-void-black border border-rim text-parchment rounded focus:outline-none focus:border-coral-shimmer"
            />
          </div>

          <button
            type="button"
            disabled={isRunning}
            onClick={onPickHeaderRow}
            title="Hacer clic directamente sobre una fila <tr> para fijarla como cabecera"
            className={`flex-1 py-1.5 px-2 rounded text-xs font-medium flex items-center justify-center gap-1.5 transition disabled:opacity-40 ${
              isPickingHeaderRow
                ? "bg-coral-shimmer text-void-black font-semibold"
                : "bg-obsidian hover:bg-void-black text-fog border border-rim"
            }`}>
            <Crosshair
              className={`w-3.5 h-3.5 ${
                isPickingHeaderRow ? "text-void-black" : "text-coral-shimmer"
              }`}
            />
            {isPickingHeaderRow ? "Cancelar" : "Marcar fila"}
          </button>

          <button
            type="button"
            onClick={handleSyncColumns}
            disabled={isSyncing}
            title="Leer columnas de la fila cabecera indicada desde la pestaña activa"
            className="py-1.5 px-2.5 rounded bg-forest-moss/60 hover:bg-forest-deep/80 disabled:opacity-50 text-parchment border border-forest-deep text-xs font-medium flex items-center gap-1 shrink-0 transition">
            <RefreshCw
              className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`}
            />
            Detectar
          </button>
        </div>

        <p className="text-[10px] text-ash leading-tight">
          1 = primera fila de la tabla. Solo se extraerán las filas ubicadas
          después de la cabecera.
        </p>

        {syncMessage && (
          <div
            className={`text-[11px] px-2.5 py-1.5 rounded border ${
              syncMessage.ok
                ? "bg-forest-moss/35 border-forest-deep/70 text-fog"
                : "bg-coral-shimmer/15 border-coral-shimmer/40 text-coral-shimmer"
            }`}>
            {syncMessage.text}
          </div>
        )}
      </div>

      {/* Columnas configurables */}
      <div className="pt-2 border-t border-rim/60 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-ash">
            Columnas a extraer ({columns.length})
          </span>
          <button
            type="button"
            onClick={addManualColumn}
            className="text-[11px] font-medium text-fog hover:text-parchment bg-obsidian hover:bg-void-black border border-rim px-2 py-0.5 rounded flex items-center gap-1 transition">
            <Plus className="w-3 h-3 text-coral-shimmer" />
            Columna
          </button>
        </div>

        {columns.length === 0 ? (
          <div className="text-[11px] text-ash bg-void-black/60 border border-dashed border-rim rounded px-2.5 py-2">
            Aún no hay columnas cargadas. Usa <strong>Elegir tabla</strong>,{" "}
            <strong>Marcar fila</strong> o <strong>Detectar</strong> (si lo
            dejas vacío, se usarán automáticamente las columnas detectadas al
            ejecutar).
          </div>
        ) : (
          <div className="space-y-1.5 max-h-60 overflow-y-auto pr-0.5">
            {columns.map((col, idx) => (
              <div
                key={`${idx}-${col.index}`}
                className="bg-void-black/80 border border-rim/80 rounded p-2 space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <div
                    className="flex items-center gap-1 shrink-0"
                    title="Número de columna en la tabla (1 = primera celda)">
                    <span className="text-[10px] font-mono text-ash">#</span>
                    <input
                      type="number"
                      min={1}
                      value={col.index + 1}
                      onChange={(e) => {
                        const oneBased = Math.max(1, Number(e.target.value) || 1)
                        updateColumn(idx, { index: oneBased - 1 })
                      }}
                      className="w-11 px-1.5 py-1 text-[11px] font-mono bg-obsidian border border-rim text-parchment rounded focus:outline-none focus:border-coral-shimmer"
                    />
                  </div>

                  <input
                    type="text"
                    value={col.name}
                    onChange={(e) =>
                      updateColumn(idx, { name: e.target.value })
                    }
                    placeholder={`columna_${col.index + 1}`}
                    className="flex-1 min-w-0 px-2 py-1 text-xs bg-obsidian border border-rim text-parchment placeholder:text-copper/60 rounded focus:outline-none focus:border-coral-shimmer"
                  />

                  <button
                    type="button"
                    onClick={() => removeColumn(idx)}
                    title="Omitir esta columna en el reporte"
                    className="p-1 text-copper hover:text-coral-shimmer rounded transition shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <select
                    value={col.source}
                    onChange={(e) => {
                      const nextSource = e.target.value as ExtractSourceType
                      updateColumn(idx, {
                        source: nextSource,
                        attribute:
                          nextSource === "attribute"
                            ? col.attribute || "href"
                            : undefined
                      })
                    }}
                    className="flex-1 px-2 py-1 text-[11px] bg-obsidian border border-rim text-fog rounded focus:outline-none focus:border-coral-shimmer">
                    <option value="textContent">Texto visible</option>
                    <option value="value">Valor (input / select)</option>
                    <option value="attribute">Atributo HTML (href, src...)</option>
                  </select>

                  {col.source === "attribute" && (
                    <input
                      type="text"
                      value={col.attribute ?? ""}
                      onChange={(e) =>
                        updateColumn(idx, { attribute: e.target.value })
                      }
                      placeholder="href"
                      className="w-24 px-2 py-1 text-[11px] font-mono bg-obsidian border border-rim text-parchment placeholder:text-copper/60 rounded focus:outline-none focus:border-coral-shimmer"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Límite máximo de filas */}
      <div className="pt-2 border-t border-rim/60 flex items-center justify-between gap-2">
        <label className="text-[11px] text-fog">
          Límite máximo de filas (0 = todas):
        </label>
        <input
          type="number"
          min={0}
          value={config.maxRows ?? 0}
          onChange={(e) =>
            onChange({
              ...config,
              maxRows: Math.max(0, Number(e.target.value) || 0)
            })
          }
          className="w-20 px-2 py-1 text-xs font-mono bg-void-black border border-rim text-parchment rounded focus:outline-none focus:border-coral-shimmer"
        />
      </div>

      {/* Paginación automática */}
      <div className="pt-2 border-t border-rim/60 space-y-2">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={Boolean(pagination.enabled)}
            onChange={(e) =>
              onChange({
                ...config,
                pagination: {
                  ...pagination,
                  enabled: e.target.checked
                }
              })
            }
            className="rounded border-rim bg-void-black accent-coral-shimmer"
          />
          <span className="text-xs font-medium text-fog flex items-center gap-1">
            <Link2 className="w-3.5 h-3.5 text-coral-shimmer" />
            Paginación automática (recorrer páginas)
          </span>
        </label>

        {pagination.enabled && (
          <div className="pl-1 space-y-2">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-ash mb-1">
                Selector botón &quot;Siguiente página&quot;
              </label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={pagination.nextButtonSelector}
                  onChange={(e) =>
                    onChange({
                      ...config,
                      pagination: {
                        ...pagination,
                        nextButtonSelector: e.target.value
                      }
                    })
                  }
                  placeholder="Ej: a.next, button[aria-label='Siguiente']"
                  className="flex-1 min-w-0 px-2 py-1 text-xs font-mono bg-void-black border border-rim text-parchment placeholder:text-copper/60 rounded focus:outline-none focus:border-coral-shimmer"
                />
                <button
                  type="button"
                  disabled={isRunning}
                  onClick={onPickPaginationNext}
                  className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 shrink-0 transition disabled:opacity-40 ${
                    isPickingNextButton
                      ? "bg-coral-shimmer text-void-black font-semibold"
                      : "bg-coral-shimmer/15 hover:bg-coral-shimmer/25 text-coral-shimmer border border-coral-shimmer/40"
                  }`}>
                  <Crosshair className="w-3 h-3" />
                  {isPickingNextButton ? "Cancelar" : "Elegir"}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-ash mb-1">
                  Espera tras clic (ms)
                </label>
                <input
                  type="number"
                  min={300}
                  step={100}
                  value={pagination.waitAfterClickMs}
                  onChange={(e) =>
                    onChange({
                      ...config,
                      pagination: {
                        ...pagination,
                        waitAfterClickMs: Math.max(
                          300,
                          Number(e.target.value) || 2000
                        )
                      }
                    })
                  }
                  className="w-full px-2 py-1 text-xs font-mono bg-void-black border border-rim text-parchment rounded focus:outline-none focus:border-coral-shimmer"
                />
              </div>

              <div>
                <label className="block text-[10px] text-ash mb-1">
                  Máximo de páginas
                </label>
                <input
                  type="number"
                  min={1}
                  value={pagination.maxPages}
                  onChange={(e) =>
                    onChange({
                      ...config,
                      pagination: {
                        ...pagination,
                        maxPages: Math.max(1, Number(e.target.value) || 1)
                      }
                    })
                  }
                  className="w-full px-2 py-1 text-xs font-mono bg-void-black border border-rim text-parchment rounded focus:outline-none focus:border-coral-shimmer"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
