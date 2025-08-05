import { Box, Typography, Paper, Alert } from '@mui/material';
import { useAppSelector } from '@/store/hooks';
import AudioUploader from '@/components/AudioUploader/AudioUploader';
import MidiViewer from '@/components/MidiViewer/MidiViewer';

const TranscriptionPage = () => {
  const { error, midiData } = useAppSelector((state) => state.transcription);

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Audio Transcription
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Upload Audio File
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Upload an audio file to generate a MIDI transcription. Supported
          formats include WAV, MP3, M4A, FLAC, and OGG.
        </Typography>

        <AudioUploader />
      </Paper>

      {/* MIDI Viewer - shown when transcription is complete */}
      {midiData && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Transcription Result
          </Typography>
          <MidiViewer midiData={midiData} />
        </Paper>
      )}
    </Box>
  );
};

export default TranscriptionPage;
