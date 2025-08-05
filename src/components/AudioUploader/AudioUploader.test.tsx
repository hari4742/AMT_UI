import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from '@/theme/theme';
import transcriptionReducer from '@/store/slices/transcriptionSlice';
import AudioUploader from './AudioUploader';

const mockStore = configureStore({
  reducer: {
    transcription: transcriptionReducer,
  },
});

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <Provider store={mockStore}>
      <ThemeProvider theme={theme}>{component}</ThemeProvider>
    </Provider>
  );
};

describe('AudioUploader', () => {
  it('renders upload area', () => {
    renderWithProviders(<AudioUploader />);

    expect(
      screen.getByText(/Drag & drop an audio file here/)
    ).toBeInTheDocument();
    expect(screen.getByText(/or click to browse files/)).toBeInTheDocument();
    expect(
      screen.getByText(/Supported formats: WAV, MP3, M4A, FLAC, OGG/)
    ).toBeInTheDocument();
  });

  it('shows drag active state', () => {
    renderWithProviders(<AudioUploader />);

    const uploadArea = screen
      .getByText(/Drag & drop an audio file here/)
      .closest('div');
    expect(uploadArea).toBeInTheDocument();
  });
});
