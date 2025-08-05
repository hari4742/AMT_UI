import { Box, Typography, Paper, Alert, Button } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import CompareView from '@/components/CompareView/CompareView';
import CompareButton from '@/components/CompareButton/CompareButton';

const ComparePage = () => {
  const navigate = useNavigate();
  const { midiData } = useAppSelector((state) => state.transcription);
  const { originalMidiData, isComparing, error } = useAppSelector(
    (state) => state.comparison
  );

  const handleBackToTranscription = () => {
    navigate('/transcribe');
  };

  const handleNoteClick = (note: any, side: 'left' | 'right') => {
    console.log(`${side} note clicked:`, note);
    // This will be enhanced in Phase 5 with note details panel
  };

  // Check if we have both MIDI files for comparison
  const hasBothMidiFiles = midiData && originalMidiData;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={handleBackToTranscription}
        >
          Back to Transcription
        </Button>
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
          MIDI Comparison
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!hasBothMidiFiles && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Setup Comparison
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            To compare MIDI files, you need both a generated transcription and
            an original MIDI file.
          </Typography>

          {!midiData && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                No transcription available. Please go to the Transcription page
                to generate a MIDI transcription first.
              </Typography>
            </Alert>
          )}

          {midiData && !originalMidiData && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Upload the original MIDI file to compare with your
                transcription:
              </Typography>
              <Box sx={{ mt: 2 }}>
                <CompareButton />
              </Box>
            </Box>
          )}
        </Paper>
      )}

      {hasBothMidiFiles && <CompareView onNoteClick={handleNoteClick} />}
    </Box>
  );
};

export default ComparePage;
