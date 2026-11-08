# [F-03] Reordenar pasos en la secuencia (Subir / Bajar)

- **ID:** `F-03`
- **Versión objetivo:** `v0.2.0`
- **Estado:** `[x] Completado`
- **Prioridad:** Media
- **Esfuerzo estimado:** S
- **Playbook técnico relacionado:** Estándares de estado reactivo en [`docs/02-patrones-y-estandares.md`](../../../docs/02-patrones-y-estandares.md)

---

## 1. Descripción y Problema a Resolver

Actualmente en la pestaña **Pasos**, los pasos nuevos siempre se agregan al final de la lista. Si el usuario olvida un paso intermedio (por ejemplo, una espera o un clic previo), debe eliminar los pasos posteriores y volver a crearlos manualmente para corregir el orden.

---

## 2. Propuesta de Solución (UX / UI)

- En el encabezado de cada tarjeta de paso dentro de `src/sidepanel/index.tsx` (junto al botón de eliminar paso), agregar dos botones compactos con iconos (`ChevronUp` y `ChevronDown` de `lucide-react`):
  - **Subir paso (`moveStepUp`):** Intercambia el paso actual con el anterior (`index - 1`). Deshabilitado en el primer paso (`index === 0`).
  - **Bajar paso (`moveStepDown`):** Intercambia el paso actual con el siguiente (`index + 1`). Deshabilitado en el último paso (`index === steps.length - 1`).
  - Botón **Duplicar paso** (`Copy`) para clonar rápidamente un paso con un nuevo `id`.

---

## 3. Impacto Técnico por Capa (Arquitectura MV3)

- [x] **Interfaz Side Panel (`src/sidepanel/index.tsx`):**
  - Implementar `moveStep` y `duplicateStep` que actualizan el arreglo `steps` mediante `setSteps` en `@plasmohq/storage`.
  - Renderizar los botones de ordenamiento con iconos `ChevronUp`, `ChevronDown` y `Copy`, además de insignias por tipo de paso y estados `disabled` apropiados cuando el paso esté en los extremos o cuando `executionState.status === "running"`.

---

## 4. Criterios de Aceptación (Checklist de Verificación)

- [x] Los botones de subir, bajar y duplicar cambian inmediatamente el orden visual y persistente en `STORAGE_KEYS.STEPS`.
- [x] El primer paso tiene deshabilitado el botón de subir y el último paso tiene deshabilitado el botón de bajar.
- [x] Al ejecutar el flujo en la pestaña **Ejecutar**, el Service Worker respeta el nuevo orden guardado.
- [x] Compila sin errores (`npm run build`) y se actualiza el grafo con `graphify update .`.
