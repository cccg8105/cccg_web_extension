import {
  getStableClasses,
  isExtensionOverlayElement,
  synthesizeUniqueRelativeSelector
} from "~contents/helpers/dom-selectors"
import type {
  ElementFingerprint,
  SelectorCandidate,
  TextPatternType,
  WorkflowStep
} from "~types/workflow"

export const RL_ALPHA = 0.2
export const RL_UCB_C = 0.35
export const RL_TAU_MIN = 0.55
export const RL_TAU_HEAL = 0.7
export const RL_MAX_POOL_SIZE = 6

const TRACKED_ATTRIBUTES = [
  "href",
  "src",
  "alt",
  "title",
  "name",
  "type",
  "placeholder",
  "aria-label",
  "data-testid",
  "data-test-id",
  "role"
] as const

const TEXT_FAMILY_TAGS = new Set([
  "span",
  "p",
  "div",
  "b",
  "strong",
  "em",
  "i",
  "small",
  "label",
  "dd",
  "dt",
  "td",
  "th",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6"
])

const ACTION_TRIGGER_TAGS = new Set(["button", "a"])
const MEDIA_TAGS = new Set(["img", "picture"])
const INPUT_TAGS = new Set(["input", "textarea"])
const STRIKETHROUGH_TAGS = new Set(["del", "s", "strike"])

const TRIVIAL_CLASS_TOKENS = new Set([
  "div",
  "span",
  "text",
  "item",
  "box",
  "container",
  "wrapper",
  "row",
  "col",
  "flex",
  "grid",
  "block",
  "inline"
])

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function roundTo(value: number, decimals = 4): number {
  const factor = Math.pow(10, decimals)
  return Math.round(value * factor) / factor
}

function isStrikethroughElement(el: Element): boolean {
  const tag = el.tagName.toLowerCase()
  if (STRIKETHROUGH_TAGS.has(tag)) {
    return true
  }
  const classStr = typeof el.className === "string" ? el.className : ""
  if (/(?:old|tachado|strike|line-through|before|regular-price)/i.test(classStr)) {
    return true
  }
  if (typeof window !== "undefined" && typeof window.getComputedStyle === "function") {
    try {
      const style = window.getComputedStyle(el)
      if (style.textDecorationLine?.includes("line-through")) {
        return true
      }
    } catch {
      // Ignore style read issues
    }
  }
  return false
}

function isElementVisible(el: Element): boolean {
  if (
    typeof HTMLInputElement !== "undefined" &&
    el instanceof HTMLInputElement &&
    el.type === "hidden"
  ) {
    return false
  }
  let computedDisplay = ""
  if (typeof window !== "undefined" && typeof window.getComputedStyle === "function") {
    try {
      const style = window.getComputedStyle(el)
      computedDisplay = style.display
      if (
        style.display === "none" ||
        style.visibility === "hidden" ||
        style.opacity === "0"
      ) {
        return false
      }
    } catch {
      // Ignore computedStyle issues
    }
  }
  if (computedDisplay !== "contents" && typeof el.getBoundingClientRect === "function") {
    const rect = el.getBoundingClientRect()
    if (rect.width === 0 && rect.height === 0) {
      return false
    }
  }
  return true
}

function tokenizeClassNames(classes: string[]): string[] {
  const tokens: string[] = []
  for (const cls of classes) {
    const parts = cls
      .split(/[-_]+|(?=[A-Z])/)
      .map((part) => part.trim().toLowerCase())
      .filter((part) => part.length > 2 && !TRIVIAL_CLASS_TOKENS.has(part))
    tokens.push(...parts)
  }
  return tokens
}

function jaccardSimilarity(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) {
    return 0
  }
  const setA = new Set(a)
  const setB = new Set(b)
  let intersection = 0
  for (const item of setA) {
    if (setB.has(item)) {
      intersection++
    }
  }
  const union = setA.size + setB.size - intersection
  return union === 0 ? 0 : intersection / union
}

function computeClassSetSimilarity(expected: string[], actual: string[]): number {
  if (expected.length === 0 && actual.length === 0) {
    return 0.5
  }
  if (expected.length === 0 || actual.length === 0) {
    return 0
  }
  const exactJaccard = jaccardSimilarity(expected, actual)
  const expectedTokens = tokenizeClassNames(expected)
  const actualTokens = tokenizeClassNames(actual)
  const tokenJaccard = jaccardSimilarity(expectedTokens, actualTokens)

  let tokenRecall = 0
  if (expectedTokens.length > 0 && actualTokens.length > 0) {
    const uniqueExpected = new Set(expectedTokens)
    const actualSet = new Set(actualTokens)
    let hits = 0
    for (const token of uniqueExpected) {
      if (actualSet.has(token)) {
        hits++
      }
    }
    tokenRecall = hits / uniqueExpected.size
  }

  return 0.35 * exactJaccard + 0.25 * tokenJaccard + 0.4 * tokenRecall
}

export function classifyRawValuePattern(rawValue: string): TextPatternType {
  const trimmed = rawValue.replace(/\s+/g, " ").trim()
  if (!trimmed) {
    return "empty"
  }

  if (/^(?:https?:\/\/|mailto:|tel:|\/[^\s]*)/i.test(trimmed)) {
    return "url"
  }

  if (
    /(?:[$€£¥]|S\/|US\$|USD|PEN|EUR|MXN|ARS|CLP|COP)\s*[-+]?\d[\d.,\s]*|[-+]?\d[\d.,]*\s*(?:[$€£¥]|USD|PEN|EUR)/i.test(
      trimmed
    )
  ) {
    return "currency"
  }

  if (
    /^[+-]?\d{1,3}(?:[.,\s]\d{3})*(?:[.,]\d+)?\s*%?$/.test(trimmed) ||
    /^[+-]?\d+(?:[.,]\d+)?\s*%?$/.test(trimmed)
  ) {
    return "number"
  }

  return "text"
}

export function inferTextPattern(
  el: Element,
  step?: Partial<WorkflowStep>
): TextPatternType {
  if (
    step?.type === "extract" &&
    step.extractSource === "attribute" &&
    step.extractAttribute?.trim()
  ) {
    const attrName = step.extractAttribute.trim()
    const attrVal = el.getAttribute(attrName) ?? ""
    if (!attrVal.trim()) return "empty"
    if (attrName === "href" || attrName === "src") return "url"
    return classifyRawValuePattern(attrVal)
  }

  let rawText = ""
  if (
    (typeof HTMLInputElement !== "undefined" && el instanceof HTMLInputElement) ||
    (typeof HTMLTextAreaElement !== "undefined" &&
      el instanceof HTMLTextAreaElement) ||
    (typeof HTMLSelectElement !== "undefined" && el instanceof HTMLSelectElement)
  ) {
    rawText = el.value ?? el.getAttribute("value") ?? ""
  } else {
    rawText = el.textContent ?? ""
  }

  const pattern = classifyRawValuePattern(rawText)
  if (pattern !== "empty") {
    return pattern
  }

  const tag = el.tagName.toLowerCase()
  if ((tag === "a" && el.getAttribute("href")) || (tag === "img" && el.getAttribute("src"))) {
    return "url"
  }

  return "empty"
}

function getRelevantAttributeNames(el: Element): string[] {
  const attrs: string[] = []
  for (const attr of TRACKED_ATTRIBUTES) {
    if (el.hasAttribute(attr)) {
      attrs.push(attr)
    }
  }
  return attrs
}

function getElementRoleHint(el: Element): string | undefined {
  const role = el.getAttribute("role")?.trim().toLowerCase()
  const inputType = el.getAttribute("type")?.trim().toLowerCase()
  const hint = role || inputType
  return hint || undefined
}

/**
 * Builds the structural & semantic fingerprint (F) for a chosen DOM element.
 */
export function buildElementFingerprint(
  el: Element,
  container?: Element,
  step?: Partial<WorkflowStep>
): ElementFingerprint {
  const tagName = el.tagName.toLowerCase()
  const stableClasses = getStableClasses(el)
  const parentClasses = el.parentElement ? getStableClasses(el.parentElement) : []
  const attributeNames = getRelevantAttributeNames(el)
  const textPattern = inferTextPattern(el, step)
  const roleHint = getElementRoleHint(el)

  let relativeBox: ElementFingerprint["relativeBox"]
  const isDocRoot =
    !container ||
    (typeof document !== "undefined" &&
      (container === document.body || container === document.documentElement))

  if (
    !isDocRoot &&
    container &&
    typeof container.getBoundingClientRect === "function" &&
    typeof el.getBoundingClientRect === "function"
  ) {
    const contRect = container.getBoundingClientRect()
    const elRect = el.getBoundingClientRect()
    if (contRect.width > 0 && contRect.height > 0) {
      relativeBox = {
        topRatio: roundTo(clamp((elRect.top - contRect.top) / contRect.height, 0, 1), 3),
        leftRatio: roundTo(clamp((elRect.left - contRect.left) / contRect.width, 0, 1), 3)
      }
    }
  }

  return {
    tagName,
    stableClasses,
    parentClasses,
    attributeNames,
    textPattern,
    roleHint,
    relativeBox
  }
}

function computeTagSimilarity(
  candTag: string,
  expectedTag: string,
  candRole?: string,
  expectedRole?: string
): number {
  if (candTag === expectedTag) {
    return 1
  }
  if (TEXT_FAMILY_TAGS.has(candTag) && TEXT_FAMILY_TAGS.has(expectedTag)) {
    return 0.75
  }
  if (
    (ACTION_TRIGGER_TAGS.has(candTag) || candRole === "button") &&
    (ACTION_TRIGGER_TAGS.has(expectedTag) || expectedRole === "button")
  ) {
    return 0.7
  }
  if (MEDIA_TAGS.has(candTag) && MEDIA_TAGS.has(expectedTag)) {
    return 0.75
  }
  if (INPUT_TAGS.has(candTag) && INPUT_TAGS.has(expectedTag)) {
    return 0.75
  }
  return 0
}

function computePatternSimilarity(
  candPattern: TextPatternType,
  expectedPattern: TextPatternType,
  candRole?: string,
  expectedRole?: string
): number {
  let score = 0
  if (candPattern === expectedPattern) {
    score = 1
  } else if (
    (candPattern === "currency" && expectedPattern === "number") ||
    (candPattern === "number" && expectedPattern === "currency")
  ) {
    score = 0.45
  } else if (
    (candPattern === "text" && expectedPattern === "number") ||
    (candPattern === "number" && expectedPattern === "text")
  ) {
    score = 0.4
  } else if (candPattern === "currency" && expectedPattern === "text") {
    score = 0.15
  } else if (candPattern === "text" && expectedPattern === "currency") {
    score = 0.15
  } else {
    score = 0
  }

  if (expectedRole && candRole) {
    if (expectedRole === candRole) {
      score = Math.min(1, score + 0.1)
    } else if (expectedRole !== candRole) {
      score *= 0.65
    }
  }

  return score
}

/**
 * Computes multi-signal similarity Sim(e, F) in [0, 1].
 */
export function computeSimilarityScore(
  candidateEl: Element,
  fingerprint: ElementFingerprint,
  container?: Element,
  step?: Partial<WorkflowStep>
): number {
  const candTag = candidateEl.tagName.toLowerCase()
  const candClasses = getStableClasses(candidateEl)
  const candParentClasses = candidateEl.parentElement
    ? getStableClasses(candidateEl.parentElement)
    : []
  const candAttrs = getRelevantAttributeNames(candidateEl)
  const candRole = getElementRoleHint(candidateEl)
  const candPattern = inferTextPattern(candidateEl, step)

  const tagScore = computeTagSimilarity(
    candTag,
    fingerprint.tagName,
    candRole,
    fingerprint.roleHint
  )

  const selfClsScore = computeClassSetSimilarity(
    fingerprint.stableClasses,
    candClasses
  )
  const parentClsScore = computeClassSetSimilarity(
    fingerprint.parentClasses,
    candParentClasses
  )
  const clsScore = 0.8 * selfClsScore + 0.2 * parentClsScore

  const patScore = computePatternSimilarity(
    candPattern,
    fingerprint.textPattern,
    candRole,
    fingerprint.roleHint
  )

  let weightedSum = 0.22 * tagScore + 0.25 * clsScore + 0.33 * patScore
  let totalWeight = 0.8

  const isDocRoot =
    !container ||
    (typeof document !== "undefined" &&
      (container === document.body || container === document.documentElement))

  if (
    fingerprint.relativeBox &&
    !isDocRoot &&
    container &&
    typeof container.getBoundingClientRect === "function" &&
    typeof candidateEl.getBoundingClientRect === "function"
  ) {
    const contRect = container.getBoundingClientRect()
    const elRect = candidateEl.getBoundingClientRect()
    if (contRect.width > 0 && contRect.height > 0) {
      const topRatio = clamp(
        (elRect.top - contRect.top) / contRect.height,
        0,
        1
      )
      const leftRatio = clamp(
        (elRect.left - contRect.left) / contRect.width,
        0,
        1
      )
      const dist = Math.hypot(
        topRatio - fingerprint.relativeBox.topRatio,
        leftRatio - fingerprint.relativeBox.leftRatio
      )
      const geoScore = Math.max(0, 1 - dist / Math.SQRT2)
      weightedSum += 0.12 * geoScore
      totalWeight += 0.12
    }
  }

  if (fingerprint.attributeNames.length > 0 || candAttrs.length > 0) {
    const attrScore = jaccardSimilarity(fingerprint.attributeNames, candAttrs)
    weightedSum += 0.08 * attrScore
    totalWeight += 0.08
  }

  let finalScore = totalWeight > 0 ? weightedSum / totalWeight : 0

  // Penalize strikethrough / crossed-out old prices unless the original target was itself crossed out
  const targetHadStrikeClass = fingerprint.stableClasses.some((c) =>
    /(?:old|tachado|strike|line-through|before)/i.test(c)
  )
  if (
    !STRIKETHROUGH_TAGS.has(fingerprint.tagName) &&
    !targetHadStrikeClass &&
    isStrikethroughElement(candidateEl)
  ) {
    finalScore *= 0.35
  }

  // Prefer leaf nodes over large wrapper containers when original target wasn't a div container
  if (
    candTag === "div" &&
    fingerprint.tagName !== "div" &&
    candidateEl.children.length > 1
  ) {
    finalScore = Math.max(0, finalScore - 0.08)
  }

  return roundTo(clamp(finalScore, 0, 1), 4)
}

/**
 * Computes Upper Confidence Bound (UCB1) ranking score for a selector candidate.
 */
export function computeUCB1Score(
  candidate: SelectorCandidate,
  totalTrials: number,
  explorationCoeff = RL_UCB_C
): number {
  const n = candidate.successCount + candidate.failCount
  return (
    candidate.qValue +
    explorationCoeff * Math.sqrt(Math.log(totalTrials + 1) / (n + 1))
  )
}

/**
 * Ranks candidates using UCB1, prioritizing `preferredPrimarySelector` on ties or uninitialized runs.
 */
export function rankCandidatesByUCB1(
  candidates: SelectorCandidate[],
  preferredPrimarySelector?: string,
  explorationCoeff = RL_UCB_C
): SelectorCandidate[] {
  const totalTrials = candidates.reduce(
    (sum, cand) => sum + cand.successCount + cand.failCount,
    0
  )

  return [...candidates].sort((a, b) => {
    const scoreA = computeUCB1Score(a, totalTrials, explorationCoeff)
    const scoreB = computeUCB1Score(b, totalTrials, explorationCoeff)

    if (Math.abs(scoreB - scoreA) > 1e-6) {
      return scoreB - scoreA
    }

    if (preferredPrimarySelector) {
      if (a.selector === preferredPrimarySelector) return -1
      if (b.selector === preferredPrimarySelector) return 1
    }

    return b.qValue - a.qValue
  })
}

/**
 * Applies constant step-size TD(0) / Rescorla-Wagner update to Q(s_k).
 */
export function updateCandidateQValue(
  candidate: SelectorCandidate,
  reward: number,
  alpha = RL_ALPHA
): SelectorCandidate {
  const nextQ = clamp(
    candidate.qValue + alpha * (reward - candidate.qValue),
    -1,
    1
  )
  const isPositive = reward > 0
  return {
    ...candidate,
    qValue: roundTo(nextQ, 4),
    successCount: candidate.successCount + (isPositive ? 1 : 0),
    failCount: candidate.failCount + (isPositive ? 0 : 1)
  }
}

/**
 * Keeps the candidate pool bounded within `maxPoolSize`, preserving highest-value locators.
 */
export function pruneCandidatePool(
  candidates: SelectorCandidate[],
  maxPoolSize = RL_MAX_POOL_SIZE
): SelectorCandidate[] {
  if (candidates.length <= maxPoolSize) {
    return candidates
  }

  return [...candidates]
    .sort((a, b) => {
      if (Math.abs(b.qValue - a.qValue) > 1e-6) {
        return b.qValue - a.qValue
      }
      if (b.successCount !== a.successCount) {
        return b.successCount - a.successCount
      }
      return a.failCount - b.failCount
    })
    .slice(0, maxPoolSize)
}

/**
 * Updates an existing candidate or inserts a new one, then prunes to `maxPoolSize`.
 */
export function upsertCandidateInPool(
  pool: SelectorCandidate[],
  selector: string,
  reward: number,
  source: "initial" | "healed",
  initialQ?: number,
  alpha = RL_ALPHA,
  maxPoolSize = RL_MAX_POOL_SIZE
): SelectorCandidate[] {
  const trimmed = selector.trim()
  if (!trimmed) {
    return pruneCandidatePool(pool, maxPoolSize)
  }

  const existingIndex = pool.findIndex((c) => c.selector === trimmed)
  if (existingIndex >= 0) {
    const updated = pool.map((cand, idx) =>
      idx === existingIndex ? updateCandidateQValue(cand, reward, alpha) : cand
    )
    return pruneCandidatePool(updated, maxPoolSize)
  }

  const seedQ = clamp(initialQ ?? (reward > 0 ? reward : 0.5), -1, 1)
  const isPositive = reward > 0
  const created: SelectorCandidate = {
    selector: trimmed,
    qValue: roundTo(seedQ, 4),
    successCount: isPositive ? 1 : 0,
    failCount: isPositive ? 0 : 1,
    source
  }

  return pruneCandidatePool([...pool, created], maxPoolSize)
}

/**
 * Conservatively decides whether to promote a higher-performing candidate as primary `step.selector`.
 */
export function choosePromotedSelector(
  currentSelector: string | undefined,
  candidates: SelectorCandidate[]
): string | undefined {
  if (candidates.length === 0) {
    return currentSelector
  }

  const sorted = [...candidates].sort((a, b) => b.qValue - a.qValue)
  const best = sorted[0]
  if (!best) {
    return currentSelector
  }

  const trimmedCurrent = currentSelector?.trim()
  if (!trimmedCurrent) {
    return best.selector
  }

  if (best.selector === trimmedCurrent) {
    return trimmedCurrent
  }

  const currentCand = candidates.find((c) => c.selector === trimmedCurrent)
  if (!currentCand) {
    return best.successCount >= 2 ? best.selector : trimmedCurrent
  }

  const currentFailing = currentCand.failCount > currentCand.successCount
  const dominatesSignificantly =
    best.successCount >= 2 && best.qValue >= currentCand.qValue + 0.08

  if ((currentFailing && best.qValue > currentCand.qValue) || dominatesSignificantly) {
    return best.selector
  }

  return trimmedCurrent
}

function isCompatibleForStepAction(
  el: Element,
  step?: Partial<WorkflowStep>
): boolean {
  if (!step || !step.type) {
    return true
  }

  if (step.type === "input") {
    const tag = el.tagName.toLowerCase()
    const isEditable =
      tag === "input" ||
      tag === "textarea" ||
      tag === "select" ||
      (el instanceof HTMLElement && el.isContentEditable)
    if (!isEditable) {
      return false
    }
    if (tag === "input") {
      const inputType = el.getAttribute("type")?.toLowerCase() ?? "text"
      if (inputType === "hidden" || inputType === "submit" || inputType === "button") {
        return false
      }
    }
  }

  if (step.type === "select") {
    const tag = el.tagName.toLowerCase()
    if (tag !== "select" && !el.querySelector("select")) {
      return false
    }
  }

  if (step.type === "extract") {
    const source = step.extractSource ?? "textContent"
    if (source === "attribute" && step.extractAttribute?.trim()) {
      const attrVal = el.getAttribute(step.extractAttribute.trim())
      if (!attrVal || !attrVal.trim()) {
        return false
      }
    } else if (source === "textContent") {
      const txt = (el.textContent ?? "").replace(/\s+/g, " ").trim()
      if (!txt) {
        return false
      }
    }
  }

  return true
}

export interface ExploreHealResult {
  element: HTMLElement
  synthesizedSelector: string
  similarity: number
}

/**
 * Actively scans `container` descendants when known pool candidates fail,
 * returning the highest-similarity node >= `tauHeal` along with a synthesized selector.
 */
export function exploreAndHealInContainer(
  container: Element,
  fingerprint: ElementFingerprint,
  step?: Partial<WorkflowStep>,
  tauHeal = RL_TAU_HEAL
): ExploreHealResult | null {
  const isDocRoot =
    typeof document !== "undefined" &&
    (container === document.body || container === document.documentElement)

  let rawNodes: Element[]
  if (isDocRoot) {
    const queryParts = [
      fingerprint.tagName,
      "input",
      "textarea",
      "select",
      "button",
      "a",
      "[role='button']",
      "[contenteditable='true']"
    ]
    rawNodes = Array.from(
      container.querySelectorAll(Array.from(new Set(queryParts)).join(", "))
    ).slice(0, 400)
  } else {
    rawNodes = Array.from(container.querySelectorAll("*")).slice(0, 400)
  }

  let bestNode: Element | null = null
  let bestScore = 0

  for (const node of rawNodes) {
    if (isExtensionOverlayElement(node)) continue
    const tag = node.tagName.toLowerCase()
    if (tag === "script" || tag === "style" || tag === "noscript" || tag === "meta" || tag === "link") {
      continue
    }
    if (
      (tag === "path" || tag === "rect" || tag === "circle" || tag === "polygon") &&
      fingerprint.tagName !== tag
    ) {
      continue
    }
    if (!isElementVisible(node)) continue
    if (!isCompatibleForStepAction(node, step)) continue

    const score = computeSimilarityScore(node, fingerprint, container, step)
    if (score > bestScore) {
      bestScore = score
      bestNode = node
    }
  }

  if (!bestNode || bestScore < tauHeal) {
    return null
  }

  const synthesizedSelector = synthesizeUniqueRelativeSelector(
    bestNode,
    container
  )
  return {
    element: bestNode as HTMLElement,
    synthesizedSelector,
    similarity: bestScore
  }
}

/**
 * Converts ranked selector strings + optional coverage ratios into an initial RL pool.
 */
export function buildInitialSelectorCandidates(
  entries: Array<{ selector: string; matched?: number; total?: number }>,
  maxPoolSize = RL_MAX_POOL_SIZE
): SelectorCandidate[] {
  const seen = new Set<string>()
  const out: SelectorCandidate[] = []

  entries.forEach((entry, index) => {
    const trimmed = entry.selector.trim()
    if (!trimmed || seen.has(trimmed)) return
    seen.add(trimmed)

    let qValue: number
    if (entry.matched !== undefined && entry.total && entry.total > 0) {
      const ratio = clamp(entry.matched / entry.total, 0, 1)
      qValue = roundTo(0.45 + 0.5 * ratio - index * 0.03, 4)
    } else {
      qValue = roundTo(Math.max(0.55, 0.9 - index * 0.08), 4)
    }

    out.push({
      selector: trimmed,
      qValue: clamp(qValue, 0.3, 0.95),
      successCount: 0,
      failCount: 0,
      source: "initial"
    })
  })

  return pruneCandidatePool(out, maxPoolSize)
}
