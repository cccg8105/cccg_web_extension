import {
  pauseWorkflowLoop,
  resumeWorkflowLoop,
  startWorkflowLoop,
  stopWorkflowLoop
} from "~background/runners/orchestrator"
import { updateExecutionState } from "~background/state-manager"
import type { OrchestratorCommand } from "~types/workflow"

chrome.runtime.onInstalled.addListener(() => {
  if (chrome.sidePanel?.setPanelBehavior) {
    chrome.sidePanel
      .setPanelBehavior({ openPanelOnActionClick: true })
      .catch((error) =>
        console.error("Error setting sidePanel behavior:", error)
      )
  }
})

chrome.runtime.onMessage.addListener(
  (message: OrchestratorCommand, _sender, sendResponse) => {
    if (!message || typeof message.type !== "string") {
      return false
    }

    const handleCommand = async () => {
      switch (message.type) {
        case "START_WORKFLOW": {
          await startWorkflowLoop(message.tabId)
          sendResponse({ ok: true })
          break
        }

        case "PAUSE_WORKFLOW": {
          await pauseWorkflowLoop()
          sendResponse({ ok: true })
          break
        }

        case "RESUME_WORKFLOW": {
          await resumeWorkflowLoop(message.tabId)
          sendResponse({ ok: true })
          break
        }

        case "STOP_WORKFLOW": {
          await stopWorkflowLoop()
          sendResponse({ ok: true })
          break
        }

        case "START_PICKING": {
          await updateExecutionState((prev) => ({
            ...prev,
            status: "picking",
            pickingTarget: message.pickingTarget ?? "step",
            pickingForStepId: message.stepId,
            errorMessage: undefined
          }))
          sendResponse({ ok: true })
          break
        }

        case "CANCEL_PICKING": {
          await updateExecutionState((prev) => ({
            ...prev,
            status: "idle",
            pickingTarget: undefined,
            pickingForStepId: undefined
          }))
          sendResponse({ ok: true })
          break
        }

        default:
          sendResponse({ ok: false })
      }
    }

    void handleCommand()
    return true
  }
)
