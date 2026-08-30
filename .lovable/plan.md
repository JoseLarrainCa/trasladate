# Documento MD extendido: especificación completa del cotizador Trasladarte

Objetivo: entregar un archivo Markdown descargable, lo más completo posible, con todo el funcionamiento del formulario, los 123 ítems del catálogo con sus m³, todas las fórmulas y la lógica del panel admin y del generador de cotizaciones PDF, para reimplementar el sistema en otra plataforma.

## Contenido del documento (versión extendida)

1. **Resumen ejecutivo** — qué hace el sistema en una página.
2. **Arquitectura y flujo de datos** — diagrama del recorrido: formulario público → base de datos → correo (Formspree) → panel admin → cotización PDF, con qué ocurre si falla cada paso.
3. **Formulario público, campo por campo** — tabla con nombre interno, etiqueta visible, tipo de dato, valores posibles, valor por defecto, si es obligatorio y reglas de validación. Incluye datos del cliente, origen, destino y detalles del traslado.
4. **Tipos de mudanza y tipos de servicio** — texto completo de las descripciones de Servicio Express, Principal y Exclusivo, y la regla de cuándo aparece el selector.
5. **Inventario** — cómo funciona el selector de cantidades, el orden alfabético por categoría, las 3 líneas libres para ítems no catalogados y qué se muestra en vivo al cliente.
6. **Todas las fórmulas de cálculo, con ejemplos numéricos**:
   - `TOTAL_M3 = Σ (m³ unitario × cantidad)`
   - `M2_BODEGA = TOTAL_M3 / 2.5` (1 m² de bodega = 2.5 m³)
   - `TOTAL_ITEMS` y `TOTAL_CAJAS`
   - Subtotales por categoría
   - Selección de camión: holgura 1.15 sobre capacidades 15/25/35/45 m³, y varios camiones si supera 45 m³
   - Personal sugerido por tramos de m³
   - Precio: camión, chofer, personal, embalaje por m³, recargos (escala, rampa, estacionamiento, otro), mínimo por servicio, precio final manual y cuotas de pago
   - Un caso de ejemplo completo resuelto de punta a punta
7. **Catálogo completo de 123 ítems** — una tabla por cada una de las 8 categorías (LIVING, COCINA-COMEDOR, DORMITORIOS, OFICINA/ESCRITORIO, BODEGA, LOGGIA, TERRAZA, OTROS CLIENTE) con nombre del ítem, m³ unitario y clave interna, más el conteo por categoría.
8. **Modelo de datos** — tablas `quotes`, `quote_items`, `quote_settings`, `quote_documents` con sus columnas, tipos y enumeraciones (estados de cotización, tipos de vivienda, tipos de mudanza), y la nota clave de que los m³ no se guardan: se recalculan siempre desde el catálogo.
9. **Seguridad y roles** — RLS, inserción pública desde el formulario, lectura y edición solo para el rol admin mediante tabla de roles separada.
10. **Notificación por correo** — plantilla exacta del mensaje que llega a Formspree, con sus secciones y reglas de formato.
11. **Panel de administración** — qué muestra el listado, el detalle de cada cotización (m³ por ítem, subtotales por categoría, total m³ y m² de bodega) y la actualización en tiempo real.
12. **Generador de cotizaciones PDF** — folio correlativo, los dos formatos de documento, datos de empresa y transferencia, y el sistema de textos editables con variables (`{{m3}}`, `{{precio}}`, condicionales de embalaje, etc.) con la lista de todas las variables disponibles.
13. **Configuración editable** — tarifas, datos de la empresa y textos por defecto.
14. **Checklist de reimplementación** — pasos ordenados para levantar lo mismo en otro sistema, con las constantes críticas destacadas (2.5, 1.15, tramos de personal, tarifas y mínimo).
15. **Glosario** de términos usados.

## Detalles técnicos

- Se genera `Trasladarte-Cotizador-Especificacion.md` en la carpeta de documentos, descargable desde el chat.
- Las tablas de ítems se generan automáticamente desde `src/lib/constants/inventory.ts` para que los 123 nombres y m³ queden exactos.
- Tarifas y textos se extraen de `src/lib/quote/defaults.ts`; fórmulas de `src/lib/quote/pricing.ts` y `src/lib/quote/document.ts`; campos y correo desde `src/components/QuoteForm.tsx`.
- No se modifica ningún archivo del proyecto: es solo un documento de salida.
