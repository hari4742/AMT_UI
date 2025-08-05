import React, { useCallback, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  LinearProgress,
  Alert,
  IconButton,
} from '@mui/material';
import { CloudUpload, Delete, MusicNote } from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setAudioFile, setError } from '@/store/slices/transcriptionSlice';
import { useTranscription } from '@/hooks/useTranscription';
import TranscriptionProgress from '@/components/TranscriptionProgress/TranscriptionProgress';
import TranscriptionSuccess from '@/components/TranscriptionSuccess/TranscriptionSuccess';

const AudioUploader = () => {
  const dispatch = useAppDispatch();
  const { audioFile, error, midiData } = useAppSelector(
    (state) => state.transcription
  );
  const {
    startTranscription,
    cancelTranscription,
    progress,
    estimatedTime,
    isTranscribing,
  } = useTranscription();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      handleFileUpload(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } =
    useDropzone({
      onDrop,
      accept: {
        'audio/*': ['.wav', '.mp3', '.m4a', '.flac', '.ogg'],
      },
      multiple: false,
    });

  const handleFileUpload = (file: File) => {
    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      dispatch(setError('File size must be less than 50MB'));
      return;
    }

    // Validate file type
    const validTypes = [
      'audio/wav',
      'audio/mp3',
      'audio/m4a',
      'audio/flac',
      'audio/ogg',
    ];
    if (!validTypes.includes(file.type)) {
      dispatch(
        setError('Please upload a valid audio file (WAV, MP3, M4A, FLAC, OGG)')
      );
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          dispatch(setAudioFile(file));
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const handleRemoveFile = () => {
    dispatch(setAudioFile(null));
    setUploadProgress(0);
    setIsUploading(false);
  };

  const handleGenerateTranscript = async () => {
    try {
      await startTranscription({
        model: 'maestro',
        format: 'midi',
        quality: 'balanced',
      });
    } catch (error) {
      console.error('Failed to start transcription:', error);
    }
  };

  const handleDownload = () => {
    if (midiData?.midiData) {
      // Convert base64 to blob and download
      const binaryString = atob(midiData.midiData as string);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const blob = new Blob([bytes], { type: 'audio/midi' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'transcription.mid';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const selectedFile = acceptedFiles[0];

  return (
    <Box>
      <Paper
        {...getRootProps()}
        sx={{
          p: 3,
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'grey.300',
          backgroundColor: isDragActive ? 'primary.50' : 'background.paper',
          cursor: 'pointer',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            borderColor: 'primary.main',
            backgroundColor: 'primary.50',
          },
        }}
      >
        <input {...getInputProps()} />
        <Box sx={{ textAlign: 'center' }}>
          <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            {isDragActive
              ? 'Drop the audio file here'
              : 'Drag & drop an audio file here'}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            or click to browse files
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Supported formats: WAV, MP3, M4A, FLAC, OGG (max 50MB)
          </Typography>
        </Box>
      </Paper>

      {selectedFile && (
        <Paper sx={{ p: 2, mt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <MusicNote color="primary" />
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="body1" fontWeight="medium">
                {selectedFile.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatFileSize(selectedFile.size)}
              </Typography>
            </Box>
            <IconButton onClick={handleRemoveFile} color="error" size="small">
              <Delete />
            </IconButton>
          </Box>

          {isUploading && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                Uploading...
              </Typography>
              <LinearProgress variant="determinate" value={uploadProgress} />
            </Box>
          )}
        </Paper>
      )}

      {selectedFile && !isUploading && !isTranscribing && !midiData && (
        <Box sx={{ mt: 2 }}>
          <Button
            variant="contained"
            size="large"
            fullWidth
            onClick={handleGenerateTranscript}
            disabled={isTranscribing}
          >
            Generate Transcript
          </Button>
        </Box>
      )}

      {isTranscribing && (
        <TranscriptionProgress
          progress={progress}
          estimatedTime={estimatedTime}
          isTranscribing={isTranscribing}
          onCancel={cancelTranscription}
        />
      )}

      {midiData && !isTranscribing && (
        <TranscriptionSuccess onDownload={handleDownload} />
      )}
    </Box>
  );
};

export default AudioUploader;
