
import { useState, useEffect } from 'react';

export interface DeviceCapabilities {
  isMobile: boolean;
  hasVoiceSupport: boolean;
  hasSpeaker: boolean;
  hasMicrophone: boolean;
  screenSize: 'small' | 'medium' | 'large';
}

export const useDeviceCapabilities = (): DeviceCapabilities => {
  const [capabilities, setCapabilities] = useState<DeviceCapabilities>({
    isMobile: false,
    hasVoiceSupport: false,
    hasSpeaker: false,
    hasMicrophone: false,
    screenSize: 'large'
  });

  useEffect(() => {
    const checkCapabilities = async () => {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
      
      let hasMicrophone = false;
      let hasSpeaker = false;
      
      try {
        // Check microphone access
        const devices = await navigator.mediaDevices.enumerateDevices();
        hasMicrophone = devices.some(device => device.kind === 'audioinput');
        hasSpeaker = devices.some(device => device.kind === 'audiooutput');
      } catch (error) {
        console.warn('Could not enumerate devices:', error);
      }

      const hasVoiceSupport = 'speechSynthesis' in window && 'SpeechRecognition' in window;
      
      const getScreenSize = () => {
        if (window.innerWidth < 640) return 'small';
        if (window.innerWidth < 1024) return 'medium';
        return 'large';
      };

      setCapabilities({
        isMobile,
        hasVoiceSupport,
        hasSpeaker,
        hasMicrophone,
        screenSize: getScreenSize()
      });
    };

    checkCapabilities();
    
    const handleResize = () => {
      setCapabilities(prev => ({
        ...prev,
        screenSize: window.innerWidth < 640 ? 'small' : window.innerWidth < 1024 ? 'medium' : 'large'
      }));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return capabilities;
};
