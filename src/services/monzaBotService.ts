import { supabase } from '@/integrations/supabase/client';
import { monzaBotResponseFilter } from './monzaBotResponseFilter';
import { AuthUser } from '@/lib/auth';

interface MonzaBotContext {
  currentRoute?: string;
  source?: string;
  user?: AuthUser | null;
}

export interface MonzaBotResponse {
  response: string;
  type?: string;
  metadata?: any;
  requiresAction?: boolean;
  actionType?: string;
}

export const monzaBotService = {
  async sendMessage(message: string, context: MonzaBotContext = {}): Promise<MonzaBotResponse> {
    const { user } = context;
    
    // Check if user can access this topic
    if (!monzaBotResponseFilter.canAccessTopic(user || null, message)) {
      return {
        response: monzaBotResponseFilter.getRestrictionMessage(user || null),
        type: 'access_restricted'
      };
    }

    try {
      console.log('MonzaBot: Processing message:', message);
      
      // Determine if this needs GPT-4o analysis (images, complex analysis)
      const needsGPTAnalysis = this.requiresGPTAnalysis(message, context);
      
      if (needsGPTAnalysis) {
        const { data, error } = await supabase.functions.invoke('monzabot-gpt', {
          body: {
            message,
            context: {
              ...context,
              userRole: user?.role,
              canAccessAnalytics: user?.role?.toUpperCase() === 'OWNER',
              canAccessClientData: user?.role?.toUpperCase() === 'OWNER' // Add client data access check
            }
          }
        });
        
        if (error) throw error;
        
        // Filter response based on user role
        const filteredResponse = monzaBotResponseFilter.filterResponse(user || null, data.response);
        
        return {
          response: filteredResponse,
          type: 'gpt4o_analysis',
          metadata: data.metadata
        };
      } else {
        // Use enhanced function for standard responses
        const { data, error } = await supabase.functions.invoke('monzabot-enhanced', {
          body: {
            message,
            context: {
              ...context,
              userRole: user?.role,
              canAccessAnalytics: user?.role?.toUpperCase() === 'OWNER',
              canAccessClientData: user?.role?.toUpperCase() === 'OWNER' // Add client data access check
            }
          }
        });
        
        if (error) throw error;
        
        // Filter response based on user role
        const filteredResponse = monzaBotResponseFilter.filterResponse(user || null, data.response);
        
        return {
          response: filteredResponse,
          type: 'standard',
          metadata: data.metadata
        };
      }
    } catch (error) {
      console.error('MonzaBot service error:', error);
      throw new Error('Failed to process your request. Please try again.');
    }
  },

  requiresGPTAnalysis(message: string, context: MonzaBotContext): boolean {
    const analysisKeywords = [
      'analyze', 'analysis', 'compare', 'trend', 'pattern', 'insight',
      'recommendation', 'optimize', 'efficiency', 'performance', 'data',
      'chart', 'graph', 'report', 'summary', 'overview'
    ];
    
    const messageLower = message.toLowerCase();
    const hasAnalysisKeyword = analysisKeywords.some(keyword => 
      messageLower.includes(keyword)
    );
    
    // Also check if user is on analytics or reports pages
    const isOnAnalyticsPage = context.currentRoute?.includes('analytics') || 
                             context.currentRoute?.includes('report');
    
    return hasAnalysisKeyword || isOnAnalyticsPage;
  },

  clearHistory(): void {
    // Clear any stored conversation history
    console.log('MonzaBot: Clearing conversation history');
  }
};
