# [F-07] Descarga de reporte CSV de ejecución (estado y datos extraídos)

- **ID:** `F-07`
- **Versión objetivo:** `v0.4.0`
- **Estado:** `[x] Completado`
- **Prioridad:** Media
- **Esfuerzo estimado:** M
- **Playbook técnico relacionado:** [Playbook 3: Cómo agregar una nueva clave persistente en `STORAGE_KEYS`](../../../docs/03-guia-extensibilidad.md)

---

## 1. Descripción y Problema a Resolver

Cuando se ejecuta un lote de registros, la bitácora (`ExecutionState.logs`) muestra eventos en texto libre, pero el usuario no puede descargar una tabla consolidada que combine sus registros originales de entrada con el resultado de cada fila (`_status`, `_error`) y las columnas capturadas por pasos de tipo `extract` (`F-06`).

---

## 2. Propuesta de Solución (UX / UI)

- En la pestaña **Ejecutar** (`src/sidepanel/index.tsx`), agregar el botón **Descargar Reporte CSV** (habilitado cuando existan resultados de ejecución o al finalizar el bucle).
- El archivo CSV generado contendrá todas las columnas originales de `records` más:
  - `_status`: `"ok"`, `"running"` o `"error"`.
  - `_error`: Mensaje de error en caso de fallo, o vacío si fue exitoso.
  - Todas las columnas dinámicas generadas por pasos `extract` (`F-06`).

---

## 3. Impacto Técnico por Capa (Arquitectura MV3)

- [x] **Contratos y Tipos (`src/types/workflow.ts`):**
  - Agregar `results?: DataRecord[]` dentro de `ExecutionState`.
- [x] **Orquestador Background (`src/background/index.ts`):**
  - Durante `runWorkflowLoop`, ir construyendo por cada fila el objeto resultado enriquecido con los datos originales, valores extraídos y estado final de la fila.
- [x] **Interfaz Side Panel (`src/sidepanel/index.tsx`):**
  - Utilizar `Papa.unparse(validResults)` de `papaparse` para serializar los resultados a CSV (con BOM UTF-8 `\uFEFF`) y descargar el archivo `autoloop-reporte-YYYY-MM-DD.csv`.

---

## 4. Criterios de Aceptación (Checklist de Verificación)

- [x] Al finalizar (o detener) una ejecución, el usuario puede descargar un archivo `.csv` con los resultados procesados.
- [x] El CSV conserva las columnas originales de entrada e incluye el estado de ejecución por fila y cualquier dato extraído con `F-06`.
- [x] Utiliza `Papa.unparse` garantizando el escape correcto de comas, comillas y saltos de línea.
- [x] Compila sin errores (`npm run build`) y se actualiza el grafo con `graphify update .`.
