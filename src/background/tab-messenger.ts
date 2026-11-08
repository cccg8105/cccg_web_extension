export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
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

  const tabs = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true
  })

  const validTab = tabs.find(
    (t) =>
      t.id !== undefined &&
      t.url &&
      !t.url.startsWith("chrome://") &&
      !t.url.startsWith("chrome-extension://")
  )

  if (validTab?.id !== undefined) {
    return validTab.id
  }

  if (tabs[0]?.id !== undefined) {
    return tabs[0].id
  }

  throw new Error("No se encontró una pestaña web activa para ejecutar el flujo.")
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
      if (attempt === maxAttempts) {
        const msg = err instanceof Error ? err.message : String(err)
        return {
          ok: false,
          message: `No se pudo conectar con la página (recarga la pestaña e intenta de nuevo): ${msg}`
        } as TResponse
      }
      await delay(500)
    }
  }

  return {
    ok: false,
    message: "Sin respuesta del Content Script en la pestaña activa."
  } as TResponse
}
