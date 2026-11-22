import type { PlasmoCSConfig } from "plasmo"
import { generateCandidateSelectors } from "~contents/helpers/dom-selectors"
import {
  RL_TAU_MIN,
  buildElementFingerprint,
  buildInitialSelectorCandidates,
  computeSimilarityScore,
  exploreAndHealInContainer,
  rankCandidatesByUCB1,
  upsertCandidateInPool
} from "~contents/helpers/selector-rl-engine"
import type {
  ClickNextPageResponse,
  ContentScriptRequest,
  DataRecord,
  ElementFingerprint,
  ExecuteStepResponse,
  ExtractTableRowPayload,
  ExtractTableRowResponse,
  InspectListPageResponse,
  InspectTablePageResponse,
  SelectorCandidate,
  TableExtractColumnConfig,
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

interface ResolvedTargetOutcome {
  ok: true
  element: HTMLElement
  updatedCandidates?: SelectorCandidate[]
  healedSelector?: string
  healedSimilarity?: number
  activeSelectorUsed?: string
  bootstrappedFingerprint?: ElementFingerprint
}

interface FailedTargetOutcome {
  ok: false
  message: string
  updatedCandidates?: SelectorCandidate[]
}

function hasRequiredExtractData(el: Element, step: WorkflowStep): boolean {
  if (step.type !== "extract") return true
  const source = step.extractSource ?? "textContent"
  if (source === "attribute" && step.extractAttribute?.trim()) {
    const val = el.getAttribute(step.extractAttribute.trim())
    return Boolean(val && val.trim())
  }
  if (source === "textContent") {
    return Boolean((el.textContent ?? "").replace(/\s+/g, " ").trim())
  }
  return true
}

function buildWorkingCandidatePool(
  step: WorkflowStep,
  primarySelector: string
): SelectorCandidate[] {
  const existing = Array.isArray(step.selectorCandidates)
    ? [...step.selectorCandidates]
    : []

  if (existing.length === 0) {
    return buildInitialSelectorCandidates([{ selector: primarySelector }])
  }

  const hasPrimary = existing.some((c) => c.selector === primarySelector)
  const ordered = rankCandidatesByUCB1(existing, primarySelector)

  if (!hasPrimary && primarySelector) {
    return [
      {
        selector: primarySelector,
        qValue: 0.92,
        successCount: 0,
        failCount: 0,
        source: "initial"
      },
      ...ordered
    ]
  }

  return ordered
}

function probeCandidatePool(
  orderedPool: SelectorCandidate[],
  step: WorkflowStep,
  container: Element,
  queryRoot: Document | Element,
  primarySelector: string
): {
  matchedCandidate?: SelectorCandidate
  element?: HTMLElement
  similarity?: number
  softFallback?: { candidate: SelectorCandidate; element: HTMLElement; sim: number }
  penalties: Array<{ selector: string; reward: number; source: "initial" | "healed" }>
} {
  const penalties: Array<{
    selector: string
    reward: number
    source: "initial" | "healed"
  }> = []
  let softFallback:
    | { candidate: SelectorCandidate; element: HTMLElement; sim: number }
    | undefined

  for (const cand of orderedPool) {
    let foundEl: Element | null = null
    try {
      foundEl = queryRoot.querySelector(cand.selector)
    } catch {
      penalties.push({ selector: cand.selector, reward: -1, source: cand.source })
      continue
    }

    if (!foundEl) {
      penalties.push({ selector: cand.selector, reward: -1, source: cand.source })
      continue
    }

    const hasData = hasRequiredExtractData(foundEl, step)
    if (!step.targetFingerprint) {
      if (hasData) {
        return {
          matchedCandidate: cand,
          element: foundEl as HTMLElement,
          penalties
        }
      }
      if (!softFallback) {
        softFallback = {
          candidate: cand,
          element: foundEl as HTMLElement,
          sim: 0.5
        }
      }
      penalties.push({ selector: cand.selector, reward: -0.5, source: cand.source })
      continue
    }

    const sim = computeSimilarityScore(
      foundEl,
      step.targetFingerprint,
      container,
      step
    )

    if (sim >= RL_TAU_MIN && hasData) {
      return {
        matchedCandidate: cand,
        element: foundEl as HTMLElement,
        similarity: sim,
        penalties
      }
    }

    // Keep primary selector match as last-resort fallback so minor layout/text changes never break working steps
    if (
      !softFallback &&
      sim >= 0.42 &&
      (cand.selector === primarySelector || orderedPool.length === 1)
    ) {
      softFallback = {
        candidate: cand,
        element: foundEl as HTMLElement,
        sim
      }
    }

    penalties.push({ selector: cand.selector, reward: -0.5, source: cand.source })
  }

  return { softFallback, penalties }
}

function applyPenaltiesToPool(
  basePool: SelectorCandidate[],
  penalties: Array<{ selector: string; reward: number; source: "initial" | "healed" }>
): SelectorCandidate[] {
  let pool = [...basePool]
  for (const p of penalties) {
    pool = upsertCandidateInPool(pool, p.selector, p.reward, p.source)
  }
  return pool
}

function buildSuccessOutcome(
  element: HTMLElement,
  step: WorkflowStep,
  container: Element,
  workingPool: SelectorCandidate[],
  penalties: Array<{ selector: string; reward: number; source: "initial" | "healed" }>,
  matchedSelector: string,
  matchedSource: "initial" | "healed",
  reward: number,
  extra?: { healedSelector?: string; healedSimilarity?: number }
): ResolvedTargetOutcome {
  let nextPool = workingPool
  let bootstrappedFingerprint: ElementFingerprint | undefined

  if (!step.targetFingerprint && (!step.selectorCandidates || step.selectorCandidates.length === 0)) {
    const isDocRoot = container === document.body
    bootstrappedFingerprint = buildElementFingerprint(
      element,
      isDocRoot ? undefined : container,
      step
    )
    const generated = generateCandidateSelectors(
      element,
      isDocRoot ? undefined : container
    )
    nextPool = buildInitialSelectorCandidates([
      { selector: matchedSelector },
      ...generated.map((selector) => ({ selector }))
    ])
  } else {
    nextPool = applyPenaltiesToPool(workingPool, penalties)
  }

  nextPool = upsertCandidateInPool(
    nextPool,
    matchedSelector,
    Math.max(0.55, reward),
    matchedSource,
    reward
  )

  return {
    ok: true,
    element,
    updatedCandidates: nextPool,
    activeSelectorUsed: matchedSelector,
    bootstrappedFingerprint,
    ...extra
  }
}

async function resolveWithAdaptivePool(
  step: WorkflowStep,
  container: Element,
  queryRoot: Document | Element,
  primarySelector: string,
  allowSettleDelay: boolean,
  waitFallbackTimeoutMs: number
): Promise<ResolvedTargetOutcome | FailedTargetOutcome> {
  const workingPool = buildWorkingCandidatePool(step, primarySelector)

  let probe = probeCandidatePool(
    workingPool,
    step,
    container,
    queryRoot,
    primarySelector
  )

  if (probe.matchedCandidate && probe.element) {
    return buildSuccessOutcome(
      probe.element,
      step,
      container,
      workingPool,
      probe.penalties,
      probe.matchedCandidate.selector,
      probe.matchedCandidate.source,
      probe.similarity ?? 0.85
    )
  }

  if (allowSettleDelay && !probe.softFallback) {
    await new Promise((resolve) => setTimeout(resolve, 180))
    probe = probeCandidatePool(
      workingPool,
      step,
      container,
      queryRoot,
      primarySelector
    )
    if (probe.matchedCandidate && probe.element) {
      return buildSuccessOutcome(
        probe.element,
        step,
        container,
        workingPool,
        probe.penalties,
        probe.matchedCandidate.selector,
        probe.matchedCandidate.source,
        probe.similarity ?? 0.85
      )
    }
  }

  if (step.targetFingerprint) {
    const healed = exploreAndHealInContainer(
      container,
      step.targetFingerprint,
      step
    )
    if (healed) {
      const bonusOverFallback =
        !probe.softFallback || healed.similarity >= probe.softFallback.sim + 0.08
      if (bonusOverFallback) {
        return buildSuccessOutcome(
          healed.element,
          step,
          container,
          workingPool,
          probe.penalties,
          healed.synthesizedSelector,
          "healed",
          healed.similarity,
          {
            healedSelector: healed.synthesizedSelector,
            healedSimilarity: healed.similarity
          }
        )
      }
    }
  }

  if (probe.softFallback) {
    return buildSuccessOutcome(
      probe.softFallback.element,
      step,
      container,
      workingPool,
      [],
      probe.softFallback.candidate.selector,
      probe.softFallback.candidate.source,
      Math.max(0.55, probe.softFallback.sim)
    )
  }

  try {
    const delayedElement =
      queryRoot === document
        ? await waitForElement(primarySelector, waitFallbackTimeoutMs)
        : await waitForScopedElement(
            container,
            primarySelector,
            waitFallbackTimeoutMs
          )
    return buildSuccessOutcome(
      delayedElement as HTMLElement,
      step,
      container,
      workingPool,
      [],
      primarySelector,
      "initial",
      0.75
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return {
      ok: false,
      message: msg,
      updatedCandidates: applyPenaltiesToPool(workingPool, probe.penalties)
    }
  }
}

async function resolveStepTargetElement(
  step: WorkflowStep,
  listItemSelector: string | undefined,
  recordIndex: number
): Promise<ResolvedTargetOutcome | FailedTargetOutcome> {
  const trimmedListSelector = listItemSelector?.trim()
  if (trimmedListSelector) {
    try {
      await waitForElement(trimmedListSelector, 8000)
    } catch (err) {
      return {
        ok: false,
        message: err instanceof Error ? err.message : String(err)
      }
    }

    const items = document.querySelectorAll(trimmedListSelector)
    const container = items[recordIndex] as HTMLElement | undefined
    if (!container) {
      return {
        ok: false,
        message: `No se encontró el elemento #${recordIndex + 1} para la lista "${trimmedListSelector}" (total en página: ${items.length}).`
      }
    }

    // Desplazar primero hacia el contenedor para disparar IntersectionObserver / lazy-loading de imágenes y precios
    container.scrollIntoView({
      block: "center",
      inline: "nearest",
      behavior: "smooth"
    })

    const subSelector = step.selector?.trim()
    if (!subSelector || subSelector === ":scope") {
      return { ok: true, element: container }
    }

    return resolveWithAdaptivePool(step, container, container, subSelector, true, 2200)
  }

  if (!step.selector || !step.selector.trim()) {
    return {
      ok: false,
      message: `El paso "${step.label}" no tiene un selector CSS configurado.`
    }
  }

  return resolveWithAdaptivePool(
    step,
    document.body,
    document,
    step.selector.trim(),
    false,
    4500
  )
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

  const resolved = await resolveStepTargetElement(
    step,
    listItemSelector,
    recordIndex
  )

  if (resolved.ok === false) {
    return {
      ok: false,
      message: resolved.message,
      ...(resolved.updatedCandidates
        ? { updatedCandidates: resolved.updatedCandidates }
        : {})
    }
  }

  const element = resolved.element

  const enrichResponse = (base: ExecuteStepResponse): ExecuteStepResponse => ({
    ...base,
    ...(resolved.updatedCandidates
      ? { updatedCandidates: resolved.updatedCandidates }
      : {}),
    ...(resolved.healedSelector
      ? { healedSelector: resolved.healedSelector }
      : {}),
    ...(resolved.healedSimilarity !== undefined
      ? { healedSimilarity: resolved.healedSimilarity }
      : {}),
    ...(resolved.activeSelectorUsed
      ? { activeSelectorUsed: resolved.activeSelectorUsed }
      : {}),
    ...(resolved.bootstrappedFingerprint
      ? { bootstrappedFingerprint: resolved.bootstrappedFingerprint }
      : {})
  })

  element.scrollIntoView({
    block: "center",
    inline: "nearest",
    behavior: "smooth"
  })
  flashElementHighlight(element)

  const displaySelector =
    resolved.activeSelectorUsed ||
    step.selector?.trim() ||
    listItemSelector ||
    ":scope"

  if (step.type === "click") {
    element.focus?.()
    element.dispatchEvent(
      new MouseEvent("mousedown", { bubbles: true, cancelable: true })
    )
    element.dispatchEvent(
      new MouseEvent("mouseup", { bubbles: true, cancelable: true })
    )
    element.click()

    return enrichResponse({
      ok: true,
      message: `Clic ejecutado en "${displaySelector}"`
    })
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
        return enrichResponse({
          ok: false,
          message: `El elemento "${displaySelector}" no es un campo editable (input/textarea/contenteditable).`
        })
      }
    }

    return enrichResponse({
      ok: true,
      message: `Texto "${resolvedValue}" escrito en "${displaySelector}"`
    })
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
      return enrichResponse({
        ok: false,
        message: `El elemento "${displaySelector}" no es un <select> válido.`
      })
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
      return enrichResponse({
        ok: false,
        message: `No se encontró la opción "${resolvedValue}" dentro de "${displaySelector}".`
      })
    }

    selectEl.focus()
    setNativeValue(selectEl, matchedOption.value)

    return enrichResponse({
      ok: true,
      message: `Opción "${matchedOption.textContent?.trim() || matchedOption.value}" seleccionada en "${displaySelector}"`
    })
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

    return enrichResponse({
      ok: true,
      message: `Tecla "${targetKey}" presionada en "${displaySelector}"`
    })
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
        return enrichResponse({
          ok: false,
          message: `El paso "${step.label}" requiere especificar el nombre del atributo HTML a extraer.`
        })
      }
      extractedValue = element.getAttribute(attrName) ?? ""
    } else {
      extractedValue = (element.innerText || element.textContent || "").trim()
    }

    const preview =
      extractedValue.length > 60
        ? `${extractedValue.slice(0, 60)}...`
        : extractedValue

    return enrichResponse({
      ok: true,
      extractedValue,
      message: `Extraído [${columnName}]: "${preview}"`
    })
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

function getTableRows(tableEl: Element): HTMLTableRowElement[] {
  if (tableEl instanceof HTMLTableElement) {
    return Array.from(tableEl.rows)
  }
  const ownerTable = tableEl.closest("table")
  return Array.from(tableEl.querySelectorAll("tr")).filter(
    (tr): tr is HTMLTableRowElement =>
      tr instanceof HTMLTableRowElement &&
      (!ownerTable || tr.closest("table") === ownerTable)
  )
}

function getRowCells(row: HTMLTableRowElement): HTMLTableCellElement[] {
  return Array.from(row.cells)
}

function normalizeCellText(raw: string | null | undefined): string {
  return (raw ?? "").replace(/\s+/g, " ").trim()
}

function buildUniqueHeaderNames(cells: Element[]): string[] {
  const used = new Set<string>()
  return cells.map((cell, index) => {
    const base = normalizeCellText(cell.textContent) || `columna_${index + 1}`
    let candidate = base
    let suffix = 2
    while (used.has(candidate)) {
      candidate = `${base}_${suffix}`
      suffix++
    }
    used.add(candidate)
    return candidate
  })
}

function extractCellValue(cell: Element, col: TableExtractColumnConfig): string {
  if (col.source === "value") {
    const control = cell.querySelector("input, select, textarea")
    if (
      control instanceof HTMLInputElement ||
      control instanceof HTMLTextAreaElement ||
      control instanceof HTMLSelectElement
    ) {
      return (control.value ?? "").trim()
    }
    if (
      cell instanceof HTMLInputElement ||
      cell instanceof HTMLTextAreaElement ||
      cell instanceof HTMLSelectElement
    ) {
      return (cell.value ?? "").trim()
    }
    return (cell.getAttribute("value") ?? "").trim()
  }

  if (col.source === "attribute") {
    const attrName = col.attribute?.trim() || "href"
    const directAttr = cell.getAttribute(attrName)
    if (directAttr !== null) {
      return directAttr.trim()
    }
    const childWithAttr = Array.from(cell.querySelectorAll("*")).find((el) =>
      el.hasAttribute(attrName)
    )
    return childWithAttr ? (childWithAttr.getAttribute(attrName) ?? "").trim() : ""
  }

  return normalizeCellText(cell.textContent)
}

async function handleInspectTablePage(
  tableSelector: string,
  headerRowIndex: number
): Promise<InspectTablePageResponse> {
  const trimmed = tableSelector.trim()
  if (!trimmed) {
    return {
      ok: false,
      message: "El selector CSS de la tabla está vacío.",
      totalRows: 0,
      dataRowCount: 0,
      headers: [],
      pageSignature: ""
    }
  }

  let tableEl: Element
  try {
    tableEl = await waitForElement(trimmed, 8000)
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : String(err),
      totalRows: 0,
      dataRowCount: 0,
      headers: [],
      pageSignature: ""
    }
  }

  const rows = getTableRows(tableEl)
  if (rows.length === 0) {
    return {
      ok: false,
      message: `La tabla "${trimmed}" no contiene filas (<tr>).`,
      totalRows: 0,
      dataRowCount: 0,
      headers: [],
      pageSignature: ""
    }
  }

  const safeHeaderIndex = Math.max(1, Math.floor(headerRowIndex || 1))
  if (safeHeaderIndex > rows.length) {
    return {
      ok: false,
      message: `La fila de cabecera #${safeHeaderIndex} excede el total de filas de la tabla (${rows.length}).`,
      totalRows: rows.length,
      dataRowCount: 0,
      headers: [],
      pageSignature: ""
    }
  }

  const headerRow = rows[safeHeaderIndex - 1]
  const headers = buildUniqueHeaderNames(getRowCells(headerRow))
  const dataRows = rows.slice(safeHeaderIndex)
  const dataRowCount = dataRows.length

  const firstDataSig = dataRows[0]
    ? normalizeCellText(dataRows[0].textContent).slice(0, 80)
    : ""
  const lastDataSig =
    dataRows.length > 1
      ? normalizeCellText(dataRows[dataRows.length - 1].textContent).slice(0, 80)
      : ""
  const pageSignature = `${rows.length}::${firstDataSig}::${lastDataSig}`

  return {
    ok: true,
    message: `Tabla detectada: ${headers.length} columnas y ${dataRowCount} filas de datos.`,
    totalRows: rows.length,
    dataRowCount,
    headers,
    pageSignature
  }
}

async function handleExtractTableRow(
  payload: ExtractTableRowPayload
): Promise<ExtractTableRowResponse> {
  const trimmed = payload.tableSelector.trim()
  if (!trimmed) {
    return {
      ok: false,
      message: "El selector CSS de la tabla está vacío."
    }
  }

  let tableEl: Element
  try {
    tableEl = await waitForElement(trimmed, 8000)
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : String(err)
    }
  }

  const rows = getTableRows(tableEl)
  const safeHeaderIndex = Math.max(1, Math.floor(payload.headerRowIndex || 1))
  const targetRowIndex = safeHeaderIndex + payload.dataRowIndex

  if (targetRowIndex < safeHeaderIndex || targetRowIndex >= rows.length) {
    return {
      ok: false,
      message: `Fila de datos #${payload.dataRowIndex + 1} fuera de rango (total filas tras cabecera: ${Math.max(0, rows.length - safeHeaderIndex)}).`
    }
  }

  const row = rows[targetRowIndex]
  row.scrollIntoView({
    block: "center",
    inline: "nearest",
    behavior: "smooth"
  })
  flashElementHighlight(row)

  const cells = getRowCells(row)
  const activeColumns: TableExtractColumnConfig[] =
    payload.columns.length > 0
      ? payload.columns
      : cells.map((_, index) => ({
          index,
          name: `columna_${index + 1}`,
          source: "textContent"
        }))

  const rowData: Record<string, string> = {}
  for (const col of activeColumns) {
    const cell = cells[col.index]
    const outKey = col.name.trim() || `columna_${col.index + 1}`
    rowData[outKey] = cell ? extractCellValue(cell, col) : ""
  }

  return {
    ok: true,
    message: `Fila #${payload.dataRowIndex + 1} extraída (${Object.keys(rowData).length} columnas).`,
    rowData
  }
}

const actionExecutorGuardKey = `__autoloop_ae_${chrome.runtime?.id ?? "default"}`
const globalRecord = globalThis as unknown as Record<string, boolean>

if (!globalRecord[actionExecutorGuardKey]) {
  globalRecord[actionExecutorGuardKey] = true

  chrome.runtime.onMessage.addListener(
    (message: ContentScriptRequest, _sender, sendResponse) => {
      if (!chrome.runtime?.id || !message || typeof message.type !== "string") {
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

    if (message.type === "INSPECT_TABLE_PAGE") {
      handleInspectTablePage(message.tableSelector, message.headerRowIndex)
        .then((res) => sendResponse(res))
        .catch((error: unknown) => {
          const errorMsg =
            error instanceof Error ? error.message : String(error)
          sendResponse({
            ok: false,
            message: errorMsg,
            totalRows: 0,
            dataRowCount: 0,
            headers: [],
            pageSignature: ""
          } satisfies InspectTablePageResponse)
        })
      return true
    }

    if (message.type === "EXTRACT_TABLE_ROW") {
      handleExtractTableRow(message)
        .then((res) => sendResponse(res))
        .catch((error: unknown) => {
          const errorMsg =
            error instanceof Error ? error.message : String(error)
          sendResponse({
            ok: false,
            message: errorMsg
          } satisfies ExtractTableRowResponse)
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
}
