export interface InventoryItem {
  key: string;
  name: string;
  category: string;
  /** Volumen unitario en m³ según planilla oficial Trasladarte */
  m3: number;
}

export interface InventoryCategory {
  key: string;
  name: string;
  items: InventoryItem[];
}

/**
 * Valores m³ tomados directamente de la planilla oficial Trasladarte
 * (Planilla_Trasladarte_JEM_1.xlsx). El total m² para bodega se calcula
 * como: TOTAL_M3 / 2.5
 */
export const M2_CONVERSION_FACTOR = 2.5;

export const INVENTORY_CATEGORIES: InventoryCategory[] = [
  {
    key: 'living',
    name: 'LIVING',
    items: [
      { key: 'living_mesa_arrimo', name: 'Mesa de arrimo', category: 'LIVING', m3: 0.7 },
      { key: 'living_sofa_l', name: 'Sofá en L', category: 'LIVING', m3: 3.0 },
      { key: 'living_sofa_3_cuerpos', name: 'Sofá de 3 cuerpos', category: 'LIVING', m3: 1.8 },
      { key: 'living_sofa_2_cuerpos', name: 'Sofá de 2 cuerpos', category: 'LIVING', m3: 1.2 },
      { key: 'living_sofa_1_cuerpo', name: 'Sofá de 1 cuerpo', category: 'LIVING', m3: 0.5 },
      { key: 'living_sitial', name: 'Sitial', category: 'LIVING', m3: 0.3 },
      { key: 'living_futon', name: 'Futón', category: 'LIVING', m3: 1.4 },
      { key: 'living_mesita_centro', name: 'Mesita de centro', category: 'LIVING', m3: 0.5 },
      { key: 'living_mesita_lateral', name: 'Mesita lateral', category: 'LIVING', m3: 0.3 },
      { key: 'living_poltrona', name: 'Poltrona', category: 'LIVING', m3: 0.3 },
      { key: 'living_rack', name: 'Rack', category: 'LIVING', m3: 0.7 },
      { key: 'living_centro_entretenimiento', name: 'Centro de entretenimiento o buffet', category: 'LIVING', m3: 2.0 },
      { key: 'living_licorera', name: 'Licorera', category: 'LIVING', m3: 1.5 },
      { key: 'living_bar', name: 'Bar', category: 'LIVING', m3: 1.5 },
      { key: 'living_tv_50', name: 'Televisor 50"', category: 'LIVING', m3: 0.3 },
      { key: 'living_tv_48', name: 'Televisor 48"', category: 'LIVING', m3: 0.3 },
      { key: 'living_tv_42', name: 'Televisor 42"', category: 'LIVING', m3: 0.3 },
      { key: 'living_tv_36', name: 'Televisor 36"', category: 'LIVING', m3: 0.3 },
      { key: 'living_tv_32', name: 'Televisor 32"', category: 'LIVING', m3: 0.3 },
      { key: 'living_equipo_sonido', name: 'Equipo de sonido', category: 'LIVING', m3: 0.3 },
      { key: 'living_cortinas', name: 'Cortinas', category: 'LIVING', m3: 0.1 },
      { key: 'living_lamparas', name: 'Lámparas', category: 'LIVING', m3: 0.3 },
      { key: 'living_alfombras', name: 'Alfombras', category: 'LIVING', m3: 0.2 },
      { key: 'living_cuadros', name: 'Cuadros', category: 'LIVING', m3: 0.1 },
      { key: 'living_marmol', name: 'Mármol', category: 'LIVING', m3: 0.3 },
      { key: 'living_piano_vertical', name: 'Piano vertical', category: 'LIVING', m3: 2.0 },
      { key: 'living_piano_cola', name: 'Piano de cola', category: 'LIVING', m3: 3.5 },
      { key: 'living_espejos', name: 'Espejos', category: 'LIVING', m3: 0.1 },
    ],
  },
  {
    key: 'cocina',
    name: 'COCINA-COMEDOR',
    items: [
      { key: 'cocina_mesa_madera', name: 'Mesa de comedor - madera', category: 'COCINA-COMEDOR', m3: 1.8 },
      { key: 'cocina_mesa_vidrio', name: 'Mesa de comedor - vidrio', category: 'COCINA-COMEDOR', m3: 1.8 },
      { key: 'cocina_sillas', name: 'Sillas de comedor', category: 'COCINA-COMEDOR', m3: 0.3 },
      { key: 'cocina_cocina', name: 'Cocina', category: 'COCINA-COMEDOR', m3: 0.6 },
      { key: 'cocina_lavavajilla', name: 'Lava-vajilla', category: 'COCINA-COMEDOR', m3: 0.6 },
      { key: 'cocina_microondas', name: 'Microondas', category: 'COCINA-COMEDOR', m3: 0.2 },
      { key: 'cocina_muebles', name: 'Muebles de cocina', category: 'COCINA-COMEDOR', m3: 0.5 },
      { key: 'cocina_refri_1_puerta', name: 'Refrigerador (01 Puerta)', category: 'COCINA-COMEDOR', m3: 1.0 },
      { key: 'cocina_refri_side_by_side', name: 'Refrigerador Side by Side (02 puertas)', category: 'COCINA-COMEDOR', m3: 2.0 },
      { key: 'cocina_freezer', name: 'Freezer', category: 'COCINA-COMEDOR', m3: 1.0 },
    ],
  },
  {
    key: 'loggia',
    name: 'LOGGIA',
    items: [
      { key: 'loggia_lavadora', name: 'Lavadoras', category: 'LOGGIA', m3: 0.6 },
      { key: 'loggia_secadora', name: 'Secadoras', category: 'LOGGIA', m3: 0.6 },
    ],
  },
  {
    key: 'oficina',
    name: 'OFICINA',
    items: [
      { key: 'oficina_kardex', name: 'Kardex', category: 'OFICINA', m3: 0.35 },
      { key: 'oficina_escritorio', name: 'Escritorio', category: 'OFICINA', m3: 1.3 },
      { key: 'oficina_sillas', name: 'Sillas de escritorio', category: 'OFICINA', m3: 0.3 },
      { key: 'oficina_computador', name: 'Computador', category: 'OFICINA', m3: 0.25 },
      { key: 'oficina_impresora', name: 'Impresora', category: 'OFICINA', m3: 0.25 },
      { key: 'oficina_librero', name: 'Librero', category: 'OFICINA', m3: 0.7 },
    ],
  },
  {
    key: 'terraza',
    name: 'TERRAZA',
    items: [
      { key: 'terraza_parrilla', name: 'Parrilla', category: 'TERRAZA', m3: 1.0 },
      { key: 'terraza_mimbre_3', name: 'Sillón de mimbre 3 cuerpos', category: 'TERRAZA', m3: 1.5 },
      { key: 'terraza_mimbre_2', name: 'Sillón de mimbre 2 cuerpos', category: 'TERRAZA', m3: 1.0 },
      { key: 'terraza_mimbre_1', name: 'Sillón de mimbre 1 cuerpo', category: 'TERRAZA', m3: 0.6 },
      { key: 'terraza_mesa_mimbre', name: 'Mesa de mimbre', category: 'TERRAZA', m3: 1.6 },
      { key: 'terraza_taca_taca', name: 'Mesa de taca taca', category: 'TERRAZA', m3: 0.8 },
      { key: 'terraza_ping_pong', name: 'Mesa de ping pong', category: 'TERRAZA', m3: 1.0 },
    ],
  },
  {
    key: 'dormitorios',
    name: 'DORMITORIOS',
    items: [
      { key: 'dormitorio_cama_1_plaza', name: 'Cama 1 plaza (incluye colchón)', category: 'DORMITORIOS', m3: 1.0 },
      { key: 'dormitorio_cama_1_5_plazas', name: 'Cama 1½ plaza (incluye colchón)', category: 'DORMITORIOS', m3: 1.5 },
      { key: 'dormitorio_cama_nido', name: 'Cama Nido (incluye colchón)', category: 'DORMITORIOS', m3: 1.5 },
      { key: 'dormitorio_cama_2_plazas', name: 'Cama 2 plazas (incluye colchón)', category: 'DORMITORIOS', m3: 2.0 },
      { key: 'dormitorio_cama_queen', name: 'Cama Queen (incluye colchón)', category: 'DORMITORIOS', m3: 2.4 },
      { key: 'dormitorio_cama_king', name: 'Cama King (incluye colchón)', category: 'DORMITORIOS', m3: 2.4 },
      { key: 'dormitorio_cama_super_king', name: 'Cama Super King (incluye colchón)', category: 'DORMITORIOS', m3: 3.0 },
      { key: 'dormitorio_camarote', name: 'Camarote', category: 'DORMITORIOS', m3: 3.0 },
      { key: 'dormitorio_cuna', name: 'Cuna', category: 'DORMITORIOS', m3: 1.2 },
      { key: 'dormitorio_veladores', name: 'Veladores', category: 'DORMITORIOS', m3: 0.3 },
      { key: 'dormitorio_cajoneras', name: 'Cajoneras', category: 'DORMITORIOS', m3: 0.8 },
      { key: 'dormitorio_comodas', name: 'Cómodas', category: 'DORMITORIOS', m3: 0.8 },
      { key: 'dormitorio_ropero', name: 'Ropero', category: 'DORMITORIOS', m3: 1.5 },
      { key: 'dormitorio_baul', name: 'Baúl', category: 'DORMITORIOS', m3: 0.5 },
      { key: 'dormitorio_espejos', name: 'Espejos', category: 'DORMITORIOS', m3: 0.2 },
      { key: 'dormitorio_alfombras', name: 'Alfombras', category: 'DORMITORIOS', m3: 0.2 },
    ],
  },
  {
    key: 'bodega',
    name: 'BODEGA',
    items: [
      { key: 'bodega_bicicletas', name: 'Bicicletas', category: 'BODEGA', m3: 0.3 },
      { key: 'bodega_cajas', name: 'Cajas en bodega', category: 'BODEGA', m3: 0.2 },
      { key: 'bodega_muebles', name: 'Muebles', category: 'BODEGA', m3: 0.5 },
    ],
  },
  {
    key: 'otros',
    name: 'OTROS',
    items: [],
  },
];

// Flat list of all items for easy lookup
export const ALL_INVENTORY_ITEMS = INVENTORY_CATEGORIES.flatMap(cat => cat.items);

// Get item by key
export const getInventoryItem = (key: string) => ALL_INVENTORY_ITEMS.find(item => item.key === key);

/** Calcula m³ totales a partir de un mapa {item_key: cantidad} */
export const calculateTotalM3 = (inventory: Record<string, number>): number => {
  return Object.entries(inventory).reduce((total, [key, qty]) => {
    const item = getInventoryItem(key);
    return total + (item ? item.m3 * qty : 0);
  }, 0);
};

/** Convierte m³ a m² estimados para bodega (factor planilla: 2.5) */
export const m3ToM2 = (m3: number): number => m3 / M2_CONVERSION_FACTOR;
