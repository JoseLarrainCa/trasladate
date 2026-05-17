export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type QuoteStatus = 
  | 'pendiente' 
  | 'contactado' 
  | 'cotizado' 
  | 'confirmado' 
  | 'completado' 
  | 'cancelado';

export type MudanzaType = 'hogar' | 'oficina' | 'especial';

export type ViviendaType = 
  | 'departamento' 
  | 'casa-1' 
  | 'casa-2' 
  | 'oficina' 
  | 'bodega';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string | null;
          email: string;
          full_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          email: string;
          full_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          email?: string;
          full_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role: 'admin' | 'viewer';
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: 'admin' | 'viewer';
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: 'admin' | 'viewer';
          created_at?: string;
        };
      };
      quotes: {
        Row: {
          id: string;
          // Cliente
          cliente_nombre: string;
          cliente_apellido: string | null;
          cliente_razon_social: string | null;
          telefono: string;
          celular: string | null;
          email: string | null;
          // Origen
          origen_direccion: string;
          origen_comuna: string;
          origen_tipo_vivienda: ViviendaType;
          origen_tiene_ascensor: boolean;
          origen_piso: number | null;
          // Destino
          destino_direccion: string;
          destino_comuna: string;
          destino_tipo_vivienda: ViviendaType;
          destino_tiene_ascensor: boolean;
          destino_piso: number | null;
          // Detalles
          tipo_mudanza: MudanzaType;
          fecha_traslado: string | null;
          fecha_indefinida: boolean;
          sugerencia_adicional: string | null;
          // Metadatos
          estado: QuoteStatus;
          notas_internas: string | null;
          created_at: string;
          updated_at: string;
          imported_from_excel: boolean;
          excel_import_date: string | null;
        };
        Insert: {
          id?: string;
          cliente_nombre: string;
          cliente_apellido?: string | null;
          cliente_razon_social?: string | null;
          telefono: string;
          celular?: string | null;
          email?: string | null;
          origen_direccion: string;
          origen_comuna: string;
          origen_tipo_vivienda: ViviendaType;
          origen_tiene_ascensor?: boolean;
          origen_piso?: number | null;
          destino_direccion: string;
          destino_comuna: string;
          destino_tipo_vivienda: ViviendaType;
          destino_tiene_ascensor?: boolean;
          destino_piso?: number | null;
          tipo_mudanza: MudanzaType;
          fecha_traslado?: string | null;
          fecha_indefinida?: boolean;
          sugerencia_adicional?: string | null;
          estado?: QuoteStatus;
          notas_internas?: string | null;
          created_at?: string;
          updated_at?: string;
          imported_from_excel?: boolean;
          excel_import_date?: string | null;
        };
        Update: {
          id?: string;
          cliente_nombre?: string;
          cliente_apellido?: string | null;
          cliente_razon_social?: string | null;
          telefono?: string;
          celular?: string | null;
          email?: string | null;
          origen_direccion?: string;
          origen_comuna?: string;
          origen_tipo_vivienda?: ViviendaType;
          origen_tiene_ascensor?: boolean;
          origen_piso?: number | null;
          destino_direccion?: string;
          destino_comuna?: string;
          destino_tipo_vivienda?: ViviendaType;
          destino_tiene_ascensor?: boolean;
          destino_piso?: number | null;
          tipo_mudanza?: MudanzaType;
          fecha_traslado?: string | null;
          fecha_indefinida?: boolean;
          sugerencia_adicional?: string | null;
          estado?: QuoteStatus;
          notas_internas?: string | null;
          created_at?: string;
          updated_at?: string;
          imported_from_excel?: boolean;
          excel_import_date?: string | null;
        };
      };
      quote_items: {
        Row: {
          id: string;
          quote_id: string;
          item_key: string;
          item_name: string;
          category: string;
          quantity: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          quote_id: string;
          item_key: string;
          item_name: string;
          category: string;
          quantity: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          quote_id?: string;
          item_key?: string;
          item_name?: string;
          category?: string;
          quantity?: number;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

// Helper types
export type Quote = Database['public']['Tables']['quotes']['Row'];
export type QuoteInsert = Database['public']['Tables']['quotes']['Insert'];
export type QuoteUpdate = Database['public']['Tables']['quotes']['Update'];

export type QuoteItem = Database['public']['Tables']['quote_items']['Row'];
export type QuoteItemInsert = Database['public']['Tables']['quote_items']['Insert'];

export type Profile = Database['public']['Tables']['profiles']['Row'];

// Extended quote with items
export interface QuoteWithItems extends Quote {
  quote_items: QuoteItem[];
}
