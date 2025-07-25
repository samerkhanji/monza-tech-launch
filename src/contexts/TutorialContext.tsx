import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface TutorialContextType {
  isRunning: boolean;
  currentStep: number;
  startTutorial: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTutorial: () => void;
  completeTutorial: () => void;
  resetTutorial: () => void;
  showTutorialButton: boolean;
  toggleTutorialButton: () => void;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

interface TutorialProviderProps {
  children: ReactNode;
}

const TUTORIAL_COMPLETED_KEY = 'monza_tutorial_completed';
const TUTORIAL_BUTTON_VISIBLE_KEY = 'monza_tutorial_button_visible';

export const TutorialProvider: React.FC<TutorialProviderProps> = ({ children }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [tutorialCompleted, setTutorialCompleted] = useState(false);
  const [showTutorialButton, setShowTutorialButton] = useState(true);

  // Check completion status and button visibility on mount
  useEffect(() => {
    const completed = localStorage.getItem(TUTORIAL_COMPLETED_KEY) === 'true';
    const buttonVisible = localStorage.getItem(TUTORIAL_BUTTON_VISIBLE_KEY) !== 'false';
    setTutorialCompleted(completed);
    setShowTutorialButton(buttonVisible);
  }, []);

  // Automatically start tutorial on first login if not completed
  useEffect(() => {
    if (!tutorialCompleted && !isRunning && showTutorialButton) {
      // Delay slightly to ensure components are rendered
      const timer = setTimeout(() => {
        // Check if this is the first time the user is accessing the system
        const firstTime = localStorage.getItem('monza_first_time_user') === null;
        if (firstTime) {
          localStorage.setItem('monza_first_time_user', 'false');
          startTutorial();
        }
      }, 2000); // Give user 2 seconds to see the interface before starting tutorial
      return () => clearTimeout(timer);
    }
  }, [tutorialCompleted, isRunning, showTutorialButton]);

  const startTutorial = () => {
    setIsRunning(true);
    setCurrentStep(0);
    // Don't mark as completed when starting - only when finishing
  };

  const nextStep = () => {
    setCurrentStep((prev) => prev + 1);
  };

  const prevStep = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const skipTutorial = () => {
    setIsRunning(false);
    completeTutorial();
  };

  const completeTutorial = () => {
    setTutorialCompleted(true);
    localStorage.setItem(TUTORIAL_COMPLETED_KEY, 'true');
    setIsRunning(false);
  };

  const resetTutorial = () => {
    setTutorialCompleted(false);
    setCurrentStep(0);
    localStorage.removeItem(TUTORIAL_COMPLETED_KEY);
    localStorage.removeItem('monza_first_time_user');
  };

  const toggleTutorialButton = () => {
    const newValue = !showTutorialButton;
    setShowTutorialButton(newValue);
    localStorage.setItem(TUTORIAL_BUTTON_VISIBLE_KEY, newValue.toString());
  };

  const contextValue: TutorialContextType = {
    isRunning,
    currentStep,
    startTutorial,
    nextStep,
    prevStep,
    skipTutorial,
    completeTutorial,
    resetTutorial,
    showTutorialButton,
    toggleTutorialButton,
  };

  return (
    <TutorialContext.Provider value={contextValue}>
      {children}
    </TutorialContext.Provider>
  );
};

export const useTutorial = (): TutorialContextType => {
  const context = useContext(TutorialContext);
  if (context === undefined) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
}; 