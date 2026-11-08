import {
  Bookmark,
  Download,
  FolderOpen,
  Save,
  Trash2,
  Upload
} from "lucide-react"
import { useRef, useState } from "react"
import { useStorage } from "@plasmohq/storage/hook"
import {
  exportWorkflowToJsonFile,
  parseAndValidateWorkflowJson
} from "~sidepanel/utils/workflow-io"
import {
  DEFAULT_EXECUTION_OPTIONS,
  DEFAULT_SAVED_WORKFLOWS,
  STORAGE_KEYS,
  workflowStorage
} from "~storage/workflow-storage"
import type {
  DomListConfig,
  ExecutionOptions,
  SavedWorkflow,
  WorkflowMode,
  WorkflowStep
} from "~types/workflow"

interface WorkflowLibraryCardProps {
  steps: WorkflowStep[]
  mode: WorkflowMode
  domListConfig: DomListConfig
  onStepsChange: (steps: WorkflowStep[]) => void
  onModeChange: (mode: WorkflowMode) => void
  onDomListConfigChange: (config: DomListConfig) => void
  isRunning: boolean
}

export function WorkflowLibraryCard({
  steps,
  mode,
  domListConfig,
  onStepsChange,
  onModeChange,
  onDomListConfigChange,
  isRunning
}: WorkflowLibraryCardProps) {
  const [savedWorkflows, setSavedWorkflows] = useStorage<SavedWorkflow[]>(
    {
      key: STORAGE_KEYS.SAVED_WORKFLOWS,
      instance: workflowStorage
    },
    DEFAULT_SAVED_WORKFLOWS
  )

  const [executionOptions, setExecutionOptions] = useStorage<ExecutionOptions>(
    {
      key: STORAGE_KEYS.EXECUTION_OPTIONS,
      instance: workflowStorage
    },
    DEFAULT_EXECUTION_OPTIONS
  )

  const [workflowName, setWorkflowName] = useState<string>("")
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>("")
  const [workflowFeedback, setWorkflowFeedback] = useState<{
    type: "ok" | "error"
    text: string
  } | null>(null)
  const workflowFileInputRef = useRef<HTMLInputElement | null>(null)

  const handleSaveWorkflow = () => {
    if (steps.length === 0) {
      setWorkflowFeedback({
        type: "error",
        text: "Agrega al menos un paso antes de guardar el flujo."
      })
      return
    }

    const trimmedName = workflowName.trim()
    if (!trimmedName) {
      setWorkflowFeedback({
        type: "error",
        text: "Escribe un nombre para identificar el flujo en la biblioteca."
      })
      return
    }

    const list = savedWorkflows ?? []
    const nowIso = new Date().toISOString()
    const clonedSteps = steps.map((s) => ({ ...s }))
    const clonedListConfig: DomListConfig = {
      ...domListConfig,
      pagination: domListConfig.pagination
        ? { ...domListConfig.pagination }
        : undefined
    }
    const clonedExecOptions: ExecutionOptions = {
      ...(executionOptions ?? DEFAULT_EXECUTION_OPTIONS)
    }

    const existingByNameOrId = list.find(
      (wf) =>
        (selectedWorkflowId && wf.id === selectedWorkflowId) ||
        wf.name.toLowerCase() === trimmedName.toLowerCase()
    )

    if (existingByNameOrId) {
      const updatedList = list.map((wf) =>
        wf.id === existingByNameOrId.id
          ? {
              ...wf,
              name: trimmedName,
              updatedAt: nowIso,
              mode,
              domListConfig: clonedListConfig,
              executionOptions: clonedExecOptions,
              steps: clonedSteps
            }
          : wf
      )
      setSavedWorkflows(updatedList)
      setSelectedWorkflowId(existingByNameOrId.id)
      setWorkflowFeedback({
        type: "ok",
        text: `Flujo "${trimmedName}" actualizado (${clonedSteps.length} pasos).`
      })
      return
    }

    const newWf: SavedWorkflow = {
      id: `wf-${Date.now()}`,
      name: trimmedName,
      updatedAt: nowIso,
      mode,
      domListConfig: clonedListConfig,
      executionOptions: clonedExecOptions,
      steps: clonedSteps
    }
    setSavedWorkflows([newWf, ...list])
    setSelectedWorkflowId(newWf.id)
    setWorkflowFeedback({
      type: "ok",
      text: `Flujo "${trimmedName}" guardado en la biblioteca.`
    })
  }

  const handleLoadWorkflow = (idToLoad?: string) => {
    const targetId = idToLoad ?? selectedWorkflowId
    if (!targetId) return

    const found = (savedWorkflows ?? []).find((wf) => wf.id === targetId)
    if (!found) {
      setWorkflowFeedback({
        type: "error",
        text: "No se encontró el flujo seleccionado."
      })
      return
    }

    onStepsChange(found.steps.map((s) => ({ ...s })))
    if (found.mode) {
      onModeChange(found.mode)
    }
    if (found.domListConfig) {
      onDomListConfigChange({
        ...found.domListConfig,
        pagination: found.domListConfig.pagination
          ? { ...found.domListConfig.pagination }
          : undefined
      })
    }
    if (found.executionOptions) {
      setExecutionOptions({ ...found.executionOptions })
    }
    setWorkflowName(found.name)
    setSelectedWorkflowId(found.id)
    setWorkflowFeedback({
      type: "ok",
      text: `Flujo "${found.name}" cargado (${found.steps.length} pasos).`
    })
  }

  const handleDeleteWorkflow = () => {
    if (!selectedWorkflowId) return
    const target = (savedWorkflows ?? []).find(
      (wf) => wf.id === selectedWorkflowId
    )
    const remaining = (savedWorkflows ?? []).filter(
      (wf) => wf.id !== selectedWorkflowId
    )
    setSavedWorkflows(remaining)
    setSelectedWorkflowId(remaining[0]?.id ?? "")
    setWorkflowFeedback({
      type: "ok",
      text: target
        ? `Flujo "${target.name}" eliminado de la biblioteca.`
        : "Flujo eliminado."
    })
  }

  const handleExportSteps = () => {
    if (steps.length === 0) {
      setWorkflowFeedback({
        type: "error",
        text: "No hay pasos configurados para exportar."
      })
      return
    }

    exportWorkflowToJsonFile(
      workflowName,
      steps,
      mode,
      domListConfig,
      executionOptions ?? DEFAULT_EXECUTION_OPTIONS
    )
    setWorkflowFeedback({
      type: "ok",
      text: `Flujo exportado (${steps.length} pasos).`
    })
  }

  const handleImportSteps = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      try {
        const validation = parseAndValidateWorkflowJson(String(reader.result))
        if (!validation.ok) {
          setWorkflowFeedback({
            type: "error",
            text: validation.error
          })
          return
        }

        onStepsChange(validation.steps)
        if (validation.name !== undefined) {
          setWorkflowName(validation.name)
        }
        if (validation.mode !== undefined) {
          onModeChange(validation.mode)
        }
        if (validation.domListConfig !== undefined) {
          onDomListConfigChange(validation.domListConfig)
        }
        if (validation.executionOptions !== undefined) {
          setExecutionOptions(validation.executionOptions)
        }
        setWorkflowFeedback({
          type: "ok",
          text: `Se importaron ${validation.steps.length} pasos desde "${file.name}".`
        })
      } finally {
        if (workflowFileInputRef.current) {
          workflowFileInputRef.current.value = ""
        }
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold text-slate-200 flex items-center gap-1.5">
          <Bookmark className="w-3.5 h-3.5 text-indigo-400" />
          Plantillas y Flujos ({savedWorkflows?.length ?? 0})
        </span>
        <div className="flex items-center gap-1">
          <input
            ref={workflowFileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportSteps}
            className="hidden"
          />
          <button
            type="button"
            disabled={isRunning}
            onClick={() => workflowFileInputRef.current?.click()}
            title="Importar flujo desde archivo .json"
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-[10px] font-medium flex items-center gap-1 border border-slate-700 transition">
            <Upload className="w-3 h-3 text-indigo-400" />
            Importar
          </button>
          <button
            type="button"
            disabled={isRunning}
            onClick={handleExportSteps}
            title="Exportar pasos actuales a archivo .json"
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-[10px] font-medium flex items-center gap-1 border border-slate-700 transition">
            <Download className="w-3 h-3 text-emerald-400" />
            Exportar
          </button>
        </div>
      </div>

      {/* Save current workflow */}
      <div className="flex gap-1.5">
        <input
          type="text"
          disabled={isRunning}
          value={workflowName}
          onChange={(e) => setWorkflowName(e.target.value)}
          placeholder="Nombre del flujo (ej. Catálogo Productos)"
          className="flex-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-[11px] text-slate-200 focus:outline-none focus:border-indigo-500 disabled:opacity-60"
        />
        <button
          type="button"
          disabled={isRunning}
          onClick={handleSaveWorkflow}
          className="px-2.5 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-medium flex items-center gap-1 shrink-0 transition">
          <Save className="w-3.5 h-3.5" />
          Guardar
        </button>
      </div>

      {/* Saved workflows selector */}
      {savedWorkflows && savedWorkflows.length > 0 && (
        <div className="flex items-center gap-1.5 pt-0.5">
          <select
            disabled={isRunning}
            value={selectedWorkflowId}
            onChange={(e) => {
              const nextId = e.target.value
              setSelectedWorkflowId(nextId)
              if (nextId) {
                handleLoadWorkflow(nextId)
              }
            }}
            className="flex-1 bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-[11px] text-slate-200 focus:outline-none focus:border-indigo-500 disabled:opacity-60">
            <option value="">-- Seleccionar flujo guardado --</option>
            {savedWorkflows.map((wf) => (
              <option key={wf.id} value={wf.id}>
                {wf.name} ({wf.steps.length} pasos
                {wf.mode === "dom_list_extract" ? " · Lista Web" : ""})
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={!selectedWorkflowId || isRunning}
            onClick={() => handleLoadWorkflow()}
            title="Cargar flujo seleccionado"
            className="px-2 py-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 font-medium flex items-center gap-1 shrink-0 border border-slate-700">
            <FolderOpen className="w-3.5 h-3.5 text-indigo-400" />
            Cargar
          </button>
          <button
            type="button"
            disabled={!selectedWorkflowId || isRunning}
            onClick={handleDeleteWorkflow}
            title="Eliminar flujo de la biblioteca"
            className="p-1.5 rounded bg-slate-800 hover:bg-rose-500/20 disabled:opacity-40 text-rose-400 shrink-0 border border-slate-700">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {workflowFeedback && (
        <p
          className={`text-[11px] ${
            workflowFeedback.type === "error"
              ? "text-rose-400"
              : "text-emerald-400"
          }`}>
          {workflowFeedback.text}
        </p>
      )}
    </div>
  )
}
