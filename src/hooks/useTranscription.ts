import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setTranscribing,
  setMidiData,
  setError,
} from '@/store/slices/transcriptionSlice';
import { transcriptionAPI, TranscriptionRequest } from '@/services/api';
import { mockTranscriptionAPI } from '@/services/mockApi';

// Use mock API for development (can be toggled with environment variable)
const isDevelopment = import.meta.env.DEV;
// const api = isDevelopment ? mockTranscriptionAPI : transcriptionAPI;
const api = transcriptionAPI;

export const useTranscription = () => {
  const dispatch = useAppDispatch();
  const { audioFile, isTranscribing } = useAppSelector(
    (state) => state.transcription
  );

  const [transcriptionId, setTranscriptionId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null);

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Start transcription process
  const startTranscription = useCallback(
    async (options?: TranscriptionRequest['options']) => {
      if (!audioFile) {
        dispatch(setError('No audio file selected'));
        return;
      }

      try {
        dispatch(setTranscribing(true));
        setProgress(0);
        setEstimatedTime(null);

        // Start transcription
        const response = await api.uploadAndTranscribe({
          audioFile,
          options: options || {
            model: 'maestro',
            format: 'midi',
            quality: 'balanced',
          },
        });

        if (response.success) {
          setTranscriptionId(response.transcriptionId);

          // Start polling as fallback
          startPolling(response.transcriptionId);
        } else {
          throw new Error(response.error || 'Failed to start transcription');
        }
      } catch (error) {
        console.error('Transcription error:', error);
        dispatch(
          setError(
            error instanceof Error
              ? error.message
              : 'Failed to start transcription'
          )
        );
        dispatch(setTranscribing(false));
      }
    },
    [audioFile, dispatch]
  );

  // Poll for status updates (fallback when WebSocket is not available)
  const startPolling = useCallback(
    (id: string) => {
      pollingIntervalRef.current = setInterval(async () => {
        try {
          const status = await api.getTranscriptionStatus(id);
          setProgress(status.progress);

          if (status.estimatedTimeRemaining) {
            setEstimatedTime(status.estimatedTimeRemaining);
          }

          if (status.status === 'completed') {
            const result = await api.getTranscriptionResult(id);
            handleTranscriptionComplete(result);
          } else if (status.status === 'failed') {
            throw new Error('Transcription failed');
          }
        } catch (error) {
          console.error('Polling error:', error);
          stopPolling();
          dispatch(setError('Failed to get transcription status'));
          dispatch(setTranscribing(false));
        }
      }, 2000); // Poll every 2 seconds
    },
    [dispatch]
  );

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  // Handle transcription completion
  const handleTranscriptionComplete = useCallback(
    (result: any) => {
      stopPolling();

      if (result.success && result.result) {
        dispatch(setMidiData(result.result));
        setProgress(100);
      } else {
        dispatch(setError(result.error || 'Transcription failed'));
      }

      dispatch(setTranscribing(false));
      setTranscriptionId(null);
    },
    [dispatch, stopPolling]
  );

  // Cancel transcription
  const cancelTranscription = useCallback(async () => {
    if (transcriptionId) {
      try {
        await api.cancelTranscription(transcriptionId);
      } catch (error) {
        console.error('Failed to cancel transcription:', error);
      }
    }

    stopPolling();

    dispatch(setTranscribing(false));
    setTranscriptionId(null);
    setProgress(0);
    setEstimatedTime(null);
  }, [transcriptionId, dispatch, stopPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    startTranscription,
    cancelTranscription,
    progress,
    estimatedTime,
    isTranscribing,
    transcriptionId,
  };
};
