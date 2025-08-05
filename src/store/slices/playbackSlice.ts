import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackSpeed: number;
}

const initialState: PlaybackState = {
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  playbackSpeed: 1,
};

const playbackSlice = createSlice({
  name: 'playback',
  initialState,
  reducers: {
    setPlaying: (state, action: PayloadAction<boolean>) => {
      state.isPlaying = action.payload;
    },
    setCurrentTime: (state, action: PayloadAction<number>) => {
      state.currentTime = action.payload;
    },
    setDuration: (state, action: PayloadAction<number>) => {
      state.duration = action.payload;
    },
    setPlaybackSpeed: (state, action: PayloadAction<number>) => {
      state.playbackSpeed = action.payload;
    },
    resetPlayback: (state) => {
      state.isPlaying = false;
      state.currentTime = 0;
    },
  },
});

export const {
  setPlaying,
  setCurrentTime,
  setDuration,
  setPlaybackSpeed,
  resetPlayback,
} = playbackSlice.actions;

export default playbackSlice.reducer;
