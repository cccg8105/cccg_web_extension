# [F-15] Modularización de la Interfaz Side Panel (`src/sidepanel/`)

- **ID:** `F-15`
- **Versión objetivo:** `v0.4.1`
- **Estado:** `[x] Completado`
- **Prioridad:** Alta
- **Esfuerzo estimado:** M
- **Playbook técnico relacionado:** [Estándares de Estado y Componentes (`docs/02-patrones-y-estandares.md`)](../../../docs/02-patrones-y-estandares.md)

---

## 1. Descripción y Problema a Resolver

Anteriormente [`src/sidepanel/index.tsx`](../../../src/sidepanel/index.tsx) tenía **1,435 líneas** en un solo archivo y componente (`SidePanelApp`), combinando parseo de archivos CSV y JSON, validación e importación/exportación de plantillas JSON, operaciones CRUD de pasos y el renderizado completo de las tres pestañas.

Se desacopló la interfaz en utilidades puras (`utils/`), componentes de dominio (`components/`) y vistas por pestaña (`components/tabs/`).

---

## 2. Propuesta de Solución (UX / UI y Estructura de Componentes)

Separar `src/sidepanel/` en utilidades puras (`utils/`), componentes de dominio (`components/`) y vistas por pestaña (`components/tabs/`), manteniendo `src/sidepanel/index.tsx` como el contenedor principal requerido por Plasmo:

```text
src/sidepanel/
├── index.tsx                          # Shell principal (< 110 líneas): Header, navegación de pestañas y contenedor
├── components/
│   ├── SidePanelHeader.tsx            # Encabezado con título e insignia de estado (status badge)
│   ├── WorkflowLibraryCard.tsx        # Guardar/Cargar plantillas y botones Importar/Exportar JSON
│   ├── StepCard.tsx                   # Tarjeta individual de un paso (selector, variables, extract, wait, etc.)
│   └── tabs/
│       ├── StepsTab.tsx               # Pestaña 1: Biblioteca + Variables disponibles + Botones de acción + Lista de StepCard
│       ├── DataTab.tsx                # Pestaña 2: Importar CSV/JSON, pegar texto y tabla de vista previa
│       └── RunTab.tsx                 # Pestaña 3: Progreso, controles Play/Pause/Stop, descarga CSV y bitácora
└── utils/
    ├── workflow-io.ts                 # Validación de JSON importado, exportación de flujo JSON y descarga de reporte CSV
    ├── records-parser.ts              # Parseo de archivos/texto CSV (Papa.parse) y JSON para registros
    └── step-helpers.ts                # Creación de nuevos pasos (createStep) y helpers inmutables (move, duplicate)
```

---

## 3. Impacto Técnico por Capa (Arquitectura MV3)

- [x] **Interfaz Side Panel (`src/sidepanel/`):**
  - Crear utilidades puras en `src/sidepanel/utils/`:
    - `workflow-io.ts`: `parseAndValidateWorkflowJson`, `exportWorkflowToJsonFile`, `downloadExecutionReportCsv`.
    - `records-parser.ts`: `parseRecordsFromFile`, `parseRecordsFromRawText`, `extractColumnsFromRecords`.
    - `step-helpers.ts`: `createDefaultStep`, `moveStepInList`, `duplicateStepInList`, `sendOrchestratorCommand`.
  - Crear componentes reutilizables en `src/sidepanel/components/`:
    - `SidePanelHeader.tsx`: Renderiza el encabezado y el badge reactivo según `ExecutionState.status`.
    - `WorkflowLibraryCard.tsx`: Encapsula el estado local de nombre de flujo, selector de plantilla guardada, importación y exportación JSON.
    - `StepCard.tsx`: Renderiza la tarjeta de un `WorkflowStep` con sus controles de ordenamiento, selector CSS, botón `Elegir` y sub-formularios condicionales (`input`/`select`, `keypress`, `extract`, `wait`).
  - Crear vistas por pestaña en `src/sidepanel/components/tabs/`:
    - `StepsTab.tsx`, `DataTab.tsx` y `RunTab.tsx` consumiendo `useStorage` con `workflowStorage` y `STORAGE_KEYS`.
  - Refactorizar `src/sidepanel/index.tsx`:
    - Reducirlo a la composición de `SidePanelHeader`, barra de pestañas y renderizado condicional de `StepsTab`, `DataTab` y `RunTab`.

---

## 4. Criterios de Aceptación (Checklist de Verificación)

- [x] `src/sidepanel/index.tsx` tiene menos de 120 líneas y delega cada pestaña en su componente dedicado dentro de `src/sidepanel/components/tabs/`.
- [x] Ningún archivo dentro de `src/sidepanel/` supera las 350 líneas.
- [x] Todas las funcionalidades actuales (gestión de pasos, plantillas, importación/exportación JSON, carga de CSV/JSON, ejecución y descarga de reporte CSV) operan de forma idéntica.
- [x] Cumple con los estándares de `docs/02-patrones-y-estandares.md` (uso de alias `~*` y `useStorage` con `workflowStorage`).
- [x] Compila sin errores de TypeScript (`npm run build`).
- [x] Grafo de conocimiento actualizado con `graphify update .` tras finalizar la implementación.
