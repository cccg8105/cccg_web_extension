import type {
  ExecutionState,
  PingPickerPayload,
  SyncPickingStatePayload
} from "~types/workflow"

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isWebPageTab(tab: chrome.tabs.Tab): boolean {
  if (tab.id === undefined || !tab.url) return false
  return (
    tab.url.startsWith("http://") ||
    tab.url.startsWith("https://") ||
    tab.url.startsWith("file://")
  )
}

export async function getActiveTabId(preferredTabId?: number): Promise<number> {
  if (preferredTabId !== undefined) {
    try {
      const tab = await chrome.tabs.get(preferredTabId)
      if (tab?.id !== undefined) {
        return tab.id
      }
    } catch {
      // Fallback to active tab query
    }
  }

  const focusedTabs = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true
  })

  const validFocusedTab = focusedTabs.find(isWebPageTab)
  if (validFocusedTab?.id !== undefined) {
    return validFocusedTab.id
  }

  const allActiveTabs = await chrome.tabs.query({
    active: true
  })

  const validActiveTab = allActiveTabs.find(isWebPageTab)
  if (validActiveTab?.id !== undefined) {
    return validActiveTab.id
  }

  if (focusedTabs[0]?.id !== undefined) {
    return focusedTabs[0].id
  }

  if (allActiveTabs[0]?.id !== undefined) {
    return allActiveTabs[0].id
  }

  throw new Error("No se encontró una pestaña web activa para ejecutar el flujo.")
}

export async function ensureContentScriptsInTab(tabId: number): Promise<boolean> {
  try {
    const pingResponse = await chrome.tabs.sendMessage<
      PingPickerPayload,
      { ok?: boolean }
    >(tabId, { type: "PING_PICKER" })
    if (pingResponse?.ok) {
      return true
    }
  } catch {
    // Content script not yet injected or context invalidated after extension reload
  }

  try {
    if (!chrome.scripting?.executeScript) {
      return false
    }
    const manifest = chrome.runtime.getManifest()
    const jsFiles = (manifest.content_scripts ?? []).flatMap(
      (cs) => cs.js ?? []
    )
    if (jsFiles.length === 0) {
      return false
    }

    await chrome.scripting.executeScript({
      target: { tabId },
      files: jsFiles
    })
    await delay(150)
    return true
  } catch (err) {
    console.warn("Could not inject content scripts into tab:", tabId, err)
    return false
  }
}

export async function syncPickerStateInActiveTab(
  executionState: ExecutionState,
  preferredTabId?: number
): Promise<void> {
  try {
    const tabId = await getActiveTabId(preferredTabId)
    await ensureContentScriptsInTab(tabId)

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const res = await chrome.tabs.sendMessage<
          SyncPickingStatePayload,
          { ok?: boolean }
        >(tabId, {
          type: "SYNC_PICKING_STATE",
          executionState
        })
        if (res?.ok) {
          return
        }
      } catch {
        // Wait briefly for newly injected CSUI component to mount
      }
      await delay(120)
    }
  } catch (err) {
    console.warn("Could not sync picker state in active tab:", err)
  }
}

export async function waitForTabComplete(
  tabId: number,
  timeoutMs = 10000
): Promise<void> {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const tab = await chrome.tabs.get(tabId)
    if (tab.status === "complete") {
      return
    }
    await delay(250)
  }
}

export async function sendMessageToTabWithRetry<
  TPayload,
  TResponse extends { ok: boolean; message: string }
>(tabId: number, payload: TPayload, maxAttempts = 3): Promise<TResponse> {
  await waitForTabComplete(tabId)

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await chrome.tabs.sendMessage<TPayload, TResponse>(
        tabId,
        payload
      )
      if (response) {
        return response
      }
    } catch (err) {
      if (attempt === 1) {
        await ensureContentScriptsInTab(tabId)
      }
      if (attempt === maxAttempts) {
        const msg = err instanceof Error ? err.message : String(err)
        return {
          ok: false,
          message: `No se pudo conectar con la página (recarga la pestaña e intenta de nuevo): ${msg}`
        } as TResponse
      }
      await delay(400)
    }
  }

  return {
    ok: false,
    message: "Sin respuesta del Content Script en la pestaña activa."
  } as TResponse
}
