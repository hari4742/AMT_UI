import React, { useState, useCallback } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import { CompareArrows, Upload, Close } from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setOriginalMidiFile,
  setOriginalMidiData,
  setComparing,
  setComparisonError,
} from '@/store/slices/comparisonSlice';
import type { SelectedFileInfo } from '@/store/slices/comparisonSlice';
import { MidiProcessor } from '@/utils/midiProcessor';
import { useNavigate } from 'react-router-dom';

interface CompareButtonProps {
  onCompare?: () => void;
  disabled?: boolean;
}

const CompareButton: React.FC<CompareButtonProps> = ({
  onCompare,
  disabled = false,
}) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { originalMidiFile, isComparing, error } = useAppSelector(
    (state) => state.comparison
  );
  const { midiData } = useAppSelector((state) => state.transcription);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      setIsProcessing(true);
      setUploadError(null);

      try {
        // Validate file type
        if (
          !file.name.toLowerCase().endsWith('.mid') &&
          !file.name.toLowerCase().endsWith('.midi')
        ) {
          throw new Error('Please upload a valid MIDI file (.mid or .midi)');
        }

        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
          throw new Error('MIDI file size must be less than 10MB');
        }

        // Read the MIDI file into ArrayBuffer and process
        const arrayBuffer = await file.arrayBuffer();
        const processedMidi = await MidiProcessor.parseMidiData(arrayBuffer);

        // Store serializable file info in Redux to avoid non-serializable warnings
        const fileInfo: SelectedFileInfo = {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
        };
        dispatch(setOriginalMidiFile(fileInfo));
        // Store already processed, serializable MIDI data
        dispatch(setOriginalMidiData(processedMidi));
        dispatch(setComparing(true));

        // Close dialog and navigate to comparison page
        setIsDialogOpen(false);
        navigate('/compare');
        onCompare?.();
      } catch (error) {
        console.error('Error processing MIDI file:', error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to process MIDI file';
        setUploadError(errorMessage);
        dispatch(setComparisonError(errorMessage));
      } finally {
        setIsProcessing(false);
      }
    },
    [dispatch, navigate, onCompare]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/midi': ['.mid', '.midi'],
    },
    multiple: false,
  });

  const handleCompareClick = () => {
    if (!midiData) {
      dispatch(setComparisonError('No transcription available for comparison'));
      return;
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setUploadError(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <>
      <Button
        variant="contained"
        size="large"
        startIcon={<CompareArrows />}
        onClick={handleCompareClick}
        disabled={disabled || !midiData}
        sx={{ minWidth: 200 }}
      >
        Compare with Original MIDI
      </Button>

      <Dialog
        open={isDialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CompareArrows color="primary" />
            <Typography variant="h6">Upload Original MIDI File</Typography>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Upload the original MIDI file to compare with the generated
            transcription.
          </Typography>

          {uploadError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {uploadError}
            </Alert>
          )}

          <Box
            {...getRootProps()}
            sx={{
              p: 3,
              border: '2px dashed',
              borderColor: isDragActive ? 'primary.main' : 'grey.300',
              backgroundColor: isDragActive ? 'primary.50' : 'background.paper',
              borderRadius: 1,
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                borderColor: 'primary.main',
                backgroundColor: 'primary.50',
              },
              textAlign: 'center',
            }}
          >
            <input {...getInputProps()} />

            {isProcessing ? (
              <Box sx={{ textAlign: 'center' }}>
                <CircularProgress size={40} sx={{ mb: 2 }} />
                <Typography variant="body1" color="text.secondary">
                  Processing MIDI file...
                </Typography>
              </Box>
            ) : (
              <>
                <Upload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  {isDragActive
                    ? 'Drop the MIDI file here'
                    : 'Drag & drop a MIDI file here'}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  or click to browse files
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Supported formats: .mid, .midi (max 10MB)
                </Typography>
              </>
            )}
          </Box>

          {originalMidiFile && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Selected file:
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {originalMidiFile.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatFileSize(originalMidiFile.size)}
              </Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseDialog} startIcon={<Close />}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CompareButton;
