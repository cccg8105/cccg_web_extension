# Graph Report - cccg_web_extension  (2026-11-08)

## Corpus Check
- Corpus is ~20,136 words - fits in a single context window. You may not need a graph.

## Summary
- 173 nodes · 506 edges · 8 communities
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Side Panel Shell & Options
- Background Execution Orchestration
- Step Configuration & Cards UI
- DOM Action Execution Engine
- MV3 Architecture & Runtime Flows
- Data Records & File Parsing
- Visual DOM Picker Overlay
- Design Standards & Self-Healing RL

## God Nodes (most connected - your core abstractions)
1. `WorkflowMode` - 18 edges
2. `WorkflowStep` - 15 edges
3. `updateExecutionState()` - 13 edges
4. `DataRecord` - 13 edges
5. `runDomListExtraction()` - 12 edges
6. `appendLogEntry()` - 12 edges
7. `StepsTab()` - 11 edges
8. `workflowStorage` - 11 edges
9. `STORAGE_KEYS` - 11 edges
10. `DomListConfig` - 11 edges

## Surprising Connections (you probably didn't know these)
- `AutoLoop RPA - Extensión de Chrome` --cites--> `Índice de Documentación Técnica de AutoLoop RPA`  [EXTRACTED]
  README.md → docs/README.md
- `Exploración Activa y Síntesis de Selectores Autocurativos` --semantically_similar_to--> `Espera Resiliente con waitForElement y MutationObserver`  [INFERRED] [semantically similar]
  docs/04-selectores-autocurativos-rl.md → docs/02-patrones-y-estandares.md
- `DomListConfigCardProps` --references--> `ExecutionState`  [EXTRACTED]
  src/sidepanel/components/DomListConfigCard.tsx → src/types/workflow.ts
- `ModeSelectorBarProps` --references--> `WorkflowMode`  [EXTRACTED]
  src/sidepanel/components/ModeSelectorBar.tsx → src/types/workflow.ts
- `StepCardProps` --references--> `WorkflowMode`  [EXTRACTED]
  src/sidepanel/components/StepCard.tsx → src/types/workflow.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Coordinación de Tres Contextos Aislados en Chrome MV3** — docs_01_arquitectura_y_flujo_side_panel_context, docs_01_arquitectura_y_flujo_background_service_worker_context, docs_01_arquitectura_y_flujo_content_scripts_context [EXTRACTED 1.00]
- **Pipeline del Motor de Selectores Autocurativos RL** — docs_04_selectores_autocurativos_rl_targetfingerprint, docs_04_selectores_autocurativos_rl_ucb1_selection_policy, docs_04_selectores_autocurativos_rl_q_learning_rescorla_wagner, docs_04_selectores_autocurativos_rl_self_healing_synthesis [EXTRACTED 1.00]
- **Suite de Playbooks de Extensibilidad** — docs_03_guia_extensibilidad_playbook_add_action_type, docs_03_guia_extensibilidad_playbook_add_orchestrator_command, docs_03_guia_extensibilidad_playbook_add_storage_key [EXTRACTED 1.00]

## Communities (8 total, 0 thin omitted)

### Community 0 - "Side Panel Shell & Options"
Cohesion: 0.17
Nodes (21): ExecutionOptionsCard(), ExecutionOptionsCardProps, ModeSelectorBar(), ModeSelectorBarProps, SidePanelHeader(), SidePanelHeaderProps, RunTab(), SidePanelApp() (+13 more)

### Community 1 - "Background Execution Orchestration"
Cohesion: 0.26
Nodes (22): resolveCurrentGlobalRowIndex(), runDomListExtraction(), loopContext, pauseWorkflowLoop(), resumeWorkflowLoop(), runWorkflowLoop(), startWorkflowLoop(), stopWorkflowLoop() (+14 more)

### Community 2 - "Step Configuration & Cards UI"
Cohesion: 0.20
Nodes (18): DomListConfigCard(), DomListConfigCardProps, BADGE_CONFIG, StepCard(), StepCardProps, StepsTab(), WorkflowLibraryCard(), WorkflowLibraryCardProps (+10 more)

### Community 3 - "DOM Action Execution Engine"
Cohesion: 0.15
Nodes (19): config, executeDomStep(), flashElementHighlight(), handleClickNextPage(), handleInspectListPage(), interpolateTemplate(), isPaginationElementDisabled(), resolveStepTargetElement() (+11 more)

### Community 4 - "MV3 Architecture & Runtime Flows"
Cohesion: 0.11
Nodes (12): Contexto Background Service Worker, Contexto Content Scripts (Página Web), Máquina de Estados de ExecutionState, Flujo A: Selección Visual con PickerOverlay, Flujo B: Ejecución Iterativa runWorkflowLoop, Contexto Side Panel UI, Sincronización Reactiva con workflowStorage, Playbook 3: Agregar nueva clave en STORAGE_KEYS (+4 more)

### Community 5 - "Data Records & File Parsing"
Cohesion: 0.14
Nodes (15): DataTab(), parseRecordsFromFile(), parseRecordsFromRawText(), RecordsParseResult, exportWorkflowToJsonFile(), parseAndValidateWorkflowJson(), sanitizeDomListConfig(), sanitizeExecutionOptions() (+7 more)

### Community 6 - "Visual DOM Picker Overlay"
Cohesion: 0.24
Nodes (11): buildElementTagAndClassSelector(), buildStructuralRelativePath(), computeRelativeListItemSelector(), computeRepeatingListSelector(), config, countMatchingListContainers(), extractStableIdPrefix(), getStableClasses() (+3 more)

### Community 7 - "Design Standards & Self-Healing RL"
Cohesion: 0.14
Nodes (10): Playbook 1: Agregar nuevo ActionType, Playbook 2: Agregar nuevo OrchestratorCommand, Checklist de Verificación Previa a Finalización, Agente RL Contextual Multi-Armed Bandit, Problema del DOM Polimórfico en Listas Web, Mapa de Documentación, Grafo y Backlog, Índice de Documentación Técnica de AutoLoop RPA, AutoLoop RPA - Extensión de Chrome (+2 more)

## Knowledge Gaps
- **10 isolated node(s):** `Plasmo Extension Framework`, `Bucle de Iteración de Flujo RPA`, `Mapa de Documentación, Grafo y Backlog`, `Flujo A: Selección Visual con PickerOverlay`, `Playbook 1: Agregar nuevo ActionType` (+5 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 34 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `WorkflowStep` connect `Step Configuration & Cards UI` to `Side Panel Shell & Options`, `Background Execution Orchestration`, `DOM Action Execution Engine`, `Data Records & File Parsing`, `Visual DOM Picker Overlay`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **What connects `Plasmo Extension Framework`, `Bucle de Iteración de Flujo RPA`, `Mapa de Documentación, Grafo y Backlog` to the rest of the system?**
  _10 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `MV3 Architecture & Runtime Flows` be split into smaller, more focused modules?**
  _Cohesion score 0.11052631578947368 - nodes in this community are weakly interconnected._
- **Why does `WorkflowMode` connect `Side Panel Shell & Options` to `Background Execution Orchestration`, `Step Configuration & Cards UI`, `DOM Action Execution Engine`, `Data Records & File Parsing`, `Visual DOM Picker Overlay`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **Should `Data Records & File Parsing` be split into smaller, more focused modules?**
  _Cohesion score 0.1437908496732026 - nodes in this community are weakly interconnected._
- **Why does `DataRecord` connect `Data Records & File Parsing` to `Side Panel Shell & Options`, `Background Execution Orchestration`, `Step Configuration & Cards UI`, `DOM Action Execution Engine`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Should `Design Standards & Self-Healing RL` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._