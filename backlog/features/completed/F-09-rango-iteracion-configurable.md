# [F-09] Rango de iteración configurable (Ejecutar desde fila/ítem `N` hasta `M`)

- **ID:** `F-09`
- **Versión objetivo:** `v1.0.0`
- **Estado:** `[x] Completado`
- **Prioridad:** Media
- **Esfuerzo estimado:** S
- **Playbook técnico relacionado:** [Playbook 3 (`STORAGE_KEYS`)](../../../docs/03-guia-extensibilidad.md)

---

## 1. Descripción y Problema a Resolver

Permite configurar el rango **`Desde #` (`startRow`)** y **`Hasta #` (`endRow`, donde `0` significa hasta el final)** antes de iniciar la ejecución, facilitando pruebas sobre subconjuntos o la reanudación de lotes desde un índice específico.

---

## 2. Propuesta de Solución (UX / UI)

- **Controles de Rango en `src/sidepanel/components/ExecutionOptionsCard.tsx`:**
  - Campo numérico **Desde fila/ítem # (`startRow`)**: valor mínimo `1`.
  - Campo numérico **Hasta fila/ítem # (`endRow`)**: valor mínimo `0` (`0` = hasta el final).
- **Visualización en `src/sidepanel/components/tabs/RunTab.tsx`:**
  - El cálculo de porcentaje de avance y el botón de inicio reflejan el rango configurado.

---

## 3. Impacto Técnico por Capa (Arquitectura MV3)

- [x] **Contratos y Tipos (`src/types/workflow.ts`):**
  - Propiedades `startRow: number` y `endRow?: number` dentro de `ExecutionOptions`.
- [x] **Almacenamiento Persistente (`src/storage/workflow-storage.ts`):**
  - Valores por defecto `startRow: 1, endRow: 0` en `DEFAULT_EXECUTION_OPTIONS`.
- [x] **Orquestador Background (`src/background/runners/`):**
  - En `orchestrator.ts`: al iniciar (`START_WORKFLOW`), posicionar `currentRecordIndex` en `Math.max(0, startRow - 1)`.
  - En `records-runner.ts` y `dom-list-runner.ts`: validación y aplicación del límite superior `endRow`.
- [x] **Interfaz Side Panel (`src/sidepanel/`):**
  - Inputs de rango en `ExecutionOptionsCard.tsx` y ajuste de barra de progreso en `RunTab.tsx`.

---

## 4. Criterios de Aceptación (Checklist de Verificación)

- [x] Al configurar `startRow > 1`, la ejecución inicia directamente en el registro o elemento indicado (`startRow - 1` en base 0).
- [x] Al configurar `endRow > 0`, la ejecución se detiene con estado `"completed"` tras procesar el elemento `endRow`.
- [x] Si el usuario configura un rango inválido, el orquestador informa el error de forma clara en la bitácora.
- [x] Cumple con los estándares de `docs/02-patrones-y-estandares.md`.
- [x] Documentación técnica (`README.md` y `docs/`) actualizada.
- [x] Compila sin errores de TypeScript (`npm run build`).
- [x] Grafo de conocimiento actualizado con `graphify update .` tras finalizar la implementación.
