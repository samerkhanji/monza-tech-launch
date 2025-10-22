import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Brain, MessageSquare, X, HelpCircle, Bot } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import VoiceCameraInterface from './VoiceCameraInterface';
import MonzaBotSidebar from './MonzaBotSidebar';

const SmartMonzaBotInterface: React.FC = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [showInterface, setShowInterface] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);

  const handleAnalysisComplete = (analysis: string, suggestedData?: any) => {
    setAnalysisResult(analysis);
    setShowSidebar(true);
    
    console.log('Analysis completed:', analysis);
    console.log('Suggested data:', suggestedData);
  };

  return (
    <>
      {/* Main MonzaBot Chat Button - Always visible on mobile */}
      <Button
        onClick={() => setShowSidebar(true)}
        className="fixed bottom-6 right-4 z-[9998] h-16 w-16 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-200 bg-gradient-to-r from-monza-yellow to-amber-400 hover:from-amber-400 hover:to-monza-yellow text-monza-black border-2 border-white/30"
        size="icon"
        title="Open MonzaBot Chat"
      >
        <Bot className="h-8 w-8" />
        <span className="sr-only">Open MonzaBot Chat</span>
      </Button>

      {/* Smart Assistant Voice/Camera Button - Secondary position */}
      {!isMobile && (
        <Button
          onClick={() => setShowInterface(true)}
          className="fixed bottom-24 right-4 z-[9997] h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-2 border-white/20"
          size="icon"
          title="Voice & Camera Assistant"
        >
          <Brain className="h-5 w-5" />
          <span className="sr-only">Open Voice & Camera Assistant</span>
        </Button>
      )}

      {/* Voice & Camera Interface Dialog */}
      <Dialog open={showInterface} onOpenChange={setShowInterface}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-500" />
              Smart MonzaBot Assistant
              <span className="text-xs bg-gradient-to-r from-blue-500 to-purple-600 text-white px-2 py-1 rounded-full ml-auto">
                GPT-4o Vision & Voice
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <VoiceCameraInterface onAnalysisComplete={handleAnalysisComplete} />
            
            {analysisResult && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-sm">Latest Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">{analysisResult}</p>
                  <Button 
                    onClick={() => {
                      setShowSidebar(true);
                      setShowInterface(false);
                    }}
                    size="sm"
                    className="w-full bg-monza-yellow text-monza-black hover:bg-monza-yellow/80"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Continue in Chat
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Quick Chat Access Button */}
            <div className="mt-4 pt-4 border-t">
              <Button 
                onClick={() => {
                  setShowSidebar(true);
                  setShowInterface(false);
                }}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <Bot className="h-4 w-4 mr-2" />
                Open MonzaBot Chat
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* MonzaBot Sidebar */}
      <MonzaBotSidebar 
        isOpen={showSidebar} 
        onClose={() => setShowSidebar(false)} 
      />
    </>
  );
};

export default SmartMonzaBotInterface;
