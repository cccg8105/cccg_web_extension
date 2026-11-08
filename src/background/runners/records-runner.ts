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
  sendMessageToTabWithRetry
} from "~background/tab-messenger"
import {
  DEFAULT_EXECUTION_OPTIONS,
  STORAGE_KEYS,
  workflowStorage
} from "~storage/workflow-storage"
import type {
  DataRecord,
  ExecuteStepPayload,
  ExecuteStepResponse,
  ExecutionOptions,
  WorkflowStep
} from "~types/workflow"

export interface ExecutionLoopContext {
  isRunning: () => boolean
  getTargetTabId: () => number | undefined
  setTargetTabId: (tabId: number) => void
}

export async function runRecordsIteration(
  ctx: ExecutionLoopContext
): Promise<void> {
  while (ctx.isRunning()) {
    const state = await getExecutionState()

    if (state.status !== "running") {
      break
    }

    const records =
      (await workflowStorage.get<DataRecord[]>(STORAGE_KEYS.RECORDS)) ?? []
    const steps =
      (await workflowStorage.get<WorkflowStep[]>(STORAGE_KEYS.STEPS)) ?? []
    const execOptions =
      (await workflowStorage.get<ExecutionOptions>(
        STORAGE_KEYS.EXECUTION_OPTIONS
      )) ?? DEFAULT_EXECUTION_OPTIONS

    if (records.length === 0) {
      await updateExecutionState((prev) => ({
        ...prev,
        status: "error",
        errorMessage: "No hay registros cargados para iterar.",
        logs: appendLogEntry(prev.logs, "Error: Lista de registros vacía.")
      }))
      break
    }

    if (steps.length === 0) {
      await updateExecutionState((prev) => ({
        ...prev,
        status: "error",
        errorMessage: "No hay pasos configurados en la secuencia.",
        logs: appendLogEntry(prev.logs, "Error: No hay pasos configurados.")
      }))
      break
    }

    const startRow = Math.max(1, Number(execOptions.startRow || 1))
    const endRow =
      execOptions.endRow && execOptions.endRow > 0
        ? Math.min(records.length, Number(execOptions.endRow))
        : records.length

    if (startRow > records.length) {
      await updateExecutionState((prev) => ({
        ...prev,
        status: "error",
        errorMessage: `La fila inicial (#${startRow}) supera el total de registros cargados (${records.length}).`,
        logs: appendLogEntry(
          prev.logs,
          `Error: Fila inicial #${startRow} fuera de rango (total: ${records.length}).`
        )
      }))
      break
    }

    if (execOptions.endRow && execOptions.endRow > 0 && startRow > endRow) {
      await updateExecutionState((prev) => ({
        ...prev,
        status: "error",
        errorMessage: `Rango inválido: la fila inicial (#${startRow}) no puede ser mayor que la fila final (#${endRow}).`,
        logs: appendLogEntry(
          prev.logs,
          `Error: Rango inválido (#${startRow} a #${endRow}).`
        )
      }))
      break
    }

    const { currentRecordIndex, currentStepIndex } = state

    if (currentRecordIndex >= endRow) {
      const skipped = state.skippedOrErrorCount ?? 0
      const processedCount = Math.max(0, endRow - (startRow - 1))
      const summarySuffix =
        skipped > 0 ? ` (${skipped} fila(s) saltadas con error)` : ""

      await updateExecutionState((prev) => ({
        ...prev,
        status: "completed",
        logs: appendLogEntry(
          prev.logs,
          `Proceso finalizado (${processedCount} registro(s) en rango evaluados)${summarySuffix}.`
        )
      }))
      break
    }

    const currentRecord = records[currentRecordIndex]
    const currentStep = steps[currentStepIndex]

    if (!currentStep) {
      await updateExecutionState((prev) => ({
        ...prev,
        currentRecordIndex: prev.currentRecordIndex + 1,
        currentStepIndex: 0
      }))
      continue
    }

    const activeTabId = await getActiveTabId(ctx.getTargetTabId())
    ctx.setTargetTabId(activeTabId)

    const stepResponse = await sendMessageToTabWithRetry<
      ExecuteStepPayload,
      ExecuteStepResponse
    >(activeTabId, {
      type: "EXECUTE_STEP",
      step: currentStep,
      record: currentRecord,
      recordIndex: currentRecordIndex,
      stepIndex: currentStepIndex
    })

    const latestState = await getExecutionState()
    if (latestState.status !== "running") {
      break
    }

    const rowSlotIndex = (latestState.results ?? []).findIndex(
      (r) => r._row === String(currentRecordIndex + 1)
    )
    const targetResultIndex =
      rowSlotIndex >= 0 ? rowSlotIndex : (latestState.results ?? []).length
    const recordWithMeta: DataRecord = {
      _row: String(currentRecordIndex + 1),
      ...currentRecord
    }

    if (!stepResponse.ok) {
      if (execOptions.onError === "skip") {
        await updateExecutionState((prev) => ({
          ...prev,
          currentRecordIndex: currentRecordIndex + 1,
          currentStepIndex: 0,
          skippedOrErrorCount: (prev.skippedOrErrorCount ?? 0) + 1,
          results: applyStepErrorToResults(
            prev.results,
            targetResultIndex,
            recordWithMeta,
            stepResponse.message
          ),
          logs: appendLogEntry(
            prev.logs,
            `Advertencia en Reg #${currentRecordIndex + 1} (${currentStep.label}): ${stepResponse.message} -> Saltando al siguiente registro.`
          )
        }))
        await delay(250)
        continue
      }

      await updateExecutionState((prev) => ({
        ...prev,
        status: "error",
        errorMessage: stepResponse.message,
        skippedOrErrorCount: (prev.skippedOrErrorCount ?? 0) + 1,
        results: applyStepErrorToResults(
          prev.results,
          targetResultIndex,
          recordWithMeta,
          stepResponse.message
        ),
        logs: appendLogEntry(
          prev.logs,
          `Error en Registro #${currentRecordIndex + 1} (${currentStep.label}): ${stepResponse.message}`
        )
      }))
      break
    }

    const isLastStepInRecord = currentStepIndex + 1 >= steps.length
    const nextRecordIndex = isLastStepInRecord
      ? currentRecordIndex + 1
      : currentRecordIndex
    const nextStepIndex = isLastStepInRecord ? 0 : currentStepIndex + 1

    await updateExecutionState((prev) => ({
      ...prev,
      currentRecordIndex: nextRecordIndex,
      currentStepIndex: nextStepIndex,
      results: applyStepSuccessToResults(
        prev.results,
        targetResultIndex,
        recordWithMeta,
        currentStep,
        stepResponse,
        isLastStepInRecord
      ),
      logs: appendLogEntry(
        prev.logs,
        `Reg #${currentRecordIndex + 1}/${endRow} - ${currentStep.label}: ${stepResponse.message}`
      )
    }))

    await delay(250)
  }
}
