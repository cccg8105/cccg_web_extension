import { Database, ListOrdered, Play } from "lucide-react"
import { useEffect, useState } from "react"
import { useStorage } from "@plasmohq/storage/hook"
import { ModeSelectorBar } from "~sidepanel/components/ModeSelectorBar"
import { SidePanelHeader } from "~sidepanel/components/SidePanelHeader"
import { DataTab } from "~sidepanel/components/tabs/DataTab"
import { RunTab } from "~sidepanel/components/tabs/RunTab"
import { StepsTab } from "~sidepanel/components/tabs/StepsTab"
import {
  DEFAULT_EXECUTION_STATE,
  DEFAULT_WORKFLOW_MODE,
  SAMPLE_RECORDS,
  SAMPLE_STEPS,
  STORAGE_KEYS,
  workflowStorage
} from "~storage/workflow-storage"
import type {
  DataRecord,
  ExecutionState,
  WorkflowMode,
  WorkflowStep
} from "~types/workflow"

import "~style.css"

function SidePanelApp() {
  const [records] = useStorage<DataRecord[]>(
    {
      key: STORAGE_KEYS.RECORDS,
      instance: workflowStorage
    },
    SAMPLE_RECORDS
  )

  const [steps] = useStorage<WorkflowStep[]>(
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

  const [executionState] = useStorage<ExecutionState>(
    {
      key: STORAGE_KEYS.EXECUTION_STATE,
      instance: workflowStorage
    },
    DEFAULT_EXECUTION_STATE
  )

  const [activeTab, setActiveTab] = useState<"steps" | "data" | "run">("steps")
  const currentMode = workflowMode ?? DEFAULT_WORKFLOW_MODE
  const isDomListMode = currentMode === "dom_list_extract"

  useEffect(() => {
    if (isDomListMode && activeTab === "data") {
      setActiveTab("steps")
    }
  }, [isDomListMode, activeTab])

  const handleChangeMode = (nextMode: WorkflowMode) => {
    setWorkflowMode(nextMode)
    if (nextMode === "dom_list_extract" && activeTab === "data") {
      setActiveTab("steps")
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans text-xs">
      <SidePanelHeader status={executionState?.status} mode={currentMode} />

      <ModeSelectorBar
        mode={currentMode}
        onChangeMode={handleChangeMode}
        disabled={executionState?.status === "running"}
      />

      <nav
        className={`grid ${
          isDomListMode ? "grid-cols-2" : "grid-cols-3"
        } bg-slate-900/60 border-b border-slate-800 p-1 gap-1`}>
        <button
          type="button"
          onClick={() => setActiveTab("steps")}
          className={`flex items-center justify-center gap-1.5 py-2 rounded font-medium transition ${
            activeTab === "steps"
              ? "bg-indigo-600 text-white shadow"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
          }`}>
          <ListOrdered className="w-3.5 h-3.5" />
          Pasos ({steps?.length ?? 0})
        </button>

        {!isDomListMode && (
          <button
            type="button"
            onClick={() => setActiveTab("data")}
            className={`flex items-center justify-center gap-1.5 py-2 rounded font-medium transition ${
              activeTab === "data"
                ? "bg-indigo-600 text-white shadow"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}>
            <Database className="w-3.5 h-3.5" />
            Registros ({records?.length ?? 0})
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveTab("run")}
          className={`flex items-center justify-center gap-1.5 py-2 rounded font-medium transition ${
            activeTab === "run"
              ? "bg-indigo-600 text-white shadow"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
          }`}>
          <Play className="w-3.5 h-3.5" />
          Ejecutar
        </button>
      </nav>

      <main className="flex-1 overflow-y-auto p-3 space-y-3">
        {activeTab === "steps" && <StepsTab />}
        {!isDomListMode && activeTab === "data" && <DataTab />}
        {activeTab === "run" && <RunTab />}
      </main>
    </div>
  )
}

export default SidePanelApp
