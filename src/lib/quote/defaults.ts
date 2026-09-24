/** Configuración por defecto del generador de cotizaciones PDF Trasladarte. */

export interface Tarifas {
  camion15: number;
  camion25: number;
  camion35: number;
  camion45: number;
  chofer: number;
  persona: number;
  embalajeM3: number;
  minimo: number;
}

export const DEFAULT_TARIFAS: Tarifas = {
  camion15: 70000,
  camion25: 95000,
  camion35: 125000,
  camion45: 150000,
  chofer: 45000,
  persona: 45000,
  embalajeM3: 5000,
  minimo: 150000,
};

export const TARIFA_LABELS: Record<keyof Tarifas, string> = {
  camion15: 'Camión 15 m³',
  camion25: 'Camión 25 m³',
  camion35: 'Camión 35 m³',
  camion45: 'Camión 45 m³',
  chofer: 'Chofer (por camión)',
  persona: 'Persona operativa (c/u)',
  embalajeM3: 'Servicio de embalaje ($/m³)',
  minimo: 'Mínimo por servicio',
};

export const CAMIONES = [
  { key: 'camion15', label: 'Camión 15 m³', capacidad: 15 },
  { key: 'camion25', label: 'Camión 25 m³', capacidad: 25 },
  { key: 'camion35', label: 'Camión 35 m³', capacidad: 35 },
  { key: 'camion45', label: 'Camión 45 m³', capacidad: 45 },
] as const;

export interface Empresa {
  titular: string;
  banco: string;
  cuenta: string;
  numero: string;
  rut: string;
  correo: string;
  wsp1: string;
  wsp2: string;
  web: string;
  akikb_correo: string;
  akikb_wsp: string;
  akikb_oficina: string;
}

export const DEFAULT_EMPRESA: Empresa = {
  titular: 'Marcos Aguilar',
  banco: 'Falabella',
  cuenta: 'Corriente',
  numero: '15842066742',
  rut: '25.179.672-6',
  correo: 'servicios@trasladarte.cl',
  wsp1: '+56990040399',
  wsp2: '+56991421929',
  web: 'www.trasladarte.cl',
  akikb_correo: 'minibodegas@akikb.cl',
  akikb_wsp: '+56974315338',
  akikb_oficina: '+56222000555',
};

/** Catálogo de líneas de texto del PDF. Las keys son estables: no renombrar. */
export interface TextoDef {
  key: string;
  label: string;
  group: 'Frases' | 'Materiales' | 'Acciones' | 'Observaciones' | 'Pago' | 'Tabla' | 'Moderno';
  default: string;
}

export const TEXTO_DEFS: TextoDef[] = [
  {
    key: 'saludo_cuerpo',
    label: 'Párrafo de saludo',
    group: 'Frases',
    default:
      '{{saludo}}, junto con saludarle le entrego a través de este documento la información de su cotización solicitada a nuestra empresa, los servicios que nosotros le ofrecemos son los siguientes:',
  },
  {
    key: 'personal_calificado',
    label: 'Personal calificado',
    group: 'Frases',
    default:
      'Personal calificado para {{#embalaje}}embalar y {{/embalaje}}cargar en {{tipoOrigen}} origen; descargar, {{#embalaje}}desembalar y {{/embalaje}}ordenar muebles en {{tipoDestino}} destino.',
  },
  {
    key: 'se_trasladara',
    label: 'Introducción al inventario',
    group: 'Frases',
    default: 'Se {{#embalaje}}embalará y {{/embalaje}}trasladará:',
  },
  { key: 'mat_frazadas', label: 'Material — Frazadas', group: 'Materiales', default: 'Frazadas o Mantas para proteger MUEBLES GRANDES' },
  { key: 'mat_stretch', label: 'Material — Stretch Film', group: 'Materiales', default: 'Stretch Film' },
  { key: 'mat_cintas', label: 'Material — Cintas', group: 'Materiales', default: 'Cintas de embalaje' },
  { key: 'mat_carton', label: 'Material — Cartón corrugado', group: 'Materiales', default: 'Cartón Corrugado para proteger muebles grandes' },
  { key: 'mat_cajas', label: 'Material — Cajas', group: 'Materiales', default: 'Cajas de cartón' },
  {
    key: 'accion_embalar',
    label: 'Acción — embalar',
    group: 'Acciones',
    default:
      'Se embalará TODOS LOS MUEBLES GRANDES, mencionados anteriormente, en {{tipoOrigen}} origen ({{origenComuna}}).',
  },
  {
    key: 'accion_cargar',
    label: 'Acción — cargar',
    group: 'Acciones',
    default: 'Se cargará TODO lo antes mencionado hacia camión, en {{tipoOrigen}} origen ({{origenComuna}}).',
  },
  {
    key: 'accion_descargar',
    label: 'Acción — descargar',
    group: 'Acciones',
    default: 'Se descargará TODO desde camión hacia {{tipoDestino}} destino ({{destinoComuna}}).',
  },
  {
    key: 'accion_desembalar',
    label: 'Acción — desembalar',
    group: 'Acciones',
    default: 'Desembalaje de TODOS LOS MUEBLES GRANDES, en {{tipoDestino}} destino ({{destinoComuna}}).',
  },
  {
    key: 'accion_camas',
    label: 'Acción — armado de camas',
    group: 'Acciones',
    default: 'Armado de camas, en {{tipoDestino}} destino ({{destinoComuna}}).',
  },
  {
    key: 'accion_ordenar',
    label: 'Acción — ordenar',
    group: 'Acciones',
    default:
      'Ubicación de los muebles de tal manera que quede todo ordenado en {{tipoDestino}} destino ({{destinoComuna}}).',
  },
  {
    key: 'obs_a',
    label: 'Observación A',
    group: 'Observaciones',
    default:
      'Si usted cree conveniente brindarles alguna propina al personal, queda a criterio suyo, pero no es obligación.',
  },
  {
    key: 'obs_b',
    label: 'Observación B',
    group: 'Observaciones',
    default:
      'Todo mueble que no ingrese por ascensor y se tenga que bajar y/o subir por escala tiene un costo adicional.',
  },
  {
    key: 'obs_c',
    label: 'Observación C',
    group: 'Observaciones',
    default:
      'Todo trabajo se debe realizar por el piso 1 o lobby, todo trabajo que se realiza por rampa tiene un costo adicional.',
  },
  {
    key: 'obs_d',
    label: 'Observación D',
    group: 'Observaciones',
    default:
      'El estacionamiento donde quedaría el camión, no tiene que superar los 50mts de distancia hasta el ascensor, esto genera un costo adicional.',
  },
  {
    key: 'obs_e',
    label: 'Observación E',
    group: 'Observaciones',
    default:
      'Si usted tiene interes por regalar algo, favor canalizarlo directamente con nosotros o el supervisor de su mudanza el mismo día.',
  },
  { key: 'pago_cuota1_label', label: 'Cuota 1 — glosa', group: 'Pago', default: 'Aceptación del Presupuesto' },
  { key: 'pago_cuota2_label', label: 'Cuota 2 — glosa', group: 'Pago', default: 'Al momento de iniciar la descarga' },
  { key: 'pago_intro', label: 'Intro transferencia', group: 'Pago', default: 'Realizar transferencia de acuerdo a los siguientes datos:' },
  {
    key: 'pago_saldo',
    label: 'Nota del saldo',
    group: 'Pago',
    default:
      'El saldo lo puede cancelar en efectivo ó transferencia a la misma cuenta, pero antes de realizar la descarga.',
  },
  { key: 'nota_iva', label: 'Nota IVA', group: 'Pago', default: 'NOTA: Este costo no incluye IVA' },
  { key: 'fila_chofer', label: 'Fila tabla — chofer', group: 'Tabla', default: 'Chofer' },
  {
    key: 'fila_personas',
    label: 'Fila tabla — personas',
    group: 'Tabla',
    default:
      'Personas operativas para cargar en {{tipoOrigen}} origen; descargar, {{#embalaje}}desembalar y {{/embalaje}}ordenar muebles en {{tipoDestino}} destino',
  },
  { key: 'fila_embalaje', label: 'Fila tabla — embalaje', group: 'Tabla', default: 'Servicio de embalaje:' },
  { key: 'fila_embalaje_incluye', label: 'Fila tabla — materiales', group: 'Tabla', default: 'Incluye Materiales:' },

  /* --- Formato Moderno: todas las palabras fijas del documento --- */
  { key: 'mod_tagline', label: 'Moderno — bajada del logo', group: 'Moderno', default: 'LA GRAN AVENTURA DE MUDARTE' },
  { key: 'mod_titulo', label: 'Moderno — título del documento', group: 'Moderno', default: 'COTIZACIÓN' },
  { key: 'mod_lbl_folio', label: 'Moderno — etiqueta N° servicio', group: 'Moderno', default: 'N° Servicio:' },
  { key: 'mod_lbl_fecha', label: 'Moderno — etiqueta fecha', group: 'Moderno', default: 'Fecha:' },
  { key: 'mod_lbl_cliente', label: 'Moderno — tratamiento del cliente', group: 'Moderno', default: 'Sr(a):' },
  { key: 'mod_lbl_origen', label: 'Moderno — etiqueta origen', group: 'Moderno', default: 'ORIGEN' },
  { key: 'mod_lbl_destino', label: 'Moderno — etiqueta destino', group: 'Moderno', default: 'DESTINO' },
  {
    key: 'mod_intro',
    label: 'Moderno — frase de introducción',
    group: 'Moderno',
    default: '{{saludo}}, tengo el agrado de cotizar para Ud. lo siguiente:',
  },
  { key: 'mod_th_num', label: 'Moderno — columna N°', group: 'Moderno', default: '#' },
  { key: 'mod_th_desc', label: 'Moderno — columna descripción', group: 'Moderno', default: 'DESCRIPCIÓN DEL SERVICIO' },
  { key: 'mod_item_equipo', label: 'Moderno — título fila equipo', group: 'Moderno', default: 'Equipo y personal' },
  {
    key: 'mod_equipo_camion',
    label: 'Moderno — línea camión',
    group: 'Moderno',
    default: '{{camiones}} {{camion}}',
  },
  {
    key: 'mod_equipo_choferes',
    label: 'Moderno — línea choferes',
    group: 'Moderno',
    default: '{{choferes}} chofer(es)',
  },
  {
    key: 'mod_equipo_personas',
    label: 'Moderno — línea personal operativo',
    group: 'Moderno',
    default: '{{personas}} personas operativas',
  },
  { key: 'mod_item_materiales', label: 'Moderno — título fila materiales', group: 'Moderno', default: 'Materiales' },
  {
    key: 'mod_item_inventario',
    label: 'Moderno — título fila inventario',
    group: 'Moderno',
    default: 'Inventario a trasladar — {{items}} ítems · {{m3}} m³',
  },
  {
    key: 'mod_item_inventario_detalle',
    label: 'Moderno — detalle fila inventario',
    group: 'Moderno',
    default: 'Detalle completo en la hoja anexa de inventario.',
  },
  { key: 'mod_total', label: 'Moderno — etiqueta total', group: 'Moderno', default: 'TOTAL A PAGAR' },
  { key: 'mod_iva', label: 'Moderno — nota IVA', group: 'Moderno', default: '(no incluye IVA)' },
  { key: 'mod_h_acciones', label: 'Moderno — título acciones', group: 'Moderno', default: 'LO QUE HAREMOS' },
  { key: 'mod_h_pago', label: 'Moderno — título forma de pago', group: 'Moderno', default: 'FORMA DE PAGO' },
  { key: 'mod_h_obs', label: 'Moderno — título observaciones', group: 'Moderno', default: 'OBSERVACIONES' },
  { key: 'mod_h_transferencia', label: 'Moderno — título transferencia', group: 'Moderno', default: 'Datos de transferencia' },
  { key: 'mod_h_contacto', label: 'Moderno — título contacto', group: 'Moderno', default: 'Contacto' },
  { key: 'mod_akikb', label: 'Moderno — línea mini bodegas', group: 'Moderno', default: 'Mini bodegas akikb' },
  { key: 'mod_marca', label: 'Moderno — nombre de la marca', group: 'Moderno', default: 'TRASLADARTE' },
  {
    key: 'mod_encabezado_contacto',
    label: 'Moderno — contacto del encabezado',
    group: 'Moderno',
    default: 'WhatsApp {{wsp1}} · {{web}}\n{{correo}}',
  },
  {
    key: 'mod_cliente_sub',
    label: 'Moderno — datos bajo el nombre del cliente',
    group: 'Moderno',
    default: '{{email}} · {{telefono}}',
  },
  {
    key: 'mod_ruta_origen',
    label: 'Moderno — detalle del origen',
    group: 'Moderno',
    default: '{{origenComuna}} · {{origenAscensor}}',
  },
  {
    key: 'mod_ruta_destino',
    label: 'Moderno — detalle del destino',
    group: 'Moderno',
    default: '{{destinoComuna}} · {{destinoAscensor}}',
  },
  {
    key: 'mod_item_servicio',
    label: 'Moderno — título fila servicio',
    group: 'Moderno',
    default: '{{servicio}}{{tipoOrigenCorto}} a {{tipoDestinoCorto}}',
  },
  {
    key: 'mod_item_bodega',
    label: 'Moderno — equivalencia en bodega',
    group: 'Moderno',
    default: '≈ {{m2}} m² de bodega',
  },
  {
    key: 'mod_pago_linea1',
    label: 'Moderno — línea cuota 1',
    group: 'Moderno',
    default: '{{cuota1}}% Aceptación del Presupuesto — {{montoCuota1}}',
  },
  {
    key: 'mod_pago_linea2',
    label: 'Moderno — línea cuota 2',
    group: 'Moderno',
    default: '{{cuota2}}% Al momento de iniciar la descarga — {{montoCuota2}}',
  },
  {
    key: 'mod_transferencia_detalle',
    label: 'Moderno — datos de transferencia',
    group: 'Moderno',
    default: '{{titular}} · Rut {{rut}}\nBanco {{banco}} · Cuenta {{cuenta}} N° {{numeroCuenta}}\n{{correo}}',
  },
  {
    key: 'mod_contacto_detalle',
    label: 'Moderno — datos de contacto del pie',
    group: 'Moderno',
    default: 'WhatsApp {{wsp1}} · {{wsp2}}\n{{web}}',
  },
  {
    key: 'mod_akikb_detalle',
    label: 'Moderno — datos akikb',
    group: 'Moderno',
    default: '{{akikbCorreo}} · {{akikbWsp}} · Oficina {{akikbOficina}}',
  },
];

/** Secciones del formato Moderno que se pueden mostrar u ocultar. */
export const SECCIONES_MODERNO = [
  { key: 'encabezado_contacto', label: 'Contacto en el encabezado' },
  { key: 'cliente', label: 'Datos del cliente' },
  { key: 'ruta', label: 'Origen y destino' },
  { key: 'intro', label: 'Frase de introducción' },
  { key: 'item_servicio', label: 'Fila 1 — servicio' },
  { key: 'item_equipo', label: 'Fila 2 — equipo y personal' },
  { key: 'item_materiales', label: 'Fila 3 — materiales' },
  { key: 'item_inventario', label: 'Fila 4 — inventario' },
  { key: 'total', label: 'Total a pagar' },
  { key: 'acciones', label: 'Lo que haremos' },
  { key: 'pago', label: 'Forma de pago' },
  { key: 'observaciones', label: 'Observaciones' },
  { key: 'pie_transferencia', label: 'Pie — datos de transferencia' },
  { key: 'pie_contacto', label: 'Pie — contacto' },
  { key: 'anexo_inventario', label: 'Hoja anexa de inventario' },
] as const;

export const DEFAULT_TEXTOS: Record<string, string> = Object.fromEntries(
  TEXTO_DEFS.map((t) => [t.key, t.default])
);

export const MATERIAL_KEYS = ['mat_frazadas', 'mat_stretch', 'mat_cintas'];

/** Presets de materiales según tipo de destino. */
export const MATERIALES_BODEGA = ['mat_carton', 'mat_stretch', 'mat_cintas', 'mat_cajas'];
export const MATERIALES_DOMICILIO = ['mat_frazadas', 'mat_stretch', 'mat_cintas'];

export const OBSERVACION_KEYS = ['obs_a', 'obs_b', 'obs_c', 'obs_d', 'obs_e'];
export const ACCION_KEYS = [
  'accion_embalar',
  'accion_cargar',
  'accion_descargar',
  'accion_desembalar',
  'accion_camas',
  'accion_ordenar',
];

/**
 * Presets de acciones según tipo de destino.
 * - Casa / Dpto (domicilio): las 6 acciones, incluidas desembalaje, armado de
 *   camas y ubicación de muebles (ver referencia del cliente).
 * - Bodega: embalar, cargar, descargar y ubicación/orden de muebles;
 *   desembalaje y armado de camas no aplican.
 */
export const ACCIONES_DOMICILIO = [...ACCION_KEYS];
export const ACCIONES_BODEGA = ['accion_embalar', 'accion_cargar', 'accion_descargar', 'accion_ordenar'];

export const TITULO_OPTIONS = [
  'TRASLADO + EMBALAJE',
  'SOLO TRASLADO',
  'TRASLADO + EMBALAJE + BODEGAJE',
];

export const SALUDO_OPTIONS = ['Buenos días', 'Buenas tardes', 'Buenas noches'];

export const TIPO_SERVICIO_OPTIONS = [
  { value: 'express', label: 'Servicio Express' },
  { value: 'principal', label: 'Servicio Principal' },
  { value: 'exclusivo', label: 'Servicio Exclusivo' },
] as const;

export const tipoServicioLabel = (v?: string) =>
  TIPO_SERVICIO_OPTIONS.find((o) => o.value === v)?.label || '';

/**
 * Variantes predefinidas de textos: el admin puede elegir una alternativa
 * desde un selector en vez de escribirla a mano. Soportan las mismas
 * variables {{...}} que los textos por defecto.
 */
export const TEXTO_VARIANTES: Record<string, string[]> = {
  saludo_cuerpo: [
    '{{saludo}}, junto con saludarle le entrego a través de este documento la información de su cotización solicitada a nuestra empresa, los servicios que nosotros le ofrecemos son los siguientes:',
    '{{saludo}}, tengo el agrado de cotizar para Ud. lo siguiente:',
    '{{saludo}}, agradecemos su interés en Trasladarte. A continuación detallamos la propuesta para su servicio:',
  ],
  personal_calificado: [
    'Personal calificado para {{#embalaje}}embalar y {{/embalaje}}cargar en {{tipoOrigen}} origen; descargar, {{#embalaje}}desembalar y {{/embalaje}}ordenar muebles en {{tipoDestino}} destino.',
    'Equipo profesional de mudanzas a cargo de {{#embalaje}}embalar, {{/embalaje}}cargar, transportar y descargar sus muebles con total cuidado.',
    'Nuestro personal se encarga de todo: {{#embalaje}}embalaje, {{/embalaje}}carga, traslado y descarga, dejando cada mueble en su lugar.',
  ],
  accion_embalar: [
    'Se embalará TODOS LOS MUEBLES GRANDES, mencionados anteriormente, en {{tipoOrigen}} origen ({{origenComuna}}).',
    'Embalaje completo de TODOS LOS MUEBLES GRANDES en {{tipoOrigen}} origen ({{origenComuna}}), con materiales de protección incluidos.',
    'Protegeremos con embalaje TODOS LOS MUEBLES GRANDES en {{tipoOrigen}} origen ({{origenComuna}}) antes de la carga.',
  ],
  accion_cargar: [
    'Se cargará TODO lo antes mencionado hacia camión, en {{tipoOrigen}} origen ({{origenComuna}}).',
    'Carga de todo el inventario declarado hacia el camión, en {{tipoOrigen}} origen ({{origenComuna}}).',
    'Nuestro equipo cargará TODO al camión con máximo cuidado, en {{tipoOrigen}} origen ({{origenComuna}}).',
  ],
  accion_descargar: [
    'Se descargará TODO desde camión hacia {{tipoDestino}} destino ({{destinoComuna}}).',
    'Descarga completa desde el camión hacia {{tipoDestino}} destino ({{destinoComuna}}).',
    'Al llegar, descargaremos TODO desde el camión hacia {{tipoDestino}} destino ({{destinoComuna}}).',
  ],
  accion_desembalar: [
    'Desembalaje de TODOS LOS MUEBLES GRANDES, en {{tipoDestino}} destino ({{destinoComuna}}).',
    'Retiro del embalaje de TODOS LOS MUEBLES GRANDES una vez descargados en {{tipoDestino}} destino ({{destinoComuna}}).',
  ],
  accion_camas: [
    'Armado de camas, en {{tipoDestino}} destino ({{destinoComuna}}).',
    'Armado e instalación de las camas desarmadas en origen, en {{tipoDestino}} destino ({{destinoComuna}}).',
  ],
  accion_ordenar: [
    'Ubicación de los muebles de tal manera que quede todo ordenado en {{tipoDestino}} destino ({{destinoComuna}}).',
    'Dejaremos cada mueble en el lugar que Ud. indique, todo ordenado en {{tipoDestino}} destino ({{destinoComuna}}).',
  ],
};
