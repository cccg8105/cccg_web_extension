export type ActionType =
  | "click"
  | "input"
  | "wait"
  | "select"
  | "keypress"
  | "extract"

export type ExtractSourceType = "textContent" | "value" | "attribute"

export type WorkflowMode = "records_loop" | "dom_list_extract"

export type PickingTargetType = "step" | "list_container" | "pagination_next"

export type ErrorHandlingPolicy = "stop" | "skip"

export type DataRecord = Record<string, string>

export interface ExecutionOptions {
  onError: ErrorHandlingPolicy
  startRow: number
  endRow?: number
}

export interface PaginationConfig {
  enabled: boolean
  nextButtonSelector: string
  waitAfterClickMs: number
  maxPages: number
}

export interface DomListConfig {
  itemSelector: string
  maxItems?: number
  pagination?: PaginationConfig
}

export interface WorkflowStep {
  id: string
  type: ActionType
  label: string
  selector?: string
  valueTemplate?: string
  waitMs?: number
  key?: string
  outputColumn?: string
  extractSource?: ExtractSourceType
  extractAttribute?: string
}

export interface ExportedWorkflowFile {
  version: string
  exportedAt: string
  name?: string
  mode?: WorkflowMode
  domListConfig?: DomListConfig
  executionOptions?: ExecutionOptions
  steps: WorkflowStep[]
}

export interface SavedWorkflow {
  id: string
  name: string
  updatedAt: string
  mode?: WorkflowMode
  domListConfig?: DomListConfig
  executionOptions?: ExecutionOptions
  steps: WorkflowStep[]
}

export interface ExecutionState {
  status: "idle" | "picking" | "running" | "paused" | "completed" | "error"
  pickingTarget?: PickingTargetType
  pickingForStepId?: string
  lastPickedSelector?: string
  currentRecordIndex: number
  currentStepIndex: number
  currentPage?: number
  totalItemsInCurrentPage?: number
  detectedListCount?: number
  skippedOrErrorCount?: number
  logs: string[]
  errorMessage?: string
  results?: DataRecord[]
}

export interface ExecuteStepPayload {
  type: "EXECUTE_STEP"
  step: WorkflowStep
  record: DataRecord
  recordIndex: number
  stepIndex: number
  listItemSelector?: string
}

export interface ExecuteStepResponse {
  ok: boolean
  message: string
  extractedValue?: string
}

export interface InspectListPagePayload {
  type: "INSPECT_LIST_PAGE"
  itemSelector: string
}

export interface InspectListPageResponse {
  ok: boolean
  message: string
  count: number
  pageSignature: string
}

export interface ClickNextPagePayload {
  type: "CLICK_NEXT_PAGE"
  nextButtonSelector: string
}

export interface ClickNextPageResponse {
  ok: boolean
  hasNextPage: boolean
  message: string
}

export type ContentScriptRequest =
  | ExecuteStepPayload
  | InspectListPagePayload
  | ClickNextPagePayload

export type OrchestratorCommand =
  | { type: "START_WORKFLOW"; tabId?: number }
  | { type: "PAUSE_WORKFLOW" }
  | { type: "RESUME_WORKFLOW"; tabId?: number }
  | { type: "STOP_WORKFLOW" }
  | {
      type: "START_PICKING"
      stepId?: string
      pickingTarget?: PickingTargetType
      tabId?: number
    }
  | { type: "CANCEL_PICKING" }
