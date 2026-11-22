# Graph Report - cccg_web_extension  (2026-11-14)

## Corpus Check
- 34 files · ~25,954 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 6, .css 1)

## Summary
- 214 nodes · 638 edges · 9 communities
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7a92c6a9`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- StepsTab.tsx
- Background Execution Orchestration
- DataTab.tsx
- DOM Action Execution Engine
- MV3 Architecture & Runtime Flows
- workflow-io.ts
- Visual DOM Picker Overlay
- ExecutionState
- clean-manifest.js

## God Nodes (most connected - your core abstractions)
1. `WorkflowMode` - 18 edges
2. `updateExecutionState()` - 15 edges
3. `WorkflowStep` - 15 edges
4. `appendLogEntry()` - 14 edges
5. `DataRecord` - 14 edges
6. `runDomListExtraction()` - 12 edges
7. `StepsTab()` - 12 edges
8. `workflowStorage` - 12 edges
9. `STORAGE_KEYS` - 12 edges
10. `TableExtractConfig` - 12 edges

## Surprising Connections (you probably didn't know these)
- `1. Documentación de Arquitectura y Guías (`docs/` y `README.md`)` --references--> `ActionType`  [INFERRED]
  GEMINI.md → src/types/workflow.ts
- `1. Documentación de Arquitectura y Guías (`docs/` y `README.md`)` --references--> `ExecutionState`  [INFERRED]
  GEMINI.md → src/types/workflow.ts
- `1. Documentación de Arquitectura y Guías (`docs/` y `README.md`)` --references--> `OrchestratorCommand`  [INFERRED]
  GEMINI.md → src/types/workflow.ts
- `TableExtractConfigCardProps` --references--> `TableExtractConfig`  [EXTRACTED]
  src/sidepanel/components/TableExtractConfigCard.tsx → src/types/workflow.ts
- `Exploración Activa y Síntesis de Selectores Autocurativos` --semantically_similar_to--> `Espera Resiliente con waitForElement y MutationObserver`  [INFERRED] [semantically similar]
  docs/04-selectores-autocurativos-rl.md → docs/02-patrones-y-estandares.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Suite de Playbooks de Extensibilidad** — docs_03_guia_extensibilidad_playbook_add_action_type, docs_03_guia_extensibilidad_playbook_add_orchestrator_command, docs_03_guia_extensibilidad_playbook_add_storage_key [EXTRACTED 1.00]
- **Coordinación de Tres Contextos Aislados en Chrome MV3** — docs_01_arquitectura_y_flujo_side_panel_context, docs_01_arquitectura_y_flujo_background_service_worker_context, docs_01_arquitectura_y_flujo_content_scripts_context [EXTRACTED 1.00]
- **Pipeline del Motor de Selectores Autocurativos RL** — docs_04_selectores_autocurativos_rl_targetfingerprint, docs_04_selectores_autocurativos_rl_ucb1_selection_policy, docs_04_selectores_autocurativos_rl_q_learning_rescorla_wagner, docs_04_selectores_autocurativos_rl_self_healing_synthesis [EXTRACTED 1.00]

## Communities (9 total, 0 thin omitted)

### Community 0 - "StepsTab.tsx"
Cohesion: 0.12
Nodes (35): DomListConfigCard(), DomListConfigCardProps, ExecutionOptionsCard(), ExecutionOptionsCardProps, ModeSelectorBar(), ModeSelectorBarProps, SidePanelHeader(), SidePanelHeaderProps (+27 more)

### Community 1 - "Background Execution Orchestration"
Cohesion: 0.23
Nodes (28): resolveCurrentGlobalRowIndex(), runDomListExtraction(), loopContext, pauseWorkflowLoop(), resumeWorkflowLoop(), runWorkflowLoop(), startWorkflowLoop(), stopWorkflowLoop() (+20 more)

### Community 2 - "DataTab.tsx"
Cohesion: 0.44
Nodes (7): DataTab(), extractColumnsFromRecords(), parseRecordsFromFile(), parseRecordsFromRawText(), RecordsParseResult, SAMPLE_RECORDS, DataRecord

### Community 3 - "DOM Action Execution Engine"
Cohesion: 0.12
Nodes (30): buildUniqueHeaderNames(), config, executeDomStep(), extractCellValue(), flashElementHighlight(), getRowCells(), getTableRows(), handleClickNextPage() (+22 more)

### Community 4 - "MV3 Architecture & Runtime Flows"
Cohesion: 0.06
Nodes (22): Contexto Background Service Worker, Contexto Content Scripts (Página Web), Máquina de Estados de ExecutionState, Flujo A: Selección Visual con PickerOverlay, Flujo B: Ejecución Iterativa runWorkflowLoop, Contexto Side Panel UI, Sincronización Reactiva con workflowStorage, Playbook 1: Agregar nuevo ActionType (+14 more)

### Community 5 - "workflow-io.ts"
Cohesion: 0.16
Nodes (15): cloneTableExtractConfig(), WorkflowLibraryCard(), exportWorkflowToJsonFile(), parseAndValidateWorkflowJson(), sanitizeDomListConfig(), sanitizeExecutionOptions(), sanitizePaginationConfig(), sanitizeTableExtractConfig() (+7 more)

### Community 6 - "Visual DOM Picker Overlay"
Cohesion: 0.19
Nodes (16): buildElementTagAndClassSelector(), buildStructuralRelativePath(), computeRelativeListItemSelector(), computeRepeatingListSelector(), computeSafeSelector(), config, countMatchingListContainers(), extractHeadersFromRow() (+8 more)

### Community 9 - "ExecutionState"
Cohesion: 0.29
Nodes (6): 1. Documentación de Arquitectura y Guías (`docs/` y `README.md`), 2. Gestión de Backlog y Versionamiento (`backlog/`), 3. Grafo de Conocimiento (`graphify-out/`), Instrucciones de Proyecto — AutoLoop RPA, Sincronización Obligatoria tras Cambios en Features (`src/`), OrchestratorCommand

### Community 11 - "clean-manifest.js"
Cohesion: 0.33
Nodes (3): buildDirs, fs, path

## Knowledge Gaps
- **10 isolated node(s):** `Flujo A: Selección Visual con PickerOverlay`, `Playbook 1: Agregar nuevo ActionType`, `Playbook 2: Agregar nuevo OrchestratorCommand`, `Playbook 3: Agregar nueva clave en STORAGE_KEYS`, `Checklist de Verificación Previa a Finalización` (+5 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 41 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `WorkflowStep` connect `StepsTab.tsx` to `Background Execution Orchestration`, `DOM Action Execution Engine`, `workflow-io.ts`, `Visual DOM Picker Overlay`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **What connects `Flujo A: Selección Visual con PickerOverlay`, `Playbook 1: Agregar nuevo ActionType`, `Playbook 2: Agregar nuevo OrchestratorCommand` to the rest of the system?**
  _10 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `StepsTab.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12156862745098039 - nodes in this community are weakly interconnected._
- **Why does `1. Documentación de Arquitectura y Guías (`docs/` y `README.md`)` connect `ExecutionState` to `StepsTab.tsx`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Should `DOM Action Execution Engine` be split into smaller, more focused modules?**
  _Cohesion score 0.11586452762923351 - nodes in this community are weakly interconnected._
- **Why does `ExecutionState` connect `StepsTab.tsx` to `ExecutionState`, `DOM Action Execution Engine`, `Background Execution Orchestration`, `Visual DOM Picker Overlay`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Should `MV3 Architecture & Runtime Flows` be split into smaller, more focused modules?**
  _Cohesion score 0.062388591800356503 - nodes in this community are weakly interconnected._