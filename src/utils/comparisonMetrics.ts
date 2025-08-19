import { ProcessedMidiData, ProcessedNote } from '@/utils/midiProcessor';

export interface NoteMatchTs {
  generated: ProcessedNote;
  reference: ProcessedNote;
  timingError: number;
  pitchError: number;
  velocityError: number;
  durationError: number;
  matchQuality: number; // 0..1
}

export interface ComparisonMetricsTs {
  overallScore: number;
  noteAccuracy: number; // F1
  precision: number;
  recall: number;
  timingAccuracy: number;
  rhythmAccuracy: number;
  velocityAccuracy: number;
  durationAccuracy: number;
  pitchClassSimilarity: number; // 0..1
  densitySimilarity: number; // 0..1
  polyphonySimilarity: number; // 0..1
  rangeOverlap: number; // 0..1
  matchedCount: number;
  unmatchedGenerated: number;
  unmatchedReference: number;
  matches: NoteMatchTs[];
}

export interface ComparisonConfig {
  timingToleranceSec?: number;
  pitchToleranceSemitones?: number;
  velocityTolerance?: number;
  matchWeights?: {
    timing: number;
    pitch: number;
    velocity: number;
    duration: number;
  };
  overallWeights?: {
    noteAccuracy: number;
    timingAccuracy: number;
    rhythmAccuracy: number;
    velocityAccuracy: number;
    durationAccuracy: number;
    pitchClassSimilarity: number;
    densitySimilarity: number;
    polyphonySimilarity: number;
    rangeOverlap: number;
  };
  densityWindowSec?: number;
  polyphonyWindowSec?: number;
}

const defaultConfig: Required<ComparisonConfig> = {
  timingToleranceSec: 0.1,
  pitchToleranceSemitones: 0,
  velocityTolerance: 10,
  matchWeights: { timing: 0.5, pitch: 0.2, velocity: 0.1, duration: 0.2 },
  overallWeights: {
    noteAccuracy: 0.3,
    timingAccuracy: 0.2,
    rhythmAccuracy: 0.15,
    velocityAccuracy: 0.1,
    durationAccuracy: 0.1,
    pitchClassSimilarity: 0.075,
    densitySimilarity: 0.05,
    polyphonySimilarity: 0.025,
    rangeOverlap: 0.0,
  },
  densityWindowSec: 1.0,
  polyphonyWindowSec: 0.1,
};

export function compareMidiData(
  generated: ProcessedMidiData,
  reference: ProcessedMidiData,
  cfg?: ComparisonConfig
): ComparisonMetricsTs {
  const config = { ...defaultConfig, ...(cfg || {}) };

  const generatedNotes = [...generated.notes].sort(
    (a, b) => a.startTime - b.startTime
  );
  const referenceNotes = [...reference.notes].sort(
    (a, b) => a.startTime - b.startTime
  );

  const { matches, unmatchedGenerated, unmatchedReference } = matchNotes(
    generatedNotes,
    referenceNotes,
    config
  );

  const precision = matches.length / (generatedNotes.length || 1);
  const recall = matches.length / (referenceNotes.length || 1);
  const f1 =
    precision + recall === 0
      ? 0
      : (2 * precision * recall) / (precision + recall);

  const timingAccuracy = calculateTimingAccuracy(matches, config);
  const rhythmAccuracy = calculateRhythmAccuracy(matches);
  const velocityAccuracy = calculateVelocityAccuracy(matches);
  const durationAccuracy = calculateDurationAccuracy(matches);
  const pitchClassSimilarity = calculatePitchClassSimilarity(
    generatedNotes,
    referenceNotes
  );
  const densitySimilarity = calculateDensitySimilarity(
    generatedNotes,
    referenceNotes,
    Math.max(generated.duration, reference.duration),
    config.densityWindowSec
  );
  const polyphonySimilarity = calculatePolyphonySimilarity(
    generatedNotes,
    referenceNotes,
    Math.max(generated.duration, reference.duration),
    config.polyphonyWindowSec
  );
  const rangeOverlap = calculateRangeOverlap(generatedNotes, referenceNotes);

  const overallScore = weightedAverage(
    {
      noteAccuracy: f1,
      timingAccuracy,
      rhythmAccuracy,
      velocityAccuracy,
      durationAccuracy,
      pitchClassSimilarity,
      densitySimilarity,
      polyphonySimilarity,
      rangeOverlap,
    },
    config.overallWeights
  );

  return {
    overallScore,
    noteAccuracy: f1,
    precision,
    recall,
    timingAccuracy,
    rhythmAccuracy,
    velocityAccuracy,
    durationAccuracy,
    pitchClassSimilarity,
    densitySimilarity,
    polyphonySimilarity,
    rangeOverlap,
    matchedCount: matches.length,
    unmatchedGenerated: unmatchedGenerated.length,
    unmatchedReference: unmatchedReference.length,
    matches,
  };
}

function matchNotes(
  generated: ProcessedNote[],
  reference: ProcessedNote[],
  cfg: Required<ComparisonConfig>
) {
  const unmatchedReference = new Set(reference.map((n) => n.id));
  const idToRef = new Map(reference.map((n) => [n.id, n] as const));

  const matches: NoteMatchTs[] = [];

  for (const gen of generated) {
    let bestRef: ProcessedNote | undefined;
    let bestScore = Number.POSITIVE_INFINITY;

    for (const ref of reference) {
      if (!unmatchedReference.has(ref.id)) continue;

      const timingDistance = Math.abs(gen.startTime - ref.startTime);
      const pitchDistance = Math.abs(gen.note - ref.note);
      const durationDistance = Math.abs(gen.duration - ref.duration);

      if (
        timingDistance > cfg.timingToleranceSec ||
        pitchDistance > cfg.pitchToleranceSemitones
      ) {
        continue;
      }

      const distance =
        timingDistance * 2.0 + pitchDistance * 0.1 + durationDistance * 0.5;

      if (distance < bestScore) {
        bestScore = distance;
        bestRef = ref;
      }
    }

    if (bestRef) {
      unmatchedReference.delete(bestRef.id);
      const timingError = Math.abs(gen.startTime - bestRef.startTime);
      const pitchError = Math.abs(gen.note - bestRef.note);
      const velocityError = Math.abs(gen.velocity - bestRef.velocity);
      const durationError = Math.abs(gen.duration - bestRef.duration);

      const timingQuality = Math.max(
        0,
        1 - timingError / cfg.timingToleranceSec
      );
      const pitchQuality =
        pitchError === 0 ? 1 : Math.max(0, 1 - pitchError / 12);
      const velocityQuality = Math.max(0, 1 - velocityError / 127);
      const durationQuality = Math.max(
        0,
        1 - durationError / Math.max(0.05, bestRef.duration)
      );

      const w = cfg.matchWeights;
      const matchQuality =
        timingQuality * w.timing +
        pitchQuality * w.pitch +
        velocityQuality * w.velocity +
        durationQuality * w.duration;

      matches.push({
        generated: gen,
        reference: bestRef,
        timingError,
        pitchError,
        velocityError,
        durationError,
        matchQuality,
      });
    }
  }

  const unmatchedGen = generated.filter(
    (g) => !matches.find((m) => m.generated.id === g.id)
  );
  const unmatchedRef = reference.filter(
    (r) => !matches.find((m) => m.reference.id === r.id)
  );

  return {
    matches,
    unmatchedGenerated: unmatchedGen,
    unmatchedReference: unmatchedRef,
  };
}

function calculateTimingAccuracy(
  matches: NoteMatchTs[],
  cfg: Required<ComparisonConfig>
) {
  if (matches.length === 0) return 0;
  const avg = matches.reduce((s, m) => s + m.timingError, 0) / matches.length;
  return clamp01(1 - avg / cfg.timingToleranceSec);
}

function calculateRhythmAccuracy(matches: NoteMatchTs[]) {
  if (matches.length < 3) return 0;
  const genOnsets = matches.map((m) => m.generated.startTime);
  const refOnsets = matches.map((m) => m.reference.startTime);
  const genIoi = diffs(genOnsets);
  const refIoi = diffs(refOnsets);
  const len = Math.min(genIoi.length, refIoi.length);
  if (len < 2) return 0;
  const a = normalizeZ(genIoi.slice(0, len));
  const b = normalizeZ(refIoi.slice(0, len));
  const corr = pearson(a, b);
  return isFinite(corr) ? clamp01((corr + 1) / 2) : 0; // map [-1,1] to [0,1]
}

function calculateVelocityAccuracy(matches: NoteMatchTs[]) {
  if (matches.length === 0) return 0;
  const avg =
    matches.reduce((s, m) => s + Math.abs(m.velocityError), 0) / matches.length;
  return clamp01(1 - avg / 127);
}

function calculateDurationAccuracy(matches: NoteMatchTs[]) {
  if (matches.length === 0) return 0;
  const avgRefDur =
    matches.reduce((s, m) => s + Math.max(0.05, m.reference.duration), 0) /
    matches.length;
  const avgAbs =
    matches.reduce((s, m) => s + Math.abs(m.durationError), 0) / matches.length;
  return clamp01(1 - avgAbs / avgRefDur);
}

function calculatePitchClassSimilarity(a: ProcessedNote[], b: ProcessedNote[]) {
  const ha = new Array(12).fill(0);
  const hb = new Array(12).fill(0);
  for (const n of a) ha[n.note % 12]++;
  for (const n of b) hb[n.note % 12]++;
  return cosineSimilarity(ha, hb);
}

function calculateDensitySimilarity(
  a: ProcessedNote[],
  b: ProcessedNote[],
  duration: number,
  windowSec: number
) {
  if (duration <= 0) return 0;
  const sa = densitySeries(a, duration, windowSec);
  const sb = densitySeries(b, duration, windowSec);
  return sequenceSimilarity(sa, sb);
}

function calculatePolyphonySimilarity(
  a: ProcessedNote[],
  b: ProcessedNote[],
  duration: number,
  windowSec: number
) {
  if (duration <= 0) return 0;
  const sa = polyphonySeries(a, duration, windowSec);
  const sb = polyphonySeries(b, duration, windowSec);
  return sequenceSimilarity(sa, sb);
}

function calculateRangeOverlap(a: ProcessedNote[], b: ProcessedNote[]) {
  if (a.length === 0 || b.length === 0) return 0;
  const amin = Math.min(...a.map((n) => n.note));
  const amax = Math.max(...a.map((n) => n.note));
  const bmin = Math.min(...b.map((n) => n.note));
  const bmax = Math.max(...b.map((n) => n.note));
  const inter = Math.max(0, Math.min(amax, bmax) - Math.max(amin, bmin));
  const union = Math.max(amax, bmax) - Math.min(amin, bmin) || 1;
  return clamp01(inter / union);
}

function densitySeries(
  notes: ProcessedNote[],
  duration: number,
  windowSec: number
) {
  const bins = Math.max(1, Math.ceil(duration / windowSec));
  const series = new Array(bins).fill(0);
  for (const n of notes) {
    const idx = Math.min(
      bins - 1,
      Math.max(0, Math.floor(n.startTime / windowSec))
    );
    series[idx] += 1;
  }
  return series;
}

function polyphonySeries(
  notes: ProcessedNote[],
  duration: number,
  windowSec: number
) {
  const bins = Math.max(1, Math.ceil(duration / windowSec));
  const series = new Array(bins).fill(0);
  for (let i = 0; i < bins; i++) {
    const t0 = i * windowSec;
    const t1 = Math.min(duration, (i + 1) * windowSec);
    let count = 0;
    for (const n of notes) {
      if (n.startTime < t1 && n.endTime > t0) count++;
    }
    series[i] = count;
  }
  return series;
}

function sequenceSimilarity(a: number[], b: number[]) {
  const len = Math.min(a.length, b.length);
  if (len === 0) return 0;
  const aS = a.slice(0, len);
  const bS = b.slice(0, len);
  // Normalize per-series to [0,1] by dividing by max
  const maxA = Math.max(1, Math.max(...aS));
  const maxB = Math.max(1, Math.max(...bS));
  const na = aS.map((v) => v / maxA);
  const nb = bS.map((v) => v / maxB);
  // Use 1 - MAE as similarity
  const mae = na.reduce((s, v, i) => s + Math.abs(v - nb[i]), 0) / len;
  return clamp01(1 - mae);
}

function weightedAverage(
  values: Record<string, number>,
  weights: Record<string, number>
) {
  let sum = 0;
  let wsum = 0;
  for (const k of Object.keys(weights)) {
    if (k in values) {
      const w = weights[k];
      sum += (values as any)[k] * w;
      wsum += w;
    }
  }
  return wsum > 0 ? sum / wsum : 0;
}

function diffs(arr: number[]) {
  const out: number[] = [];
  for (let i = 1; i < arr.length; i++) out.push(arr[i] - arr[i - 1]);
  return out;
}

function normalizeZ(arr: number[]) {
  const mean = arr.reduce((s, v) => s + v, 0) / (arr.length || 1);
  const std = Math.sqrt(
    arr.reduce((s, v) => s + (v - mean) * (v - mean), 0) / (arr.length || 1)
  );
  const denom = std || 1e-8;
  return arr.map((v) => (v - mean) / denom);
}

function pearson(a: number[], b: number[]) {
  const n = Math.min(a.length, b.length);
  if (n === 0) return 0;
  const ax = a.slice(0, n);
  const bx = b.slice(0, n);
  const ma = ax.reduce((s, v) => s + v, 0) / n;
  const mb = bx.reduce((s, v) => s + v, 0) / n;
  let num = 0;
  let da = 0;
  let db = 0;
  for (let i = 0; i < n; i++) {
    const va = ax[i] - ma;
    const vb = bx[i] - mb;
    num += va * vb;
    da += va * va;
    db += vb * vb;
  }
  const den = Math.sqrt(da) * Math.sqrt(db) || 1e-8;
  return num / den;
}

function cosineSimilarity(a: number[], b: number[]) {
  const n = Math.min(a.length, b.length);
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < n; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb) || 1e-8;
  return clamp01(dot / denom);
}

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}
