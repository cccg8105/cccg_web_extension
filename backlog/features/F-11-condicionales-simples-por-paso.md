# [F-11] Condicionales simples por paso (*Ejecutar paso solo si el selector existe / Paso opcional*)

- **ID:** `F-11`
- **Versión objetivo:** `v1.1.0`
- **Estado:** `[ ] Pendiente`
- **Prioridad:** Media-Alta
- **Esfuerzo estimado:** M
- **Playbook técnico relacionado:** [Playbook 1 (`WorkflowStep`)](../../docs/03-guia-extensibilidad.md)

---

## 1. Descripción y Problema a Resolver

Incluso con selectores autocurativos (`F-18`), existen casos donde un campo o botón **genuinamente no existe** en ciertos ítems o registros:
1. **En Extracción de Listas Web (`dom_list_extract`):** Una tarjeta puede tener `"Precio Oferta"` o `"Badge Envío Gratis"`, mientras que otra tarjeta del mismo listado solo tiene precio regular. Si el paso `extract` del descuento es obligatorio, la tarjeta entera se marca con error o se salta (`F-08`), perdiendo los demás campos válidos (título, imagen, precio base) o ralentizando el bucle.
2. **En Iteración de Formularios (`records_loop`):** Un banner promocional o modal emergente puede aparecer solo ocasionalmente y requiere un paso `click` que solo debe ejecutarse si el elemento está presente.

Esta funcionalidad permite marcar cualquier paso DOM como **Opcional / Condicional (`optional?: boolean`)**: si el elemento no se encuentra tras una verificación rápida, el paso se omite limpiamente (dejando la celda vacía `""` en caso de `extract`) y la fila/ítem continúa ejecutando el resto de sus pasos con normalidad.

---

## 2. Propuesta de Solución (UX / UI)

- **Checkbox / Toggle en `src/sidepanel/components/StepCard.tsx`:**
  - En todos los pasos que usan selector DOM (`step.type !== "wait"`), agregar la opción:
    - `[ ] Paso opcional (omitir sin error si el elemento no existe)` (`step.optional`).
- **Comportamiento en Ejecución y Bitácora:**
  - Si `step.optional === true` y el elemento no existe (ni por candidatos ni por autocuración `F-18` tras un timeout corto de `800ms`), `executeDomStep` retorna `{ ok: true, skippedStep: true, extractedValue: "", message: "Paso opcional omitido (elemento no presente)" }`.
  - La fila/ítem conserva el resto de los campos extraídos y finaliza con `_status = "ok"`.

---

## 3. Impacto Técnico por Capa (Arquitectura MV3)

- [ ] **Contratos y Tipos (`src/types/workflow.ts`):**
  - Añadir `optional?: boolean` en `WorkflowStep`.
  - Añadir `skippedStep?: boolean` en `ExecuteStepResponse`.
- [ ] **Content Scripts (`src/contents/action-executor.ts`):**
  - En `resolveStepTargetElement` / `executeDomStep`: si `step.optional` es `true`, usar un timeout reducido (`800ms`) y, en caso de no encontrar el elemento, resolver sin lanzar error devolviendo `ok: true, skippedStep: true, extractedValue: ""`.
- [ ] **Interfaz Side Panel (`src/sidepanel/components/StepCard.tsx` y `src/sidepanel/utils/workflow-io.ts`):**
  - Agregar el control `optional` en `StepCard.tsx` y preservarlo en `workflow-io.ts`.

---

## 4. Criterios de Aceptación (Checklist de Verificación)

- [ ] El usuario puede marcar o desmarcar cualquier paso DOM como **Opcional** desde su tarjeta en la pestaña **Pasos**.
- [ ] Cuando un paso marcado como opcional no encuentra su elemento en la página o dentro del ítem de la lista, no genera error ni detiene los demás pasos de ese mismo ítem.
- [ ] En pasos `extract` opcionales, si el elemento no existe, la columna de salida se guarda con valor vacío `""` y los demás campos del ítem se conservan.
- [ ] Cumple con los estándares de `docs/02-patrones-y-estandares.md`.
- [ ] Documentación técnica (`README.md` y `docs/`) actualizada si cambiaron módulos, flujos o playbooks.
- [ ] Compila sin errores de TypeScript (`npm run build`).
- [ ] Grafo de conocimiento actualizado con `graphify update .` tras finalizar la implementación.
