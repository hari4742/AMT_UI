// API Service Layer for Audio Transcription Backend
// This defines the ideal backend API structure for the AMT system

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export interface TranscriptionRequest {
  audioFile: File;
  options?: {
    model?: string; // 'maestro', 'basic', 'advanced'
    format?: 'midi' | 'json' | 'both';
    quality?: 'fast' | 'balanced' | 'high';
  };
}

export interface TranscriptionResponse {
  success: boolean;
  transcriptionId: string;
  status: 'processing' | 'completed' | 'failed';
  progress?: number; // 0-100
  result?: {
    midiData: ArrayBuffer | string; // Base64 encoded MIDI data
    duration: number; // Audio duration in seconds
    notes: NoteEvent[];
    metadata: {
      model: string;
      processingTime: number;
      confidence: number;
    };
  };
  error?: string;
}

export interface NoteEvent {
  note: number; // MIDI note number (0-127)
  velocity: number; // Note velocity (0-127)
  startTime: number; // Start time in seconds
  endTime: number; // End time in seconds
  channel: number; // MIDI channel (0-15)
}

export interface TranscriptionStatus {
  transcriptionId: string;
  status: 'processing' | 'completed' | 'failed';
  progress: number;
  estimatedTimeRemaining?: number;
}

class TranscriptionAPI {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  // Upload audio file and start transcription
  async uploadAndTranscribe(
    request: TranscriptionRequest
  ): Promise<TranscriptionResponse> {
    const formData = new FormData();
    formData.append('audio', request.audioFile);

    if (request.options) {
      formData.append('options', JSON.stringify(request.options));
    }

    const response = await fetch(`${this.baseURL}/transcribe`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Check transcription status
  async getTranscriptionStatus(
    transcriptionId: string
  ): Promise<TranscriptionStatus> {
    const response = await fetch(
      `${this.baseURL}/transcribe/${transcriptionId}/status`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Get transcription result
  async getTranscriptionResult(
    transcriptionId: string
  ): Promise<TranscriptionResponse> {
    const response = await fetch(
      `${this.baseURL}/transcribe/${transcriptionId}/result`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Cancel transcription
  async cancelTranscription(transcriptionId: string): Promise<void> {
    const response = await fetch(
      `${this.baseURL}/transcribe/${transcriptionId}/cancel`,
      {
        method: 'DELETE',
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }

  // Get available models
  async getAvailableModels(): Promise<{
    models: Array<{ id: string; name: string; description: string }>;
  }> {
    const response = await fetch(`${this.baseURL}/models`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }
}

// Create singleton instance
export const transcriptionAPI = new TranscriptionAPI();
