import Papa from "papaparse"
import type {
  ActionType,
  DataRecord,
  DomListConfig,
  ErrorHandlingPolicy,
  ExecutionOptions,
  ExportedWorkflowFile,
  ExtractSourceType,
  WorkflowMode,
  WorkflowStep
} from "~types/workflow"

const VALID_ACTION_TYPES: ActionType[] = [
  "click",
  "input",
  "wait",
  "select",
  "keypress",
  "extract"
]

const VALID_EXTRACT_SOURCES: ExtractSourceType[] = [
  "textContent",
  "value",
  "attribute"
]

const VALID_MODES: WorkflowMode[] = ["records_loop", "dom_list_extract"]

export type WorkflowImportValidationResult =
  | {
      ok: true
      steps: WorkflowStep[]
      name?: string
      mode?: WorkflowMode
      domListConfig?: DomListConfig
      executionOptions?: ExecutionOptions
    }
  | { ok: false; error: string }

function sanitizeDomListConfig(rawConfig: unknown): DomListConfig | undefined {
  if (!rawConfig || typeof rawConfig !== "object") {
    return undefined
  }
  const obj = rawConfig as Record<string, unknown>
  const itemSelector =
    typeof obj.itemSelector === "string" ? obj.itemSelector : ""
  const maxItems =
    typeof obj.maxItems === "number" && obj.maxItems >= 0
      ? obj.maxItems
      : undefined

  let pagination: DomListConfig["pagination"]
  if (obj.pagination && typeof obj.pagination === "object") {
    const pag = obj.pagination as Record<string, unknown>
    pagination = {
      enabled: Boolean(pag.enabled),
      nextButtonSelector:
        typeof pag.nextButtonSelector === "string"
          ? pag.nextButtonSelector
          : "",
      waitAfterClickMs:
        typeof pag.waitAfterClickMs === "number" && pag.waitAfterClickMs >= 100
          ? pag.waitAfterClickMs
          : 2000,
      maxPages:
        typeof pag.maxPages === "number" && pag.maxPages >= 1
          ? pag.maxPages
          : 5
    }
  }

  return {
    itemSelector,
    maxItems,
    pagination
  }
}

function sanitizeExecutionOptions(
  rawOpts: unknown
): ExecutionOptions | undefined {
  if (!rawOpts || typeof rawOpts !== "object") {
    return undefined
  }
  const obj = rawOpts as Record<string, unknown>
  const onError: ErrorHandlingPolicy =
    obj.onError === "skip" ? "skip" : "stop"
  const startRow =
    typeof obj.startRow === "number" && obj.startRow >= 1
      ? Math.floor(obj.startRow)
      : 1
  const endRow =
    typeof obj.endRow === "number" && obj.endRow >= 0
      ? Math.floor(obj.endRow)
      : 0

  return {
    onError,
    startRow,
    endRow
  }
}

export function parseAndValidateWorkflowJson(
  rawText: string
): WorkflowImportValidationResult {
  try {
    const raw = JSON.parse(rawText)
    const candidateSteps: unknown = Array.isArray(raw)
      ? raw
      : raw && typeof raw === "object" && "steps" in raw
        ? (raw as ExportedWorkflowFile).steps
        : null

    if (!Array.isArray(candidateSteps) || candidateSteps.length === 0) {
      return {
        ok: false,
        error: "El archivo JSON no contiene una lista válida de pasos."
      }
    }

    const validatedSteps: WorkflowStep[] = []
    for (let i = 0; i < candidateSteps.length; i++) {
      const item = candidateSteps[i] as Record<string, unknown>
      if (
        !item ||
        typeof item !== "object" ||
        typeof item.type !== "string" ||
        !VALID_ACTION_TYPES.includes(item.type as ActionType) ||
        typeof item.label !== "string"
      ) {
        return {
          ok: false,
          error: `Formato inválido en el paso #${i + 1} del archivo JSON.`
        }
      }

      validatedSteps.push({
        id:
          typeof item.id === "string" && item.id.trim()
            ? item.id
            : `step-${Date.now()}-${i}`,
        type: item.type as ActionType,
        label: item.label,
        selector:
          typeof item.selector === "string" ? item.selector : undefined,
        valueTemplate:
          typeof item.valueTemplate === "string"
            ? item.valueTemplate
            : undefined,
        waitMs: typeof item.waitMs === "number" ? item.waitMs : undefined,
        key: typeof item.key === "string" ? item.key : undefined,
        outputColumn:
          typeof item.outputColumn === "string"
            ? item.outputColumn
            : undefined,
        extractSource:
          typeof item.extractSource === "string" &&
          VALID_EXTRACT_SOURCES.includes(
            item.extractSource as ExtractSourceType
          )
            ? (item.extractSource as ExtractSourceType)
            : undefined,
        extractAttribute:
          typeof item.extractAttribute === "string"
            ? item.extractAttribute
            : undefined
      })
    }

    const isEnvelope = Boolean(
      raw && typeof raw === "object" && !Array.isArray(raw)
    )
    const envelope = isEnvelope ? (raw as ExportedWorkflowFile) : undefined

    const importedName =
      envelope && typeof envelope.name === "string" ? envelope.name : undefined
    const importedMode =
      envelope &&
      typeof envelope.mode === "string" &&
      VALID_MODES.includes(envelope.mode as WorkflowMode)
        ? (envelope.mode as WorkflowMode)
        : undefined
    const importedDomListConfig = envelope
      ? sanitizeDomListConfig(envelope.domListConfig)
      : undefined
    const importedExecutionOptions = envelope
      ? sanitizeExecutionOptions(envelope.executionOptions)
      : undefined

    return {
      ok: true,
      steps: validatedSteps,
      name: importedName,
      mode: importedMode,
      domListConfig: importedDomListConfig,
      executionOptions: importedExecutionOptions
    }
  } catch {
    return {
      ok: false,
      error: "Archivo JSON corrupto o con sintaxis inválida."
    }
  }
}

export function exportWorkflowToJsonFile(
  workflowName: string,
  steps: WorkflowStep[],
  mode?: WorkflowMode,
  domListConfig?: DomListConfig,
  executionOptions?: ExecutionOptions
): void {
  const exportPayload: ExportedWorkflowFile = {
    version: "1.0.0",
    exportedAt: new Date().toISOString(),
    name: workflowName.trim() || "Flujo AutoLoop",
    mode,
    domListConfig,
    executionOptions,
    steps
  }

  const jsonString = JSON.stringify(exportPayload, null, 2)
  const blob = new Blob([jsonString], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const dateStamp = new Date().toISOString().slice(0, 10)
  const safeSlug = (workflowName.trim() || "workflow")
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/^-|-$/g, "")

  const link = document.createElement("a")
  link.href = url
  link.download = `autoloop-${safeSlug || "workflow"}-${dateStamp}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function downloadExecutionReportCsv(results: DataRecord[]): void {
  if (results.length === 0) return

  const csvContent = Papa.unparse(results)
  const blob = new Blob([`\uFEFF${csvContent}`], {
    type: "text/csv;charset=utf-8;"
  })
  const url = URL.createObjectURL(blob)
  const dateStamp = new Date().toISOString().slice(0, 10)
  const link = document.createElement("a")
  link.href = url
  link.download = `autoloop-reporte-${dateStamp}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
