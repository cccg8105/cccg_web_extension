# Historial de Versiones y Features Completadas — AutoLoop RPA

Este archivo mantiene el registro histórico (en orden cronológico inverso) de todas las versiones liberadas y las funcionalidades del backlog que ya han sido implementadas en **AutoLoop RPA**.

- **Backlog de funcionalidades pendientes y próximas versiones:** [`backlog/BACKLOG.md`](./BACKLOG.md)
- **Guía de gestión del backlog:** [`backlog/README.md`](./README.md)
- **Especificaciones archivadas de features completadas:** [`backlog/features/completed/`](./features/completed/)

---

<!--
Plantilla para registrar una nueva versión completada al moverla desde backlog/BACKLOG.md:

## [v0.X.0] — Nombre / Enfoque de la Versión
- **Estado:** `[x]` Completado
- **Resumen:** Descripción breve del objetivo alcanzado en esta versión.

| Estado | ID | Feature | Capas MV3 Modificadas | Especificación Archivada |
| :---: | :--- | :--- | :--- | :--- |
| `[x]` | **F-XX** | Nombre de la funcionalidad | `types`, `contents`, `sidepanel` | [Ver F-XX](./features/completed/F-XX-nombre.md) |
-->

## [v1.0.1] — Estabilidad de Selectores en Listas Web y Refinamiento UX
- **Estado:** `[x]` Completado
- **Resumen:** Generación de selectores relativos generalizados en listas web descartando IDs únicos de producto y clases dinámicas (`jsx-*`), validación de cobertura multi-ítem en `PickerOverlay`, `scrollIntoView` previo sobre cada contenedor para activar *lazy-loading*, y ocultamiento contextual de la pestaña `Registros` y controles de formulario cuando se opera en modo `Extraer Lista Web`.

| Estado | ID | Feature | Capas MV3 Modificadas | Especificación Archivada |
| :---: | :--- | :--- | :--- | :--- |
| `[x]` | **F-17** | Selectores relativos generalizados sin IDs dinámicos y soporte de *lazy-loading* en listas | `contents` | [Ver F-17](./features/completed/F-17-selectores-relativos-sin-id-dinamico.md) |
| `[x]` | **F-16** | Ocultar pestaña `Registros` y adaptar controles de pasos en modo `Extraer Lista Web` | `sidepanel` | [Ver F-16](./features/completed/F-16-ocultar-tab-registros-modo-lista.md) |

---

## [v1.0.0] — Resiliencia en Lotes y Lanzamiento Estable
- **Estado:** `[x]` Completado
- **Resumen:** Incorporación de políticas de resiliencia ante errores por fila/ítem (`Detener al fallar` vs `Saltar y continuar` registrando la incidencia en el reporte CSV) y configuración de rangos de iteración (`Desde #` hasta `Hasta #`), aplicables tanto a la iteración por registros CSV/JSON como a la extracción de listas DOM paginadas.

| Estado | ID | Feature | Capas MV3 Modificadas | Especificación Archivada |
| :---: | :--- | :--- | :--- | :--- |
| `[x]` | **F-08** | Política de manejo de errores por fila/ítem (*Detener flujo* vs *Saltar y continuar*) | `types`, `storage`, `background`, `sidepanel` | [Ver F-08](./features/completed/F-08-politica-errores-por-fila.md) |
| `[x]` | **F-09** | Rango de iteración configurable (Ejecutar desde fila/ítem `N` hasta `M`) | `types`, `storage`, `background`, `sidepanel` | [Ver F-09](./features/completed/F-09-rango-iteracion-configurable.md) |

---

## [v0.5.0] — Modos de Automatización y Extracción de Listas Web Paginadas
- **Estado:** `[x]` Completado
- **Resumen:** Incorporación del selector de modo de automatización (`records_loop` para iterar desde CSV/JSON vs `dom_list_extract` para extraer colecciones de elementos repetitivos del DOM), selección visual de contenedores repetitivos con cálculo de selectores relativos por ítem y soporte de paginación automática configurable con detección de última página y huella de contenido (`pageSignature`).

| Estado | ID | Feature | Capas MV3 Modificadas | Especificación Archivada |
| :---: | :--- | :--- | :--- | :--- |
| `[x]` | **F-12** | Modo de automatización seleccionable y extracción de listas de componentes DOM repetitivos | `types`, `storage`, `contents`, `background`, `sidepanel` | [Ver F-12](./features/completed/F-12-modo-extraccion-listas-dom.md) |
| `[x]` | **F-13** | Paginación automática configurable para extracción de listas web | `types`, `contents`, `background`, `sidepanel` | [Ver F-13](./features/completed/F-13-paginacion-automatica-listas.md) |

---

## [v0.4.1] — Refactorización Modular y Desacoplamiento (Cimiento Técnico)
- **Estado:** `[x]` Completado
- **Resumen:** Desacoplamiento del Service Worker (`src/background/`) en módulos de mensajería genérica con reintentos (`tab-messenger.ts`), gestor inmutable de estado y resultados (`state-manager.ts`) y estrategias de iteración (`runners/orchestrator.ts` y `runners/records-runner.ts`), junto con la modularización completa del Side Panel (`src/sidepanel/`) en utilidades puras (`utils/`), componentes de dominio (`components/`) y vistas por pestaña (`components/tabs/`).

| Estado | ID | Feature | Capas MV3 Modificadas | Especificación Archivada |
| :---: | :--- | :--- | :--- | :--- |
| `[x]` | **F-14** | Modularización del Orquestador Background (`tab-messenger`, `state-manager` y `runners/`) | `background` | [Ver F-14](./features/completed/F-14-refactor-modular-background.md) |
| `[x]` | **F-15** | Modularización de la Interfaz Side Panel (`tabs/`, `components/` y `utils/`) | `sidepanel` | [Ver F-15](./features/completed/F-15-refactor-modular-sidepanel.md) |

---

## [v0.4.0] — Extracción de Datos (Scraping Iterativo) y Reportes
- **Estado:** `[x]` Completado
- **Resumen:** Implementación del paso `extract` para leer texto visible, `value` o atributos HTML del DOM por cada registro iterado y generación de reporte consolidado descargable en formato `.csv` (con `Papa.unparse`, estado `_status`, `_error` y columnas extraídas).

| Estado | ID | Feature | Capas MV3 Modificadas | Especificación Archivada |
| :---: | :--- | :--- | :--- | :--- |
| `[x]` | **F-06** | Acción `extract` para leer texto o atributos del DOM por registro | `types`, `contents`, `background`, `sidepanel` | [Ver F-06](./features/completed/F-06-accion-extract.md) |
| `[x]` | **F-07** | Descarga de reporte CSV de ejecución (estado y datos extraídos) | `types`, `storage`, `background`, `sidepanel` | [Ver F-07](./features/completed/F-07-reporte-ejecucion-csv.md) |

---

## [v0.3.0] — Gestión de Plantillas y Flujos Guardados
- **Estado:** `[x]` Completado
- **Resumen:** Incorporación de exportación e importación de flujos en archivos `.json` con validación de estructura y biblioteca local persistente en `STORAGE_KEYS.SAVED_WORKFLOWS` para guardar, cargar, actualizar y eliminar múltiples recetas de automatización.

| Estado | ID | Feature | Capas MV3 Modificadas | Especificación Archivada |
| :---: | :--- | :--- | :--- | :--- |
| `[x]` | **F-04** | Exportar e importar flujo de pasos en archivo JSON | `types`, `sidepanel` | [Ver F-04](./features/completed/F-04-exportar-importar-flujo.md) |
| `[x]` | **F-05** | Biblioteca local de múltiples Workflows en Storage | `types`, `storage`, `sidepanel` | [Ver F-05](./features/completed/F-05-biblioteca-workflows.md) |

---

## [v0.2.0] — Nuevas Acciones DOM y UX de Pasos
- **Estado:** `[x]` Completado
- **Resumen:** Expansión del catálogo de acciones DOM (`select` y `keypress`) para soportar listas desplegables y pulsación de teclas especiales, junto con mejoras de edición de secuencias (iconos de ordenamiento, duplicación de pasos, insignias visuales y bloqueo durante ejecución).

| Estado | ID | Feature | Capas MV3 Modificadas | Especificación Archivada |
| :---: | :--- | :--- | :--- | :--- |
| `[x]` | **F-01** | Acción `select` (Listas desplegables `<select>`) | `types`, `contents`, `sidepanel` | [Ver F-01](./features/completed/F-01-accion-select.md) |
| `[x]` | **F-02** | Acción `keypress` (Simulación de teclas `Enter`, `Tab`, `Escape`) | `types`, `contents`, `sidepanel` | [Ver F-02](./features/completed/F-02-accion-keypress.md) |
| `[x]` | **F-03** | Reordenar y duplicar pasos en la secuencia | `sidepanel` | [Ver F-03](./features/completed/F-03-reordenar-pasos.md) |

---

## [v0.1.0] — MVP Base
- **Estado:** `[x]` Completado
- **Resumen:** Primera versión funcional de la extensión con selección visual de selectores CSS sobre cualquier página web, ejecución iterativa por lotes de registros (CSV/JSON) y compatibilidad con formularios controlados por frameworks modernos (React/Vue/Angular).

### Entregables implementados
- [x] Inspector visual de elementos DOM con aislamiento mediante Shadow DOM (`src/contents/picker-overlay.tsx`).
- [x] Ejecutor de acciones `click`, `input` (con `setNativeValue` e interpolación de variables `{{columna}}`) y `wait` (`src/contents/action-executor.ts`).
- [x] Orquestador iterativo en Background Service Worker con control de ciclo de vida: iniciar, pausar, reanudar y detener (`src/background/index.ts`).
- [x] Interfaz principal en Side Panel organizada en las pestañas **Registros**, **Pasos** y **Ejecutar** (`src/sidepanel/index.tsx`).
