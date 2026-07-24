## Objetivo
Mostrar en el detalle de cada cotización (admin) los mismos cálculos de m³ y m² que usa el Dashboard, aplicando la fórmula de la planilla oficial de Trasladarte.

## Confirmación
Sí, las fórmulas ya están guardadas en el proyecto — en `src/lib/constants/inventory.ts`. Cada ítem del inventario tiene su valor unitario en m³ (tomado directo de `Planilla_Trasladarte_JEM_1.xlsx`) y ya existen los helpers `calculateTotalM3()` y `m3ToM2()` (factor de conversión 2.5, igual que la planilla). El Dashboard ya los usa; solo falta aplicarlos también en el detalle de la cotización.

## Cambios

**Archivo:** `src/pages/admin/FormularioDetalle.tsx`

1. Importar `getInventoryItem` y `m3ToM2` desde `@/lib/constants/inventory`.
2. En la sección de Inventario:
   - Calcular `m³` por cada ítem (`item.m3 × quantity`) y mostrarlo junto a la cantidad.
   - Calcular `m³` subtotal por categoría y mostrarlo en el título de cada grupo.
   - Añadir un resumen al final del bloque con **Total m³**, **m² estimados de bodega** (m³ ÷ 2.5) y **Total ítems**, con el mismo estilo visual de tarjeta que usa el Dashboard.

## Detalle técnico
- Fórmulas ya existentes que se reutilizan:
  - `m3_item = getInventoryItem(item_key).m3 × quantity`
  - `total_m3 = Σ m3_item`
  - `total_m2 = total_m3 / 2.5` (constante `M2_CONVERSION_FACTOR`)
- No se toca el backend: los datos ya se guardan con `item_key`, por lo que el cálculo es determinístico desde el frontend.
- No se modifica el Dashboard ni el `QuoteForm` (siguen funcionando igual).

## Fuera de alcance
- Cambios en la base de datos o en el email de Formspree.
- Recalcular cotizaciones antiguas — la fórmula es en vivo, así que aplica automáticamente.
