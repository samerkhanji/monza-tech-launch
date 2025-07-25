import { enhancedMonzaBotService } from './enhancedMonzaBotService';
import { centralCarService, CentralCarRecord } from './centralCarService';
import { toast } from '@/hooks/use-toast';

export interface MonzaBotWorkflowContext {
  action: 'pdi_assist' | 'move_car' | 'form_fill' | 'data_analysis' | 'general_help';
  vinNumber?: string;
  currentLocation?: string;
  targetLocation?: string;
  formType?: 'pdi' | 'new_arrival' | 'repair' | 'test_drive' | 'client_interaction';
  currentFormData?: any;
  userRole?: string;
  source?: string;
}

export interface MonzaBotWorkflowResponse {
  textResponse: string;
  audioResponse?: string;
  formFillData?: any;
  suggestedActions?: MonzaBotAction[];
  notifications?: MonzaBotNotification[];
  nextSteps?: string[];
}

export interface MonzaBotAction {
  type: 'move_car' | 'complete_pdi' | 'schedule_repair' | 'create_test_drive' | 'update_status';
  label: string;
  data: any;
  priority: 'high' | 'medium' | 'low';
}

export interface MonzaBotNotification {
  type: 'warning' | 'info' | 'success' | 'error';
  title: string;
  message: string;
  vinNumber?: string;
}

class EnhancedMonzaBotWorkflowService {
  
  // Main workflow assistance method
  async processWorkflowRequest(
    message: string, 
    context: MonzaBotWorkflowContext
  ): Promise<MonzaBotWorkflowResponse> {
    try {
      // Get relevant car data if VIN is provided
      let carData: CentralCarRecord | null = null;
      if (context.vinNumber) {
        carData = centralCarService.getCarByVIN(context.vinNumber);
      }

      // Process based on action type
      switch (context.action) {
        case 'pdi_assist':
          return await this.handlePDIAssistance(message, context, carData);
        case 'move_car':
          return await this.handleCarMovement(message, context, carData);
        case 'form_fill':
          return await this.handleFormFilling(message, context, carData);
        case 'data_analysis':
          return await this.handleDataAnalysis(message, context, carData);
        default:
          return await this.handleGeneralAssistance(message, context, carData);
      }
    } catch (error) {
      console.error('MonzaBot workflow error:', error);
      return {
        textResponse: "I encountered an error processing your request. Please try again or contact support.",
        notifications: [{
          type: 'error',
          title: 'Processing Error',
          message: 'MonzaBot encountered an error while processing your request.'
        }]
      };
    }
  }

  // PDI Form Assistance
  async handlePDIAssistance(
    message: string, 
    context: MonzaBotWorkflowContext, 
    carData: CentralCarRecord | null
  ): Promise<MonzaBotWorkflowResponse> {
    if (!carData) {
      return {
        textResponse: "I need a VIN number to assist with PDI. Please provide the VIN of the vehicle you're working on.",
        notifications: [{
          type: 'warning',
          title: 'VIN Required',
          message: 'VIN number is required for PDI assistance.'
        }]
      };
    }

    // Generate PDI checklist based on car model and type
    const pdiTemplate = this.generatePDITemplate(carData);
    
    // Analyze message for specific PDI assistance
    const specificHelp = this.analyzePDIRequest(message);
    
    let textResponse = `I'll help you with the PDI for ${carData.model} (VIN: ${carData.vinNumber}). `;
    
    if (specificHelp.includes('checklist')) {
      textResponse += "Here's the standard PDI checklist for this vehicle.";
    } else if (specificHelp.includes('electrical')) {
      textResponse += "For electrical systems, check: Battery voltage, all lights, charging system, and electrical connections.";
    } else if (specificHelp.includes('mechanical')) {
      textResponse += "For mechanical inspection: Check brakes, suspension, steering, drivetrain, and fluid levels.";
    } else {
      textResponse += "I can help with the complete PDI process. What specific area would you like assistance with?";
    }

    return {
      textResponse,
      formFillData: pdiTemplate,
      suggestedActions: [
        {
          type: 'complete_pdi',
          label: 'Start PDI Inspection',
          data: { vinNumber: carData.vinNumber, template: pdiTemplate },
          priority: 'high'
        },
        {
          type: 'move_car',
          label: 'Move to Garage',
          data: { vinNumber: carData.vinNumber, targetLocation: 'garage_inventory' },
          priority: 'medium'
        }
      ],
      nextSteps: [
        'Complete the PDI checklist',
        'Document any issues found',
        'Take photos of any damage',
        'Update vehicle status'
      ]
    };
  }

  // Car Movement Assistance
  async handleCarMovement(
    message: string, 
    context: MonzaBotWorkflowContext, 
    carData: CentralCarRecord | null
  ): Promise<MonzaBotWorkflowResponse> {
    if (!carData) {
      return {
        textResponse: "I need a VIN number to help move a vehicle. Please specify which car you want to move.",
        notifications: [{
          type: 'warning',
          title: 'VIN Required',
          message: 'VIN number is required for vehicle movement.'
        }]
      };
    }

    const currentLocation = carData.currentLocation;
    const suggestedMoves = this.getSuggestedMoves(currentLocation, carData);
    
    let textResponse = `The ${carData.model} (VIN: ${carData.vinNumber}) is currently in ${currentLocation.replace('_', ' ')}. `;
    
    if (context.targetLocation) {
      // Validate the move
      const isValidMove = this.validateMove(currentLocation, context.targetLocation);
      if (isValidMove) {
        textResponse += `I can help you move this vehicle to ${context.targetLocation.replace('_', ' ')}. `;
      } else {
        textResponse += `Sorry, vehicles cannot be moved directly from ${currentLocation.replace('_', ' ')} to ${context.targetLocation.replace('_', ' ')}. `;
        textResponse += `Valid destinations are: ${suggestedMoves.map(m => m.location.replace('_', ' ')).join(', ')}.`;
      }
    } else {
      textResponse += `Possible destinations: ${suggestedMoves.map(m => m.location.replace('_', ' ')).join(', ')}.`;
    }

    return {
      textResponse,
      suggestedActions: suggestedMoves.map(move => ({
        type: 'move_car' as const,
        label: `Move to ${move.location.replace('_', ' ')}`,
        data: { 
          vinNumber: carData.vinNumber, 
          fromLocation: currentLocation,
          targetLocation: move.location,
          reason: move.reason 
        },
        priority: move.priority
      })),
      nextSteps: suggestedMoves.map(move => move.reason)
    };
  }

  // Form Filling Assistance
  async handleFormFilling(
    message: string, 
    context: MonzaBotWorkflowContext, 
    carData: CentralCarRecord | null
  ): Promise<MonzaBotWorkflowResponse> {
    const formType = context.formType || 'general';
    
    let formTemplate: any = {};
    let textResponse = `I'll help you fill out the ${formType} form. `;

    switch (formType) {
      case 'new_arrival':
        formTemplate = this.generateNewArrivalTemplate(carData);
        textResponse += "I've pre-filled the form with available vehicle data.";
        break;
      case 'pdi':
        formTemplate = this.generatePDITemplate(carData);
        textResponse += "Here's the PDI checklist template for this vehicle.";
        break;
      case 'repair':
        formTemplate = this.generateRepairTemplate(carData);
        textResponse += "I've created a repair order template based on vehicle history.";
        break;
      case 'test_drive':
        formTemplate = this.generateTestDriveTemplate(carData);
        textResponse += "Test drive form is ready with vehicle information.";
        break;
      default:
        textResponse += "What type of form would you like help with?";
    }

    return {
      textResponse,
      formFillData: formTemplate,
      suggestedActions: [
        {
          type: 'update_status',
          label: `Complete ${formType} Form`,
          data: { formType, template: formTemplate },
          priority: 'high'
        }
      ]
    };
  }

  // Data Analysis Assistance
  async handleDataAnalysis(
    message: string, 
    context: MonzaBotWorkflowContext, 
    carData: CentralCarRecord | null
  ): Promise<MonzaBotWorkflowResponse> {
    const allCars = centralCarService.getAllCars();
    
    let analysis = '';
    let textResponse = '';

    if (context.vinNumber && carData) {
      // Single car analysis
      analysis = this.analyzeCarData(carData);
      textResponse = `Analysis for ${carData.model} (VIN: ${carData.vinNumber}):\n${analysis}`;
    } else {
      // Fleet analysis
      analysis = this.analyzeFleetData(allCars);
      textResponse = `Fleet Analysis:\n${analysis}`;
    }

    const recommendations = this.generateRecommendations(carData || allCars);

    return {
      textResponse: textResponse + `\n\nRecommendations:\n${recommendations.join('\n')}`,
      suggestedActions: this.generateAnalysisActions(carData, allCars),
      nextSteps: recommendations
    };
  }

  // General Assistance
  async handleGeneralAssistance(
    message: string, 
    context: MonzaBotWorkflowContext, 
    carData: CentralCarRecord | null
  ): Promise<MonzaBotWorkflowResponse> {
    // Use the existing enhanced MonzaBot service for general queries
    const response = await enhancedMonzaBotService.processEnhancedMessage(message, {
      source: context.source || 'workflow_integration',
      currentRoute: '/workflow',
      vinNumber: context.vinNumber,
      carData: carData
    });

    return {
      textResponse: response.textResponse,
      audioResponse: response.audioResponse,
      formFillData: response.formFillData
    };
  }

  // Helper Methods
  private generatePDITemplate(carData: CentralCarRecord | null): any {
    return {
      vinNumber: carData?.vinNumber || '',
      model: carData?.model || '',
      technician: '',
      date: new Date().toISOString().split('T')[0],
      checklist: [
        { category: 'Exterior', item: 'Body condition and paint', status: '', notes: '' },
        { category: 'Interior', item: 'Seats, dashboard, controls', status: '', notes: '' },
        { category: 'Electrical', item: 'All lights and electrical systems', status: '', notes: '' },
        { category: 'Mechanical', item: 'Engine, brakes, suspension', status: '', notes: '' },
        { category: 'Safety', item: 'Airbags, seatbelts, safety systems', status: '', notes: '' }
      ],
      overallStatus: 'pending',
      notes: '',
      photos: []
    };
  }

  private generateNewArrivalTemplate(carData: CentralCarRecord | null): any {
    return {
      vinNumber: carData?.vinNumber || '',
      model: carData?.model || '',
      color: carData?.color || '',
      arrivalDate: new Date().toISOString().split('T')[0],
      shipmentCode: carData?.shipmentCode || '',
      condition: 'new',
      mileage: 0,
      batteryLevel: carData?.batteryLevel || 0,
      documentsReceived: false,
      notes: ''
    };
  }

  private generateRepairTemplate(carData: CentralCarRecord | null): any {
    return {
      vinNumber: carData?.vinNumber || '',
      model: carData?.model || '',
      repairType: '',
      description: '',
      priority: 'medium',
      estimatedTime: '',
      partsNeeded: [],
      assignedTechnician: '',
      scheduledDate: '',
      notes: ''
    };
  }

  private generateTestDriveTemplate(carData: CentralCarRecord | null): any {
    return {
      vinNumber: carData?.vinNumber || '',
      model: carData?.model || '',
      clientName: '',
      clientPhone: '',
      driverLicense: '',
      startTime: '',
      expectedDuration: 30,
      route: 'Standard test route',
      notes: ''
    };
  }

  private getSuggestedMoves(currentLocation: string, carData: CentralCarRecord): any[] {
    const moves = [];
    
    switch (currentLocation) {
      case 'new_arrivals':
        moves.push({
          location: 'car_inventory',
          reason: 'Initial processing completed',
          priority: 'high' as const
        });
        break;
      case 'car_inventory':
        if (!carData.pdiHistory?.length) {
          moves.push({
            location: 'garage_inventory',
            reason: 'PDI inspection required',
            priority: 'high' as const
          });
        } else {
          moves.push({
            location: 'showroom_floor_1',
            reason: 'Ready for display',
            priority: 'medium' as const
          });
        }
        break;
      case 'garage_inventory':
        moves.push({
          location: 'car_inventory',
          reason: 'PDI completed',
          priority: 'medium' as const
        });
        break;
      default:
        break;
    }
    
    return moves;
  }

  private validateMove(from: string, to: string): boolean {
    const validMoves: Record<string, string[]> = {
      'new_arrivals': ['car_inventory'],
      'car_inventory': ['garage_inventory', 'showroom_floor_1', 'showroom_floor_2', 'repairs'],
      'garage_inventory': ['car_inventory', 'repairs', 'garage_schedule'],
      'showroom_floor_1': ['showroom_floor_2', 'sold'],
      'showroom_floor_2': ['showroom_floor_1', 'sold'],
      'repairs': ['garage_inventory', 'car_inventory'],
      'sold': ['shipped']
    };
    
    return validMoves[from]?.includes(to) || false;
  }

  private analyzeCarData(carData: CentralCarRecord): string {
    let analysis = '';
    
    analysis += `Status: ${carData.status}\n`;
    analysis += `Location: ${carData.currentLocation}\n`;
    
    if (carData.pdiHistory?.length) {
      const lastPDI = carData.pdiHistory[0];
      analysis += `Last PDI: ${lastPDI.status} on ${lastPDI.completedAt}\n`;
    } else {
      analysis += `PDI Status: Not completed\n`;
    }
    
    return analysis;
  }

  private analyzeFleetData(cars: CentralCarRecord[]): string {
    const totalCars = cars.length;
    const pdiCompleted = cars.filter(c => c.pdiHistory?.some(p => p.status === 'passed')).length;
    const inRepairs = cars.filter(c => c.currentLocation === 'repairs').length;
    const sold = cars.filter(c => c.status === 'sold').length;
    
    return `Total Vehicles: ${totalCars}
PDI Completed: ${pdiCompleted}/${totalCars} (${Math.round(pdiCompleted/totalCars*100)}%)
In Repairs: ${inRepairs}
Sold: ${sold}`;
  }

  private generateRecommendations(data: CentralCarRecord | CentralCarRecord[]): string[] {
    const recommendations = [];
    
    if (Array.isArray(data)) {
      // Fleet recommendations
      const noPDI = data.filter(c => !c.pdiHistory?.length);
      if (noPDI.length > 0) {
        recommendations.push(`${noPDI.length} vehicles need PDI inspection`);
      }
    } else {
      // Single car recommendations
      if (!data.pdiHistory?.length) {
        recommendations.push('Schedule PDI inspection');
      }
    }
    
    return recommendations;
  }

  private generateAnalysisActions(carData: CentralCarRecord | null, allCars: CentralCarRecord[]): MonzaBotAction[] {
    const actions: MonzaBotAction[] = [];
    
    if (carData && !carData.pdiHistory?.length) {
      actions.push({
        type: 'complete_pdi',
        label: 'Schedule PDI',
        data: { vinNumber: carData.vinNumber },
        priority: 'high'
      });
    }
    
    return actions;
  }

  private analyzePDIRequest(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('checklist') || lowerMessage.includes('list')) {
      return 'checklist';
    } else if (lowerMessage.includes('electrical') || lowerMessage.includes('battery')) {
      return 'electrical';
    } else if (lowerMessage.includes('mechanical') || lowerMessage.includes('engine')) {
      return 'mechanical';
    }
    
    return 'general';
  }
}

export const enhancedMonzaBotWorkflowService = new EnhancedMonzaBotWorkflowService();
