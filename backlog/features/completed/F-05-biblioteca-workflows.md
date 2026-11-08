# [F-05] Biblioteca local de múltiples Workflows en Storage

- **ID:** `F-05`
- **Versión objetivo:** `v0.3.0`
- **Estado:** `[x] Completado`
- **Prioridad:** Media
- **Esfuerzo estimado:** M
- **Playbook técnico relacionado:** [Playbook 3: Cómo agregar una nueva clave persistente en `STORAGE_KEYS`](../../../docs/03-guia-extensibilidad.md)

---

## 1. Descripción y Problema a Resolver

Actualmente la extensión solo mantiene un único conjunto de pasos activo en `STORAGE_KEYS.STEPS`. Si un usuario automatiza 3 portales web distintos en su trabajo diario, tiene que sobrescribir los pasos cada vez que cambia de sitio web.

---

## 2. Propuesta de Solución (UX / UI)

- Incorporar un selector y gestor de **Plantillas / Workflows Guardados** en la parte superior de la pestaña **Pasos**:
  - Campo para asignar nombre al flujo actual y botón **Guardar**.
  - Lista desplegable para cargar cualquier flujo previamente guardado o eliminar los que ya no se utilicen.

---

## 3. Impacto Técnico por Capa (Arquitectura MV3)

- [x] **Contratos y Tipos (`src/types/workflow.ts`):**
  - Definir la interfaz `SavedWorkflow`:
    ```typescript
    export interface SavedWorkflow {
      id: string
      name: string
      updatedAt: string
      steps: WorkflowStep[]
    }
    ```
- [x] **Almacenamiento Persistente (`src/storage/workflow-storage.ts`):**
  - Agregar `SAVED_WORKFLOWS: "rpa_saved_workflows"` en `STORAGE_KEYS`.
  - Definir `DEFAULT_SAVED_WORKFLOWS: SavedWorkflow[] = []`.
- [x] **Interfaz Side Panel (`src/sidepanel/index.tsx`):**
  - Consumir `STORAGE_KEYS.SAVED_WORKFLOWS` mediante `useStorage`.
  - Permitir guardar la lista activa de `steps` bajo un nombre, cargar los pasos de un flujo guardado hacia `STORAGE_KEYS.STEPS` y eliminar flujos guardados.

---

## 4. Criterios de Aceptación (Checklist de Verificación)

- [x] Permite guardar la secuencia actual de pasos con un nombre personalizado en `STORAGE_KEYS.SAVED_WORKFLOWS`.
- [x] Permite alternar entre diferentes workflows guardados cargando sus pasos en un clic.
- [x] Permite actualizar un workflow existente o eliminarlo de la biblioteca local.
- [x] Compila sin errores (`npm run build`) y se actualiza el grafo con `graphify update .`.
