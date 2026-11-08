import type { PlasmoCSConfig } from "plasmo"
import type {
  ClickNextPageResponse,
  ContentScriptRequest,
  DataRecord,
  ExecuteStepResponse,
  InspectListPageResponse,
  WorkflowStep
} from "~types/workflow"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"]
}

function interpolateTemplate(template: string, record: DataRecord): string {
  return template.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, key: string) => {
    const trimmedKey = key.trim()
    return record[trimmedKey] !== undefined ? String(record[trimmedKey]) : ""
  })
}

function waitForElement(selector: string, timeoutMs = 8000): Promise<Element> {
  return new Promise((resolve, reject) => {
    try {
      const existing = document.querySelector(selector)
      if (existing) {
        resolve(existing)
        return
      }
    } catch (err) {
      reject(new Error(`Selector CSS inválido "${selector}": ${String(err)}`))
      return
    }

    const observer = new MutationObserver(() => {
      const found = document.querySelector(selector)
      if (found) {
        observer.disconnect()
        clearTimeout(timer)
        resolve(found)
      }
    })

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true
    })

    const timer = setTimeout(() => {
      observer.disconnect()
      reject(
        new Error(
          `Tiempo de espera agotado (${timeoutMs}ms) buscando el selector: ${selector}`
        )
      )
    }, timeoutMs)
  })
}

function waitForScopedElement(
  root: Element,
  selector: string,
  timeoutMs = 3000
): Promise<Element> {
  return new Promise((resolve, reject) => {
    try {
      if (selector === ":scope") {
        resolve(root)
        return
      }
      const existing = root.querySelector(selector)
      if (existing) {
        resolve(existing)
        return
      }
    } catch (err) {
      reject(new Error(`Selector relativo inválido "${selector}": ${String(err)}`))
      return
    }

    const observer = new MutationObserver(() => {
      const found = root.querySelector(selector)
      if (found) {
        observer.disconnect()
        clearTimeout(timer)
        resolve(found)
      }
    })

    observer.observe(root, {
      childList: true,
      subtree: true,
      attributes: true
    })

    const timer = setTimeout(() => {
      observer.disconnect()
      reject(
        new Error(
          `No se encontró el sub-elemento "${selector}" dentro del ítem de la lista.`
        )
      )
    }, timeoutMs)
  })
}

function flashElementHighlight(element: HTMLElement): void {
  const prevOutline = element.style.outline
  const prevOutlineOffset = element.style.outlineOffset
  element.style.outline = "3px solid #6366f1"
  element.style.outlineOffset = "2px"

  setTimeout(() => {
    element.style.outline = prevOutline
    element.style.outlineOffset = prevOutlineOffset
  }, 600)
}

function setNativeValue(
  element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
  value: string
): void {
  const valueSetter = Object.getOwnPropertyDescriptor(element, "value")?.set
  const prototype = Object.getPrototypeOf(element)
  const prototypeValueSetter = Object.getOwnPropertyDescriptor(
    prototype,
    "value"
  )?.set

  if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
    prototypeValueSetter.call(element, value)
  } else if (valueSetter) {
    valueSetter.call(element, value)
  } else {
    element.value = value
  }

  element.dispatchEvent(new Event("input", { bubbles: true }))
  element.dispatchEvent(new Event("change", { bubbles: true }))
}

async function resolveStepTargetElement(
  step: WorkflowStep,
  listItemSelector: string | undefined,
  recordIndex: number
): Promise<HTMLElement> {
  const trimmedListSelector = listItemSelector?.trim()
  if (trimmedListSelector) {
    await waitForElement(trimmedListSelector, 8000)
    const items = document.querySelectorAll(trimmedListSelector)
    const container = items[recordIndex] as HTMLElement | undefined
    if (!container) {
      throw new Error(
        `No se encontró el elemento #${recordIndex + 1} para la lista "${trimmedListSelector}" (total en página: ${items.length}).`
      )
    }

    // Desplazar primero hacia el contenedor para disparar IntersectionObserver / lazy-loading de imágenes y precios
    container.scrollIntoView({
      block: "center",
      inline: "nearest",
      behavior: "smooth"
    })

    const subSelector = step.selector?.trim()
    if (!subSelector || subSelector === ":scope") {
      return container
    }

    const scopedEl = await waitForScopedElement(container, subSelector, 4500)
    return scopedEl as HTMLElement
  }

  if (!step.selector || !step.selector.trim()) {
    throw new Error(
      `El paso "${step.label}" no tiene un selector CSS configurado.`
    )
  }

  const rawElement = await waitForElement(step.selector.trim())
  return rawElement as HTMLElement
}

async function executeDomStep(
  step: WorkflowStep,
  record: DataRecord,
  listItemSelector?: string,
  recordIndex = 0
): Promise<ExecuteStepResponse> {
  if (step.type === "wait") {
    const duration = Math.max(0, Number(step.waitMs ?? 1000))
    await new Promise((resolve) => setTimeout(resolve, duration))
    return {
      ok: true,
      message: `Espera completada (${duration}ms)`
    }
  }

  if (!listItemSelector?.trim() && (!step.selector || !step.selector.trim())) {
    return {
      ok: false,
      message: `El paso "${step.label}" no tiene un selector CSS configurado.`
    }
  }

  const element = await resolveStepTargetElement(
    step,
    listItemSelector,
    recordIndex
  )

  element.scrollIntoView({
    block: "center",
    inline: "nearest",
    behavior: "smooth"
  })
  flashElementHighlight(element)

  const displaySelector = step.selector?.trim() || listItemSelector || ":scope"

  if (step.type === "click") {
    element.focus?.()
    element.dispatchEvent(
      new MouseEvent("mousedown", { bubbles: true, cancelable: true })
    )
    element.dispatchEvent(
      new MouseEvent("mouseup", { bubbles: true, cancelable: true })
    )
    element.click()

    return {
      ok: true,
      message: `Clic ejecutado en "${displaySelector}"`
    }
  }

  if (step.type === "input") {
    const resolvedValue = interpolateTemplate(step.valueTemplate ?? "", record)
    element.focus?.()

    if (
      element instanceof HTMLInputElement ||
      element instanceof HTMLTextAreaElement ||
      element instanceof HTMLSelectElement
    ) {
      setNativeValue(element, resolvedValue)
    } else if (element.isContentEditable) {
      element.textContent = resolvedValue
      element.dispatchEvent(new Event("input", { bubbles: true }))
    } else {
      const nestedInput = element.querySelector("input, textarea, select") as
        | HTMLInputElement
        | HTMLTextAreaElement
        | HTMLSelectElement
        | null
      if (nestedInput) {
        nestedInput.focus()
        setNativeValue(nestedInput, resolvedValue)
      } else {
        throw new Error(
          `El elemento "${displaySelector}" no es un campo editable (input/textarea/contenteditable).`
        )
      }
    }

    return {
      ok: true,
      message: `Texto "${resolvedValue}" escrito en "${displaySelector}"`
    }
  }

  if (step.type === "select") {
    const resolvedValue = interpolateTemplate(
      step.valueTemplate ?? "",
      record
    ).trim()

    const selectEl =
      element instanceof HTMLSelectElement
        ? element
        : (element.querySelector("select") as HTMLSelectElement | null)

    if (!selectEl) {
      throw new Error(
        `El elemento "${displaySelector}" no es un <select> válido.`
      )
    }

    const options = Array.from(selectEl.options)
    const matchedOption =
      options.find((opt) => opt.value === resolvedValue) ??
      options.find(
        (opt) =>
          (opt.textContent ?? "").trim().toLowerCase() ===
          resolvedValue.toLowerCase()
      )

    if (!matchedOption) {
      return {
        ok: false,
        message: `No se encontró la opción "${resolvedValue}" dentro de "${displaySelector}".`
      }
    }

    selectEl.focus()
    setNativeValue(selectEl, matchedOption.value)

    return {
      ok: true,
      message: `Opción "${matchedOption.textContent?.trim() || matchedOption.value}" seleccionada en "${displaySelector}"`
    }
  }

  if (step.type === "keypress") {
    const targetKey = step.key || "Enter"
    const keyToCodeMap: Record<string, string> = {
      Enter: "Enter",
      Tab: "Tab",
      Escape: "Escape",
      Backspace: "Backspace",
      ArrowDown: "ArrowDown",
      ArrowUp: "ArrowUp",
      Space: "Space"
    }
    const keyValue = targetKey === "Space" ? " " : targetKey
    const codeValue = keyToCodeMap[targetKey] ?? targetKey

    element.focus?.()

    const eventInit: KeyboardEventInit = {
      key: keyValue,
      code: codeValue,
      bubbles: true,
      cancelable: true
    }

    const notPrevented = element.dispatchEvent(
      new KeyboardEvent("keydown", eventInit)
    )
    element.dispatchEvent(new KeyboardEvent("keypress", eventInit))
    element.dispatchEvent(new KeyboardEvent("keyup", eventInit))

    if (targetKey === "Enter" && notPrevented) {
      const parentForm = element.closest("form")
      if (parentForm && typeof parentForm.requestSubmit === "function") {
        parentForm.requestSubmit()
      }
    }

    return {
      ok: true,
      message: `Tecla "${targetKey}" presionada en "${displaySelector}"`
    }
  }

  if (step.type === "extract") {
    const source = step.extractSource ?? "textContent"
    const columnName = step.outputColumn?.trim() || "extraido"
    let extractedValue = ""

    if (source === "value") {
      if (
        element instanceof HTMLInputElement ||
        element instanceof HTMLTextAreaElement ||
        element instanceof HTMLSelectElement
      ) {
        extractedValue = element.value ?? ""
      } else {
        extractedValue = element.getAttribute("value") ?? ""
      }
    } else if (source === "attribute") {
      const attrName = step.extractAttribute?.trim()
      if (!attrName) {
        return {
          ok: false,
          message: `El paso "${step.label}" requiere especificar el nombre del atributo HTML a extraer.`
        }
      }
      extractedValue = element.getAttribute(attrName) ?? ""
    } else {
      extractedValue = (element.innerText || element.textContent || "").trim()
    }

    const preview =
      extractedValue.length > 60
        ? `${extractedValue.slice(0, 60)}...`
        : extractedValue

    return {
      ok: true,
      extractedValue,
      message: `Extraído [${columnName}]: "${preview}"`
    }
  }

  return {
    ok: false,
    message: `Tipo de acción desconocido: ${String(step.type)}`
  }
}

async function handleInspectListPage(
  itemSelector: string
): Promise<InspectListPageResponse> {
  const trimmed = itemSelector.trim()
  if (!trimmed) {
    return {
      ok: false,
      message: "El selector del contenedor repetitivo está vacío.",
      count: 0,
      pageSignature: ""
    }
  }

  try {
    await waitForElement(trimmed, 4000).catch(() => null)
    const nodes = Array.from(document.querySelectorAll(trimmed))
    const count = nodes.length

    const firstSample = (nodes[0]?.textContent ?? "").trim().slice(0, 120)
    const secondSample = (nodes[1]?.textContent ?? "").trim().slice(0, 120)
    const lastSample = (nodes[count - 1]?.textContent ?? "")
      .trim()
      .slice(0, 120)
    const pageSignature = `${location.href}|${count}|${firstSample}|${secondSample}|${lastSample}`

    return {
      ok: true,
      message: `Se detectaron ${count} elementos para "${trimmed}".`,
      count,
      pageSignature
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return {
      ok: false,
      message: `Selector de lista inválido "${trimmed}": ${msg}`,
      count: 0,
      pageSignature: ""
    }
  }
}

function isPaginationElementDisabled(el: HTMLElement): boolean {
  if (el.hasAttribute("disabled")) return true
  if (el.getAttribute("aria-disabled")?.toLowerCase() === "true") return true
  if (
    el.classList.contains("disabled") ||
    el.classList.contains("is-disabled")
  ) {
    return true
  }

  const disabledAncestor = el.closest(
    "[disabled], [aria-disabled='true'], .disabled, .is-disabled, li.disabled"
  )
  if (disabledAncestor) return true

  const style = window.getComputedStyle(el)
  if (
    style.display === "none" ||
    style.visibility === "hidden" ||
    style.pointerEvents === "none"
  ) {
    return true
  }

  const rect = el.getBoundingClientRect()
  if (rect.width === 0 && rect.height === 0) {
    return true
  }

  return false
}

async function handleClickNextPage(
  nextButtonSelector: string
): Promise<ClickNextPageResponse> {
  const trimmed = nextButtonSelector.trim()
  if (!trimmed) {
    return {
      ok: false,
      hasNextPage: false,
      message: "No se configuró el selector del botón 'Siguiente página'."
    }
  }

  let rawElement: Element | null = null
  try {
    rawElement = document.querySelector(trimmed)
  } catch (err) {
    return {
      ok: false,
      hasNextPage: false,
      message: `Selector de paginación inválido "${trimmed}": ${String(err)}`
    }
  }

  if (!rawElement) {
    return {
      ok: true,
      hasNextPage: false,
      message:
        "No se encontró el botón de siguiente página (fin de paginación)."
    }
  }

  const element = rawElement as HTMLElement
  if (isPaginationElementDisabled(element)) {
    return {
      ok: true,
      hasNextPage: false,
      message:
        "El botón de siguiente página está deshabilitado (última página alcanzada)."
    }
  }

  element.scrollIntoView({
    block: "center",
    inline: "nearest",
    behavior: "smooth"
  })
  flashElementHighlight(element)

  element.focus?.()
  element.dispatchEvent(
    new MouseEvent("mousedown", { bubbles: true, cancelable: true })
  )
  element.dispatchEvent(
    new MouseEvent("mouseup", { bubbles: true, cancelable: true })
  )
  element.click()

  return {
    ok: true,
    hasNextPage: true,
    message: `Clic ejecutado en botón de siguiente página (${trimmed}).`
  }
}

chrome.runtime.onMessage.addListener(
  (message: ContentScriptRequest, _sender, sendResponse) => {
    if (!message || typeof message.type !== "string") {
      return false
    }

    if (message.type === "EXECUTE_STEP") {
      executeDomStep(
        message.step,
        message.record,
        message.listItemSelector,
        message.recordIndex
      )
        .then((res) => sendResponse(res))
        .catch((error: unknown) => {
          const errorMsg =
            error instanceof Error ? error.message : String(error)
          sendResponse({
            ok: false,
            message: errorMsg
          } satisfies ExecuteStepResponse)
        })
      return true
    }

    if (message.type === "INSPECT_LIST_PAGE") {
      handleInspectListPage(message.itemSelector)
        .then((res) => sendResponse(res))
        .catch((error: unknown) => {
          const errorMsg =
            error instanceof Error ? error.message : String(error)
          sendResponse({
            ok: false,
            message: errorMsg,
            count: 0,
            pageSignature: ""
          } satisfies InspectListPageResponse)
        })
      return true
    }

    if (message.type === "CLICK_NEXT_PAGE") {
      handleClickNextPage(message.nextButtonSelector)
        .then((res) => sendResponse(res))
        .catch((error: unknown) => {
          const errorMsg =
            error instanceof Error ? error.message : String(error)
          sendResponse({
            ok: false,
            hasNextPage: false,
            message: errorMsg
          } satisfies ClickNextPageResponse)
        })
      return true
    }

    return false
  }
)
