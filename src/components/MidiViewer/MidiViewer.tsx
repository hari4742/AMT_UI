import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Alert,
  CircularProgress,
  Chip,
  Grid,
} from '@mui/material';
import { MusicNote, Info } from '@mui/icons-material';
import { useAppSelector } from '@/store/hooks';
import { MidiProcessor, ProcessedMidiData } from '@/utils/midiProcessor';
import PianoRoll from '@/components/PianoRoll/PianoRoll';
import PlaybackControls from '@/components/PlaybackControls/PlaybackControls';

interface MidiViewerProps {
  midiData?: any; // Raw MIDI data from API
  onNoteClick?: (note: any) => void;
  showZoomControls?: boolean;
}

const MidiViewer: React.FC<MidiViewerProps> = ({
  midiData,
  onNoteClick,
  showZoomControls = true,
}) => {
  const [processedMidi, setProcessedMidi] = useState<ProcessedMidiData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [scrollX, setScrollX] = useState(0);
  const [scrollY, setScrollY] = useState(0);

  const { currentTime, isPlaying } = useAppSelector((state) => state.playback);

  // Process MIDI data when it changes
  useEffect(() => {
    if (!midiData) {
      setProcessedMidi(null);
      return;
    }

    const processMidiData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Extract MIDI data from API response
        const midiString = midiData.midiData || midiData;

        // Process the MIDI data
        const processed = await MidiProcessor.parseMidiData(midiString);
        setProcessedMidi(processed);
      } catch (err) {
        console.error('Error processing MIDI data:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to process MIDI data'
        );
      } finally {
        setIsLoading(false);
      }
    };

    processMidiData();
  }, [midiData]);

  const handleTimeUpdate = useCallback((time: number) => {
    // This will be connected to audio playback in Phase 4
    console.log('Time update:', time);
  }, []);

  const handlePlayPause = useCallback((playing: boolean) => {
    // This will be connected to audio playback in Phase 4
    console.log('Play/Pause:', playing);
  }, []);

  const handleSeek = useCallback((time: number) => {
    // This will be connected to audio playback in Phase 4
    console.log('Seek to:', time);
  }, []);

  const handleSpeedChange = useCallback((speed: number) => {
    // This will be connected to audio playback in Phase 4
    console.log('Speed change:', speed);
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(5, prev * 1.2));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(0.1, prev / 1.2));
  }, []);

  const handleScrollChange = useCallback(
    (newScrollX: number, newScrollY: number) => {
      setScrollX(newScrollX);
      setScrollY(newScrollY);
    },
    []
  );

  const handleNoteClick = useCallback(
    (note: any) => {
      console.log('Note clicked:', note);
      onNoteClick?.(note);
    },
    [onNoteClick]
  );

  if (isLoading) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <CircularProgress size={40} sx={{ mb: 2 }} />
        <Typography variant="body1" color="text.secondary">
          Processing MIDI data...
        </Typography>
      </Paper>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        <Typography variant="body1">Error: {error}</Typography>
      </Alert>
    );
  }

  if (!processedMidi) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <MusicNote sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No MIDI Data Available
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Upload an audio file and generate a transcription to view the piano
          roll.
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      {/* MIDI Information */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Info color="primary" />
          <Typography variant="h6">MIDI Information</Typography>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Duration
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {Math.floor(processedMidi.duration / 60)}:
              {(processedMidi.duration % 60).toFixed(0).padStart(2, '0')}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Total Notes
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {processedMidi.metadata.totalNotes}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Tempo
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {processedMidi.tempo} BPM
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Time Signature
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {processedMidi.timeSignature[0]}/{processedMidi.timeSignature[1]}
            </Typography>
          </Grid>
        </Grid>

        {/* Track Information */}
        {processedMidi.tracks.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Tracks
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {processedMidi.tracks.map((track, index) => (
                <Chip
                  key={index}
                  label={`${track.name} (${track.notes.length} notes)`}
                  size="small"
                  variant="outlined"
                />
              ))}
            </Box>
          </Box>
        )}
      </Paper>

      {/* Playback Controls */}
      <PlaybackControls
        duration={processedMidi.duration}
        onSeek={handleSeek}
        onPlayPause={handlePlayPause}
        onSpeedChange={handleSpeedChange}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        showZoomControls={showZoomControls}
      />

      {/* Piano Roll */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Piano Roll
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Click and drag to navigate, scroll to zoom, click notes for details
        </Typography>

        <PianoRoll
          midiData={processedMidi}
          currentTime={currentTime}
          onTimeUpdate={handleTimeUpdate}
          onNoteClick={handleNoteClick}
          width={800}
          height={400}
          zoom={zoom}
          scrollX={scrollX}
          scrollY={scrollY}
          onScrollChange={handleScrollChange}
          onZoomChange={setZoom}
        />
      </Box>

      {/* Note Details (when a note is selected) */}
      {/* This will be implemented in Phase 4 */}
    </Box>
  );
};

export default MidiViewer;
