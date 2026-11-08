# [F-13] Paginación automática configurable para extracción de listas web

- **ID:** `F-13`
- **Versión objetivo:** `v0.5.0`
- **Estado:** `[x] Completado`
- **Prioridad:** Alta
- **Esfuerzo estimado:** M
- **Playbook técnico relacionado:** [Playbook 2 (`OrchestratorCommand`) y Playbook 3 (`STORAGE_KEYS`)](../../../docs/03-guia-extensibilidad.md)

---

## 1. Descripción y Problema a Resolver

En la mayoría de sitios web (e-commerce, portales inmobiliarios, directorios, tablas administrativas), los listados de componentes repetitivos están divididos en múltiples páginas. Esta funcionalidad extiende el modo **Extraer Lista Web (`dom_list_extract`)** permitiendo configurar el botón de **"Siguiente página"** para que el orquestador navegue automáticamente por todas las páginas disponibles y consolide los datos extraídos en un único reporte CSV.

---

## 2. Propuesta de Solución (UX / UI)

- **Sección de Paginación Automática en `src/sidepanel/components/DomListConfigCard.tsx`:**
  - Interruptor **"Recorrer múltiples páginas (Paginación automática)"** (`pagination.enabled`).
  - Controles para:
    - **Selector CSS del botón "Siguiente página" (`nextButtonSelector`)** con botón **`Elegir`** (`pickingTarget: "pagination_next"`).
    - **Máximo de páginas (`maxPages`)** y **Espera tras clic (`waitAfterClickMs`)**.
- **Progreso y Bitácora en `src/sidepanel/components/tabs/RunTab.tsx`:**
  - Muestra la página actual (`Página X (máx. Y)`) y el total acumulado de elementos extraídos.

---

## 3. Impacto Técnico por Capa (Arquitectura MV3)

- [x] **Contratos y Tipos (`src/types/workflow.ts`):**
  - Interfaz `PaginationConfig` integrada en `DomListConfig`.
  - Propiedad `currentPage?: number` en `ExecutionState`.
  - Mensaje `CLICK_NEXT_PAGE` y respuesta `ClickNextPageResponse`.
- [x] **Content Scripts (`src/contents/action-executor.ts` y `src/contents/picker-overlay.tsx`):**
  - En `picker-overlay.tsx`: captura de `pagination_next` hacia `domListConfig.pagination.nextButtonSelector`.
  - En `action-executor.ts`: manejador `handleClickNextPage` con validación de botón inexistente o deshabilitado (`disabled`, `aria-disabled="true"`, `.disabled`, `pointer-events: none`, oculto) y firma de página `pageSignature` en `handleInspectListPage`.
- [x] **Orquestador Background (`src/background/runners/dom-list-runner.ts`):**
  - Avance automático de página al completar los ítems de la vista actual, espera con `waitForTabComplete` + `delay(waitAfterClickMs)` y verificación de cambio de `pageSignature` para evitar bucles infinitos.
- [x] **Interfaz Side Panel (`src/sidepanel/components/DomListConfigCard.tsx` y `src/sidepanel/components/tabs/RunTab.tsx`):**
  - Configuración interactiva de paginación y visualización de progreso por página.

---

## 4. Criterios de Aceptación (Checklist de Verificación)

- [x] El usuario puede activar la paginación y elegir visualmente el botón "Siguiente" mediante `PickerOverlay`.
- [x] Al terminar de extraer los ítems de una página, el orquestador hace clic en el botón "Siguiente", espera la carga y continúa extrayendo la nueva página.
- [x] El bucle se detiene automáticamente sin marcar error cuando el botón desaparece/está deshabilitado, cuando `pageSignature` no cambia o cuando se alcanza `maxPages` / `maxItems`.
- [x] Todos los registros extraídos a lo largo de las múltiples páginas se acumulan en `ExecutionState.results` y pueden descargarse en un único archivo CSV.
- [x] Cumple con los estándares de `docs/02-patrones-y-estandares.md` y documentación actualizada.
- [x] Compila sin errores de TypeScript (`npm run build`).
- [x] Grafo de conocimiento actualizado con `graphify update .` tras finalizar la implementación.
