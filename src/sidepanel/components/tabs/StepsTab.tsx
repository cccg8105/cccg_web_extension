import {
  Clock,
  Keyboard,
  ListFilter,
  MousePointerClick,
  ScanText,
  Type
} from "lucide-react"
import { useMemo } from "react"
import { useStorage } from "@plasmohq/storage/hook"
import { DomListConfigCard } from "~sidepanel/components/DomListConfigCard"
import { StepCard } from "~sidepanel/components/StepCard"
import { WorkflowLibraryCard } from "~sidepanel/components/WorkflowLibraryCard"
import { extractColumnsFromRecords } from "~sidepanel/utils/records-parser"
import {
  createDefaultStep,
  duplicateStepInList,
  moveStepInList,
  sendOrchestratorCommand
} from "~sidepanel/utils/step-helpers"
import {
  DEFAULT_DOM_LIST_CONFIG,
  DEFAULT_EXECUTION_STATE,
  DEFAULT_WORKFLOW_MODE,
  SAMPLE_RECORDS,
  SAMPLE_STEPS,
  STORAGE_KEYS,
  workflowStorage
} from "~storage/workflow-storage"
import type {
  ActionType,
  DataRecord,
  DomListConfig,
  ExecutionState,
  WorkflowMode,
  WorkflowStep
} from "~types/workflow"

export function StepsTab() {
  const [records] = useStorage<DataRecord[]>(
    {
      key: STORAGE_KEYS.RECORDS,
      instance: workflowStorage
    },
    SAMPLE_RECORDS
  )

  const [steps, setSteps] = useStorage<WorkflowStep[]>(
    {
      key: STORAGE_KEYS.STEPS,
      instance: workflowStorage
    },
    SAMPLE_STEPS
  )

  const [workflowMode, setWorkflowMode] = useStorage<WorkflowMode>(
    {
      key: STORAGE_KEYS.WORKFLOW_MODE,
      instance: workflowStorage
    },
    DEFAULT_WORKFLOW_MODE
  )

  const [domListConfig, setDomListConfig] = useStorage<DomListConfig>(
    {
      key: STORAGE_KEYS.DOM_LIST_CONFIG,
      instance: workflowStorage
    },
    DEFAULT_DOM_LIST_CONFIG
  )

  const [executionState] = useStorage<ExecutionState>(
    {
      key: STORAGE_KEYS.EXECUTION_STATE,
      instance: workflowStorage
    },
    DEFAULT_EXECUTION_STATE
  )

  const columns = useMemo(() => extractColumnsFromRecords(records), [records])
  const currentSteps = steps ?? []
  const currentMode = workflowMode ?? DEFAULT_WORKFLOW_MODE
  const currentListConfig = domListConfig ?? DEFAULT_DOM_LIST_CONFIG
  const isRunning = executionState?.status === "running"

  const addStep = (type: ActionType) => {
    const newStep = createDefaultStep(type, currentSteps, columns[0])
    setSteps([...currentSteps, newStep])
  }

  const updateStep = (id: string, patch: Partial<WorkflowStep>) => {
    setSteps(
      currentSteps.map((step) =>
        step.id === id ? { ...step, ...patch } : step
      )
    )
  }

  const removeStep = (id: string) => {
    setSteps(currentSteps.filter((step) => step.id !== id))
  }

  const moveStep = (index: number, direction: -1 | 1) => {
    setSteps(moveStepInList(currentSteps, index, direction))
  }

  const duplicateStep = (index: number) => {
    setSteps(duplicateStepInList(currentSteps, index))
  }

  const startPickingForStep = (stepId: string) => {
    const isAlreadyPickingThis =
      executionState?.status === "picking" &&
      (executionState?.pickingTarget ?? "step") === "step" &&
      executionState?.pickingForStepId === stepId

    if (isAlreadyPickingThis) {
      sendOrchestratorCommand({ type: "CANCEL_PICKING" })
      return
    }

    sendOrchestratorCommand({
      type: "START_PICKING",
      pickingTarget: "step",
      stepId
    })
  }

  return (
    <div className="space-y-3">
      {/* Workflow Templates Library & JSON Import/Export */}
      <WorkflowLibraryCard
        steps={currentSteps}
        mode={currentMode}
        domListConfig={currentListConfig}
        onStepsChange={setSteps}
        onModeChange={setWorkflowMode}
        onDomListConfigChange={setDomListConfig}
        isRunning={isRunning}
      />

      {/* Mode-specific top configuration */}
      {currentMode === "dom_list_extract" ? (
        <DomListConfigCard
          config={currentListConfig}
          onChange={setDomListConfig}
          executionState={executionState}
          isRunning={isRunning}
        />
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5">
          <div className="text-[11px] font-medium text-slate-400 mb-1.5">
            Variables disponibles del listado ({records?.length ?? 0} filas):
          </div>
          {columns.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {columns.map((col) => (
                <span
                  key={col}
                  className="px-2 py-0.5 rounded bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-mono text-[11px]">
                  {`{{${col}}}`}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-[11px]">
              Sin columnas detectadas. Carga registros en la pestaña
              &ldquo;Registros&rdquo;.
            </p>
          )}
        </div>
      )}

      {/* Add Step Buttons */}
      <div className="grid grid-cols-3 gap-1.5">
        <button
          type="button"
          disabled={isRunning}
          onClick={() => addStep("extract")}
          className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-40 border border-slate-700 text-slate-200 font-medium transition">
          <ScanText className="w-3.5 h-3.5 text-pink-400" />+ Extraer
        </button>
        <button
          type="button"
          disabled={isRunning}
          onClick={() => addStep("click")}
          className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-40 border border-slate-700 text-slate-200 font-medium transition">
          <MousePointerClick className="w-3.5 h-3.5 text-indigo-400" />+ Clic
        </button>
        <button
          type="button"
          disabled={isRunning}
          onClick={() => addStep("wait")}
          className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-40 border border-slate-700 text-slate-200 font-medium transition">
          <Clock className="w-3.5 h-3.5 text-amber-400" />+ Espera
        </button>
        {currentMode === "records_loop" && (
          <>
            <button
              type="button"
              disabled={isRunning}
              onClick={() => addStep("input")}
              className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-40 border border-slate-700 text-slate-200 font-medium transition">
              <Type className="w-3.5 h-3.5 text-emerald-400" />+ Texto
            </button>
            <button
              type="button"
              disabled={isRunning}
              onClick={() => addStep("select")}
              className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-40 border border-slate-700 text-slate-200 font-medium transition">
              <ListFilter className="w-3.5 h-3.5 text-cyan-400" />+ Select
            </button>
            <button
              type="button"
              disabled={isRunning}
              onClick={() => addStep("keypress")}
              className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-40 border border-slate-700 text-slate-200 font-medium transition">
              <Keyboard className="w-3.5 h-3.5 text-purple-400" />+ Tecla
            </button>
          </>
        )}
      </div>

      {/* Steps List */}
      <div className="space-y-2.5">
        {currentSteps.map((step, index) => {
          const isPickingThis =
            executionState?.status === "picking" &&
            (executionState?.pickingTarget ?? "step") === "step" &&
            executionState?.pickingForStepId === step.id

          return (
            <StepCard
              key={step.id}
              step={step}
              index={index}
              totalSteps={currentSteps.length}
              columns={columns}
              mode={currentMode}
              isRunning={isRunning}
              isPickingThis={isPickingThis}
              onUpdate={updateStep}
              onRemove={removeStep}
              onMove={moveStep}
              onDuplicate={duplicateStep}
              onTogglePick={startPickingForStep}
            />
          )
        })}
      </div>
    </div>
  )
}
