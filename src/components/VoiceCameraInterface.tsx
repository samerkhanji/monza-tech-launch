
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Mic, MicOff, Send, Volume2, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface VoiceCameraInterfaceProps {
  onAnalysisComplete: (analysis: string, suggestedData?: any) => void;
}

interface MediaRecorderState {
  recorder: MediaRecorder | null;
  isRecording: boolean;
  audioChunks: Blob[];
}

const VoiceCameraInterface: React.FC<VoiceCameraInterfaceProps> = ({ onAnalysisComplete }) => {
  const { user } = useAuth();
  const [isListening, setIsListening] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [pendingAnalysis, setPendingAnalysis] = useState<{ type: 'voice', data: any } | null>(null);
  
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorderState>({
    recorder: null,
    isRecording: false,
    audioChunks: []
  });

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      const chunks: Blob[] = [];
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        await processVoiceInput(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      recorder.start(1000); // Record in 1-second chunks
      setMediaRecorder({ recorder, isRecording: true, audioChunks: chunks });
      setIsListening(true);
      
      toast({
        title: "Recording started",
        description: "Speak now, MonzaBot is listening...",
      });
    } catch (error) {
      console.error('Error starting voice recording:', error);
      toast({
        title: "Error",
        description: "Failed to start voice recording. Please check microphone permissions.",
        variant: "destructive",
      });
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorder.recorder && mediaRecorder.isRecording) {
      mediaRecorder.recorder.stop();
      setMediaRecorder(prev => ({ ...prev, isRecording: false }));
      setIsListening(false);
    }
  };

  const processVoiceInput = async (audioBlob: Blob) => {
    try {
      setIsAnalyzing(true);
      
      // Convert audio to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        
        // Send to voice-to-text edge function
        const { data: transcriptData, error: transcriptError } = await supabase.functions.invoke('voice-to-text', {
          body: { audio: base64Audio }
        });

        if (transcriptError) {
          throw new Error(`Voice transcription failed: ${transcriptError.message}`);
        }

        const transcript = transcriptData.text;
        console.log('Voice transcript:', transcript);

        // Check if user wants to proceed with GPT-4o analysis
        setPendingAnalysis({ type: 'voice', data: transcript });
        setShowPermissionDialog(true);
      };
      
      reader.readAsDataURL(audioBlob);
    } catch (error) {
      console.error('Error processing voice input:', error);
      toast({
        title: "Error",
        description: "Failed to process voice input",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const processVoiceWithGPT4o = async (transcript: string) => {
    try {
      setIsAnalyzing(true);
      
      const context = {
        userRole: user?.role,
        userName: user?.name,
        currentRoute: window.location.pathname,
        analysisType: 'voice_command',
        timestamp: new Date().toISOString()
      };

      const { data, error } = await supabase.functions.invoke('monzabot-gpt', {
        body: {
          message: `Voice command received: "${transcript}". 
          
          Analyze this voice input and determine what the user wants to do. If they're asking about:
          - Adding a new car: Help structure the information needed
          - Looking up vehicle information: Provide guidance on what data is needed
          - Inventory management: Suggest next steps
          - Any other dealership operations: Provide specific guidance
          
          Respond conversationally and offer to help fill out any relevant forms or data.`,
          context
        }
      });

      if (error) {
        throw new Error(`GPT-4o analysis failed: ${error.message}`);
      }

      return data.response;
    } catch (error) {
      console.error('Error processing voice with GPT-4o:', error);
      throw error;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePermissionGranted = async () => {
    if (!pendingAnalysis) return;
    
    setShowPermissionDialog(false);
    
    try {
      const analysis = await processVoiceWithGPT4o(pendingAnalysis.data);
      
      onAnalysisComplete(analysis);
      
      toast({
        title: "Analysis Complete",
        description: "GPT-4o has analyzed your voice input and provided suggestions",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to analyze input with GPT-4o",
        variant: "destructive",
      });
    }
    
    setPendingAnalysis(null);
  };

  const handlePermissionDenied = () => {
    setShowPermissionDialog(false);
    setPendingAnalysis(null);
    
    toast({
      title: "Analysis Cancelled",
      description: "GPT-4o analysis was not performed",
    });
  };

  return (
    <>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Voice Assistant
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Voice Controls */}
          <div className="space-y-2">
            <Button
              onClick={isListening ? stopVoiceRecording : startVoiceRecording}
              disabled={isAnalyzing}
              className={`w-full ${isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`}
            >
              {isListening ? <MicOff className="h-4 w-4 mr-2" /> : <Mic className="h-4 w-4 mr-2" />}
              {isListening ? 'Stop Recording' : 'Start Voice Command'}
            </Button>
          </div>

          {/* Loading State */}
          {isAnalyzing && (
            <div className="text-center p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-monza-yellow mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Analyzing with GPT-4o...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Permission Dialog */}
      <Dialog open={showPermissionDialog} onOpenChange={setShowPermissionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              GPT-4o Analysis Permission
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              MonzaBot would like to analyze your voice command using GPT-4o 
              to help automatically fill out information and provide assistance.
            </p>
            <p className="text-sm text-muted-foreground">
              This will help process your voice commands to streamline your workflow.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={handlePermissionDenied}>
                Cancel
              </Button>
              <Button onClick={handlePermissionGranted}>
                Analyze with GPT-4o
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VoiceCameraInterface;
