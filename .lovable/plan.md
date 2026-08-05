# Resumen del backend de cotizaciones

## 1. ¿Qué es el backend?

El backend es **Lovable Cloud** (Supabase gestionado). Solo usa las tablas de Supabase que necesitamos: autenticación de administradores, base de datos de cotizaciones y almacenamiento de ítems. No hay servidor propio.

## 2. Tablas principales

Hay dos tablas clave para el flujo de cotizaciones:

- **`quotes`** (cotizaciones): guarda todos los datos del cliente, origen, destino, detalles del traslado y estado.
- **`quote_items`** (ítems por cotización): guarda cada mueble/ítem seleccionado en el formulario, con su cantidad.

### Campos de `quotes`

| Grupo | Campos |
|-------|--------|
| Cliente | `cliente_nombre`, `cliente_apellido`, `cliente_razon_social`, `telefono`, `celular`, `email` |
| Origen | `origen_direccion`, `origen_comuna`, `origen_tipo_vivienda`, `origen_tiene_ascensor`, `origen_piso` |
| Destino | `destino_direccion`, `destino_comuna`, `destino_tipo_vivienda`, `destino_tiene_ascensor`, `destino_piso` |
| Traslado | `tipo_mudanza`, `fecha_traslado`, `fecha_indefinida`, `sugerencia_adicional` |
| Estado | `estado` (pendiente, contactado, cotizado, confirmado, completado, cancelado) |
| Notas | `notas_internas` |
| Auditoría | `created_at`, `updated_at`, `imported_from_excel`, `excel_import_date` |

### Campos de `quote_items`

| Campo | Para qué sirve |
|-------|----------------|
| `quote_id` | Relación con la cotización |
| `item_key` | Código único del ítem (ej. `living_sofa_l`) |
| `item_name` | Nombre legible del ítem |
| `category` | Categoría (LIVING, COCINA-COMEDOR, etc.) |
| `quantity` | Cantidad seleccionada |

## 3. ¿Cómo funciona el flujo de cotizaciones?

```text
Usuario llena formulario
        ↓
Frontend genera un ID único
        ↓
Guarda en Supabase:
  - 1 fila en quotes
  - N filas en quote_items
        ↓
Envía email legacy a Formspree
        ↓
Dashboard admin se actualiza en tiempo real con Realtime
```

### Paso a paso

1. **El usuario llena el formulario de 2 pasos** en la sección Cotización (`src/components/QuoteForm.tsx`).
   - Paso 1: datos del cliente, origen y destino.
   - Paso 2: inventario de muebles (cantidades por ítem).

2. **El frontend genera el UUID** en el navegador. Esto evitó problemas de compatibilidad en algunos celulares antiguos.

3. **Intenta guardar en la base de datos**:
   - Inserta una fila en `quotes`.
   - Inserta todas las filas de ítems en `quote_items`.
   - Si falla por algún motivo, **no bloquea** al usuario: igual intenta enviar el email.

4. **Envía el email por Formspree** con un formato "legacy" (formato clásico):
   - Datos del cliente.
   - Datos del origen y destino.
   - Inventario agrupado por categoría, mostrando solo `Nombre: cantidad`.
   - Total de m³ calculado.

5. **El dashboard admin se actualiza solo** gracias a Supabase Realtime, que escucha cambios en `quotes` y `quote_items`.

## 4. ¿Qué medidas se calculan?

Todas las medidas se calculan desde el frontend usando el archivo `src/lib/constants/inventory.ts`, que contiene los valores m³ oficiales de la planilla Excel.

### Fórmulas

| Medida | Fórmula | Dónde se usa |
|--------|---------|--------------|
| **m³ por ítem** | `getInventoryItem(key).m3 × quantity` | Formulario, dashboard, detalle de cotización |
| **Total m³** | `Σ (m³ de cada ítem)` | Formulario, dashboard, detalle de cotización, email |
| **m² de bodega** | `total_m3 / 2.5` | Formulario, dashboard, detalle de cotización |
| **Total ítems** | `Σ quantity` | Formulario, detalle de cotización |
| **Promedio m³ por mudanza** | `total_m3 / cantidad de cotizaciones con ítems` | Dashboard |

### Factor de conversión

```
M2_CONVERSION_FACTOR = 2.5
```

Es decir: **1 m² de bodega = 2.5 m³ de mudanza**. Esto viene directo de la planilla Excel de Trasladarte.

## 5. ¿Cómo se conecta todo?

| Componente | Se conecta con | ¿Qué hace? |
|------------|----------------|------------|
| `QuoteForm.tsx` | `inventory.ts`, Supabase `quotes` + `quote_items`, Formspree | Recibe la cotización del usuario y la guarda/envía |
| `Dashboard.tsx` | Supabase `quotes` + `quote_items`, `inventory.ts` | Muestra KPIs, gráficos y cálculos de m³/m² |
| `Formularios.tsx` | Supabase `quotes` | Lista todas las cotizaciones con filtros y búsqueda |
| `FormularioDetalle.tsx` | Supabase `quotes` + `quote_items`, `inventory.ts` | Muestra el detalle completo de una cotización con m³ por ítem y categoría |
| `inventory.ts` | — | Catálogo de muebles con valores m³ oficiales |
| `AuthContext.tsx` | Supabase Auth | Maneja el login/logout del administrador |

## 6. Seguridad y permisos

- **Cualquier visitante** puede enviar una cotización (INSERT en `quotes` y `quote_items`).
- **Solo administradores** pueden ver, editar o eliminar cotizaciones.
- La verificación de admin se hace en el servidor mediante la función `has_role()` y la tabla `user_roles`, no en el navegador.
- Las políticas de seguridad (RLS) están activas en ambas tablas.

## 7. ¿Qué no hace el backend actualmente?

- No calcula precios automáticamente (tarifa/km/pack). Solo calcula volumen m³ y m² de bodega.
- No envía emails automáticos desde Supabase; el email lo envía Formspree al completar el formulario.
- No tiene notificaciones push ni SMS.
- No guarda el total m³ precalculado en la base de datos; se recalcula en vivo cada vez que se lee.

## 8. Archivos clave

- `src/lib/constants/inventory.ts` — catálogo de muebles y fórmulas.
- `src/components/QuoteForm.tsx` — formulario público de cotización.
- `src/pages/admin/Dashboard.tsx` — panel de métricas.
- `src/pages/admin/Formularios.tsx` — lista de cotizaciones.
- `src/pages/admin/FormularioDetalle.tsx` — detalle de una cotización.
- `src/lib/formspree.ts` — envío de emails.
- `src/contexts/AuthContext.tsx` — autenticación del admin.
