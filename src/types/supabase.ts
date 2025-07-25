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
      ai_insights: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          affected_area: string | null
          affected_entity: string | null
          created_at: string | null
          delay_increase: number | null
          description: string
          efficiency_drop: number | null
          expected_improvement: string | null
          id: string
          insight_type: string
          priority: string
          quality_issues_increase: number | null
          recommended_actions: string[] | null
          status: string
          title: string
          updated_at: string | null
          week_end: string | null
          week_start: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          affected_area?: string | null
          affected_entity?: string | null
          created_at?: string | null
          delay_increase?: number | null
          description: string
          efficiency_drop?: number | null
          expected_improvement?: string | null
          id?: string
          insight_type: string
          priority?: string
          quality_issues_increase?: number | null
          recommended_actions?: string[] | null
          status?: string
          title: string
          updated_at?: string | null
          week_end?: string | null
          week_start?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          affected_area?: string | null
          affected_entity?: string | null
          created_at?: string | null
          delay_increase?: number | null
          description?: string
          efficiency_drop?: number | null
          expected_improvement?: string | null
          id?: string
          insight_type?: string
          priority?: string
          quality_issues_increase?: number | null
          recommended_actions?: string[] | null
          status?: string
          title?: string
          updated_at?: string | null
          week_end?: string | null
          week_start?: string | null
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          api_key: string
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          key_name: string
          last_used_at: string | null
          user_id: string
        }
        Insert: {
          api_key: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_name: string
          last_used_at?: string | null
          user_id: string
        }
        Update: {
          api_key?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_name?: string
          last_used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      car_damages: {
        Row: {
          car_id: string | null
          created_at: string | null
          description: string
          id: string
          location: string
          photos: string[] | null
          severity: string
        }
        Insert: {
          car_id?: string | null
          created_at?: string | null
          description: string
          id?: string
          location: string
          photos?: string[] | null
          severity: string
        }
        Update: {
          car_id?: string | null
          created_at?: string | null
          description?: string
          id?: string
          location?: string
          photos?: string[] | null
          severity?: string
        }
        Relationships: [
          {
            foreignKeyName: "car_damages_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "car_inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_car_damages_car_inventory"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "car_inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      car_inventory: {
        Row: {
          arrival_date: string
          battery_percentage: number | null
          category: string | null
          client_license_plate: string | null
          client_name: string | null
          client_phone: string | null
          color: string
          created_at: string | null
          current_floor: string | null
          custom_duty: string | null
          id: string
          in_showroom: boolean | null
          model: string
          notes: string | null
          pdi_completed: boolean | null
          pdi_date: string | null
          pdi_notes: string | null
          pdi_photos: string[] | null
          pdi_technician: string | null
          showroom_entry_date: string | null
          showroom_exit_date: string | null
          showroom_note: string | null
          sold_date: string | null
          status: string
          updated_at: string | null
          vin_number: string
          year: number
        }
        Insert: {
          arrival_date: string
          battery_percentage?: number | null
          category?: string | null
          client_license_plate?: string | null
          client_name?: string | null
          client_phone?: string | null
          color: string
          created_at?: string | null
          current_floor?: string | null
          custom_duty?: string | null
          id?: string
          in_showroom?: boolean | null
          model: string
          notes?: string | null
          pdi_completed?: boolean | null
          pdi_date?: string | null
          pdi_notes?: string | null
          pdi_photos?: string[] | null
          pdi_technician?: string | null
          showroom_entry_date?: string | null
          showroom_exit_date?: string | null
          showroom_note?: string | null
          sold_date?: string | null
          status: string
          updated_at?: string | null
          vin_number: string
          year: number
        }
        Update: {
          arrival_date?: string
          battery_percentage?: number | null
          category?: string | null
          client_license_plate?: string | null
          client_name?: string | null
          client_phone?: string | null
          color?: string
          created_at?: string | null
          current_floor?: string | null
          custom_duty?: string | null
          id?: string
          in_showroom?: boolean | null
          model?: string
          notes?: string | null
          pdi_completed?: boolean | null
          pdi_date?: string | null
          pdi_notes?: string | null
          pdi_photos?: string[] | null
          pdi_technician?: string | null
          showroom_entry_date?: string | null
          showroom_exit_date?: string | null
          showroom_note?: string | null
          sold_date?: string | null
          status?: string
          updated_at?: string | null
          vin_number?: string
          year?: number
        }
        Relationships: []
      }
      chat_memory: {
        Row: {
          id: string
          last_updated: string | null
          memory: Json | null
          user_id: string
        }
        Insert: {
          id?: string
          last_updated?: string | null
          memory?: Json | null
          user_id?: string
        }
        Update: {
          id?: string
          last_updated?: string | null
          memory?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      enhanced_repair_history: {
        Row: {
          after_photos: string[] | null
          before_photos: string[] | null
          car_color: string | null
          car_model: string
          car_vin: string
          car_year: number | null
          client_email: string | null
          client_license_plate: string | null
          client_name: string
          client_phone: string | null
          client_satisfaction: number | null
          completion_date: string | null
          created_at: string
          difficulty_level: string | null
          follow_up_notes: string | null
          follow_up_required: boolean | null
          id: string
          issue_description: string
          labor_hours: number | null
          parts_used: Json
          photos: string[] | null
          quality_rating: number | null
          repair_category: string | null
          repair_date: string
          repair_steps: string[] | null
          solution_description: string
          technician_name: string
          total_cost: number | null
          updated_at: string
          warranty_period: number | null
        }
        Insert: {
          after_photos?: string[] | null
          before_photos?: string[] | null
          car_color?: string | null
          car_model: string
          car_vin: string
          car_year?: number | null
          client_email?: string | null
          client_license_plate?: string | null
          client_name: string
          client_phone?: string | null
          client_satisfaction?: number | null
          completion_date?: string | null
          created_at?: string
          difficulty_level?: string | null
          follow_up_notes?: string | null
          follow_up_required?: boolean | null
          id?: string
          issue_description: string
          labor_hours?: number | null
          parts_used?: Json
          photos?: string[] | null
          quality_rating?: number | null
          repair_category?: string | null
          repair_date: string
          repair_steps?: string[] | null
          solution_description: string
          technician_name: string
          total_cost?: number | null
          updated_at?: string
          warranty_period?: number | null
        }
        Update: {
          after_photos?: string[] | null
          before_photos?: string[] | null
          car_color?: string | null
          car_model?: string
          car_vin?: string
          car_year?: number | null
          client_email?: string | null
          client_license_plate?: string | null
          client_name?: string
          client_phone?: string | null
          client_satisfaction?: number | null
          completion_date?: string | null
          created_at?: string
          difficulty_level?: string | null
          follow_up_notes?: string | null
          follow_up_required?: boolean | null
          id?: string
          issue_description?: string
          labor_hours?: number | null
          parts_used?: Json
          photos?: string[] | null
          quality_rating?: number | null
          repair_category?: string | null
          repair_date?: string
          repair_steps?: string[] | null
          solution_description?: string
          technician_name?: string
          total_cost?: number | null
          updated_at?: string
          warranty_period?: number | null
        }
        Relationships: []
      }
      equipment_assets: {
        Row: {
          category: string
          condition: string | null
          created_at: string
          current_value: number
          depreciation_method: string
          id: string
          last_maintenance_date: string | null
          location: string | null
          maintenance_cost: number | null
          name: string
          purchase_date: string
          purchase_price: number
          salvage_value: number | null
          updated_at: string
          useful_life_years: number
        }
        Insert: {
          category: string
          condition?: string | null
          created_at?: string
          current_value: number
          depreciation_method?: string
          id?: string
          last_maintenance_date?: string | null
          location?: string | null
          maintenance_cost?: number | null
          name: string
          purchase_date: string
          purchase_price: number
          salvage_value?: number | null
          updated_at?: string
          useful_life_years: number
        }
        Update: {
          category?: string
          condition?: string | null
          created_at?: string
          current_value?: number
          depreciation_method?: string
          id?: string
          last_maintenance_date?: string | null
          location?: string | null
          maintenance_cost?: number | null
          name?: string
          purchase_date?: string
          purchase_price?: number
          salvage_value?: number | null
          updated_at?: string
          useful_life_years?: number
        }
        Relationships: []
      }
      garage_cars: {
        Row: {
          arrival_timestamp: string
          assigned_employee: string
          car_code: string
          car_model: string
          completion_percentage: number | null
          created_at: string | null
          customer_name: string
          description: string
          end_date: string | null
          end_timestamp: string | null
          estimated_completion_date: string | null
          estimated_completion_timestamp: string | null
          id: string
          issue_description: string | null
          mechanics: string[] | null
          parts_used: string[] | null
          quality_check_status: string | null
          repair_duration: string | null
          repair_stage: string
          software_update_required: boolean | null
          software_update_status: string | null
          software_update_version: string | null
          start_date: string
          start_timestamp: string
          status: string
          status_comments: string | null
          updated_at: string | null
          work_notes: string | null
        }
        Insert: {
          arrival_timestamp: string
          assigned_employee: string
          car_code: string
          car_model: string
          completion_percentage?: number | null
          created_at?: string | null
          customer_name: string
          description: string
          end_date?: string | null
          end_timestamp?: string | null
          estimated_completion_date?: string | null
          estimated_completion_timestamp?: string | null
          id?: string
          issue_description?: string | null
          mechanics?: string[] | null
          parts_used?: string[] | null
          quality_check_status?: string | null
          repair_duration?: string | null
          repair_stage: string
          software_update_required?: boolean | null
          software_update_status?: string | null
          software_update_version?: string | null
          start_date: string
          start_timestamp: string
          status: string
          status_comments?: string | null
          updated_at?: string | null
          work_notes?: string | null
        }
        Update: {
          arrival_timestamp?: string
          assigned_employee?: string
          car_code?: string
          car_model?: string
          completion_percentage?: number | null
          created_at?: string | null
          customer_name?: string
          description?: string
          end_date?: string | null
          end_timestamp?: string | null
          estimated_completion_date?: string | null
          estimated_completion_timestamp?: string | null
          id?: string
          issue_description?: string | null
          mechanics?: string[] | null
          parts_used?: string[] | null
          quality_check_status?: string | null
          repair_duration?: string | null
          repair_stage?: string
          software_update_required?: boolean | null
          software_update_status?: string | null
          software_update_version?: string | null
          start_date?: string
          start_timestamp?: string
          status?: string
          status_comments?: string | null
          updated_at?: string | null
          work_notes?: string | null
        }
        Relationships: []
      }
      garage_schedule: {
        Row: {
          available: boolean | null
          created_at: string | null
          current_cars_scheduled: number | null
          date: string
          end_time: string
          id: string
          max_cars_capacity: number | null
          notes: string | null
          start_time: string
          updated_at: string | null
        }
        Insert: {
          available?: boolean | null
          created_at?: string | null
          current_cars_scheduled?: number | null
          date: string
          end_time: string
          id?: string
          max_cars_capacity?: number | null
          notes?: string | null
          start_time: string
          updated_at?: string | null
        }
        Update: {
          available?: boolean | null
          created_at?: string | null
          current_cars_scheduled?: number | null
          date?: string
          end_time?: string
          id?: string
          max_cars_capacity?: number | null
          notes?: string | null
          start_time?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      inventory_items: {
        Row: {
          arrival_date: string | null
          batch_number: string | null
          car_model: string
          column_position: string
          cost_per_unit: number | null
          created_at: string | null
          expiry_date: string | null
          floor: string | null
          id: string
          last_updated: string | null
          location: string
          part_name: string
          part_number: string
          quantity: number
          room: string | null
          row_position: string
          shelf: string
          supplier: string | null
        }
        Insert: {
          arrival_date?: string | null
          batch_number?: string | null
          car_model: string
          column_position: string
          cost_per_unit?: number | null
          created_at?: string | null
          expiry_date?: string | null
          floor?: string | null
          id?: string
          last_updated?: string | null
          location: string
          part_name: string
          part_number: string
          quantity?: number
          room?: string | null
          row_position: string
          shelf: string
          supplier?: string | null
        }
        Update: {
          arrival_date?: string | null
          batch_number?: string | null
          car_model?: string
          column_position?: string
          cost_per_unit?: number | null
          created_at?: string | null
          expiry_date?: string | null
          floor?: string | null
          id?: string
          last_updated?: string | null
          location?: string
          part_name?: string
          part_number?: string
          quantity?: number
          room?: string | null
          row_position?: string
          shelf?: string
          supplier?: string | null
        }
        Relationships: []
      }
      inventory_valuation: {
        Row: {
          carrying_cost_percentage: number | null
          created_at: string
          depreciation_rate_per_month: number | null
          expiry_date: string | null
          id: string
          insurance_cost_per_unit_per_month: number | null
          inventory_item_id: string | null
          last_used_date: string | null
          months_of_supply: number | null
          part_name: string
          part_number: string
          quantity_on_hand: number
          storage_cost_per_unit_per_month: number | null
          total_value: number
          unit_cost: number
          updated_at: string
          usage_rate_per_month: number | null
          valuation_date: string
        }
        Insert: {
          carrying_cost_percentage?: number | null
          created_at?: string
          depreciation_rate_per_month?: number | null
          expiry_date?: string | null
          id?: string
          insurance_cost_per_unit_per_month?: number | null
          inventory_item_id?: string | null
          last_used_date?: string | null
          months_of_supply?: number | null
          part_name: string
          part_number: string
          quantity_on_hand?: number
          storage_cost_per_unit_per_month?: number | null
          total_value?: number
          unit_cost?: number
          updated_at?: string
          usage_rate_per_month?: number | null
          valuation_date?: string
        }
        Update: {
          carrying_cost_percentage?: number | null
          created_at?: string
          depreciation_rate_per_month?: number | null
          expiry_date?: string | null
          id?: string
          insurance_cost_per_unit_per_month?: number | null
          inventory_item_id?: string | null
          last_used_date?: string | null
          months_of_supply?: number | null
          part_name?: string
          part_number?: string
          quantity_on_hand?: number
          storage_cost_per_unit_per_month?: number | null
          total_value?: number
          unit_cost?: number
          updated_at?: string
          usage_rate_per_month?: number | null
          valuation_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_valuation_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_calendar: {
        Row: {
          assigned_team_members: string[] | null
          attachments: string[] | null
          budget: number | null
          created_at: string | null
          description: string | null
          end_date: string | null
          event_type: string
          id: string
          notes: string | null
          priority: string
          start_date: string
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_team_members?: string[] | null
          attachments?: string[] | null
          budget?: number | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          event_type?: string
          id?: string
          notes?: string | null
          priority?: string
          start_date: string
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_team_members?: string[] | null
          attachments?: string[] | null
          budget?: number | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          event_type?: string
          id?: string
          notes?: string | null
          priority?: string
          start_date?: string
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      mechanic_changes: {
        Row: {
          changed_by: string
          garage_car_id: string | null
          id: string
          new_mechanics: string[] | null
          previous_mechanics: string[] | null
          reason: string | null
          timestamp: string | null
        }
        Insert: {
          changed_by: string
          garage_car_id?: string | null
          id?: string
          new_mechanics?: string[] | null
          previous_mechanics?: string[] | null
          reason?: string | null
          timestamp?: string | null
        }
        Update: {
          changed_by?: string
          garage_car_id?: string | null
          id?: string
          new_mechanics?: string[] | null
          previous_mechanics?: string[] | null
          reason?: string | null
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_mechanic_changes_garage_cars"
            columns: ["garage_car_id"]
            isOneToOne: false
            referencedRelation: "garage_cars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mechanic_changes_garage_car_id_fkey"
            columns: ["garage_car_id"]
            isOneToOne: false
            referencedRelation: "garage_cars"
            referencedColumns: ["id"]
          },
        ]
      }
      mechanic_performance: {
        Row: {
          cars_worked: number
          created_at: string | null
          delayed_completions: number
          efficiency_percentage: number | null
          id: string
          mechanic_name: string
          on_time_completions: number
          performance_notes: string | null
          quality_issues_count: number
          recommended_training: string[] | null
          specialization: string | null
          total_hours_worked: number
          updated_at: string | null
          week_number: number
          week_start: string
          year: number
        }
        Insert: {
          cars_worked?: number
          created_at?: string | null
          delayed_completions?: number
          efficiency_percentage?: number | null
          id?: string
          mechanic_name: string
          on_time_completions?: number
          performance_notes?: string | null
          quality_issues_count?: number
          recommended_training?: string[] | null
          specialization?: string | null
          total_hours_worked?: number
          updated_at?: string | null
          week_number: number
          week_start: string
          year: number
        }
        Update: {
          cars_worked?: number
          created_at?: string | null
          delayed_completions?: number
          efficiency_percentage?: number | null
          id?: string
          mechanic_name?: string
          on_time_completions?: number
          performance_notes?: string | null
          quality_issues_count?: number
          recommended_training?: string[] | null
          specialization?: string | null
          total_hours_worked?: number
          updated_at?: string | null
          week_number?: number
          week_start?: string
          year?: number
        }
        Relationships: []
      }
      monzabot_form_submissions: {
        Row: {
          approved_at: string | null
          created_at: string
          extracted_from: string | null
          form_data: Json
          form_type: string
          id: string
          monzabot_confidence: number | null
          status: string
          submitted_at: string | null
          target_table: string
          user_id: string
          user_notes: string | null
        }
        Insert: {
          approved_at?: string | null
          created_at?: string
          extracted_from?: string | null
          form_data: Json
          form_type: string
          id?: string
          monzabot_confidence?: number | null
          status?: string
          submitted_at?: string | null
          target_table: string
          user_id: string
          user_notes?: string | null
        }
        Update: {
          approved_at?: string | null
          created_at?: string
          extracted_from?: string | null
          form_data?: Json
          form_type?: string
          id?: string
          monzabot_confidence?: number | null
          status?: string
          submitted_at?: string | null
          target_table?: string
          user_id?: string
          user_notes?: string | null
        }
        Relationships: []
      }
      new_car_arrivals: {
        Row: {
          arrival_date: string | null
          battery_percentage: number | null
          color: string
          created_at: string | null
          damage_description: string | null
          has_damages: boolean | null
          id: string
          model: string
          notes: string | null
          pdi_notes: string | null
          pdi_photos: string[] | null
          pdi_technician: string | null
          status: string | null
          updated_at: string | null
          vehicle_category: string | null
          vin_number: string
        }
        Insert: {
          arrival_date?: string | null
          battery_percentage?: number | null
          color: string
          created_at?: string | null
          damage_description?: string | null
          has_damages?: boolean | null
          id?: string
          model: string
          notes?: string | null
          pdi_notes?: string | null
          pdi_photos?: string[] | null
          pdi_technician?: string | null
          status?: string | null
          updated_at?: string | null
          vehicle_category?: string | null
          vin_number: string
        }
        Update: {
          arrival_date?: string | null
          battery_percentage?: number | null
          color?: string
          created_at?: string | null
          damage_description?: string | null
          has_damages?: boolean | null
          id?: string
          model?: string
          notes?: string | null
          pdi_notes?: string | null
          pdi_photos?: string[] | null
          pdi_technician?: string | null
          status?: string | null
          updated_at?: string | null
          vehicle_category?: string | null
          vin_number?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string
          read: boolean | null
          related_entity_id: string | null
          related_entity_type: string | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          read?: boolean | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          read?: boolean | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      operational_costs: {
        Row: {
          billing_period_end: string
          billing_period_start: string
          cost_amount: number
          cost_category: string
          cost_per_unit: number | null
          created_at: string
          garage_allocation_percentage: number | null
          id: string
          invoice_date: string | null
          invoice_number: string | null
          office_allocation_percentage: number | null
          showroom_allocation_percentage: number | null
          subcategory: string | null
          unit_type: string | null
          units_consumed: number | null
          updated_at: string
        }
        Insert: {
          billing_period_end: string
          billing_period_start: string
          cost_amount?: number
          cost_category: string
          cost_per_unit?: number | null
          created_at?: string
          garage_allocation_percentage?: number | null
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          office_allocation_percentage?: number | null
          showroom_allocation_percentage?: number | null
          subcategory?: string | null
          unit_type?: string | null
          units_consumed?: number | null
          updated_at?: string
        }
        Update: {
          billing_period_end?: string
          billing_period_start?: string
          cost_amount?: number
          cost_category?: string
          cost_per_unit?: number | null
          created_at?: string
          garage_allocation_percentage?: number | null
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          office_allocation_percentage?: number | null
          showroom_allocation_percentage?: number | null
          subcategory?: string | null
          unit_type?: string | null
          units_consumed?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      ordered_cars: {
        Row: {
          category: string | null
          color: string | null
          created_at: string | null
          estimated_eta: string | null
          expected_delivery: string | null
          id: string
          model: string
          notes: string | null
          order_date: string
          order_reference: string
          price: number | null
          receipt_photos: string[] | null
          shipping_company: string | null
          status: string
          supplier: string
          tracking_code: string | null
          updated_at: string | null
          vin_number: string | null
          year: number
        }
        Insert: {
          category?: string | null
          color?: string | null
          created_at?: string | null
          estimated_eta?: string | null
          expected_delivery?: string | null
          id?: string
          model: string
          notes?: string | null
          order_date?: string
          order_reference: string
          price?: number | null
          receipt_photos?: string[] | null
          shipping_company?: string | null
          status?: string
          supplier: string
          tracking_code?: string | null
          updated_at?: string | null
          vin_number?: string | null
          year: number
        }
        Update: {
          category?: string | null
          color?: string | null
          created_at?: string | null
          estimated_eta?: string | null
          expected_delivery?: string | null
          id?: string
          model?: string
          notes?: string | null
          order_date?: string
          order_reference?: string
          price?: number | null
          receipt_photos?: string[] | null
          shipping_company?: string | null
          status?: string
          supplier?: string
          tracking_code?: string | null
          updated_at?: string | null
          vin_number?: string | null
          year?: number
        }
        Relationships: []
      }
      ordered_parts: {
        Row: {
          category: string | null
          created_at: string | null
          estimated_eta: string | null
          expected_delivery: string | null
          id: string
          notes: string | null
          order_date: string
          order_reference: string
          part_name: string
          part_number: string
          price: number | null
          quantity: number
          receipt_photos: string[] | null
          shipping_company: string | null
          status: string
          supplier: string
          tracking_code: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          estimated_eta?: string | null
          expected_delivery?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          order_reference: string
          part_name: string
          part_number: string
          price?: number | null
          quantity?: number
          receipt_photos?: string[] | null
          shipping_company?: string | null
          status?: string
          supplier: string
          tracking_code?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          estimated_eta?: string | null
          expected_delivery?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          order_reference?: string
          part_name?: string
          part_number?: string
          price?: number | null
          quantity?: number
          receipt_photos?: string[] | null
          shipping_company?: string | null
          status?: string
          supplier?: string
          tracking_code?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      parts_knowledge_base: {
        Row: {
          average_cost: number | null
          common_issues: string[] | null
          compatible_models: string[] | null
          created_at: string
          id: string
          installation_difficulty: string | null
          installation_notes: string | null
          installation_time_hours: number | null
          last_used: string | null
          part_category: string | null
          part_name: string
          part_number: string
          photos: string[] | null
          supplier: string | null
          updated_at: string
          usage_count: number | null
          warranty_months: number | null
        }
        Insert: {
          average_cost?: number | null
          common_issues?: string[] | null
          compatible_models?: string[] | null
          created_at?: string
          id?: string
          installation_difficulty?: string | null
          installation_notes?: string | null
          installation_time_hours?: number | null
          last_used?: string | null
          part_category?: string | null
          part_name: string
          part_number: string
          photos?: string[] | null
          supplier?: string | null
          updated_at?: string
          usage_count?: number | null
          warranty_months?: number | null
        }
        Update: {
          average_cost?: number | null
          common_issues?: string[] | null
          compatible_models?: string[] | null
          created_at?: string
          id?: string
          installation_difficulty?: string | null
          installation_notes?: string | null
          installation_time_hours?: number | null
          last_used?: string | null
          part_category?: string | null
          part_name?: string
          part_number?: string
          photos?: string[] | null
          supplier?: string | null
          updated_at?: string
          usage_count?: number | null
          warranty_months?: number | null
        }
        Relationships: []
      }
      parts_usage_tracking: {
        Row: {
          arrival_date: string | null
          car_model: string | null
          car_vin: string
          client_license_plate: string | null
          client_name: string
          client_phone: string | null
          cost_per_unit: number | null
          created_at: string | null
          id: string
          location_used: string | null
          notes: string | null
          part_name: string
          part_number: string
          quantity: number
          repair_id: string | null
          repair_type: string | null
          technician: string
          total_cost: number | null
          updated_at: string | null
          usage_date: string
        }
        Insert: {
          arrival_date?: string | null
          car_model?: string | null
          car_vin: string
          client_license_plate?: string | null
          client_name: string
          client_phone?: string | null
          cost_per_unit?: number | null
          created_at?: string | null
          id?: string
          location_used?: string | null
          notes?: string | null
          part_name: string
          part_number: string
          quantity: number
          repair_id?: string | null
          repair_type?: string | null
          technician: string
          total_cost?: number | null
          updated_at?: string | null
          usage_date?: string
        }
        Update: {
          arrival_date?: string | null
          car_model?: string | null
          car_vin?: string
          client_license_plate?: string | null
          client_name?: string
          client_phone?: string | null
          cost_per_unit?: number | null
          created_at?: string | null
          id?: string
          location_used?: string | null
          notes?: string | null
          part_name?: string
          part_number?: string
          quantity?: number
          repair_id?: string | null
          repair_type?: string | null
          technician?: string
          total_cost?: number | null
          updated_at?: string | null
          usage_date?: string
        }
        Relationships: []
      }
      pdi_forms: {
        Row: {
          created_at: string | null
          customer_requirements_mounting_accessories: boolean | null
          customer_requirements_others: string | null
          delivery_service_manager_date: string | null
          delivery_service_manager_signature_url: string | null
          estimated_delivery_date: string
          front_motor_number: string | null
          high_voltage_battery_number: string
          id: string
          maintenance_checklist: Json
          maintenance_technician_date: string | null
          maintenance_technician_signature_url: string | null
          manufacture_date: string
          market_quality_activity_confirmed: boolean | null
          market_quality_activity_number: string | null
          model: string
          outlet_name: string
          outlet_number: string
          pdi_remarks: string | null
          range_extender_number: string | null
          rear_motor_number: string | null
          technical_director_date: string | null
          technical_director_signature_url: string | null
          updated_at: string | null
          vin: string
        }
        Insert: {
          created_at?: string | null
          customer_requirements_mounting_accessories?: boolean | null
          customer_requirements_others?: string | null
          delivery_service_manager_date?: string | null
          delivery_service_manager_signature_url?: string | null
          estimated_delivery_date: string
          front_motor_number?: string | null
          high_voltage_battery_number: string
          id?: string
          maintenance_checklist: Json
          maintenance_technician_date?: string | null
          maintenance_technician_signature_url?: string | null
          manufacture_date: string
          market_quality_activity_confirmed?: boolean | null
          market_quality_activity_number?: string | null
          model: string
          outlet_name: string
          outlet_number: string
          pdi_remarks?: string | null
          range_extender_number?: string | null
          rear_motor_number?: string | null
          technical_director_date?: string | null
          technical_director_signature_url?: string | null
          updated_at?: string | null
          vin: string
        }
        Update: {
          created_at?: string | null
          customer_requirements_mounting_accessories?: boolean | null
          customer_requirements_others?: string | null
          delivery_service_manager_date?: string | null
          delivery_service_manager_signature_url?: string | null
          estimated_delivery_date?: string
          front_motor_number?: string | null
          high_voltage_battery_number?: string
          id?: string
          maintenance_checklist?: Json
          maintenance_technician_date?: string | null
          maintenance_technician_signature_url?: string | null
          manufacture_date?: string
          market_quality_activity_confirmed?: boolean | null
          market_quality_activity_number?: string | null
          model?: string
          outlet_name?: string
          outlet_number?: string
          pdi_remarks?: string | null
          range_extender_number?: string | null
          rear_motor_number?: string | null
          technical_director_date?: string | null
          technical_director_signature_url?: string | null
          updated_at?: string | null
          vin?: string
        }
        Relationships: []
      }
      productivity_tracking: {
        Row: {
          actual_completion: string | null
          actual_hours: number | null
          actual_start: string | null
          assigned_mechanics: string[]
          car_code: string
          car_id: string | null
          created_at: string | null
          customer_name: string
          delay_hours: number | null
          delay_reason: string | null
          efficiency_percentage: number | null
          estimated_completion: string
          estimated_hours: number
          estimated_start: string
          id: string
          productivity_notes: string | null
          quality_issues: string[] | null
          status: string
          updated_at: string | null
          week_number: number
          week_start: string
          work_type: string
          year: number
        }
        Insert: {
          actual_completion?: string | null
          actual_hours?: number | null
          actual_start?: string | null
          assigned_mechanics: string[]
          car_code: string
          car_id?: string | null
          created_at?: string | null
          customer_name: string
          delay_hours?: number | null
          delay_reason?: string | null
          efficiency_percentage?: number | null
          estimated_completion: string
          estimated_hours: number
          estimated_start: string
          id?: string
          productivity_notes?: string | null
          quality_issues?: string[] | null
          status?: string
          updated_at?: string | null
          week_number: number
          week_start: string
          work_type: string
          year: number
        }
        Update: {
          actual_completion?: string | null
          actual_hours?: number | null
          actual_start?: string | null
          assigned_mechanics?: string[]
          car_code?: string
          car_id?: string | null
          created_at?: string | null
          customer_name?: string
          delay_hours?: number | null
          delay_reason?: string | null
          efficiency_percentage?: number | null
          estimated_completion?: string
          estimated_hours?: number
          estimated_start?: string
          id?: string
          productivity_notes?: string | null
          quality_issues?: string[] | null
          status?: string
          updated_at?: string | null
          week_number?: number
          week_start?: string
          work_type?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "productivity_tracking_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "garage_cars"
            referencedColumns: ["id"]
          },
        ]
      }
      repair_financials: {
        Row: {
          actual_completion_hours: number | null
          car_vin: string
          client_name: string
          created_at: string
          efficiency_rating: number | null
          electricity_cost: number | null
          equipment_usage_cost: number | null
          estimated_completion_hours: number | null
          final_price: number
          gross_profit: number
          id: string
          labor_hours: number
          labor_rate_per_hour: number
          overhead_cost: number | null
          parts_cost: number
          parts_markup_percentage: number | null
          profit_margin_percentage: number
          quoted_price: number
          repair_date: string
          repair_id: string | null
          total_cost: number
          total_labor_cost: number
          total_parts_cost: number
          updated_at: string
        }
        Insert: {
          actual_completion_hours?: number | null
          car_vin: string
          client_name: string
          created_at?: string
          efficiency_rating?: number | null
          electricity_cost?: number | null
          equipment_usage_cost?: number | null
          estimated_completion_hours?: number | null
          final_price?: number
          gross_profit?: number
          id?: string
          labor_hours?: number
          labor_rate_per_hour?: number
          overhead_cost?: number | null
          parts_cost?: number
          parts_markup_percentage?: number | null
          profit_margin_percentage?: number
          quoted_price?: number
          repair_date: string
          repair_id?: string | null
          total_cost?: number
          total_labor_cost?: number
          total_parts_cost?: number
          updated_at?: string
        }
        Update: {
          actual_completion_hours?: number | null
          car_vin?: string
          client_name?: string
          created_at?: string
          efficiency_rating?: number | null
          electricity_cost?: number | null
          equipment_usage_cost?: number | null
          estimated_completion_hours?: number | null
          final_price?: number
          gross_profit?: number
          id?: string
          labor_hours?: number
          labor_rate_per_hour?: number
          overhead_cost?: number | null
          parts_cost?: number
          parts_markup_percentage?: number | null
          profit_margin_percentage?: number
          quoted_price?: number
          repair_date?: string
          repair_id?: string | null
          total_cost?: number
          total_labor_cost?: number
          total_parts_cost?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "repair_financials_repair_id_fkey"
            columns: ["repair_id"]
            isOneToOne: false
            referencedRelation: "garage_cars"
            referencedColumns: ["id"]
          },
        ]
      }
      repair_history: {
        Row: {
          car_id: string | null
          created_at: string | null
          date: string
          description: string
          id: string
          notes: string | null
          photos: string[] | null
          technician: string
        }
        Insert: {
          car_id?: string | null
          created_at?: string | null
          date: string
          description: string
          id?: string
          notes?: string | null
          photos?: string[] | null
          technician: string
        }
        Update: {
          car_id?: string | null
          created_at?: string | null
          date?: string
          description?: string
          id?: string
          notes?: string | null
          photos?: string[] | null
          technician?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_repair_history_car_inventory"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "car_inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repair_history_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "car_inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      repair_history_parts: {
        Row: {
          cost: number | null
          id: string
          part_name: string
          part_number: string
          quantity: number
          repair_id: string | null
        }
        Insert: {
          cost?: number | null
          id?: string
          part_name: string
          part_number: string
          quantity: number
          repair_id?: string | null
        }
        Update: {
          cost?: number | null
          id?: string
          part_name?: string
          part_number?: string
          quantity?: number
          repair_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_repair_history_parts_repair_history"
            columns: ["repair_id"]
            isOneToOne: false
            referencedRelation: "repair_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repair_history_parts_repair_id_fkey"
            columns: ["repair_id"]
            isOneToOne: false
            referencedRelation: "repair_history"
            referencedColumns: ["id"]
          },
        ]
      }
      repair_solutions_kb: {
        Row: {
          car_models: string[] | null
          created_at: string
          difficulty_level: string | null
          effectiveness_rating: number | null
          estimated_time_hours: number | null
          id: string
          issue_description: string
          issue_keywords: string[]
          photos: string[] | null
          repair_steps: string[]
          required_parts: Json | null
          solution_description: string
          success_rate: number | null
          technician_notes: string | null
          updated_at: string
          usage_count: number | null
          video_links: string[] | null
        }
        Insert: {
          car_models?: string[] | null
          created_at?: string
          difficulty_level?: string | null
          effectiveness_rating?: number | null
          estimated_time_hours?: number | null
          id?: string
          issue_description: string
          issue_keywords: string[]
          photos?: string[] | null
          repair_steps: string[]
          required_parts?: Json | null
          solution_description: string
          success_rate?: number | null
          technician_notes?: string | null
          updated_at?: string
          usage_count?: number | null
          video_links?: string[] | null
        }
        Update: {
          car_models?: string[] | null
          created_at?: string
          difficulty_level?: string | null
          effectiveness_rating?: number | null
          estimated_time_hours?: number | null
          id?: string
          issue_description?: string
          issue_keywords?: string[]
          photos?: string[] | null
          repair_steps?: string[]
          required_parts?: Json | null
          solution_description?: string
          success_rate?: number | null
          technician_notes?: string | null
          updated_at?: string
          usage_count?: number | null
          video_links?: string[] | null
        }
        Relationships: []
      }
      request_comments: {
        Row: {
          author: string
          comment_text: string
          id: string
          request_id: string | null
          timestamp: string | null
        }
        Insert: {
          author: string
          comment_text: string
          id?: string
          request_id?: string | null
          timestamp?: string | null
        }
        Update: {
          author?: string
          comment_text?: string
          id?: string
          request_id?: string | null
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_request_comments_requests"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_comments_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      requests: {
        Row: {
          completed_at: string | null
          created_at: string | null
          details: string | null
          file_url: string | null
          id: string
          message: string
          priority: string
          request_type: string
          status: string
          submitted_at: string
          submitted_by: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          details?: string | null
          file_url?: string | null
          id?: string
          message: string
          priority: string
          request_type: string
          status: string
          submitted_at: string
          submitted_by: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          details?: string | null
          file_url?: string | null
          id?: string
          message?: string
          priority?: string
          request_type?: string
          status?: string
          submitted_at?: string
          submitted_by?: string
        }
        Relationships: []
      }
      sales_data: {
        Row: {
          conversions: number | null
          created_at: string | null
          date: string | null
          id: string
          leads_count: number | null
          revenue: number | null
          source: string
          updated_at: string | null
        }
        Insert: {
          conversions?: number | null
          created_at?: string | null
          date?: string | null
          id?: string
          leads_count?: number | null
          revenue?: number | null
          source: string
          updated_at?: string | null
        }
        Update: {
          conversions?: number | null
          created_at?: string | null
          date?: string | null
          id?: string
          leads_count?: number | null
          revenue?: number | null
          source?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      scheduled_cars: {
        Row: {
          assigned_mechanic: string | null
          car_code: string
          car_model: string
          created_at: string | null
          customer_name: string
          estimated_duration: string
          id: string
          notes: string | null
          priority: string
          schedule_id: string | null
          status: string
          work_type: string
        }
        Insert: {
          assigned_mechanic?: string | null
          car_code: string
          car_model: string
          created_at?: string | null
          customer_name: string
          estimated_duration: string
          id?: string
          notes?: string | null
          priority: string
          schedule_id?: string | null
          status: string
          work_type: string
        }
        Update: {
          assigned_mechanic?: string | null
          car_code?: string
          car_model?: string
          created_at?: string | null
          customer_name?: string
          estimated_duration?: string
          id?: string
          notes?: string | null
          priority?: string
          schedule_id?: string | null
          status?: string
          work_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_scheduled_cars_garage_schedule"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "garage_schedule"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_cars_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "garage_schedule"
            referencedColumns: ["id"]
          },
        ]
      }
      terms_agreements: {
        Row: {
          content: string
          created_at: string
          id: string
          is_active: boolean
          title: string
          updated_at: string
          version: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_active?: boolean
          title: string
          updated_at?: string
          version?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean
          title?: string
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      user_activity_logs: {
        Row: {
          activity_type: string
          created_at: string
          description: string | null
          id: string
          ip_address: string | null
          page_url: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string
          user_name: string | null
          user_role: string | null
        }
        Insert: {
          activity_type: string
          created_at?: string
          description?: string | null
          id?: string
          ip_address?: string | null
          page_url?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id: string
          user_name?: string | null
          user_role?: string | null
        }
        Update: {
          activity_type?: string
          created_at?: string
          description?: string | null
          id?: string
          ip_address?: string | null
          page_url?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string
          user_name?: string | null
          user_role?: string | null
        }
        Relationships: []
      }
      user_agreements: {
        Row: {
          agreed_at: string
          id: string
          ip_address: string | null
          terms_version: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          agreed_at?: string
          id?: string
          ip_address?: string | null
          terms_version: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          agreed_at?: string
          id?: string
          ip_address?: string | null
          terms_version?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_mfa_settings: {
        Row: {
          backup_codes: string[] | null
          created_at: string | null
          id: string
          mfa_enabled: boolean | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          backup_codes?: string[] | null
          created_at?: string | null
          id?: string
          mfa_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          backup_codes?: string[] | null
          created_at?: string | null
          id?: string
          mfa_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_mfa_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          address: string | null
          created_at: string | null
          department: string | null
          email: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          hybrid_role: string | null
          id: string
          name: string
          notes: string | null
          password_hash: string
          phone_number: string | null
          role: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          department?: string | null
          email: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          hybrid_role?: string | null
          id?: string
          name: string
          notes?: string | null
          password_hash: string
          phone_number?: string | null
          role: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          department?: string | null
          email?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          hybrid_role?: string | null
          id?: string
          name?: string
          notes?: string | null
          password_hash?: string
          phone_number?: string | null
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      vehicle_sales_financials: {
        Row: {
          created_at: string
          days_in_inventory: number | null
          final_sale_price: number
          gross_profit: number
          id: string
          import_duty: number | null
          insurance_cost: number | null
          listing_price: number
          model: string
          preparation_cost: number | null
          profit_margin_percentage: number
          purchase_date: string | null
          purchase_price: number
          sale_date: string | null
          sales_commission: number | null
          shipping_cost: number | null
          storage_cost_per_day: number | null
          total_acquisition_cost: number
          total_cost: number
          total_holding_cost: number | null
          updated_at: string
          vehicle_id: string | null
          vin_number: string
          year: number
        }
        Insert: {
          created_at?: string
          days_in_inventory?: number | null
          final_sale_price?: number
          gross_profit?: number
          id?: string
          import_duty?: number | null
          insurance_cost?: number | null
          listing_price?: number
          model: string
          preparation_cost?: number | null
          profit_margin_percentage?: number
          purchase_date?: string | null
          purchase_price?: number
          sale_date?: string | null
          sales_commission?: number | null
          shipping_cost?: number | null
          storage_cost_per_day?: number | null
          total_acquisition_cost?: number
          total_cost?: number
          total_holding_cost?: number | null
          updated_at?: string
          vehicle_id?: string | null
          vin_number: string
          year: number
        }
        Update: {
          created_at?: string
          days_in_inventory?: number | null
          final_sale_price?: number
          gross_profit?: number
          id?: string
          import_duty?: number | null
          insurance_cost?: number | null
          listing_price?: number
          model?: string
          preparation_cost?: number | null
          profit_margin_percentage?: number
          purchase_date?: string | null
          purchase_price?: number
          sale_date?: string | null
          sales_commission?: number | null
          shipping_cost?: number | null
          storage_cost_per_day?: number | null
          total_acquisition_cost?: number
          total_cost?: number
          total_holding_cost?: number | null
          updated_at?: string
          vehicle_id?: string | null
          vin_number?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_sales_financials_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "car_inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_productivity_summary: {
        Row: {
          average_cars_per_mechanic: number | null
          average_delay_hours: number | null
          body_work_hours: number | null
          cars_completed_on_time: number
          cars_delayed: number
          created_at: string | null
          detailer_hours: number | null
          electrical_hours: number | null
          id: string
          mechanic_hours: number | null
          overall_efficiency_percentage: number | null
          painter_hours: number | null
          total_actual_hours: number
          total_cars_worked: number
          total_estimated_hours: number
          total_mechanics_involved: number
          updated_at: string | null
          week_end: string
          week_number: number
          week_start: string
          year: number
        }
        Insert: {
          average_cars_per_mechanic?: number | null
          average_delay_hours?: number | null
          body_work_hours?: number | null
          cars_completed_on_time?: number
          cars_delayed?: number
          created_at?: string | null
          detailer_hours?: number | null
          electrical_hours?: number | null
          id?: string
          mechanic_hours?: number | null
          overall_efficiency_percentage?: number | null
          painter_hours?: number | null
          total_actual_hours?: number
          total_cars_worked?: number
          total_estimated_hours?: number
          total_mechanics_involved?: number
          updated_at?: string | null
          week_end: string
          week_number: number
          week_start: string
          year: number
        }
        Update: {
          average_cars_per_mechanic?: number | null
          average_delay_hours?: number | null
          body_work_hours?: number | null
          cars_completed_on_time?: number
          cars_delayed?: number
          created_at?: string | null
          detailer_hours?: number | null
          electrical_hours?: number | null
          id?: string
          mechanic_hours?: number | null
          overall_efficiency_percentage?: number | null
          painter_hours?: number | null
          total_actual_hours?: number
          total_cars_worked?: number
          total_estimated_hours?: number
          total_mechanics_involved?: number
          updated_at?: string | null
          week_end?: string
          week_number?: number
          week_start?: string
          year?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_equipment_depreciation: {
        Args: { asset_id: string }
        Returns: number
      }
      cleanup_expired_api_keys: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      generate_weekly_summary: {
        Args: { week_date: string }
        Returns: undefined
      }
      get_current_user_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_current_user_owner: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      validate_api_key: {
        Args: { api_key_input: string }
        Returns: {
          user_id: string
          user_name: string
          user_role: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
