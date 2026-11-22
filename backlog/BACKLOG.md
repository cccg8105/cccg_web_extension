# Backlog de Funcionalidades Pendientes — AutoLoop RPA

- **Versión actual publicada (`package.json`):** `1.0.1`
- **Próxima versión objetivo:** `v1.1.0`
- **Historial de versiones completadas:** [`backlog/HISTORIAL.md`](./HISTORIAL.md)
- **Guía de gestión y reglas del backlog:** [`backlog/README.md`](./README.md)

---

## 1. Resumen de Próximas Versiones (Roadmap Priorizado)

| Orden | Versión | Enfoque Principal | Estado | Hito Clave |
| :---: | :--- | :--- | :---: | :--- |
| **1** | **`v1.1.0`** | **Selectores Autocurativos con Aprendizaje por Refuerzo y Pasos Condicionales** | `[-]` Parcial | Motor RL (`UCB1` + `$Q$-Learning` + Huella $\mathcal{F}$) completado (`F-18` en [`HISTORIAL.md`](./HISTORIAL.md)); pendientes pasos opcionales/condicionales (`F-11`). |
| **2** | **`v1.2.0`** | **Automatización Asistida** | `[ ]` Planificado | Modo Grabador (`F-10`) pendiente en Icebox (`F-19` de extracción de tablas HTML completado en [`HISTORIAL.md`](./HISTORIAL.md)). |

---

## 2. Plan Detallado de Versiones Pendientes (En Orden de Prioridad)

### Prioridad 1: `v1.1.0` — Selectores Autocurativos con Aprendizaje por Refuerzo y Pasos Condicionales
> **Objetivo:** Dotar a la extensión de inteligencia adaptativa frente a páginas con **DOM Polimórfico** (ítems con variantes estructurales o campos opcionales), permitiendo que el sistema explore selectores alternativos cuando uno falle, memorice lo aprendido para siguientes corridas (`F-18` completado) y omita limpiamente campos opcionales inexistentes (`F-11`).

| Orden | Estado | ID | Feature | Prioridad | Esfuerzo | Capas MV3 Afectadas | Especificación |
| :---: | :---: | :--- | :--- | :---: | :---: | :--- | :--- |
| **1** | `[ ]` | **F-11** | Condicionales simples por paso (*Ejecutar paso solo si el selector existe / Paso opcional*) | **Media-Alta** | M | `types`, `contents`, `sidepanel` | [Ver F-11](./features/F-11-condicionales-simples-por-paso.md) |

---

## 3. Icebox (Ideas Futuras Post-`v1.2.0`)

| Orden | ID | Idea / Funcionalidad | Prioridad | Esfuerzo Est. | Notas de Diseño |
| :---: | :--- | :--- | :---: | :---: | :--- |
| **1** | **F-10** | Modo Grabador (*Recorder*) de interacciones del usuario | Baja | L | Captura automática de eventos `click` e `input` en la pestaña activa para generar pasos sin crearlos manualmente. |
