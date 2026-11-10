# Graph Report - cccg_web_extension  (2026-11-08)

## Corpus Check
- 32 files · ~20,904 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 6, .css 1)

## Summary
- 186 nodes · 520 edges · 12 communities
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2714cc10`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- index.tsx
- Background Execution Orchestration
- Step Configuration & Cards UI
- DOM Action Execution Engine
- MV3 Architecture & Runtime Flows
- workflow.ts
- Visual DOM Picker Overlay
- Design Standards & Self-Healing RL
- workflow-storage.ts
- ExecutionState
- DataTab.tsx
- clean-manifest.js

## God Nodes (most connected - your core abstractions)
1. `WorkflowMode` - 18 edges
2. `WorkflowStep` - 15 edges
3. `updateExecutionState()` - 13 edges
4. `DataRecord` - 13 edges
5. `runDomListExtraction()` - 12 edges
6. `appendLogEntry()` - 12 edges
7. `ExecutionState` - 12 edges
8. `StepsTab()` - 11 edges
9. `workflowStorage` - 11 edges
10. `STORAGE_KEYS` - 11 edges

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

## Communities (12 total, 0 thin omitted)

### Community 0 - "index.tsx"
Cohesion: 0.27
Nodes (9): ExecutionOptionsCard(), ModeSelectorBar(), SidePanelHeader(), RunTab(), SidePanelApp(), downloadExecutionReportCsv(), DEFAULT_EXECUTION_STATE, SAMPLE_RECORDS (+1 more)

### Community 1 - "Background Execution Orchestration"
Cohesion: 0.26
Nodes (22): resolveCurrentGlobalRowIndex(), runDomListExtraction(), loopContext, pauseWorkflowLoop(), resumeWorkflowLoop(), runWorkflowLoop(), startWorkflowLoop(), stopWorkflowLoop() (+14 more)

### Community 2 - "Step Configuration & Cards UI"
Cohesion: 0.34
Nodes (11): DomListConfigCard(), DomListConfigCardProps, StepCard(), StepsTab(), createDefaultStep(), duplicateStepInList(), moveStepInList(), sendOrchestratorCommand() (+3 more)

### Community 3 - "DOM Action Execution Engine"
Cohesion: 0.20
Nodes (14): config, executeDomStep(), flashElementHighlight(), handleClickNextPage(), handleInspectListPage(), interpolateTemplate(), isPaginationElementDisabled(), resolveStepTargetElement() (+6 more)

### Community 4 - "MV3 Architecture & Runtime Flows"
Cohesion: 0.11
Nodes (12): Contexto Background Service Worker, Contexto Content Scripts (Página Web), Máquina de Estados de ExecutionState, Flujo A: Selección Visual con PickerOverlay, Flujo B: Ejecución Iterativa runWorkflowLoop, Contexto Side Panel UI, Sincronización Reactiva con workflowStorage, Playbook 3: Agregar nueva clave en STORAGE_KEYS (+4 more)

### Community 5 - "workflow.ts"
Cohesion: 0.12
Nodes (23): ExecutionOptionsCardProps, ModeSelectorBarProps, BADGE_CONFIG, StepCardProps, WorkflowLibraryCardProps, parseAndValidateWorkflowJson(), sanitizeDomListConfig(), sanitizeExecutionOptions() (+15 more)

### Community 6 - "Visual DOM Picker Overlay"
Cohesion: 0.27
Nodes (11): buildElementTagAndClassSelector(), buildStructuralRelativePath(), computeRelativeListItemSelector(), computeRepeatingListSelector(), config, countMatchingListContainers(), extractStableIdPrefix(), getStableClasses() (+3 more)

### Community 7 - "Design Standards & Self-Healing RL"
Cohesion: 0.14
Nodes (10): Playbook 1: Agregar nuevo ActionType, Playbook 2: Agregar nuevo OrchestratorCommand, Checklist de Verificación Previa a Finalización, Agente RL Contextual Multi-Armed Bandit, Problema del DOM Polimórfico en Listas Web, Mapa de Documentación, Grafo y Backlog, Índice de Documentación Técnica de AutoLoop RPA, AutoLoop RPA - Extensión de Chrome (+2 more)

### Community 8 - "workflow-storage.ts"
Cohesion: 0.22
Nodes (7): WorkflowLibraryCard(), exportWorkflowToJsonFile(), DEFAULT_EXECUTION_OPTIONS, DEFAULT_SAVED_WORKFLOWS, DEFAULT_WORKFLOW_MODE, SAMPLE_STEPS, SavedWorkflow

### Community 9 - "ExecutionState"
Cohesion: 0.22
Nodes (8): 1. Documentación de Arquitectura y Guías (`docs/` y `README.md`), 2. Gestión de Backlog y Versionamiento (`backlog/`), 3. Grafo de Conocimiento (`graphify-out/`), Instrucciones de Proyecto — AutoLoop RPA, Sincronización Obligatoria tras Cambios en Features (`src/`), SidePanelHeaderProps, ExecutionState, OrchestratorCommand

### Community 10 - "DataTab.tsx"
Cohesion: 0.54
Nodes (6): DataTab(), extractColumnsFromRecords(), parseRecordsFromFile(), parseRecordsFromRawText(), RecordsParseResult, DataRecord

### Community 11 - "clean-manifest.js"
Cohesion: 0.33
Nodes (3): buildDirs, fs, path

## Knowledge Gaps
- **10 isolated node(s):** `Flujo A: Selección Visual con PickerOverlay`, `Playbook 3: Agregar nueva clave en STORAGE_KEYS`, `Persistencia y Memoria a Largo Plazo Entre Corridas`, `Integración Arquitectónica en 5 Capas MV3`, `Playbook 1: Agregar nuevo ActionType` (+5 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 43 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `1. Documentación de Arquitectura y Guías (`docs/` y `README.md`)` connect `ExecutionState` to `Step Configuration & Cards UI`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **What connects `Flujo A: Selección Visual con PickerOverlay`, `Playbook 3: Agregar nueva clave en STORAGE_KEYS`, `Persistencia y Memoria a Largo Plazo Entre Corridas` to the rest of the system?**
  _10 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `MV3 Architecture & Runtime Flows` be split into smaller, more focused modules?**
  _Cohesion score 0.11052631578947368 - nodes in this community are weakly interconnected._
- **Why does `WorkflowStep` connect `workflow.ts` to `index.tsx`, `Background Execution Orchestration`, `Step Configuration & Cards UI`, `DOM Action Execution Engine`, `Visual DOM Picker Overlay`, `workflow-storage.ts`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **Should `workflow.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11822660098522167 - nodes in this community are weakly interconnected._
- **Why does `ExecutionState` connect `ExecutionState` to `index.tsx`, `Background Execution Orchestration`, `Step Configuration & Cards UI`, `workflow.ts`, `Visual DOM Picker Overlay`, `workflow-storage.ts`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Should `Design Standards & Self-Healing RL` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._