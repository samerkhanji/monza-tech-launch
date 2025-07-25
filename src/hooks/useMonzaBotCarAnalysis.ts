
import { useState } from 'react';
import { enhancedMonzaBotService } from '@/services/enhancedMonzaBotService';
import { toast } from '@/hooks/use-toast';

export const useMonzaBotCarAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const analyzeCarImage = async (imageDataUrl: string, formType?: 'new_car_arrival' | 'repair' | 'inventory') => {
    setIsAnalyzing(true);
    try {
      const result = await enhancedMonzaBotService.analyzeCarImage(imageDataUrl, {
        formType,
        source: 'camera_analysis',
        currentRoute: window.location.pathname
      });

      setAnalysisResult(result);

      toast({
        title: "Car Analysis Complete",
        description: result.formFillData 
          ? "MonzaBot extracted car information. Review and confirm the details."
          : "Analysis complete. Check the response for details.",
      });

      return result;
    } catch (error) {
      console.error('Car analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze the car image. Please try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearAnalysis = () => {
    setAnalysisResult(null);
  };

  return {
    isAnalyzing,
    analysisResult,
    analyzeCarImage,
    clearAnalysis
  };
};
