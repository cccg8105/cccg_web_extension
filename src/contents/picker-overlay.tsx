import { finder } from "@medv/finder"
import cssText from "data-text:~style.css"
import type { PlasmoCSConfig } from "plasmo"
import { useEffect, useState } from "react"
import { useStorage } from "@plasmohq/storage/hook"
import {
  DEFAULT_DOM_LIST_CONFIG,
  DEFAULT_EXECUTION_STATE,
  DEFAULT_WORKFLOW_MODE,
  STORAGE_KEYS,
  workflowStorage
} from "~storage/workflow-storage"
import type {
  DomListConfig,
  ExecutionState,
  WorkflowMode,
  WorkflowStep
} from "~types/workflow"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"]
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
  // Ej: "testId-pod-image-https://..." o "pod-title-883856491" -> "testId-pod-image-" o "pod-title-"
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

  // Candidato 1: finder sin IDs únicos ni clases generadas (jsx-*)
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

  // Candidato 2: Prefijo estable de ID o data-testid (ej. img[id^="testId-pod-image-"])
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

  // Candidato 3: Etiqueta + clases estables propias
  const tagAndClass = buildElementTagAndClassSelector(el)
  if (tagAndClass.includes(".")) {
    candidates.push(tagAndClass)
  }

  // Candidato 4: Ruta estructural de etiquetas/clases desde el contenedor
  const structuralPath = buildStructuralRelativePath(el, itemRoot)
  candidates.push(structuralPath)

  // Candidato 5: Etiqueta simple (ej. "img", "h2", "a") si es única o representativa
  candidates.push(el.tagName.toLowerCase())

  let bestSelector = candidates[0] ?? el.tagName.toLowerCase()
  let bestMatched = 0

  for (const candidate of candidates) {
    try {
      const firstMatchInCurrentItem = itemRoot.querySelector(candidate)
      if (!firstMatchInCurrentItem) continue

      const { matched } = countMatchingListContainers(itemSelector, candidate)
      // Si el elemento que el usuario señaló coincide exactamente y tiene mejor cobertura multi-ítem
      const isExactTarget = firstMatchInCurrentItem === el
      const effectiveScore = isExactTarget ? matched + 0.5 : matched

      if (effectiveScore > bestMatched) {
        bestMatched = effectiveScore
        bestSelector = candidate
      }

      if (isExactTarget && baseTotal > 1 && matched >= Math.ceil(baseTotal * 0.8)) {
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
      try {
        parentSelector = finder(parent, {
          root: document.body,
          className: isStableClassName,
          timeoutMs: 300
        })
      } catch {
        parentSelector = buildElementTagAndClassSelector(parent)
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

const PickerOverlay = () => {
  const [executionState, setExecutionState] = useStorage<ExecutionState>(
    {
      key: STORAGE_KEYS.EXECUTION_STATE,
      instance: workflowStorage
    },
    DEFAULT_EXECUTION_STATE
  )

  const [steps, setSteps] = useStorage<WorkflowStep[]>(
    {
      key: STORAGE_KEYS.STEPS,
      instance: workflowStorage
    },
    []
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

  const [box, setBox] = useState<HighlightBox | null>(null)

  const isPicking = executionState?.status === "picking"
  const pickingTarget = executionState?.pickingTarget ?? "step"

  useEffect(() => {
    if (!isPicking) {
      setBox(null)
      return
    }

    const computeSafeSelector = (el: Element, rootEl?: Element): string => {
      try {
        return finder(el, {
          root: rootEl ?? document.body,
          className: isStableClassName,
          timeoutMs: 400
        })
      } catch {
        if (el.id && !rootEl) {
          return `#${CSS.escape(el.id)}`
        }
        return buildElementTagAndClassSelector(el)
      }
    }

    const computeStepSelectorWithCoverage = (
      el: Element
    ): { selector: string; matched?: number; total?: number } => {
      const configuredItemSelector = domListConfig?.itemSelector?.trim()
      if (workflowMode === "dom_list_extract" && configuredItemSelector) {
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

    const isExtensionOverlayElement = (el: Element | null): boolean => {
      if (!el) return true
      return Boolean(el.closest("plasmo-csui"))
    }

    const handleMouseMove = (event: MouseEvent) => {
      const target = document.elementFromPoint(event.clientX, event.clientY)
      if (!target || isExtensionOverlayElement(target)) {
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
    }

    const handleClick = async (event: MouseEvent) => {
      const target = document.elementFromPoint(event.clientX, event.clientY)
      if (!target || isExtensionOverlayElement(target)) {
        return
      }

      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()

      const timestamp = new Date().toLocaleTimeString()

      if (pickingTarget === "list_container") {
        const listInfo = computeRepeatingListSelector(target)
        await setDomListConfig({
          ...(domListConfig ?? DEFAULT_DOM_LIST_CONFIG),
          itemSelector: listInfo.selector
        })
        await setExecutionState({
          ...(executionState ?? DEFAULT_EXECUTION_STATE),
          status: "idle",
          pickingTarget: undefined,
          pickingForStepId: undefined,
          lastPickedSelector: listInfo.selector,
          detectedListCount: listInfo.count,
          logs: [
            ...(executionState?.logs ?? []).slice(-99),
            `[${timestamp}] Lista capturada: ${listInfo.selector} (${listInfo.count} elementos detectados)`
          ]
        })
        return
      }

      if (pickingTarget === "pagination_next") {
        const nextSelector = computeSafeSelector(target)
        const currentConfig = domListConfig ?? DEFAULT_DOM_LIST_CONFIG
        await setDomListConfig({
          ...currentConfig,
          pagination: {
            enabled: currentConfig.pagination?.enabled ?? true,
            nextButtonSelector: nextSelector,
            waitAfterClickMs:
              currentConfig.pagination?.waitAfterClickMs ?? 2000,
            maxPages: currentConfig.pagination?.maxPages ?? 5
          }
        })
        await setExecutionState({
          ...(executionState ?? DEFAULT_EXECUTION_STATE),
          status: "idle",
          pickingTarget: undefined,
          pickingForStepId: undefined,
          lastPickedSelector: nextSelector,
          logs: [
            ...(executionState?.logs ?? []).slice(-99),
            `[${timestamp}] Botón Siguiente capturado: ${nextSelector}`
          ]
        })
        return
      }

      const stepSelInfo = computeStepSelectorWithCoverage(target)
      const selector = stepSelInfo.selector
      const targetStepId = executionState?.pickingForStepId

      if (targetStepId && Array.isArray(steps)) {
        const updatedSteps = steps.map((step) =>
          step.id === targetStepId ? { ...step, selector } : step
        )
        await setSteps(updatedSteps)
      }

      const coverageSuffix =
        stepSelInfo.matched !== undefined && stepSelInfo.total
          ? ` (coincide en ${stepSelInfo.matched}/${stepSelInfo.total} ítems)`
          : ""

      await setExecutionState({
        ...(executionState ?? DEFAULT_EXECUTION_STATE),
        status: "idle",
        pickingTarget: undefined,
        pickingForStepId: undefined,
        lastPickedSelector: selector,
        logs: [
          ...(executionState?.logs ?? []).slice(-99),
          `[${timestamp}] Selector capturado: ${selector}${coverageSuffix}`
        ]
      })
    }

    const handleKeyDown = async (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        event.stopPropagation()
        await setExecutionState({
          ...(executionState ?? DEFAULT_EXECUTION_STATE),
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
    executionState,
    steps,
    workflowMode,
    domListConfig,
    setExecutionState,
    setSteps,
    setDomListConfig
  ])

  if (!isPicking) {
    return null
  }

  const bannerMessage =
    pickingTarget === "list_container"
      ? "Modo Lista: haz clic sobre una tarjeta o fila repetitiva (ESC para cancelar)"
      : pickingTarget === "pagination_next"
        ? "Modo Paginación: haz clic sobre el botón 'Siguiente página' (ESC para cancelar)"
        : "Modo Selección activo: haz clic sobre un elemento de la página (ESC para cancelar)"

  return (
    <div className="fixed inset-0 pointer-events-none z-[2147483647] font-sans">
      <div className="fixed top-3 left-1/2 -translate-x-1/2 pointer-events-auto flex items-center gap-3 bg-slate-900/95 text-white px-4 py-2 rounded-full shadow-xl border border-indigo-500/60 text-xs">
        <span className="inline-block w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse" />
        <span>{bannerMessage}</span>
        <button
          type="button"
          onClick={() =>
            setExecutionState({
              ...(executionState ?? DEFAULT_EXECUTION_STATE),
              status: "idle",
              pickingTarget: undefined,
              pickingForStepId: undefined
            })
          }
          className="ml-1 px-2 py-0.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 transition">
          Cancelar
        </button>
      </div>

      {box && (
        <div
          style={{
            top: `${box.top}px`,
            left: `${box.left}px`,
            width: `${box.width}px`,
            height: `${box.height}px`
          }}
          className="fixed pointer-events-none border-2 border-indigo-500 bg-indigo-500/15 rounded-sm transition-all duration-75">
          <div className="absolute -top-7 left-0 flex items-center gap-1.5 bg-indigo-600 text-white text-[11px] px-2 py-0.5 rounded shadow-md whitespace-nowrap max-w-[440px] overflow-hidden text-ellipsis">
            <span className="font-bold uppercase text-indigo-200">
              {box.tagName}
            </span>
            {box.matchCount !== undefined && (
              <span className="px-1.5 py-0.2 rounded bg-emerald-500/30 text-emerald-100 font-semibold">
                {box.totalListCount
                  ? `${box.matchCount}/${box.totalListCount} ítems`
                  : `${box.matchCount} ítems`}
              </span>
            )}
            <span className="font-mono truncate">{box.previewSelector}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default PickerOverlay
