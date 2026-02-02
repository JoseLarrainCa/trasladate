export const VIVIENDA_OPTIONS = [
  { value: 'departamento', label: 'Departamento' },
  { value: 'casa-1', label: 'Casa 1 piso' },
  { value: 'casa-2', label: 'Casa 2+ pisos' },
  { value: 'oficina', label: 'Oficina' },
  { value: 'bodega', label: 'Bodega' },
] as const;

export const MUDANZA_OPTIONS = [
  { value: 'hogar', label: 'Mudanza del Hogar' },
  { value: 'oficina', label: 'Mudanza de Oficina' },
  { value: 'especial', label: 'Traslado Especial' },
] as const;

export const getViviendaLabel = (value: string) => 
  VIVIENDA_OPTIONS.find(opt => opt.value === value)?.label || value;

export const getMudanzaLabel = (value: string) => 
  MUDANZA_OPTIONS.find(opt => opt.value === value)?.label || value;
