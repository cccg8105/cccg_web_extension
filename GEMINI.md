# Instrucciones de Proyecto — AutoLoop RPA

## Sincronización Obligatoria tras Cambios en Features (`src/`)

Cada vez que implementes, modifiques o refactorices una funcionalidad en `src/`, DEBES verificar y actualizar antes de cerrar la tarea:

### 1. Documentación de Arquitectura y Guías (`docs/` y `README.md`)
- **`README.md`:** Si se crearon, movieron o eliminaron archivos/carpetas en `src/`, actualiza el árbol en la sección `Estructura del Proyecto`. Si cambió el flujo de uso para el usuario, actualiza los pasos de prueba.
- **`docs/01-arquitectura-y-flujo.md`:** Si cambiaron los módulos de `src/background/`, `src/sidepanel/` o `src/contents/`, o se agregaron mensajes/estados en `ExecutionState`, actualiza la tabla de responsabilidades y los diagramas Mermaid.
- **`docs/02-patrones-y-estandares.md`:** Si se introdujeron nuevos helpers centrales (mensajería, estado, manipulación DOM) o nuevas claves en `STORAGE_KEYS`, refleja las rutas y nombres vigentes.
- **`docs/03-guia-extensibilidad.md`:** Si cambió la ubicación donde se registran `ActionType`, `OrchestratorCommand` o componentes del Side Panel, actualiza los Playbooks para que apunten a los archivos reales.

### 2. Gestión de Backlog y Versionamiento (`backlog/`)
Sigue el flujo definido en `backlog/README.md`:
- Al iniciar una feature: márcala como `[-]` en `backlog/BACKLOG.md` y en `backlog/features/F-XX-*.md`.
- Al completar una feature:
  1. Marca todos los criterios `[x]` y el estado `[x] Completado` en su archivo de especificación.
  2. Mueve el archivo a `backlog/features/completed/F-XX-*.md`.
  3. Registra la entrega en `backlog/HISTORIAL.md` y retírala de `backlog/BACKLOG.md`.
  4. Si se completó una versión objetivo, actualiza `"version"` en `package.json`.

### 3. Grafo de Conocimiento (`graphify-out/`)
- Ejecuta `graphify update .` al finalizar modificaciones de código para mantener actualizado el grafo AST.

