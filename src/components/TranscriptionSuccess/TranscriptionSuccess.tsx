import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  Chip,
  Grid,
} from '@mui/material';
import { CheckCircle, CompareArrows, Download } from '@mui/icons-material';
import { useAppSelector } from '@/store/hooks';

interface TranscriptionSuccessProps {
  onCompare: () => void;
  onDownload?: () => void;
}

const TranscriptionSuccess: React.FC<TranscriptionSuccessProps> = ({
  onCompare,
  onDownload,
}) => {
  const { midiData } = useAppSelector((state) => state.transcription);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatConfidence = (confidence: number) => {
    return `${(confidence * 100).toFixed(1)}%`;
  };

  if (!midiData) return null;

  return (
    <Paper sx={{ p: 3, mt: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <CheckCircle color="success" sx={{ fontSize: 32 }} />
        <Typography variant="h6" color="success.main">
          Transcription Complete!
        </Typography>
      </Box>

      <Alert severity="success" sx={{ mb: 2 }}>
        <Typography variant="body2">
          Your audio has been successfully transcribed to MIDI format.
        </Typography>
      </Alert>

      {/* Transcription Metadata */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Duration
          </Typography>
          <Typography variant="body1" fontWeight="medium">
            {formatDuration(midiData.duration)}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Notes Detected
          </Typography>
          <Typography variant="body1" fontWeight="medium">
            {midiData.notes?.length || 0} notes
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Model Used
          </Typography>
          <Chip
            label={midiData.metadata?.model || 'Unknown'}
            size="small"
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Confidence
          </Typography>
          <Typography variant="body1" fontWeight="medium">
            {formatConfidence(midiData.metadata?.confidence || 0)}
          </Typography>
        </Grid>
      </Grid>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          size="large"
          startIcon={<CompareArrows />}
          onClick={onCompare}
        >
          Compare with Original MIDI
        </Button>

        {onDownload && (
          <Button
            variant="outlined"
            size="large"
            startIcon={<Download />}
            onClick={onDownload}
          >
            Download MIDI
          </Button>
        )}
      </Box>

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ mt: 2, display: 'block' }}
      >
        Processing time:{' '}
        {Math.round((midiData.metadata?.processingTime || 0) / 1000)}s
      </Typography>
    </Paper>
  );
};

export default TranscriptionSuccess;
