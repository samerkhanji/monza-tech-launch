import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mic, Camera, Brain, Send, Volume2, Loader2 } from 'lucide-react';
import { enhancedMonzaBotService } from '@/services/enhancedMonzaBotService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import VinScannerDialog from '@/components/VinScannerDialog';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
import { MonzaBotFormType } from '@/types';

interface UniversalFormAssistantProps {
  formType: MonzaBotFormType;
  onFormFill?: (data: any) => void;
  onSuggestions?: (suggestions: any) => void;
  currentFormData?: any;
  className?: string;
}

const UniversalFormAssistant: React.FC<UniversalFormAssistantProps> = ({
  formType,
  onFormFill,
  onSuggestions,
  currentFormData,
  className = ""
}) => {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<any>(null);
  const [conversation, setConversation] = useState<{text: string, sender: 'user' | 'bot'}[]>([]);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showVinScanner, setShowVinScanner] = useState(false);

  const handleVoiceProcessed = async (transcript: string, response: string) => {
    setConversation(prev => [
      ...prev,
      { text: transcript, sender: 'user' },
      { text: response, sender: 'bot' }
    ]);

    // Process for form suggestions
    await processForFormSuggestions(transcript);
  };

  const { 
    isListening, 
    isProcessing: isVoiceProcessing, 
    startVoiceRecording, 
    stopVoiceRecording 
  } = useVoiceRecording(handleVoiceProcessed);

  const handleImageCapture = async (imageData: string) => {
    setIsProcessing(true);
    try {
      const result = await enhancedMonzaBotService.processImageOCR(imageData);
      setExtractedData(result.extractedData);
      
      // Generate form suggestions
      const formSuggestions = await enhancedMonzaBotService.suggestFormFill(formType, result.extractedData);
      setSuggestions(formSuggestions);
      
      if (onSuggestions) {
        onSuggestions(formSuggestions);
      }

      toast({
        title: "Image Analyzed",
        description: `Found ${Object.keys(result.extractedData).length} pieces of information`,
      });
    } catch (error) {
      console.error('Error processing image:', error);
      toast({
        title: "Error",
        description: "Failed to process image",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const processForFormSuggestions = async (message: string) => {
    try {
      const response = await enhancedMonzaBotService.processEnhancedMessage(message, {
        formType,
        currentFormData,
        source: 'form_assistant',
        currentRoute: window.location.pathname
      });

      if (response.formFillData) {
        setExtractedData(response.formFillData);
        if (onFormFill) {
          onFormFill(response.formFillData);
        }
      }

      if (response.suggestedActions) {
        const formSuggestions = await enhancedMonzaBotService.suggestFormFill(formType, response.formFillData || {});
        setSuggestions(formSuggestions);
        if (onSuggestions) {
          onSuggestions(formSuggestions);
        }
      }
    } catch (error) {
      console.error('Error processing message for suggestions:', error);
    }
  };

  const handleVinScanned = async (vin: string) => {
    const mockData = { vin, model: 'Detected from VIN', year: 2024 };
    setExtractedData(mockData);
    
    const formSuggestions = await enhancedMonzaBotService.suggestFormFill(formType, mockData);
    setSuggestions(formSuggestions);
    
    if (onSuggestions) {
      onSuggestions(formSuggestions);
    }
  };

  const applyFormFill = () => {
    if (extractedData && onFormFill) {
      onFormFill(extractedData);
      toast({
        title: "Form Updated",
        description: "Information has been filled in the form",
      });
    }
  };

  const getFormTypeLabel = () => {
    const labels = {
      new_car_arrival: 'New Car Arrival',
      repair: 'Repair Order',
      inventory: 'Inventory Item',
      parts: 'Parts Management',
      schedule: 'Garage Schedule',
      calendar: 'Calendar Event',
      ordered_cars: 'Ordered Cars'
    };
    return labels[formType];
  };

  // Show simplified message if user is not authenticated
  if (!user) {
    return (
      <Card className={`w-full ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Form Assistant
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Please log in to access AI form assistance features.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          AI Form Assistant
          <Badge variant="outline">{getFormTypeLabel()}</Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={isListening ? stopVoiceRecording : startVoiceRecording}
            disabled={isProcessing || isVoiceProcessing}
          >
            <Mic className={`h-4 w-4 mr-2 ${isListening ? 'text-red-500' : ''}`} />
            {isListening ? 'Stop' : 'Voice'}
          </Button>

          {(formType === 'new_car_arrival' || formType === 'repair') && (
            <VinScannerDialog
              isOpen={showVinScanner}
              onClose={() => setShowVinScanner(false)}
              onVinScanned={handleVinScanned}
            />
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/*';
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    handleImageCapture(event.target?.result as string);
                  };
                  reader.readAsDataURL(file);
                }
              };
              input.click();
            }}
            disabled={isProcessing}
          >
            <Camera className="h-4 w-4 mr-2" />
            Photo
          </Button>
        </div>

        {/* Processing Indicator */}
        {(isProcessing || isVoiceProcessing) && (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span className="text-sm">Processing...</span>
          </div>
        )}

        {/* Extracted Data Display */}
        {extractedData && (
          <div className="p-3 bg-green-50 rounded-md border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-green-800">Data Extracted</h4>
              <Button onClick={applyFormFill} size="sm" className="bg-green-600 hover:bg-green-700">
                <Send className="h-3 w-3 mr-1" />
                Apply to Form
              </Button>
            </div>
            <div className="text-xs space-y-1">
              {Object.entries(extractedData).map(([key, value]) => (
                <p key={key}>
                  <strong>{key}:</strong> {String(value)}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Suggestions Display */}
        {suggestions && (
          <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
            <h4 className="font-medium text-blue-800 mb-2">AI Suggestions</h4>
            <div className="text-xs space-y-1">
              {Object.entries(suggestions).map(([key, value]) => (
                <p key={key} className="text-blue-700">
                  <strong>{key.replace(/_/g, ' ')}:</strong> {String(value)}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Mini Conversation */}
        {conversation.length > 0 && (
          <div className="max-h-32 overflow-y-auto p-2 bg-slate-50 rounded text-xs">
            {conversation.slice(-3).map((entry, index) => (
              <div key={index} className={`mb-1 ${entry.sender === 'user' ? 'text-right' : 'text-left'}`}>
                <span className={`inline-block p-1 rounded ${
                  entry.sender === 'user' ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  {entry.text}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UniversalFormAssistant;
