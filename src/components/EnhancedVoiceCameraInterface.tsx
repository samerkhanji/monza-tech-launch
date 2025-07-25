
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic } from 'lucide-react';
import VoiceRecordingSection from './VoiceRecordingSection';
import BotResponseSection from './BotResponseSection';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
import { useMonzaBotProcessing } from '@/hooks/useMonzaBotProcessing';

interface EnhancedVoiceInterfaceProps {
  onDataExtracted?: (extractedData: any, formType: 'new_car_arrival' | 'repair' | 'inventory') => void;
  formType?: 'new_car_arrival' | 'repair' | 'inventory';
  showFormFillButton?: boolean;
}

const EnhancedVoiceInterface: React.FC<EnhancedVoiceInterfaceProps> = ({ 
  onDataExtracted, 
  formType,
  showFormFillButton = false 
}) => {
  const [voiceTranscript, setVoiceTranscript] = useState<string>('');

  const { 
    isProcessing, 
    extractedData, 
    botResponse, 
    setBotResponse, 
    isPlayingAudio, 
    audioRef, 
    handleMonzaBotAssist 
  } = useMonzaBotProcessing(formType, onDataExtracted);

  const handleVoiceProcessed = (transcript: string, response: string, audioResponse?: string) => {
    setVoiceTranscript(transcript);
    setBotResponse(response);
  };

  const { 
    isListening, 
    isProcessing: isVoiceProcessing, 
    startVoiceRecording, 
    stopVoiceRecording 
  } = useVoiceRecording(handleVoiceProcessed);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="h-5 w-5" />
          MonzaBot Voice Assistant
          <Badge variant="secondary" className="ml-auto">Voice-Only</Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <VoiceRecordingSection
          isListening={isListening}
          isProcessing={isProcessing || isVoiceProcessing}
          voiceTranscript={voiceTranscript}
          onStartRecording={startVoiceRecording}
          onStopRecording={stopVoiceRecording}
        />

        <BotResponseSection
          botResponse={botResponse}
          isPlayingAudio={isPlayingAudio}
          isProcessing={isProcessing}
          showFormFillButton={showFormFillButton}
          extractedData={extractedData}
          audioRef={audioRef}
          onMonzaBotAssist={handleMonzaBotAssist}
          showCameraButton={false}
        />
      </CardContent>
    </Card>
  );
};

export default EnhancedVoiceInterface;
