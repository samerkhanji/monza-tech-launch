import { supabase } from '@/integrations/supabase/client';
import { pdiChecklistSchema, PdiChecklist } from '@/schemas/pdi';

export class PdiService {
  static async save(checklist: PdiChecklist) {
    const parsed = pdiChecklistSchema.parse(checklist);
    const { data, error } = await supabase
      .from('pdi_checklists')
      .upsert({
        ...parsed,
        sections: parsed.sections,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async getByVin(vin: string) {
    const { data, error } = await supabase
      .from('pdi_checklists')
      .select('*')
      .eq('vin', vin)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data as PdiChecklist | null;
  }
}

import { supabase } from '@/integrations/supabase/client';

export interface PDIInspectionData {
  carId: string;
  technicianName: string;
  inspectionDate: string;
  notes?: string;
  overallScore?: number;
  issuesFound?: string[];
  photos?: string[];
}

export interface PDIStatus {
  id: string;
  carId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  technicianName?: string;
  inspectionDate?: string;
  notes?: string;
  overallScore?: number;
  issuesFound?: string[];
  photos?: string[];
  completionDate?: string;
}

class PDIService {
  async createPDIInspection(data: PDIInspectionData): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('pdi_inspections')
        .insert({
          car_id: data.carId,
          technician_name: data.technicianName,
          start_date: data.inspectionDate,
          status: 'in_progress',
          notes: data.notes,
          overall_score: data.overallScore,
          issues_found: data.issuesFound,
          photos: data.photos
        });

      if (error) {
        console.error('Failed to create PDI inspection:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Create PDI inspection error:', error);
      return false;
    }
  }

  async completePDIInspection(carId: string, data: {
    technicianName: string;
    inspectionDate: string;
    notes?: string;
    overallScore?: number;
    issuesFound?: string[];
    photos?: string[];
  }): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('pdi_inspections')
        .upsert({
          car_id: carId,
          technician_name: data.technicianName,
          completion_date: data.inspectionDate,
          status: 'completed',
          notes: data.notes,
          overall_score: data.overallScore,
          issues_found: data.issuesFound,
          photos: data.photos,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'car_id'
        });

      if (error) {
        console.error('Failed to complete PDI inspection:', error);
        return false;
      }

      // Update car's PDI status in the main inventory
      await this.updateCarPDIStatus(carId, 'completed');

      return true;
    } catch (error) {
      console.error('Complete PDI inspection error:', error);
      return false;
    }
  }

  async getPDIStatus(carId: string): Promise<PDIStatus | null> {
    try {
      const { data, error } = await supabase
        .from('pdi_inspections')
        .select('*')
        .eq('car_id', carId)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        id: data.id,
        carId: data.car_id,
        status: data.status,
        technicianName: data.technician_name,
        inspectionDate: data.completion_date,
        notes: data.notes,
        overallScore: data.overall_score,
        issuesFound: data.issues_found,
        photos: data.photos,
        completionDate: data.completion_date
      };
    } catch (error) {
      console.error('Get PDI status error:', error);
      return null;
    }
  }

  async updateCarPDIStatus(carId: string, status: 'pending' | 'completed' | 'failed'): Promise<boolean> {
    try {
      // Update in car inventory tables
      const tables = ['cars', 'showroom_floor1', 'showroom_floor2', 'garage_cars'];
      
      for (const table of tables) {
        const { error } = await supabase
          .from(table)
          .update({ 
            pdi_status: status,
            pdi_completed: status === 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', carId);

        if (error) {
          console.error(`Failed to update PDI status in ${table}:`, error);
        }
      }

      return true;
    } catch (error) {
      console.error('Update car PDI status error:', error);
      return false;
    }
  }

  async getCarsNeedingPDI(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('car_inventory')
        .select('*')
        .or('pdi_status.is.null,pdi_status.eq.pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to get cars needing PDI:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Get cars needing PDI error:', error);
      return [];
    }
  }

  async getPDIHistory(carId: string): Promise<PDIStatus[]> {
    try {
      const { data, error } = await supabase
        .from('pdi_inspections')
        .select('*')
        .eq('car_id', carId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to get PDI history:', error);
        return [];
      }

      return (data || []).map(item => ({
        id: item.id,
        carId: item.car_id,
        status: item.status,
        technicianName: item.technician_name,
        inspectionDate: item.completion_date,
        notes: item.notes,
        overallScore: item.overall_score,
        issuesFound: item.issues_found,
        photos: item.photos,
        completionDate: item.completion_date
      }));
    } catch (error) {
      console.error('Get PDI history error:', error);
      return [];
    }
  }
}

export const pdiService = new PDIService(); 