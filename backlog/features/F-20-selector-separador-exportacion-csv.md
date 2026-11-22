# [F-20] Selector de Separador para Exportación de Datos Extraídos (CSV)

- **ID:** `F-20`
- **Versión objetivo:** `v1.1.0`
- **Estado:** `[ ] Pendiente` <!-- [ ] Pendiente | [-] En progreso | [x] Completado -->
- **Prioridad:** Media <!-- Alta | Media | Baja -->
- **Esfuerzo estimado:** S <!-- S | M | L -->
- **Playbook técnico relacionado:** Playbook 3 (`docs/03-guia-extensibilidad.md`)

---

## 1. Descripción y Problema a Resolver

Actualmente, la exportación de resultados en `downloadExecutionReportCsv` (`src/sidepanel/utils/workflow-io.ts`) utiliza `Papa.unparse(results)` con el separador por defecto (coma `,`). En configuraciones regionales donde Excel o herramientas locales esperan punto y coma (`;`), o cuando los datos extraídos requieren delimitadores como tabulador (`\t`) o *pipe* (`|`), el usuario debe abrir o convertir manualmente el archivo descargado para que las columnas se separen correctamente.

Permitir que el usuario elija el separador antes de descargar el archivo elimina esa fricción y hace compatible la exportación directa en los tres modos de ejecución (iteración con `extract`, lista web `dom_list_extract` y tabla HTML `html_table_extract`).

---

## 2. Propuesta de Solución (UX / UI)

En la pestaña **Ejecutar** (`src/sidepanel/components/tabs/RunTab.tsx`), junto al botón de descarga de reporte CSV:

- Incorporar un selector compacto de delimitador con opciones predefinidas claras:
  - **Coma (`,`)** — por defecto.
  - **Punto y coma (`;`)** — recomendado para Excel en español/Europa.
  - **Tabulador (`\t`)** — formato TSV/tabulado (opcionalmente con extensión `.tsv` o `.csv` manteniendo compatibilidad).
  - **Pipe (`|`)** — útil cuando los textos extraídos contienen comas y puntos y comas.
  - *(Opcional)* **Personalizado** (1 carácter ingresado por el usuario).
- Persistir la preferencia seleccionada en `workflowStorage` para no tener que reconfigurarla en cada ejecución.
- Al pulsar **Descargar CSV**, `downloadExecutionReportCsv` aplicará el delimitador seleccionado en `Papa.unparse(results, { delimiter })`.

---

## 3. Impacto Técnico por Capa (Arquitectura MV3)

- [ ] **Almacenamiento Persistente (`src/storage/workflow-storage.ts`):**
  - Agregar clave opcional en `STORAGE_KEYS` (ej. `CSV_EXPORT_DELIMITER`) con valor por defecto `","`.
- [ ] **Interfaz Side Panel (`src/sidepanel/`):**
  - `src/sidepanel/utils/workflow-io.ts`: actualizar `downloadExecutionReportCsv(results: DataRecord[], delimiter = ",")` para pasar `{ delimiter }` a `Papa.unparse`.
  - `src/sidepanel/components/tabs/RunTab.tsx`: añadir el control `<select>` (y campo opcional para separador personalizado) junto al botón de descarga de resultados, leyendo/guardando la preferencia.

---

## 4. Criterios de Aceptación (Checklist de Verificación)

- [ ] El usuario puede seleccionar al menos entre `,` (coma), `;` (punto y coma), `\t` (tabulador) y `|` (pipe) antes de exportar los datos extraídos desde `RunTab.tsx`.
- [ ] El archivo descargado utiliza exactamente el delimitador elegido (verificado con `Papa.unparse(results, { delimiter })` y manteniendo BOM UTF-8 `\uFEFF`).
- [ ] La preferencia del separador persiste entre sesiones del Side Panel.
- [ ] Funciona de manera uniforme para datos extraídos en modo estándar (`extract`), lista web (`dom_list_extract`) y tabla HTML (`html_table_extract`).
- [ ] Cumple con los estándares de `docs/02-patrones-y-estandares.md`.
- [ ] Documentación técnica (`README.md` y `docs/`) actualizada si cambiaron módulos, claves en `STORAGE_KEYS` o flujos de uso.
- [ ] Compila sin errores de TypeScript (`npm run build`).
- [ ] Grafo de conocimiento actualizado con `graphify update .` tras finalizar la implementación.
