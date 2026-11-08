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
      {/* Execution Options (F-08 & F-09) */}
      <ExecutionOptionsCard
        options={currentOptions}
        onChange={setExecutionOptions}
        mode={currentMode}
        disabled={isRunningOrPaused}
      />

      {/* Progress Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-slate-400 text-[11px]">
              {isDomListMode
                ? paginationEnabled
                  ? `Extracción de lista · Página ${currentPage} (máx. ${maxPages})`
                  : "Extracción de lista en página actual"
                : "Progreso de iteración por registros"}
            </div>
            <div className="text-sm font-bold text-white">
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
          <span className="text-sm font-mono font-bold text-indigo-400">
            {progressPercent}%
          </span>
        </div>

        <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
          <div
            style={{ width: `${progressPercent}%` }}
            className={`h-full transition-all duration-300 ${
              isDomListMode ? "bg-pink-500" : "bg-indigo-500"
            }`}
          />
        </div>

        {/* Skipped / Error rows counter badge */}
        {skippedCount > 0 && (
          <div className="flex items-center gap-2 p-2 rounded bg-amber-950/40 border border-amber-500/30 text-amber-200 text-[11px]">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              {skippedCount} fila(s)/ítem(s) con error registrados en el
              reporte.
            </span>
          </div>
        )}

        {/* Error Banner */}
        {executionState?.status === "error" && executionState?.errorMessage && (
          <div className="flex items-start gap-2 p-2.5 rounded bg-rose-950/50 border border-rose-500/40 text-rose-200 text-[11px]">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>{executionState.errorMessage}</div>
          </div>
        )}

        {/* Completed Banner */}
        {executionState?.status === "completed" && (
          <div className="flex items-center gap-2 p-2.5 rounded bg-emerald-950/50 border border-emerald-500/40 text-emerald-200 text-[11px]">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
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
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-white font-semibold shadow transition ${
                  isDomListMode
                    ? "bg-pink-600 hover:bg-pink-500"
                    : "bg-indigo-600 hover:bg-indigo-500"
                }`}>
                <Play className="w-4 h-4" />
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
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold transition">
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
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition">
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
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 font-medium transition">
              <Square className="w-3.5 h-3.5" />
              Detener
            </button>
          )}
        </div>

        {/* CSV Report Download */}
        {validResults.length > 0 && (
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
            <div className="text-[11px] text-slate-400">
              Resultados capturados:{" "}
              <span className="font-semibold text-slate-200">
                {validResults.length} fila(s)
              </span>
            </div>
            <button
              type="button"
              onClick={() => downloadExecutionReportCsv(validResults)}
              className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-medium flex items-center gap-1.5 transition">
              <Download className="w-3.5 h-3.5" />
              Descargar Reporte CSV
            </button>
          </div>
        )}
      </div>

      {/* Execution Logs */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-200">
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
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200">
            <RotateCcw className="w-3 h-3" />
            Limpiar
          </button>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded p-2 h-64 overflow-y-auto font-mono text-[11px] space-y-1">
          {executionState?.logs && executionState.logs.length > 0 ? (
            executionState.logs
              .slice()
              .reverse()
              .map((line, i) => (
                <div
                  key={i}
                  className="text-slate-300 border-b border-slate-900 pb-1">
                  {line}
                </div>
              ))
          ) : (
            <div className="text-slate-600 text-center py-8">
              Aún no hay eventos registrados.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
