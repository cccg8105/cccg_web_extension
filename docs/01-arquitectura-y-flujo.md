# 01. Arquitectura y Flujos de Datos

**AutoLoop RPA** está construida sobre **Chrome Manifest V3** utilizando el framework **Plasmo**, **React 18**, **TypeScript** y **Tailwind CSS**.

A diferencia de una aplicación web tradicional donde toda la lógica reside en un único proceso de navegador, una extensión de Chrome opera sobre **tres contextos de ejecución aislados** que no comparten memoria directa y deben coordinarse mediante mensajería (`chrome.runtime` / `chrome.tabs`) y almacenamiento reactivo compartido (`@plasmohq/storage`).

---

## 1. Modelo de Tres Contextos Aislados

```mermaid
flowchart TB
  subgraph SidePanelContext ["Contexto 1: Side Panel UI (React)"]
    SidePanel["src/sidepanel/index.tsx + components/tabs/*"]
    SendCmd["utils/step-helpers.ts (sendOrchestratorCommand)"]
  end

  subgraph StorageLayer ["Estado Reactivo Compartido (@plasmohq/storage)"]
    LocalStorage["src/storage/workflow-storage.ts (STORAGE_KEYS)"]
  end

  subgraph BackgroundContext ["Contexto 2: Background Service Worker"]
    MsgListener["src/background/index.ts (onMessage Router)"]
    Orchestrator["runners/orchestrator.ts + records/dom-list/table runners"]
    TabMessenger["tab-messenger.ts (sendMessageToTabWithRetry)"]
    StateMgr["state-manager.ts (updateExecutionState)"]
  end

  subgraph ContentContext ["Contexto 3: Content Scripts (Página Web)"]
    Picker["src/contents/picker-overlay.tsx (Shadow DOM plasmo-csui)"]
    Executor["src/contents/action-executor.ts (executeDomStep)"]
    NativeSetter["setNativeValue() + waitForElement()"]
  end

  SidePanel --> SendCmd
  SendCmd -->|"chrome.runtime.sendMessage"| MsgListener
  MsgListener --> Orchestrator
  Orchestrator -->|"EXECUTE_STEP"| TabMessenger
  Orchestrator --> StateMgr
  TabMessenger -->|"chrome.tabs.sendMessage"| Executor
  Executor --> NativeSetter

  SidePanel <-->|"useStorage()"| LocalStorage
  StateMgr <-->|"workflowStorage.get/set"| LocalStorage
  Picker <-->|"useStorage()"| LocalStorage
```

### Responsabilidades y Límites por Contexto

| Contexto | Archivos fuente | Qué DEBE hacer | Qué NUNCA debe hacer |
| :--- | :--- | :--- | :--- |
| **1. Side Panel UI** | [`src/sidepanel/index.tsx`](../src/sidepanel/index.tsx)<br>`src/sidepanel/components/**`<br>`src/sidepanel/utils/**` | Renderizar el selector de modo (`ModeSelectorBar`: `records_loop`, `dom_list_extract` y `html_table_extract`), pestañas (`StepsTab`, `DataTab`, `RunTab`), configuración de listas DOM (`DomListConfigCard`), tablas HTML y columnas (`TableExtractConfigCard`), plantillas (`WorkflowLibraryCard`), parseo CSV/JSON (`records-parser.ts`), exportación de reportes (`workflow-io.ts`) y envío de comandos (`sendOrchestratorCommand`). | **Nunca** ejecutar el bucle iterativo ni intentar acceder al DOM de la pestaña activa directamente. |
| **2. Background Service Worker** | [`src/background/index.ts`](../src/background/index.ts)<br>[`src/background/runners/orchestrator.ts`](../src/background/runners/orchestrator.ts)<br>[`src/background/runners/records-runner.ts`](../src/background/runners/records-runner.ts)<br>[`src/background/runners/dom-list-runner.ts`](../src/background/runners/dom-list-runner.ts)<br>[`src/background/runners/table-runner.ts`](../src/background/runners/table-runner.ts)<br>[`src/background/tab-messenger.ts`](../src/background/tab-messenger.ts)<br>[`src/background/state-manager.ts`](../src/background/state-manager.ts) | Ser el **único dueño del bucle de ejecución (`runWorkflowLoop`)**, enrutar según `WORKFLOW_MODE` hacia `runRecordsIteration`, `runDomListExtraction` o `runHtmlTableExtraction`, sincronizar el estado de selección visual (`syncPickerStateInActiveTab`), garantizar la inyección dinámica de Content Scripts en pestañas preexistentes (`ensureContentScriptsInTab`), actualizar métricas de avance (`detectedListCount`, `detectedTableRowCount`, `detectedTableColumnCount`), resolver la pestaña activa (`getActiveTabId`), esperar a que la pestaña cargue (`waitForTabComplete`) y reintentar el envío de mensajes (`sendMessageToTabWithRetry`). | **Nunca** asumir que existe `window` o `document`. Todo acceso al DOM se delega al Content Script mediante `EXECUTE_STEP`, `INSPECT_LIST_PAGE`, `INSPECT_TABLE_PAGE`, `EXTRACT_TABLE_ROW`, `CLICK_NEXT_PAGE` o `SYNC_PICKING_STATE`. |
| **3. Content Scripts (DOM)** | [`src/contents/action-executor.ts`](../src/contents/action-executor.ts)<br>[`src/contents/picker-overlay.tsx`](../src/contents/picker-overlay.tsx) | Ejecutar pasos individuales sobre el DOM global o acotados a un ítem de lista (`executeDomStep`), inspeccionar listas y tablas (`handleInspectListPage`, `handleInspectTablePage`, `handleExtractTableRow`), avanzar paginación (`handleClickNextPage`) y proveer el selector visual interactivo (`PickerOverlay`) para pasos, contenedores repetitivos, tablas `<table>`, filas de cabecera `<tr>` y botón Siguiente. | **Nunca** almacenar el estado maestro del bucle en variables locales de la página (si la página navega o se recarga, el contexto del Content Script se destruye). |

---

## 2. Flujos Principales del Sistema

### Flujo A: Selección Visual de Selectores CSS (`PickerOverlay`)

Cuando el usuario pulsa el botón **Elegir** en un paso dentro del Side Panel, se activa el modo de inspección sobre la página web activa sin que el clic del usuario dispare eventos nativos de la página (como abrir enlaces o enviar formularios).

```mermaid
sequenceDiagram
  autonumber
  participant User as Usuario
  participant SidePanel as SidePanelApp (sidepanel/index.tsx)
  participant BG as Service Worker (background/index.ts)
  participant Storage as workflowStorage (chrome.storage.local)
  participant Picker as PickerOverlay (contents/picker-overlay.tsx)

  User->>SidePanel: Clic en botón "Elegir" de un paso (stepId)
  SidePanel->>BG: sendOrchestratorCommand({ type: "START_PICKING", stepId })
  BG->>Storage: updateExecutionState({ status: "picking", pickingForStepId: stepId })
  BG->>Picker: ensureContentScriptsInTab() + SYNC_PICKING_STATE
  Storage-->>SidePanel: Reactiva UI (botón cambia a "Cancelar")
  Storage-->>Picker: useStorage / SYNC_PICKING_STATE activa overlay
  User->>Picker: Mueve el cursor sobre la página (mousemove capture)
  Picker->>Picker: getTargetPageElementAtPoint() + computeSafeSelector() y dibuja HighlightBox
  User->>Picker: Clic sobre el elemento deseado (click capture)
  Picker->>Picker: preventDefault() + stopImmediatePropagation()
  Picker->>Storage: setSteps / setDomListConfig / setTableExtractConfig
  Picker->>Storage: setExecutionState({ status: "idle", lastPickedSelector, logs })
  Storage-->>SidePanel: Input de selector CSS se actualiza automáticamente
```

### Flujo B: Ejecución Iterativa del Flujo RPA (`runWorkflowLoop`)

El bucle recorre cada fila de `RECORDS` (`currentRecordIndex`) y, dentro de cada fila, cada paso de `STEPS` (`currentStepIndex`). Al residir en el Service Worker y apoyarse en `waitForTabComplete` + reintentos en `sendStepToTab`, el flujo tolera recargas de página provocadas por envíos de formularios.

```mermaid
sequenceDiagram
  autonumber
  participant User as Usuario
  participant SidePanel as SidePanelApp (sidepanel/index.tsx)
  participant BG as Service Worker (background/index.ts)
  participant Storage as workflowStorage (chrome.storage.local)
  participant Executor as Action Executor (contents/action-executor.ts)

  User->>SidePanel: Clic en "Iniciar Iteración"
  SidePanel->>BG: sendOrchestratorCommand({ type: "START_WORKFLOW" })
  BG->>Storage: updateExecutionState({ status: "running", currentRecordIndex: 0, currentStepIndex: 0 })
  BG->>BG: Inicia runWorkflowLoop()

  loop Mientras isLoopRunning && state.status === "running"
    BG->>Storage: Lee state, records y steps
    BG->>BG: getActiveTabId() + waitForTabComplete(tabId)
    BG->>Executor: chrome.tabs.sendMessage({ type: "EXECUTE_STEP", step, record })
    Executor->>Executor: waitForElement(selector) + scrollIntoView + flashElementHighlight
    Executor->>Executor: Ejecuta acción (click / input con setNativeValue / wait)
    Executor-->>BG: ExecuteStepResponse ({ ok: true, message })
    BG->>Storage: Avanza currentStepIndex / currentRecordIndex y agrega entrada a logs
    Storage-->>SidePanel: Actualiza barra de progreso y bitácora en tiempo real
  end

  BG->>Storage: Al terminar todos los registros: status = "completed"
```

---

## 3. Máquina de Estados de `ExecutionState`

El estado global de la extensión está gobernado por la propiedad `status` de `ExecutionState` definida en [`src/types/workflow.ts`](../src/types/workflow.ts):

```mermaid
stateDiagram-v2
  [*] --> idle
  idle --> picking : START_PICKING
  picking --> idle : Elemento seleccionado / ESC / CANCEL_PICKING

  idle --> running : START_WORKFLOW
  running --> paused : PAUSE_WORKFLOW
  paused --> running : RESUME_WORKFLOW
  paused --> idle : STOP_WORKFLOW
  running --> idle : STOP_WORKFLOW

  running --> completed : currentRecordIndex >= records.length
  running --> error : stepResponse.ok === false / excepción
  completed --> running : START_WORKFLOW
  error --> running : START_WORKFLOW / RESUME_WORKFLOW
  completed --> idle : STOP_WORKFLOW
  error --> idle : STOP_WORKFLOW
```

### Reglas de transición importantes

1. **Idempotencia del bucle (`isLoopRunning`):** En [`src/background/runners/orchestrator.ts`](../src/background/runners/orchestrator.ts), la bandera en memoria `isLoopRunning` evita que se lancen dos instancias simultáneas de `runWorkflowLoop()`.
2. **Doble verificación tras operaciones asíncronas:** Después de esperar la respuesta de `sendMessageToTabWithRetry(...)`, `runRecordsIteration()` vuelve a leer `latestState` mediante `getExecutionState()` antes de escribir el avance de índices. Esto garantiza que si el usuario pulsó **Pausar** o **Detener** mientras un paso estaba en vuelo, su decisión no sea sobrescrita.
3. **Retención acotada de bitácora:** Cada vez que se agrega un mensaje a `logs` mediante `appendLogEntry(prev.logs, text)` en [`src/background/state-manager.ts`](../src/background/state-manager.ts), se conserva únicamente el historial reciente mediante `...logs.slice(-99)` (máximo 100 entradas) para no saturar `chrome.storage.local`.
