import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { ProcessedNote, ProcessedMidiData } from '@/utils/midiProcessor';

interface PianoRollProps {
  midiData: ProcessedMidiData;
  currentTime?: number;
  onTimeUpdate?: (time: number) => void;
  onNoteClick?: (note: ProcessedNote) => void;
  width?: number;
  height?: number;
  zoom?: number;
  scrollX?: number;
  scrollY?: number;
  onScrollChange?: (scrollX: number, scrollY: number) => void;
  onZoomChange?: (zoom: number) => void;
}

interface PianoRollState {
  zoom: number;
  scrollX: number;
  scrollY: number;
  isDragging: boolean;
  lastMouseX: number;
  lastMouseY: number;
}

const PianoRoll: React.FC<PianoRollProps> = ({
  midiData,
  currentTime = 0,
  onTimeUpdate,
  onNoteClick,
  width = 800,
  height = 400,
  zoom: externalZoom,
  scrollX: externalScrollX,
  scrollY: externalScrollY,
  onScrollChange,
  onZoomChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [state, setState] = useState<PianoRollState>({
    zoom: externalZoom || 1,
    scrollX: externalScrollX || 0,
    scrollY: externalScrollY || 0,
    isDragging: false,
    lastMouseX: 0,
    lastMouseY: 0,
  });

  // Constants for piano roll
  const NOTE_HEIGHT = 20;
  const TIME_SCALE = 100; // pixels per second
  const PIANO_WIDTH = 80;
  const GRID_COLOR = '#e0e0e0';
  const NOTE_COLOR = '#1976d2';
  const NOTE_BORDER_COLOR = '#1565c0';
  const PLAYHEAD_COLOR = '#f44336';
  const PIANO_KEYS = [
    'C',
    'C#',
    'D',
    'D#',
    'E',
    'F',
    'F#',
    'G',
    'G#',
    'A',
    'A#',
    'B',
  ];

  // Get current zoom and scroll from props or internal state
  const zoom = externalZoom !== undefined ? externalZoom : state.zoom;
  const scrollX =
    externalScrollX !== undefined ? externalScrollX : state.scrollX;
  const scrollY =
    externalScrollY !== undefined ? externalScrollY : state.scrollY;

  // Calculate visible range
  const visibleTimeStart = scrollX / (TIME_SCALE * zoom);
  const visibleTimeEnd =
    visibleTimeStart + (width - PIANO_WIDTH) / (TIME_SCALE * zoom);
  const visibleNoteStart = Math.floor(scrollY / (NOTE_HEIGHT * zoom));
  const visibleNoteEnd =
    visibleNoteStart + Math.ceil(height / (NOTE_HEIGHT * zoom));

  // Filter notes to visible range
  const visibleNotes = midiData.notes.filter(
    (note) =>
      note.startTime <= visibleTimeEnd &&
      note.endTime >= visibleTimeStart &&
      note.note >= visibleNoteStart &&
      note.note <= visibleNoteEnd
  );

  // Draw piano roll
  const drawPianoRoll = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Draw piano keys
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, PIANO_WIDTH, height);

    // Draw piano key labels
    ctx.fillStyle = '#333333';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';

    for (let i = visibleNoteStart; i <= visibleNoteEnd; i++) {
      const y = (i - visibleNoteStart) * NOTE_HEIGHT * zoom - scrollY;
      const noteName = PIANO_KEYS[i % 12] + Math.floor(i / 12);

      // Alternate key colors
      const isBlackKey = [1, 3, 6, 8, 10].includes(i % 12);
      ctx.fillStyle = isBlackKey ? '#333333' : '#ffffff';
      ctx.fillRect(0, y, PIANO_WIDTH, NOTE_HEIGHT * zoom);

      // Draw key border
      ctx.strokeStyle = '#cccccc';
      ctx.strokeRect(0, y, PIANO_WIDTH, NOTE_HEIGHT * zoom);

      // Draw note name
      ctx.fillStyle = isBlackKey ? '#ffffff' : '#333333';
      ctx.fillText(noteName, PIANO_WIDTH / 2, y + (NOTE_HEIGHT * zoom) / 2 + 4);
    }

    // Draw grid
    ctx.strokeStyle = GRID_COLOR;
    ctx.lineWidth = 1;

    // Vertical time grid
    const timeStep = zoom < 0.5 ? 1 : zoom < 1 ? 0.5 : 0.25;
    for (
      let time = Math.floor(visibleTimeStart / timeStep) * timeStep;
      time <= visibleTimeEnd;
      time += timeStep
    ) {
      const x = (time - visibleTimeStart) * TIME_SCALE * zoom + PIANO_WIDTH;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Horizontal note grid
    for (let note = visibleNoteStart; note <= visibleNoteEnd; note++) {
      const y = (note - visibleNoteStart) * NOTE_HEIGHT * zoom - scrollY;
      ctx.beginPath();
      ctx.moveTo(PIANO_WIDTH, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw notes
    visibleNotes.forEach((note) => {
      const noteY =
        (note.note - visibleNoteStart) * NOTE_HEIGHT * zoom - scrollY;
      const noteX =
        (note.startTime - visibleTimeStart) * TIME_SCALE * zoom + PIANO_WIDTH;
      const noteWidth = note.duration * TIME_SCALE * zoom;

      // Draw note rectangle
      ctx.fillStyle = NOTE_COLOR;
      ctx.fillRect(noteX, noteY, noteWidth, NOTE_HEIGHT * zoom - 2);

      // Draw note border
      ctx.strokeStyle = NOTE_BORDER_COLOR;
      ctx.lineWidth = 1;
      ctx.strokeRect(noteX, noteY, noteWidth, NOTE_HEIGHT * zoom - 2);

      // Draw note name (if zoom is high enough)
      if (zoom > 0.8 && noteWidth > 30) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
          note.noteName,
          noteX + noteWidth / 2,
          noteY + (NOTE_HEIGHT * zoom) / 2 + 3
        );
      }
    });

    // Draw playhead
    if (currentTime >= visibleTimeStart && currentTime <= visibleTimeEnd) {
      const playheadX =
        (currentTime - visibleTimeStart) * TIME_SCALE * zoom + PIANO_WIDTH;
      ctx.strokeStyle = PLAYHEAD_COLOR;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, height);
      ctx.stroke();
    }
  }, [
    midiData,
    currentTime,
    zoom,
    scrollX,
    scrollY,
    width,
    height,
    visibleNotes,
  ]);

  // Handle mouse events
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Check if clicking on a note
      if (x > PIANO_WIDTH) {
        const time = (x - PIANO_WIDTH) / (TIME_SCALE * zoom) + visibleTimeStart;
        const noteNumber =
          Math.floor((y + scrollY) / (NOTE_HEIGHT * zoom)) + visibleNoteStart;

        const clickedNote = visibleNotes.find(
          (note) =>
            note.note === noteNumber &&
            note.startTime <= time &&
            note.endTime >= time
        );

        if (clickedNote && onNoteClick) {
          onNoteClick(clickedNote);
          return;
        }
      }

      // Start dragging
      setState((prev) => ({
        ...prev,
        isDragging: true,
        lastMouseX: x,
        lastMouseY: y,
      }));
    },
    [zoom, scrollX, scrollY, visibleNotes, onNoteClick]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!state.isDragging) return;

      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const deltaX = x - state.lastMouseX;
      const deltaY = y - state.lastMouseY;

      const newScrollX = scrollX - deltaX;
      const newScrollY = scrollY - deltaY;

      if (onScrollChange) {
        onScrollChange(newScrollX, newScrollY);
      } else {
        setState((prev) => ({
          ...prev,
          scrollX: newScrollX,
          scrollY: newScrollY,
          lastMouseX: x,
          lastMouseY: y,
        }));
      }
    },
    [
      state.isDragging,
      state.lastMouseX,
      state.lastMouseY,
      scrollX,
      scrollY,
      onScrollChange,
    ]
  );

  const handleMouseUp = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isDragging: false,
    }));
  }, []);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();

      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Zoom with mouse wheel
      const zoomDelta = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.1, Math.min(5, zoom * zoomDelta));

      if (onZoomChange) {
        onZoomChange(newZoom);
      } else {
        setState((prev) => ({
          ...prev,
          zoom: newZoom,
        }));
      }
    },
    [zoom, onZoomChange]
  );

  // Redraw when dependencies change
  useEffect(() => {
    drawPianoRoll();
  }, [drawPianoRoll]);

  return (
    <Paper sx={{ overflow: 'hidden' }}>
      <Box
        ref={containerRef}
        sx={{
          position: 'relative',
          cursor: state.isDragging ? 'grabbing' : 'grab',
        }}
      >
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          style={{
            display: 'block',
            cursor: state.isDragging ? 'grabbing' : 'grab',
          }}
        />
      </Box>
    </Paper>
  );
};

export default PianoRoll;
