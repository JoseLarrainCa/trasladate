export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      quote_documents: {
        Row: {
          acciones: string[]
          armado_camas: boolean
          camion: string
          camion_qty: number
          cliente: Json
          con_embalaje: boolean
          con_galeria: boolean
          created_at: string
          created_by: string | null
          cuota1: number
          cuota2: number
          fecha_servicio: string | null
          folio: number
          formato: string
          id: string
          inventario_override: Json
          materiales: string[]
          observaciones: string[]
          personas: number
          precio_calculado: number
          precio_final: number | null
          quote_id: string | null
          recargo_escala: number
          recargo_estac: number
          recargo_otro: number
          recargo_rampa: number
          saludo: string
          sin_iva: boolean
          textos: Json
          titulo_servicio: string
          updated_at: string
        }
        Insert: {
          acciones?: string[]
          armado_camas?: boolean
          camion?: string
          camion_qty?: number
          cliente?: Json
          con_embalaje?: boolean
          con_galeria?: boolean
          created_at?: string
          created_by?: string | null
          cuota1?: number
          cuota2?: number
          fecha_servicio?: string | null
          folio: number
          formato?: string
          id?: string
          inventario_override?: Json
          materiales?: string[]
          observaciones?: string[]
          personas?: number
          precio_calculado?: number
          precio_final?: number | null
          quote_id?: string | null
          recargo_escala?: number
          recargo_estac?: number
          recargo_otro?: number
          recargo_rampa?: number
          saludo?: string
          sin_iva?: boolean
          textos?: Json
          titulo_servicio?: string
          updated_at?: string
        }
        Update: {
          acciones?: string[]
          armado_camas?: boolean
          camion?: string
          camion_qty?: number
          cliente?: Json
          con_embalaje?: boolean
          con_galeria?: boolean
          created_at?: string
          created_by?: string | null
          cuota1?: number
          cuota2?: number
          fecha_servicio?: string | null
          folio?: number
          formato?: string
          id?: string
          inventario_override?: Json
          materiales?: string[]
          observaciones?: string[]
          personas?: number
          precio_calculado?: number
          precio_final?: number | null
          quote_id?: string | null
          recargo_escala?: number
          recargo_estac?: number
          recargo_otro?: number
          recargo_rampa?: number
          saludo?: string
          sin_iva?: boolean
          textos?: Json
          titulo_servicio?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_documents_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_items: {
        Row: {
          category: string
          created_at: string
          id: string
          item_key: string
          item_name: string
          quantity: number
          quote_id: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          item_key: string
          item_name: string
          quantity?: number
          quote_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          item_key?: string
          item_name?: string
          quantity?: number
          quote_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_settings: {
        Row: {
          created_at: string
          empresa: Json
          id: string
          materiales: string[]
          observaciones: string[]
          siguiente_folio: number
          tarifas: Json
          textos: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          empresa?: Json
          id?: string
          materiales?: string[]
          observaciones?: string[]
          siguiente_folio?: number
          tarifas?: Json
          textos?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          empresa?: Json
          id?: string
          materiales?: string[]
          observaciones?: string[]
          siguiente_folio?: number
          tarifas?: Json
          textos?: Json
          updated_at?: string
        }
        Relationships: []
      }
      quotes: {
        Row: {
          celular: string | null
          cliente_apellido: string | null
          cliente_nombre: string
          cliente_razon_social: string | null
          created_at: string
          destino_comuna: string
          destino_direccion: string
          destino_piso: number | null
          destino_tiene_ascensor: boolean
          destino_tipo_vivienda: string
          email: string | null
          estado: string
          excel_import_date: string | null
          fecha_indefinida: boolean
          fecha_traslado: string | null
          id: string
          imported_from_excel: boolean
          notas_internas: string | null
          origen_comuna: string
          origen_direccion: string
          origen_piso: number | null
          origen_tiene_ascensor: boolean
          origen_tipo_vivienda: string
          sugerencia_adicional: string | null
          telefono: string
          tipo_mudanza: string
          updated_at: string
        }
        Insert: {
          celular?: string | null
          cliente_apellido?: string | null
          cliente_nombre: string
          cliente_razon_social?: string | null
          created_at?: string
          destino_comuna: string
          destino_direccion: string
          destino_piso?: number | null
          destino_tiene_ascensor?: boolean
          destino_tipo_vivienda: string
          email?: string | null
          estado?: string
          excel_import_date?: string | null
          fecha_indefinida?: boolean
          fecha_traslado?: string | null
          id?: string
          imported_from_excel?: boolean
          notas_internas?: string | null
          origen_comuna: string
          origen_direccion: string
          origen_piso?: number | null
          origen_tiene_ascensor?: boolean
          origen_tipo_vivienda: string
          sugerencia_adicional?: string | null
          telefono: string
          tipo_mudanza: string
          updated_at?: string
        }
        Update: {
          celular?: string | null
          cliente_apellido?: string | null
          cliente_nombre?: string
          cliente_razon_social?: string | null
          created_at?: string
          destino_comuna?: string
          destino_direccion?: string
          destino_piso?: number | null
          destino_tiene_ascensor?: boolean
          destino_tipo_vivienda?: string
          email?: string | null
          estado?: string
          excel_import_date?: string | null
          fecha_indefinida?: boolean
          fecha_traslado?: string | null
          id?: string
          imported_from_excel?: boolean
          notas_internas?: string | null
          origen_comuna?: string
          origen_direccion?: string
          origen_piso?: number | null
          origen_tiene_ascensor?: boolean
          origen_tipo_vivienda?: string
          sugerencia_adicional?: string | null
          telefono?: string
          tipo_mudanza?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "viewer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "viewer"],
    },
  },
} as const
