# [F-02] Acción `keypress` (Simulación de teclas especiales)

- **ID:** `F-02`
- **Versión objetivo:** `v0.2.0`
- **Estado:** `[x] Completado`
- **Prioridad:** Alta
- **Esfuerzo estimado:** S
- **Playbook técnico relacionado:** [Playbook 1: Cómo agregar un nuevo `ActionType`](../../../docs/03-guia-extensibilidad.md)

---

## 1. Descripción y Problema a Resolver

Existen barras de búsqueda, tablas editables y formularios modernos que no tienen un botón de envío explícito, sino que disparan la acción al presionar `Enter`, `Tab` o `Escape` sobre un campo activo. Actualmente no es posible simular pulsaciones de teclado dentro de la secuencia de pasos.

---

## 2. Propuesta de Solución (UX / UI)

- En la pestaña **Pasos** (`src/sidepanel/index.tsx`), agregar el botón **`+ Tecla`** para añadir un paso de tipo `keypress`.
- La tarjeta del paso permitirá configurar:
  - **Selector CSS** del elemento donde se enfocará y enviará la tecla (con soporte para el botón **Elegir**).
  - **Selector de tecla (`key`):** Selector desplegable con las teclas más comunes en automatización RPA: `Enter`, `Tab`, `Escape`, `Backspace`, `ArrowDown`, `ArrowUp`, `Space`.

---

## 3. Impacto Técnico por Capa (Arquitectura MV3)

- [x] **Contratos y Tipos (`src/types/workflow.ts`):**
  - Añadir `"keypress"` a `ActionType`.
  - Agregar la propiedad opcional `key?: string` en `WorkflowStep`.
- [x] **Content Scripts (`src/contents/action-executor.ts`):**
  - Implementar la rama `if (step.type === "keypress")` dentro de `executeDomStep`.
  - Enfocar el elemento (`element.focus()`) y despachar la secuencia de eventos `keydown`, `keypress` y `keyup` (`KeyboardEvent`) con `{ key, code, bubbles: true, cancelable: true }`.
  - Si la tecla es `Enter` y el elemento pertenece a un `<form>`, evaluar el comportamiento estándar de envío o disparo de listeners en aplicaciones SPA.
- [x] **Interfaz Side Panel (`src/sidepanel/index.tsx`):**
  - Agregar botón `+ Tecla` y selector desplegable para elegir `step.key` (por defecto `"Enter"`).

---

## 4. Criterios de Aceptación (Checklist de Verificación)

- [x] Permite configurar qué tecla presionar (`Enter`, `Tab`, `Escape`, etc.) sobre un selector específico.
- [x] Despacha los eventos `keydown` y `keyup` con `bubbles: true` sobre el elemento objetivo tras hacer `focus()`.
- [x] Registra en la bitácora de ejecución qué tecla fue presionada y sobre qué selector.
- [x] Compila sin errores (`npm run build`) y se actualiza el grafo con `graphify update .`.
