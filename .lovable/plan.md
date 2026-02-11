
## Splash Screen de Carga para Trasladarte

Se creara una pantalla de bienvenida animada que aparece brevemente (aproximadamente 2 segundos) cada vez que alguien entra al sitio. Sera elegante, rapida y acorde con la marca.

### Que veras

1. Fondo con el gradiente oscuro de la marca (azul oscuro a naranja)
2. El logo de Trasladarte (la "T" naranja en cuadrado redondeado) aparece con efecto de escala
3. Un camion pequeno animado que se desplaza de izquierda a derecha debajo del logo
4. El nombre "Trasladarte" aparece con efecto de escritura/fade
5. El slogan "La Gran Aventura de Mudarte" aparece suavemente debajo
6. Una barra de progreso naranja que se llena rapidamente
7. Despues de ~2 segundos, todo se desvanece y aparece la pagina principal

### Detalles tecnicos

1. **Nuevo componente `src/components/SplashScreen.tsx`**
   - Componente con estado interno que controla visibilidad
   - Usa Framer Motion para las animaciones (ya instalado)
   - El icono Truck de Lucide como el camion animado
   - Barra de progreso usando el componente Progress existente
   - Despues de 2 segundos, ejecuta animacion de salida (fade out + scale)
   - Al terminar la animacion de salida, se desmonta del DOM

2. **Modificar `src/pages/Index.tsx`**
   - Agregar estado `showSplash` (inicia en `true`)
   - Mostrar `SplashScreen` cuando `showSplash` es `true`
   - Cuando termina el splash, cambiar a `false` y mostrar el contenido normal
   - El contenido de la pagina se renderiza detras pero oculto hasta que termine el splash

3. **No se toca nada del backend ni la base de datos** - Es puramente visual/frontend
