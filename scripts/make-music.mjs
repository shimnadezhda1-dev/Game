import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SAMPLE_RATE = 22050;
const BPM = 132;
const BEAT = 60 / BPM;
const BARS = 8;
const DURATION = BARS * 4 * BEAT;
const N = Math.round(SAMPLE_RATE * DURATION);

const F = {
  C3: 130.81,
  G3: 196.0,
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  F4: 349.23,
  G4: 392.0,
  A4: 440.0,
  B4: 493.88,
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
  F5: 698.46,
  G5: 783.99,
  A5: 880.0,
  C6: 1046.5
};

function env(t, dur, a = 0.006, d = 0.12) {
  if (t < 0 || t > dur) return 0;
  if (t < a) return t / a;
  const rest = Math.exp(-((t - a) / d) * 3.2);
  const tail = t > dur - 0.04 ? (dur - t) / 0.04 : 1;
  return rest * Math.max(0, tail);
}

function sine(freq, t) {
  return Math.sin(2 * Math.PI * freq * t);
}

function marimba(freq, t) {
  return (
    sine(freq, t) * 0.55 +
    sine(freq * 2.01, t) * 0.22 +
    sine(freq * 3.02, t) * 0.08 +
    sine(freq * 4.1, t) * 0.04
  );
}

function uke(freq, t) {
  const pluck = Math.exp(-t * 7);
  return (sine(freq, t) * 0.6 + sine(freq * 2, t) * 0.18) * pluck;
}

const samples = new Float32Array(N);

function add(fn, freq, startBeat, beats, amp, decay = 0.16) {
  const start = startBeat * BEAT;
  const dur = beats * BEAT;
  const i0 = Math.max(0, Math.floor(start * SAMPLE_RATE));
  const i1 = Math.min(N, Math.floor((start + dur) * SAMPLE_RATE));
  for (let i = i0; i < i1; i += 1) {
    const t = i / SAMPLE_RATE - start;
    samples[i] += fn(freq, t) * env(t, dur, 0.005, decay) * amp;
  }
}

const melody = [
  "C5", "E5", "G5", "C6", "G5", "E5", "D5", "E5",
  "F5", "A5", "C6", "A5", "G5", "E5", "C5", "D5",
  "E5", "G5", "A5", "G5", "C6", "G5", "E5", "C5",
  "D5", "F5", "A5", "G5", "E5", "D5", "C5", "G4"
];

for (let rep = 0; rep < 2; rep += 1) {
  melody.forEach((name, index) => {
    const beat = rep * 16 + index * 0.5;
    add(marimba, F[name], beat, 0.52, 0.26, 0.14);
    if (index % 2 === 0) {
      add(marimba, F[name] / 2, beat, 0.4, 0.05, 0.18);
    }
  });
}

const ukeChords = [
  [0, ["C4", "E4", "G4"]],
  [2, ["C4", "G4", "C5"]],
  [4, ["F4", "A4", "C5"]],
  [6, ["C4", "E4", "G4"]],
  [8, ["G4", "B4", "D5"]],
  [10, ["E4", "G4", "C5"]],
  [12, ["F4", "A4", "C5"]],
  [14, ["G4", "B4", "D5"]],
  [16, ["C4", "E4", "G4"]],
  [18, ["C4", "G4", "C5"]],
  [20, ["F4", "A4", "C5"]],
  [22, ["C4", "E4", "G4"]],
  [24, ["A4", "C5", "E5"]],
  [26, ["G4", "B4", "D5"]],
  [28, ["F4", "A4", "C5"]],
  [30, ["G3", "G4", "B4"]]
];

ukeChords.forEach(([start, chord]) => {
  chord.forEach((name) => add(uke, F[name], start, 1.8, 0.07, 0.55));
});

[[0, "C3"], [4, "F4"], [8, "G3"], [12, "C3"], [16, "C3"], [20, "F4"], [24, "A4"], [28, "G3"]].forEach(
  ([start, name]) => add(sine, F[name], start, 1.6, 0.05, 0.5)
);

[[1, "G5"], [7, "C6"], [15, "E5"], [23, "A5"]].forEach(([start, name]) => {
  add(sine, F[name], start, 1.2, 0.06, 0.7);
});

for (let beat = 0.5; beat < BARS * 4; beat += 1) {
  const start = beat * BEAT;
  const i0 = Math.floor(start * SAMPLE_RATE);
  const i1 = Math.min(N, i0 + Math.floor(0.03 * SAMPLE_RATE));
  for (let i = i0; i < i1; i += 1) {
    const t = (i - i0) / SAMPLE_RATE;
    samples[i] += (Math.random() * 2 - 1) * 0.012 * env(t, 0.03, 0.001, 0.012);
  }
}

let peak = 0.0001;
for (let i = 0; i < N; i += 1) peak = Math.max(peak, Math.abs(samples[i]));
const fade = Math.floor(SAMPLE_RATE * 0.03);
for (let i = 0; i < N; i += 1) {
  let v = (samples[i] / peak) * 0.7;
  if (i < fade) v *= i / fade;
  if (i > N - fade) v *= (N - i) / fade;
  samples[i] = v;
}

const bytes = Buffer.alloc(44 + N * 2);
bytes.write("RIFF", 0);
bytes.writeUInt32LE(36 + N * 2, 4);
bytes.write("WAVE", 8);
bytes.write("fmt ", 12);
bytes.writeUInt32LE(16, 16);
bytes.writeUInt16LE(1, 20);
bytes.writeUInt16LE(1, 22);
bytes.writeUInt32LE(SAMPLE_RATE, 24);
bytes.writeUInt32LE(SAMPLE_RATE * 2, 28);
bytes.writeUInt16LE(2, 32);
bytes.writeUInt16LE(16, 34);
bytes.write("data", 36);
bytes.writeUInt32LE(N * 2, 40);
for (let i = 0; i < N; i += 1) {
  bytes.writeInt16LE(Math.round(Math.max(-1, Math.min(1, samples[i])) * 32767), 44 + i * 2);
}

const out = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "audio", "music", "background.wav");
writeFileSync(out, bytes);
console.log(`wrote ${out}`);
