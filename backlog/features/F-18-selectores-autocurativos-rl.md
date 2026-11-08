# [F-18] Motor de Selectores Autocurativos con Aprendizaje por Refuerzo (Self-Healing Locators)

- **ID:** `F-18`
- **Versión objetivo:** `v1.1.0`
- **Estado:** `[ ] Pendiente`
- **Prioridad:** Alta
- **Esfuerzo estimado:** L
- **Playbook técnico relacionado:** [04. Motor de Selectores Autocurativos con Aprendizaje por Refuerzo (`docs/04-selectores-autocurativos-rl.md`)](../../docs/04-selectores-autocurativos-rl.md)

---

## 1. Descripción y Problema a Resolver

En sitios web reales con catálogos o listados extensos, las tarjetas o filas repetitivas presentan **variaciones estructurales (DOM Polimórfico)**: ítems patrocinados con contenedores extra, productos con o sin etiqueta de descuento, o cambios de clase CSS según el estado del ítem. Cuando un paso depende de un único selector CSS, falla en las variantes atípicas aunque el dato sí esté presente en la tarjeta.

Esta funcionalidad implementa el motor diseñado en [`docs/04-selectores-autocurativos-rl.md`](../../docs/04-selectores-autocurativos-rl.md), basado en **Contextual Multi-Armed Bandits (UCB1)** y **Tabular $Q$-Learning (Rescorla-Wagner)** con **Huella Estructural y Semántica del Objetivo ($\mathcal{F}$)**, permitiendo a cada paso:
1. Mantener un **pool de selectores candidatos** ordenados por su valor aprendido $Q(s_k)$.
2. **Explorar activamente** el sub-árbol del contenedor cuando los candidatos conocidos fallen, localizando el nodo que maximice la similitud $\text{Sim}(e, \mathcal{F})$.
3. **Sintetizar y memorizar** el nuevo selector CSS descubierto en `workflowStorage` (`STORAGE_KEYS.STEPS`) para que los siguientes ítems y las siguientes corridas lo resuelvan de forma inmediata.

---

## 2. Propuesta de Solución (UX / UI)

- **Captura de Huella y Pool Inicial Transparente (`src/contents/picker-overlay.tsx`):**
  - Al seleccionar un elemento en la página, la extensión captura automáticamente su huella $\mathcal{F}$ (`tagName`, `stableClasses`, `parentClasses`, `attributeNames`, `textPattern`, `relativeBox`) y guarda los mejores candidatos iniciales en `step.selectorCandidates`.
- **Indicador de Aprendizaje en `src/sidepanel/components/StepCard.tsx`:**
  - Mostrar bajo el campo de selector CSS una insignia informativa cuando el paso cuente con múltiples candidatos o selectores auto-aprendidos (ej. `3 selectores en memoria (1 auto-aprendido) · Confianza 92%`), con opción de ver o limpiar los candidatos aprendidos.
- **Retroalimentación en Bitácora (`ExecutionState.logs`):**
  - Registrar eventos de autocuración durante la corrida:
    `[Auto-Heal] Ítem #14: Selector alternativo aprendido "span.copy10" (similitud 89%, Q=0.89)`.

---

## 3. Impacto Técnico por Capa (Arquitectura MV3)

- [ ] **Contratos y Tipos (`src/types/workflow.ts`):**
  - Definir `TextPatternType`, `ElementFingerprint` y `SelectorCandidate` (`selector`, `qValue`, `successCount`, `failCount`, `source: "initial" | "healed"`).
  - Extender `WorkflowStep` con `selectorCandidates?: SelectorCandidate[]` y `targetFingerprint?: ElementFingerprint`.
  - Extender `ExecuteStepResponse` con `updatedCandidates?: SelectorCandidate[]` y `healedSelector?: string`.
- [ ] **Content Scripts (`src/contents/selector-rl-engine.ts`, `picker-overlay.tsx` y `action-executor.ts`):**
  - Crear `src/contents/selector-rl-engine.ts` con las funciones puras del agente RL:
    - `buildElementFingerprint(el: Element, container?: Element): ElementFingerprint`
    - `computeSimilarityScore(candidateEl: Element, fingerprint: ElementFingerprint, container?: Element): number`
    - `rankCandidatesByUCB1(candidates: SelectorCandidate[]): SelectorCandidate[]`
    - `updateCandidateQValue(candidate: SelectorCandidate, reward: number, alpha?: number): SelectorCandidate`
    - `exploreAndHealInContainer(container: Element, fingerprint: ElementFingerprint): { element: HTMLElement; synthesizedSelector: string; similarity: number } | null`
  - En `picker-overlay.tsx`: poblar `selectorCandidates` y `targetFingerprint` al capturar un elemento para un paso.
  - En `action-executor.ts`: evaluar el pool ordenado por UCB1, aplicar `exploreAndHealInContainer` si todos fallan y retornar `updatedCandidates` + `healedSelector`.
- [ ] **Orquestador Background (`src/background/runners/dom-list-runner.ts` y `records-runner.ts`):**
  - Cuando `stepResponse.updatedCandidates` esté presente, persistir la actualización de `selectorCandidates` (y promover el selector de mayor `qValue`) en `STORAGE_KEYS.STEPS`.
  - Registrar en `ExecutionState.logs` cuando `stepResponse.healedSelector` se haya activado.
- [ ] **Interfaz Side Panel (`src/sidepanel/components/StepCard.tsx` y `src/sidepanel/utils/workflow-io.ts`):**
  - Mostrar el badge de candidatos en memoria / auto-aprendidos en `StepCard.tsx`.
  - Preservar `selectorCandidates` y `targetFingerprint` al guardar en biblioteca (`SavedWorkflow`) y al exportar/importar JSON (`workflow-io.ts`).

---

## 4. Criterios de Aceptación (Checklist de Verificación)

- [ ] Al elegir un elemento con `PickerOverlay`, el paso almacena su `targetFingerprint` y un pool inicial de `selectorCandidates`.
- [ ] Durante la ejecución, si el selector principal no coincide en un ítem pero otro candidato del pool o la exploración activa por huella ($\text{Sim} \ge 0.70$) localiza el nodo, el paso se completa sin esperar el timeout completo de 4.5s.
- [ ] El nuevo selector descubierto se agrega al pool (`source: "healed"`), actualiza sus pesos $Q(s_k)$ y queda persistido en `STORAGE_KEYS.STEPS` para corridas futuras.
- [ ] Las plantillas guardadas y archivos JSON exportados conservan la memoria de selectores aprendidos.
- [ ] Cumple con los estándares de `docs/02-patrones-y-estandares.md` y el modelo de `docs/04-selectores-autocurativos-rl.md`.
- [ ] Documentación técnica (`README.md` y `docs/`) actualizada si cambiaron módulos, flujos o playbooks.
- [ ] Compila sin errores de TypeScript (`npm run build`).
- [ ] Grafo de conocimiento actualizado con `graphify update .` tras finalizar la implementación.
