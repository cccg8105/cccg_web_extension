# 02. Patrones de Diseño y Estándares de Código

Este documento describe los estándares técnicos y patrones de implementación que utiliza **AutoLoop RPA**. Todo cambio o nueva funcionalidad debe respetar estas reglas para mantener la estabilidad entre contextos de Chrome MV3 y la compatibilidad con cualquier sitio web.

---

## 1. Contrato de Tipos Centralizado y Alias de Importación (`~*`)

### Regla 1.1: Todos los tipos compartidos viven en `src/types/workflow.ts`
Dado que el `Side Panel`, el `Service Worker` y los `Content Scripts` se comunican por mensajes serializados en JSON y almacenamiento local, **ningún módulo debe definir payloads o estados compartidos de forma aislada**.

- Los comandos hacia el Service Worker se modelan como la unión discriminada `OrchestratorCommand`.
- Los mensajes hacia el Content Script usan `ExecuteStepPayload` y siempre responden con `ExecuteStepResponse` (`{ ok: boolean; message: string }`).

### Regla 1.2: Usar el alias `~*` para importaciones internas
El archivo [`tsconfig.json`](../tsconfig.json) define `"~*": ["./src/*"]`. Utiliza siempre rutas con `~` en lugar de rutas relativas profundas (`../../`):

```typescript
// Correcto
import { STORAGE_KEYS, workflowStorage } from "~storage/workflow-storage"
import type { ExecutionState, WorkflowStep } from "~types/workflow"

// Incorrecto
import { STORAGE_KEYS } from "../storage/workflow-storage"
```

---

## 2. Sincronización de Estado Persistente (`@plasmohq/storage`)

### Regla 2.1: Instancia única `workflowStorage` y claves en `STORAGE_KEYS`
En [`src/storage/workflow-storage.ts`](../src/storage/workflow-storage.ts) se exporta una única instancia configurada en el área `"local"`:

```typescript
export const workflowStorage = new Storage({
  area: "local"
})

export const STORAGE_KEYS = {
  WORKFLOW_MODE: "rpa_workflow_mode",
  DOM_LIST_CONFIG: "rpa_dom_list_config",
  EXECUTION_OPTIONS: "rpa_execution_options",
  RECORDS: "rpa_records",
  STEPS: "rpa_steps",
  EXECUTION_STATE: "rpa_execution_state",
  SAVED_WORKFLOWS: "rpa_saved_workflows"
} as const
```

- **Nunca** uses `localStorage` ni `sessionStorage` del navegador (no son compartidos entre el Service Worker, el Side Panel y los Content Scripts).
- **En componentes React (`sidepanel` y `picker-overlay`):** consume el estado pasando siempre `{ key: STORAGE_KEYS.X, instance: workflowStorage }` al hook `useStorage`:

```typescript
const [steps, setSteps] = useStorage<WorkflowStep[]>(
  {
    key: STORAGE_KEYS.STEPS,
    instance: workflowStorage
  },
  SAMPLE_STEPS
)
```

- **En el Service Worker (`src/background/`):** utiliza siempre las funciones auxiliares de [`src/background/state-manager.ts`](../src/background/state-manager.ts) (`updateExecutionState((prev) => ({ ...prev, ... }))` y `appendLogEntry(prev.logs, text)`) para leer el estado actual, aplicar una transformación inmutable y persistirlo.

---

## 3. Manipulación del DOM Compatible con Frameworks Reactivos

Uno de los problemas más comunes en herramientas RPA web es que asignar `input.value = "texto"` directamente **no actualiza el estado interno** de aplicaciones construidas con **React, Vue o Angular**, porque dichos frameworks sobrescriben el *setter* de la propiedad `value` en la instancia del elemento.

### Regla 3.1: Usar siempre `setNativeValue` para escribir en campos de formulario
En [`src/contents/action-executor.ts`](../src/contents/action-executor.ts) (líneas 71–92), la función `setNativeValue` invoca el *setter* original del prototipo nativo (`HTMLInputElement`, `HTMLTextAreaElement` o `HTMLSelectElement`) y despacha eventos con `{ bubbles: true }`:

```typescript
function setNativeValue(
  element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
  value: string
): void {
  const valueSetter = Object.getOwnPropertyDescriptor(element, "value")?.set
  const prototype = Object.getPrototypeOf(element)
  const prototypeValueSetter = Object.getOwnPropertyDescriptor(
    prototype,
    "value"
  )?.set

  if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
    prototypeValueSetter.call(element, value)
  } else if (valueSetter) {
    valueSetter.call(element, value)
  } else {
    element.value = value
  }

  element.dispatchEvent(new Event("input", { bubbles: true }))
  element.dispatchEvent(new Event("change", { bubbles: true }))
}
```

### Regla 3.2: Esperar elementos de forma resiliente con `waitForElement` y activar *lazy-loading* en listas
Las aplicaciones SPA renderizan elementos de forma asíncrona. Antes de ejecutar cualquier acción sobre un selector CSS, **siempre** se debe resolver el elemento mediante `waitForElement(selector, timeoutMs)` (que utiliza `MutationObserver` sobre `document.documentElement`), hacer scroll suave hacia él (`scrollIntoView`) y resaltarlo visualmente con `flashElementHighlight(element)`.
Cuando se ejecuta un paso dentro de un contenedor de lista (`listItemSelector`), `resolveStepTargetElement` en [`src/contents/action-executor.ts`](../src/contents/action-executor.ts) desplaza primero el contenedor `items[recordIndex]` hacia el viewport antes de esperar al sub-elemento (`waitForScopedElement`) para disparar el *lazy-loading* de la página.

### Regla 3.3: Selectores relativos sin IDs dinámicos en listas (`computeRelativeListItemSelector`)
En el modo de extracción de listas (`dom_list_extract`), [`src/contents/picker-overlay.tsx`](../src/contents/picker-overlay.tsx) genera selectores relativos al contenedor repetitivo configurando `@medv/finder` con `idName: () => false` y `className: isStableClassName` (descartando IDs únicos de producto y clases hash como `jsx-*`), y validando la cobertura del selector en todos los contenedores de la lista (`countMatchingListContainers`).

### Regla 3.4: Interpolación de variables `{{columna}}`
Cualquier paso que acepte texto parametrizado por el registro actual debe pasar el string por `interpolateTemplate(template, record)` en [`src/contents/action-executor.ts`](../src/contents/action-executor.ts), el cual reemplaza todas las ocurrencias de `{{clave}}` por el valor correspondiente en `DataRecord`.

---

## 4. Aislamiento de UI y Eventos en Content Scripts (`Shadow DOM`)

El archivo [`src/contents/picker-overlay.tsx`](../src/contents/picker-overlay.tsx) se inyecta en todas las páginas web (`matches: ["<all_urls>"]`). Para evitar conflictos de CSS con la página huésped o capturar por error elementos de la propia extensión, sigue tres patrones obligatorios:

### Regla 4.1: Inyección de Tailwind CSS dentro del Shadow DOM de Plasmo
Plasmo monta los componentes `.tsx` de `src/contents/` dentro de un elemento `<plasmo-csui>` con Shadow DOM adjunto. Para que las clases de Tailwind funcionen allí sin contaminar la página:

```typescript
import cssText from "data-text:~style.css"

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}
```

### Regla 4.2: Ignorar el propio overlay al inspeccionar el DOM
Cuando se usa `document.elementFromPoint(event.clientX, event.clientY)`, se debe verificar siempre `isExtensionOverlayElement(target)` (`Boolean(el.closest("plasmo-csui"))`) para no seleccionar la barra flotante de la propia extensión.

### Regla 4.3: Captura de eventos en fase `capture` (`true`)
Durante el modo selección (`isPicking === true`), los listeners de `mousemove`, `click` y `keydown` se registran en `window` con `useCapture = true`:

```typescript
window.addEventListener("click", handleClick, true)
```

Y dentro de `handleClick` se invoca:

```typescript
event.preventDefault()
event.stopPropagation()
event.stopImmediatePropagation()
```

Esto garantiza que el clic para capturar un selector no dispare la navegación de un `<a href="...">` ni el `submit` de un botón en la página del usuario.

---

## 5. Manejo de Errores entre Contextos

1. **En `src/contents/action-executor.ts`:**
   - El listener `chrome.runtime.onMessage` **siempre** retorna `true` (indicando respuesta asíncrona) y captura cualquier promesa rechazada en `.catch(...)`, devolviendo `{ ok: false, message: errorMsg } satisfies ExecuteStepResponse`.
   - Nunca dejes un camino de ejecución sin llamar a `sendResponse(...)`, ya que dejaría colgado el bucle del Service Worker.
2. **En `src/background/tab-messenger.ts` y `src/background/runners/`:**
   - `sendMessageToTabWithRetry` espera primero a `waitForTabComplete(tabId)` y realiza hasta **3 intentos** con una pausa de `500ms` entre ellos por si el Content Script se está reinicializando tras una navegación.
   - Si después de los reintentos o de la ejecución el resultado es `ok: false`, el runner (`records-runner.ts` o `dom-list-runner.ts`) actualiza la fila con `applyStepErrorToResults` y aplica la política configurada en `ExecutionOptions.onError`:
     - `"stop"`: transiciona `ExecutionState.status` a `"error"`, guarda el detalle en `errorMessage` y detiene el bucle.
     - `"skip"`: incrementa `skippedOrErrorCount`, registra la advertencia en `logs` mediante `appendLogEntry` y salta a la siguiente fila/ítem.
