import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ComparisonState {
  originalMidiFile: File | null;
  originalMidiData: any | null;
  isComparing: boolean;
  error: string | null;
}

const initialState: ComparisonState = {
  originalMidiFile: null,
  originalMidiData: null,
  isComparing: false,
  error: null,
};

const comparisonSlice = createSlice({
  name: 'comparison',
  initialState,
  reducers: {
    setOriginalMidiFile: (state, action: PayloadAction<File>) => {
      state.originalMidiFile = action.payload;
      state.error = null;
    },
    setOriginalMidiData: (state, action: PayloadAction<any>) => {
      state.originalMidiData = action.payload;
    },
    setComparing: (state, action: PayloadAction<boolean>) => {
      state.isComparing = action.payload;
    },
    setComparisonError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isComparing = false;
    },
    clearComparison: (state) => {
      state.originalMidiFile = null;
      state.originalMidiData = null;
      state.error = null;
    },
  },
});

export const {
  setOriginalMidiFile,
  setOriginalMidiData,
  setComparing,
  setComparisonError,
  clearComparison,
} = comparisonSlice.actions;

export default comparisonSlice.reducer;
