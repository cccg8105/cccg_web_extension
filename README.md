# AutoLoop RPA - Extensión de Chrome

Extensión de Chrome construida con **Plasmo**, **React**, **TypeScript** y **Tailwind CSS** que permite seleccionar componentes directamente sobre cualquier página web, definir una secuencia de acciones (**Clic**, **Escribir texto con variables** y **Espera**) y ejecutarla de forma iterativa a partir de un listado de registros (**CSV** o **JSON**).

---

## Requisitos Previos

- **Node.js** v24 (recomendado v24.4.1 o superior; retrocompatible desde v18)
- **npm** (incluido con Node.js) o **pnpm**
- Navegador **Google Chrome** (o cualquier navegador basado en Chromium como Brave o Edge)

---

## 1. Instalación y Ejecución Local

1. Abre una terminal en la raíz del proyecto:
   ```bash
   cd chrome_extension
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Inicia el servidor de desarrollo de Plasmo (con *Hot Module Replacement*):
   ```bash
   npm run dev
   ```
   Esto generará automáticamente la carpeta **`build/chrome-mv3-dev`** y la actualizará cada vez que guardes cambios en el código.

> **Opcional (Build de producción):** Si prefieres generar la versión optimizada lista para empaquetar, ejecuta:
> ```bash
> npm run build
> ```
> El resultado se guardará en **`build/chrome-mv3-prod`**.

---

## 2. Cargar la Extensión en Chrome (Modo Desarrollador)

1. Abre Google Chrome y navega a:
   ```text
   chrome://extensions/
   ```
2. En la esquina superior derecha, activa el interruptor **Modo de desarrollador** (*Developer mode*).
3. En la barra superior izquierda, haz clic en el botón **Cargar descomprimida** (*Load unpacked*).
4. Selecciona la carpeta generada por Plasmo dentro del proyecto:
   - Si estás usando `npm run dev`: selecciona **`build/chrome-mv3-dev`**
   - Si ejecutaste `npm run build`: selecciona **`build/chrome-mv3-prod`**
5. (Recomendado) Haz clic en el icono del **rompecabezas** (Extensiones) en la barra superior de Chrome y **fija (Pin)** la extensión **AutoLoop RPA - Iterador Web**.

---

## 3. Cómo Probar la Extensión Paso a Paso

### Paso 1: Abrir el Side Panel
1. Abre cualquier página web de prueba con un formulario (por ejemplo, una página con campos de texto y un botón).
   > **Nota:** Si ya tenías la pestaña abierta antes de instalar la extensión, **recarga la página (`F5`)** una vez para que los Content Scripts se inyecten en ella.
2. Haz clic sobre el icono de **AutoLoop RPA** en la barra de Chrome. Se abrirá el **Panel Lateral (Side Panel)** a la derecha de tu navegador.

### Paso 2: Cargar tu lista de registros (Pestaña "Registros")
1. Ve a la pestaña **Registros**.
2. Puedes usar los 3 registros de ejemplo que vienen precargados (`nombre`, `email`, `rol`), subir un archivo `.csv` / `.json`, o pegar directamente un CSV con encabezados:
   ```csv
   nombre,email,rol
   Ana García,ana.garcia@ejemplo.com,Admin
   Carlos Pérez,carlos.perez@ejemplo.com,Editor
   ```
3. Haz clic en **Cargar desde texto** y verifica las filas en la tabla de **Vista previa**.

### Paso 3: Configurar las acciones y seleccionar elementos (Pestaña "Pasos")
1. Ve a la pestaña **Pasos**. Verás en la parte superior las variables detectadas automáticamente de tus registros (ej. `{{nombre}}`, `{{email}}`).
2. Agrega o edita los pasos de tu flujo usando los botones **+ Clic**, **+ Texto** o **+ Espera**:
   - **Seleccionar un componente de la página:**
     1. En cualquier paso de tipo *Clic* o *Texto*, pulsa el botón **Elegir** (icono de mira).
     2. Mueve el cursor sobre la página web: verás un recuadro resaltando cada elemento junto con su etiqueta y selector CSS.
     3. Haz **clic** sobre el campo o botón deseado (o presiona `ESC` para cancelar). El selector CSS único se guardará automáticamente en ese paso.
   - **Usar datos del registro en un campo de texto:**
     1. En los pasos de tipo *Texto*, escribe o inserta las variables haciendo clic en los botones rápidos `+ nombre`, `+ email`, etc.

### Paso 4: Ejecutar la iteración (Pestaña "Ejecutar")
1. Ve a la pestaña **Ejecutar**.
2. Haz clic en **Iniciar Iteración**.
3. La extensión recorrerá cada fila de tu listado y ejecutará todos los pasos en orden sobre la página activa:
   - Puedes **Pausar**, **Reanudar** o **Detener** el proceso en cualquier momento.
   - En la **Bitácora de ejecución** verás el detalle en tiempo real de cada registro y acción ejecutada.

---

## 4. Documentación de Arquitectura y Desarrollo (`docs/`)

Si vas a realizar cambios o agregar nuevas capacidades a la extensión, consulta primero la documentación técnica de ingeniería en [`docs/`](./docs/README.md):

- [**Índice de Documentación Técnica**](./docs/README.md) — Resumen general y relación con el grafo de conocimiento (`graphify-out/`).
- [**01. Arquitectura y Flujos de Datos**](./docs/01-arquitectura-y-flujo.md) — Modelo de 3 contextos aislados en Chrome MV3, diagramas de secuencia y máquina de estados (`ExecutionState`).
- [**02. Patrones de Diseño y Estándares de Código**](./docs/02-patrones-y-estandares.md) — Reglas obligatorias (`setNativeValue`, aislamiento Shadow DOM con `plasmo-csui`, `@plasmohq/storage`, `waitForElement` y contratos de tipos).
- [**03. Guía Práctica de Extensibilidad (Playbooks)**](./docs/03-guia-extensibilidad.md) — Recetas paso a paso para agregar un nuevo `ActionType`, un nuevo `OrchestratorCommand` o nuevas claves en `STORAGE_KEYS`.
- [**04. Motor de Selectores Autocurativos con Aprendizaje por Refuerzo**](./docs/04-selectores-autocurativos-rl.md) — Fundamento teórico (Multi-Armed Bandits, $Q$-Learning y Huella Semántica $\mathcal{F}$) e integración arquitectónica de selectores autocurativos (*Self-Healing Locators*).
- [**Backlog de Pendientes (`backlog/BACKLOG.md`)**](./backlog/BACKLOG.md) — Tablero de próximas versiones (`v0.5.0` a `v1.0.0`), [**Historial de Completados**](./backlog/HISTORIAL.md) y [**Guía de Gestión del Backlog**](./backlog/README.md).

---

## Estructura del Proyecto

```text
├── .cursor/
│   └── rules/
│       └── docs-and-backlog-sync.mdc # Regla de sincronización de docs, backlog y grafo
├── assets/
│   └── icon.png                    # Icono base de la extensión (512x512)
├── backlog/
│   ├── README.md                   # Guía metodológica y reglas de gestión del backlog
│   ├── BACKLOG.md                  # Tablero activo de features y versiones pendientes
│   ├── HISTORIAL.md                # Registro histórico de versiones y features completadas
│   ├── _TEMPLATE-feature.md        # Plantilla estándar para especificar nuevas features
│   └── features/                   # Especificaciones técnicas pendientes (Post-v1.0.0)
│       └── completed/              # Archivo de especificaciones ya implementadas (F-01..F-09, F-12..F-15)
├── docs/
│   ├── README.md                   # Índice de la documentación técnica
│   ├── 01-arquitectura-y-flujo.md  # Contextos MV3, diagramas de secuencia y estados
│   ├── 02-patrones-y-estandares.md # Reglas de diseño y convenciones del código
│   └── 03-guia-extensibilidad.md   # Playbooks paso a paso para extender la app
├── scripts/
│   └── clean-manifest.js           # Postbuild hook para purgar recursos inexistentes del manifest
├── src/
│   ├── sidepanel.tsx               # Entrypoint de montaje para el Side Panel de Plasmo
│   ├── background/
│   │   ├── index.ts                # Entrypoint Service Worker y router de OrchestratorCommand
│   │   ├── tab-messenger.ts        # Resolución de pestaña activa y mensajería con reintentos
│   │   ├── state-manager.ts        # Gestión inmutable de ExecutionState, logs y results
│   │   └── runners/
│   │       ├── orchestrator.ts     # Control de ciclo de vida del bucle y selección de modo
│   │       ├── records-runner.ts   # Estrategia Modo 1: Iteración por lista de registros (CSV/JSON)
│   │       └── dom-list-runner.ts  # Estrategia Modo 2: Extracción de listas DOM y paginación automática
│   ├── contents/
│   │   ├── picker-overlay.tsx      # Inspector visual DOM (elementos, contenedores repetitivos y paginación)
│   │   └── action-executor.ts      # Ejecutor DOM (EXECUTE_STEP, INSPECT_LIST_PAGE y CLICK_NEXT_PAGE)
│   ├── sidepanel/
│   │   ├── index.tsx               # Shell principal, selector de modo y navegación de pestañas
│   │   ├── components/
│   │   │   ├── SidePanelHeader.tsx # Encabezado e insignia de estado reactiva
│   │   │   ├── ModeSelectorBar.tsx # Selector de modo (Iterar Registros CSV vs Extraer Lista Web)
│   │   │   ├── DomListConfigCard.tsx # Configuración de contenedor repetitivo y paginación automática
│   │   │   ├── ExecutionOptionsCard.tsx # Configuración de resiliencia (stop/skip) y rango de iteración
│   │   │   ├── WorkflowLibraryCard.tsx # Biblioteca local de flujos e importación/exportación JSON
│   │   │   ├── StepCard.tsx        # Tarjeta individual de edición de un paso
│   │   │   └── tabs/
│   │   │       ├── StepsTab.tsx    # Pestaña 1: Configuración de pasos, lista DOM y plantillas
│   │   │       ├── DataTab.tsx     # Pestaña 2: Carga y vista previa de registros CSV/JSON
│   │   │       └── RunTab.tsx      # Pestaña 3: Controles de ejecución, reporte CSV y bitácora
│   │   └── utils/
│   │       ├── step-helpers.ts     # Helpers inmutables de pasos y envío de comandos
│   │       ├── workflow-io.ts      # Validación/exportación JSON y descarga de reporte CSV
│   │       └── records-parser.ts   # Parseo de archivos/texto CSV y JSON con PapaParse
│   ├── storage/
│   │   └── workflow-storage.ts     # Estado persistente compartido (@plasmohq/storage)
│   ├── types/
│   │   └── workflow.ts             # Definiciones de contratos y tipos TypeScript
│   └── style.css                   # Directivas base de Tailwind CSS
├── package.json
├── tailwind.config.js
├── postcss.config.js
└── tsconfig.json
```
