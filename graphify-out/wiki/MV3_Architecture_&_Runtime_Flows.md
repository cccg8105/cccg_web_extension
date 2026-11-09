# MV3 Architecture & Runtime Flows

> 20 nodes · cohesion 0.11

## Key Concepts

- **Contexto Content Scripts (Página Web)** (6 connections) — `docs/01-arquitectura-y-flujo.md`
- **Modelo de Tres Contextos Aislados MV3** (6 connections) — `docs/01-arquitectura-y-flujo.md`
- **Contexto Background Service Worker** (4 connections) — `docs/01-arquitectura-y-flujo.md`
- **Máquina de Estados de ExecutionState** (3 connections) — `docs/01-arquitectura-y-flujo.md`
- **Flujo B: Ejecución Iterativa runWorkflowLoop** (3 connections) — `docs/01-arquitectura-y-flujo.md`
- **Sincronización Reactiva con workflowStorage** (3 connections) — `docs/02-patrones-y-estandares.md`
- **Contexto Side Panel UI** (2 connections) — `docs/01-arquitectura-y-flujo.md`
- **Espera Resiliente con waitForElement y MutationObserver** (2 connections) — `docs/02-patrones-y-estandares.md`
- **Exploración Activa y Síntesis de Selectores Autocurativos** (2 connections) — `docs/04-selectores-autocurativos-rl.md`
- **Huella Estructural y Semántica del Objetivo (F)** (2 connections) — `docs/04-selectores-autocurativos-rl.md`
- **Retención Acotada de Bitácora slice(-99)** (1 connections) — `docs/01-arquitectura-y-flujo.md`
- **Flujo A: Selección Visual con PickerOverlay** (1 connections) — `docs/01-arquitectura-y-flujo.md`
- **Idempotencia del Bucle isLoopRunning** (1 connections) — `docs/01-arquitectura-y-flujo.md`
- **Política de Manejo de Errores Stop o Skip** (1 connections) — `docs/02-patrones-y-estandares.md`
- **Patrón setNativeValue para Frameworks Reactivos** (1 connections) — `docs/02-patrones-y-estandares.md`
- **Aislamiento en Content Scripts con Shadow DOM plasmo-csui** (1 connections) — `docs/02-patrones-y-estandares.md`
- **Playbook 3: Agregar nueva clave en STORAGE_KEYS** (1 connections) — `docs/03-guia-extensibilidad.md`
- **Persistencia y Memoria a Largo Plazo Entre Corridas** (1 connections) — `docs/04-selectores-autocurativos-rl.md`
- **Integración Arquitectónica en 5 Capas MV3** (1 connections) — `docs/04-selectores-autocurativos-rl.md`
- **Función de Similitud Convexa Sim(e, F)** (1 connections) — `docs/04-selectores-autocurativos-rl.md`

## Relationships

- [Design Standards & Self-Healing RL](Design_Standards_&_Self-Healing_RL.md) (1 shared connections)

## Source Files

- `docs/01-arquitectura-y-flujo.md`
- `docs/02-patrones-y-estandares.md`
- `docs/03-guia-extensibilidad.md`
- `docs/04-selectores-autocurativos-rl.md`

## Audit Trail

- EXTRACTED: 21 (95%)
- INFERRED: 1 (5%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*