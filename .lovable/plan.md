# Separar equipo y materiales en la cotización Moderna

## Resultado esperado
La tabla del formato Moderno tendrá cuatro bloques claramente diferenciados:

1. **Servicio seleccionado** — mantiene Express, Principal o Exclusivo y el trayecto.
2. **Equipo y personal** — se presenta como lista, con camión, chofer(es) y personal operativo en líneas separadas.
3. **Materiales** — se presenta como una lista independiente, con cada material seleccionado en su propia línea.
4. **Inventario a trasladar** — mantiene cantidad de ítems, m³ y equivalencia de bodega.

## Flexibilidad para Marco
- Agregar el bloque **Materiales** como sección independiente que pueda mostrarse u ocultarse.
- Mantener editables los títulos y textos del formato Moderno.
- Permitir cambiar las frases usadas para camión, choferes y personal sin perder los valores automáticos de la cotización.
- Los materiales seguirán dependiendo de la selección realizada para cada cotización y del destino Casa/Dpto o Bodega.
- Si no hay embalaje o no hay materiales seleccionados, no se mostrará una fila vacía.

## Presentación
- Usar viñetas limpias dentro de “Equipo y personal” y “Materiales”.
- Renumerar automáticamente las filas visibles, de modo que ocultar una sección no deje saltos.
- Mantener el estilo visual, colores y proporciones actuales del PDF Moderno.

## Detalles técnicos
- Separar la composición actual de equipo/materiales en el documento Moderno.
- Incorporar textos configurables para cada línea del equipo y el encabezado de materiales.
- Añadir `item_materiales` a los controles de visibilidad existentes.
- Guardar las preferencias dentro del documento actual, sin cambios en la base de datos.
- Verificar visualmente casos Casa/Dpto y Bodega, además de una cotización sin embalaje.
