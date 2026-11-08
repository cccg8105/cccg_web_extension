# 03. Guía Práctica de Extensibilidad (Playbooks)

Esta guía contiene recetas paso a paso (*playbooks*) para las tareas de evolución más frecuentes en **AutoLoop RPA**. Siguiendo estos pasos te aseguras de tocar exactamente los archivos necesarios sin romper la sincronización entre el Side Panel, el Service Worker y los Content Scripts.

---

## Playbook 1: Cómo agregar un nuevo `ActionType` (ej. `select`, `scroll`, `extract`, `keypress`)

Supongamos que deseas agregar una nueva acción `"select"` para elegir una opción dentro de un `<select>` HTML o `"keypress"` para presionar una tecla (como `Enter`).

### Paso 1: Extender los tipos en `src/types/workflow.ts`
1. Añade el nuevo literal a `ActionType`.
2. Si el paso requiere configuración adicional, agrega la propiedad opcional en `WorkflowStep`.

```typescript
// src/types/workflow.ts
export type ActionType = "click" | "input" | "wait" | "select"

export interface WorkflowStep {
  id: string
  type: ActionType
  label: string
  selector?: string
  valueTemplate?: string
  waitMs?: number
}
```

### Paso 2: Implementar la ejecución DOM en `src/contents/action-executor.ts`
Dentro de `executeDomStep(step: WorkflowStep, record: DataRecord)`:
- Si el paso **no requiere un elemento DOM** (como `"wait"`), manéjalo al inicio de `executeDomStep` antes de la validación de `step.selector`.
- Si el paso **sí interactúa con un elemento DOM**, añade su bloque después de `waitForElement`, `scrollIntoView` y `flashElementHighlight`, devolviendo siempre un `ExecuteStepResponse` (`{ ok: boolean, message: string }`):

```typescript
// src/contents/action-executor.ts (dentro de executeDomStep)
if (step.type === "select") {
  const resolvedValue = interpolateTemplate(step.valueTemplate ?? "", record)
  if (!(element instanceof HTMLSelectElement)) {
    throw new Error(
      `El elemento "${step.selector}" no es un <select> válido.`
    )
  }
  setNativeValue(element, resolvedValue)
  return {
    ok: true,
    message: `Opción "${resolvedValue}" seleccionada en "${step.selector}"`
  }
}
```

### Paso 3: Agregar el botón y controles en `src/sidepanel/`
1. En [`src/sidepanel/utils/step-helpers.ts`](../src/sidepanel/utils/step-helpers.ts), dentro de `createDefaultStep(type: ActionType, ...)`, agrega la etiqueta por defecto en `defaultLabels` y define los valores iniciales del paso.
2. En [`src/sidepanel/utils/workflow-io.ts`](../src/sidepanel/utils/workflow-io.ts), añade el nuevo literal al arreglo `VALID_ACTION_TYPES` para que la importación JSON lo reconozca.
3. En [`src/sidepanel/components/tabs/StepsTab.tsx`](../src/sidepanel/components/tabs/StepsTab.tsx), dentro de la sección `/* Add Step Buttons */`, agrega el botón para crear pasos del nuevo tipo.
4. En [`src/sidepanel/components/StepCard.tsx`](../src/sidepanel/components/StepCard.tsx), agrega el estilo de insignia en `BADGE_CONFIG` y habilita los controles de edición condicionales para ese `step.type`.

---

## Playbook 2: Cómo agregar un nuevo Comando de Orquestación (`OrchestratorCommand`)

Si necesitas que el Side Panel le pida una nueva operación al Background Service Worker (por ejemplo, `"RUN_SINGLE_STEP"` para probar un paso aislado o `"CLEAR_LOGS"`):

### Paso 1: Declarar el comando en `src/types/workflow.ts`
Añade un nuevo miembro a la unión discriminada `OrchestratorCommand`:

```typescript
// src/types/workflow.ts
export type OrchestratorCommand =
  | { type: "START_WORKFLOW"; tabId?: number }
  | { type: "PAUSE_WORKFLOW" }
  | { type: "RESUME_WORKFLOW"; tabId?: number }
  | { type: "STOP_WORKFLOW" }
  | { type: "START_PICKING"; stepId: string; tabId?: number }
  | { type: "CANCEL_PICKING" }
  | { type: "CLEAR_LOGS" }
```

### Paso 2: Manejar el comando en `src/background/index.ts` (y `runners/orchestrator.ts`)
En el `switch (message.type)` dentro de `chrome.runtime.onMessage.addListener` en [`src/background/index.ts`](../src/background/index.ts), agrega el nuevo `case` delegando la lógica a `orchestrator.ts` o `state-manager.ts`. Recuerda llamar siempre a `sendResponse({ ok: true })` al finalizar:

```typescript
// src/background/index.ts
case "CLEAR_LOGS": {
  await updateExecutionState((prev) => ({
    ...prev,
    logs: []
  }))
  sendResponse({ ok: true })
  break
}
```

### Paso 3: Invocarlo desde `src/sidepanel/`
Importa y utiliza `sendOrchestratorCommand` desde [`src/sidepanel/utils/step-helpers.ts`](../src/sidepanel/utils/step-helpers.ts):

```typescript
import { sendOrchestratorCommand } from "~sidepanel/utils/step-helpers"

sendOrchestratorCommand({ type: "CLEAR_LOGS" })
```

---

## Playbook 3: Cómo agregar una nueva clave persistente en `STORAGE_KEYS`

Si necesitas persistir una nueva entidad global (por ejemplo, configuración de velocidad de ejecución o plantillas guardadas):

### Paso 1: Definir la interfaz en `src/types/workflow.ts`
```typescript
export interface WorkflowSettings {
  stepDelayMs: number
  highlightElements: boolean
}
```

### Paso 2: Registrar la clave y el valor por defecto en `src/storage/workflow-storage.ts`
```typescript
export const STORAGE_KEYS = {
  RECORDS: "rpa_records",
  STEPS: "rpa_steps",
  EXECUTION_STATE: "rpa_execution_state",
  SETTINGS: "rpa_settings"
} as const

export const DEFAULT_SETTINGS: WorkflowSettings = {
  stepDelayMs: 250,
  highlightElements: true
}
```

### Paso 3: Consumirla en React o en el Service Worker
- **En React (`SidePanelApp` / `PickerOverlay`):**
  ```typescript
  const [settings, setSettings] = useStorage<WorkflowSettings>(
    {
      key: STORAGE_KEYS.SETTINGS,
      instance: workflowStorage
    },
    DEFAULT_SETTINGS
  )
  ```
- **En el Service Worker (`src/background/index.ts`):**
  ```typescript
  const settings =
    (await workflowStorage.get<WorkflowSettings>(STORAGE_KEYS.SETTINGS)) ??
    DEFAULT_SETTINGS
  ```

---

## Checklist Antes de Finalizar Cualquier Cambio

Antes de dar por completada una tarea en el repositorio, verifica los siguientes puntos:

- [ ] **Tipado estricto:** Todos los nuevos tipos están en `src/types/workflow.ts` y se importan con el alias `~types/workflow`.
- [ ] **Sin estado huérfano:** El estado compartido usa `workflowStorage` (`area: "local"`) y claves de `STORAGE_KEYS`.
- [ ] **Resiliencia en DOM:** Cualquier nueva interacción con elementos de la página usa `waitForElement` y, si modifica valores de controles de formulario, usa `setNativeValue`.
- [ ] **Respuestas garantizadas en mensajería:** Ningún listener de `chrome.runtime.onMessage` deja promesas sin resolver ni omite `sendResponse`.
- [ ] **Compilación limpia:** `npm run build` (o `npm run dev`) termina sin errores de TypeScript ni de empaquetado en Plasmo.
- [ ] **Documentación técnica actualizada:** Si se crearon/movieron módulos o cambiaron flujos, se actualizaron [`README.md`](../README.md) y los documentos de [`docs/`](./README.md).
- [ ] **Backlog e historial sincronizados:** Si el cambio implementa una funcionalidad de [`backlog/BACKLOG.md`](../backlog/BACKLOG.md), se marcaron sus checkboxes `[x]`, se movió el archivo de `backlog/features/` a `backlog/features/completed/` y se trasladó su registro desde `backlog/BACKLOG.md` hacia [`backlog/HISTORIAL.md`](../backlog/HISTORIAL.md).
- [ ] **Grafo de conocimiento actualizado:** Se ejecutó `graphify update .` (o `/graphify . --update`) para reflejar los nuevos nodos y relaciones en `graphify-out/`.
