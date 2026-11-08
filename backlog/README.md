# Guía de Gestión del Backlog y Versionamiento — AutoLoop RPA

Este directorio contiene el sistema de planificación de versiones, seguimiento de funcionalidades pendientes y registro histórico de **AutoLoop RPA**.

---

## Mapa de Archivos del Directorio `backlog/`

| Archivo / Carpeta | Rol Principal | Naturaleza |
| :--- | :--- | :--- |
| [**`BACKLOG.md`**](./BACKLOG.md) | **Tablero de Pendientes:** Contiene únicamente el roadmap de próximas versiones, las tablas de features por implementar y el *Icebox*. | Dinámico |
| [**`HISTORIAL.md`**](./HISTORIAL.md) | **Registro Histórico:** Lista en orden cronológico inverso todas las versiones liberadas y las features completadas. | Dinámico |
| [**`_TEMPLATE-feature.md`**](./_TEMPLATE-feature.md) | **Plantilla Estándar:** Documento base para redactar la especificación técnica de cualquier nueva funcionalidad. | Estático |
| [**`features/`**](./features/) | **Especificaciones Activas:** Archivos `F-XX-*.md` de funcionalidades pendientes o en desarrollo. | Dinámico |
| [**`features/completed/`**](./features/completed/) | **Especificaciones Archivadas:** Archivos `F-XX-*.md` cuya implementación ya fue terminada y verificada. | Histórico |

---

## 1. Estrategia de Versionamiento (SemVer)

El número de versión en [`package.json`](../package.json) determina la versión publicada en el `manifest.json` generado por Plasmo:

- **`0.x.0` (Versiones Menores / Bloques funcionales):** Agrupan un conjunto coherente de nuevas capacidades (ej. nuevas acciones DOM, persistencia de múltiples flujos, extracción de datos).
- **`0.x.y` (Parches / Correcciones):** Bugfixes, mejoras de resiliencia en selectores o ajustes visuales que no alteran contratos ni agregan funcionalidades mayores.
- **`1.0.0` (Primera versión estable):** Hito con manejo avanzado de errores por registro, cobertura completa de controles de formulario, exportación/importación y empaquetado listo para Chrome Web Store.

---

## 2. Leyenda de Estados y Esfuerzo

- **Estados:**
  - `[ ]` **Pendiente:** Funcionalidad planificada en [`BACKLOG.md`](./BACKLOG.md) aún no iniciada.
  - `[-]` **En progreso:** Funcionalidad actualmente en desarrollo en [`BACKLOG.md`](./BACKLOG.md).
  - `[x]` **Completado:** Funcionalidad terminada y trasladada a [`HISTORIAL.md`](./HISTORIAL.md).
- **Esfuerzo estimado:**
  - **S (Small):** Cambios acotados en 1–3 archivos siguiendo un playbook existente en [`docs/03-guia-extensibilidad.md`](../docs/03-guia-extensibilidad.md).
  - **M (Medium):** Cambios que abarcan múltiples contextos MV3 o requieren nueva estructura en `workflowStorage`.
  - **L (Large):** Nuevos subsistemas o cambios arquitectónicos transversales.

---

## 3. Flujo de Trabajo Paso a Paso

### Paso 1: Crear una nueva feature
1. Copia [`_TEMPLATE-feature.md`](./_TEMPLATE-feature.md) dentro de `backlog/features/F-XX-nombre-corto.md`.
2. Asígnale el siguiente identificador consecutivo (`F-XX`) y agrégala en la versión correspondiente (o en el *Icebox*) dentro de [`BACKLOG.md`](./BACKLOG.md).

### Paso 2: Implementar una feature
1. Cambia su estado a `[-]` en [`BACKLOG.md`](./BACKLOG.md) y en su archivo individual dentro de `backlog/features/`.
2. Implementa los cambios respetando [`docs/02-patrones-y-estandares.md`](../docs/02-patrones-y-estandares.md) y los playbooks de [`docs/03-guia-extensibilidad.md`](../docs/03-guia-extensibilidad.md).

### Paso 3: Cerrar una feature y liberar versión
1. Marca todos los criterios de aceptación como `[x]` y actualiza el estado a `[x] Completado` dentro del archivo de la feature.
2. Mueve el archivo desde `backlog/features/F-XX-....md` hacia `backlog/features/completed/F-XX-....md`.
3. Registra la feature completada en [`HISTORIAL.md`](./HISTORIAL.md) (apuntando a `./features/completed/F-XX-....md`) y retírala de [`BACKLOG.md`](./BACKLOG.md).
4. Cuando se completen todas las features de una versión, retira el bloque de esa versión de [`BACKLOG.md`](./BACKLOG.md), consolídalo en [`HISTORIAL.md`](./HISTORIAL.md) e incrementa el campo `"version"` en [`package.json`](../package.json).
