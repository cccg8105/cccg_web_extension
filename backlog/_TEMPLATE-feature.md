# [F-XX] Título Corto de la Funcionalidad

- **ID:** `F-XX`
- **Versión objetivo:** `v0.X.0`
- **Estado:** `[ ] Pendiente` <!-- [ ] Pendiente | [-] En progreso | [x] Completado -->
- **Prioridad:** Media <!-- Alta | Media | Baja -->
- **Esfuerzo estimado:** S <!-- S | M | L -->
- **Playbook técnico relacionado:** <!-- Ej. Playbook 1 / Playbook 2 / Playbook 3 en ../../docs/03-guia-extensibilidad.md -->

---

## 1. Descripción y Problema a Resolver

Explica brevemente qué limitación tiene la extensión actualmente y qué valor aporta esta funcionalidad al usuario final durante la automatización web.

---

## 2. Propuesta de Solución (UX / UI)

Describe cómo interactuará el usuario con esta funcionalidad desde el Side Panel (`src/sidepanel/index.tsx`) o sobre la página web (`src/contents/`):

- Controles o botones nuevos a incorporar.
- Comportamiento esperado al configurar o ejecutar la función.
- Mensajes de retroalimentación en la bitácora de ejecución (`ExecutionState.logs`).

---

## 3. Impacto Técnico por Capa (Arquitectura MV3)

Marca y detalla únicamente los archivos del proyecto que requerirán modificaciones:

- [ ] **Contratos y Tipos (`src/types/workflow.ts`):**
  - Nuevos tipos, propiedades en `WorkflowStep`, `ExecutionState` o `OrchestratorCommand`.
- [ ] **Almacenamiento Persistente (`src/storage/workflow-storage.ts`):**
  - Nuevas claves en `STORAGE_KEYS` o valores por defecto.
- [ ] **Content Scripts (`src/contents/action-executor.ts` / `src/contents/picker-overlay.tsx`):**
  - Lógica de manipulación o lectura del DOM, uso de `waitForElement` o `setNativeValue`.
- [ ] **Orquestador Background (`src/background/`):**
  - Cambios en `runners/`, `tab-messenger.ts`, `state-manager.ts` o `index.ts`.
- [ ] **Interfaz Side Panel (`src/sidepanel/`):**
  - Cambios en `components/`, `components/tabs/`, `utils/` o `index.tsx`.

---

## 4. Criterios de Aceptación (Checklist de Verificación)

- [ ] Criterio funcional 1 (ej. soporta variables dinámicas `{{columna}}`).
- [ ] Criterio funcional 2 (ej. registra el resultado correctamente en la bitácora).
- [ ] Cumple con los estándares de `docs/02-patrones-y-estandares.md`.
- [ ] Documentación técnica (`README.md` y `docs/`) actualizada si cambiaron módulos, flujos o playbooks.
- [ ] Compila sin errores de TypeScript (`npm run build`).
- [ ] Grafo de conocimiento actualizado con `graphify update .` tras finalizar la implementación.
