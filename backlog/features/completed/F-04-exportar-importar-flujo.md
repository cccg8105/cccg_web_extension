# [F-04] Exportar e importar flujo de pasos en archivo JSON

- **ID:** `F-04`
- **Versión objetivo:** `v0.3.0`
- **Estado:** `[x] Completado`
- **Prioridad:** Alta
- **Esfuerzo estimado:** S
- **Playbook técnico relacionado:** Contratos de tipos en [`docs/02-patrones-y-estandares.md`](../../../docs/02-patrones-y-estandares.md)

---

## 1. Descripción y Problema a Resolver

La configuración de pasos (`WorkflowStep[]`) vive únicamente en el almacenamiento local del navegador (`chrome.storage.local`). Si el usuario quiere respaldar una receta de automatización, compartirla con un compañero de equipo o restaurarla en otro equipo, no cuenta con una opción para exportar o importar el flujo.

---

## 2. Propuesta de Solución (UX / UI)

- En la pestaña **Pasos** de `src/sidepanel/index.tsx`, añadir una barra de herramientas secundaria con dos acciones:
  - **Exportar Flujo (`.json`):** Descarga un archivo `autoloop-<nombre>-YYYY-MM-DD.json` con metadatos de versión y el arreglo `steps`.
  - **Importar Flujo (`.json`):** Abre un selector de archivos `.json`, valida la estructura de cada paso y reemplaza la secuencia actual en `STORAGE_KEYS.STEPS`.

---

## 3. Impacto Técnico por Capa (Arquitectura MV3)

- [x] **Contratos y Tipos (`src/types/workflow.ts`):**
  - Definir la interfaz `ExportedWorkflowFile`:
    ```typescript
    export interface ExportedWorkflowFile {
      version: string
      exportedAt: string
      name?: string
      steps: WorkflowStep[]
    }
    ```
- [x] **Interfaz Side Panel (`src/sidepanel/index.tsx`):**
  - Implementar función `handleExportSteps()` usando `Blob` y `URL.createObjectURL` para disparar la descarga.
  - Implementar función `handleImportSteps()` con validación defensiva (verificar que `steps` sea un arreglo válido y que cada ítem tenga `id`, `type` y `label`).

---

## 4. Criterios de Aceptación (Checklist de Verificación)

- [x] Al pulsar **Exportar**, se descarga un archivo `.json` legible y bien formateado con los pasos actuales.
- [x] Al importar un archivo `.json` válido, los pasos se cargan inmediatamente en la interfaz y persisten en `workflowStorage`.
- [x] Si el usuario sube un JSON corrupto o con formato incompatible, se muestra una alerta clara sin romper el estado actual.
- [x] Compila sin errores (`npm run build`) y se actualiza el grafo con `graphify update .`.
