// Mock API Service for Development/Testing
// This simulates the backend API responses for development

import {
  TranscriptionRequest,
  TranscriptionResponse,
  TranscriptionStatus,
  NoteEvent,
} from './api';

class MockTranscriptionAPI {
  private mockTranscriptions = new Map<string, any>();

  async uploadAndTranscribe(
    request: TranscriptionRequest
  ): Promise<TranscriptionResponse> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const transcriptionId = `mock-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Store mock transcription data
    this.mockTranscriptions.set(transcriptionId, {
      status: 'processing',
      progress: 0,
      audioFile: request.audioFile,
      options: request.options,
      startTime: Date.now(),
    });

    return {
      success: true,
      transcriptionId,
      status: 'processing',
      progress: 0,
    };
  }

  async getTranscriptionStatus(
    transcriptionId: string
  ): Promise<TranscriptionStatus> {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const transcription = this.mockTranscriptions.get(transcriptionId);
    if (!transcription) {
      throw new Error('Transcription not found');
    }

    // Simulate progress
    const elapsed = Date.now() - transcription.startTime;
    const progress = Math.min(100, Math.floor(elapsed / 1000)); // 1% per second

    if (progress >= 100) {
      transcription.status = 'completed';
      transcription.progress = 100;
    } else {
      transcription.progress = progress;
    }

    return {
      transcriptionId,
      status: transcription.status,
      progress: transcription.progress,
      estimatedTimeRemaining:
        transcription.status === 'processing'
          ? Math.max(0, 100 - progress)
          : undefined,
    };
  }

  async getTranscriptionResult(
    transcriptionId: string
  ): Promise<TranscriptionResponse> {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const transcription = this.mockTranscriptions.get(transcriptionId);
    if (!transcription) {
      throw new Error('Transcription not found');
    }

    // Generate mock MIDI data
    const mockMidiData = this.generateMockMidiData();
    const mockNotes = this.generateMockNotes();

    return {
      success: true,
      transcriptionId,
      status: 'completed',
      progress: 100,
      result: {
        midiData: mockMidiData,
        duration: 120, // 2 minutes
        notes: mockNotes,
        metadata: {
          model: transcription.options?.model || 'maestro',
          processingTime: Date.now() - transcription.startTime,
          confidence: 0.85,
        },
      },
    };
  }

  async cancelTranscription(transcriptionId: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    this.mockTranscriptions.delete(transcriptionId);
  }

  async getAvailableModels(): Promise<{
    models: Array<{ id: string; name: string; description: string }>;
  }> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    return {
      models: [
        {
          id: 'maestro',
          name: 'Maestro Model',
          description:
            'High-quality transcription model trained on classical music',
        },
        {
          id: 'basic',
          name: 'Basic Model',
          description: 'Fast transcription model for general music',
        },
        {
          id: 'advanced',
          name: 'Advanced Model',
          description: 'Premium model with enhanced accuracy and detail',
        },
      ],
    };
  }

  private generateMockMidiData(): string {
    // Generate a simple mock MIDI file (base64 encoded)
    // This is a minimal MIDI file with a C major scale
    const midiBytes = [
      0x4d,
      0x54,
      0x68,
      0x64, // MThd
      0x00,
      0x00,
      0x00,
      0x06, // Header length
      0x00,
      0x01, // Format 1
      0x00,
      0x01, // 1 track
      0x01,
      0xe0, // 480 ticks per quarter note
      0x4d,
      0x54,
      0x72,
      0x6b, // MTrk
      0x00,
      0x00,
      0x00,
      0x0b, // Track length
      0x00,
      0xff,
      0x51,
      0x03,
      0x07,
      0xa1,
      0x20, // Tempo
      0x00,
      0xff,
      0x2f,
      0x00, // End of track
    ];

    return btoa(String.fromCharCode(...midiBytes));
  }

  private generateMockNotes(): NoteEvent[] {
    // Generate mock note events for a C major scale
    const notes: NoteEvent[] = [];
    const startTime = 0;
    const noteDuration = 0.5; // 0.5 seconds per note

    const cMajorScale = [60, 62, 64, 65, 67, 69, 71, 72]; // C, D, E, F, G, A, B, C

    cMajorScale.forEach((note, index) => {
      notes.push({
        note,
        velocity: 80,
        startTime: startTime + index * noteDuration,
        endTime: startTime + (index + 1) * noteDuration,
        channel: 0,
      });
    });

    return notes;
  }
}

export const mockTranscriptionAPI = new MockTranscriptionAPI();
