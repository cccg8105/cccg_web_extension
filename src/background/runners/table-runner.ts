import type { ExecutionLoopContext } from "~background/runners/records-runner"
import {
  appendLogEntry,
  getExecutionState,
  updateExecutionState
} from "~background/state-manager"
import {
  delay,
  getActiveTabId,
  sendMessageToTabWithRetry,
  waitForTabComplete
} from "~background/tab-messenger"
import {
  DEFAULT_EXECUTION_OPTIONS,
  DEFAULT_TABLE_EXTRACT_CONFIG,
  STORAGE_KEYS,
  workflowStorage
} from "~storage/workflow-storage"
import type {
  ClickNextPagePayload,
  ClickNextPageResponse,
  DataRecord,
  ExecutionOptions,
  ExtractTableRowPayload,
  ExtractTableRowResponse,
  InspectTablePagePayload,
  InspectTablePageResponse,
  TableExtractColumnConfig,
  TableExtractConfig
} from "~types/workflow"

function resolveColumnsForExtraction(
  configuredColumns: TableExtractColumnConfig[],
  detectedHeaders: string[]
): TableExtractColumnConfig[] {
  if (configuredColumns.length > 0) {
    return configuredColumns
  }

  return detectedHeaders.map((headerName, index) => ({
    index,
    name: headerName,
    source: "textContent"
  }))
}

export async function runHtmlTableExtraction(
  ctx: ExecutionLoopContext
): Promise<void> {
  const rawConfig = await workflowStorage.get<TableExtractConfig>(
    STORAGE_KEYS.TABLE_EXTRACT_CONFIG
  )
  const config: TableExtractConfig = {
    ...DEFAULT_TABLE_EXTRACT_CONFIG,
    ...(rawConfig ?? {})
  }

  const tableSelector = config.tableSelector?.trim() ?? ""
  if (!tableSelector) {
    await updateExecutionState((prev) => ({
      ...prev,
      status: "error",
      errorMessage: "Falta configurar el selector CSS de la tabla HTML.",
      logs: appendLogEntry(
        prev.logs,
        "Error: no se ha seleccionado ninguna tabla HTML."
      )
    }))
    return
  }

  const options =
    (await workflowStorage.get<ExecutionOptions>(
      STORAGE_KEYS.EXECUTION_OPTIONS
    )) ?? DEFAULT_EXECUTION_OPTIONS

  const headerRowIndex = Math.max(1, Math.floor(config.headerRowIndex || 1))
  const paginationEnabled = Boolean(
    config.pagination?.enabled &&
      config.pagination?.nextButtonSelector?.trim()
  )
  const maxPages = paginationEnabled
    ? Math.max(1, config.pagination?.maxPages ?? 5)
    : 1
  const waitAfterClickMs = Math.max(
    300,
    config.pagination?.waitAfterClickMs ?? 2000
  )
  const rowDelayMs = 150
  const onError = options.onError ?? "stop"
  const maxRowsLimit =
    config.maxRows && config.maxRows > 0 ? config.maxRows : Infinity
  const startRowOffset =
    options.startRow && options.startRow > 0 ? options.startRow - 1 : 0
  const endRowLimit =
    options.endRow && options.endRow > 0 ? options.endRow : Infinity

  const tabId = await getActiveTabId(ctx.getTargetTabId())
  ctx.setTargetTabId(tabId)

  let activeColumns: TableExtractColumnConfig[] = config.columns ?? []
  let currentPage = 1
  let totalProcessedRows = 0
  let extractedCount = 0
  let reachedLimit = false

  while (ctx.isRunning() && currentPage <= maxPages && !reachedLimit) {
    const liveState = await getExecutionState()
    if (liveState.status !== "running") {
      return
    }

    const inspectRes = await sendMessageToTabWithRetry<
      InspectTablePagePayload,
      InspectTablePageResponse
    >(tabId, {
      type: "INSPECT_TABLE_PAGE",
      tableSelector,
      headerRowIndex
    })

    if (!inspectRes.ok) {
      await updateExecutionState((prev) => ({
        ...prev,
        status: "error",
        errorMessage: inspectRes.message,
        logs: appendLogEntry(
          prev.logs,
          `Error inspeccionando tabla en pág. ${currentPage}: ${inspectRes.message}`
        )
      }))
      return
    }

    activeColumns = resolveColumnsForExtraction(
      activeColumns,
      inspectRes.headers
    )

    if (activeColumns.length === 0) {
      await updateExecutionState((prev) => ({
        ...prev,
        status: "error",
        errorMessage:
          "No se detectaron columnas en la fila de cabecera seleccionada.",
        logs: appendLogEntry(
          prev.logs,
          `Error: la fila #${headerRowIndex} no contiene celdas de cabecera.`
        )
      }))
      return
    }

    if (config.columns.length === 0) {
      await workflowStorage.set(STORAGE_KEYS.TABLE_EXTRACT_CONFIG, {
        ...config,
        columns: activeColumns
      } satisfies TableExtractConfig)
    }

    const pageDataRows = inspectRes.dataRowCount
    const prevSignature = inspectRes.pageSignature

    await updateExecutionState((prev) => ({
      ...prev,
      currentPage,
      totalItemsInCurrentPage: pageDataRows,
      detectedTableRowCount: pageDataRows,
      detectedTableColumnCount: activeColumns.length,
      totalRecords:
        Number.isFinite(maxRowsLimit)
          ? Math.min(maxRowsLimit, pageDataRows)
          : pageDataRows,
      logs: appendLogEntry(
        prev.logs,
        `Pág. ${currentPage}: cabecera fila #${headerRowIndex} (${activeColumns.length} cols) · ${pageDataRows} filas de datos.`
      )
    }))

    for (let dataRowIndex = 0; dataRowIndex < pageDataRows; dataRowIndex++) {
      if (!ctx.isRunning()) {
        return
      }

      const rowState = await getExecutionState()
      if (rowState.status !== "running") {
        return
      }

      const globalRowNumber = totalProcessedRows + 1
      totalProcessedRows++

      if (totalProcessedRows <= startRowOffset) {
        continue
      }

      if (globalRowNumber > endRowLimit || extractedCount >= maxRowsLimit) {
        reachedLimit = true
        break
      }

      const extractRes = await sendMessageToTabWithRetry<
        ExtractTableRowPayload,
        ExtractTableRowResponse
      >(tabId, {
        type: "EXTRACT_TABLE_ROW",
        tableSelector,
        headerRowIndex,
        dataRowIndex,
        columns: activeColumns
      })

      if (!extractRes.ok) {
        const errorRecord: DataRecord = {
          _status: "error",
          _error: extractRes.message
        }

        if (onError === "skip") {
          await updateExecutionState((prev) => ({
            ...prev,
            currentRecordIndex: extractedCount,
            skippedOrErrorCount: (prev.skippedOrErrorCount ?? 0) + 1,
            results: [...(prev.results ?? []), errorRecord],
            logs: appendLogEntry(
              prev.logs,
              `Fila #${globalRowNumber} omitida por error: ${extractRes.message}`
            )
          }))
          extractedCount++
          await delay(rowDelayMs)
          continue
        }

        await updateExecutionState((prev) => ({
          ...prev,
          status: "error",
          errorMessage: extractRes.message,
          results: [...(prev.results ?? []), errorRecord],
          logs: appendLogEntry(
            prev.logs,
            `Error fatal en fila #${globalRowNumber}: ${extractRes.message}`
          )
        }))
        return
      }

      const successRecord: DataRecord = {
        ...(extractRes.rowData ?? {}),
        _status: "ok",
        _error: ""
      }

      extractedCount++

      await updateExecutionState((prev) => ({
        ...prev,
        currentRecordIndex: extractedCount - 1,
        results: [...(prev.results ?? []), successRecord],
        logs: appendLogEntry(
          prev.logs,
          `Pág. ${currentPage} · Fila #${dataRowIndex + 1} extraída (total: ${extractedCount}).`
        )
      }))

      if (extractedCount >= maxRowsLimit || globalRowNumber >= endRowLimit) {
        reachedLimit = true
        break
      }

      await delay(rowDelayMs)
    }

    if (reachedLimit || !paginationEnabled || currentPage >= maxPages) {
      break
    }

    const nextSelector = config.pagination?.nextButtonSelector?.trim() ?? ""
    const clickRes = await sendMessageToTabWithRetry<
      ClickNextPagePayload,
      ClickNextPageResponse
    >(tabId, {
      type: "CLICK_NEXT_PAGE",
      nextButtonSelector: nextSelector
    })

    if (!clickRes.ok || !clickRes.hasNextPage) {
      await updateExecutionState((prev) => ({
        ...prev,
        logs: appendLogEntry(prev.logs, clickRes.message)
      }))
      break
    }

    await updateExecutionState((prev) => ({
      ...prev,
      logs: appendLogEntry(
        prev.logs,
        `Paginación tabla: ${clickRes.message} Esperando ${waitAfterClickMs}ms...`
      )
    }))

    await waitForTabComplete(tabId)
    await delay(waitAfterClickMs)

    if (!ctx.isRunning()) {
      return
    }

    const postClickInspect = await sendMessageToTabWithRetry<
      InspectTablePagePayload,
      InspectTablePageResponse
    >(tabId, {
      type: "INSPECT_TABLE_PAGE",
      tableSelector,
      headerRowIndex
    })

    if (
      postClickInspect.ok &&
      postClickInspect.pageSignature === prevSignature
    ) {
      await updateExecutionState((prev) => ({
        ...prev,
        logs: appendLogEntry(
          prev.logs,
          "La tabla no cambió tras avanzar página; finalizando paginación."
        )
      }))
      break
    }

    currentPage++
  }

  const finalState = await getExecutionState()
  if (!ctx.isRunning() || finalState.status !== "running") {
    return
  }

  await updateExecutionState((prev) => ({
    ...prev,
    status: "completed",
    logs: appendLogEntry(
      prev.logs,
      `Extracción de tabla completada: ${extractedCount} filas procesadas en ${currentPage} página(s).`
    )
  }))
}
