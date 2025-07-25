export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      audit_logs: {
        Row: {
          id: string
          table_name: string
          record_id: string
          action: string
          old_data: Json | null
          new_data: Json | null
          changed_fields: string[] | null
          user_id: string | null
          user_email: string | null
          user_role: string | null
          ip_address: string | null
          user_agent: string | null
          timestamp: string
        }
        Insert: {
          id?: string
          table_name: string
          record_id: string
          action: string
          old_data?: Json | null
          new_data?: Json | null
          changed_fields?: string[] | null
          user_id?: string | null
          user_email?: string | null
          user_role?: string | null
          ip_address?: string | null
          user_agent?: string | null
          timestamp?: string
        }
        Update: {
          id?: string
          table_name?: string
          record_id?: string
          action?: string
          old_data?: Json | null
          new_data?: Json | null
          changed_fields?: string[] | null
          user_id?: string | null
          user_email?: string | null
          user_role?: string | null
          ip_address?: string | null
          user_agent?: string | null
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      car_client_links: {
        Row: {
          id: string
          car_id: string
          client_id: string
          link_type: string
          link_date: string
          delivery_date: string | null
          delivery_notes: string | null
          sale_price: number | null
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          car_id: string
          client_id: string
          link_type: string
          link_date?: string
          delivery_date?: string | null
          delivery_notes?: string | null
          sale_price?: number | null
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          car_id?: string
          client_id?: string
          link_type?: string
          link_date?: string
          delivery_date?: string | null
          delivery_notes?: string | null
          sale_price?: number | null
          created_at?: string
          created_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "car_client_links_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "car_client_links_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "car_client_links_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      car_movements: {
        Row: {
          id: string
          car_id: string
          from_location: Database["public"]["Enums"]["car_location"] | null
          to_location: Database["public"]["Enums"]["car_location"]
          movement_date: string
          reason: string | null
          notes: string | null
          moved_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          car_id: string
          from_location?: Database["public"]["Enums"]["car_location"] | null
          to_location: Database["public"]["Enums"]["car_location"]
          movement_date?: string
          reason?: string | null
          notes?: string | null
          moved_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          car_id?: string
          from_location?: Database["public"]["Enums"]["car_location"] | null
          to_location?: Database["public"]["Enums"]["car_location"]
          movement_date?: string
          reason?: string | null
          notes?: string | null
          moved_by?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "car_movements_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "car_movements_moved_by_fkey"
            columns: ["moved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      cars: {
        Row: {
          id: string
          vin_number: string
          model: string
          brand: string
          year: number
          color: string
          category: Database["public"]["Enums"]["car_category"]
          status: Database["public"]["Enums"]["car_status"]
          current_location: Database["public"]["Enums"]["car_location"]
          purchase_price: number | null
          selling_price: number
          battery_percentage: number | null
          range_km: number | null
          horse_power: number | null
          torque: number | null
          acceleration: string | null
          top_speed: number | null
          charging_time: string | null
          warranty: string | null
          manufacturing_date: string | null
          range_extender_number: string | null
          high_voltage_battery_number: string | null
          front_motor_number: string | null
          rear_motor_number: string | null
          arrival_date: string
          customs: Database["public"]["Enums"]["customs_status"]
          shipment_code: string | null
          showroom_entry_date: string | null
          showroom_exit_date: string | null
          showroom_note: string | null
          garage_entry_date: string | null
          garage_location: string | null
          garage_status: Database["public"]["Enums"]["garage_status"] | null
          garage_notes: string | null
          features: string[] | null
          notes: string | null
          photos: string[] | null
          created_at: string
          updated_at: string
          created_by: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          vin_number: string
          model: string
          brand?: string
          year: number
          color: string
          category?: Database["public"]["Enums"]["car_category"]
          status?: Database["public"]["Enums"]["car_status"]
          current_location?: Database["public"]["Enums"]["car_location"]
          purchase_price?: number | null
          selling_price: number
          battery_percentage?: number | null
          range_km?: number | null
          horse_power?: number | null
          torque?: number | null
          acceleration?: string | null
          top_speed?: number | null
          charging_time?: string | null
          warranty?: string | null
          manufacturing_date?: string | null
          range_extender_number?: string | null
          high_voltage_battery_number?: string | null
          front_motor_number?: string | null
          rear_motor_number?: string | null
          arrival_date?: string
          customs?: Database["public"]["Enums"]["customs_status"]
          shipment_code?: string | null
          showroom_entry_date?: string | null
          showroom_exit_date?: string | null
          showroom_note?: string | null
          garage_entry_date?: string | null
          garage_location?: string | null
          garage_status?: Database["public"]["Enums"]["garage_status"] | null
          garage_notes?: string | null
          features?: string[] | null
          notes?: string | null
          photos?: string[] | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          vin_number?: string
          model?: string
          brand?: string
          year?: number
          color?: string
          category?: Database["public"]["Enums"]["car_category"]
          status?: Database["public"]["Enums"]["car_status"]
          current_location?: Database["public"]["Enums"]["car_location"]
          purchase_price?: number | null
          selling_price?: number
          battery_percentage?: number | null
          range_km?: number | null
          horse_power?: number | null
          torque?: number | null
          acceleration?: string | null
          top_speed?: number | null
          charging_time?: string | null
          warranty?: string | null
          manufacturing_date?: string | null
          range_extender_number?: string | null
          high_voltage_battery_number?: string | null
          front_motor_number?: string | null
          rear_motor_number?: string | null
          arrival_date?: string
          customs?: Database["public"]["Enums"]["customs_status"]
          shipment_code?: string | null
          showroom_entry_date?: string | null
          showroom_exit_date?: string | null
          showroom_note?: string | null
          garage_entry_date?: string | null
          garage_location?: string | null
          garage_status?: Database["public"]["Enums"]["garage_status"] | null
          garage_notes?: string | null
          features?: string[] | null
          notes?: string | null
          photos?: string[] | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cars_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cars_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      clients: {
        Row: {
          id: string
          name: string
          phone: string | null
          email: string | null
          address: string | null
          license_plate: string | null
          license_number: string | null
          nationality: string | null
          notes: string | null
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          name: string
          phone?: string | null
          email?: string | null
          address?: string | null
          license_plate?: string | null
          license_number?: string | null
          nationality?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          name?: string
          phone?: string | null
          email?: string | null
          address?: string | null
          license_plate?: string | null
          license_number?: string | null
          nationality?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      financial_records: {
        Row: {
          id: string
          car_id: string | null
          client_id: string | null
          type: string
          amount: number
          currency: string
          description: string | null
          reference_number: string | null
          invoice_url: string | null
          receipt_url: string | null
          transaction_date: string
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          car_id?: string | null
          client_id?: string | null
          type: string
          amount: number
          currency?: string
          description?: string | null
          reference_number?: string | null
          invoice_url?: string | null
          receipt_url?: string | null
          transaction_date: string
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          car_id?: string | null
          client_id?: string | null
          type?: string
          amount?: number
          currency?: string
          description?: string | null
          reference_number?: string | null
          invoice_url?: string | null
          receipt_url?: string | null
          transaction_date?: string
          created_at?: string
          created_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_records_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_records_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_records_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      parts_inventory: {
        Row: {
          id: string
          part_number: string
          part_name: string
          description: string | null
          category: string | null
          compatible_models: string[] | null
          quantity_in_stock: number
          minimum_stock_level: number
          maximum_stock_level: number
          cost_price: number | null
          selling_price: number | null
          supplier_name: string | null
          supplier_contact: string | null
          weight_kg: number | null
          dimensions: string | null
          storage_location: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          part_number: string
          part_name: string
          description?: string | null
          category?: string | null
          compatible_models?: string[] | null
          quantity_in_stock?: number
          minimum_stock_level?: number
          maximum_stock_level?: number
          cost_price?: number | null
          selling_price?: number | null
          supplier_name?: string | null
          supplier_contact?: string | null
          weight_kg?: number | null
          dimensions?: string | null
          storage_location?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          part_number?: string
          part_name?: string
          description?: string | null
          category?: string | null
          compatible_models?: string[] | null
          quantity_in_stock?: number
          minimum_stock_level?: number
          maximum_stock_level?: number
          cost_price?: number | null
          selling_price?: number | null
          supplier_name?: string | null
          supplier_contact?: string | null
          weight_kg?: number | null
          dimensions?: string | null
          storage_location?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      parts_usage: {
        Row: {
          id: string
          car_id: string
          part_id: string
          quantity_used: number
          used_for: string | null
          usage_date: string
          technician_id: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          car_id: string
          part_id: string
          quantity_used?: number
          used_for?: string | null
          usage_date?: string
          technician_id?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          car_id?: string
          part_id?: string
          quantity_used?: number
          used_for?: string | null
          usage_date?: string
          technician_id?: string | null
          notes?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "parts_usage_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_usage_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts_inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_usage_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      pdi_inspections: {
        Row: {
          id: string
          car_id: string
          status: Database["public"]["Enums"]["pdi_status"]
          technician_id: string | null
          technician_name: string | null
          start_date: string | null
          completion_date: string | null
          estimated_completion: string | null
          exterior_inspection: boolean
          interior_inspection: boolean
          engine_inspection: boolean
          electronics_inspection: boolean
          battery_inspection: boolean
          charging_system_inspection: boolean
          software_update: boolean
          overall_score: number | null
          issues_found: string[] | null
          notes: string | null
          photos: string[] | null
          inspection_report_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          car_id: string
          status?: Database["public"]["Enums"]["pdi_status"]
          technician_id?: string | null
          technician_name?: string | null
          start_date?: string | null
          completion_date?: string | null
          estimated_completion?: string | null
          exterior_inspection?: boolean
          interior_inspection?: boolean
          engine_inspection?: boolean
          electronics_inspection?: boolean
          battery_inspection?: boolean
          charging_system_inspection?: boolean
          software_update?: boolean
          overall_score?: number | null
          issues_found?: string[] | null
          notes?: string | null
          photos?: string[] | null
          inspection_report_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          car_id?: string
          status?: Database["public"]["Enums"]["pdi_status"]
          technician_id?: string | null
          technician_name?: string | null
          start_date?: string | null
          completion_date?: string | null
          estimated_completion?: string | null
          exterior_inspection?: boolean
          interior_inspection?: boolean
          engine_inspection?: boolean
          electronics_inspection?: boolean
          battery_inspection?: boolean
          charging_system_inspection?: boolean
          software_update?: boolean
          overall_score?: number | null
          issues_found?: string[] | null
          notes?: string | null
          photos?: string[] | null
          inspection_report_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pdi_inspections_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdi_inspections_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      test_drives: {
        Row: {
          id: string
          car_id: string
          client_id: string | null
          type: Database["public"]["Enums"]["test_drive_type"]
          driver_name: string
          driver_phone: string | null
          driver_license: string | null
          driver_email: string | null
          scheduled_start: string
          scheduled_end: string
          actual_start: string | null
          actual_end: string | null
          planned_route: string | null
          distance_km: number | null
          weather_conditions: string | null
          driver_feedback: string | null
          technician_notes: string | null
          issues_reported: string[] | null
          photos: string[] | null
          is_active: boolean
          completed: boolean
          cancelled: boolean
          cancellation_reason: string | null
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          car_id: string
          client_id?: string | null
          type: Database["public"]["Enums"]["test_drive_type"]
          driver_name: string
          driver_phone?: string | null
          driver_license?: string | null
          driver_email?: string | null
          scheduled_start: string
          scheduled_end: string
          actual_start?: string | null
          actual_end?: string | null
          planned_route?: string | null
          distance_km?: number | null
          weather_conditions?: string | null
          driver_feedback?: string | null
          technician_notes?: string | null
          issues_reported?: string[] | null
          photos?: string[] | null
          is_active?: boolean
          completed?: boolean
          cancelled?: boolean
          cancellation_reason?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          car_id?: string
          client_id?: string | null
          type?: Database["public"]["Enums"]["test_drive_type"]
          driver_name?: string
          driver_phone?: string | null
          driver_license?: string | null
          driver_email?: string | null
          scheduled_start?: string
          scheduled_end?: string
          actual_start?: string | null
          actual_end?: string | null
          planned_route?: string | null
          distance_km?: number | null
          weather_conditions?: string | null
          driver_feedback?: string | null
          technician_notes?: string | null
          issues_reported?: string[] | null
          photos?: string[] | null
          is_active?: boolean
          completed?: boolean
          cancelled?: boolean
          cancellation_reason?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "test_drives_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_drives_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_drives_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_profiles: {
        Row: {
          id: string
          full_name: string | null
          role: Database["public"]["Enums"]["user_role"]
          department: string | null
          employee_id: string | null
          phone: string | null
          hire_date: string | null
          can_edit_cars: boolean
          can_delete_cars: boolean
          can_manage_pdi: boolean
          can_manage_test_drives: boolean
          can_view_financials: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          department?: string | null
          employee_id?: string | null
          phone?: string | null
          hire_date?: string | null
          can_edit_cars?: boolean
          can_delete_cars?: boolean
          can_manage_pdi?: boolean
          can_manage_test_drives?: boolean
          can_view_financials?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          department?: string | null
          employee_id?: string | null
          phone?: string | null
          hire_date?: string | null
          can_edit_cars?: boolean
          can_delete_cars?: boolean
          can_manage_pdi?: boolean
          can_manage_test_drives?: boolean
          can_view_financials?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      complete_car_sale: {
        Args: {
          car_id: string
          client_id: string
          sale_price: number
          delivery_date?: string
        }
        Returns: Json
      }
      complete_pdi_inspection: {
        Args: {
          car_id: string
          technician_name: string
          overall_score: number
          inspection_notes: string
          issues_found?: string[]
          photos?: string[]
      }
        Returns: Json
      }
      end_test_drive: {
        Args: {
          test_drive_id: string
          driver_feedback?: string
          technician_notes?: string
          issues_reported?: string[]
        }
        Returns: Json
      }
      get_car_details: {
        Args: {
          car_id: string
        }
        Returns: Json
      }
      get_inventory_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      move_car: {
        Args: {
          car_id: string
          new_location: Database["public"]["Enums"]["car_location"]
          reason?: string
          notes?: string
        }
        Returns: Json
      }
      reserve_car: {
        Args: {
          car_id: string
          client_id: string
          delivery_date?: string
          sale_price?: number
        }
        Returns: Json
      }
      schedule_test_drive: {
        Args: {
          car_id: string
          driver_name: string
          driver_phone: string
          driver_license: string
          scheduled_start: string
          scheduled_end: string
          test_drive_type?: Database["public"]["Enums"]["test_drive_type"]
          client_id?: string
        }
        Returns: Json
      }
      use_parts_for_car: {
        Args: {
          car_id: string
          parts_data: Json
        }
        Returns: Json
      }
    }
    Enums: {
      car_category: "EV" | "REV" | "ICEV"
      car_location: "Showroom Floor 1" | "Showroom Floor 2" | "Garage" | "Inventory" | "External"
      car_status: "in_stock" | "reserved" | "sold"
      customs_status: "not_paid" | "paid" | "pending" | "exempted"
      garage_status: "stored" | "in_repair" | "ready_for_pickup" | "awaiting_parts"
      pdi_status: "pending" | "in_progress" | "completed" | "failed"
      test_drive_type: "client" | "employee"
      user_role: "admin" | "manager" | "technician" | "sales" | "viewer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
