# [F-17] Selectores relativos generalizados sin IDs dinámicos y soporte de lazy-loading en extracción de listas

- **ID:** `F-17`
- **Versión objetivo:** `v1.0.1`
- **Estado:** `[x] Completado`
- **Prioridad:** Crítica
- **Esfuerzo estimado:** M
- **Playbook técnico relacionado:** [Aislamiento y Manipulación DOM (`docs/02-patrones-y-estandares.md`)](../../../docs/02-patrones-y-estandares.md)

---

## 1. Descripción y Problema a Resolver

En sitios de e-commerce y aplicaciones modernas (React/Next.js), los sub-elementos dentro de tarjetas repetitivas suelen tener IDs únicos generados dinámicamente con el SKU o URL del producto o clases generadas (`jsx-*`). Esto provocaba que el selector relativo capturado solo funcionara en el primer ítem de la lista. Además, los elementos inferiores de la página requerían scroll previo sobre su contenedor para activar su *lazy-loading*.

---

## 2. Propuesta de Solución (UX / UI y Motor DOM)

1. **Generación de selectores relativos generalizados en `src/contents/picker-overlay.tsx`:**
   - Configuración de `@medv/finder` con `idName: () => false` y `className: isStableClassName` (filtrando clases dinámicas como `jsx-*`, `css-*`, `sc-*`).
   - Evaluación de cobertura multi-ítem (`countMatchingListContainers`) y candidatos de respaldo por prefijo de ID (`[id^="prefijo"]`), `data-testid`, clases estables y ruta estructural relativa.
   - Indicador en vivo de cobertura en el badge del `PickerOverlay` (`X/N ítems`).
2. **Scroll previo al contenedor en `src/contents/action-executor.ts`:**
   - En `resolveStepTargetElement`, el contenedor `items[recordIndex]` ejecuta `scrollIntoView` antes de `waitForScopedElement` para disparar la carga diferida (*lazy-load*).

---

## 3. Impacto Técnico por Capa (Arquitectura MV3)

- [x] **Content Scripts (`src/contents/picker-overlay.tsx` y `src/contents/action-executor.ts`):**
  - En `picker-overlay.tsx`: `isStableClassName`, `countMatchingListContainers`, `extractStableIdPrefix`, `computeRelativeListItemSelector` y badge de cobertura `X/N ítems`.
  - En `action-executor.ts`: `container.scrollIntoView` previo a `waitForScopedElement(container, subSelector, 4500)`.

---

## 4. Criterios de Aceptación (Checklist de Verificación)

- [x] Al seleccionar un sub-elemento dentro de un ítem de lista en modo `"dom_list_extract"`, el selector generado nunca incluye IDs únicos de producto.
- [x] El selector relativo generado se valida contra los demás contenedores de la lista y el `PickerOverlay` muestra en cuántos ítems coincide (`X/N ítems`).
- [x] Durante la ejecución de la extracción (`EXECUTE_STEP`), el contenedor `items[recordIndex]` hace scroll hacia el viewport antes de esperar al sub-elemento.
- [x] Cumple con los estándares de `docs/02-patrones-y-estandares.md` y documentación actualizada.
- [x] Compila sin errores de TypeScript (`npm run build`).
- [x] Grafo de conocimiento actualizado con `graphify update .` tras finalizar la implementación.
