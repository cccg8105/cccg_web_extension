import { finder } from "@medv/finder"

/**
 * Escapes CSS identifiers safely in both browser and Node test runtimes.
 */
export function escapeCssIdentifier(value: string): string {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(value)
  }
  return value.replace(/[^a-zA-Z0-9_-]/g, (ch) => `\\${ch}`)
}

function escapeAttrValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')
}

/**
 * Checks whether an element belongs to the AutoLoop picker overlay itself.
 */
export function isExtensionOverlayElement(el: Element | null): boolean {
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

/**
 * Filters out CSS-in-JS / Tailwind / numeric classes so generated selectors generalize.
 */
export function isStableClassName(cls: string): boolean {
  if (!cls || cls.length <= 1) return false
  if (/^[0-9]/.test(cls)) return false
  if (cls.includes(":") || cls.includes("[") || cls.includes("]")) return false
  if (/^jsx-\d+$/i.test(cls)) return false
  if (/^css-[a-z0-9]{5,}$/i.test(cls)) return false
  if (/^sc-[a-z0-9]{5,}$/i.test(cls)) return false
  return true
}

/**
 * Returns stable CSS class tokens for a DOM element.
 */
export function getStableClasses(el: Element): string[] {
  return Array.from(el.classList).filter(isStableClassName)
}

/**
 * Builds a concise `tag.class1.class2` selector using at most two stable classes.
 */
export function buildElementTagAndClassSelector(el: Element): string {
  const tag = el.tagName.toLowerCase()
  const classes = getStableClasses(el).slice(0, 2)
  if (classes.length === 0) {
    return tag
  }
  return `${tag}.${classes.map(escapeCssIdentifier).join(".")}`
}

/**
 * Extracts a stable prefix from dynamic IDs like `pod-price-12345` or `card-https://...`.
 */
export function extractStableIdPrefix(rawId: string): string | null {
  if (!rawId) return null
  const match = rawId.match(/^([a-zA-Z][a-zA-Z0-9_-]*?[-_])(?:\d|https?:)/i)
  if (match && match[1] && match[1].length >= 4) {
    return match[1]
  }
  return null
}

/**
 * Builds a structural descendant path up to `maxDepth` levels inside `rootEl`.
 */
export function buildStructuralRelativePath(
  el: Element,
  rootEl: Element,
  maxDepth = 4
): string {
  const segments: string[] = []
  let current: Element | null = el

  while (current && current !== rootEl && segments.length < maxDepth) {
    segments.unshift(buildElementTagAndClassSelector(current))
    current = current.parentElement
  }

  return segments.join(" > ") || el.tagName.toLowerCase()
}

/**
 * Builds a positional `:nth-of-type` path anchored at `rootEl`.
 */
export function buildPositionalRelativePath(
  el: Element,
  rootEl: Element,
  maxDepth = 5
): string {
  const segments: string[] = []
  let current: Element | null = el

  while (current && current !== rootEl && segments.length < maxDepth) {
    const tag = current.tagName.toLowerCase()
    const parent = current.parentElement
    if (parent) {
      const sameTagSiblings = Array.from(parent.children).filter(
        (child) => child.tagName.toLowerCase() === tag
      )
      if (sameTagSiblings.length > 1) {
        const nthIndex = sameTagSiblings.indexOf(current) + 1
        segments.unshift(`${tag}:nth-of-type(${nthIndex})`)
      } else {
        segments.unshift(buildElementTagAndClassSelector(current))
      }
    } else {
      segments.unshift(tag)
    }
    current = parent
  }

  if (current === rootEl && segments.length > 0) {
    const isDocBody =
      typeof document !== "undefined" && rootEl === document.body
    return isDocBody
      ? `body > ${segments.join(" > ")}`
      : `:scope > ${segments.join(" > ")}`
  }

  return segments.join(" > ") || el.tagName.toLowerCase()
}

/**
 * Computes the safest general CSS selector for an element using `@medv/finder`.
 */
export function computeSafeSelector(el: Element, rootEl?: Element): string {
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
    return `#${escapeCssIdentifier(el.id)}`
  }
  return buildElementTagAndClassSelector(el)
}

function collectAttributeCandidates(el: Element): string[] {
  const tag = el.tagName.toLowerCase()
  const out: string[] = []

  const dataTestId =
    el.getAttribute("data-testid") || el.getAttribute("data-test-id")
  if (dataTestId && !/\d{4,}/.test(dataTestId)) {
    const attrName = el.hasAttribute("data-testid")
      ? "data-testid"
      : "data-test-id"
    out.push(`${tag}[${attrName}="${escapeAttrValue(dataTestId)}"]`)
  }

  const nameAttr = el.getAttribute("name")
  if (nameAttr && nameAttr.length <= 60) {
    out.push(`${tag}[name="${escapeAttrValue(nameAttr)}"]`)
  }

  const ariaLabel = el.getAttribute("aria-label")
  if (ariaLabel && ariaLabel.length <= 60) {
    out.push(`${tag}[aria-label="${escapeAttrValue(ariaLabel)}"]`)
  }

  const typeAttr = el.getAttribute("type")
  const placeholder = el.getAttribute("placeholder")
  if (typeAttr && placeholder && placeholder.length <= 60) {
    out.push(
      `${tag}[type="${escapeAttrValue(typeAttr)}"][placeholder="${escapeAttrValue(placeholder)}"]`
    )
  } else if (typeAttr && tag === "input") {
    out.push(`${tag}[type="${escapeAttrValue(typeAttr)}"]`)
  }

  return out
}

/**
 * Generates an ordered, deduplicated list of candidate CSS selectors for `el`.
 */
export function generateCandidateSelectors(
  el: Element,
  rootEl?: Element
): string[] {
  if (rootEl && el === rootEl) {
    return [":scope"]
  }

  const candidates: string[] = []
  const tag = el.tagName.toLowerCase()

  if (rootEl) {
    try {
      const finderRelative = finder(el, {
        root: rootEl,
        idName: () => false,
        className: isStableClassName,
        timeoutMs: 400
      })
      if (finderRelative && !finderRelative.includes("#")) {
        candidates.push(finderRelative)
      }
    } catch {
      // Continue with fallback strategies
    }

    const idPrefix = extractStableIdPrefix(el.id)
    if (idPrefix) {
      candidates.push(`${tag}[id^="${escapeAttrValue(idPrefix)}"]`)
    }

    candidates.push(...collectAttributeCandidates(el))

    const tagAndClass = buildElementTagAndClassSelector(el)
    if (tagAndClass.includes(".")) {
      candidates.push(tagAndClass)
    }

    candidates.push(buildStructuralRelativePath(el, rootEl, 4))
    candidates.push(buildPositionalRelativePath(el, rootEl, 5))
    candidates.push(tag)
  } else {
    candidates.push(computeSafeSelector(el))
    if (el.id && !/\d{4,}/.test(el.id)) {
      candidates.push(`#${escapeCssIdentifier(el.id)}`)
    }

    const idPrefix = extractStableIdPrefix(el.id)
    if (idPrefix) {
      candidates.push(`${tag}[id^="${escapeAttrValue(idPrefix)}"]`)
    }

    candidates.push(...collectAttributeCandidates(el))

    const tagAndClass = buildElementTagAndClassSelector(el)
    if (tagAndClass.includes(".")) {
      candidates.push(tagAndClass)
    }

    candidates.push(buildStructuralRelativePath(el, document.body, 4))
  }

  const seen = new Set<string>()
  const unique: string[] = []
  for (const raw of candidates) {
    const trimmed = raw.trim()
    if (!trimmed || seen.has(trimmed)) continue
    seen.add(trimmed)
    unique.push(trimmed)
  }

  return unique
}

/**
 * Synthesizes the cleanest selector inside `container` that resolves strictly to `el`.
 */
export function synthesizeUniqueRelativeSelector(
  el: Element,
  container: Element
): string {
  if (el === container) {
    return ":scope"
  }

  const scopedToDocument =
    container === document.body || container === document.documentElement
  const root = scopedToDocument ? document.body : container

  const rawCandidates = generateCandidateSelectors(
    el,
    scopedToDocument ? undefined : container
  )

  for (const cand of rawCandidates) {
    try {
      if (root.querySelector(cand) === el) {
        return cand
      }
    } catch {
      // Invalid candidate selector syntax, continue
    }
  }

  try {
    const fallbackFinder = finder(el, {
      root,
      idName: (id) => Boolean(scopedToDocument && id && !/\d{4,}/.test(id)),
      className: isStableClassName,
      timeoutMs: 400
    })
    if (fallbackFinder && root.querySelector(fallbackFinder) === el) {
      return fallbackFinder
    }
  } catch {
    // Fallback to positional path
  }

  return buildPositionalRelativePath(el, root, 6)
}
