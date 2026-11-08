# [F-12] Modo de automatización seleccionable y extracción de listas de componentes DOM repetitivos

- **ID:** `F-12`
- **Versión objetivo:** `v0.5.0`
- **Estado:** `[x] Completado`
- **Prioridad:** Alta
- **Esfuerzo estimado:** L
- **Playbook técnico relacionado:** [Playbook 2 (`OrchestratorCommand`) y Playbook 3 (`STORAGE_KEYS`)](../../../docs/03-guia-extensibilidad.md)

---

## 1. Descripción y Problema a Resolver

Anteriormente **AutoLoop RPA** operaba bajo un único modo de ejecución: iterar una secuencia de pasos a partir de una lista de registros de entrada cargados vía CSV o JSON (`records_loop`). Esta funcionalidad incorpora la selección explícita del modo de automatización para soportar también **Web Scraping de listados** (`dom_list_extract`), donde la fuente de iteración son los elementos repetitivos del DOM en la página activa.

---

## 2. Propuesta de Solución (UX / UI)

- **Selector de Modo de Automatización (`src/sidepanel/components/ModeSelectorBar.tsx`):**
  - Control segmentado debajo del encabezado con dos opciones:
    - **Iterar Registros (CSV)** (`"records_loop"`)
    - **Extraer Lista Web** (`"dom_list_extract"`)
- **Adaptación de la interfaz en modo `"dom_list_extract"`:**
  - En la pestaña **Pasos**, muestra `<DomListConfigCard />` para configurar el selector CSS de los ítems repetitivos (`itemSelector`), elegirlo visualmente con `PickerOverlay` mostrando cuántos elementos coinciden en la página y limitar opcionalmente con `maxItems`.
  - Al elegir un sub-elemento dentro de un ítem para un paso, `PickerOverlay` calcula un selector relativo al contenedor (`finder(target, { root: itemRoot })` o `:scope`).
  - En la pestaña **Ejecutar**, adapta el progreso y el botón de inicio a la extracción de la lista y permite descargar el reporte CSV consolidado.
- **Persistencia en Plantillas (`SavedWorkflow` y `ExportedWorkflowFile`):**
  - Guarda, carga, exporta e importa `mode` y `domListConfig` junto con `steps`.

---

## 3. Impacto Técnico por Capa (Arquitectura MV3)

- [x] **Contratos y Tipos (`src/types/workflow.ts`):**
  - Definir `WorkflowMode`, `PickingTargetType` y `DomListConfig`.
  - Extender `SavedWorkflow`, `ExportedWorkflowFile`, `ExecutionState`, `ExecuteStepPayload` y `OrchestratorCommand`.
  - Añadir `INSPECT_LIST_PAGE` y `InspectListPageResponse`.
- [x] **Almacenamiento Persistente (`src/storage/workflow-storage.ts`):**
  - Agregar `WORKFLOW_MODE` y `DOM_LIST_CONFIG` en `STORAGE_KEYS` con sus valores por defecto.
- [x] **Content Scripts (`src/contents/picker-overlay.tsx` y `src/contents/action-executor.ts`):**
  - En `picker-overlay.tsx`: detección de contenedor repetitivo con conteo de ítems y cálculo de selector relativo al contenedor.
  - En `action-executor.ts`: resolución acotada a `document.querySelectorAll(listItemSelector)[recordIndex]` y manejador `INSPECT_LIST_PAGE`.
- [x] **Orquestador Background (`src/background/runners/orchestrator.ts` y `src/background/runners/dom-list-runner.ts`):**
  - Enrutamiento según `WORKFLOW_MODE` y ejecución de `runDomListExtraction`.
- [x] **Interfaz Side Panel (`src/sidepanel/`):**
  - Creación de `ModeSelectorBar.tsx` y `DomListConfigCard.tsx`, e integración en `StepsTab.tsx`, `RunTab.tsx`, `WorkflowLibraryCard.tsx`, `StepCard.tsx` y `workflow-io.ts`.

---

## 4. Criterios de Aceptación (Checklist de Verificación)

- [x] El usuario puede alternar entre los modos **"Iterar Registros (CSV)"** y **"Extraer Lista Web"** desde el Side Panel y la selección persiste en `workflowStorage`.
- [x] En modo **"Extraer Lista Web"**, el selector visual (`PickerOverlay`) permite capturar el selector del componente repetitivo y muestra cuántos elementos coinciden en la página.
- [x] Al seleccionar un sub-elemento dentro de una tarjeta/fila para un paso `extract`, se genera un selector relativo al contenedor repetitivo que funciona para todos los ítems de la lista.
- [x] Al ejecutar el flujo en modo `"dom_list_extract"`, el orquestador recorre cada componente repetitivo del DOM, extrae las columnas configuradas y permite descargar el CSV consolidado.
- [x] Los flujos guardados en biblioteca (`SavedWorkflow`) y exportados a JSON conservan y restauran el modo y su `domListConfig`.
- [x] Cumple con los estándares de `docs/02-patrones-y-estandares.md` y documentación actualizada.
- [x] Compila sin errores de TypeScript (`npm run build`).
- [x] Grafo de conocimiento actualizado con `graphify update .` tras finalizar la implementación.
