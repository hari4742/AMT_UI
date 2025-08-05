// MIDI Processing Utilities
// Handles MIDI file parsing, validation, and conversion to note events

// Note: @tonejs/midi will be installed later
// For now, we'll define the types we need
interface MidiNote {
  midi: number;
  name: string;
  velocity: number;
  time: number;
  duration: number;
}

interface MidiTrack {
  name?: string;
  channel?: number;
  notes: MidiNote[];
}

interface MidiHeader {
  tempos: Array<{ bpm: number }>;
  timeSignatures: Array<{ timeSignature: [number, number] }>;
}

interface Midi {
  tracks: MidiTrack[];
  duration: number;
  header: MidiHeader;
}

// Mock Midi class for development until @tonejs/midi is installed
class MockMidi implements Midi {
  tracks: MidiTrack[] = [];
  duration: number = 0;
  header: MidiHeader = {
    tempos: [{ bpm: 120 }],
    timeSignatures: [{ timeSignature: [4, 4] }],
  };

  constructor(data: ArrayBuffer) {
    // Mock implementation - will be replaced with real @tonejs/midi
    this.tracks = [
      {
        name: 'Track 1',
        channel: 0,
        notes: [
          { midi: 60, name: 'C4', velocity: 80, time: 0, duration: 0.5 },
          { midi: 62, name: 'D4', velocity: 80, time: 0.5, duration: 0.5 },
          { midi: 64, name: 'E4', velocity: 80, time: 1, duration: 0.5 },
        ],
      },
    ];
    this.duration = 2;
  }
}

export interface ProcessedNote {
  id: string;
  note: number; // MIDI note number (0-127)
  noteName: string; // e.g., 'C4', 'F#3'
  velocity: number; // Note velocity (0-127)
  startTime: number; // Start time in seconds
  endTime: number; // End time in seconds
  duration: number; // Duration in seconds
  channel: number; // MIDI channel (0-15)
  track: number; // Track number
}

export interface ProcessedMidiData {
  notes: ProcessedNote[];
  duration: number; // Total duration in seconds
  tempo: number; // BPM
  timeSignature: [number, number]; // [numerator, denominator]
  tracks: Array<{
    name: string;
    notes: ProcessedNote[];
  }>;
  metadata: {
    totalNotes: number;
    averageVelocity: number;
    noteRange: [number, number]; // [lowest, highest]
  };
}

export class MidiProcessor {
  /**
   * Parse MIDI data from base64 string or ArrayBuffer
   */
  static async parseMidiData(
    data: string | ArrayBuffer
  ): Promise<ProcessedMidiData> {
    try {
      let midiData: ArrayBuffer;

      if (typeof data === 'string') {
        // Convert base64 to ArrayBuffer
        const binaryString = atob(data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        midiData = bytes.buffer;
      } else {
        midiData = data;
      }

      // Parse MIDI using @tonejs/midi (or mock for now)
      const midi = new MockMidi(midiData);

      return this.processMidi(midi);
    } catch (error) {
      console.error('Error parsing MIDI data:', error);
      throw new Error('Invalid MIDI file format');
    }
  }

  /**
   * Process parsed MIDI data into our standardized format
   */
  private static processMidi(midi: Midi): ProcessedMidiData {
    const notes: ProcessedNote[] = [];
    const tracks: Array<{ name: string; notes: ProcessedNote[] }> = [];

    // Process each track
    midi.tracks.forEach((track: MidiTrack, trackIndex: number) => {
      const trackNotes: ProcessedNote[] = [];

      track.notes.forEach((note: MidiNote, noteIndex: number) => {
        const processedNote: ProcessedNote = {
          id: `${trackIndex}-${noteIndex}`,
          note: note.midi,
          noteName: note.name,
          velocity: note.velocity,
          startTime: note.time,
          endTime: note.time + note.duration,
          duration: note.duration,
          channel: track.channel || 0,
          track: trackIndex,
        };

        notes.push(processedNote);
        trackNotes.push(processedNote);
      });

      tracks.push({
        name: track.name || `Track ${trackIndex + 1}`,
        notes: trackNotes,
      });
    });

    // Calculate metadata
    const velocities = notes.map((n) => n.velocity);
    const noteNumbers = notes.map((n) => n.note);

    const metadata = {
      totalNotes: notes.length,
      averageVelocity:
        velocities.length > 0
          ? velocities.reduce((a, b) => a + b, 0) / velocities.length
          : 0,
      noteRange:
        noteNumbers.length > 0
          ? ([Math.min(...noteNumbers), Math.max(...noteNumbers)] as [
              number,
              number
            ])
          : ([0, 0] as [number, number]),
    };

    return {
      notes,
      duration: midi.duration,
      tempo: midi.header.tempos[0]?.bpm || 120,
      timeSignature: [
        midi.header.timeSignatures[0]?.timeSignature[0] || 4,
        midi.header.timeSignatures[0]?.timeSignature[1] || 4,
      ],
      tracks,
      metadata,
    };
  }

  /**
   * Validate MIDI data
   */
  static validateMidiData(data: string | ArrayBuffer): boolean {
    try {
      // Basic validation - check if it's a valid MIDI file
      if (typeof data === 'string') {
        // Check if it's valid base64
        try {
          atob(data);
        } catch {
          return false;
        }
      }

      // Try to parse it
      this.parseMidiData(data);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get note name from MIDI note number
   */
  static getNoteName(midiNote: number): string {
    const noteNames = [
      'C',
      'C#',
      'D',
      'D#',
      'E',
      'F',
      'F#',
      'G',
      'G#',
      'A',
      'A#',
      'B',
    ];
    const octave = Math.floor(midiNote / 12) - 1;
    const noteIndex = midiNote % 12;
    return `${noteNames[noteIndex]}${octave}`;
  }

  /**
   * Get MIDI note number from note name
   */
  static getMidiNote(noteName: string): number {
    const noteNames = [
      'C',
      'C#',
      'D',
      'D#',
      'E',
      'F',
      'F#',
      'G',
      'G#',
      'A',
      'A#',
      'B',
    ];
    const match = noteName.match(/^([A-G]#?)(\d+)$/);

    if (!match) {
      throw new Error(`Invalid note name: ${noteName}`);
    }

    const [, note, octaveStr] = match;
    const octave = parseInt(octaveStr);
    const noteIndex = noteNames.indexOf(note);

    if (noteIndex === -1) {
      throw new Error(`Invalid note: ${note}`);
    }

    return (octave + 1) * 12 + noteIndex;
  }

  /**
   * Filter notes by time range
   */
  static filterNotesByTimeRange(
    notes: ProcessedNote[],
    startTime: number,
    endTime: number
  ): ProcessedNote[] {
    return notes.filter(
      (note) =>
        (note.startTime >= startTime && note.startTime < endTime) ||
        (note.endTime > startTime && note.endTime <= endTime) ||
        (note.startTime <= startTime && note.endTime >= endTime)
    );
  }

  /**
   * Get notes at a specific time
   */
  static getNotesAtTime(notes: ProcessedNote[], time: number): ProcessedNote[] {
    return notes.filter(
      (note) => note.startTime <= time && note.endTime > time
    );
  }

  /**
   * Convert MIDI data to base64 string
   */
  static midiToBase64(midiData: ArrayBuffer): string {
    const bytes = new Uint8Array(midiData);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert base64 string to MIDI data
   */
  static base64ToMidi(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }
}
