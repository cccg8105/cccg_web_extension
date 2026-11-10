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
  return `${tag}.${classes.join(".")}`
}

function buildItemRelativeSelector(
  el: Element,
  itemContainer: Element
): string {
  if (el === itemContainer) {
    return ":scope"
  }

  const tagAndClass = buildElementTagAndClassSelector(el)

  try {
    const matches = Array.from(itemContainer.querySelectorAll(tagAndClass))
    if (matches.length === 1 && matches[0] === el) {
      return tagAndClass
    }
  } catch {
    // continue fallback
  }

  try {
    const selector = finder(el, {
      root: itemContainer,
      className: isStableClassName,
      tagName: () => true,
      seedMinLength: 1,
      optimizedMinLength: 2
    })

    if (selector) {
      return selector
    }
  } catch (err) {
    console.warn("AutoLoop finder relative fallback:", err)
  }

  const tag = el.tagName.toLowerCase()
  return tag
}

function findBestRepeatingParent(
  targetEl: Element
): { container: Element; selector: string; count: number } | null {
  let current: Element | null = targetEl

  while (current && current !== document.body && current !== document.documentElement) {
    const tag = current.tagName.toLowerCase()
    const classes = getStableClasses(current)

    const candidateSelectors: string[] = []

    if (classes.length > 0) {
      candidateSelectors.push(`.${classes[0]}`)
      if (classes.length > 1) {
        candidateSelectors.push(`.${classes[0]}.${classes[1]}`)
      }
      candidateSelectors.push(`${tag}.${classes[0]}`)
    }

    if (tag === "li" || tag === "tr") {
      candidateSelectors.push(tag)
    }

    for (const sel of candidateSelectors) {
      try {
        const matches = Array.from(document.querySelectorAll(sel))
        if (matches.length >= 2 && matches.includes(current)) {
          return {
            container: current,
            selector: sel,
            count: matches.length
          }
        }
      } catch {
        // ignore invalid selector
      }
    }

    current = current.parentElement
  }

  return null
}

function countMatchingItemsInsideContainer(
  relativeSelector: string,
  containerSelector?: string
): { matchCount: number; totalListCount: number } | null {
  if (!containerSelector) return null

  try {
    const containers = Array.from(document.querySelectorAll(containerSelector))
    if (containers.length === 0) return null

    let matchCount = 0
    for (const cont of containers) {
      if (relativeSelector === ":scope") {
        matchCount++
      } else {
        const found = cont.querySelector(relativeSelector)
        if (found) matchCount++
      }
    }

    return {
      matchCount,
      totalListCount: containers.length
    }
  } catch {
    return null
  }
}

function buildCleanCssSelector(el: Element): string {
  try {
    return finder(el, {
      root: document.body,
      className: isStableClassName,
      tagName: () => true,
      seedMinLength: 1,
      optimizedMinLength: 2
    })
  } catch (err) {
    console.warn("AutoLoop finder error, falling back to basic selector:", err)
    const tag = el.tagName.toLowerCase()
    if (el.id) {
      return `#${el.id}`
    }
    const stable = getStableClasses(el)
    if (stable.length > 0) {
      return `${tag}.${stable.slice(0, 2).join(".")}`
    }
    return tag
  }
}

export function PickerOverlay() {
  const [executionState, setExecutionState] = useStorage<ExecutionState>({
    key: STORAGE_KEYS.EXECUTION_STATE,
    instance: workflowStorage
  })

  const [steps, setSteps] = useStorage<WorkflowStep[]>({
    key: STORAGE_KEYS.STEPS,
    instance: workflowStorage
  })

  const [workflowMode] = useStorage<WorkflowMode>({
    key: STORAGE_KEYS.WORKFLOW_MODE,
    instance: workflowStorage
  })

  const [domListConfig, setDomListConfig] = useStorage<DomListConfig>({
    key: STORAGE_KEYS.DOM_LIST_CONFIG,
    instance: workflowStorage
  })

  const [hoveredEl, setHoveredEl] = useState<Element | null>(null)
  const [box, setBox] = useState<HighlightBox | null>(null)

  const isPicking = executionState?.status === "picking"
  const pickingTarget = executionState?.pickingTarget ?? "step"
  const isDomListMode = workflowMode === "dom_list_extract"

  useEffect(() => {
    if (!hoveredEl) {
      setBox(null)
      return
    }

    const rect = hoveredEl.getBoundingClientRect()
    let previewSelector = ""
    let matchCount: number | undefined
    let totalListCount: number | undefined

    if (isDomListMode && pickingTarget === "list_container") {
      const best = findBestRepeatingParent(hoveredEl)
      if (best) {
        previewSelector = best.selector
        matchCount = best.count
      } else {
        previewSelector = buildCleanCssSelector(hoveredEl)
      }
    } else if (isDomListMode && pickingTarget === "step") {
      const containerSelector = domListConfig?.itemSelector
      if (containerSelector) {
        const itemContainer = hoveredEl.closest(containerSelector)
        if (itemContainer) {
          previewSelector = buildItemRelativeSelector(hoveredEl, itemContainer)
          const counts = countMatchingItemsInsideContainer(
            previewSelector,
            containerSelector
          )
          if (counts) {
            matchCount = counts.matchCount
            totalListCount = counts.totalListCount
          }
        } else {
          previewSelector = buildCleanCssSelector(hoveredEl)
        }
      } else {
        previewSelector = buildCleanCssSelector(hoveredEl)
      }
    } else {
      previewSelector = buildCleanCssSelector(hoveredEl)
    }

    setBox({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      tagName: hoveredEl.tagName.toLowerCase(),
      previewSelector,
      matchCount,
      totalListCount
    })
  }, [hoveredEl, isDomListMode, pickingTarget, domListConfig])

  useEffect(() => {
    if (!isPicking) {
      setHoveredEl(null)
      setBox(null)
      return
    }

    const handleMouseMove = (e: MouseEvent) => {
      const target = e.target as Element | null
      if (!target) return

      if (target.closest && target.closest("#rpa-picker-overlay-root")) {
        return
      }

      setHoveredEl(target)
    }

    const handleClick = (e: MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      e.stopImmediatePropagation()

      const target = e.target as Element | null
      if (!target) return

      if (target.closest && target.closest("#rpa-picker-overlay-root")) {
        return
      }

      if (isDomListMode && pickingTarget === "list_container") {
        const best = findBestRepeatingParent(target)
        const chosenSelector = best ? best.selector : buildCleanCssSelector(target)
        const detectedCount = best ? best.count : 1

        const updatedConfig: DomListConfig = {
          ...(domListConfig ?? DEFAULT_DOM_LIST_CONFIG),
          itemSelector: chosenSelector
        }
        setDomListConfig(updatedConfig)

        setExecutionState({
          ...(executionState ?? DEFAULT_EXECUTION_STATE),
          status: "idle",
          pickingTarget: undefined,
          pickingForStepId: undefined,
          detectedListCount: detectedCount
        })

        setHoveredEl(null)
        setBox(null)
        return
      }

      if (isDomListMode && pickingTarget === "pagination_next") {
        const nextSelector = buildCleanCssSelector(target)

        const currentPagination =
          domListConfig?.pagination ?? DEFAULT_DOM_LIST_CONFIG.pagination!

        const updatedConfig: DomListConfig = {
          ...(domListConfig ?? DEFAULT_DOM_LIST_CONFIG),
          pagination: {
            ...currentPagination,
            enabled: true,
            nextButtonSelector: nextSelector
          }
        }
        setDomListConfig(updatedConfig)

        setExecutionState({
          ...(executionState ?? DEFAULT_EXECUTION_STATE),
          status: "idle",
          pickingTarget: undefined,
          pickingForStepId: undefined
        })

        setHoveredEl(null)
        setBox(null)
        return
      }

      let chosenSelector = ""
      const containerSelector = domListConfig?.itemSelector

      if (isDomListMode && containerSelector) {
        const itemContainer = target.closest(containerSelector)
        if (itemContainer) {
          chosenSelector = buildItemRelativeSelector(target, itemContainer)
        } else {
          chosenSelector = buildCleanCssSelector(target)
        }
      } else {
        chosenSelector = buildCleanCssSelector(target)
      }

      const stepId = executionState?.pickingForStepId

      if (stepId && steps) {
        const updatedSteps = steps.map((s) => {
          if (s.id !== stepId) return s

          let autoExtractColumn = s.outputColumn
          if (s.type === "extract" && !autoExtractColumn) {
            const rawTag = target.tagName.toLowerCase()
            const cleanClasses = getStableClasses(target)
            autoExtractColumn =
              cleanClasses.length > 0
                ? `${rawTag}_${cleanClasses[0]}`
                : `${rawTag}_col`
          }

          return {
            ...s,
            selector: chosenSelector,
            outputColumn: autoExtractColumn
          }
        })
        setSteps(updatedSteps)
      }

      setExecutionState({
        ...(executionState ?? DEFAULT_EXECUTION_STATE),
        status: "idle",
        pickingTarget: undefined,
        pickingForStepId: undefined
      })

      setHoveredEl(null)
      setBox(null)
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        e.stopPropagation()
        setExecutionState({
          ...(executionState ?? DEFAULT_EXECUTION_STATE),
          status: "idle",
          pickingTarget: undefined,
          pickingForStepId: undefined
        })
        setHoveredEl(null)
        setBox(null)
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
      <div className="fixed top-3 left-1/2 -translate-x-1/2 pointer-events-auto flex items-center gap-3 bg-void-black/95 text-parchment px-4 py-2 rounded-full shadow-2xl border border-coral-shimmer/50 backdrop-blur text-xs">
        <span className="inline-block w-2.5 h-2.5 rounded-full bg-coral-shimmer shadow-[0_0_8px_rgba(232,118,80,0.8)] animate-pulse" />
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
          className="ml-1 px-2.5 py-0.5 rounded bg-ember hover:bg-obsidian text-ash hover:text-parchment border border-rim transition">
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
          className="fixed pointer-events-none border-2 border-coral-shimmer bg-coral-shimmer/15 rounded-sm shadow-[0_0_12px_rgba(232,118,80,0.25)] transition-all duration-75">
          <div className="absolute -top-7 left-0 flex items-center gap-1.5 bg-void-black border border-rim text-parchment text-[11px] px-2 py-0.5 rounded shadow-lg whitespace-nowrap max-w-[440px] overflow-hidden text-ellipsis">
            <span className="font-bold uppercase text-coral-shimmer">
              {box.tagName}
            </span>
            {box.matchCount !== undefined && (
              <span className="px-1.5 py-0.2 rounded bg-forest-moss border border-forest-deep text-fog font-semibold font-mono">
                {box.totalListCount
                  ? `${box.matchCount}/${box.totalListCount} ítems`
                  : `${box.matchCount} ítems`}
              </span>
            )}
            <span className="font-mono text-parchment truncate">{box.previewSelector}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default PickerOverlay
