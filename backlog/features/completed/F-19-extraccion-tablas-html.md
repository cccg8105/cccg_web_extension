# [F-19] Modo dedicado para extracción automática de tablas HTML con selección de fila de cabecera y configuración por columna

- **ID:** `F-19`
- **Versión objetivo:** `v1.2.0`
- **Estado:** `[x] Completado`
- **Prioridad:** Alta
- **Esfuerzo estimado:** L
- **Playbook técnico relacionado:** [Playbook 2 (`OrchestratorCommand`) y Playbook 3 (`STORAGE_KEYS`)](../../docs/03-guia-extensibilidad.md)

---

## 1. Descripción y Problema a Resolver

Actualmente, para extraer información tabular estructurada de una página web (`<table>`), el usuario debe utilizar el modo `dom_list_extract`, seleccionar manualmente `tbody tr` como contenedor repetitivo y crear paso a paso múltiples acciones `+ Extraer` con selectores CSS relativos (`td:nth-child(1)`, `td:nth-child(2)`, etc.). 

Este proceso resulta innecesariamente laborioso, propenso a errores en tablas dinámicas o complejas y poco intuitivo cuando el sitio ya presenta una estructura tabular canónica (`table`, `thead`, `tbody`, `tr`, `th`, `td`).

Esta funcionalidad introduce un tercer modo de automatización nativo: **Extraer Tabla HTML** (`html_table_extract`), capaz de inspeccionar cualquier elemento `<table>`, detectar automáticamente sus columnas a partir de una fila de cabecera elegida (mediante índice numérico o haciendo clic en ella con el Picker) y extraer de forma masiva todas las filas de datos con soporte opcional de paginación multipágina.

---

## 2. Propuesta de Solución (UX / UI)

### 2.1 Selector de Modo en Side Panel (`ModeSelectorBar.tsx`)
Se amplía el control de selección superior con una tercera opción:
1. **Iterar Registros (CSV)** (`"records_loop"`)
2. **Extraer Lista Web** (`"dom_list_extract"`)
3. **Extraer Tabla HTML** (`"html_table_extract"`)

Al activar este modo:
- Se oculta la pestaña **Registros** (la fuente de datos es la página web), manteniendo visibles las pestañas **Configuración** y **Ejecutar**.
- La pestaña principal muestra la tarjeta dedicada de configuración de tabla (`TableExtractConfigCard.tsx`).

### 2.2 Tarjeta de Configuración de Tabla (`TableExtractConfigCard.tsx`)
- **Selector de la Tabla:**
  - Campo de texto para el selector CSS (`tableSelector`, ej: `table.data-grid`, `#reporte-ventas`).
  - Botón **Elegir tabla**: activa el `PickerOverlay` para seleccionar el elemento `<table>` directamente en la página web con inspección de ancestros si el usuario hace clic dentro de una celda.
- **Fila de Cabecera (Header Row):**
  - Selector numérico: número de fila que se usará como cabecera (por defecto `1`).
  - Botón **Marcar fila en página**: activa el Picker en modo fila (`table_header_row`), permitiendo hacer clic sobre cualquier `<tr>` para tomarlo como encabezado.
  - Indicador de estado que muestra el total de columnas identificadas y el número total de filas detectadas.
- **Criterio de Extracción de Datos:**
  - Se procesan todas las filas posteriores a la fila de cabecera seleccionada (`headerRowIndex + 1` en adelante). Las filas anteriores a la cabecera son omitidas automáticamente.
  - Opción de límite máximo de filas (`maxRows`, 0 = todas).
- **Lista y Configuración de Columnas Detectadas:**
  - Lista desplegable/editable con cada columna encontrada en la fila de cabecera:
    - Nombre del campo para el CSV (por defecto el texto limpio del `<th>` o `<td>`).
    - Propiedad a extraer por celda: Texto visible (`textContent`), Valor (`value`) o Atributo HTML (`attribute`, ej. `href` o `src`).
- **Paginación Automática:**
  - Checkbox para activar recorrido multipágina.
  - Selector CSS del botón "Siguiente página" (`nextButtonSelector`), selector visual con Picker, número máximo de páginas y tiempo de espera entre páginas.

### 2.3 Ejecución y Reporte (`RunTab.tsx`)
- En la pestaña **Ejecutar**, el botón principal se rotula: `Iniciar Extracción de Tabla`.
- La barra de progreso y métricas reflejan el avance de filas y páginas extraídas.
- Al culminar, permite descargar el reporte consolidado en CSV (`downloadExecutionReportCsv`) con las cabeceras y propiedades configuradas.

---

## 3. Impacto Técnico por Capa (Arquitectura MV3)

- [x] **Contratos y Tipos (`src/types/workflow.ts`):**
  - Añadir `"html_table_extract"` a la unión `WorkflowMode`.
  - Añadir `"table_container"` y `"table_header_row"` a `PickingTargetType`.
  - Definir la interfaz `TableExtractColumnConfig`:
    ```typescript
    export interface TableExtractColumnConfig {
      index: number
      name: string
      source: ExtractSourceType
      attribute?: string
    }
    ```
  - Definir la interfaz `TableExtractConfig`:
    ```typescript
    export interface TableExtractConfig {
      tableSelector?: string
      headerRowIndex?: number
      columns?: TableExtractColumnConfig[]
      maxRows?: number
      pagination?: DomListPaginationConfig
    }
    ```
  - Extender `SavedWorkflow`, `ExportedWorkflowFile`, `ExecutionState`, `ExecuteStepPayload` y `InspectTablePageResponse`.
- [x] **Almacenamiento Persistente (`src/storage/workflow-storage.ts`):**
  - Registrar `TABLE_EXTRACT_CONFIG: "rpa_table_extract_config"` en `STORAGE_KEYS`.
  - Declarar `DEFAULT_TABLE_EXTRACT_CONFIG`.
- [x] **Content Scripts (`src/contents/action-executor.ts` / `src/contents/picker-overlay.tsx`):**
  - En `picker-overlay.tsx`: reconocer elementos `<table>` o ancestros más cercanos al hacer hover; reconocer filas `<tr>` cuando el target es `table_header_row`.
  - En `action-executor.ts`: implementar manejador `INSPECT_TABLE_PAGE` que lea la cabecera, devuelva la lista de columnas y procese la matriz de celdas según `TableExtractColumnConfig`.
- [x] **Orquestador Background (`src/background/runners/`):**
  - Crear `src/background/runners/table-runner.ts` con la función `runHtmlTableExtraction(context)`.
  - Enrutar en `orchestrator.ts` según `workflowMode === "html_table_extract"`.
- [x] **Interfaz Side Panel (`src/sidepanel/`):**
  - Crear `src/sidepanel/components/TableExtractConfigCard.tsx`.
  - Actualizar `ModeSelectorBar.tsx` para incluir el tercer modo.
  - Actualizar `src/sidepanel/index.tsx` para ocultar la pestaña Datos en modo tabla.
  - Soportar el nuevo modo en `WorkflowLibraryCard.tsx` y `workflow-io.ts` para importación/exportación JSON.

---

## 4. Criterios de Aceptación (Checklist de Verificación)

- [x] Se puede seleccionar el modo "Extraer Tabla HTML" desde la barra superior de la extensión.
- [x] El selector visual (Picker) permite elegir un elemento `<table>` resaltando su contorno y generando su selector CSS óptimo.
- [x] El usuario puede definir la fila de cabecera tanto ingresando su número (ej. fila 1, 2) como haciendo clic sobre el `<tr>` en la página con el Picker.
- [x] El sistema identifica correctamente todas las columnas de la fila elegida y permite editar sus nombres para el CSV.
- [x] Se puede configurar para cada columna individual si se extrae `textContent`, `value` o un atributo HTML (`href`, `src`, etc.).
- [x] El motor extrae fielmente todas las filas posteriores a la cabecera, descartando las filas previas.
- [x] La paginación automática navega entre páginas haciendo clic en el botón siguiente y acumula los registros en un solo reporte CSV.
- [x] Los flujos configurados con modo tabla se pueden guardar en la biblioteca local y exportar/importar en archivos `.json`.
- [x] Cumple con la paleta de colores y patrones de `docs/02-patrones-y-estandares.md`.
- [x] Compila sin errores en TypeScript (`npx tsc --noEmit`) y empaqueta limpiamente con `npm run build`.
- [x] Documentación técnica (`README.md`, `docs/`) actualizada tras completar la implementación.
- [x] Grafo de conocimiento sincronizado con `graphify update .`.

