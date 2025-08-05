import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Alert,
  CircularProgress,
  Grid,
  Chip,
  Divider,
} from '@mui/material';
import { CompareArrows, MusicNote, Info } from '@mui/icons-material';
import { useAppSelector } from '@/store/hooks';
import { MidiProcessor, ProcessedMidiData } from '@/utils/midiProcessor';
import PianoRoll from '@/components/PianoRoll/PianoRoll';
import PlaybackControls from '@/components/PlaybackControls/PlaybackControls';
import { useSynchronizedPianoRolls } from '@/hooks/useSynchronizedPianoRolls';

interface CompareViewProps {
  onNoteClick?: (note: any, side: 'left' | 'right') => void;
}

const CompareView: React.FC<CompareViewProps> = ({ onNoteClick }) => {
  const { midiData } = useAppSelector((state) => state.transcription);
  const { originalMidiData, error: comparisonError } = useAppSelector(
    (state) => state.comparison
  );

  const [processedGeneratedMidi, setProcessedGeneratedMidi] =
    useState<ProcessedMidiData | null>(null);
  const [processedOriginalMidi, setProcessedOriginalMidi] =
    useState<ProcessedMidiData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Synchronized piano roll state
  const {
    zoom,
    scrollX,
    scrollY,
    isDragging,
    handleZoomChange,
    handleScrollChange,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    handleSeek,
    handlePlayPause,
    handleSpeedChange,
    currentTime,
    isPlaying,
    playbackSpeed,
  } = useSynchronizedPianoRolls();

  // Process MIDI data when it changes
  useEffect(() => {
    const processMidiData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Process generated MIDI
        if (midiData) {
          const midiString = midiData.midiData || midiData;
          const processed = await MidiProcessor.parseMidiData(midiString);
          setProcessedGeneratedMidi(processed);
        }

        // Process original MIDI
        if (originalMidiData) {
          const processed = await MidiProcessor.parseMidiData(originalMidiData);
          setProcessedOriginalMidi(processed);
        }
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
  }, [midiData, originalMidiData]);

  const handleNoteClick = useCallback(
    (note: any, side: 'left' | 'right') => {
      console.log(`${side} note clicked:`, note);
      onNoteClick?.(note, side);
    },
    [onNoteClick]
  );

  const handleZoomIn = useCallback(() => {
    handleZoomChange(Math.min(5, zoom * 1.2));
  }, [zoom, handleZoomChange]);

  const handleZoomOut = useCallback(() => {
    handleZoomChange(Math.max(0.1, zoom / 1.2));
  }, [zoom, handleZoomChange]);

  if (isLoading) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <CircularProgress size={40} sx={{ mb: 2 }} />
        <Typography variant="body1" color="text.secondary">
          Processing MIDI data for comparison...
        </Typography>
      </Paper>
    );
  }

  if (error || comparisonError) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        <Typography variant="body1">
          Error: {error || comparisonError}
        </Typography>
      </Alert>
    );
  }

  if (!processedGeneratedMidi || !processedOriginalMidi) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <CompareArrows sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No MIDI Data Available for Comparison
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Both generated and original MIDI files are required for comparison.
        </Typography>
      </Paper>
    );
  }

  // Calculate comparison metrics
  const generatedNotes = processedGeneratedMidi.notes.length;
  const originalNotes = processedOriginalMidi.notes.length;
  const durationDiff = Math.abs(
    processedGeneratedMidi.duration - processedOriginalMidi.duration
  );
  const tempoDiff = Math.abs(
    processedGeneratedMidi.tempo - processedOriginalMidi.tempo
  );

  return (
    <Box>
      {/* Comparison Header */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <CompareArrows color="primary" />
          <Typography variant="h6">MIDI Comparison</Typography>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Generated Notes
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {generatedNotes}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Original Notes
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {originalNotes}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Duration Diff
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {durationDiff.toFixed(2)}s
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Tempo Diff
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {tempoDiff.toFixed(1)} BPM
            </Typography>
          </Grid>
        </Grid>

        {/* Comparison Metrics */}
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Comparison Metrics
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              label={`Note Count: ${generatedNotes} vs ${originalNotes}`}
              size="small"
              variant="outlined"
              color={
                Math.abs(generatedNotes - originalNotes) > 10
                  ? 'error'
                  : 'success'
              }
            />
            <Chip
              label={`Duration: ${processedGeneratedMidi.duration.toFixed(
                1
              )}s vs ${processedOriginalMidi.duration.toFixed(1)}s`}
              size="small"
              variant="outlined"
              color={durationDiff > 5 ? 'error' : 'success'}
            />
            <Chip
              label={`Tempo: ${processedGeneratedMidi.tempo} vs ${processedOriginalMidi.tempo} BPM`}
              size="small"
              variant="outlined"
              color={tempoDiff > 10 ? 'error' : 'success'}
            />
          </Box>
        </Box>
      </Paper>

      {/* Synchronized Playback Controls */}
      <PlaybackControls
        duration={Math.max(
          processedGeneratedMidi.duration,
          processedOriginalMidi.duration
        )}
        onSeek={handleSeek}
        onPlayPause={handlePlayPause}
        onSpeedChange={handleSpeedChange}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        showZoomControls={true}
      />

      {/* Dual Piano Rolls */}
      <Grid container spacing={2}>
        {/* Generated MIDI (Left) */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <MusicNote color="primary" />
              <Typography variant="h6">Generated Transcription</Typography>
            </Box>

            <PianoRoll
              midiData={processedGeneratedMidi}
              currentTime={currentTime}
              onTimeUpdate={handleSeek}
              onNoteClick={(note) => handleNoteClick(note, 'left')}
              width={400}
              height={300}
              zoom={zoom}
              scrollX={scrollX}
              scrollY={scrollY}
              onScrollChange={handleScrollChange}
              onZoomChange={handleZoomChange}
              isSynchronized={true}
            />
          </Paper>
        </Grid>

        {/* Original MIDI (Right) */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Info color="secondary" />
              <Typography variant="h6">Original MIDI</Typography>
            </Box>

            <PianoRoll
              midiData={processedOriginalMidi}
              currentTime={currentTime}
              onTimeUpdate={handleSeek}
              onNoteClick={(note) => handleNoteClick(note, 'right')}
              width={400}
              height={300}
              zoom={zoom}
              scrollX={scrollX}
              scrollY={scrollY}
              onScrollChange={handleScrollChange}
              onZoomChange={handleZoomChange}
              isSynchronized={true}
            />
          </Paper>
        </Grid>
      </Grid>

      {/* Instructions */}
      <Paper sx={{ p: 2, mt: 2 }}>
        <Typography variant="body2" color="text.secondary">
          <strong>Instructions:</strong> Both piano rolls are synchronized. Use
          the playback controls to play both simultaneously. Click and drag to
          navigate, scroll to zoom. The playhead moves in sync across both
          views.
        </Typography>
      </Paper>
    </Box>
  );
};

export default CompareView;
