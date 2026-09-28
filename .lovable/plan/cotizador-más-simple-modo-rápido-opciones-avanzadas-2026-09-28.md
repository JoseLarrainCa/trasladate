# Cotizador más simple: modo rápido + opciones avanzadas

## Problema
- Hoy el generador muestra todos los campos a la vez, así que cuesta encontrar lo que se quiere editar.
- La frase «Camión 25 m³ × 1 · 1 chofer(es) · 2 personas operativas · Materiales incluidos: …» todavía aparece en algunas cotizaciones, y no queda claro dónde se edita.

## 1. Corregir la frase antigua de "Equipo y personal"
- Revisar de dónde sale esa frase: puede ser un texto antiguo guardado en esa cotización o venir del formato Marco.
- Si es un texto guardado, ignorarlo y mostrar la lista nueva: camión, chofer y personas en líneas separadas, con los materiales en su propia fila.
- Si viene del formato Marco, aplicar allí la misma separación en lista.
- Botón "Restaurar formato nuevo" para cotizaciones antiguas.

## 2. Nueva experiencia en 3 pasos
```text
[1 Cliente y ruta] -> [2 Servicio e inventario] -> [3 Revisar y descargar]
```
- **Paso 1:** nombre, contacto, origen y destino (tipo de vivienda), fecha.
- **Paso 2:** tipo de servicio (Express, Principal o Exclusivo), inventario, embalaje sí o no. El camión, el personal y los materiales se sugieren solos.
- **Paso 3:** vista previa grande del PDF con el precio final editable y el botón Descargar o Guardar.
- La vista previa sigue visible al lado en computador y queda en una pestaña en celular.

## 3. Editar directamente en la vista previa
- Al hacer clic en cualquier fila del PDF (Servicio, Equipo, Materiales, Inventario, Pago…) se abre un pequeño panel para editar solo ese texto y ocultar o mostrar esa sección.
- Así Marco no necesita buscar la clave en listas largas.

## 4. Opciones avanzadas colapsadas
- Los Textos, Secciones, Variantes y recargos pasan a un apartado "Opciones avanzadas", cerrado por defecto.
- Se conserva todo lo que existe hoy; solo queda escondido.

## 5. Automatización
- Al elegir el destino (Casa/Dpto o Bodega), se marcan solos las acciones, los materiales y las frases correctas.
- Al elegir el servicio, se completa solo el detalle del servicio.

## Detalles técnicos
- `GenerarCotizacion.tsx`: reorganizar en un asistente por pasos con `Tabs` o stepper, y mover los paneles avanzados a un `Collapsible`/`Accordion`.
- `DocModerno.tsx`/`DocMarco.tsx`: envolver cada fila en un disparador clicable (solo en la vista previa, no al imprimir) que abre un `Popover` con Textarea + Switch `ver_<key>`.
- Migración ligera en el cliente: si `doc.textos` contiene claves obsoletas (p. ej. `mod_item_equipo_detalle`), descartarlas al cargar.
- Sin cambios en la base de datos.
- QA con Playwright: crear una cotización Casa y una Bodega de principio a fin, editar desde la vista previa y descargar.
