import {
  pauseWorkflowLoop,
  resumeWorkflowLoop,
  startWorkflowLoop,
  stopWorkflowLoop
} from "~background/runners/orchestrator"
import { updateExecutionState } from "~background/state-manager"
import {
  getActiveTabId,
  sendMessageToTabWithRetry,
  syncPickerStateInActiveTab
} from "~background/tab-messenger"
import type {
  InspectTablePagePayload,
  InspectTablePageResponse,
  OrchestratorCommand
} from "~types/workflow"

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
          const nextState = await updateExecutionState((prev) => ({
            ...prev,
            status: "picking",
            pickingTarget: message.pickingTarget ?? "step",
            pickingForStepId: message.stepId,
            errorMessage: undefined
          }))
          await syncPickerStateInActiveTab(nextState, message.tabId)
          sendResponse({ ok: true })
          break
        }

        case "CANCEL_PICKING": {
          const nextState = await updateExecutionState((prev) => ({
            ...prev,
            status: "idle",
            pickingTarget: undefined,
            pickingForStepId: undefined
          }))
          void syncPickerStateInActiveTab(nextState, message.tabId)
          sendResponse({ ok: true })
          break
        }

        case "INSPECT_TABLE_IN_ACTIVE_TAB": {
          try {
            const tabId = await getActiveTabId(message.tabId)
            const response = await sendMessageToTabWithRetry<
              InspectTablePagePayload,
              InspectTablePageResponse
            >(tabId, {
              type: "INSPECT_TABLE_PAGE",
              tableSelector: message.tableSelector,
              headerRowIndex: message.headerRowIndex
            })
            sendResponse(response)
          } catch (err) {
            const errMsg = err instanceof Error ? err.message : String(err)
            sendResponse({
              ok: false,
              message: errMsg,
              totalRows: 0,
              dataRowCount: 0,
              headers: [],
              pageSignature: ""
            } satisfies InspectTablePageResponse)
          }
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
