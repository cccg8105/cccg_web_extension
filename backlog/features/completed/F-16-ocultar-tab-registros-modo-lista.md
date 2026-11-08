# [F-16] Ocultar pestaña Registros y adaptar controles de pasos en modo Extraer Lista Web

- **ID:** `F-16`
- **Versión objetivo:** `v1.0.1`
- **Estado:** `[x] Completado`
- **Prioridad:** Alta
- **Esfuerzo estimado:** S
- **Playbook técnico relacionado:** [Estándares de Estado y Componentes (`docs/02-patrones-y-estandares.md`)](../../../docs/02-patrones-y-estandares.md)

---

## 1. Descripción y Problema a Resolver

Cuando el usuario seleccionaba el modo **"Extraer Lista Web" (`dom_list_extract`)**, seguía mostrándose la pestaña **"Registros"** y los botones de acciones de llenado de formulario (`+ Texto`, `+ Select`, `+ Tecla`), causando confusión ya que en el modo de extracción de listas web la fuente de iteración son los propios elementos del DOM.

---

## 2. Propuesta de Solución (UX / UI)

- **Barra de navegación contextual en `src/sidepanel/index.tsx`:**
  - Oculta la pestaña **Registros** cuando `currentMode === "dom_list_extract"`, ajustando la grilla a `grid-cols-2` (**Pasos** y **Ejecutar**).
  - Redirige automáticamente a `"steps"` si el usuario estaba en `"data"` al cambiar al modo de extracción de listas.
- **Botonera de acciones contextual en `src/sidepanel/components/tabs/StepsTab.tsx`:**
  - En modo `"dom_list_extract"`, muestra únicamente **`+ Extraer`**, **`+ Clic`** y **`+ Espera`**.

---

## 3. Impacto Técnico por Capa (Arquitectura MV3)

- [x] **Interfaz Side Panel (`src/sidepanel/`):**
  - Actualizado `src/sidepanel/index.tsx` con navegación condicional en 2/3 columnas y redirección automática de pestaña activa.
  - Actualizado `src/sidepanel/components/tabs/StepsTab.tsx` para mostrar únicamente las acciones relevantes en modo `"dom_list_extract"`.

---

## 4. Criterios de Aceptación (Checklist de Verificación)

- [x] Al seleccionar el modo **"Extraer Lista Web"**, la pestaña **Registros** desaparece de la barra de navegación y las pestañas **Pasos** y **Ejecutar** ocupan el ancho en 2 columnas.
- [x] Si el usuario está en la pestaña **Registros** y cambia al modo **"Extraer Lista Web"**, la interfaz cambia automáticamente a la pestaña **Pasos**.
- [x] Al volver al modo **"Iterar Registros (CSV)"**, la pestaña **Registros** vuelve a mostrarse con sus datos intactos.
- [x] En modo **"Extraer Lista Web"**, la botonera de creación de pasos muestra únicamente `+ Extraer`, `+ Clic` y `+ Espera`.
- [x] Cumple con los estándares de `docs/02-patrones-y-estandares.md`.
- [x] Documentación técnica (`README.md` y `docs/`) actualizada.
- [x] Compila sin errores de TypeScript (`npm run build`).
- [x] Grafo de conocimiento actualizado con `graphify update .` tras finalizar la implementación.
