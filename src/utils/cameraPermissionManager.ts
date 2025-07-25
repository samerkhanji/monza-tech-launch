import React from 'react';

interface CameraPermissionState {
  granted: boolean;
  denied: boolean;
  stream: MediaStream | null;
  lastRequestTime: number;
}

class CameraPermissionManager {
  private state: CameraPermissionState = {
    granted: false,
    denied: false,
    stream: null,
    lastRequestTime: 0
  };

  private listeners: ((state: CameraPermissionState) => void)[] = [];

  constructor() {
    this.checkInitialPermission();
  }

  private async checkInitialPermission() {
    try {
      if ('permissions' in navigator) {
        const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
        this.updateState({
          granted: result.state === 'granted',
          denied: result.state === 'denied',
          stream: null,
          lastRequestTime: this.state.lastRequestTime
        });

        result.addEventListener('change', () => {
          this.updateState({
            granted: result.state === 'granted',
            denied: result.state === 'denied',
            stream: this.state.stream,
            lastRequestTime: this.state.lastRequestTime
          });
        });
      }
    } catch (error) {
      console.log('Permission API not supported, will check on first camera access');
    }
  }

  private updateState(newState: CameraPermissionState) {
    this.state = { ...newState };
    this.listeners.forEach(listener => listener(this.state));
  }

  public subscribe(listener: (state: CameraPermissionState) => void) {
    this.listeners.push(listener);
    // Immediately call with current state
    listener(this.state);
    
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  public async requestCameraAccess(constraints: MediaStreamConstraints = { video: true }): Promise<MediaStream> {
    const now = Date.now();
    
    // If we already have a stream and permission is granted, reuse it
    if (this.state.granted && this.state.stream && this.state.stream.active) {
      console.log('Reusing existing camera stream');
      return this.state.stream;
    }

    // Check if we recently got denied (within last 5 seconds) to avoid rapid re-requests
    if (this.state.denied && (now - this.state.lastRequestTime) < 5000) {
      throw new Error('Camera permission recently denied. Please grant permission in browser settings.');
    }

    try {
      console.log('Requesting camera access with constraints:', constraints);
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported on this device or browser');
      }

      // Try environment camera first, then fallback to user camera, then basic video
      let stream: MediaStream | null = null;
      const constraintOptions = [
        { video: { facingMode: 'environment', ...(typeof constraints.video === 'object' ? constraints.video : {}) } },
        { video: { facingMode: 'user', ...(typeof constraints.video === 'object' ? constraints.video : {}) } },
        { video: true }
      ];

      for (const constraintOption of constraintOptions) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraintOption);
          console.log('Camera access granted with constraints:', constraintOption);
          break;
        } catch (error) {
          console.log('Failed with constraints:', constraintOption, error);
          continue;
        }
      }

      if (!stream) {
        throw new Error('Failed to access camera with any available configuration');
      }

      this.updateState({
        granted: true,
        denied: false,
        stream,
        lastRequestTime: now
      });

      return stream;
    } catch (error) {
      console.error('Camera access error:', error);
      
      const isNotAllowed = error instanceof Error && error.name === 'NotAllowedError';
      
      this.updateState({
        granted: false,
        denied: isNotAllowed,
        stream: null,
        lastRequestTime: now
      });

      throw error;
    }
  }

  public stopCamera() {
    if (this.state.stream) {
      this.state.stream.getTracks().forEach(track => track.stop());
      this.updateState({
        ...this.state,
        stream: null
      });
    }
  }

  public isSupported(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  public getState(): CameraPermissionState {
    return { ...this.state };
  }

  public hasActiveStream(): boolean {
    return !!(this.state.stream && this.state.stream.active);
  }
}

// Singleton instance
export const cameraPermissionManager = new CameraPermissionManager();

// React hook for using camera permission manager
export function useCameraPermission() {
  const [state, setState] = React.useState<CameraPermissionState>(() => 
    cameraPermissionManager.getState()
  );

  React.useEffect(() => {
    const unsubscribe = cameraPermissionManager.subscribe(setState);
    return unsubscribe;
  }, []);

  const requestCamera = React.useCallback(async (constraints?: MediaStreamConstraints) => {
    return await cameraPermissionManager.requestCameraAccess(constraints);
  }, []);

  const stopCamera = React.useCallback(() => {
    cameraPermissionManager.stopCamera();
  }, []);

  return {
    ...state,
    requestCamera,
    stopCamera,
    isSupported: cameraPermissionManager.isSupported(),
    hasActiveStream: cameraPermissionManager.hasActiveStream()
  };
}

export default cameraPermissionManager; 