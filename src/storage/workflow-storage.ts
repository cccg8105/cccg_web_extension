import { Storage } from "@plasmohq/storage"
import type {
  DataRecord,
  DomListConfig,
  ExecutionOptions,
  ExecutionState,
  SavedWorkflow,
  WorkflowMode,
  WorkflowStep
} from "~types/workflow"

export const workflowStorage = new Storage({
  area: "local"
})

export const STORAGE_KEYS = {
  WORKFLOW_MODE: "rpa_workflow_mode",
  DOM_LIST_CONFIG: "rpa_dom_list_config",
  EXECUTION_OPTIONS: "rpa_execution_options",
  RECORDS: "rpa_records",
  STEPS: "rpa_steps",
  EXECUTION_STATE: "rpa_execution_state",
  SAVED_WORKFLOWS: "rpa_saved_workflows"
} as const

export const DEFAULT_WORKFLOW_MODE: WorkflowMode = "records_loop"

export const DEFAULT_DOM_LIST_CONFIG: DomListConfig = {
  itemSelector: "",
  maxItems: 0,
  pagination: {
    enabled: false,
    nextButtonSelector: "",
    waitAfterClickMs: 2000,
    maxPages: 5
  }
}

export const DEFAULT_EXECUTION_OPTIONS: ExecutionOptions = {
  onError: "stop",
  startRow: 1,
  endRow: 0
}

export const DEFAULT_SAVED_WORKFLOWS: SavedWorkflow[] = []

export const DEFAULT_EXECUTION_STATE: ExecutionState = {
  status: "idle",
  currentRecordIndex: 0,
  currentStepIndex: 0,
  currentPage: 1,
  skippedOrErrorCount: 0,
  logs: [],
  results: []
}

export const SAMPLE_RECORDS: DataRecord[] = [
  { nombre: "Ana García", email: "ana.garcia@ejemplo.com", rol: "Admin" },
  { nombre: "Carlos Pérez", email: "carlos.perez@ejemplo.com", rol: "Editor" },
  { nombre: "Lucía Torres", email: "lucia.torres@ejemplo.com", rol: "Viewer" }
]

export const SAMPLE_STEPS: WorkflowStep[] = [
  {
    id: "step-1",
    type: "input",
    label: "Escribir nombre",
    selector: "input[name='nombre'], #nombre",
    valueTemplate: "{{nombre}}"
  },
  {
    id: "step-2",
    type: "input",
    label: "Escribir correo",
    selector: "input[type='email'], #email",
    valueTemplate: "{{email}}"
  },
  {
    id: "step-3",
    type: "click",
    label: "Clic en enviar",
    selector: "button[type='submit']"
  },
  {
    id: "step-4",
    type: "wait",
    label: "Esperar confirmación",
    waitMs: 1000
  }
]

export async function appendExecutionLog(message: string): Promise<void> {
  const current =
    (await workflowStorage.get<ExecutionState>(STORAGE_KEYS.EXECUTION_STATE)) ??
    DEFAULT_EXECUTION_STATE
  const timestamp = new Date().toLocaleTimeString()
  const updatedLogs = [...current.logs.slice(-99), `[${timestamp}] ${message}`]
  await workflowStorage.set(STORAGE_KEYS.EXECUTION_STATE, {
    ...current,
    logs: updatedLogs
  })
}
