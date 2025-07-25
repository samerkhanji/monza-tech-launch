
import { supabase } from '@/integrations/supabase/client';

export interface WorkflowEvent {
  eventType: string;
  entityType?: string;
  entityId?: string;
  userName?: string;
  metadata?: Record<string, any>;
}

export interface VinScanEvent {
  vinNumber: string;
  scanMethod: 'camera' | 'manual';
  scannedBy: string;
  carDestination?: string;
}

export interface PartScanEvent {
  partNumber: string;
  scanMethod: 'camera' | 'manual';
  scannedBy: string;
  photoUrl?: string;
  ocrConfidence?: number;
}

export interface PhotoTrackingEvent {
  photoUrl: string;
  context: string;
  relatedEntity: string;
  takenBy: string;
  entityId?: string;
  metadata?: Record<string, any>;
}

class WorkflowTrackingService {
  async trackEvent(event: WorkflowEvent): Promise<void> {
    try {
      // Using user_activity_logs table as fallback since workflow_tracking doesn't exist in schema
      const { error } = await supabase
        .from('user_activity_logs')
        .insert({
          activity_type: event.eventType,
          user_name: event.userName,
          description: `${event.entityType}: ${event.entityId}`,
          user_id: event.userName || 'unknown'
        });

      if (error) {
        console.error('Error tracking workflow event:', error);
      }
    } catch (error) {
      console.error('Error in workflow tracking:', error);
    }
  }

  async trackVinScan(vinScanData: VinScanEvent): Promise<void> {
    await this.trackEvent({
      eventType: 'vin_scan',
      entityType: 'vehicle',
      entityId: vinScanData.vinNumber,
      userName: vinScanData.scannedBy,
      metadata: {
        scanMethod: vinScanData.scanMethod,
        destination: vinScanData.carDestination
      }
    });
  }

  async trackPartScan(partScanData: PartScanEvent): Promise<void> {
    await this.trackEvent({
      eventType: 'part_scan',
      entityType: 'part',
      entityId: partScanData.partNumber,
      userName: partScanData.scannedBy,
      metadata: {
        scanMethod: partScanData.scanMethod,
        photoUrl: partScanData.photoUrl,
        ocrConfidence: partScanData.ocrConfidence
      }
    });
  }

  async trackPartUsage(partData: {
    partNumber: string;
    partName: string;
    quantity: number;
    usedBy?: string;
    carVin?: string;
    carModel?: string;
    clientName?: string;
    clientPhone?: string;
    clientLicensePlate?: string;
    repairId?: string;
    technician?: string;
    costPerUnit?: number;
    totalCost?: number;
  }): Promise<void> {
    await this.trackEvent({
      eventType: 'part_usage',
      entityType: 'part',
      entityId: partData.partNumber,
      userName: partData.usedBy || partData.technician || 'Unknown',
      metadata: {
        partName: partData.partName,
        quantity: partData.quantity,
        carVin: partData.carVin,
        carModel: partData.carModel,
        clientName: partData.clientName,
        clientPhone: partData.clientPhone,
        clientLicensePlate: partData.clientLicensePlate,
        repairId: partData.repairId,
        costPerUnit: partData.costPerUnit,
        totalCost: partData.totalCost
      }
    });
  }

  async trackClientInteraction(interactionData: {
    clientName: string;
    clientPhone?: string;
    clientLicensePlate?: string;
    carVin?: string;
    interactionType: string;
    details?: string;
    notes?: string;
    handledBy?: string;
    employee?: string;
  }): Promise<void> {
    await this.trackEvent({
      eventType: 'client_interaction',
      entityType: 'client',
      entityId: interactionData.clientName,
      userName: interactionData.handledBy || interactionData.employee || 'Unknown',
      metadata: {
        clientPhone: interactionData.clientPhone,
        clientLicensePlate: interactionData.clientLicensePlate,
        carVin: interactionData.carVin,
        interactionType: interactionData.interactionType,
        details: interactionData.details || interactionData.notes
      }
    });
  }

  async trackWorkflowEvent(eventData: {
    eventType: string;
    entityType: string;
    entityId: string;
    userName: string;
    details?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    await this.trackEvent({
      eventType: eventData.eventType,
      entityType: eventData.entityType,
      entityId: eventData.entityId,
      userName: eventData.userName,
      metadata: {
        details: eventData.details,
        ...eventData.metadata
      }
    });
  }

  async trackPhoto(
    photoUrl: string, 
    context: string, 
    relatedEntity: string, 
    takenBy: string, 
    entityId?: string, 
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.trackEvent({
      eventType: 'photo_capture',
      entityType: relatedEntity,
      entityId: entityId,
      userName: takenBy,
      metadata: {
        photoUrl,
        context,
        ...metadata
      }
    });
  }

  async getWorkflowHistory(entityType?: string, entityId?: string): Promise<any[]> {
    try {
      let query = supabase
        .from('user_activity_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (entityType) {
        query = query.ilike('description', `${entityType}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching workflow history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getWorkflowHistory:', error);
      return [];
    }
  }
}

export const workflowTrackingService = new WorkflowTrackingService();
