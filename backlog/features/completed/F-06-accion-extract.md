# [F-06] Acción `extract` para leer texto o atributos del DOM por registro

- **ID:** `F-06`
- **Versión objetivo:** `v0.4.0`
- **Estado:** `[x] Completado`
- **Prioridad:** Alta
- **Esfuerzo estimado:** M
- **Playbook técnico relacionado:** [Playbook 1: Cómo agregar un nuevo `ActionType`](../../../docs/03-guia-extensibilidad.md)

---

## 1. Descripción y Problema a Resolver

En muchos flujos RPA, tras ingresar datos de un registro y enviar un formulario o consulta, la página muestra un resultado (ej. un código de confirmación, folio generado, estado de cuenta o precio) que el usuario necesita capturar y asociar a esa fila. Actualmente la extensión solo envía datos hacia la página, pero no extrae valores de vuelta.

---

## 2. Propuesta de Solución (UX / UI)

- Agregar el botón **`+ Extraer`** en la pestaña **Pasos** (`src/sidepanel/index.tsx`).
- Configuración del paso `extract`:
  - **Selector CSS** del elemento del cual se extraerá el dato (con botón **Elegir**).
  - **Nombre de columna de salida (`outputColumn`):** Nombre del campo donde se guardará el valor extraído para ese registro (ej. `folio_respuesta`).
  - **Propiedad a extraer (`extractSource`):** `"textContent"` (por defecto), `"value"` o nombre de atributo HTML (`href`, `src`, `data-*`).

---

## 3. Impacto Técnico por Capa (Arquitectura MV3)

- [x] **Contratos y Tipos (`src/types/workflow.ts`):**
  - Añadir `"extract"` a `ActionType` y `ExtractSourceType`.
  - Añadir `outputColumn?: string`, `extractSource?: ExtractSourceType` y `extractAttribute?: string` en `WorkflowStep`.
  - Añadir `extractedValue?: string` en `ExecuteStepResponse`.
- [x] **Content Scripts (`src/contents/action-executor.ts`):**
  - En `executeDomStep`, implementar la rama `if (step.type === "extract")`: esperar al elemento con `waitForElement`, resaltarlo con `flashElementHighlight`, leer su `textContent`, `value` o `getAttribute(...)` y devolverlo en `ExecuteStepResponse.extractedValue`.
- [x] **Orquestador Background (`src/background/index.ts`):**
  - En `runWorkflowLoop`, cuando un paso de tipo `extract` devuelva `extractedValue`, almacenarlo asociado al registro actual (`recordIndex` y `step.outputColumn`).
- [x] **Interfaz Side Panel (`src/sidepanel/index.tsx`):**
  - Agregar controles para definir el selector, el nombre de la columna de salida (`outputColumn`) y la propiedad o atributo a extraer.

---

## 4. Criterios de Aceptación (Checklist de Verificación)

- [x] Espera de forma resiliente (`waitForElement`) a que el elemento de resultado aparezca en el DOM antes de extraer su texto.
- [x] Captura el texto o atributo del elemento y lo registra tanto en la bitácora como en los resultados de la iteración actual.
- [x] Compila sin errores (`npm run build`) y se actualiza el grafo con `graphify update .`.
