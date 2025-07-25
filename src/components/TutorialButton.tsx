import React from 'react';
import { useTutorial } from '@/contexts/TutorialContext';
import { Button } from '@/components/ui/button';
import { GraduationCap, Play, BookOpen } from 'lucide-react';

const TutorialButton: React.FC = () => {
  const { startTutorial, showTutorialButton, toggleTutorialButton } = useTutorial();

  if (!showTutorialButton) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="fixed bottom-4 right-4 z-50 bg-white shadow-lg hover:bg-gray-100 border border-gray-200"
        onClick={toggleTutorialButton}
        title="Show Tutorial Button"
      >
        <BookOpen className="h-5 w-5 text-gray-600" />
      </Button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {/* Main Tutorial Button */}
      <Button
        onClick={startTutorial}
        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center gap-2 px-4 py-3 rounded-full"
        title="Start Employee Training Program"
      >
        <GraduationCap className="h-5 w-5" />
        <span className="font-semibold">Employee Training</span>
        <Play className="h-4 w-4 ml-1" />
      </Button>

      {/* Hide Button */}
      <Button
        variant="ghost"
        size="icon"
        className="bg-white shadow-md hover:bg-gray-100 border border-gray-200 self-end"
        onClick={toggleTutorialButton}
        title="Hide Tutorial Button"
      >
        <BookOpen className="h-4 w-4 text-gray-600" />
      </Button>

      {/* Floating Info Card */}
      <div className="absolute bottom-16 right-0 bg-white rounded-lg shadow-lg border border-gray-200 p-3 w-64 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none group-hover:pointer-events-auto">
        <div className="text-sm text-gray-700">
          <p className="font-semibold text-blue-600 mb-1">🎓 Complete Employee Training</p>
          <p className="text-xs">
            Learn how to use every feature of the Monza S.A.L. system, from inventory management to customer service.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TutorialButton; 