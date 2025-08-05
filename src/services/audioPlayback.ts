// Audio Playback Service
// Handles audio file playback and synchronization with MIDI

import * as Tone from 'tone';

export interface AudioPlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackSpeed: number;
}

export class AudioPlaybackService {
  private player: Tone.Player | null = null;
  private synth: Tone.Synth | null = null;
  private isInitialized = false;

  constructor() {
    // Initialize Tone.js
    this.init();
  }

  private async init() {
    if (this.isInitialized) return;

    try {
      await Tone.start();
      this.synth = new Tone.Synth().toDestination();
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize audio playback:', error);
    }
  }

  /**
   * Load audio file for playback
   */
  async loadAudio(audioFile: File): Promise<void> {
    await this.init();

    if (this.player) {
      this.player.dispose();
    }

    const url = URL.createObjectURL(audioFile);
    this.player = new Tone.Player(url).toDestination();

    return new Promise((resolve, reject) => {
      if (!this.player) {
        reject(new Error('Player not initialized'));
        return;
      }

      // Wait for the player to load
      const checkLoaded = () => {
        if (this.player?.loaded) {
          URL.revokeObjectURL(url);
          resolve();
        } else {
          setTimeout(checkLoaded, 100);
        }
      };

      checkLoaded();
    });
  }

  /**
   * Play audio
   */
  async play(): Promise<void> {
    if (!this.player || !this.isInitialized) {
      throw new Error('Audio not loaded');
    }

    await Tone.start();
    this.player.start();
  }

  /**
   * Pause audio
   */
  pause(): void {
    if (this.player) {
      this.player.stop();
    }
  }

  /**
   * Stop audio and reset to beginning
   */
  stop(): void {
    if (this.player) {
      this.player.stop();
      this.player.restart(0);
    }
  }

  /**
   * Seek to specific time
   */
  seek(time: number): void {
    if (this.player) {
      this.player.stop();
      this.player.restart(time);
    }
  }

  /**
   * Set playback speed
   */
  setPlaybackSpeed(speed: number): void {
    if (this.player) {
      this.player.playbackRate = speed;
    }
  }

  /**
   * Get current playback state
   */
  getPlaybackState(): AudioPlaybackState {
    if (!this.player) {
      return {
        isPlaying: false,
        currentTime: 0,
        duration: 0,
        playbackSpeed: 1,
      };
    }

    return {
      isPlaying: this.player.state === 'started',
      currentTime: this.player.now(),
      duration: this.player.buffer?.duration || 0,
      playbackSpeed: this.player.playbackRate,
    };
  }

  /**
   * Play MIDI note (for testing)
   */
  playNote(note: string, duration: string = '8n'): void {
    if (this.synth) {
      this.synth.triggerAttackRelease(note, duration);
    }
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    if (this.player) {
      this.player.dispose();
      this.player = null;
    }
    if (this.synth) {
      this.synth.dispose();
      this.synth = null;
    }
  }
}

// Create singleton instance
export const audioPlayback = new AudioPlaybackService();
