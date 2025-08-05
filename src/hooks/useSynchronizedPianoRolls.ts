import { useState, useCallback, useRef, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setCurrentTime,
  setPlaying,
  setPlaybackSpeed,
} from '@/store/slices/playbackSlice';

interface SynchronizedPianoRollsState {
  zoom: number;
  scrollX: number;
  scrollY: number;
  isDragging: boolean;
  lastMouseX: number;
  lastMouseY: number;
}

export const useSynchronizedPianoRolls = () => {
  const dispatch = useAppDispatch();
  const { currentTime, isPlaying, playbackSpeed } = useAppSelector(
    (state) => state.playback
  );

  const [state, setState] = useState<SynchronizedPianoRollsState>({
    zoom: 1,
    scrollX: 0,
    scrollY: 0,
    isDragging: false,
    lastMouseX: 0,
    lastMouseY: 0,
  });

  const animationFrameRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);

  // Auto-scroll to keep playhead visible
  const autoScrollToPlayhead = useCallback(() => {
    if (!isPlaying) return;

    const TIME_SCALE = 100; // pixels per second
    const PIANO_WIDTH = 80;
    const playheadX = currentTime * TIME_SCALE * state.zoom + PIANO_WIDTH;

    // Calculate visible range
    const visibleWidth = 800 - PIANO_WIDTH; // Assuming 800px width
    const visibleTimeStart = state.scrollX / (TIME_SCALE * state.zoom);
    const visibleTimeEnd =
      visibleTimeStart + visibleWidth / (TIME_SCALE * state.zoom);

    // Check if playhead is outside visible range
    if (currentTime < visibleTimeStart || currentTime > visibleTimeEnd) {
      const newScrollX = Math.max(0, playheadX - visibleWidth / 2);
      setState((prev) => ({ ...prev, scrollX: newScrollX }));
    }
  }, [currentTime, isPlaying, state.zoom, state.scrollX]);

  // Real-time playhead movement
  const updatePlayhead = useCallback(() => {
    if (!isPlaying) return;

    const now = performance.now();
    const deltaTime = (now - lastTimeRef.current) / 1000;
    lastTimeRef.current = now;

    const newTime = currentTime + deltaTime * playbackSpeed;
    dispatch(setCurrentTime(newTime));

    animationFrameRef.current = requestAnimationFrame(updatePlayhead);
  }, [isPlaying, currentTime, playbackSpeed, dispatch]);

  // Start/stop real-time updates
  useEffect(() => {
    if (isPlaying) {
      lastTimeRef.current = performance.now();
      animationFrameRef.current = requestAnimationFrame(updatePlayhead);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, updatePlayhead]);

  // Auto-scroll effect
  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(autoScrollToPlayhead, 100);
      return () => clearInterval(interval);
    }
  }, [isPlaying, autoScrollToPlayhead]);

  // Handle zoom change
  const handleZoomChange = useCallback((newZoom: number) => {
    setState((prev) => ({ ...prev, zoom: newZoom }));
  }, []);

  // Handle scroll change
  const handleScrollChange = useCallback(
    (newScrollX: number, newScrollY: number) => {
      setState((prev) => ({
        ...prev,
        scrollX: newScrollX,
        scrollY: newScrollY,
      }));
    },
    []
  );

  // Handle mouse down for dragging
  const handleMouseDown = useCallback((x: number, y: number) => {
    setState((prev) => ({
      ...prev,
      isDragging: true,
      lastMouseX: x,
      lastMouseY: y,
    }));
  }, []);

  // Handle mouse move for dragging
  const handleMouseMove = useCallback(
    (x: number, y: number) => {
      if (!state.isDragging) return;

      const deltaX = x - state.lastMouseX;
      const deltaY = y - state.lastMouseY;

      const newScrollX = Math.max(0, state.scrollX - deltaX);
      const newScrollY = Math.max(0, state.scrollY - deltaY);

      setState((prev) => ({
        ...prev,
        scrollX: newScrollX,
        scrollY: newScrollY,
        lastMouseX: x,
        lastMouseY: y,
      }));
    },
    [
      state.isDragging,
      state.lastMouseX,
      state.lastMouseY,
      state.scrollX,
      state.scrollY,
    ]
  );

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setState((prev) => ({ ...prev, isDragging: false }));
  }, []);

  // Handle wheel zoom
  const handleWheel = useCallback(
    (deltaY: number, x: number, y: number) => {
      const zoomDelta = deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.1, Math.min(5, state.zoom * zoomDelta));

      setState((prev) => ({ ...prev, zoom: newZoom }));
    },
    [state.zoom]
  );

  // Seek to time
  const handleSeek = useCallback(
    (time: number) => {
      dispatch(setCurrentTime(time));
    },
    [dispatch]
  );

  // Play/pause
  const handlePlayPause = useCallback(
    (playing: boolean) => {
      dispatch(setPlaying(playing));
    },
    [dispatch]
  );

  // Speed change
  const handleSpeedChange = useCallback(
    (speed: number) => {
      dispatch(setPlaybackSpeed(speed));
    },
    [dispatch]
  );

  return {
    // State
    zoom: state.zoom,
    scrollX: state.scrollX,
    scrollY: state.scrollY,
    isDragging: state.isDragging,

    // Handlers
    handleZoomChange,
    handleScrollChange,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    handleSeek,
    handlePlayPause,
    handleSpeedChange,

    // Current playback state
    currentTime,
    isPlaying,
    playbackSpeed,
  };
};
