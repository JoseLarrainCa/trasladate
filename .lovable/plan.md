# Documento MD: especificación del cotizador Trasladarte

Objetivo: entregar un archivo Markdown descargable con toda la información del formulario de cotización y sus fórmulas, para reimplementar el sistema en otra plataforma.

## Qué contendrá el documento

1. **Arquitectura general** — flujo formulario público → base de datos + correo (Formspree) → panel admin → generador de cotización PDF.
2. **Campos del formulario** (2 pasos): datos del cliente, origen y destino (dirección, comuna, tipo de vivienda, piso, ascensor), detalles del traslado (tipo de mudanza, tipo de servicio Express/Principal/Exclusivo con sus descripciones, fecha, fecha indefinida, observaciones) y reglas de validación.
3. **Inventario**: 123 ítems en 8 categorías, orden alfabético, 3 líneas libres para ítems no catalogados.
4. **Fórmulas de cálculo**:
   - `TOTAL_M3 = Σ (m³ unitario × cantidad)`
   - `M2_BODEGA = TOTAL_M3 / 2.5`
   - `TOTAL_ITEMS` y `TOTAL_CAJAS` (ítems cuyo nombre contiene "caja")
   - Selección de camión con holgura 1.15 sobre capacidades 15/25/35/45 m³ y división en varios camiones sobre 45 m³
   - Personal sugerido por tramos de m³ (2 / 3 / 4 / 5 / 5 + ceil((m3−45)/12))
   - Precio: tarifas de camión, chofer, personal, embalaje por m³, recargos, mínimo por servicio, precio final manual y cuotas de pago
5. **Modelo de datos**: tablas `quotes`, `quote_items`, `quote_settings`, `quote_documents`, con la nota de que los m³ no se persisten (se recalculan desde el catálogo).
6. **Catálogo completo**: tabla con los 123 ítems, su categoría y su m³ unitario.
7. **Formato del correo** enviado por Formspree (secciones y reglas: solo cantidades, orden de categorías).
8. **Reglas de visibilidad** cliente vs. admin.
9. **Checklist de reimplementación** paso a paso.

## Detalles técnicos

- El archivo se genera como `Trasladarte-Cotizador-Especificacion.md` en la carpeta de documentos, descargable desde el chat.
- La tabla del catálogo se genera automáticamente desde `src/lib/constants/inventory.ts` para que los m³ queden exactos.
- Las tarifas se toman de `src/lib/quote/defaults.ts` y las fórmulas de `src/lib/quote/pricing.ts`.
- No se modifica ningún archivo del proyecto: es solo un documento de salida.
