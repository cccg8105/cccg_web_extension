import { runDomListExtraction } from "~background/runners/dom-list-runner"
import {
  type ExecutionLoopContext,
  runRecordsIteration
} from "~background/runners/records-runner"
import { appendLogEntry, updateExecutionState } from "~background/state-manager"
import {
  DEFAULT_EXECUTION_OPTIONS,
  DEFAULT_WORKFLOW_MODE,
  STORAGE_KEYS,
  workflowStorage
} from "~storage/workflow-storage"
import type { ExecutionOptions, WorkflowMode } from "~types/workflow"

let isLoopRunning = false
let targetTabId: number | undefined

const loopContext: ExecutionLoopContext = {
  isRunning: () => isLoopRunning,
  getTargetTabId: () => targetTabId,
  setTargetTabId: (tabId: number) => {
    targetTabId = tabId
  }
}

export async function runWorkflowLoop(): Promise<void> {
  if (isLoopRunning) {
    return
  }
  isLoopRunning = true

  try {
    const mode =
      (await workflowStorage.get<WorkflowMode>(STORAGE_KEYS.WORKFLOW_MODE)) ??
      DEFAULT_WORKFLOW_MODE

    if (mode === "dom_list_extract") {
      await runDomListExtraction(loopContext)
    } else {
      await runRecordsIteration(loopContext)
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    await updateExecutionState((prev) => ({
      ...prev,
      status: "error",
      errorMessage: msg,
      logs: appendLogEntry(prev.logs, `Error inesperado: ${msg}`)
    }))
  } finally {
    isLoopRunning = false
  }
}

export async function startWorkflowLoop(tabId?: number): Promise<void> {
  targetTabId = tabId
  const mode =
    (await workflowStorage.get<WorkflowMode>(STORAGE_KEYS.WORKFLOW_MODE)) ??
    DEFAULT_WORKFLOW_MODE
  const execOptions =
    (await workflowStorage.get<ExecutionOptions>(
      STORAGE_KEYS.EXECUTION_OPTIONS
    )) ?? DEFAULT_EXECUTION_OPTIONS

  const startRow = Math.max(1, Number(execOptions.startRow || 1))
  const initialIndex = startRow - 1

  const rangeSuffix =
    execOptions.endRow && execOptions.endRow > 0
      ? ` (rango: #${startRow} a #${execOptions.endRow})`
      : startRow > 1
        ? ` (desde #${startRow})`
        : ""

  const startMessage =
    mode === "dom_list_extract"
      ? `Iniciando extracción de lista web${rangeSuffix}...`
      : `Iniciando ejecución iterativa por registros${rangeSuffix}...`

  await updateExecutionState((prev) => ({
    ...prev,
    status: "running",
    pickingTarget: undefined,
    pickingForStepId: undefined,
    currentRecordIndex: initialIndex,
    currentStepIndex: 0,
    currentPage: 1,
    totalItemsInCurrentPage: undefined,
    skippedOrErrorCount: 0,
    errorMessage: undefined,
    results: [],
    logs: appendLogEntry(prev.logs, startMessage)
  }))
  void runWorkflowLoop()
}

export async function pauseWorkflowLoop(): Promise<void> {
  isLoopRunning = false
  await updateExecutionState((prev) => ({
    ...prev,
    status: "paused",
    logs: appendLogEntry(prev.logs, "Ejecución en pausa.")
  }))
}

export async function resumeWorkflowLoop(tabId?: number): Promise<void> {
  if (tabId !== undefined) {
    targetTabId = tabId
  }
  await updateExecutionState((prev) => ({
    ...prev,
    status: "running",
    errorMessage: undefined,
    logs: appendLogEntry(prev.logs, "Reanudando ejecución...")
  }))
  void runWorkflowLoop()
}

export async function stopWorkflowLoop(): Promise<void> {
  isLoopRunning = false
  await updateExecutionState((prev) => ({
    ...prev,
    status: "idle",
    pickingTarget: undefined,
    pickingForStepId: undefined,
    currentRecordIndex: 0,
    currentStepIndex: 0,
    currentPage: 1,
    errorMessage: undefined,
    logs: appendLogEntry(prev.logs, "Ejecución detenida por el usuario.")
  }))
}
