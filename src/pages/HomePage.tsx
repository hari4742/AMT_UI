import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Paper,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';

const HomePage = () => {
  const navigate = useNavigate();

  const features = [
    {
      title: 'Audio Transcription',
      description:
        'Upload audio files and generate MIDI transcriptions using our advanced AI model.',
      icon: <UploadFileIcon sx={{ fontSize: 40 }} />,
      action: () => navigate('/transcribe'),
      buttonText: 'Start Transcribing',
    },
    {
      title: 'MIDI Comparison',
      description:
        'Compare generated transcriptions with original MIDI files in synchronized piano roll views.',
      icon: <CompareArrowsIcon sx={{ fontSize: 40 }} />,
      action: () => navigate('/compare'),
      buttonText: 'Compare MIDI',
    },
  ];

  return (
    <Box>
      <Typography variant="h3" component="h1" gutterBottom align="center">
        Automatic Music Transcription UI
      </Typography>
      <Typography
        variant="h6"
        component="h2"
        gutterBottom
        align="center"
        color="text.secondary"
      >
        Upload audio files, generate transcriptions, and compare results
      </Typography>

      <Grid container spacing={4} sx={{ mt: 4 }}>
        {features.map((feature, index) => (
          <Grid item xs={12} md={6} key={index}>
            <Card
              sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
            >
              <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                <Box sx={{ mb: 2 }}>{feature.icon}</Box>
                <Typography variant="h5" component="h3" gutterBottom>
                  {feature.title}
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                  {feature.description}
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  onClick={feature.action}
                  sx={{ mt: 2 }}
                >
                  {feature.buttonText}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Paper sx={{ p: 3, mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          How it works:
        </Typography>
        <Typography variant="body1" paragraph>
          1. Upload an audio file (WAV, MP3, etc.)
        </Typography>
        <Typography variant="body1" paragraph>
          2. Our AI model generates a MIDI transcription
        </Typography>
        <Typography variant="body1" paragraph>
          3. View the transcription in a piano roll interface
        </Typography>
        <Typography variant="body1">
          4. Optionally compare with an original MIDI file
        </Typography>
      </Paper>
    </Box>
  );
};

export default HomePage;
