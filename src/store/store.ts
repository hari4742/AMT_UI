import { configureStore } from '@reduxjs/toolkit'
import transcriptionReducer from './slices/transcriptionSlice'
import comparisonReducer from './slices/comparisonSlice'
import playbackReducer from './slices/playbackSlice'

export const store = configureStore({
  reducer: {
    transcription: transcriptionReducer,
    comparison: comparisonReducer,
    playback: playbackReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch 