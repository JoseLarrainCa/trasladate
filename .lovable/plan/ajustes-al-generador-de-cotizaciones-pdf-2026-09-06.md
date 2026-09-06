# Ajustes al generador de cotizaciones PDF

Cambios pedidos por Marco sobre el documento PDF del panel de administración.

## 1. Quitar el nombre del titular del encabezado (formato Moderno)
En `DocModerno.tsx` el encabezado muestra "Marcos Aguilar" (dato `empresa.titular`). Se elimina esa línea del encabezado del PDF, manteniendo WhatsApp, web y correo. El titular sigue apareciendo solo en la sección "Datos de transferencia" (donde es necesario para pagar).

## 2. Tipo de vivienda en Origen y Destino (formato Moderno)
En las tarjetas ORIGEN / DESTINO se agrega el tipo de vivienda al inicio de la línea secundaria, usando los valores ya existentes (`Casa`, `Dpto`, `Oficina`, `Bodega`):
- Ejemplo destino bodega: `Bodega · Las Condes`
- Ejemplo: `Casa · Las Condes · sin ascensor`

## 3. Indicar el tipo de servicio seleccionado (Express / Principal / Exclusivo)
El cotizador web ya guarda el tipo de servicio en `sugerencia_adicional` cuando es mudanza de hogar. Cambios:
- `DocState` recibe un campo `tipo_servicio` ('express' | 'principal' | 'exclusivo' | '').
- En `GenerarCotizacion.tsx` se lee desde la cotización importada y también se puede elegir manualmente con un selector.
- En `DocModerno.tsx` (ítem 1 de la tabla) y `DocMarco.tsx` (título del servicio) se muestra, por ejemplo: `Servicio Exclusivo — Casa a Bodega`.

## 4. Acciones según destino (bodega vs casa/dpto)
Hoy `accion_desembalar` solo se excluye si no hay embalaje. Nueva regla automática:
- Si el destino es **bodega**, se excluyen automáticamente `accion_desembalar` ("Desembalaje de TODOS LOS MUEBLES GRANDES...") y `accion_camas` ("Armado de camas..."), porque no aplican en bodega.
- El admin puede volver a activarlas manualmente si un caso especial lo requiere.
- Aplica en ambos formatos (`DocMarco` y `DocModerno` comparten el filtro).

## 5. Alternativas de textos (como el selector de saludo)
Se agrega un sistema de "variantes" para las frases clave: cada texto importante (saludo, personal calificado, acciones, observaciones) tendrá 2–3 versiones predefinidas seleccionables desde un menú desplegable en el editor, además de la edición libre que ya existe. Las variantes se definen en `src/lib/quote/defaults.ts` junto a los textos actuales.

## 6. Materiales según destino
Presets de materiales que se preseleccionan automáticamente según el destino (el admin puede modificarlos):
- **Destino bodega:** Cartón Corrugado para proteger muebles grandes, Stretch Film, Cintas de embalaje, Cajas de cartón.
- **Destino casa / dpto:** Frazadas o Mantas para proteger MUEBLES GRANDES, Stretch Film, Cintas de embalaje.
Se agrega `mat_carton` y `mat_cajas` al catálogo de materiales (`TEXTO_DEFS`, grupo "Materiales") y la lógica de preselección al cargar la cotización o cambiar el destino.

## Detalles técnicos
- Archivos: `src/lib/quote/defaults.ts` (nuevos materiales + variantes de texto), `src/lib/quote/document.ts` (campo `tipo_servicio`, helpers de presets), `src/components/admin/pdf/DocModerno.tsx` y `DocMarco.tsx` (encabezado, tarjetas, filtro de acciones), `src/pages/admin/GenerarCotizacion.tsx` (selector de tipo de servicio, variantes de texto, preselección de materiales).
- Sin cambios de base de datos: `tipo_servicio` se guarda dentro del JSON del documento (`quote_documents`) que ya existe.
- Verificación: build OK y revisión visual del PDF en ambos formatos con un caso casa→bodega y un caso dpto→casa.
