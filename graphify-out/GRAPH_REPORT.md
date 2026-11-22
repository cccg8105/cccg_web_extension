# Graph Report - cccg_web_extension  (2026-11-17)

## Corpus Check
- 36 files · ~32,439 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 6, .css 1)

## Summary
- 289 nodes · 856 edges · 8 communities
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 11 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `44ebb518`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- StepsTab.tsx
- Background Execution Orchestration
- Sincronización Obligatoria tras Cambios en Features (`src/`)
- action-executor.ts
- MV3 Architecture & Runtime Flows
- picker-overlay.tsx
- workflow.ts
- clean-manifest.js

## God Nodes (most connected - your core abstractions)
1. `WorkflowMode` - 18 edges
2. `generateCandidateSelectors()` - 16 edges
3. `WorkflowStep` - 16 edges
4. `updateExecutionState()` - 15 edges
5. `computeSimilarityScore()` - 15 edges
6. `ExecutionState` - 15 edges
7. `runDomListExtraction()` - 14 edges
8. `appendLogEntry()` - 14 edges
9. `DataRecord` - 14 edges
10. `runRecordsIteration()` - 12 edges

## Surprising Connections (you probably didn't know these)
- `1. Documentación de Arquitectura y Guías (`docs/` y `README.md`)` --references--> `ActionType`  [INFERRED]
  GEMINI.md → src/types/workflow.ts
- `1. Documentación de Arquitectura y Guías (`docs/` y `README.md`)` --references--> `ExecutionState`  [INFERRED]
  GEMINI.md → src/types/workflow.ts
- `1. Documentación de Arquitectura y Guías (`docs/` y `README.md`)` --references--> `OrchestratorCommand`  [INFERRED]
  GEMINI.md → src/types/workflow.ts
- `Exploración Activa y Síntesis de Selectores Autocurativos` --semantically_similar_to--> `Espera Resiliente con waitForElement y MutationObserver`  [INFERRED] [semantically similar]
  docs/04-selectores-autocurativos-rl.md → docs/02-patrones-y-estandares.md
- `AutoLoop RPA - Extensión de Chrome` --cites--> `Índice de Documentación Técnica de AutoLoop RPA`  [EXTRACTED]
  README.md → docs/README.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Suite de Playbooks de Extensibilidad** — docs_03_guia_extensibilidad_playbook_add_action_type, docs_03_guia_extensibilidad_playbook_add_orchestrator_command, docs_03_guia_extensibilidad_playbook_add_storage_key [EXTRACTED 1.00]
- **Coordinación de Tres Contextos Aislados en Chrome MV3** — docs_01_arquitectura_y_flujo_side_panel_context, docs_01_arquitectura_y_flujo_background_service_worker_context, docs_01_arquitectura_y_flujo_content_scripts_context [EXTRACTED 1.00]
- **Pipeline del Motor de Selectores Autocurativos RL** — docs_04_selectores_autocurativos_rl_targetfingerprint, docs_04_selectores_autocurativos_rl_ucb1_selection_policy, docs_04_selectores_autocurativos_rl_q_learning_rescorla_wagner, docs_04_selectores_autocurativos_rl_self_healing_synthesis [EXTRACTED 1.00]

## Communities (8 total, 0 thin omitted)

### Community 0 - "StepsTab.tsx"
Cohesion: 0.10
Nodes (44): DomListConfigCard(), DomListConfigCardProps, ExecutionOptionsCard(), ExecutionOptionsCardProps, ModeSelectorBar(), ModeSelectorBarProps, SidePanelHeader(), BADGE_CONFIG (+36 more)

### Community 1 - "Background Execution Orchestration"
Cohesion: 0.18
Nodes (36): resolveCurrentGlobalRowIndex(), runDomListExtraction(), loopContext, pauseWorkflowLoop(), resumeWorkflowLoop(), runWorkflowLoop(), startWorkflowLoop(), stopWorkflowLoop() (+28 more)

### Community 2 - "Sincronización Obligatoria tras Cambios en Features (`src/`)"
Cohesion: 0.40
Nodes (4): 2. Gestión de Backlog y Versionamiento (`backlog/`), 3. Grafo de Conocimiento (`graphify-out/`), Instrucciones de Proyecto — AutoLoop RPA, Sincronización Obligatoria tras Cambios en Features (`src/`)

### Community 3 - "action-executor.ts"
Cohesion: 0.07
Nodes (65): applyPenaltiesToPool(), buildSuccessOutcome(), buildUniqueHeaderNames(), buildWorkingCandidatePool(), config, executeDomStep(), extractCellValue(), FailedTargetOutcome (+57 more)

### Community 4 - "MV3 Architecture & Runtime Flows"
Cohesion: 0.06
Nodes (22): Contexto Background Service Worker, Contexto Content Scripts (Página Web), Máquina de Estados de ExecutionState, Flujo A: Selección Visual con PickerOverlay, Flujo B: Ejecución Iterativa runWorkflowLoop, Contexto Side Panel UI, Sincronización Reactiva con workflowStorage, Playbook 1: Agregar nuevo ActionType (+14 more)

### Community 6 - "picker-overlay.tsx"
Cohesion: 0.14
Nodes (24): buildElementTagAndClassSelector(), buildPositionalRelativePath(), buildStructuralRelativePath(), collectAttributeCandidates(), computeSafeSelector(), escapeAttrValue(), escapeCssIdentifier(), extractStableIdPrefix() (+16 more)

### Community 9 - "workflow.ts"
Cohesion: 0.09
Nodes (32): 1. Documentación de Arquitectura y Guías (`docs/` y `README.md`), SidePanelHeaderProps, TableExtractConfigCardProps, parseAndValidateWorkflowJson(), sanitizeDomListConfig(), sanitizeElementFingerprint(), sanitizeExecutionOptions(), sanitizePaginationConfig() (+24 more)

### Community 11 - "clean-manifest.js"
Cohesion: 0.22
Nodes (4): devDir, fs, path, prodDir

## Knowledge Gaps
- **10 isolated node(s):** `Flujo A: Selección Visual con PickerOverlay`, `Playbook 1: Agregar nuevo ActionType`, `Playbook 2: Agregar nuevo OrchestratorCommand`, `Playbook 3: Agregar nueva clave en STORAGE_KEYS`, `Checklist de Verificación Previa a Finalización` (+5 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 60 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `WorkflowStep` connect `StepsTab.tsx` to `Background Execution Orchestration`, `action-executor.ts`, `picker-overlay.tsx`, `workflow.ts`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **What connects `Flujo A: Selección Visual con PickerOverlay`, `Playbook 1: Agregar nuevo ActionType`, `Playbook 2: Agregar nuevo OrchestratorCommand` to the rest of the system?**
  _10 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `StepsTab.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10206240084611316 - nodes in this community are weakly interconnected._
- **Why does `ExecutionState` connect `workflow.ts` to `StepsTab.tsx`, `Background Execution Orchestration`, `picker-overlay.tsx`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Should `action-executor.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06603346901854365 - nodes in this community are weakly interconnected._
- **Why does `1. Documentación de Arquitectura y Guías (`docs/` y `README.md`)` connect `workflow.ts` to `StepsTab.tsx`, `Sincronización Obligatoria tras Cambios en Features (`src/`)`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Should `MV3 Architecture & Runtime Flows` be split into smaller, more focused modules?**
  _Cohesion score 0.062388591800356503 - nodes in this community are weakly interconnected._