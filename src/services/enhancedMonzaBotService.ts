import { supabase } from '@/integrations/supabase/client';
import { AuthUser } from '@/lib/auth';

interface MonzaBotContext {
  currentRoute?: string;
  source?: string;
  user?: AuthUser | null;
  imageData?: string;
  formType?: 'new_car_arrival' | 'repair' | 'inventory' | 'parts' | 'schedule' | 'calendar' | 'ordered_cars' | 'photo_documentation';
  extractedData?: any;
  timestamp?: string;
  shippingCompany?: string;
  company?: string;
  trackingCode?: string;
  currentFormData?: any;
  repairPhotos?: any[];
}

export interface EnhancedMonzaBotResponse {
  textResponse: string;
  audioResponse?: string;
  formFillData?: any;
  type: string;
  databaseContext?: any;
  suggestedActions?: any;
}

export const enhancedMonzaBotService = {
  async processEnhancedMessage(
    message: string, 
    context: MonzaBotContext = {},
    audioEnabled: boolean = true
  ): Promise<EnhancedMonzaBotResponse> {
    try {
      console.log('Enhanced MonzaBot: Processing message:', message);
      
      const { data, error } = await supabase.functions.invoke('monzabot-enhanced', {
        body: {
          message,
          context: {
            ...context,
            userRole: context.user?.role,
            currentRoute: window.location.pathname,
            timestamp: new Date().toISOString()
          },
          imageData: context.imageData,
          audioEnabled
        }
      });
      
      if (error) {
        console.error('Enhanced MonzaBot error:', error);
        // Fallback response for demo purposes
        return {
          textResponse: `Hello! I'm MonzaBot. I received your message: "${message}". I can help you with car inventory, VIN lookups, repairs, and much more. What would you like to know?`,
          audioResponse: undefined,
          type: 'fallback_response'
        };
      }
      
      return {
        textResponse: data.textResponse,
        audioResponse: data.audioResponse,
        formFillData: data.formFillData,
        type: data.type || 'assistant_response',
        databaseContext: data.databaseContext,
        suggestedActions: data.suggestedActions
      };
    } catch (error) {
      console.error('Enhanced MonzaBot service error:', error);
      // Always provide a helpful fallback response
      return {
        textResponse: `Hello! I'm MonzaBot, your Monza S.A.L. assistant. I received: "${message}". I can help you with:\n\n🚗 Car inventory and VIN lookups\n🔧 Repair management\n📊 Analytics and reports\n📍 Car locations and movements\n📋 PDI assistance\n\nWhat would you like help with?`,
        audioResponse: undefined,
        type: 'fallback_response'
      };
    }
  },

  async analyzeCarImage(imageDataUrl: string, context: MonzaBotContext = {}): Promise<EnhancedMonzaBotResponse> {
    return this.processEnhancedMessage(
      "Analyze this car image and extract all visible information for new car arrival processing. Provide structured data that can auto-fill forms.",
      {
        ...context,
        imageData: imageDataUrl,
        source: 'car_image_analysis'
      }
    );
  },

  async processImageOCR(imageDataUrl: string): Promise<{ extractedData: any }> {
    const response = await this.processEnhancedMessage(
      "Extract text and data from this image using OCR. Return structured information.",
      {
        imageData: imageDataUrl,
        source: 'image_ocr'
      }
    );
    
    return {
      extractedData: response.formFillData || {}
    };
  },

  async processVoiceToText(audioBlob: Blob): Promise<{ text: string }> {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      
      const { data, error } = await supabase.functions.invoke('voice-to-text', {
        body: formData
      });
      
      if (error) throw error;
      
      return { text: data.text || '' };
    } catch (error) {
      console.error('Voice to text error:', error);
      throw new Error('Failed to process voice input');
    }
  },

  async suggestFormFill(formType: string, data: any): Promise<any> {
    const response = await this.processEnhancedMessage(
      `Generate form suggestions for ${formType} based on this data: ${JSON.stringify(data)}`,
      {
        source: 'form_suggestions',
        formType: formType as any,
        extractedData: data
      }
    );
    
    return response.formFillData || {};
  },

  async getShippingUpdates(trackingInfo?: string): Promise<EnhancedMonzaBotResponse> {
    const message = trackingInfo 
      ? `Check shipping status and ETA for tracking: ${trackingInfo}`
      : "Check all pending shipments and provide ETA updates";
      
    return this.processEnhancedMessage(message, {
      source: 'shipping_updates',
      currentRoute: '/ordered-parts',
      trackingCode: trackingInfo
    });
  },

  async getInventoryInsights(): Promise<EnhancedMonzaBotResponse> {
    return this.processEnhancedMessage(
      "Analyze current inventory status, identify low stock items, and recommend actions based on recent activity",
      {
        source: 'inventory_analysis',
        currentRoute: '/inventory'
      }
    );
  },

  async getNewArrivalAssistance(carData?: any): Promise<EnhancedMonzaBotResponse> {
    const message = carData
      ? `Help process this new car arrival: ${JSON.stringify(carData)}`
      : "Provide guidance for processing new car arrivals and current arrival status";
    
    return this.processEnhancedMessage(message, {
      source: 'new_arrivals',
      currentRoute: '/new-car-arrivals',
      formType: 'new_car_arrival',
      extractedData: carData
    });
  },

  async getShippingETAUpdates(): Promise<EnhancedMonzaBotResponse> {
    return this.processEnhancedMessage(
      "Provide daily updates on shipping ETAs for ordered cars and parts. Notify of any delays or changes in expected delivery dates.",
      {
        source: 'shipping_eta_updates',
        currentRoute: '/shipping-eta'
      }
    );
  },

  async trackShipment(trackingCode: string, shippingCompany: string): Promise<EnhancedMonzaBotResponse> {
    return this.processEnhancedMessage(
      `Track shipment status for: ${trackingCode} with ${shippingCompany}`,
      {
        source: 'shipment_tracking',
        trackingCode,
        shippingCompany
      }
    );
  },

  async scheduleDailyETACheck(): Promise<void> {
    try {
      console.log('Scheduling daily ETA checks');
      
      // This would typically be scheduled using a cron job on the server
      // For now, we'll simulate by logging the intent
      
      await this.processEnhancedMessage(
        "Schedule daily shipping ETA updates and notifications for any delays",
        {
          source: 'eta_scheduling',
          timestamp: new Date().toISOString()
        }
      );
      
    } catch (error) {
      console.error('Failed to schedule ETA checks:', error);
    }
  },

  async notifyShippingDelay(orderId: string, orderType: 'car' | 'part'): Promise<void> {
    try {
      const message = `Shipping delay detected for ${orderType} order ${orderId}. Please notify relevant stakeholders.`;
      
      await this.processEnhancedMessage(message, {
        source: 'shipping_delay',
        extractedData: { orderId, orderType }
      });
      
    } catch (error) {
      console.error('Failed to process shipping delay notification:', error);
    }
  },

  async learnFromRepairPhotos(repairSession: any): Promise<EnhancedMonzaBotResponse> {
    try {
      const message = `Learn from this repair session with photo documentation. Analyze patterns, identify common issues, and improve future repair recommendations.
      
      Car: ${repairSession.carModel} (${repairSession.carCode})
      Customer: ${repairSession.customerName}
      Mechanic: ${repairSession.mechanicName}
      Issue: ${repairSession.issueDescription}
      Work Notes: ${repairSession.workNotes}
      
      Photo Documentation:
      - Total Photos: ${repairSession.photoCount}
      - Before Photos: ${repairSession.beforePhotos?.length || 0}
      - During Photos: ${repairSession.duringPhotos?.length || 0}
      - After Photos: ${repairSession.afterPhotos?.length || 0}
      - Issue Photos: ${repairSession.issuePhotos?.length || 0}
      
      Please analyze this repair case and add it to your knowledge base for future similar issues.`;

      return await this.processEnhancedMessage(message, {
        source: 'repair_photo_learning',
        formType: 'photo_documentation',
        extractedData: repairSession,
        repairPhotos: repairSession.repairPhotos
      });
    } catch (error) {
      console.error('Failed to learn from repair photos:', error);
      throw new Error('Failed to process repair photo learning');
    }
  },

  async analyzeRepairPhotos(photos: any[], carModel: string, issueDescription: string): Promise<EnhancedMonzaBotResponse> {
    try {
      const photoAnalysis = photos.map(photo => ({
        type: photo.photoType,
        description: photo.description,
        timestamp: photo.timestamp,
        mechanicName: photo.mechanicName,
        issueCategory: photo.issueCategory || 'general',
        severity: photo.severity || 'minor'
      }));

      const message = `Analyze these repair photos for ${carModel} with issue: "${issueDescription}". 
      
      Photo Details:
      ${JSON.stringify(photoAnalysis, null, 2)}
      
      Please provide:
      1. Pattern analysis of similar issues
      2. Recommendations for future repairs
      3. Quality assessment of documentation
      4. Suggested preventive measures`;

      return await this.processEnhancedMessage(message, {
        source: 'repair_photo_analysis',
        formType: 'photo_documentation',
        extractedData: {
          carModel,
          issueDescription,
          photoAnalysis,
          photoCount: photos.length
        }
      });
    } catch (error) {
      console.error('Failed to analyze repair photos:', error);
      throw new Error('Failed to analyze repair photos');
    }
  },

  async getRepairSuggestions(carModel: string, issueDescription: string): Promise<EnhancedMonzaBotResponse> {
    try {
      // Load historical repair photo data to provide context
      const enhancedHistory = JSON.parse(localStorage.getItem('enhanced_repair_sessions') || '[]');
      const enhancedPhotos = JSON.parse(localStorage.getItem('enhanced_repair_photos') || '[]');
      
      const similarCases = enhancedHistory.filter((session: any) => 
        session.carModel.toLowerCase().includes(carModel.toLowerCase()) ||
        session.issueDescription.toLowerCase().includes(issueDescription.toLowerCase())
      );

      const message = `Based on ${similarCases.length} similar repair cases with photo documentation, provide repair suggestions for:
      
      Car Model: ${carModel}
      Issue: ${issueDescription}
      
      Please provide:
      1. Step-by-step repair guidance
      2. Parts likely needed
      3. Time estimation
      4. Potential complications to watch for
      5. Photo documentation recommendations`;

      return await this.processEnhancedMessage(message, {
        source: 'repair_suggestions_with_photos',
        formType: 'repair',
        extractedData: {
          carModel,
          issueDescription,
          similarCasesCount: similarCases.length,
          historicalData: similarCases.slice(0, 5) // Send max 5 cases for context
        }
      });
    } catch (error) {
      console.error('Failed to get repair suggestions:', error);
      throw new Error('Failed to get repair suggestions');
    }
  },

  async analyzePhotoDocumentationQuality(repairSession: any): Promise<EnhancedMonzaBotResponse> {
    try {
      const qualityMetrics = {
        hasBeforePhotos: repairSession.beforePhotos?.length > 0,
        hasAfterPhotos: repairSession.afterPhotos?.length > 0,
        hasDuringPhotos: repairSession.duringPhotos?.length > 0,
        hasIssuePhotos: repairSession.issuePhotos?.length > 0,
        totalPhotos: repairSession.photoCount,
        photoDescriptionQuality: repairSession.repairPhotos?.every((p: any) => p.description && p.description.length > 10),
        mechanicConsistency: repairSession.repairPhotos?.every((p: any) => p.mechanicName === repairSession.mechanicName)
      };

      const message = `Analyze the quality of photo documentation for this repair session:
      
      ${JSON.stringify(qualityMetrics, null, 2)}
      
      Provide feedback on documentation quality and suggestions for improvement.`;

      return await this.processEnhancedMessage(message, {
        source: 'photo_quality_analysis',
        formType: 'photo_documentation',
        extractedData: {
          ...repairSession,
          qualityMetrics
        }
      });
    } catch (error) {
      console.error('Failed to analyze photo documentation quality:', error);
      throw new Error('Failed to analyze photo documentation quality');
    }
  },

  async searchRepairsByPhotos(searchQuery: string): Promise<EnhancedMonzaBotResponse> {
    try {
      // Load all repair sessions with photos
      const enhancedHistory = JSON.parse(localStorage.getItem('enhanced_repair_sessions') || '[]');
      const photosHistory = JSON.parse(localStorage.getItem('enhanced_repair_photos') || '[]');
      
      const sessionsWithPhotos = enhancedHistory.filter((session: any) => 
        session.monzaBotLearning?.hasPhotos && session.photoCount > 0
      );

      const message = `Search through ${sessionsWithPhotos.length} repair sessions with photo documentation for: "${searchQuery}"
      
      Please find relevant repair cases and provide:
      1. Matching repair cases
      2. Photo-documented solutions
      3. Success patterns
      4. Lessons learned`;

      return await this.processEnhancedMessage(message, {
        source: 'photo_repair_search',
        formType: 'photo_documentation',
        extractedData: {
          searchQuery,
          availableSessions: sessionsWithPhotos.length,
          searchContext: sessionsWithPhotos.slice(0, 10) // Send sample for context
        }
      });
    } catch (error) {
      console.error('Failed to search repairs by photos:', error);
      throw new Error('Failed to search repair history');
    }
  },

  async generateRepairReport(carCode: string): Promise<EnhancedMonzaBotResponse> {
    try {
      // Load all repair data for the specific car
      const carPhotos = JSON.parse(localStorage.getItem(`car_photos_${carCode}`) || '[]');
      const enhancedHistory = JSON.parse(localStorage.getItem('enhanced_repair_sessions') || '[]');
      
      const carSessions = enhancedHistory.filter((session: any) => session.carCode === carCode);

      const message = `Generate a comprehensive repair report for car ${carCode} based on:
      
      - ${carPhotos.length} photos documented
      - ${carSessions.length} repair sessions
      
      Include:
      1. Repair history timeline
      2. Common issues identified
      3. Photo documentation quality
      4. Maintenance recommendations
      5. Value assessment`;

      return await this.processEnhancedMessage(message, {
        source: 'repair_report_generation',
        formType: 'photo_documentation',
        extractedData: {
          carCode,
          photoCount: carPhotos.length,
          sessionCount: carSessions.length,
          repairData: carSessions
        }
      });
    } catch (error) {
      console.error('Failed to generate repair report:', error);
      throw new Error('Failed to generate repair report');
    }
  }
};
