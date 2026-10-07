# Rediseño exclusivo de la hoja de fotografías

## Alcance
- Mantener **sin cambios** la primera hoja de cotización y la segunda hoja de inventario.
- Rediseñar únicamente la hoja final que muestra las seis fotografías reales de Trasladarte.
- Conservar el interruptor actual «Página de fotos», el folio, la fecha y el orden de descarga.

## Nueva hoja fotográfica
- Reemplazar la grilla uniforme actual por un mosaico editorial asimétrico, diseñado directamente para las proporciones reales de las seis fotos.
- Dar protagonismo a las mejores fotografías, combinar imágenes verticales y horizontales y eliminar las franjas grises excesivas.
- Mantener encabezado de marca, título «Cuidado en cada mudanza», categorías y leyendas breves, con una jerarquía más profesional.
- Usar la identidad ya definida: azul corporativo, naranja cálido, fondo blanco y tipografías Sora/Manrope.
- Asegurar que ninguna foto se deforme: cada imagen tendrá un encuadre individual mediante `object-fit` y posición ajustada a su contenido.

## Implementación
- Modificar solamente el componente dedicado a la hoja fotográfica y sus estilos de impresión.
- No tocar datos, cálculos, textos editables, inventario, precio, cotización principal ni backend.
- Mantener dimensiones estables para Carta y A4 y conservar la espera de carga de imágenes antes de imprimir.

## Verificación y entrega
- Generar una cotización completa de tres páginas con datos de ejemplo.
- Revisar visualmente las tres páginas en Carta y A4, comprobando que las dos primeras permanezcan iguales.
- Validar en la hoja de fotos: seis imágenes cargadas, sin deformaciones, cortes incómodos, textos montados ni saltos de página.
- Entregar aquí un nuevo PDF de ejemplo versionado para comparar con el anterior.
