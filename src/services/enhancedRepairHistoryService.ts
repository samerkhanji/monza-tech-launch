import { supabase } from '@/integrations/supabase/client';
import { EnhancedRepairHistory, PartUsed, PartsKnowledgeBase, RepairSolutionsKB } from '@/types';
import { enhancedMonzaBotService } from './enhancedMonzaBotService';

// Helper function to sanitize null/undefined values for TypeScript compatibility
const sanitizeForType = (data: any): any => {
  if (Array.isArray(data)) {
    return data.map(item => sanitizeForType(item));
  }
  
  if (data && typeof data === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (value === null) {
        sanitized[key] = undefined;
      } else {
        sanitized[key] = sanitizeForType(value);
      }
    }
    return sanitized;
  }
  
  return data === null ? undefined : data;
};

// Type guards and utility functions
const isValidDifficultyLevel = (value: string): value is 'easy' | 'medium' | 'hard' | 'expert' => {
  return ['easy', 'medium', 'hard', 'expert'].includes(value);
};

const isValidInstallationDifficulty = (value: string): value is 'easy' | 'medium' | 'hard' => {
  return ['easy', 'medium', 'hard'].includes(value);
};

const sanitizeDifficultyLevel = (value: string | null | undefined): 'easy' | 'medium' | 'hard' | 'expert' => {
  if (value && isValidDifficultyLevel(value)) {
    return value;
  }
  return 'medium'; // default fallback
};

const sanitizeInstallationDifficulty = (value: string | null | undefined): 'easy' | 'medium' | 'hard' => {
  if (value && isValidInstallationDifficulty(value)) {
    return value;
  }
  return 'medium'; // default fallback
};

// LocalStorage fallback for missing tables
const getLocalStorageData = (key: string): any[] => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Error reading localStorage for ${key}:`, error);
    return [];
  }
};

const setLocalStorageData = (key: string, data: any[]): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error writing localStorage for ${key}:`, error);
  }
};

export class EnhancedRepairHistoryService {
  // Save detailed repair history
  async saveRepairHistory(repairData: Omit<EnhancedRepairHistory, 'id' | 'created_at' | 'updated_at'>): Promise<EnhancedRepairHistory | null> {
    try {
      // Convert parts_used to JSON for storage
      const dataForInsert = {
        ...repairData,
        parts_used: JSON.stringify(repairData.parts_used),
        difficulty_level: sanitizeDifficultyLevel(repairData.difficulty_level),
        id: `repair_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Try Supabase first, fallback to localStorage
      try {
        const { data, error } = await supabase
          .from('audit_logs') // Use existing table as fallback
          .insert([{
            table_name: 'enhanced_repair_history',
            record_id: dataForInsert.id,
            action: 'INSERT',
            new_data: dataForInsert,
            user_id: 'system',
            user_email: 'system@monza.tech',
            user_role: 'system',
            ip_address: '127.0.0.1',
            user_agent: 'MonzaTech-System',
            timestamp: new Date().toISOString()
          }])
          .select()
          .single();

        if (error) throw error;
      } catch (supabaseError) {
        console.warn('Supabase insert failed, using localStorage fallback:', supabaseError);
      }

      // Always store in localStorage as backup
      const existingData = getLocalStorageData('enhanced_repair_history');
      existingData.push(dataForInsert);
      setLocalStorageData('enhanced_repair_history', existingData);

      // Convert back to proper type
      const result: EnhancedRepairHistory = {
        ...dataForInsert,
        parts_used: typeof dataForInsert.parts_used === 'string' ? JSON.parse(dataForInsert.parts_used) : dataForInsert.parts_used,
        difficulty_level: sanitizeDifficultyLevel(dataForInsert.difficulty_level)
      };

      // Update parts knowledge base
      await this.updatePartsKnowledge(repairData.parts_used, repairData.car_model);

      // Save repair solution to knowledge base
      await this.saveRepairSolution(repairData);

      // Notify MonzaBot to learn from this repair
      await this.notifyMonzaBotLearning(result);

      return result;
    } catch (error) {
      console.error('Error saving repair history:', error);
      return null;
    }
  }

  // Get repair history for a specific car
  async getCarRepairHistory(carVin: string): Promise<EnhancedRepairHistory[]> {
    try {
      // Try Supabase first
      try {
        const { data, error } = await supabase
          .from('audit_logs')
          .select('*')
          .eq('table_name', 'enhanced_repair_history')
          .contains('new_data', { car_vin: carVin })
          .order('timestamp', { ascending: false });

        if (!error && data) {
          return data
            .map(item => item.new_data)
            .filter(Boolean)
            .map(item => sanitizeForType({
              ...item,
              parts_used: typeof item.parts_used === 'string' ? JSON.parse(item.parts_used) : item.parts_used,
              difficulty_level: sanitizeDifficultyLevel(item.difficulty_level)
            }));
        }
      } catch (supabaseError) {
        console.warn('Supabase query failed, using localStorage fallback:', supabaseError);
      }

      // Fallback to localStorage
      const allData = getLocalStorageData('enhanced_repair_history');
      return allData
        .filter(item => item.car_vin === carVin)
        .map(item => sanitizeForType({
          ...item,
          parts_used: typeof item.parts_used === 'string' ? JSON.parse(item.parts_used) : item.parts_used,
          difficulty_level: sanitizeDifficultyLevel(item.difficulty_level)
        }));
    } catch (error) {
      console.error('Error fetching car repair history:', error);
      return [];
    }
  }

  // Get repair history for a client
  async getClientRepairHistory(clientName: string): Promise<EnhancedRepairHistory[]> {
    try {
      // Try Supabase first
      try {
        const { data, error } = await supabase
          .from('audit_logs')
          .select('*')
          .eq('table_name', 'enhanced_repair_history')
          .ilike('new_data->client_name', `%${clientName}%`)
          .order('timestamp', { ascending: false });

        if (!error && data) {
          return data
            .map(item => item.new_data)
            .filter(Boolean)
            .map(item => sanitizeForType({
              ...item,
              parts_used: typeof item.parts_used === 'string' ? JSON.parse(item.parts_used) : item.parts_used,
              difficulty_level: sanitizeDifficultyLevel(item.difficulty_level)
            }));
        }
      } catch (supabaseError) {
        console.warn('Supabase query failed, using localStorage fallback:', supabaseError);
      }

      // Fallback to localStorage
      const allData = getLocalStorageData('enhanced_repair_history');
      return allData
        .filter(item => item.client_name?.toLowerCase().includes(clientName.toLowerCase()))
        .map(item => sanitizeForType({
          ...item,
          parts_used: typeof item.parts_used === 'string' ? JSON.parse(item.parts_used) : item.parts_used,
          difficulty_level: sanitizeDifficultyLevel(item.difficulty_level)
        }));
    } catch (error) {
      console.error('Error fetching client repair history:', error);
      return [];
    }
  }

  // Search repair history
  async searchRepairHistory(searchTerm: string): Promise<EnhancedRepairHistory[]> {
    try {
      // Try Supabase first
      try {
        const { data, error } = await supabase
          .from('audit_logs')
          .select('*')
          .eq('table_name', 'enhanced_repair_history')
          .or(`new_data->car_vin.ilike.%${searchTerm}%,new_data->client_name.ilike.%${searchTerm}%,new_data->issue_description.ilike.%${searchTerm}%,new_data->solution_description.ilike.%${searchTerm}%`)
          .order('timestamp', { ascending: false });

        if (!error && data) {
          return data
            .map(item => item.new_data)
            .filter(Boolean)
            .map(item => sanitizeForType({
              ...item,
              parts_used: typeof item.parts_used === 'string' ? JSON.parse(item.parts_used) : item.parts_used,
              difficulty_level: sanitizeDifficultyLevel(item.difficulty_level)
            }));
        }
      } catch (supabaseError) {
        console.warn('Supabase query failed, using localStorage fallback:', supabaseError);
      }

      // Fallback to localStorage
      const allData = getLocalStorageData('enhanced_repair_history');
      const searchLower = searchTerm.toLowerCase();
      return allData
        .filter(item => 
          item.car_vin?.toLowerCase().includes(searchLower) ||
          item.client_name?.toLowerCase().includes(searchLower) ||
          item.issue_description?.toLowerCase().includes(searchLower) ||
          item.solution_description?.toLowerCase().includes(searchLower)
        )
        .map(item => sanitizeForType({
          ...item,
          parts_used: typeof item.parts_used === 'string' ? JSON.parse(item.parts_used) : item.parts_used,
          difficulty_level: sanitizeDifficultyLevel(item.difficulty_level)
        }));
    } catch (error) {
      console.error('Error searching repair history:', error);
      return [];
    }
  }

  // Update parts knowledge base
  private async updatePartsKnowledge(partsUsed: PartUsed[], carModel: string): Promise<void> {
    try {
      const existingData = getLocalStorageData('parts_knowledge_base');
      
      for (const part of partsUsed) {
        const existingPart = existingData.find(p => p.part_number === part.part_number);
        
        if (existingPart) {
          // Update existing part knowledge
          const compatibleModels = existingPart.compatible_models || [];
          const updatedModels = Array.isArray(compatibleModels) 
            ? [...new Set([...compatibleModels, carModel])]
            : [carModel];

          existingPart.compatible_models = updatedModels;
          existingPart.usage_count = (existingPart.usage_count || 0) + 1;
          existingPart.updated_at = new Date().toISOString();
        } else {
          // Add new part
          existingData.push({
            id: `part_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            part_number: part.part_number,
            part_name: part.part_name,
            compatible_models: [carModel],
            usage_count: 1,
            installation_difficulty: 'medium',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
      }
      
      setLocalStorageData('parts_knowledge_base', existingData);
    } catch (error) {
      console.error('Error updating parts knowledge:', error);
    }
  }

  // Save repair solution to knowledge base
  private async saveRepairSolution(repairData: Omit<EnhancedRepairHistory, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
    try {
      // Extract keywords from issue description
      const keywords = repairData.issue_description
        .toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 3)
        .slice(0, 10);

      const solutionData = {
        id: `solution_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        issue_keywords: keywords,
        issue_description: repairData.issue_description,
        solution_description: repairData.solution_description,
        repair_steps: repairData.repair_steps,
        required_parts: JSON.stringify(repairData.parts_used),
        estimated_time_hours: repairData.labor_hours,
        difficulty_level: sanitizeDifficultyLevel(repairData.difficulty_level),
        car_models: [repairData.car_model],
        technician_notes: `Completed by ${repairData.technician_name}`,
        photos: repairData.after_photos || [],
        usage_count: 1,
        effectiveness_rating: repairData.quality_rating,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const existingData = getLocalStorageData('repair_solutions_kb');
      existingData.push(solutionData);
      setLocalStorageData('repair_solutions_kb', existingData);
    } catch (error) {
      console.error('Error saving repair solution:', error);
    }
  }

  // Notify MonzaBot to learn from new repair data
  private async notifyMonzaBotLearning(repairData: EnhancedRepairHistory): Promise<void> {
    try {
      const learningMessage = `New repair completed for ${repairData.car_model}:
        Issue: ${repairData.issue_description}
        Solution: ${repairData.solution_description}
        Parts used: ${repairData.parts_used.map(p => p.part_name).join(', ')}
        Duration: ${repairData.labor_hours} hours
        Please learn from this repair case for future assistance.`;

      await enhancedMonzaBotService.processEnhancedMessage(learningMessage, {
        source: 'repair_learning',
        formType: 'repair',
        extractedData: repairData
      });
    } catch (error) {
      console.error('Error notifying MonzaBot for learning:', error);
    }
  }

  // Get parts knowledge for MonzaBot assistance
  async getPartsKnowledge(partNumber?: string, carModel?: string): Promise<PartsKnowledgeBase[]> {
    try {
      const existingData = getLocalStorageData('parts_knowledge_base');
      
      let filteredData = existingData;

      if (partNumber) {
        filteredData = filteredData.filter(item => item.part_number === partNumber);
      }

      if (carModel) {
        filteredData = filteredData.filter(item => 
          item.compatible_models?.includes(carModel)
        );
      }

      // Sort by usage count
      filteredData.sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0));
      
      // Sanitize installation_difficulty for type safety
      return filteredData.map(item => ({
        ...item,
        installation_difficulty: sanitizeInstallationDifficulty(item.installation_difficulty)
      }));
    } catch (error) {
      console.error('Error fetching parts knowledge:', error);
      return [];
    }
  }

  // Get repair solutions for MonzaBot assistance
  async getRepairSolutions(issueKeywords: string[], carModel?: string): Promise<RepairSolutionsKB[]> {
    try {
      const existingData = getLocalStorageData('repair_solutions_kb');
      
      let filteredData = existingData;

      if (carModel) {
        filteredData = filteredData.filter(item => 
          item.car_models?.includes(carModel)
        );
      }

      // Filter by keywords and convert required_parts back to proper type
      const filtered = filteredData
        .filter(solution => 
          issueKeywords.some(keyword => 
            solution.issue_keywords?.some(solutionKeyword => 
              solutionKeyword.includes(keyword.toLowerCase())
            )
          )
        )
        .map(item => ({
          ...item,
          required_parts: typeof item.required_parts === 'string' ? JSON.parse(item.required_parts) : item.required_parts,
          difficulty_level: sanitizeDifficultyLevel(item.difficulty_level)
        }));

      return filtered;
    } catch (error) {
      console.error('Error fetching repair solutions:', error);
      return [];
    }
  }

  // Save repair history with photo documentation
  async saveRepairHistoryWithPhotos(
    repairData: Omit<EnhancedRepairHistory, 'id' | 'created_at' | 'updated_at'>,
    repairPhotos: any[] = []
  ): Promise<EnhancedRepairHistory | null> {
    try {
      // Enhanced repair data with photo integration
      const enhancedRepairData = {
        ...repairData,
        // Add photo URLs to the standard fields
        photos: repairPhotos.map(p => p.dataUrl),
        before_photos: repairPhotos.filter(p => p.photoType === 'before').map(p => p.dataUrl),
        after_photos: repairPhotos.filter(p => p.photoType === 'after').map(p => p.dataUrl),
        // Enhanced photo metadata
        photo_documentation: {
          totalPhotos: repairPhotos.length,
          photoTypes: repairPhotos.reduce((acc, photo) => {
            acc[photo.photoType] = (acc[photo.photoType] || 0) + 1;
            return acc;
          }, {}),
          photoDescriptions: repairPhotos.map(p => ({
            type: p.photoType,
            description: p.description,
            timestamp: p.timestamp,
            mechanicName: p.mechanicName
          })),
          documentationQuality: this.assessDocumentationQuality(repairPhotos)
        }
      };

      // Save the enhanced repair history
      const savedRepair = await this.saveRepairHistory(enhancedRepairData);

      if (savedRepair && repairPhotos.length > 0) {
        // Trigger MonzaBot learning specifically for photo-documented repairs
        await this.notifyMonzaBotPhotoLearning(savedRepair, repairPhotos);
      }

      return savedRepair;
    } catch (error) {
      console.error('Error saving repair history with photos:', error);
      return null;
    }
  }

  // Assess the quality of photo documentation
  private assessDocumentationQuality(photos: any[]): any {
    if (photos.length === 0) return { score: 0, feedback: 'No photos provided' };

    const hasBeforePhotos = photos.some(p => p.photoType === 'before');
    const hasAfterPhotos = photos.some(p => p.photoType === 'after');
    const hasDuringPhotos = photos.some(p => p.photoType === 'during');
    const hasIssuePhotos = photos.some(p => p.photoType === 'issue');
    
    const allHaveDescriptions = photos.every(p => p.description && p.description.length > 10);
    const descriptionsDetailed = photos.every(p => p.description && p.description.length > 30);

    let score = 0;
    const feedback: string[] = [];

    if (hasBeforePhotos) { score += 25; } else { feedback.push('Missing before photos'); }
    if (hasAfterPhotos) { score += 25; } else { feedback.push('Missing after photos'); }
    if (hasDuringPhotos) { score += 15; } else { feedback.push('Consider adding during-repair photos'); }
    if (hasIssuePhotos) { score += 10; } else { feedback.push('Consider documenting specific issues'); }
    if (allHaveDescriptions) { score += 15; } else { feedback.push('Some photos lack descriptions'); }
    if (descriptionsDetailed) { score += 10; } else { feedback.push('Photo descriptions could be more detailed'); }

    return {
      score,
      grade: score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Poor',
      feedback: feedback.join('; '),
      recommendations: this.getDocumentationRecommendations(score, {
        hasBeforePhotos, hasAfterPhotos, hasDuringPhotos, hasIssuePhotos,
        allHaveDescriptions, descriptionsDetailed
      })
    };
  }

  // Get recommendations for improving photo documentation
  private getDocumentationRecommendations(score: number, metrics: any): string[] {
    const recommendations: string[] = [];

    if (!metrics.hasBeforePhotos) {
      recommendations.push('Always take before photos to document initial condition');
    }
    if (!metrics.hasAfterPhotos) {
      recommendations.push('Take after photos to show completed work quality');
    }
    if (!metrics.hasDuringPhotos) {
      recommendations.push('Document key repair steps with during-repair photos');
    }
    if (!metrics.hasIssuePhotos) {
      recommendations.push('Document specific issues found for future reference');
    }
    if (!metrics.allHaveDescriptions) {
      recommendations.push('Add detailed descriptions to all photos');
    }
    if (!metrics.descriptionsDetailed) {
      recommendations.push('Include more technical details in photo descriptions');
    }

    if (score >= 80) {
      recommendations.push('Excellent documentation! This will greatly help future repairs.');
    }

    return recommendations;
  }

  // Notify MonzaBot specifically about photo-documented repairs
  private async notifyMonzaBotPhotoLearning(repairData: EnhancedRepairHistory, photos: any[]): Promise<void> {
    try {
      const photoSummary = photos.map(p => `${p.photoType}: ${p.description}`).join('; ');
      
      const learningMessage = `New photo-documented repair completed for ${repairData.car_model}:
        
        Repair Details:
        - Issue: ${repairData.issue_description}
        - Solution: ${repairData.solution_description}
        - Parts used: ${repairData.parts_used.map(p => p.part_name).join(', ')}
        - Duration: ${repairData.labor_hours} hours
        
        Photo Documentation (${photos.length} photos):
        ${photoSummary}
        
        Documentation Quality: ${(repairData as any).photo_documentation?.grade}
        
        Please analyze these photos and repair details to improve future repair recommendations and assist mechanics with similar issues.`;

      await enhancedMonzaBotService.learnFromRepairPhotos({
        carModel: repairData.car_model,
        carCode: repairData.car_vin,
        customerName: repairData.client_name,
        mechanicName: repairData.technician_name,
        issueDescription: repairData.issue_description,
        workNotes: repairData.solution_description,
        repairPhotos: photos,
        beforePhotos: photos.filter(p => p.photoType === 'before'),
        duringPhotos: photos.filter(p => p.photoType === 'during'),
        afterPhotos: photos.filter(p => p.photoType === 'after'),
        issuePhotos: photos.filter(p => p.photoType === 'issue'),
        photoCount: photos.length,
        timestamp: repairData.completion_date || new Date().toISOString(),
        status: 'completed',
        tags: ['photo_documentation', 'repair_session', repairData.car_model.toLowerCase()],
        monzaBotLearning: {
          hasPhotos: true,
          photoCount: photos.length,
          issuesDocumented: photos.filter(p => p.photoType === 'issue').length,
          repairProgress: photos.filter(p => ['before', 'during', 'after'].includes(p.photoType)).length,
          learningTriggered: true,
          lastLearningDate: new Date().toISOString(),
          documentationQuality: (repairData as any).photo_documentation?.score || 0
        }
      });
    } catch (error) {
      console.error('Error notifying MonzaBot for photo learning:', error);
    }
  }

  // Get repair suggestions based on photo-documented history
  async getPhotoBasedRepairSuggestions(carModel: string, issueDescription: string): Promise<any[]> {
    try {
      // Load all photo-documented repairs
      const enhancedHistory = JSON.parse(localStorage.getItem('enhanced_repair_sessions') || '[]');
      
      // Filter for similar cases with good photo documentation
      const similarCases = enhancedHistory.filter((session: any) => 
        session.monzaBotLearning?.hasPhotos &&
        session.monzaBotLearning?.documentationQuality >= 60 &&
        (session.carModel.toLowerCase().includes(carModel.toLowerCase()) ||
         session.issueDescription.toLowerCase().includes(issueDescription.toLowerCase()))
      );

      // Get MonzaBot suggestions based on photo history
      if (similarCases.length > 0) {
        const response = await enhancedMonzaBotService.getRepairSuggestions(carModel, issueDescription);
        return similarCases.map(session => ({
          ...session,
          monzaBotSuggestions: response.textResponse
        }));
      }

      return [];
    } catch (error) {
      console.error('Error getting photo-based repair suggestions:', error);
      return [];
    }
  }

  // Search repairs by photo content or descriptions
  async searchRepairsByPhotoContent(searchQuery: string): Promise<EnhancedRepairHistory[]> {
    try {
      // Search in both regular repair history and photo-documented sessions
      const regularHistory = await this.searchRepairHistory(searchQuery);
      const photoSessions = JSON.parse(localStorage.getItem('enhanced_repair_sessions') || '[]');
      
      const photoMatches = photoSessions.filter((session: any) => {
        if (!session.repairPhotos) return false;
        
        return session.repairPhotos.some((photo: any) => 
          photo.description.toLowerCase().includes(searchQuery.toLowerCase())
        ) || session.issueDescription.toLowerCase().includes(searchQuery.toLowerCase());
      });

      // Convert photo sessions to EnhancedRepairHistory format
      const convertedPhotoMatches = photoMatches.map((session: any) => ({
        id: session.id,
        car_vin: session.carCode,
        car_model: session.carModel,
        client_name: session.customerName,
        issue_description: session.issueDescription,
        solution_description: session.workNotes,
        technician_name: session.mechanicName,
        repair_date: session.timestamp.split('T')[0],
        completion_date: session.timestamp.split('T')[0],
        photos: session.repairPhotos?.map((p: any) => p.dataUrl) || [],
        before_photos: session.beforePhotos?.map((p: any) => p.dataUrl) || [],
        after_photos: session.afterPhotos?.map((p: any) => p.dataUrl) || [],
        parts_used: [],
        labor_hours: 0,
        created_at: session.timestamp,
        updated_at: session.timestamp
      }));

      // Combine and deduplicate results
      const allResults = [...regularHistory, ...convertedPhotoMatches];
      const uniqueResults = allResults.filter((item, index, self) => 
        index === self.findIndex(t => t.car_vin === item.car_vin && t.repair_date === item.repair_date)
      );

      return uniqueResults;
    } catch (error) {
      console.error('Error searching repairs by photo content:', error);
      return [];
    }
  }
}

export const enhancedRepairHistoryService = new EnhancedRepairHistoryService();
