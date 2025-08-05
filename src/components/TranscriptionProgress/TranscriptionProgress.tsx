import React from 'react';
import {
  Box,
  Paper,
  Typography,
  LinearProgress,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Cancel, MusicNote } from '@mui/icons-material';

interface TranscriptionProgressProps {
  progress: number;
  estimatedTime?: number | null;
  isTranscribing: boolean;
  onCancel: () => void;
}

const TranscriptionProgress: React.FC<TranscriptionProgressProps> = ({
  progress,
  estimatedTime,
  isTranscribing,
  onCancel,
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressMessage = () => {
    if (progress < 20) return 'Analyzing audio file...';
    if (progress < 40) return 'Extracting musical features...';
    if (progress < 60) return 'Detecting notes and timing...';
    if (progress < 80) return 'Generating MIDI transcription...';
    if (progress < 100) return 'Finalizing transcription...';
    return 'Transcription complete!';
  };

  return (
    <Paper sx={{ p: 3, mt: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <CircularProgress size={24} />
        <Typography variant="h6">Transcribing Audio</Typography>
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {getProgressMessage()}
        </Typography>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{ height: 8, borderRadius: 4 }}
        />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {progress}% complete
          {estimatedTime && ` • Est. ${formatTime(estimatedTime)} remaining`}
        </Typography>
      </Box>

      {estimatedTime && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            Estimated time remaining: {formatTime(estimatedTime)}
          </Typography>
        </Alert>
      )}

      <Button
        variant="outlined"
        color="error"
        startIcon={<Cancel />}
        onClick={onCancel}
        disabled={!isTranscribing}
      >
        Cancel Transcription
      </Button>
    </Paper>
  );
};

export default TranscriptionProgress;
