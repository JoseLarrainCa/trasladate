# Nueva animación de entrada de Trasladarte

## Objetivo
Reemplazar la animación inicial centrada en el logo por una apertura tipográfica inspirada en la referencia de Better Mistakes, pero adaptada a la identidad corporativa de Trasladarte.

## Propuesta visual
- Fondo completo en azul marino corporativo.
- En el centro, tres palabras relacionadas con el servicio que avanzan verticalmente como un contador:
  1. **Planificamos**
  2. **Embalamos**
  3. **Trasladamos**
- Las palabras entrarán y saldrán con desplazamiento vertical, manteniendo una lectura limpia y rápida.
- Una línea delgada naranja recorrerá el borde superior para indicar visualmente el progreso de la carga.
- Al completar la secuencia, la pantalla se desvanecerá y revelará la página principal.
- Duración total aproximada: 2,3 segundos, similar a la carga actual para no retrasar el acceso al sitio.

## Alcance
- Quitar el logo únicamente de la pantalla de bienvenida.
- Mantener el logo oficial sin cambios en encabezado, pie y demás lugares del sitio.
- Conservar la carga correcta de enlaces con ancla después de cerrar la animación.
- Adaptar tamaño, espaciado y movimiento para escritorio y teléfono.
- Respetar `prefers-reduced-motion`: mostrar la secuencia de forma estática o abreviada cuando el usuario tenga reducidas las animaciones.

## Implementación técnica
- Rehacer `SplashScreen` con Framer Motion usando una lista de palabras y transiciones verticales sincronizadas.
- Crear la barra superior como progreso animado de 0 a 100%, usando los tokens de color existentes de Trasladarte.
- Mantener el temporizador y la llamada `onComplete` correctamente limpiados para evitar bloqueos o pantallas de carga permanentes.
- Verificar visualmente la secuencia completa, la salida hacia el inicio y el comportamiento responsive.
