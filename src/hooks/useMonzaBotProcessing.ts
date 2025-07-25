
import { useState, useRef } from 'react';
import { toast } from '@/hooks/use-toast';
import { enhancedMonzaBotService } from '@/services/enhancedMonzaBotService';
import { useAuth } from '@/contexts/AuthContext';
import { MonzaBotFormType } from '@/types';

export const useMonzaBotProcessing = (
  formType?: MonzaBotFormType,
  onDataExtracted?: (extractedData: any, formType: MonzaBotFormType) => void
) => {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [botResponse, setBotResponse] = useState<string>('');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const playAudioResponse = async (audioDataUrl: string) => {
    try {
      setIsPlayingAudio(true);
      
      if (audioRef.current) {
        audioRef.current.src = audioDataUrl;
        audioRef.current.onended = () => setIsPlayingAudio(false);
        audioRef.current.onerror = () => setIsPlayingAudio(false);
        await audioRef.current.play();
      }
    } catch (error) {
      console.error('Error playing audio response:', error);
      setIsPlayingAudio(false);
    }
  };

  const handleMonzaBotAssist = async () => {
    if (!extractedData) return;
    
    const message = `Form assist for ${formType}: ${JSON.stringify(extractedData)}. Quick recommendations?`;
    
    try {
      setIsProcessing(true);
      
      const response = await enhancedMonzaBotService.processEnhancedMessage(message, {
        source: 'form_assist',
        formType,
        currentRoute: window.location.pathname
      });
      
      setBotResponse(response.textResponse);
      
      if (response.audioResponse) {
        await playAudioResponse(response.audioResponse);
      }
      
      if (response.formFillData && onDataExtracted) {
        onDataExtracted(response.formFillData, formType!);
      }
    } catch (error) {
      console.error('Error getting MonzaBot assistance:', error);
      toast({
        title: "Error",
        description: "Failed to get assistance",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    extractedData,
    botResponse,
    setBotResponse,
    isPlayingAudio,
    audioRef,
    handleMonzaBotAssist
  };
};
