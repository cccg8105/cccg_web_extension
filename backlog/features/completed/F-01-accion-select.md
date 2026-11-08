# [F-01] Acción `select` (Listas desplegables `<select>`)

- **ID:** `F-01`
- **Versión objetivo:** `v0.2.0`
- **Estado:** `[x] Completado`
- **Prioridad:** Alta
- **Esfuerzo estimado:** S
- **Playbook técnico relacionado:** [Playbook 1: Cómo agregar un nuevo `ActionType`](../../../docs/03-guia-extensibilidad.md)

---

## 1. Descripción y Problema a Resolver

Actualmente **AutoLoop RPA** soporta acciones de tipo `click`, `input` y `wait`. Sin embargo, muchos formularios web incluyen listas desplegables nativas (`<select>`) donde el usuario necesita elegir una opción dinámica según el registro actual (por ejemplo, seleccionar el país, categoría o `{{rol}}`). Intentar automatizar un `<select>` solo con `click` no es confiable entre navegadores.

---

## 2. Propuesta de Solución (UX / UI)

- En la pestaña **Pasos** del Side Panel (`src/sidepanel/index.tsx`), agregar el botón **`+ Select`** en la barra de creación de pasos.
- La tarjeta del paso tipo `select` mostrará:
  - El campo de **Selector CSS** junto con el botón **Elegir** (`PickerOverlay`).
  - El campo de **Valor o texto de la opción** (`valueTemplate`) con soporte para insertar variables `{{columna}}` mediante los botones rápidos.
- Durante la ejecución, el paso buscará primero una `<option>` cuyo `value` coincida exactamente con el texto interpolado y, como respaldo, una `<option>` cuyo `textContent` (sin espacios extremos) coincida.

---

## 3. Impacto Técnico por Capa (Arquitectura MV3)

- [x] **Contratos y Tipos (`src/types/workflow.ts`):**
  - Extender `ActionType` a `"click" | "input" | "wait" | "select" | "keypress"`.
- [x] **Content Scripts (`src/contents/action-executor.ts`):**
  - En `executeDomStep`, agregar la rama `if (step.type === "select")`.
  - Validar que el elemento sea instancia de `HTMLSelectElement` (o contenga un `<select>`).
  - Resolver la opción por `value` o etiqueta visible, aplicar el cambio mediante `setNativeValue(selectEl, matchedOption.value)` y despachar eventos `input` y `change` con `bubbles: true`.
- [x] **Interfaz Side Panel (`src/sidepanel/index.tsx`):**
  - Añadir la etiqueta por defecto e icono para `"select"` en `addStep`.
  - Mostrar los controles de selector y `valueTemplate` para pasos de tipo `"select"`.

---

## 4. Criterios de Aceptación (Checklist de Verificación)

- [x] Permite elegir un elemento `<select>` en la página usando el selector visual (`PickerOverlay`).
- [x] Soporta valores estáticos y plantillas con variables `{{columna}}`.
- [x] Selecciona correctamente la opción tanto si el CSV contiene el atributo `value` como si contiene el texto visible de la `<option>`.
- [x] Notifica correctamente a frameworks reactivos (React/Vue/Angular) disparando `change` con `setNativeValue`.
- [x] Si ninguna `<option>` coincide con el valor buscado, devuelve `{ ok: false, message: "..." }` detallando el valor no encontrado.
- [x] Compila sin errores (`npm run build`) y se actualiza el grafo con `graphify update .`.
