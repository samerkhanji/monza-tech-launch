
import React from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff } from 'lucide-react';

interface VoiceRecordingSectionProps {
  isListening: boolean;
  isProcessing: boolean;
  voiceTranscript: string;
  onStartRecording: () => void;
  onStopRecording: () => void;
}

const VoiceRecordingSection: React.FC<VoiceRecordingSectionProps> = ({
  isListening,
  isProcessing,
  voiceTranscript,
  onStartRecording,
  onStopRecording
}) => {
  return (
    <div className="space-y-2">
      <Button
        onClick={isListening ? onStopRecording : onStartRecording}
        disabled={isProcessing}
        className={`w-full ${isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`}
      >
        {isListening ? <MicOff className="h-4 w-4 mr-2" /> : <Mic className="h-4 w-4 mr-2" />}
        {isListening ? 'Stop Recording' : 'Voice Command'}
      </Button>
      
      {voiceTranscript && (
        <div className="p-2 bg-blue-50 rounded text-sm">
          <strong>You said:</strong> {voiceTranscript}
        </div>
      )}
    </div>
  );
};

export default VoiceRecordingSection;
