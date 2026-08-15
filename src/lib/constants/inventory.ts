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
 * Catálogo final del cotizador Trasladarte — 123 ítems en 8 categorías.
 * Fuente de verdad: planilla oficial (Excel) + overrides solicitados por Marco.
 * TOTAL M³ = suma de todas las categorías (incluye OTROS CLIENTE).
 * M² bodega = TOTAL M³ / 2.5
 */
export const M2_CONVERSION_FACTOR = 2.5;

const RAW_INVENTORY_CATEGORIES: InventoryCategory[] = [
  {
    key: 'living',
    name: 'LIVING',
    items: [
      { key: 'living_alfombras', name: 'Alfombras', category: 'LIVING', m3: 0.2 },
      { key: 'living_mesa_arrimo', name: 'Mesa de arrimo', category: 'LIVING', m3: 0.7 },
      { key: 'living_bar', name: 'Bar Licorero', category: 'LIVING', m3: 1.5 },
      { key: 'living_bergere', name: 'Bergere', category: 'LIVING', m3: 0.9 },
      { key: 'living_biblioteca', name: 'Biblioteca', category: 'LIVING', m3: 2.3 },
      { key: 'living_cuadros', name: 'Cuadros', category: 'LIVING', m3: 0.1 },
      { key: 'living_espejos', name: 'Espejos', category: 'LIVING', m3: 0.1 },
      { key: 'living_futon', name: 'Futón Normal', category: 'LIVING', m3: 1.4 },
      { key: 'living_futon_2_plazas', name: 'Futón 2 plazas', category: 'LIVING', m3: 1.7 },
      { key: 'living_lampara_pie', name: 'Lámpara de pie', category: 'LIVING', m3: 0.7 },
      { key: 'living_lampara_colgante', name: 'Lámpara colgante', category: 'LIVING', m3: 0.4 },
      { key: 'living_lampara_mesa', name: 'Lámpara de mesa', category: 'LIVING', m3: 0.3 },
      { key: 'living_marmol', name: 'Mármol', category: 'LIVING', m3: 0.3 },
      { key: 'living_mesa_lateral_madera', name: 'Mesa lateral (madera)', category: 'LIVING', m3: 0.3 },
      { key: 'living_mesa_lateral_vidrio', name: 'Mesa lateral (vidrio)', category: 'LIVING', m3: 0.3 },
      { key: 'living_mesa_centro_madera', name: 'Mesa de centro (madera)', category: 'LIVING', m3: 0.5 },
      { key: 'living_mesa_centro_vidrio', name: 'Mesa de centro (vidrio)', category: 'LIVING', m3: 0.5 },
      { key: 'living_centro_entretenimiento', name: 'Centro de entretenimiento TV', category: 'LIVING', m3: 2.0 },
      { key: 'living_piano_vertical', name: 'Piano vertical', category: 'LIVING', m3: 2.0 },
      { key: 'living_poltrona', name: 'Poltrona', category: 'LIVING', m3: 0.3 },
      { key: 'living_pouf', name: 'Pouf', category: 'LIVING', m3: 0.3 },
      { key: 'living_rack', name: 'Rack', category: 'LIVING', m3: 0.7 },
      { key: 'living_sitial', name: 'Sitial', category: 'LIVING', m3: 0.3 },
      { key: 'living_sofa_1_cuerpo', name: 'Sofá de 1 cuerpo', category: 'LIVING', m3: 0.5 },
      { key: 'living_sofa_2_cuerpos', name: 'Sofá de 2 cuerpos', category: 'LIVING', m3: 1.2 },
      { key: 'living_sofa_3_cuerpos', name: 'Sofá de 3 cuerpos', category: 'LIVING', m3: 1.8 },
      { key: 'living_sofa_4_cuerpos', name: 'Sofá de 4 cuerpos', category: 'LIVING', m3: 2.0 },
      { key: 'living_sofa_l', name: 'Sofá en L', category: 'LIVING', m3: 3.0 },
      { key: 'living_tv_plana', name: 'TV plana', category: 'LIVING', m3: 0.3 },
      { key: 'living_tv_curva', name: 'TV curva', category: 'LIVING', m3: 0.4 },
      { key: 'living_equipo_sonido', name: 'Equipo de sonido', category: 'LIVING', m3: 0.3 },
      { key: 'living_cortinas', name: 'Cortinas', category: 'LIVING', m3: 0.1 },
    ],
  },
  {
    key: 'cocina',
    name: 'COCINA-COMEDOR',
    items: [
      { key: 'cocina_cava_vinos', name: 'Cava de Vinos', category: 'COCINA-COMEDOR', m3: 0.4 },
      { key: 'cocina_cocina', name: 'Cocina', category: 'COCINA-COMEDOR', m3: 0.6 },
      { key: 'cocina_frigobar', name: 'Frigobar', category: 'COCINA-COMEDOR', m3: 0.4 },
      { key: 'cocina_freezer', name: 'Freezer', category: 'COCINA-COMEDOR', m3: 1.0 },
      { key: 'cocina_horno_electrico', name: 'Horno', category: 'COCINA-COMEDOR', m3: 0.2 },
      { key: 'cocina_lavavajilla', name: 'Lava-vajilla', category: 'COCINA-COMEDOR', m3: 0.6 },
      { key: 'cocina_mesa_madera', name: 'Mesa Comedor Madera', category: 'COCINA-COMEDOR', m3: 1.8 },
      { key: 'cocina_mesa_vidrio', name: 'Mesa Comedor Vidrio', category: 'COCINA-COMEDOR', m3: 1.8 },
      { key: 'cocina_sillas', name: 'Sillas de Comedor', category: 'COCINA-COMEDOR', m3: 0.3 },
      { key: 'cocina_mesa_diario', name: 'Mesa de diario', category: 'COCINA-COMEDOR', m3: 1.2 },
      { key: 'cocina_microondas', name: 'Microondas', category: 'COCINA-COMEDOR', m3: 0.2 },
      { key: 'cocina_muebles', name: 'Muebles de cocina', category: 'COCINA-COMEDOR', m3: 0.5 },
      { key: 'cocina_piso_alto', name: 'Pisos', category: 'COCINA-COMEDOR', m3: 0.2 },
      { key: 'cocina_refri_1_puerta', name: 'Refrigerador 1 puerta', category: 'COCINA-COMEDOR', m3: 1.0 },
      { key: 'cocina_refri_side_by_side', name: 'Refrigerador Side by Side', category: 'COCINA-COMEDOR', m3: 2.0 },
      { key: 'cocina_buffet', name: 'Buffet', category: 'COCINA-COMEDOR', m3: 2.0 },
      { key: 'cocina_vitrina', name: 'Vitrina', category: 'COCINA-COMEDOR', m3: 2.0 },
      { key: 'cocina_congelador_horizontal', name: 'Congelador horizontal', category: 'COCINA-COMEDOR', m3: 1.6 },
    ],
  },
  {
    key: 'dormitorios',
    name: 'DORMITORIOS',
    items: [
      { key: 'dormitorio_banqueta', name: 'Banqueta', category: 'DORMITORIOS', m3: 0.3 },
      { key: 'dormitorio_baul', name: 'Baúl', category: 'DORMITORIOS', m3: 0.5 },
      { key: 'dormitorio_cajoneras', name: 'Cajoneras', category: 'DORMITORIOS', m3: 0.8 },
      { key: 'dormitorio_cama_1_plaza', name: 'Cama 1 Plaza', category: 'DORMITORIOS', m3: 1.0 },
      { key: 'dormitorio_cama_1_5_plazas', name: 'Cama 1.5 Plaza', category: 'DORMITORIOS', m3: 1.5 },
      { key: 'dormitorio_cama_nido', name: 'Cama Nido', category: 'DORMITORIOS', m3: 1.5 },
      { key: 'dormitorio_cama_2_plazas', name: 'Cama 2 Plazas', category: 'DORMITORIOS', m3: 2.0 },
      { key: 'dormitorio_cama_queen', name: 'Cama Queen', category: 'DORMITORIOS', m3: 2.4 },
      { key: 'dormitorio_cama_king', name: 'Cama King', category: 'DORMITORIOS', m3: 2.4 },
      { key: 'dormitorio_cama_super_king', name: 'Cama Super King', category: 'DORMITORIOS', m3: 2.6 },
      { key: 'dormitorio_camarote', name: 'Camarote', category: 'DORMITORIOS', m3: 3.0 },
      { key: 'dormitorio_cheslong', name: 'Cheslong', category: 'DORMITORIOS', m3: 0.3 },
      { key: 'dormitorio_comodas', name: 'Cómodas', category: 'DORMITORIOS', m3: 0.8 },
      { key: 'dormitorio_cuna', name: 'Cuna', category: 'DORMITORIOS', m3: 1.2 },
      { key: 'dormitorio_espejo_joyero', name: 'Espejo joyero', category: 'DORMITORIOS', m3: 0.7 },
      { key: 'dormitorio_espejos', name: 'Espejos', category: 'DORMITORIOS', m3: 0.2 },
      { key: 'dormitorio_estante', name: 'Estante', category: 'DORMITORIOS', m3: 0.3 },
      { key: 'dormitorio_zapatera', name: 'Mueble Zapatera', category: 'DORMITORIOS', m3: 0.5 },
      { key: 'dormitorio_rack_tv', name: 'Rack TV', category: 'DORMITORIOS', m3: 0.5 },
      { key: 'dormitorio_respaldos', name: 'Respaldos de cama', category: 'DORMITORIOS', m3: 0.3 },
      { key: 'dormitorio_ropero', name: 'Ropero', category: 'DORMITORIOS', m3: 1.5 },
      { key: 'dormitorio_veladores', name: 'Veladores', category: 'DORMITORIOS', m3: 0.3 },
    ],
  },
  {
    key: 'oficina',
    name: 'OFICINA / ESCRITORIO',
    items: [
      { key: 'oficina_computador', name: 'Computador', category: 'OFICINA / ESCRITORIO', m3: 0.25 },
      { key: 'oficina_escritorio_madera', name: 'Escritorio Madera', category: 'OFICINA / ESCRITORIO', m3: 1.3 },
      { key: 'oficina_escritorio_vidrio', name: 'Escritorio Vidrio', category: 'OFICINA / ESCRITORIO', m3: 1.3 },
      { key: 'oficina_sillas', name: 'Sillas de Escritorio', category: 'OFICINA / ESCRITORIO', m3: 0.3 },
      { key: 'oficina_impresora', name: 'Impresora', category: 'OFICINA / ESCRITORIO', m3: 0.25 },
      { key: 'oficina_kardex', name: 'Kardex', category: 'OFICINA / ESCRITORIO', m3: 0.35 },
      { key: 'oficina_librero', name: 'Librero', category: 'OFICINA / ESCRITORIO', m3: 0.7 },
    ],
  },
  {
    key: 'bodega',
    name: 'BODEGA',
    items: [
      { key: 'bodega_bicicletas', name: 'Bicicletas', category: 'BODEGA', m3: 0.3 },
      { key: 'bodega_golf', name: 'Bolso de Golf y Palos', category: 'BODEGA', m3: 0.1 },
      { key: 'bodega_escalera_plegable', name: 'Escalera Plegable', category: 'BODEGA', m3: 0.2 },
      { key: 'bodega_escalera', name: 'Escalera', category: 'BODEGA', m3: 0.2 },
      { key: 'bodega_estufa_gas', name: 'Estufa a Gas', category: 'BODEGA', m3: 0.2 },
      { key: 'bodega_estufa_electrica', name: 'Estufa Eléctrica', category: 'BODEGA', m3: 0.2 },
      { key: 'bodega_maletas', name: 'Maletas', category: 'BODEGA', m3: 0.2 },
      { key: 'bodega_ventilador', name: 'Ventilador', category: 'BODEGA', m3: 0.2 },
      { key: 'bodega_cajas', name: 'Cajas de Cartón', category: 'BODEGA', m3: 0.2 },
      { key: 'bodega_cajas_plasticas', name: 'Cajas Plásticas', category: 'BODEGA', m3: 0.2 },
    ],
  },
  {
    key: 'loggia',
    name: 'LOGGIA',
    items: [
      { key: 'loggia_lavadora', name: 'Lavadoras', category: 'LOGGIA', m3: 0.6 },
      { key: 'loggia_secadora', name: 'Secadoras', category: 'LOGGIA', m3: 0.6 },
      { key: 'loggia_repisa_pequena', name: 'Repisa pequeña', category: 'LOGGIA', m3: 0.4 },
      { key: 'loggia_repisa_grande', name: 'Repisa grande', category: 'LOGGIA', m3: 1.0 },
    ],
  },
  {
    key: 'terraza',
    name: 'TERRAZA',
    items: [
      { key: 'terraza_banca', name: 'Banca', category: 'TERRAZA', m3: 0.8 },
      { key: 'terraza_cama_elastica', name: 'Cama Elástica', category: 'TERRAZA', m3: 3.0 },
      { key: 'terraza_casa_nino', name: 'Casa de niño / juguete', category: 'TERRAZA', m3: 3.0 },
      { key: 'terraza_casa_perro_grande', name: 'Casa de Perro Grande', category: 'TERRAZA', m3: 0.6 },
      { key: 'terraza_casa_perro_pequena', name: 'Casa de Perro Pequeña', category: 'TERRAZA', m3: 0.2 },
      { key: 'terraza_escultura', name: 'Escultura Pesada', category: 'TERRAZA', m3: 1.5 },
      { key: 'terraza_maceteros_grandes', name: 'Maceteros grandes', category: 'TERRAZA', m3: 0.4 },
      { key: 'terraza_maceteros_medianos', name: 'Maceteros medianos', category: 'TERRAZA', m3: 0.2 },
      { key: 'terraza_maquina_ejercicios', name: 'Máquina de ejercicios', category: 'TERRAZA', m3: 2.0 },
      { key: 'terraza_quitasol', name: 'Quitasol', category: 'TERRAZA', m3: 0.5 },
      { key: 'terraza_mesa_centro', name: 'Mesa de centro', category: 'TERRAZA', m3: 0.5 },
      { key: 'terraza_mesa_comedor_madera', name: 'Mesa de comedor Madera', category: 'TERRAZA', m3: 1.6 },
      { key: 'terraza_mesa_comedor_vidrio', name: 'Mesa de comedor Vidrio', category: 'TERRAZA', m3: 1.6 },
      { key: 'terraza_sillas_comedor', name: 'Sillas de comedor', category: 'TERRAZA', m3: 0.3 },
      { key: 'terraza_ping_pong', name: 'Mesa de Ping Pong', category: 'TERRAZA', m3: 1.0 },
      { key: 'terraza_parrilla', name: 'Parrilla', category: 'TERRAZA', m3: 1.0 },
      { key: 'terraza_reposera', name: 'Reposera', category: 'TERRAZA', m3: 0.5 },
      { key: 'terraza_silla_colgante', name: 'Silla colgante', category: 'TERRAZA', m3: 1.5 },
      { key: 'terraza_mimbre_1', name: 'Sillón de 1 cuerpo', category: 'TERRAZA', m3: 0.6 },
      { key: 'terraza_mimbre_2', name: 'Sillón de 2 cuerpos', category: 'TERRAZA', m3: 1.0 },
      { key: 'terraza_mimbre_3', name: 'Sillón de 3 cuerpos', category: 'TERRAZA', m3: 1.5 },
      { key: 'terraza_sofa', name: 'Sofá Terraza', category: 'TERRAZA', m3: 0.5 },
      { key: 'terraza_taca_taca', name: 'Taca Taca', category: 'TERRAZA', m3: 0.8 },
      { key: 'terraza_toldo', name: 'Toldo plegable', category: 'TERRAZA', m3: 0.3 },
      { key: 'terraza_mesa_mimbre', name: 'Mesa de mimbre', category: 'TERRAZA', m3: 1.6 },
    ],
  },
  {
    key: 'otros',
    name: 'OTROS CLIENTE',
    items: [
      { key: 'otros_biombo', name: 'Biombo', category: 'OTROS CLIENTE', m3: 0.3 },
      { key: 'otros_spinning', name: 'Bicicleta Spinning', category: 'OTROS CLIENTE', m3: 0.4 },
      { key: 'otros_eliptica', name: 'Elíptica', category: 'OTROS CLIENTE', m3: 0.4 },
      { key: 'otros_guitarra_teclado', name: 'Guitarra / Teclado Eléctrico', category: 'OTROS CLIENTE', m3: 0.2 },
      { key: 'otros_trotadora', name: 'Trotadora', category: 'OTROS CLIENTE', m3: 1.0 },
    ],
  },
];

/** Ítems ordenados alfabéticamente dentro de cada categoría (es-CL) */
export const INVENTORY_CATEGORIES: InventoryCategory[] = RAW_INVENTORY_CATEGORIES.map((cat) => ({
  ...cat,
  items: [...cat.items].sort((a, b) =>
    a.name.localeCompare(b.name, 'es', { sensitivity: 'base', numeric: true })
  ),
}));


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
