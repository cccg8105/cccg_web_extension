import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Download,
  Pause,
  Play,
  RotateCcw,
  Square
} from "lucide-react"
import { useMemo } from "react"
import { useStorage } from "@plasmohq/storage/hook"
import { ExecutionOptionsCard } from "~sidepanel/components/ExecutionOptionsCard"
import { sendOrchestratorCommand } from "~sidepanel/utils/step-helpers"
import { downloadExecutionReportCsv } from "~sidepanel/utils/workflow-io"
import {
  DEFAULT_DOM_LIST_CONFIG,
  DEFAULT_EXECUTION_OPTIONS,
  DEFAULT_EXECUTION_STATE,
  DEFAULT_WORKFLOW_MODE,
  SAMPLE_RECORDS,
  STORAGE_KEYS,
  workflowStorage
} from "~storage/workflow-storage"
import type {
  DataRecord,
  DomListConfig,
  ExecutionOptions,
  ExecutionState,
  WorkflowMode
} from "~types/workflow"

export function RunTab() {
  const [records] = useStorage<DataRecord[]>(
    {
      key: STORAGE_KEYS.RECORDS,
      instance: workflowStorage
    },
    SAMPLE_RECORDS
  )

  const [workflowMode] = useStorage<WorkflowMode>(
    {
      key: STORAGE_KEYS.WORKFLOW_MODE,
      instance: workflowStorage
    },
    DEFAULT_WORKFLOW_MODE
  )

  const [domListConfig] = useStorage<DomListConfig>(
    {
      key: STORAGE_KEYS.DOM_LIST_CONFIG,
      instance: workflowStorage
    },
    DEFAULT_DOM_LIST_CONFIG
  )

  const [executionOptions, setExecutionOptions] = useStorage<ExecutionOptions>(
    {
      key: STORAGE_KEYS.EXECUTION_OPTIONS,
      instance: workflowStorage
    },
    DEFAULT_EXECUTION_OPTIONS
  )

  const [executionState, setExecutionState] = useStorage<ExecutionState>(
    {
      key: STORAGE_KEYS.EXECUTION_STATE,
      instance: workflowStorage
    },
    DEFAULT_EXECUTION_STATE
  )

  const validResults = useMemo(() => {
    return (executionState?.results ?? []).filter(
      (row): row is DataRecord => Boolean(row && typeof row === "object")
    )
  }, [executionState?.results])

  const currentMode = workflowMode ?? DEFAULT_WORKFLOW_MODE
  const isDomListMode = currentMode === "dom_list_extract"
  const currentOptions = executionOptions ?? DEFAULT_EXECUTION_OPTIONS
  const isRunningOrPaused =
    executionState?.status === "running" || executionState?.status === "paused"

  const rawTotalRecords = isDomListMode
    ? executionState?.totalItemsInCurrentPage ??
      executionState?.detectedListCount ??
      0
    : records?.length ?? 0

  const startRow = Math.max(1, Number(currentOptions.startRow || 1))
  const effectiveEndRow =
    currentOptions.endRow && currentOptions.endRow > 0
      ? rawTotalRecords > 0
        ? Math.min(rawTotalRecords, Number(currentOptions.endRow))
        : Number(currentOptions.endRow)
      : rawTotalRecords

  const totalInRange =
    effectiveEndRow >= startRow ? effectiveEndRow - startRow + 1 : 0

  const currentRecordNumber = Math.min(
    (executionState?.currentRecordIndex ?? startRow - 1) + 1,
    Math.max(effectiveEndRow, 1)
  )

  const completedInRange = Math.max(
    0,
    (executionState?.currentRecordIndex ?? startRow - 1) - (startRow - 1)
  )

  const progressPercent =
    totalInRange > 0
      ? Math.min(
          100,
          Math.round(
            ((executionState?.status === "completed"
              ? totalInRange
              : completedInRange) /
              totalInRange) *
              100
          )
        )
      : executionState?.status === "completed"
        ? 100
        : 0

  const currentPage = executionState?.currentPage ?? 1
  const paginationEnabled = Boolean(domListConfig?.pagination?.enabled)
  const maxPages = domListConfig?.pagination?.maxPages ?? 5
  const skippedCount = executionState?.skippedOrErrorCount ?? 0

  return (
    <div className="space-y-3">
      {/* Execution Options */}
      <ExecutionOptionsCard
        options={currentOptions}
        onChange={setExecutionOptions}
        mode={currentMode}
        disabled={isRunningOrPaused}
      />

      {/* Progress Card */}
      <div className="bg-ember border border-rim rounded-lg p-3 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-ash text-[11px]">
              {isDomListMode
                ? paginationEnabled
                  ? `Extracción de lista · Página ${currentPage} (máx. ${maxPages})`
                  : "Extracción de lista en página actual"
                : "Progreso de iteración por registros"}
            </div>
            <div className="text-sm font-medium text-parchment">
              {isDomListMode
                ? executionState?.status === "completed"
                  ? `${validResults.length} elemento(s) procesados en total`
                  : rawTotalRecords > 0
                    ? `Elemento #${currentRecordNumber} de ${effectiveEndRow} (Total: ${validResults.length})`
                    : "Listo para inspeccionar y extraer lista"
                : executionState?.status === "completed"
                  ? `${validResults.length} registro(s) procesados en rango`
                  : `Registro #${currentRecordNumber} de ${effectiveEndRow}`}
            </div>
          </div>
          <span className="text-sm font-mono font-bold text-coral-shimmer">
            {progressPercent}%
          </span>
        </div>

        <div className="w-full h-2 bg-void-black rounded-full overflow-hidden border border-rim">
          <div
            style={{ width: `${progressPercent}%` }}
            className="h-full bg-coral-shimmer shadow-[0_0_8px_rgba(232,118,80,0.5)] transition-all duration-300"
          />
        </div>

        {/* Skipped / Error rows counter badge */}
        {skippedCount > 0 && (
          <div className="flex items-center gap-2 p-2 rounded bg-amber-950/30 border border-amber-600/30 text-amber-200 text-[11px]">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              {skippedCount} fila(s)/ítem(s) con error registrados en el
              reporte.
            </span>
          </div>
        )}

        {/* Error Banner */}
        {executionState?.status === "error" && executionState?.errorMessage && (
          <div className="flex items-start gap-2 p-2.5 rounded bg-rose-950/40 border border-rose-600/40 text-rose-300 text-[11px]">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>{executionState.errorMessage}</div>
          </div>
        )}

        {/* Completed Banner */}
        {executionState?.status === "completed" && (
          <div className="flex items-center gap-2 p-2.5 rounded bg-forest-moss border border-forest-deep text-fog text-[11px]">
            <CheckCircle2 className="w-4 h-4 text-coral-shimmer shrink-0" />
            <span>
              {isDomListMode
                ? `Extracción finalizada (${validResults.length} fila(s) en reporte${skippedCount > 0 ? `, ${skippedCount} con error` : ""}).`
                : `Iteración finalizada (${validResults.length} fila(s) en reporte${skippedCount > 0 ? `, ${skippedCount} con error` : ""}).`}
            </span>
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex gap-2 pt-1">
          {executionState?.status !== "running" &&
            executionState?.status !== "paused" && (
              <button
                type="button"
                onClick={() =>
                  sendOrchestratorCommand({ type: "START_WORKFLOW" })
                }
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-parchment hover:bg-fog text-void-black font-semibold shadow-sm transition">
                <Play className="w-4 h-4 fill-void-black" />
                {isDomListMode
                  ? "Iniciar Extracción de Lista"
                  : `Iniciar Iteración (${totalInRange})`}
              </button>
            )}

          {executionState?.status === "running" && (
            <button
              type="button"
              onClick={() =>
                sendOrchestratorCommand({ type: "PAUSE_WORKFLOW" })
              }
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-amber-950/40 hover:bg-amber-950/60 text-amber-300 border border-amber-600/40 font-medium transition">
              <Pause className="w-4 h-4" />
              Pausar
            </button>
          )}

          {executionState?.status === "paused" && (
            <button
              type="button"
              onClick={() =>
                sendOrchestratorCommand({ type: "RESUME_WORKFLOW" })
              }
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-forest-deep/60 hover:bg-forest-deep text-parchment border border-forest-deep font-medium transition">
              <Play className="w-4 h-4" />
              Reanudar
            </button>
          )}

          {(executionState?.status === "running" ||
            executionState?.status === "paused" ||
            executionState?.status === "error") && (
            <button
              type="button"
              onClick={() =>
                sendOrchestratorCommand({ type: "STOP_WORKFLOW" })
              }
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-rose-950/40 hover:bg-rose-950/60 text-rose-300 border border-rose-600/40 font-medium transition">
              <Square className="w-3.5 h-3.5" />
              Detener
            </button>
          )}
        </div>

        {/* CSV Report Download */}
        {validResults.length > 0 && (
          <div className="pt-2 border-t border-rim flex items-center justify-between gap-2">
            <div className="text-[11px] text-ash">
              Resultados capturados:{" "}
              <span className="font-semibold text-parchment">
                {validResults.length} fila(s)
              </span>
            </div>
            <button
              type="button"
              onClick={() => downloadExecutionReportCsv(validResults)}
              className="px-3 py-1.5 rounded-lg bg-forest-moss hover:bg-forest-deep text-parchment border border-forest-deep font-medium flex items-center gap-1.5 transition">
              <Download className="w-3.5 h-3.5 text-coral-shimmer" />
              Descargar Reporte CSV
            </button>
          </div>
        )}
      </div>

      {/* Execution Logs */}
      <div className="bg-ember border border-rim rounded-lg p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-parchment">
            Bitácora de ejecución
          </span>
          <button
            type="button"
            onClick={() =>
              setExecutionState({
                ...(executionState ?? DEFAULT_EXECUTION_STATE),
                logs: []
              })
            }
            className="flex items-center gap-1 text-[11px] text-ash hover:text-parchment transition">
            <RotateCcw className="w-3 h-3" />
            Limpiar
          </button>
        </div>

        <div className="bg-void-black border border-rim rounded p-2 h-64 overflow-y-auto font-mono text-[11px] space-y-1">
          {executionState?.logs && executionState.logs.length > 0 ? (
            executionState.logs
              .slice()
              .reverse()
              .map((line, i) => (
                <div
                  key={i}
                  className="text-ash border-b border-rim/40 pb-1">
                  {line}
                </div>
              ))
          ) : (
            <div className="text-ash/50 text-center py-8">
              Aún no hay eventos registrados.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
