# Graph Report - cccg_web_extension  (2026-11-22)

## Corpus Check
- 34 files · ~27,120 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 6, .css 1)

## Summary
- 227 nodes · 672 edges · 12 communities
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 9 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `44ebb518`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- workflow-storage.ts
- Background Execution Orchestration
- DataTab.tsx
- DOM Action Execution Engine
- MV3 Architecture & Runtime Flows
- workflow-io.ts
- Visual DOM Picker Overlay
- StepsTab.tsx
- WorkflowMode
- index.tsx
- RunTab.tsx
- clean-manifest.js

## God Nodes (most connected - your core abstractions)
1. `WorkflowMode` - 18 edges
2. `updateExecutionState()` - 15 edges
3. `WorkflowStep` - 15 edges
4. `ExecutionState` - 15 edges
5. `appendLogEntry()` - 14 edges
6. `DataRecord` - 14 edges
7. `runDomListExtraction()` - 12 edges
8. `StepsTab()` - 12 edges
9. `workflowStorage` - 12 edges
10. `STORAGE_KEYS` - 12 edges

## Surprising Connections (you probably didn't know these)
- `1. Documentación de Arquitectura y Guías (`docs/` y `README.md`)` --references--> `ExecutionState`  [INFERRED]
  GEMINI.md → src/types/workflow.ts
- `1. Documentación de Arquitectura y Guías (`docs/` y `README.md`)` --references--> `ActionType`  [INFERRED]
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

### Community 0 - "workflow-storage.ts"
Cohesion: 0.20
Nodes (10): cloneTableExtractConfig(), WorkflowLibraryCard(), exportWorkflowToJsonFile(), DEFAULT_EXECUTION_OPTIONS, DEFAULT_SAVED_WORKFLOWS, DEFAULT_WORKFLOW_MODE, SAMPLE_RECORDS, SAMPLE_STEPS (+2 more)

### Community 1 - "Background Execution Orchestration"
Cohesion: 0.18
Nodes (35): resolveCurrentGlobalRowIndex(), runDomListExtraction(), loopContext, pauseWorkflowLoop(), resumeWorkflowLoop(), runWorkflowLoop(), startWorkflowLoop(), stopWorkflowLoop() (+27 more)

### Community 2 - "DataTab.tsx"
Cohesion: 0.54
Nodes (6): DataTab(), extractColumnsFromRecords(), parseRecordsFromFile(), parseRecordsFromRawText(), RecordsParseResult, DataRecord

### Community 3 - "DOM Action Execution Engine"
Cohesion: 0.15
Nodes (23): buildUniqueHeaderNames(), config, executeDomStep(), extractCellValue(), flashElementHighlight(), getRowCells(), getTableRows(), globalRecord (+15 more)

### Community 4 - "MV3 Architecture & Runtime Flows"
Cohesion: 0.06
Nodes (22): Contexto Background Service Worker, Contexto Content Scripts (Página Web), Máquina de Estados de ExecutionState, Flujo A: Selección Visual con PickerOverlay, Flujo B: Ejecución Iterativa runWorkflowLoop, Contexto Side Panel UI, Sincronización Reactiva con workflowStorage, Playbook 1: Agregar nuevo ActionType (+14 more)

### Community 5 - "workflow-io.ts"
Cohesion: 0.09
Nodes (24): 1. Documentación de Arquitectura y Guías (`docs/` y `README.md`), 2. Gestión de Backlog y Versionamiento (`backlog/`), 3. Grafo de Conocimiento (`graphify-out/`), Instrucciones de Proyecto — AutoLoop RPA, Sincronización Obligatoria tras Cambios en Features (`src/`), TableExtractConfigCard(), TableExtractConfigCardProps, parseAndValidateWorkflowJson() (+16 more)

### Community 6 - "Visual DOM Picker Overlay"
Cohesion: 0.17
Nodes (17): buildElementTagAndClassSelector(), buildStructuralRelativePath(), computeRelativeListItemSelector(), computeRepeatingListSelector(), computeSafeSelector(), config, countMatchingListContainers(), extractHeadersFromRow() (+9 more)

### Community 7 - "StepsTab.tsx"
Cohesion: 0.37
Nodes (10): DomListConfigCard(), DomListConfigCardProps, StepCard(), StepsTab(), createDefaultStep(), duplicateStepInList(), moveStepInList(), sendOrchestratorCommand() (+2 more)

### Community 8 - "WorkflowMode"
Cohesion: 0.31
Nodes (7): ModeSelectorBarProps, BADGE_CONFIG, StepCardProps, WorkflowLibraryCardProps, TableExtractConfig, WorkflowMode, WorkflowStep

### Community 9 - "index.tsx"
Cohesion: 0.27
Nodes (7): ModeSelectorBar(), SidePanelHeader(), SidePanelHeaderProps, SidePanelApp(), DEFAULT_TABLE_EXTRACT_CONFIG, workflowStorage, ExecutionState

### Community 10 - "RunTab.tsx"
Cohesion: 0.43
Nodes (6): ExecutionOptionsCard(), ExecutionOptionsCardProps, RunTab(), downloadExecutionReportCsv(), DEFAULT_EXECUTION_STATE, ExecutionOptions

### Community 11 - "clean-manifest.js"
Cohesion: 0.22
Nodes (4): devDir, fs, path, prodDir

## Knowledge Gaps
- **10 isolated node(s):** `Flujo A: Selección Visual con PickerOverlay`, `Playbook 1: Agregar nuevo ActionType`, `Playbook 2: Agregar nuevo OrchestratorCommand`, `Playbook 3: Agregar nueva clave en STORAGE_KEYS`, `Checklist de Verificación Previa a Finalización` (+5 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 47 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ExecutionState` connect `index.tsx` to `workflow-storage.ts`, `Background Execution Orchestration`, `workflow-io.ts`, `Visual DOM Picker Overlay`, `StepsTab.tsx`, `RunTab.tsx`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **What connects `Flujo A: Selección Visual con PickerOverlay`, `Playbook 1: Agregar nuevo ActionType`, `Playbook 2: Agregar nuevo OrchestratorCommand` to the rest of the system?**
  _10 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `MV3 Architecture & Runtime Flows` be split into smaller, more focused modules?**
  _Cohesion score 0.062388591800356503 - nodes in this community are weakly interconnected._
- **Why does `WorkflowStep` connect `WorkflowMode` to `workflow-storage.ts`, `Background Execution Orchestration`, `DOM Action Execution Engine`, `workflow-io.ts`, `Visual DOM Picker Overlay`, `StepsTab.tsx`, `index.tsx`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Should `workflow-io.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08994708994708994 - nodes in this community are weakly interconnected._
- **Why does `1. Documentación de Arquitectura y Guías (`docs/` y `README.md`)` connect `workflow-io.ts` to `index.tsx`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._