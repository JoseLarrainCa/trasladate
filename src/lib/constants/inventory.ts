export interface InventoryItem {
  key: string;
  name: string;
  category: string;
}

export interface InventoryCategory {
  key: string;
  name: string;
  items: InventoryItem[];
}

export const INVENTORY_CATEGORIES: InventoryCategory[] = [
  {
    key: 'living',
    name: 'LIVING',
    items: [
      { key: 'living_mesa_arrimo', name: 'Mesa de arrimo', category: 'LIVING' },
      { key: 'living_sofa_l', name: 'Sofá en L', category: 'LIVING' },
      { key: 'living_sofa_3_cuerpos', name: 'Sofá de 3 cuerpos', category: 'LIVING' },
      { key: 'living_sofa_2_cuerpos', name: 'Sofá de 2 cuerpos', category: 'LIVING' },
      { key: 'living_sofa_1_cuerpo', name: 'Sofá de 1 cuerpo', category: 'LIVING' },
      { key: 'living_sitial', name: 'Sitial', category: 'LIVING' },
      { key: 'living_futon', name: 'Futón', category: 'LIVING' },
      { key: 'living_mesita_centro', name: 'Mesita de centro', category: 'LIVING' },
      { key: 'living_mesita_lateral', name: 'Mesita lateral', category: 'LIVING' },
      { key: 'living_poltrona', name: 'Poltrona', category: 'LIVING' },
      { key: 'living_rack', name: 'Rack', category: 'LIVING' },
      { key: 'living_centro_entretenimiento', name: 'Centro de entretenimiento o buffet', category: 'LIVING' },
      { key: 'living_licorera', name: 'Licorera', category: 'LIVING' },
      { key: 'living_bar', name: 'Bar', category: 'LIVING' },
      { key: 'living_tv_50', name: 'Televisor 50"', category: 'LIVING' },
      { key: 'living_tv_48', name: 'Televisor 48"', category: 'LIVING' },
      { key: 'living_tv_42', name: 'Televisor 42"', category: 'LIVING' },
      { key: 'living_tv_36', name: 'Televisor 36"', category: 'LIVING' },
      { key: 'living_tv_32', name: 'Televisor 32"', category: 'LIVING' },
      { key: 'living_equipo_sonido', name: 'Equipo de sonido', category: 'LIVING' },
      { key: 'living_cortinas', name: 'Cortinas', category: 'LIVING' },
      { key: 'living_lamparas', name: 'Lámparas', category: 'LIVING' },
      { key: 'living_alfombras', name: 'Alfombras', category: 'LIVING' },
      { key: 'living_cuadros', name: 'Cuadros', category: 'LIVING' },
      { key: 'living_marmol', name: 'Mármol', category: 'LIVING' },
      { key: 'living_piano_vertical', name: 'Piano vertical', category: 'LIVING' },
      { key: 'living_piano_cola', name: 'Piano de cola', category: 'LIVING' },
      { key: 'living_espejos', name: 'Espejos', category: 'LIVING' },
    ],
  },
  {
    key: 'cocina',
    name: 'COCINA-COMEDOR',
    items: [
      { key: 'cocina_mesa_madera', name: 'Mesa de comedor - madera', category: 'COCINA-COMEDOR' },
      { key: 'cocina_mesa_vidrio', name: 'Mesa de comedor - vidrio', category: 'COCINA-COMEDOR' },
      { key: 'cocina_sillas', name: 'Sillas de comedor', category: 'COCINA-COMEDOR' },
      { key: 'cocina_cocina', name: 'Cocina', category: 'COCINA-COMEDOR' },
      { key: 'cocina_lavavajilla', name: 'Lava-vajilla', category: 'COCINA-COMEDOR' },
      { key: 'cocina_microondas', name: 'Microondas', category: 'COCINA-COMEDOR' },
      { key: 'cocina_muebles', name: 'Muebles de cocina', category: 'COCINA-COMEDOR' },
      { key: 'cocina_refri_1_puerta', name: 'Refrigerador (01 Puerta)', category: 'COCINA-COMEDOR' },
      { key: 'cocina_refri_side_by_side', name: 'Refrigerador Side by Side (02 puertas)', category: 'COCINA-COMEDOR' },
      { key: 'cocina_freezer', name: 'Freezer', category: 'COCINA-COMEDOR' },
    ],
  },
  {
    key: 'loggia',
    name: 'LOGGIA',
    items: [
      { key: 'loggia_lavadora', name: 'Lavadoras', category: 'LOGGIA' },
      { key: 'loggia_secadora', name: 'Secadoras', category: 'LOGGIA' },
    ],
  },
  {
    key: 'oficina',
    name: 'OFICINA',
    items: [
      { key: 'oficina_kardex', name: 'Kardex', category: 'OFICINA' },
      { key: 'oficina_escritorio', name: 'Escritorio', category: 'OFICINA' },
      { key: 'oficina_sillas', name: 'Sillas de escritorio', category: 'OFICINA' },
      { key: 'oficina_computador', name: 'Computador', category: 'OFICINA' },
      { key: 'oficina_impresora', name: 'Impresora', category: 'OFICINA' },
      { key: 'oficina_librero', name: 'Librero', category: 'OFICINA' },
    ],
  },
  {
    key: 'terraza',
    name: 'TERRAZA',
    items: [
      { key: 'terraza_parrilla', name: 'Parrilla', category: 'TERRAZA' },
      { key: 'terraza_mimbre_3', name: 'Sillón de mimbre 3 cuerpos', category: 'TERRAZA' },
      { key: 'terraza_mimbre_2', name: 'Sillón de mimbre 2 cuerpos', category: 'TERRAZA' },
      { key: 'terraza_mimbre_1', name: 'Sillón de mimbre 1 cuerpo', category: 'TERRAZA' },
      { key: 'terraza_mesa_mimbre', name: 'Mesa de mimbre', category: 'TERRAZA' },
      { key: 'terraza_taca_taca', name: 'Mesa de taca taca', category: 'TERRAZA' },
      { key: 'terraza_ping_pong', name: 'Mesa de ping pong', category: 'TERRAZA' },
    ],
  },
  {
    key: 'dormitorios',
    name: 'DORMITORIOS',
    items: [
      { key: 'dormitorio_cama_1_plaza', name: 'Cama 1 plaza', category: 'DORMITORIOS' },
      { key: 'dormitorio_camarote', name: 'Camarote', category: 'DORMITORIOS' },
      { key: 'dormitorio_cama_nido', name: 'Cama nido', category: 'DORMITORIOS' },
      { key: 'dormitorio_cuna', name: 'Cuna', category: 'DORMITORIOS' },
      { key: 'dormitorio_veladores', name: 'Veladores', category: 'DORMITORIOS' },
      { key: 'dormitorio_cajoneras', name: 'Cajoneras', category: 'DORMITORIOS' },
      { key: 'dormitorio_comodas', name: 'Cómodas', category: 'DORMITORIOS' },
      { key: 'dormitorio_ropero', name: 'Ropero', category: 'DORMITORIOS' },
      { key: 'dormitorio_baul', name: 'Baúl', category: 'DORMITORIOS' },
      { key: 'dormitorio_espejos', name: 'Espejos', category: 'DORMITORIOS' },
      { key: 'dormitorio_alfombras', name: 'Alfombras', category: 'DORMITORIOS' },
      { key: 'dormitorio_cama_king', name: 'Cama King - Base Dividida', category: 'DORMITORIOS' },
      { key: 'dormitorio_cama_queen', name: 'Cama Queen - Base Dividida', category: 'DORMITORIOS' },
      { key: 'dormitorio_cama_2_plazas', name: 'Cama 2 plazas - Base Dividida', category: 'DORMITORIOS' },
      { key: 'dormitorio_cama_1_5_plazas', name: 'Cama 1.5 plazas', category: 'DORMITORIOS' },
    ],
  },
  {
    key: 'bodega',
    name: 'BODEGA',
    items: [
      { key: 'bodega_bicicletas', name: 'Bicicletas', category: 'BODEGA' },
      { key: 'bodega_cajas', name: 'Cajas en bodega', category: 'BODEGA' },
      { key: 'bodega_muebles', name: 'Muebles', category: 'BODEGA' },
    ],
  },
  {
    key: 'otros',
    name: 'OTROS',
    items: [
      { key: 'otros_1', name: 'Otro item 1', category: 'OTROS' },
      { key: 'otros_2', name: 'Otro item 2', category: 'OTROS' },
      { key: 'otros_3', name: 'Otro item 3', category: 'OTROS' },
    ],
  },
];

// Flat list of all items for easy lookup
export const ALL_INVENTORY_ITEMS = INVENTORY_CATEGORIES.flatMap(cat => cat.items);

// Get item by key
export const getInventoryItem = (key: string) => ALL_INVENTORY_ITEMS.find(item => item.key === key);
