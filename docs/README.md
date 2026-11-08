# Documentación Técnica de Diseño y Desarrollo — AutoLoop RPA

Bienvenido a la documentación de ingeniería de **AutoLoop RPA**. Esta carpeta contiene la arquitectura, los patrones de diseño obligatorios y las guías paso a paso (*playbooks*) para que cualquier desarrollador pueda extender o mantener la extensión de Chrome respetando los estándares establecidos.

---

## Mapa de Documentación

1. [**01. Arquitectura y Flujos de Datos**](./01-arquitectura-y-flujo.md)
   - Modelo de **3 contextos aislados** en Chrome Manifest V3 con Plasmo (`Side Panel UI`, `Background Service Worker` y `Content Scripts`).
   - Diagramas de secuencia detallados para los dos flujos principales:
     - **Flujo A:** Selección visual de selectores CSS (`PickerOverlay`).
     - **Flujo B:** Ejecución iterativa de registros (`runWorkflowLoop` + `executeDomStep`).
   - Máquina de estados de `ExecutionState.status` y ciclo de vida de la ejecución.

2. [**02. Patrones de Diseño y Estándares de Código**](./02-patrones-y-estandares.md)
   - Contrato centralizado de tipos en `src/types/workflow.ts` y uso del alias de importación `~*`.
   - Sincronización de estado reactivo y persistente con `@plasmohq/storage` (`workflowStorage` y `STORAGE_KEYS`).
   - Compatibilidad DOM con frameworks modernos (React, Vue, Angular) mediante el patrón `setNativeValue` y espera resiliente con `waitForElement` (`MutationObserver`).
   - Aislamiento visual y de eventos en Content Scripts mediante Shadow DOM (`plasmo-csui`).

3. [**03. Guía Práctica de Extensibilidad (Playbooks)**](./03-guia-extensibilidad.md)
   - **Playbook 1:** Cómo agregar un nuevo tipo de acción (`ActionType`, ej. `select`, `scroll`, `extract`, `keypress`).
   - **Playbook 2:** Cómo agregar un nuevo comando de orquestación (`OrchestratorCommand`).
   - **Playbook 3:** Cómo agregar una nueva clave persistente en `STORAGE_KEYS`.
   - Checklist de verificación antes de dar por terminado un cambio.

4. [**04. Motor de Selectores Autocurativos con Aprendizaje por Refuerzo (Self-Healing Locators)**](./04-selectores-autocurativos-rl.md)
   - Planteamiento del problema del **DOM Polimórfico** en listas web repetitivas.
   - Modelo matemático basado en **Contextual Multi-Armed Bandits (UCB1)**, actualización tabular **$Q$-Learning (Rescorla-Wagner)** y **Huella Estructural/Semántica del Objetivo ($\mathcal{F}$)**.
   - Flujo de **Explotación, Exploración Activa (*Self-Healing*) y Memorización Persistente** entre corridas.
   - Diseño de integración capa por capa en la arquitectura Chrome MV3 de AutoLoop RPA.

---

## Relación con el Grafo de Conocimiento (`graphify-out/`) y el Backlog (`backlog/`)

Este repositorio cuenta con tres fuentes de documentación complementarias:

| Fuente | Ubicación | Propósito principal |
| :--- | :--- | :--- |
| **Documentación de Diseño (`docs/`)** | [`docs/`](./) | Explica **el porqué** (decisiones de arquitectura, aislamiento MV3, razones técnicas) y **el cómo** (recetas paso a paso y convenciones para nuevos cambios). |
| **Grafo de Conocimiento (`graphify`)** | [`../graphify-out/wiki/index.md`](../graphify-out/wiki/index.md) y [`../graphify-out/GRAPH_REPORT.md`](../graphify-out/GRAPH_REPORT.md) | Mantiene de forma automatizada **el qué existe** (inventario vivo de módulos, funciones, relaciones de llamadas y comunidades detectadas por AST + análisis semántico). |
| **Backlog y Versionamiento (`backlog/`)** | [`../backlog/BACKLOG.md`](../backlog/BACKLOG.md), [`../backlog/HISTORIAL.md`](../backlog/HISTORIAL.md) y [`../backlog/README.md`](../backlog/README.md) | Define **el hacia dónde va** (tablero de pendientes en `BACKLOG.md`, especificaciones activas en `features/`, historial en `HISTORIAL.md` y guía de gestión en `backlog/README.md`). |

> **Regla para desarrolladores y agentes:**
> - Antes de diseñar o implementar una funcionalidad nueva, revisa esta carpeta (`docs/`) para seguir los patrones del proyecto y consulta [`../backlog/BACKLOG.md`](../backlog/BACKLOG.md) (y las reglas en [`../backlog/README.md`](../backlog/README.md)) si el cambio corresponde a una feature planificada.
> - Al finalizar una feature del backlog, marca sus criterios y estado como `[x]`, mueve su archivo de `backlog/features/` a `backlog/features/completed/`, regístrala en [`../backlog/HISTORIAL.md`](../backlog/HISTORIAL.md) y retírala de los pendientes en [`../backlog/BACKLOG.md`](../backlog/BACKLOG.md).
> - Después de modificar archivos de código o documentación en `docs/`, actualiza el grafo ejecutando `graphify update .` (o `/graphify . --update`) para mantener sincronizado `graphify-out/`.
