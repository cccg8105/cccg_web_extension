# [F-14] Modularización del Orquestador Background (`src/background/`)

- **ID:** `F-14`
- **Versión objetivo:** `v0.4.1`
- **Estado:** `[x] Completado`
- **Prioridad:** Alta
- **Esfuerzo estimado:** M
- **Playbook técnico relacionado:** [Playbook 2 (`OrchestratorCommand`)](../../../docs/03-guia-extensibilidad.md)

---

## 1. Descripción y Problema a Resolver

Actualmente [`src/background/index.ts`](../../../src/background/index.ts) (~400 líneas) concentraba en un único archivo cuatro responsabilidades distintas:
1. Resolución de la pestaña activa, espera de carga (`waitForTabComplete`) y mensajería con reintentos hacia el Content Script (`sendStepToTab`).
2. Mutación de `ExecutionState`, formateo de bitácora (`logs`) y consolidación de filas en `results`.
3. El bucle de ejecución iterativo (`runWorkflowLoop`) acoplado directamente a `RECORDS`.
4. El enrutador de comandos `OrchestratorCommand` y el ciclo de vida del Service Worker (`onInstalled`).

Antes de incorporar el nuevo modo de **Extracción de Listas DOM (`F-12`)** y la **Paginación Automática (`F-13`)**, se desacopló el Service Worker en módulos cohesivos y reutilizables para evitar duplicación de lógica y facilitar la incorporación de nuevas estrategias de iteración (`runners/`).

---

## 2. Propuesta de Solución (Arquitectura Interna)

Dividir `src/background/` en la siguiente estructura manteniendo `src/background/index.ts` como punto de entrada ligero para Plasmo:

```text
src/background/
├── index.ts                  # Entrypoint ligero: onInstalled + router de OrchestratorCommand
├── tab-messenger.ts          # getActiveTabId, waitForTabComplete y sendMessageToTabWithRetry<TPayload, TResponse>
├── state-manager.ts          # Helpers inmutables de ExecutionState, appendLog y actualización de results
└── runners/
    ├── orchestrator.ts       # Control de ciclo de vida (startLoop, pauseLoop, resumeLoop, stopLoop)
    └── records-runner.ts     # Estrategia de iteración por lista de registros (CSV/JSON)
```

---

## 3. Impacto Técnico por Capa (Arquitectura MV3)

- [x] **Orquestador Background (`src/background/`):**
  - Crear `src/background/tab-messenger.ts`:
    - `delay(ms: number): Promise<void>`
    - `getActiveTabId(preferredTabId?: number): Promise<number>`
    - `waitForTabComplete(tabId: number, timeoutMs?: number): Promise<void>`
    - `sendMessageToTabWithRetry<TPayload, TResponse>(tabId: number, payload: TPayload, maxAttempts?: number): Promise<TResponse>`
  - Crear `src/background/state-manager.ts`:
    - `getExecutionState(): Promise<ExecutionState>`
    - `updateExecutionState(updater: (prev: ExecutionState) => ExecutionState): Promise<ExecutionState>`
    - `formatLog(text: string): string` y `appendLogEntry(logs: string[], text: string): string[]` (conservando `.slice(-99)`).
    - Funciones puras `applyStepSuccessToResults(...)` y `applyStepErrorToResults(...)` para actualizar `ExecutionState.results`.
  - Crear `src/background/runners/records-runner.ts`:
    - Mover la lógica de iteración sobre `STORAGE_KEYS.RECORDS` y `STORAGE_KEYS.STEPS` utilizando `tab-messenger.ts` y `state-manager.ts`.
  - Crear `src/background/runners/orchestrator.ts`:
    - Gestionar `isLoopRunning` y `targetTabId`, exponiendo los controladores para iniciar, pausar, reanudar y detener el bucle.
  - Simplificar `src/background/index.ts`:
    - Conservar únicamente `chrome.runtime.onInstalled` y el listener `chrome.runtime.onMessage` delegando cada `OrchestratorCommand` a `orchestrator.ts` y `state-manager.ts`.

---

## 4. Criterios de Aceptación (Checklist de Verificación)

- [x] `src/background/index.ts` queda reducido a un entrypoint limpio (< 100 líneas) que delega en `tab-messenger.ts`, `state-manager.ts` y `runners/`.
- [x] La función `sendMessageToTabWithRetry` es genérica y reutilizable para distintos tipos de mensajes hacia el Content Script (`EXECUTE_STEP`, y futuros `INSPECT_LIST_PAGE` / `CLICK_NEXT_PAGE`).
- [x] El flujo actual de iniciar, pausar, reanudar, detener, seleccionar elementos con `PickerOverlay` y generar resultados para CSV funciona sin regresiones.
- [x] Cumple con los estándares de `docs/02-patrones-y-estandares.md` (uso de alias `~*`, tipado estricto).
- [x] Compila sin errores de TypeScript (`npm run build`).
- [x] Grafo de conocimiento actualizado con `graphify update .` tras finalizar la implementación.
