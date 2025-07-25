import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Brain, MessageSquare, X, HelpCircle } from 'lucide-react';
import VoiceCameraInterface from './VoiceCameraInterface';
import MonzaBotSidebar from './MonzaBotSidebar';
import { useAuth } from '@/contexts/AuthContext';

const SmartMonzaBotInterface: React.FC = () => {
  const { user } = useAuth();
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
      {/* Smart Assistant Toggle Button */}
      <Button
        onClick={() => setShowInterface(true)}
        className="fixed bottom-20 right-4 z-[9998] h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-2 border-white/20"
        size="icon"
      >
        <Brain className="h-6 w-6" />
        <span className="sr-only">Open Smart Assistant</span>
      </Button>

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
                    onClick={() => setShowSidebar(true)}
                    size="sm"
                    className="w-full bg-monza-yellow text-monza-black hover:bg-monza-yellow/80"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Continue in Chat
                  </Button>
                </CardContent>
              </Card>
            )}
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
