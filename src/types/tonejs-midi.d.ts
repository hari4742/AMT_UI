declare module '@tonejs/midi' {
  export class Midi {
    tracks: any[];
    duration: number;
    header: {
      tempos: Array<{ bpm: number }>;
      timeSignatures: Array<{ timeSignature: [number, number] }>;
    };
    constructor(data?: ArrayBuffer | Uint8Array);
  }
}
