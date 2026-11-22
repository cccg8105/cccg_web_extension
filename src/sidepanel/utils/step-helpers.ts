import type {
  ActionType,
  OrchestratorCommand,
  WorkflowStep
} from "~types/workflow"

export function sendOrchestratorCommand(command: OrchestratorCommand): void {
  chrome.runtime.sendMessage(command)
}

export function createDefaultStep(
  type: ActionType,
  currentSteps: WorkflowStep[],
  defaultColumn?: string
): WorkflowStep {
  const defaultLabels: Record<ActionType, string> = {
    click: "Hacer clic en elemento",
    input: "Escribir texto en campo",
    select: "Seleccionar opción de lista",
    keypress: "Presionar tecla",
    extract: "Extraer dato de elemento",
    wait: "Esperar tiempo fijo"
  }

  const extractCount =
    currentSteps.filter((s) => s.type === "extract").length + 1

  return {
    id: `step-${Date.now()}`,
    type,
    label: `${defaultLabels[type]} #${currentSteps.length + 1}`,
    selector: type === "wait" ? undefined : "",
    valueTemplate:
      (type === "input" || type === "select") && defaultColumn
        ? `{{${defaultColumn}}}`
        : "",
    waitMs: type === "wait" ? 1000 : undefined,
    key: type === "keypress" ? "Enter" : undefined,
    outputColumn: type === "extract" ? `dato_${extractCount}` : undefined,
    extractSource: type === "extract" ? "textContent" : undefined
  }
}

export function moveStepInList(
  steps: WorkflowStep[],
  index: number,
  direction: -1 | 1
): WorkflowStep[] {
  const targetIndex = index + direction
  if (targetIndex < 0 || targetIndex >= steps.length) {
    return steps
  }
  const copy = [...steps]
  const [item] = copy.splice(index, 1)
  copy.splice(targetIndex, 0, item)
  return copy
}

export function cloneWorkflowStep(step: WorkflowStep): WorkflowStep {
  return {
    ...step,
    ...(Array.isArray(step.selectorCandidates)
      ? {
          selectorCandidates: step.selectorCandidates.map((cand) => ({
            ...cand
          }))
        }
      : {}),
    ...(step.targetFingerprint
      ? {
          targetFingerprint: {
            ...step.targetFingerprint,
            stableClasses: [...step.targetFingerprint.stableClasses],
            parentClasses: [...step.targetFingerprint.parentClasses],
            attributeNames: [...step.targetFingerprint.attributeNames],
            ...(step.targetFingerprint.relativeBox
              ? { relativeBox: { ...step.targetFingerprint.relativeBox } }
              : {})
          }
        }
      : {})
  }
}

export function duplicateStepInList(
  steps: WorkflowStep[],
  index: number
): WorkflowStep[] {
  const source = steps[index]
  if (!source) {
    return steps
  }
  const cloned = cloneWorkflowStep(source)
  const duplicated: WorkflowStep = {
    ...cloned,
    id: `step-${Date.now()}`,
    label: `${source.label} (copia)`
  }
  const copy = [...steps]
  copy.splice(index + 1, 0, duplicated)
  return copy
}
