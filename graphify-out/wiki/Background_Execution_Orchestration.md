# Background Execution Orchestration

> 28 nodes · cohesion 0.26

## Key Concepts

- **dom-list-runner.ts** (32 connections) — `src/background/runners/dom-list-runner.ts`
- **records-runner.ts** (24 connections) — `src/background/runners/records-runner.ts`
- **orchestrator.ts** (23 connections) — `src/background/runners/orchestrator.ts`
- **state-manager.ts** (19 connections) — `src/background/state-manager.ts`
- **updateExecutionState()** (13 connections) — `src/background/state-manager.ts`
- **runDomListExtraction()** (12 connections) — `src/background/runners/dom-list-runner.ts`
- **appendLogEntry()** (12 connections) — `src/background/state-manager.ts`
- **runRecordsIteration()** (10 connections) — `src/background/runners/records-runner.ts`
- **index.ts** (9 connections) — `src/background/index.ts`
- **runWorkflowLoop()** (7 connections) — `src/background/runners/orchestrator.ts`
- **delay()** (7 connections) — `src/background/tab-messenger.ts`
- **getExecutionState()** (6 connections) — `src/background/state-manager.ts`
- **tab-messenger.ts** (6 connections) — `src/background/tab-messenger.ts`
- **resumeWorkflowLoop()** (5 connections) — `src/background/runners/orchestrator.ts`
- **startWorkflowLoop()** (5 connections) — `src/background/runners/orchestrator.ts`
- **applyStepErrorToResults()** (5 connections) — `src/background/state-manager.ts`
- **applyStepSuccessToResults()** (5 connections) — `src/background/state-manager.ts`
- **getActiveTabId()** (5 connections) — `src/background/tab-messenger.ts`
- **sendMessageToTabWithRetry()** (5 connections) — `src/background/tab-messenger.ts`
- **waitForTabComplete()** (5 connections) — `src/background/tab-messenger.ts`
- **ExecuteStepResponse** (5 connections) — `src/types/workflow.ts`
- **pauseWorkflowLoop()** (4 connections) — `src/background/runners/orchestrator.ts`
- **stopWorkflowLoop()** (4 connections) — `src/background/runners/orchestrator.ts`
- **ExecutionLoopContext** (3 connections) — `src/background/runners/records-runner.ts`
- **ExecuteStepPayload** (3 connections) — `src/types/workflow.ts`
- *... and 3 more nodes in this community*

## Relationships

- [Side Panel Shell & Options](Side_Panel_Shell_&_Options.md) (22 shared connections)
- [DOM Action Execution Engine](DOM_Action_Execution_Engine.md) (13 shared connections)
- [Step Configuration & Cards UI](Step_Configuration_&_Cards_UI.md) (5 shared connections)
- [Data Records & File Parsing](Data_Records_&_File_Parsing.md) (3 shared connections)

## Source Files

- `src/background/index.ts`
- `src/background/runners/dom-list-runner.ts`
- `src/background/runners/orchestrator.ts`
- `src/background/runners/records-runner.ts`
- `src/background/state-manager.ts`
- `src/background/tab-messenger.ts`
- `src/types/workflow.ts`

## Audit Trail

- EXTRACTED: 141 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*