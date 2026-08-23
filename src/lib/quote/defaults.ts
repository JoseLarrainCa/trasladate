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
  group: 'Frases' | 'Materiales' | 'Acciones' | 'Observaciones' | 'Pago' | 'Tabla';
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
  { key: 'mat_frazadas', label: 'Material 1', group: 'Materiales', default: 'Frazadas o Mantas para proteger MUEBLES GRANDES' },
  { key: 'mat_stretch', label: 'Material 2', group: 'Materiales', default: 'Stretch Film' },
  { key: 'mat_cintas', label: 'Material 3', group: 'Materiales', default: 'Cintas de embalaje' },
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
];

export const DEFAULT_TEXTOS: Record<string, string> = Object.fromEntries(
  TEXTO_DEFS.map((t) => [t.key, t.default])
);

export const MATERIAL_KEYS = ['mat_frazadas', 'mat_stretch', 'mat_cintas'];
export const OBSERVACION_KEYS = ['obs_a', 'obs_b', 'obs_c', 'obs_d', 'obs_e'];
export const ACCION_KEYS = [
  'accion_embalar',
  'accion_cargar',
  'accion_descargar',
  'accion_desembalar',
  'accion_camas',
  'accion_ordenar',
];

export const TITULO_OPTIONS = [
  'TRASLADO + EMBALAJE',
  'SOLO TRASLADO',
  'TRASLADO + EMBALAJE + BODEGAJE',
];

export const SALUDO_OPTIONS = ['Buenos días', 'Buenas tardes', 'Buenas noches'];
