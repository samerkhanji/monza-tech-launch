
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Volume2, VolumeX, Loader2 } from 'lucide-react';

interface BotResponseSectionProps {
  botResponse: string;
  isPlayingAudio: boolean;
  isProcessing: boolean;
  showFormFillButton: boolean;
  extractedData: any;
  audioRef: React.RefObject<HTMLAudioElement>;
  onMonzaBotAssist: () => void;
  showCameraButton?: boolean;
}

const BotResponseSection: React.FC<BotResponseSectionProps> = ({
  botResponse,
  isPlayingAudio,
  isProcessing,
  showFormFillButton,
  extractedData,
  audioRef,
  onMonzaBotAssist,
  showCameraButton = true
}) => {
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  const toggleVoice = () => {
    setVoiceEnabled(!voiceEnabled);
    if (isPlayingAudio && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const playAudio = () => {
    if (audioRef.current && voiceEnabled && audioRef.current.src) {
      audioRef.current.play().catch(error => {
        console.error('Error playing audio:', error);
      });
    }
  };

  // Auto-play audio when available and voice is enabled
  useEffect(() => {
    if (audioRef.current && audioRef.current.src && voiceEnabled) {
      audioRef.current.play().catch(error => {
        console.error('Error auto-playing audio:', error);
      });
    }
  }, [audioRef.current?.src, voiceEnabled]);

  return (
    <div className="space-y-4">
      {showFormFillButton && extractedData && (
        <Button 
          onClick={onMonzaBotAssist}
          className="w-full bg-monza-yellow hover:bg-monza-yellow/90 text-black"
          disabled={isProcessing}
        >
          <Send className="h-4 w-4 mr-2" />
          Use Data for Form
        </Button>
      )}

      {botResponse && (
        <div className="p-3 bg-slate-50 rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">MonzaBot:</span>
              {isPlayingAudio && <Volume2 className="h-4 w-4 animate-pulse text-blue-500" />}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleVoice}
                className="h-8 w-8 p-0"
                title={voiceEnabled ? "Disable voice" : "Enable voice"}
              >
                {voiceEnabled ? (
                  <Volume2 className="h-4 w-4" />
                ) : (
                  <VolumeX className="h-4 w-4" />
                )}
              </Button>
              {voiceEnabled && audioRef.current?.src && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={playAudio}
                  className="h-8 w-8 p-0"
                  title="Replay audio"
                >
                  <Volume2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          <p className="text-sm">{botResponse}</p>
        </div>
      )}

      {isProcessing && (
        <div className="flex items-center justify-center p-4">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span className="text-sm">MonzaBot analyzing...</span>
        </div>
      )}

      <audio ref={audioRef} className="hidden" />
    </div>
  );
};

export default BotResponseSection;
