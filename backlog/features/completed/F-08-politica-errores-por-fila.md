# [F-08] Política de manejo de errores por fila/ítem (*Detener flujo* vs *Saltar y continuar*)

- **ID:** `F-08`
- **Versión objetivo:** `v1.0.0`
- **Estado:** `[x] Completado`
- **Prioridad:** Media-Alta
- **Esfuerzo estimado:** M
- **Playbook técnico relacionado:** [Playbook 3 (`STORAGE_KEYS`)](../../../docs/03-guia-extensibilidad.md)

---

## 1. Descripción y Problema a Resolver

En lotes grandes de registros (CSV/JSON) o al extraer listas extensas de elementos en una página web, es frecuente que una fila puntual o una tarjeta individual falle. Esta funcionalidad permite al usuario elegir la **política de resiliencia ante errores (`onError`)**:
- **Detener flujo (`"stop"`):** Detiene el bucle inmediatamente al primer fallo.
- **Saltar fila/ítem y continuar (`"skip"`):** Registra el fallo en la fila actual del reporte CSV (`_status = "error"`, `_error = "..."`), incrementa `skippedOrErrorCount` y continúa automáticamente con el siguiente registro o elemento de la lista.

---

## 2. Propuesta de Solución (UX / UI)

- **Tarjeta de Opciones de Ejecución (`src/sidepanel/components/ExecutionOptionsCard.tsx`) en la pestaña Ejecutar:**
  - Selector de **Política ante errores**: `Detener al fallar` (`"stop"`) vs `Saltar y continuar` (`"skip"`).
- **Indicadores en `src/sidepanel/components/tabs/RunTab.tsx`:**
  - Muestra badge de advertencia cuando existen filas saltadas por error (`skippedOrErrorCount > 0`) e incluye el resumen al finalizar.

---

## 3. Impacto Técnico por Capa (Arquitectura MV3)

- [x] **Contratos y Tipos (`src/types/workflow.ts`):**
  - Definir `ErrorHandlingPolicy = "stop" | "skip"` y `ExecutionOptions`.
  - Añadir `skippedOrErrorCount?: number` en `ExecutionState`.
  - Añadir `executionOptions?: ExecutionOptions` en `SavedWorkflow` y `ExportedWorkflowFile`.
- [x] **Almacenamiento Persistente (`src/storage/workflow-storage.ts`):**
  - Agregar `EXECUTION_OPTIONS: "rpa_execution_options"` en `STORAGE_KEYS` y `DEFAULT_EXECUTION_OPTIONS`.
- [x] **Orquestador Background (`src/background/runners/`):**
  - En `records-runner.ts` y `dom-list-runner.ts`: soporte para `onError === "skip"` avanzando a la siguiente fila/ítem tras registrar el error en `results`.
- [x] **Interfaz Side Panel (`src/sidepanel/`):**
  - Creación de `ExecutionOptionsCard.tsx` e integración en `RunTab.tsx`, `WorkflowLibraryCard.tsx` y `workflow-io.ts`.

---

## 4. Criterios de Aceptación (Checklist de Verificación)

- [x] El usuario puede elegir entre `"Detener al fallar"` y `"Saltar y continuar"` antes de iniciar la ejecución.
- [x] Con la política `"skip"`, un fallo en un paso no detiene el lote; registra `_status: "error"` y `_error` en el reporte CSV para esa fila y continúa con la siguiente.
- [x] Funciona tanto en el modo **Iterar Registros (`records_loop`)** como en **Extraer Lista Web (`dom_list_extract`)**.
- [x] Cumple con los estándares de `docs/02-patrones-y-estandares.md`.
- [x] Documentación técnica (`README.md` y `docs/`) actualizada.
- [x] Compila sin errores de TypeScript (`npm run build`).
- [x] Grafo de conocimiento actualizado con `graphify update .` tras finalizar la implementación.
