import type { ExecutionLoopContext } from "~background/runners/records-runner"
import {
  appendLogEntry,
  applyStepErrorToResults,
  applyStepSuccessToResults,
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
  DEFAULT_DOM_LIST_CONFIG,
  DEFAULT_EXECUTION_OPTIONS,
  STORAGE_KEYS,
  workflowStorage
} from "~storage/workflow-storage"
import type {
  ClickNextPagePayload,
  ClickNextPageResponse,
  DataRecord,
  DomListConfig,
  ExecuteStepPayload,
  ExecuteStepResponse,
  ExecutionOptions,
  InspectListPagePayload,
  InspectListPageResponse,
  WorkflowStep
} from "~types/workflow"

function resolveCurrentGlobalRowIndex(results: DataRecord[] | undefined): number {
  if (!results || results.length === 0) {
    return 0
  }
  const lastRow = results[results.length - 1]
  if (lastRow && lastRow._status === "running") {
    return results.length - 1
  }
  return results.length
}

export async function runDomListExtraction(
  ctx: ExecutionLoopContext
): Promise<void> {
  let currentPageSignature = ""

  while (ctx.isRunning()) {
    const state = await getExecutionState()
    if (state.status !== "running") {
      break
    }

    const domListConfig =
      (await workflowStorage.get<DomListConfig>(
        STORAGE_KEYS.DOM_LIST_CONFIG
      )) ?? DEFAULT_DOM_LIST_CONFIG
    const execOptions =
      (await workflowStorage.get<ExecutionOptions>(
        STORAGE_KEYS.EXECUTION_OPTIONS
      )) ?? DEFAULT_EXECUTION_OPTIONS
    const steps =
      (await workflowStorage.get<WorkflowStep[]>(STORAGE_KEYS.STEPS)) ?? []

    const itemSelector = domListConfig.itemSelector?.trim() ?? ""
    if (!itemSelector) {
      await updateExecutionState((prev) => ({
        ...prev,
        status: "error",
        errorMessage:
          "No se ha configurado el selector CSS del elemento repetitivo de la lista.",
        logs: appendLogEntry(
          prev.logs,
          "Error: Falta configurar el selector del contenedor repetitivo."
        )
      }))
      break
    }

    if (steps.length === 0) {
      await updateExecutionState((prev) => ({
        ...prev,
        status: "error",
        errorMessage: "No hay pasos configurados para extraer de la lista.",
        logs: appendLogEntry(prev.logs, "Error: No hay pasos configurados.")
      }))
      break
    }

    const activeTabId = await getActiveTabId(ctx.getTargetTabId())
    ctx.setTargetTabId(activeTabId)

    const currentPage = state.currentPage ?? 1
    const { currentRecordIndex, currentStepIndex } = state

    let itemsOnPage = state.totalItemsInCurrentPage
    if (itemsOnPage === undefined) {
      const inspectRes = await sendMessageToTabWithRetry<
        InspectListPagePayload,
        InspectListPageResponse
      >(activeTabId, {
        type: "INSPECT_LIST_PAGE",
        itemSelector
      })

      if (!inspectRes.ok) {
        await updateExecutionState((prev) => ({
          ...prev,
          status: "error",
          errorMessage: inspectRes.message,
          logs: appendLogEntry(prev.logs, `Error: ${inspectRes.message}`)
        }))
        break
      }

      if (inspectRes.count === 0) {
        if (currentPage === 1) {
          await updateExecutionState((prev) => ({
            ...prev,
            status: "error",
            errorMessage: `No se encontraron elementos en la página con el selector "${itemSelector}".`,
            logs: appendLogEntry(
              prev.logs,
              `Error: 0 elementos encontrados para "${itemSelector}".`
            )
          }))
        } else {
          await updateExecutionState((prev) => ({
            ...prev,
            status: "completed",
            logs: appendLogEntry(
              prev.logs,
              `Página ${currentPage} sin elementos. Extracción finalizada.`
            )
          }))
        }
        break
      }

      itemsOnPage = inspectRes.count
      currentPageSignature = inspectRes.pageSignature

      await updateExecutionState((prev) => ({
        ...prev,
        currentPage,
        totalItemsInCurrentPage: inspectRes.count,
        detectedListCount: inspectRes.count
      }))
    }

    const startRow = Math.max(1, Number(execOptions.startRow || 1))
    const endRow =
      execOptions.endRow && execOptions.endRow > 0
        ? Number(execOptions.endRow)
        : 0

    if (endRow > 0 && startRow > endRow) {
      await updateExecutionState((prev) => ({
        ...prev,
        status: "error",
        errorMessage: `Rango inválido: el ítem inicial (#${startRow}) no puede ser mayor que el ítem final (#${endRow}).`,
        logs: appendLogEntry(
          prev.logs,
          `Error: Rango inválido (#${startRow} a #${endRow}).`
        )
      }))
      break
    }

    const finishedRowsCount = (state.results ?? []).filter(
      (r) => r._status === "ok" || r._status === "error"
    ).length

    const maxItemsFromListConfig =
      domListConfig.maxItems && domListConfig.maxItems > 0
        ? domListConfig.maxItems
        : 0
    const maxItemsFromRange =
      endRow > 0 ? Math.max(1, endRow - startRow + 1) : 0
    const effectiveMaxItems =
      maxItemsFromListConfig > 0 && maxItemsFromRange > 0
        ? Math.min(maxItemsFromListConfig, maxItemsFromRange)
        : maxItemsFromListConfig || maxItemsFromRange

    if (effectiveMaxItems > 0 && finishedRowsCount >= effectiveMaxItems) {
      const skipped = state.skippedOrErrorCount ?? 0
      const summarySuffix =
        skipped > 0 ? ` (${skipped} ítem(s) con error saltados)` : ""
      await updateExecutionState((prev) => ({
        ...prev,
        status: "completed",
        logs: appendLogEntry(
          prev.logs,
          `Extracción completada: se procesaron ${finishedRowsCount} elemento(s) configurados${summarySuffix}.`
        )
      }))
      break
    }

    if (currentRecordIndex >= itemsOnPage) {
      const pagination = domListConfig.pagination
      const maxPages = Math.max(1, Number(pagination?.maxPages ?? 5))
      const skipped = state.skippedOrErrorCount ?? 0
      const summarySuffix =
        skipped > 0 ? `, ${skipped} con error saltados` : ""

      if (!pagination?.enabled || !pagination.nextButtonSelector?.trim()) {
        await updateExecutionState((prev) => ({
          ...prev,
          status: "completed",
          logs: appendLogEntry(
            prev.logs,
            `Extracción finalizada (${finishedRowsCount} elementos procesados${summarySuffix}).`
          )
        }))
        break
      }

      if (currentPage >= maxPages) {
        await updateExecutionState((prev) => ({
          ...prev,
          status: "completed",
          logs: appendLogEntry(
            prev.logs,
            `Se alcanzó el máximo de ${maxPages} página(s) (${finishedRowsCount} elementos procesados${summarySuffix}).`
          )
        }))
        break
      }

      if (!currentPageSignature) {
        const preInspect = await sendMessageToTabWithRetry<
          InspectListPagePayload,
          InspectListPageResponse
        >(activeTabId, {
          type: "INSPECT_LIST_PAGE",
          itemSelector
        })
        if (preInspect.ok) {
          currentPageSignature = preInspect.pageSignature
        }
      }

      const nextRes = await sendMessageToTabWithRetry<
        ClickNextPagePayload,
        ClickNextPageResponse
      >(activeTabId, {
        type: "CLICK_NEXT_PAGE",
        nextButtonSelector: pagination.nextButtonSelector.trim()
      })

      if (!nextRes.ok) {
        await updateExecutionState((prev) => ({
          ...prev,
          status: "error",
          errorMessage: nextRes.message,
          logs: appendLogEntry(
            prev.logs,
            `Error en paginación: ${nextRes.message}`
          )
        }))
        break
      }

      if (!nextRes.hasNextPage) {
        await updateExecutionState((prev) => ({
          ...prev,
          status: "completed",
          logs: appendLogEntry(
            prev.logs,
            `${nextRes.message} (${finishedRowsCount} elementos procesados en ${currentPage} página(s)${summarySuffix}).`
          )
        }))
        break
      }

      const waitAfterClickMs = Math.max(
        300,
        Number(pagination.waitAfterClickMs ?? 2000)
      )

      await updateExecutionState((prev) => ({
        ...prev,
        logs: appendLogEntry(
          prev.logs,
          `Avanzando a página ${currentPage + 1}/${maxPages} (esperando ${waitAfterClickMs}ms)...`
        )
      }))

      await waitForTabComplete(activeTabId)
      await delay(waitAfterClickMs)

      const postWaitState = await getExecutionState()
      if (postWaitState.status !== "running") {
        break
      }

      const nextInspect = await sendMessageToTabWithRetry<
        InspectListPagePayload,
        InspectListPageResponse
      >(activeTabId, {
        type: "INSPECT_LIST_PAGE",
        itemSelector
      })

      if (!nextInspect.ok || nextInspect.count === 0) {
        await updateExecutionState((prev) => ({
          ...prev,
          status: "completed",
          logs: appendLogEntry(
            prev.logs,
            `Fin de paginación: no se detectaron elementos en la página ${currentPage + 1}.`
          )
        }))
        break
      }

      if (
        currentPageSignature &&
        nextInspect.pageSignature === currentPageSignature
      ) {
        await updateExecutionState((prev) => ({
          ...prev,
          status: "completed",
          logs: appendLogEntry(
            prev.logs,
            `Fin de paginación: el listado no cambió tras pulsar Siguiente (${finishedRowsCount} elementos procesados${summarySuffix}).`
          )
        }))
        break
      }

      currentPageSignature = nextInspect.pageSignature

      await updateExecutionState((prev) => ({
        ...prev,
        currentPage: currentPage + 1,
        currentRecordIndex: 0,
        currentStepIndex: 0,
        totalItemsInCurrentPage: nextInspect.count,
        detectedListCount: nextInspect.count,
        logs: appendLogEntry(
          prev.logs,
          `Página ${currentPage + 1} cargada (${nextInspect.count} elementos detectados).`
        )
      }))
      continue
    }

    const currentStep = steps[currentStepIndex]
    if (!currentStep) {
      await updateExecutionState((prev) => ({
        ...prev,
        currentRecordIndex: prev.currentRecordIndex + 1,
        currentStepIndex: 0
      }))
      continue
    }

    const syntheticRecord: DataRecord = {
      _pagina: String(currentPage),
      _item: String(currentRecordIndex + 1)
    }

    const stepResponse = await sendMessageToTabWithRetry<
      ExecuteStepPayload,
      ExecuteStepResponse
    >(activeTabId, {
      type: "EXECUTE_STEP",
      step: currentStep,
      record: syntheticRecord,
      recordIndex: currentRecordIndex,
      stepIndex: currentStepIndex,
      listItemSelector: itemSelector
    })

    const latestState = await getExecutionState()
    if (latestState.status !== "running") {
      break
    }

    const globalRowIndex = resolveCurrentGlobalRowIndex(latestState.results)

    if (!stepResponse.ok) {
      if (execOptions.onError === "skip") {
        await updateExecutionState((prev) => ({
          ...prev,
          currentRecordIndex: currentRecordIndex + 1,
          currentStepIndex: 0,
          skippedOrErrorCount: (prev.skippedOrErrorCount ?? 0) + 1,
          results: applyStepErrorToResults(
            prev.results,
            globalRowIndex,
            syntheticRecord,
            stepResponse.message
          ),
          logs: appendLogEntry(
            prev.logs,
            `Advertencia en Pág ${currentPage} Ítem #${currentRecordIndex + 1} (${currentStep.label}): ${stepResponse.message} -> Saltando al siguiente ítem.`
          )
        }))
        await delay(200)
        continue
      }

      await updateExecutionState((prev) => ({
        ...prev,
        status: "error",
        errorMessage: stepResponse.message,
        skippedOrErrorCount: (prev.skippedOrErrorCount ?? 0) + 1,
        results: applyStepErrorToResults(
          prev.results,
          globalRowIndex,
          syntheticRecord,
          stepResponse.message
        ),
        logs: appendLogEntry(
          prev.logs,
          `Error en Pág ${currentPage} Ítem #${currentRecordIndex + 1} (${currentStep.label}): ${stepResponse.message}`
        )
      }))
      break
    }

    const isLastStepInItem = currentStepIndex + 1 >= steps.length
    const nextItemIndex = isLastStepInItem
      ? currentRecordIndex + 1
      : currentRecordIndex
    const nextStepIndex = isLastStepInItem ? 0 : currentStepIndex + 1

    await updateExecutionState((prev) => ({
      ...prev,
      currentRecordIndex: nextItemIndex,
      currentStepIndex: nextStepIndex,
      results: applyStepSuccessToResults(
        prev.results,
        globalRowIndex,
        syntheticRecord,
        currentStep,
        stepResponse,
        isLastStepInItem
      ),
      logs: appendLogEntry(
        prev.logs,
        `Pág ${currentPage} Ítem #${currentRecordIndex + 1}/${itemsOnPage} - ${currentStep.label}: ${stepResponse.message}`
      )
    }))

    await delay(200)
  }
}
