export type ActionType =
  | "click"
  | "input"
  | "wait"
  | "select"
  | "keypress"
  | "extract"

export type ExtractSourceType = "textContent" | "value" | "attribute"

export type WorkflowMode =
  | "records_loop"
  | "dom_list_extract"
  | "html_table_extract"

export type PickingTargetType =
  | "step"
  | "list_container"
  | "pagination_next"
  | "table_container"
  | "table_header_row"

export interface TableExtractColumnConfig {
  index: number
  name: string
  source: ExtractSourceType
  attribute?: string
}

export interface TableExtractConfig {
  tableSelector: string
  headerRowIndex: number
  columns: TableExtractColumnConfig[]
  maxRows?: number
  pagination?: PaginationConfig
}

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
  tableExtractConfig?: TableExtractConfig
  executionOptions?: ExecutionOptions
  steps: WorkflowStep[]
}

export interface SavedWorkflow {
  id: string
  name: string
  updatedAt: string
  mode?: WorkflowMode
  domListConfig?: DomListConfig
  tableExtractConfig?: TableExtractConfig
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
  detectedTableRowCount?: number
  detectedTableColumnCount?: number
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

export interface InspectTablePagePayload {
  type: "INSPECT_TABLE_PAGE"
  tableSelector: string
  headerRowIndex: number
}

export interface InspectTablePageResponse {
  ok: boolean
  message: string
  totalRows: number
  dataRowCount: number
  headers: string[]
  pageSignature: string
}

export interface ExtractTableRowPayload {
  type: "EXTRACT_TABLE_ROW"
  tableSelector: string
  headerRowIndex: number
  dataRowIndex: number
  columns: TableExtractColumnConfig[]
}

export interface ExtractTableRowResponse {
  ok: boolean
  message: string
  rowData?: Record<string, string>
}

export interface PingPickerPayload {
  type: "PING_PICKER"
}

export interface SyncPickingStatePayload {
  type: "SYNC_PICKING_STATE"
  executionState: ExecutionState
}

export type ContentScriptRequest =
  | ExecuteStepPayload
  | InspectListPagePayload
  | ClickNextPagePayload
  | InspectTablePagePayload
  | ExtractTableRowPayload
  | PingPickerPayload
  | SyncPickingStatePayload

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
  | { type: "CANCEL_PICKING"; tabId?: number }
  | {
      type: "INSPECT_TABLE_IN_ACTIVE_TAB"
      tableSelector: string
      headerRowIndex: number
      tabId?: number
    }
