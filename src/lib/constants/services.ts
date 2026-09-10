/**
 * Descripciones de los tipos de servicio del cotizador web.
 * Los valores por defecto se usan si no hay textos guardados en la base de datos.
 * El administrador puede modificarlos desde Configuración → Cotizaciones PDF → Servicios web.
 */

export interface ServicioLinea {
  label: string;
  texto: string;
}

export interface ServicioDetalle {
  titulo: string;
  lineas: ServicioLinea[];
}

export type ServicioDetalles = Record<string, ServicioDetalle>;

export const SERVICIO_KEYS = ['express', 'principal', 'exclusivo'] as const;

export const SERVICIO_LABELS: Record<string, string> = {
  express: 'Servicio Express',
  principal: 'Servicio Principal',
  exclusivo: 'Servicio Exclusivo',
};

export const DEFAULT_SERVICIO_DETALLES: ServicioDetalles = {
  express: {
    titulo: '🚛 01. Servicio Express',
    lineas: [
      { label: 'Unidad', texto: 'Camión cerrado con capacidad en m³ acordada previamente.' },
      {
        label: 'Operación',
        texto:
          'Realizamos la carga, traslado y descarga de todo el inventario pactado, ubicando los enseres en las áreas designadas en el punto de destino.',
      },
      {
        label: 'Nota',
        texto:
          'Modalidad sin embalaje incluido. Garantizar que la carga esté lista para trasladarte es responsabilidad del cliente.',
      },
    ],
  },
  principal: {
    titulo: '📦 02. Servicio Principal',
    lineas: [
      { label: 'Unidad', texto: 'Camión cerrado con capacidad en m³ acordada previamente.' },
      {
        label: 'Materiales incluidos',
        texto:
          'Frazadas de mudanza, cartón corrugado (según requerimiento técnico), stretch film y cintas de embalaje de alta resistencia.',
      },
      {
        label: 'Operación del cliente',
        texto:
          'Embalaje en cajas de contenidos menores (vajilla/cocina, ropa, adornos, libros, juguetes y artículos personales). Nuestro personal se encargará de cargar todas las cajas al camión.',
      },
      {
        label: 'Operación de TRASLADARTE',
        texto:
          'Embalaje de todos los muebles de volumen mayor (departamento o casa), estiba segura en camión, transporte, descarga y posicionamiento final de tus bienes.',
      },
    ],
  },
  exclusivo: {
    titulo: '✨ 03. Servicio Exclusivo (Servicio Integral)',
    lineas: [
      { label: 'Unidad', texto: 'Camión cerrado con capacidad en m³ acordada previamente.' },
      {
        label: 'Operación',
        texto:
          'El equipo de TRASLADARTE ejecuta el embalaje sistemático de la totalidad de los bienes, estiba, traslado, descarga y ordenamiento completo en el nuevo hogar.',
      },
      {
        label: 'Planificación',
        texto: 'Tiempo de ejecución estimado en 1 o 2 jornadas operativas (según el metraje y cubicaje de la propiedad).',
      },
    ],
  },
};

/** Mezcla los textos guardados sobre los valores por defecto. */
export function mergeServicioDetalles(saved?: unknown): ServicioDetalles {
  const base = DEFAULT_SERVICIO_DETALLES;
  if (!saved || typeof saved !== 'object') return base;
  const s = saved as Record<string, Partial<ServicioDetalle>>;
  const out: ServicioDetalles = {};
  SERVICIO_KEYS.forEach((k) => {
    const b = base[k];
    const o = s[k];
    const lineas =
      Array.isArray(o?.lineas) && o!.lineas!.length
        ? o!.lineas!.map((l, i) => ({
            label: l?.label ?? b.lineas[i]?.label ?? '',
            texto: l?.texto ?? b.lineas[i]?.texto ?? '',
          }))
        : b.lineas;
    out[k] = { titulo: o?.titulo ?? b.titulo, lineas };
  });
  return out;
}
