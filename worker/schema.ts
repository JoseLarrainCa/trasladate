// Qué tablas y columnas puede tocar el panel de Trasladarte a través de /api/db.
//
// Es una lista cerrada a propósito: el nombre de una tabla o de una columna nunca
// viene "tal cual" del navegador al SQL, siempre pasa por acá primero. Lo que no
// está en esta lista se rechaza con un error claro (no se descarta en silencio).
// `users` y `login_attempts` NO están: las claves solo se tocan por /api/auth.

export type Tipo = "text" | "int" | "real" | "bool" | "json";

export interface Tabla {
  columnas: Record<string, Tipo>;
  /** Columna que el Worker rellena con la hora actual en cada UPDATE. */
  actualizaEn?: string;
  /** Tablas hijas que se pueden pedir embebidas: nombre -> columna que apunta al padre. */
  hijas?: Record<string, string>;
}

export const TABLAS: Record<string, Tabla> = {
  quotes: {
    columnas: {
      id: "text",
      cliente_nombre: "text",
      cliente_apellido: "text",
      cliente_razon_social: "text",
      telefono: "text",
      celular: "text",
      email: "text",
      origen_direccion: "text",
      origen_comuna: "text",
      origen_tipo_vivienda: "text",
      origen_tiene_ascensor: "bool",
      origen_piso: "int",
      destino_direccion: "text",
      destino_comuna: "text",
      destino_tipo_vivienda: "text",
      destino_tiene_ascensor: "bool",
      destino_piso: "int",
      tipo_mudanza: "text",
      fecha_traslado: "text",
      fecha_indefinida: "bool",
      sugerencia_adicional: "text",
      estado: "text",
      notas_internas: "text",
      imported_from_excel: "bool",
      excel_import_date: "text",
      created_at: "text",
      updated_at: "text",
    },
    actualizaEn: "updated_at",
    hijas: { quote_items: "quote_id" },
  },
  quote_items: {
    columnas: {
      id: "text",
      quote_id: "text",
      item_key: "text",
      item_name: "text",
      category: "text",
      quantity: "int",
      created_at: "text",
    },
  },
  contactos: {
    columnas: {
      id: "text",
      nombre: "text",
      telefono: "text",
      email: "text",
      servicio: "text",
      comuna: "text",
      mensaje: "text",
      origen: "text",
      atendido: "bool",
      created_at: "text",
    },
  },
  quote_settings: {
    columnas: {
      id: "text",
      tarifas: "json",
      textos: "json",
      empresa: "json",
      materiales: "json",
      observaciones: "json",
      siguiente_folio: "int",
      created_at: "text",
      updated_at: "text",
    },
    actualizaEn: "updated_at",
  },
  quote_documents: {
    columnas: {
      id: "text",
      quote_id: "text",
      folio: "int",
      formato: "text",
      fecha_servicio: "text",
      titulo_servicio: "text",
      saludo: "text",
      tipo_servicio: "text",
      cliente: "json",
      camion: "text",
      camion_qty: "int",
      personas: "int",
      con_embalaje: "bool",
      armado_camas: "bool",
      sin_iva: "bool",
      con_galeria: "bool",
      cuota1: "int",
      cuota2: "int",
      recargo_escala: "int",
      recargo_rampa: "int",
      recargo_estac: "int",
      recargo_otro: "int",
      precio_calculado: "int",
      precio_final: "int",
      textos: "json",
      materiales: "json",
      observaciones: "json",
      acciones: "json",
      inventario_override: "json",
      created_at: "text",
      updated_at: "text",
      created_by: "text",
    },
    actualizaEn: "updated_at",
  },
  web_service_texts: {
    columnas: { id: "text", servicios: "json", updated_at: "text" },
    actualizaEn: "updated_at",
  },
  profiles: {
    columnas: {
      id: "text",
      user_id: "text",
      email: "text",
      full_name: "text",
      created_at: "text",
      updated_at: "text",
    },
    actualizaEn: "updated_at",
  },
};
