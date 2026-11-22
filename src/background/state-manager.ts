import { choosePromotedSelector } from "~contents/helpers/selector-rl-engine"
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

/**
 * Persists learned selector candidates, optional bootstrapped fingerprint,
 * and conservatively promotes higher-performing primary selectors into STORAGE_KEYS.STEPS.
 */
export async function persistLearnedStepSelectors(
  stepId: string,
  response: ExecuteStepResponse
): Promise<void> {
  if (!response.updatedCandidates && !response.bootstrappedFingerprint) {
    return
  }

  const steps = await workflowStorage.get<WorkflowStep[]>(STORAGE_KEYS.STEPS)
  if (!Array.isArray(steps) || steps.length === 0) {
    return
  }

  let modified = false
  const nextSteps = steps.map((step) => {
    if (step.id !== stepId) return step
    if (step.type === "wait") return step

    const nextCandidates = response.updatedCandidates ?? step.selectorCandidates
    const nextFingerprint =
      step.targetFingerprint ?? response.bootstrappedFingerprint

    const currentSelector = step.selector?.trim()
    const nextSelector =
      currentSelector === ":scope"
        ? currentSelector
        : choosePromotedSelector(currentSelector, nextCandidates ?? [])

    modified = true
    return {
      ...step,
      ...(nextSelector ? { selector: nextSelector } : {}),
      ...(nextCandidates ? { selectorCandidates: nextCandidates } : {}),
      ...(nextFingerprint ? { targetFingerprint: nextFingerprint } : {})
    }
  })

  if (modified) {
    await workflowStorage.set(STORAGE_KEYS.STEPS, nextSteps)
  }
}

export function formatAutoHealLogMessage(
  contextLabel: string,
  stepLabel: string,
  response: ExecuteStepResponse
): string | null {
  if (!response.healedSelector) {
    return null
  }
  const simPct =
    response.healedSimilarity !== undefined
      ? ` (similitud ${Math.round(response.healedSimilarity * 100)}%)`
      : ""
  return `[Auto-Heal] ${contextLabel} (${stepLabel}): Selector alternativo aprendido "${response.healedSelector}"${simPct}`
}
