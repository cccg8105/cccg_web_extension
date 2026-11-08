import {
  DEFAULT_EXECUTION_STATE,
  STORAGE_KEYS,
  workflowStorage
} from "~storage/workflow-storage"
import type {
  DataRecord,
  ExecuteStepResponse,
  ExecutionState,
  WorkflowStep
} from "~types/workflow"

export async function getExecutionState(): Promise<ExecutionState> {
  return (
    (await workflowStorage.get<ExecutionState>(STORAGE_KEYS.EXECUTION_STATE)) ??
    DEFAULT_EXECUTION_STATE
  )
}

export async function updateExecutionState(
  updater: (prev: ExecutionState) => ExecutionState
): Promise<ExecutionState> {
  const current = await getExecutionState()
  const next = updater(current)
  await workflowStorage.set(STORAGE_KEYS.EXECUTION_STATE, next)
  return next
}

export function formatLog(text: string): string {
  return `[${new Date().toLocaleTimeString()}] ${text}`
}

export function appendLogEntry(logs: string[], text: string): string[] {
  return [...logs.slice(-99), formatLog(text)]
}

export function applyStepSuccessToResults(
  results: DataRecord[] | undefined,
  recordIndex: number,
  baseRecord: DataRecord,
  step: WorkflowStep,
  response: ExecuteStepResponse,
  isLastStepInRecord: boolean
): DataRecord[] {
  const updatedResults = [...(results ?? [])]
  const existingRow: DataRecord = updatedResults[recordIndex] ?? {
    ...baseRecord
  }

  if (step.type === "extract") {
    const outCol = step.outputColumn?.trim() || "extraido"
    existingRow[outCol] = response.extractedValue ?? ""
  }

  if (isLastStepInRecord) {
    existingRow._status = "ok"
    existingRow._error = ""
  } else if (!existingRow._status) {
    existingRow._status = "running"
    existingRow._error = ""
  }

  updatedResults[recordIndex] = existingRow
  return updatedResults
}

export function applyStepErrorToResults(
  results: DataRecord[] | undefined,
  recordIndex: number,
  baseRecord: DataRecord,
  errorMessage: string
): DataRecord[] {
  const updatedResults = [...(results ?? [])]
  const existingRow: DataRecord = updatedResults[recordIndex] ?? {
    ...baseRecord
  }

  updatedResults[recordIndex] = {
    ...existingRow,
    _status: "error",
    _error: errorMessage
  }

  return updatedResults
}
