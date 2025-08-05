import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface TranscriptionState {
  audioFile: File | null;
  midiData: any | null;
  isTranscribing: boolean;
  error: string | null;
}

const initialState: TranscriptionState = {
  audioFile: null,
  midiData: null,
  isTranscribing: false,
  error: null,
};

const transcriptionSlice = createSlice({
  name: 'transcription',
  initialState,
  reducers: {
    setAudioFile: (state, action: PayloadAction<File | null>) => {
      state.audioFile = action.payload;
      state.error = null;
    },
    setTranscribing: (state, action: PayloadAction<boolean>) => {
      state.isTranscribing = action.payload;
    },
    setMidiData: (state, action: PayloadAction<any>) => {
      state.midiData = action.payload;
      state.isTranscribing = false;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isTranscribing = false;
    },
    clearTranscription: (state) => {
      state.audioFile = null;
      state.midiData = null;
      state.error = null;
    },
  },
});

export const {
  setAudioFile,
  setTranscribing,
  setMidiData,
  setError,
  clearTranscription,
} = transcriptionSlice.actions;

export default transcriptionSlice.reducer;
