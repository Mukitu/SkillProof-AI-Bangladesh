import { useState, useEffect, useRef, useCallback } from 'react';
import { supabaseClient, isRealSupabase } from '../lib/supabase';

export interface ProctoringState {
  isMonitoring: boolean;
  violations: number;
  maxViolations: number;
  hasPermissions: boolean;
  stream: MediaStream | null;
}

export const useProctoring = (
  assessmentId: string | null,
  userId: string | undefined,
  maxViolations = 3,
  onTerminated: () => void
) => {
  const [state, setState] = useState<ProctoringState>({
    isMonitoring: false,
    violations: 0,
    maxViolations,
    hasPermissions: false,
    stream: null
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  const recordViolation = useCallback(async (type: string, details: string = '') => {
    if (!stateRef.current.isMonitoring) return;

    const newViolations = stateRef.current.violations + 1;
    setState(prev => ({ ...prev, violations: newViolations }));

    console.warn(`[Proctoring] Violation: ${type}`, details);

    if (isRealSupabase && userId && assessmentId) {
      try {
        await supabaseClient.from('exam_violations').insert({
          user_id: userId,
          assessment_id: assessmentId,
          violation_type: type,
          details,
          timestamp: new Date().toISOString()
        });
      } catch (err) {
        console.error('Failed to record violation:', err);
      }
    }

    if (newViolations >= maxViolations) {
      stopMonitoring();
      onTerminated();
    }
  }, [assessmentId, userId, maxViolations, onTerminated]);

  const requestPermissions = async (): Promise<boolean> => {
    try {
      // Request Screen Sharing
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      
      // Request Fullscreen
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen().catch(e => {
          console.warn('Fullscreen request failed:', e);
        });
      }

      setState(prev => ({ ...prev, hasPermissions: true, stream }));
      
      // Monitor if stream stops
      stream.getVideoTracks()[0].onended = () => {
        if (stateRef.current.isMonitoring) {
          recordViolation('loss_of_screen_sharing', 'User stopped sharing screen');
        }
      };

      return true;
    } catch (err) {
      console.error('Permission denied:', err);
      return false;
    }
  };

  const startMonitoring = () => {
    setState(prev => ({ ...prev, isMonitoring: true, violations: 0 }));
  };

  const stopMonitoring = useCallback(() => {
    setState(prev => {
      if (prev.stream) {
        prev.stream.getTracks().forEach(track => track.stop());
      }
      return { ...prev, isMonitoring: false, stream: null };
    });
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!state.isMonitoring) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        recordViolation('tab_switch', 'Browser tab lost focus or minimized');
      }
    };

    const handleWindowBlur = () => {
      recordViolation('window_switch', 'Window lost focus');
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        recordViolation('fullscreen_exit', 'Exited fullscreen mode');
      }
    };

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      recordViolation('copy', 'Attempted to copy text');
    };

    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      recordViolation('paste', 'Attempted to paste text');
    };

    const handleCut = (e: ClipboardEvent) => {
      e.preventDefault();
      recordViolation('cut', 'Attempted to cut text');
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      recordViolation('right_click', 'Attempted right click');
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Print
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        recordViolation('print_shortcut', 'Attempted to print');
      }
      // Screenshot (Print Screen key)
      if (e.key === 'PrintScreen') {
        recordViolation('screenshot_shortcut', 'Pressed Print Screen');
      }
      // Screenshot Mac (Cmd+Shift+3/4/5)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && ['3','4','5'].includes(e.key)) {
        recordViolation('screenshot_shortcut', 'Mac Screenshot shortcut');
      }
      // DevTools (F12 or Ctrl+Shift+I)
      if (e.key === 'F12' || ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'i') || ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'c')) {
        recordViolation('devtools_opening', 'Attempted to open Developer Tools');
      }
    };

    const handleOnline = () => {};
    const handleOffline = () => {
      recordViolation('network_disconnect', 'Network disconnected');
    };

    // Text selection prevention
    const handleSelectStart = (e: Event) => {
      e.preventDefault();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('cut', handleCut);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('selectstart', handleSelectStart);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('selectstart', handleSelectStart);
    };
  }, [state.isMonitoring, recordViolation]);

  return {
    ...state,
    requestPermissions,
    startMonitoring,
    stopMonitoring,
    recordViolation
  };
};
