import { finder } from "@medv/finder"
import cssText from "data-text:~style.css"
import type { PlasmoCSConfig } from "plasmo"
import { useEffect, useState } from "react"
import { useStorage } from "@plasmohq/storage/hook"
import {
  DEFAULT_DOM_LIST_CONFIG,
  DEFAULT_EXECUTION_STATE,
  DEFAULT_TABLE_EXTRACT_CONFIG,
  DEFAULT_WORKFLOW_MODE,
  SAMPLE_STEPS,
  STORAGE_KEYS,
  workflowStorage
} from "~storage/workflow-storage"
import type {
  ContentScriptRequest,
  DomListConfig,
  ExecutionState,
  TableExtractColumnConfig,
  TableExtractConfig,
  WorkflowMode,
  WorkflowStep
} from "~types/workflow"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"]
}

export const getShadowHostId = () => "autoloop-picker-csui"

export const mountShadowHost = ({
  shadowHost
}: {
  shadowHost: Element
}) => {
  document
    .querySelectorAll("plasmo-csui, #autoloop-picker-csui, #__plasmo-loading__")
    .forEach((el) => {
      if (el !== shadowHost) {
        el.remove()
      }
    })

  if (shadowHost instanceof HTMLElement) {
    shadowHost.style.setProperty("position", "fixed", "important")
    shadowHost.style.setProperty("top", "0px", "important")
    shadowHost.style.setProperty("left", "0px", "important")
    shadowHost.style.setProperty("width", "0px", "important")
    shadowHost.style.setProperty("height", "0px", "important")
    shadowHost.style.setProperty("overflow", "visible", "important")
    shadowHost.style.setProperty("z-index", "2147483647", "important")
    shadowHost.style.setProperty("pointer-events", "none", "important")
    shadowHost.style.setProperty("display", "block", "important")
    shadowHost.style.setProperty("visibility", "visible", "important")
    shadowHost.style.setProperty("opacity", "1", "important")
  }

  document.documentElement.appendChild(shadowHost)
}

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}

interface HighlightBox {
  top: number
  left: number
  width: number
  height: number
  tagName: string
  previewSelector: string
  matchCount?: number
  totalListCount?: number
  customBadge?: string
}

function getTableRows(tableEl: HTMLTableElement): HTMLTableRowElement[] {
  return Array.from(tableEl.rows)
}

function extractHeadersFromRow(
  row: HTMLTableRowElement,
  prevColumns?: TableExtractColumnConfig[]
): TableExtractColumnConfig[] {
  const cells = Array.from(row.cells)
  const preservePrevSettings =
    Array.isArray(prevColumns) && prevColumns.length === cells.length
  const used = new Set<string>()

  return cells.map((cell, index) => {
    const rawText = (cell.textContent ?? "").replace(/\s+/g, " ").trim()
    const baseName = rawText || `columna_${index + 1}`
    let candidate = baseName
    let suffix = 2
    while (used.has(candidate)) {
      candidate = `${baseName}_${suffix}`
      suffix++
    }
    used.add(candidate)

    const prev = preservePrevSettings ? prevColumns[index] : undefined
    return {
      index,
      name: candidate,
      source: prev?.source ?? "textContent",
      attribute: prev?.attribute
    }
  })
}

function isStableClassName(cls: string): boolean {
  if (!cls || cls.length <= 1) return false
  if (/^[0-9]/.test(cls)) return false
  if (cls.includes(":") || cls.includes("[") || cls.includes("]")) return false
  // Styled-JSX / CSS-in-JS dynamic classes
  if (/^jsx-\d+$/i.test(cls)) return false
  if (/^css-[a-z0-9]{5,}$/i.test(cls)) return false
  if (/^sc-[a-z0-9]{5,}$/i.test(cls)) return false
  return true
}

function getStableClasses(el: Element): string[] {
  return Array.from(el.classList).filter(isStableClassName)
}

function buildElementTagAndClassSelector(el: Element): string {
  const tag = el.tagName.toLowerCase()
  const classes = getStableClasses(el).slice(0, 2)
  if (classes.length === 0) {
    return tag
  }
  return `${tag}.${classes.map((c) => CSS.escape(c)).join(".")}`
}

function inferStepNameAndColumn(target: Element): {
  labelSuffix: string
  columnName: string
} {
  const rawTag = target.tagName.toLowerCase()
  const cleanClasses = getStableClasses(target)
  const columnName =
    cleanClasses.length > 0 ? `${rawTag}_${cleanClasses[0]}` : `${rawTag}_col`

  const textSnippet = (target.textContent ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 24)
  const labelSuffix = cleanClasses[0] || textSnippet || rawTag
  return { labelSuffix, columnName }
}

function countMatchingListContainers(
  itemSelector: string,
  relativeSelector: string
): { matched: number; total: number } {
  try {
    const containers = Array.from(document.querySelectorAll(itemSelector))
    const total = containers.length
    if (total === 0) return { matched: 0, total: 0 }
    if (!relativeSelector || relativeSelector === ":scope") {
      return { matched: total, total }
    }

    let matched = 0
    for (const container of containers) {
      if (container.querySelector(relativeSelector)) {
        matched++
      }
    }
    return { matched, total }
  } catch {
    return { matched: 0, total: 0 }
  }
}

function extractStableIdPrefix(rawId: string): string | null {
  if (!rawId) return null
  const match = rawId.match(/^([a-zA-Z][a-zA-Z0-9_-]*?[-_])(?:\d|https?:)/i)
  if (match && match[1] && match[1].length >= 4) {
    return match[1]
  }
  return null
}

function buildStructuralRelativePath(el: Element, itemRoot: Element): string {
  const segments: string[] = []
  let current: Element | null = el

  while (current && current !== itemRoot && segments.length < 4) {
    segments.unshift(buildElementTagAndClassSelector(current))
    current = current.parentElement
  }

  return segments.join(" > ") || el.tagName.toLowerCase()
}

function computeRelativeListItemSelector(
  el: Element,
  itemRoot: Element,
  itemSelector: string
): { selector: string; matched: number; total: number } {
  const baseTotal = countMatchingListContainers(itemSelector, ":scope").total

  if (el === itemRoot) {
    return { selector: ":scope", matched: baseTotal, total: baseTotal }
  }

  const candidates: string[] = []

  try {
    const finderRelative = finder(el, {
      root: itemRoot,
      idName: () => false,
      className: isStableClassName,
      timeoutMs: 400
    })
    if (finderRelative && !finderRelative.includes("#")) {
      candidates.push(finderRelative)
    }
  } catch {
    // Continúa con candidatos alternativos
  }

  const idPrefix = extractStableIdPrefix(el.id)
  if (idPrefix) {
    const escapedPrefix = idPrefix.replace(/"/g, '\\"')
    candidates.push(`${el.tagName.toLowerCase()}[id^="${escapedPrefix}"]`)
  }

  const dataTestId =
    el.getAttribute("data-testid") || el.getAttribute("data-test-id")
  if (dataTestId && !/\d{4,}/.test(dataTestId)) {
    const escapedTestId = dataTestId.replace(/"/g, '\\"')
    candidates.push(
      `${el.tagName.toLowerCase()}[data-testid="${escapedTestId}"]`
    )
  }

  const tagAndClass = buildElementTagAndClassSelector(el)
  if (tagAndClass.includes(".")) {
    candidates.push(tagAndClass)
  }

  const structuralPath = buildStructuralRelativePath(el, itemRoot)
  candidates.push(structuralPath)

  candidates.push(el.tagName.toLowerCase())

  let bestSelector = candidates[0] ?? el.tagName.toLowerCase()
  let bestMatched = 0

  for (const candidate of candidates) {
    try {
      const firstMatchInCurrentItem = itemRoot.querySelector(candidate)
      if (!firstMatchInCurrentItem) continue

      const { matched } = countMatchingListContainers(itemSelector, candidate)
      const isExactTarget = firstMatchInCurrentItem === el
      const effectiveScore = isExactTarget ? matched + 0.5 : matched

      if (effectiveScore > bestMatched) {
        bestMatched = effectiveScore
        bestSelector = candidate
      }

      if (
        isExactTarget &&
        baseTotal > 1 &&
        matched >= Math.ceil(baseTotal * 0.8)
      ) {
        break
      }
    } catch {
      // Selector candidato inválido
    }
  }

  const finalStats = countMatchingListContainers(itemSelector, bestSelector)
  return {
    selector: bestSelector,
    matched: finalStats.matched,
    total: finalStats.total
  }
}

function computeRepeatingListSelector(target: Element): {
  element: Element
  selector: string
  count: number
} {
  let candidate: Element | null = target

  while (
    candidate &&
    candidate !== document.body &&
    candidate !== document.documentElement
  ) {
    const parent = candidate.parentElement
    if (!parent) break

    const candidateTag = candidate.tagName.toLowerCase()
    const sameTagSiblings = Array.from(parent.children).filter(
      (child) => child.tagName.toLowerCase() === candidateTag
    )

    if (sameTagSiblings.length >= 2) {
      const itemPart = buildElementTagAndClassSelector(candidate)
      let parentSelector = ""
      if (parent === document.body) {
        parentSelector = "body"
      } else {
        try {
          parentSelector = finder(parent, {
            root: document.body,
            className: isStableClassName,
            timeoutMs: 300
          })
        } catch {
          parentSelector = buildElementTagAndClassSelector(parent)
        }
      }

      const scopedCandidateSelector = `${parentSelector} > ${itemPart}`
      try {
        const directMatches = document.querySelectorAll(scopedCandidateSelector)
        if (directMatches.length >= 2) {
          return {
            element: candidate,
            selector: scopedCandidateSelector,
            count: directMatches.length
          }
        }
      } catch {
        // Fallback to simpler selector below
      }

      const fallbackScopedSelector = `${parentSelector} > ${candidateTag}`
      try {
        const tagMatches = document.querySelectorAll(fallbackScopedSelector)
        if (tagMatches.length >= 2) {
          return {
            element: candidate,
            selector: fallbackScopedSelector,
            count: tagMatches.length
          }
        }
      } catch {
        // Continue walking up
      }
    }

    candidate = parent
  }

  const fallbackSelector = buildElementTagAndClassSelector(target)
  try {
    const count = document.querySelectorAll(fallbackSelector).length
    return {
      element: target,
      selector: fallbackSelector,
      count
    }
  } catch {
    const tag = target.tagName.toLowerCase()
    return {
      element: target,
      selector: tag,
      count: document.querySelectorAll(tag).length
    }
  }
}

function computeSafeSelector(el: Element, rootEl?: Element): string {
  const effectiveRoot = rootEl ?? document.body
  if (el === document.body && !rootEl) {
    return "body"
  }

  try {
    if (effectiveRoot && effectiveRoot.contains(el)) {
      return finder(el, {
        root: effectiveRoot,
        className: isStableClassName,
        timeoutMs: 400
      })
    }
  } catch {
    // Fallback below
  }

  if (el.id && !rootEl) {
    return `#${CSS.escape(el.id)}`
  }
  return buildElementTagAndClassSelector(el)
}

function isExtensionOverlayElement(el: Element | null): boolean {
  if (!el) return true
  if (el === document.documentElement) return true
  const tagName = el.tagName?.toLowerCase()
  if (tagName === "plasmo-csui") return true
  if (
    typeof el.closest === "function" &&
    (el.closest("plasmo-csui") || el.closest("#autoloop-picker-csui"))
  ) {
    return true
  }
  if (
    el.id === "autoloop-picker-csui" ||
    el.id === "plasmo-shadow-container" ||
    el.id === "rpa-picker-overlay-root" ||
    el.id === "__plasmo-loading__"
  ) {
    return true
  }
  return false
}

function getTargetPageElementAtPoint(
  clientX: number,
  clientY: number
): Element | null {
  try {
    const host =
      document.getElementById("autoloop-picker-csui") ??
      document.querySelector("plasmo-csui")
    const shadowHit = host?.shadowRoot?.elementFromPoint(clientX, clientY)
    if (
      shadowHit &&
      typeof shadowHit.closest === "function" &&
      shadowHit.closest("[data-autoloop-cancel-banner='true']")
    ) {
      return null
    }
  } catch {
    // Ignore shadow hit test errors
  }

  if (typeof document.elementsFromPoint === "function") {
    const stack = document.elementsFromPoint(clientX, clientY)
    for (const candidate of stack) {
      if (!isExtensionOverlayElement(candidate)) {
        return candidate
      }
    }
    return null
  }

  const single = document.elementFromPoint(clientX, clientY)
  if (!single || isExtensionOverlayElement(single)) {
    return null
  }
  return single
}

const PickerOverlay = () => {
  const [executionState, setExecutionState] = useStorage<ExecutionState>(
    {
      key: STORAGE_KEYS.EXECUTION_STATE,
      instance: workflowStorage
    },
    DEFAULT_EXECUTION_STATE
  )

  const [directExecutionState, setDirectExecutionState] =
    useState<ExecutionState | null>(null)

  const [steps, setSteps] = useStorage<WorkflowStep[]>(
    {
      key: STORAGE_KEYS.STEPS,
      instance: workflowStorage
    },
    SAMPLE_STEPS
  )

  const [workflowMode] = useStorage<WorkflowMode>(
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

  const [tableExtractConfig, setTableExtractConfig] =
    useStorage<TableExtractConfig>(
      {
        key: STORAGE_KEYS.TABLE_EXTRACT_CONFIG,
        instance: workflowStorage
      },
      DEFAULT_TABLE_EXTRACT_CONFIG
    )

  const [box, setBox] = useState<HighlightBox | null>(null)

  useEffect(() => {
    if (executionState) {
      setDirectExecutionState(null)
    }
  }, [executionState])

  useEffect(() => {
    if (!chrome.runtime?.onMessage) return

    const handleRuntimeMessage = (
      message: ContentScriptRequest,
      _sender: chrome.runtime.MessageSender,
      sendResponse: (response?: unknown) => void
    ) => {
      if (!chrome.runtime?.id || !message || typeof message.type !== "string") {
        return false
      }

      if (message.type === "PING_PICKER") {
        sendResponse({ ok: true })
        return false
      }

      if (message.type === "SYNC_PICKING_STATE") {
        setDirectExecutionState(message.executionState)
        if (message.executionState.status !== "picking") {
          setBox(null)
        }
        sendResponse({ ok: true })
        return false
      }

      return false
    }

    chrome.runtime.onMessage.addListener(handleRuntimeMessage)
    return () => {
      try {
        chrome.runtime.onMessage.removeListener(handleRuntimeMessage)
      } catch {
        // Context may have been invalidated
      }
    }
  }, [])

  const effectiveExecutionState =
    directExecutionState ?? executionState ?? DEFAULT_EXECUTION_STATE
  const isPicking = effectiveExecutionState?.status === "picking"
  const pickingTarget = effectiveExecutionState?.pickingTarget ?? "step"

  useEffect(() => {
    if (!isPicking) {
      setBox(null)
      return
    }

    const computeStepSelectorWithCoverage = (
      el: Element,
      overrideMode?: WorkflowMode,
      overrideDomConfig?: DomListConfig
    ): { selector: string; matched?: number; total?: number } => {
      const activeMode = overrideMode ?? workflowMode
      const configuredItemSelector = (
        overrideDomConfig ?? domListConfig
      )?.itemSelector?.trim()
      if (activeMode === "dom_list_extract" && configuredItemSelector) {
        try {
          const itemRoot = el.closest(configuredItemSelector)
          if (itemRoot) {
            return computeRelativeListItemSelector(
              el,
              itemRoot,
              configuredItemSelector
            )
          }
        } catch {
          // Invalid itemSelector, fallback to document selector
        }
      }
      return { selector: computeSafeSelector(el) }
    }

    const cleanupInvalidatedContext = () => {
      window.removeEventListener("mousemove", handleMouseMove, true)
      window.removeEventListener("click", handleClick, true)
      window.removeEventListener("keydown", handleKeyDown, true)
      setBox(null)
    }

    const handleMouseMove = (event: MouseEvent) => {
      try {
        if (!chrome.runtime?.id) {
          cleanupInvalidatedContext()
          return
        }

        const target = getTargetPageElementAtPoint(event.clientX, event.clientY)
        if (!target) {
          return
        }

        if (pickingTarget === "list_container") {
          const listInfo = computeRepeatingListSelector(target)
          const rect = listInfo.element.getBoundingClientRect()
          setBox({
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            tagName: listInfo.element.tagName.toLowerCase(),
            previewSelector: listInfo.selector,
            matchCount: listInfo.count
          })
          return
        }

        if (pickingTarget === "table_container") {
          const tableEl = target.closest("table") as HTMLTableElement | null
          const visualTarget = tableEl ?? target
          const rect = visualTarget.getBoundingClientRect()
          const rowCount = tableEl ? getTableRows(tableEl).length : 0
          setBox({
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            tagName: visualTarget.tagName.toLowerCase(),
            previewSelector: computeSafeSelector(visualTarget),
            customBadge: tableEl ? `Tabla (${rowCount} filas)` : "No es <table>"
          })
          return
        }

        if (pickingTarget === "table_header_row") {
          const rowEl = target.closest("tr") as HTMLTableRowElement | null
          const tableEl = rowEl?.closest("table") as HTMLTableElement | null
          const visualTarget = rowEl ?? target
          const rect = visualTarget.getBoundingClientRect()

          if (rowEl && tableEl) {
            const rows = getTableRows(tableEl)
            const rowIndex = rows.indexOf(rowEl)
            const colCount = rowEl.cells.length
            setBox({
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
              tagName: visualTarget.tagName.toLowerCase(),
              previewSelector: computeSafeSelector(tableEl),
              customBadge: `Fila #${rowIndex >= 0 ? rowIndex + 1 : 1} (${colCount} cols)`
            })
          } else {
            setBox({
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
              tagName: visualTarget.tagName.toLowerCase(),
              previewSelector: computeSafeSelector(visualTarget),
              customBadge: "Haz clic sobre una fila <tr>"
            })
          }
          return
        }

        const rect = target.getBoundingClientRect()
        if (pickingTarget === "pagination_next") {
          setBox({
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            tagName: target.tagName.toLowerCase(),
            previewSelector: computeSafeSelector(target)
          })
          return
        }

        const stepSelInfo = computeStepSelectorWithCoverage(target)
        setBox({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          tagName: target.tagName.toLowerCase(),
          previewSelector: stepSelInfo.selector,
          matchCount: stepSelInfo.matched,
          totalListCount: stepSelInfo.total
        })
      } catch (err) {
        console.warn("AutoLoop Picker mousemove error:", err)
      }
    }

    const finishPickingWithState = async (nextState: ExecutionState) => {
      setDirectExecutionState(nextState)
      setBox(null)
      await setExecutionState(nextState)
    }

    const handleClick = async (event: MouseEvent) => {
      try {
        if (!chrome.runtime?.id) {
          cleanupInvalidatedContext()
          return
        }

        const target = getTargetPageElementAtPoint(event.clientX, event.clientY)
        if (!target) {
          return
        }

        event.preventDefault()
        event.stopPropagation()
        event.stopImmediatePropagation()

        const timestamp = new Date().toLocaleTimeString()
        const latestExecutionState =
          (await workflowStorage.get<ExecutionState>(
            STORAGE_KEYS.EXECUTION_STATE
          )) ??
          effectiveExecutionState ??
          DEFAULT_EXECUTION_STATE

        const latestWorkflowMode =
          (await workflowStorage.get<WorkflowMode>(
            STORAGE_KEYS.WORKFLOW_MODE
          )) ??
          workflowMode ??
          DEFAULT_WORKFLOW_MODE

        if (pickingTarget === "list_container") {
          const listInfo = computeRepeatingListSelector(target)
          const latestDomConfig =
            (await workflowStorage.get<DomListConfig>(
              STORAGE_KEYS.DOM_LIST_CONFIG
            )) ??
            domListConfig ??
            DEFAULT_DOM_LIST_CONFIG

          await setDomListConfig({
            ...latestDomConfig,
            itemSelector: listInfo.selector
          })
          await finishPickingWithState({
            ...latestExecutionState,
            status: "idle",
            pickingTarget: undefined,
            pickingForStepId: undefined,
            lastPickedSelector: listInfo.selector,
            detectedListCount: listInfo.count,
            logs: [
              ...(latestExecutionState.logs ?? []).slice(-99),
              `[${timestamp}] Lista capturada: ${listInfo.selector} (${listInfo.count} elementos detectados)`
            ]
          })
          return
        }

        if (pickingTarget === "table_container") {
          const tableEl = target.closest("table") as HTMLTableElement | null
          const chosenTarget = tableEl ?? target
          const tableSelector = computeSafeSelector(chosenTarget)
          const latestTableConfig =
            (await workflowStorage.get<TableExtractConfig>(
              STORAGE_KEYS.TABLE_EXTRACT_CONFIG
            )) ??
            tableExtractConfig ??
            DEFAULT_TABLE_EXTRACT_CONFIG

          const rows = tableEl ? getTableRows(tableEl) : []
          const requestedHeaderRow = Math.max(
            1,
            latestTableConfig.headerRowIndex || 1
          )
          const safeHeaderRow =
            rows.length > 0 ? Math.min(requestedHeaderRow, rows.length) : 1
          const headerRowEl = rows[safeHeaderRow - 1]
          const detectedColumns = headerRowEl
            ? extractHeadersFromRow(headerRowEl)
            : []
          const dataRowCount =
            rows.length > 0 ? Math.max(0, rows.length - safeHeaderRow) : 0

          await setTableExtractConfig({
            ...latestTableConfig,
            tableSelector,
            headerRowIndex: safeHeaderRow,
            columns: detectedColumns
          })
          await finishPickingWithState({
            ...latestExecutionState,
            status: "idle",
            pickingTarget: undefined,
            pickingForStepId: undefined,
            lastPickedSelector: tableSelector,
            detectedTableRowCount: dataRowCount,
            detectedTableColumnCount: detectedColumns.length,
            logs: [
              ...(latestExecutionState.logs ?? []).slice(-99),
              `[${timestamp}] Tabla capturada: ${tableSelector} (${detectedColumns.length} cols, ${dataRowCount} filas)`
            ]
          })
          return
        }

        if (pickingTarget === "table_header_row") {
          const rowEl = target.closest("tr") as HTMLTableRowElement | null
          if (!rowEl) {
            return
          }

          const tableEl = rowEl.closest("table") as HTMLTableElement | null
          const latestTableConfig =
            (await workflowStorage.get<TableExtractConfig>(
              STORAGE_KEYS.TABLE_EXTRACT_CONFIG
            )) ??
            tableExtractConfig ??
            DEFAULT_TABLE_EXTRACT_CONFIG

          const rows = tableEl ? getTableRows(tableEl) : []
          const foundIndex = rows.indexOf(rowEl)
          const headerRowNumber = foundIndex >= 0 ? foundIndex + 1 : 1
          const detectedColumns = extractHeadersFromRow(
            rowEl,
            latestTableConfig.columns
          )
          const nextTableSelector =
            latestTableConfig.tableSelector?.trim() ||
            (tableEl
              ? computeSafeSelector(tableEl)
              : computeSafeSelector(rowEl))
          const dataRowCount =
            rows.length > 0 ? Math.max(0, rows.length - headerRowNumber) : 0

          await setTableExtractConfig({
            ...latestTableConfig,
            tableSelector: nextTableSelector,
            headerRowIndex: headerRowNumber,
            columns: detectedColumns
          })
          await finishPickingWithState({
            ...latestExecutionState,
            status: "idle",
            pickingTarget: undefined,
            pickingForStepId: undefined,
            lastPickedSelector: nextTableSelector,
            detectedTableRowCount: dataRowCount,
            detectedTableColumnCount: detectedColumns.length,
            logs: [
              ...(latestExecutionState.logs ?? []).slice(-99),
              `[${timestamp}] Fila cabecera #${headerRowNumber} capturada (${detectedColumns.length} cols, ${dataRowCount} filas)`
            ]
          })
          return
        }

        if (pickingTarget === "pagination_next") {
          const nextSelector = computeSafeSelector(target)

          if (latestWorkflowMode === "html_table_extract") {
            const latestTableConfig =
              (await workflowStorage.get<TableExtractConfig>(
                STORAGE_KEYS.TABLE_EXTRACT_CONFIG
              )) ??
              tableExtractConfig ??
              DEFAULT_TABLE_EXTRACT_CONFIG
            const currentPagination =
              latestTableConfig.pagination ??
              DEFAULT_TABLE_EXTRACT_CONFIG.pagination!

            await setTableExtractConfig({
              ...latestTableConfig,
              pagination: {
                ...currentPagination,
                enabled: true,
                nextButtonSelector: nextSelector
              }
            })
          } else {
            const latestDomConfig =
              (await workflowStorage.get<DomListConfig>(
                STORAGE_KEYS.DOM_LIST_CONFIG
              )) ??
              domListConfig ??
              DEFAULT_DOM_LIST_CONFIG
            const currentPagination =
              latestDomConfig.pagination ??
              DEFAULT_DOM_LIST_CONFIG.pagination!

            await setDomListConfig({
              ...latestDomConfig,
              pagination: {
                ...currentPagination,
                enabled: true,
                nextButtonSelector: nextSelector
              }
            })
          }

          await finishPickingWithState({
            ...latestExecutionState,
            status: "idle",
            pickingTarget: undefined,
            pickingForStepId: undefined,
            lastPickedSelector: nextSelector,
            logs: [
              ...(latestExecutionState.logs ?? []).slice(-99),
              `[${timestamp}] Botón Siguiente capturado: ${nextSelector}`
            ]
          })
          return
        }

        const latestDomConfig =
          (await workflowStorage.get<DomListConfig>(
            STORAGE_KEYS.DOM_LIST_CONFIG
          )) ??
          domListConfig ??
          DEFAULT_DOM_LIST_CONFIG

        const stepSelInfo = computeStepSelectorWithCoverage(
          target,
          latestWorkflowMode,
          latestDomConfig
        )
        const selector = stepSelInfo.selector
        const targetStepId =
          latestExecutionState.pickingForStepId ??
          effectiveExecutionState.pickingForStepId
        const latestSteps =
          (await workflowStorage.get<WorkflowStep[]>(STORAGE_KEYS.STEPS)) ??
          steps ??
          SAMPLE_STEPS

        if (targetStepId && Array.isArray(latestSteps)) {
          const inferred = inferStepNameAndColumn(target)
          const updatedSteps = latestSteps.map((step) => {
            if (step.id !== targetStepId) return step

            if (step.type === "extract") {
              const hasDefaultColumn =
                !step.outputColumn?.trim() ||
                /^dato_\d+$/.test(step.outputColumn.trim())
              const hasDefaultLabel =
                !step.label?.trim() ||
                /^Extraer dato de elemento\b/.test(step.label.trim())

              return {
                ...step,
                selector,
                outputColumn: hasDefaultColumn
                  ? inferred.columnName
                  : step.outputColumn,
                label: hasDefaultLabel
                  ? `Extraer ${inferred.labelSuffix}`
                  : step.label
              }
            }

            return { ...step, selector }
          })
          await setSteps(updatedSteps)
        }

        const coverageSuffix =
          stepSelInfo.matched !== undefined && stepSelInfo.total
            ? ` (coincide en ${stepSelInfo.matched}/${stepSelInfo.total} ítems)`
            : ""

        await finishPickingWithState({
          ...latestExecutionState,
          status: "idle",
          pickingTarget: undefined,
          pickingForStepId: undefined,
          lastPickedSelector: selector,
          logs: [
            ...(latestExecutionState.logs ?? []).slice(-99),
            `[${timestamp}] Selector capturado: ${selector}${coverageSuffix}`
          ]
        })
      } catch (err) {
        console.warn("AutoLoop Picker click error:", err)
      }
    }

    const handleKeyDown = async (event: KeyboardEvent) => {
      if (!chrome.runtime?.id) {
        cleanupInvalidatedContext()
        return
      }
      if (event.key === "Escape") {
        event.preventDefault()
        event.stopPropagation()
        await finishPickingWithState({
          ...effectiveExecutionState,
          status: "idle",
          pickingTarget: undefined,
          pickingForStepId: undefined
        })
      }
    }

    window.addEventListener("mousemove", handleMouseMove, true)
    window.addEventListener("click", handleClick, true)
    window.addEventListener("keydown", handleKeyDown, true)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove, true)
      window.removeEventListener("click", handleClick, true)
      window.removeEventListener("keydown", handleKeyDown, true)
    }
  }, [
    isPicking,
    pickingTarget,
    effectiveExecutionState,
    steps,
    workflowMode,
    domListConfig,
    tableExtractConfig,
    setExecutionState,
    setSteps,
    setDomListConfig,
    setTableExtractConfig
  ])

  if (!isPicking) {
    return null
  }

  const bannerMessage =
    pickingTarget === "list_container"
      ? "Modo Lista: haz clic sobre una tarjeta o fila repetitiva (ESC para cancelar)"
      : pickingTarget === "table_container"
        ? "Modo Tabla: haz clic sobre la tabla HTML que deseas extraer (ESC para cancelar)"
        : pickingTarget === "table_header_row"
          ? "Modo Cabecera: haz clic sobre la fila (<tr>) que contiene los encabezados (ESC para cancelar)"
          : pickingTarget === "pagination_next"
            ? "Modo Paginación: haz clic sobre el botón 'Siguiente página' (ESC para cancelar)"
            : "Modo Selección activo: haz clic sobre un elemento de la página (ESC para cancelar)"

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 2147483647
      }}
      className="fixed inset-0 pointer-events-none z-[2147483647] font-sans">
      <div
        data-autoloop-cancel-banner="true"
        style={{
          position: "fixed",
          top: "12px",
          left: "50%",
          transform: "translateX(-50%)",
          pointerEvents: "auto",
          zIndex: 2147483647,
          backgroundColor: "rgba(14, 14, 14, 0.96)",
          color: "#e9ebdf",
          border: "1px solid rgba(232, 118, 80, 0.65)",
          borderRadius: "9999px",
          padding: "8px 16px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          fontSize: "12px",
          boxShadow: "0 12px 30px rgba(0, 0, 0, 0.45)"
        }}
        className="fixed top-3 left-1/2 -translate-x-1/2 pointer-events-auto flex items-center gap-3 bg-void-black/95 text-parchment px-4 py-2 rounded-full shadow-2xl border border-coral-shimmer/50 backdrop-blur text-xs">
        <span
          style={{
            display: "inline-block",
            width: "10px",
            height: "10px",
            borderRadius: "9999px",
            backgroundColor: "#e87650"
          }}
          className="inline-block w-2.5 h-2.5 rounded-full bg-coral-shimmer shadow-[0_0_8px_rgba(232,118,80,0.8)] animate-pulse"
        />
        <span>{bannerMessage}</span>
        <button
          type="button"
          onClick={() => {
            const nextState: ExecutionState = {
              ...effectiveExecutionState,
              status: "idle",
              pickingTarget: undefined,
              pickingForStepId: undefined
            }
            setDirectExecutionState(nextState)
            setBox(null)
            void setExecutionState(nextState)
          }}
          style={{
            marginLeft: "4px",
            padding: "2px 10px",
            borderRadius: "4px",
            backgroundColor: "#242424",
            color: "#cbccc4",
            border: "1px solid #3f403d",
            cursor: "pointer"
          }}
          className="ml-1 px-2.5 py-0.5 rounded bg-ember hover:bg-obsidian text-ash hover:text-parchment border border-rim transition">
          Cancelar
        </button>
      </div>

      {box && (
        <div
          style={{
            position: "fixed",
            top: `${box.top}px`,
            left: `${box.left}px`,
            width: `${box.width}px`,
            height: `${box.height}px`,
            pointerEvents: "none",
            zIndex: 2147483647,
            border: "2px solid #e87650",
            backgroundColor: "rgba(232, 118, 80, 0.15)",
            boxSizing: "border-box",
            borderRadius: "2px"
          }}
          className="fixed pointer-events-none border-2 border-coral-shimmer bg-coral-shimmer/15 rounded-sm shadow-[0_0_12px_rgba(232,118,80,0.25)] transition-all duration-75">
          <div
            style={{
              position: "absolute",
              top: box.top < 30 ? `${Math.max(box.height + 4, 24)}px` : "-28px",
              left: "0px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              backgroundColor: "#0e0e0e",
              border: "1px solid #3f403d",
              color: "#e9ebdf",
              fontSize: "11px",
              padding: "2px 8px",
              borderRadius: "4px",
              whiteSpace: "nowrap",
              maxWidth: "440px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4)"
            }}
            className="absolute left-0 flex items-center gap-1.5 bg-void-black border border-rim text-parchment text-[11px] px-2 py-0.5 rounded shadow-lg whitespace-nowrap max-w-[440px] overflow-hidden text-ellipsis">
            <span
              style={{
                fontWeight: 700,
                textTransform: "uppercase",
                color: "#e87650"
              }}
              className="font-bold uppercase text-coral-shimmer">
              {box.tagName}
            </span>
            {box.customBadge ? (
              <span
                style={{
                  padding: "1px 6px",
                  borderRadius: "4px",
                  backgroundColor: "#0e352c",
                  border: "1px solid #185849",
                  color: "#cbccc4",
                  fontWeight: 600
                }}
                className="px-1.5 py-0.2 rounded bg-forest-moss border border-forest-deep text-fog font-semibold font-mono">
                {box.customBadge}
              </span>
            ) : box.matchCount !== undefined ? (
              <span
                style={{
                  padding: "1px 6px",
                  borderRadius: "4px",
                  backgroundColor: "#0e352c",
                  border: "1px solid #185849",
                  color: "#cbccc4",
                  fontWeight: 600
                }}
                className="px-1.5 py-0.2 rounded bg-forest-moss border border-forest-deep text-fog font-semibold font-mono">
                {box.totalListCount
                  ? `${box.matchCount}/${box.totalListCount} ítems`
                  : `${box.matchCount} ítems`}
              </span>
            ) : null}
            <span
              style={{
                color: "#e9ebdf",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}
              className="font-mono text-parchment truncate">
              {box.previewSelector}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default PickerOverlay
