
import { useState, useRef } from 'react';
import { toast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { enhancedMonzaBotService } from '@/services/enhancedMonzaBotService';

export const useVoiceRecording = (onVoiceProcessed: (transcript: string, response: string, audioResponse?: string) => void) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const playAudioResponse = async (audioDataUrl: string) => {
    try {
      const audio = new Audio(audioDataUrl);
      audio.oncanplaythrough = () => {
        audio.play().catch(error => {
          console.error('Error playing audio:', error);
        });
      };
      audio.onerror = (error) => {
        console.error('Audio loading error:', error);
      };
    } catch (error) {
      console.error('Error creating audio element:', error);
    }
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processVoiceInput(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsListening(true);
      
      toast({
        title: "Recording started",
        description: "MonzaBot is listening... Speak naturally.",
      });
    } catch (error) {
      console.error('Error starting voice recording:', error);
      const errorToast = toast({
        title: "Microphone Error",
        description: "Could not access microphone. Check permissions.",
        variant: "destructive",
        duration: 0,
        action: (
          <ToastAction
            altText="Close"
            onClick={() => errorToast.dismiss()}
          >
            ✕
          </ToastAction>
        ),
      });
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop();
      setIsListening(false);
    }
  };

  const processVoiceInput = async (audioBlob: Blob) => {
    try {
      setIsProcessing(true);
      
      const voiceResult = await enhancedMonzaBotService.processVoiceToText(audioBlob);
      
      const response = await enhancedMonzaBotService.processEnhancedMessage(
        voiceResult.text,
        {
          source: 'voice_input',
          currentRoute: window.location.pathname
        }
      );
      
      // Play audio response immediately if available
      if (response.audioResponse) {
        await playAudioResponse(response.audioResponse);
      }
      
      onVoiceProcessed(voiceResult.text, response.textResponse, response.audioResponse || undefined);
      
      toast({
        title: "Voice processed",
        description: "MonzaBot has responded to your voice command",
      });
    } catch (error) {
      console.error('Error processing voice input:', error);
      const errorToast = toast({
        title: "Processing Error",
        description: "Voice processing failed. Please try again.",
        variant: "destructive",
        duration: 0,
        action: (
          <ToastAction
            altText="Close"
            onClick={() => errorToast.dismiss()}
          >
            ✕
          </ToastAction>
        ),
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isListening,
    isProcessing,
    startVoiceRecording,
    stopVoiceRecording
  };
};
