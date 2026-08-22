import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SAMPLE_RATE = 22050;
const BPM = 120;
const BEAT = 60 / BPM;
const BARS = 8;
const DURATION = BARS * 4 * BEAT;
const N = Math.round(SAMPLE_RATE * DURATION);

const NOTES = {
  C2: 65.41,
  G2: 98.0,
  C3: 130.81,
  E3: 164.81,
  F3: 174.61,
  G3: 196.0,
  A3: 220.0,
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  F4: 349.23,
  G4: 392.0,
  A4: 440.0,
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
  F5: 698.46,
  G5: 783.99,
  A5: 880.0,
  C6: 1046.5
};

function env(t, dur, a = 0.012, r = 0.08) {
  if (t < 0 || t > dur) return 0;
  if (t < a) return t / a;
  if (t > dur - r) return Math.max(0, (dur - t) / r);
  return 1;
}

function sine(freq, t) {
  return Math.sin(2 * Math.PI * freq * t);
}

function tri(freq, t) {
  const x = (freq * t) % 1;
  return 1 - 4 * Math.abs(x - 0.5);
}

const samples = new Float32Array(N);

function addNote(freq, startBeat, beats, amp, kind = "lead") {
  const start = startBeat * BEAT;
  const dur = beats * BEAT;
  const i0 = Math.floor(start * SAMPLE_RATE);
  const i1 = Math.min(N, Math.floor((start + dur) * SAMPLE_RATE));
  for (let i = i0; i < i1; i += 1) {
    const t = i / SAMPLE_RATE - start;
    const e = env(t, dur, kind === "bass" ? 0.02 : 0.01, kind === "pad" ? 0.18 : 0.07);
    const tone =
      kind === "bass"
        ? sine(freq, t) * 0.7 + sine(freq * 2, t) * 0.18
        : kind === "pad"
          ? sine(freq, t) * 0.55 + sine(freq * 2, t) * 0.12
          : sine(freq, t) * 0.62 + tri(freq, t) * 0.22;
    samples[i] += tone * e * amp;
  }
}

const melody = [
  "C5", "E5", "G5", "E5", "C5", "D5", "E5", "G5",
  "A5", "G5", "E5", "C5", "D5", "F5", "E5", "D5",
  "E5", "G5", "C6", "G5", "A5", "G5", "F5", "E5",
  "D5", "F5", "A5", "F5", "G5", "E5", "D5", "C5"
];

for (let rep = 0; rep < 2; rep += 1) {
  melody.forEach((name, index) => {
    const beat = rep * 16 + index * 0.5;
    addNote(NOTES[name], beat, 0.48, 0.22, "lead");
  });
}

const bass = [
  ["C3", 0, 2],
  ["G2", 2, 2],
  ["F3", 4, 2],
  ["C3", 6, 2],
  ["G3", 8, 2],
  ["E3", 10, 2],
  ["F3", 12, 2],
  ["G3", 14, 1],
  ["C3", 15, 1],
  ["C3", 16, 2],
  ["G2", 18, 2],
  ["F3", 20, 2],
  ["C3", 22, 2],
  ["A3", 24, 2],
  ["G3", 26, 2],
  ["F3", 28, 2],
  ["C3", 30, 2]
];

bass.forEach(([name, start, beats]) => {
  addNote(NOTES[name], start, beats, 0.16, "bass");
});

const pads = [
  [0, ["C4", "E4", "G4"]],
  [4, ["F4", "A4", "C5"]],
  [8, ["G4", "B4", "D5"]],
  [12, ["C4", "E4", "G4"]],
  [16, ["C4", "E4", "G4"]],
  [20, ["F4", "A4", "C5"]],
  [24, ["A4", "C5", "E5"]],
  [28, ["G4", "B4", "D5"]]
];

pads.forEach(([start, chord]) => {
  chord.forEach((name) => addNote(NOTES[name] ?? 493.88, start, 3.6, 0.045, "pad"));
});

for (let beat = 0; beat < BARS * 4; beat += 1) {
  const start = beat * BEAT;
  const i0 = Math.floor(start * SAMPLE_RATE);
  const i1 = Math.min(N, i0 + Math.floor(0.04 * SAMPLE_RATE));
  const amp = beat % 2 === 0 ? 0.018 : 0.01;
  for (let i = i0; i < i1; i += 1) {
    const t = (i - i0) / SAMPLE_RATE;
    samples[i] += (Math.random() * 2 - 1) * amp * env(t, 0.04, 0.002, 0.02);
  }
}

let peak = 0.0001;
for (let i = 0; i < N; i += 1) {
  peak = Math.max(peak, Math.abs(samples[i]));
}
const fade = Math.floor(SAMPLE_RATE * 0.04);
for (let i = 0; i < N; i += 1) {
  let v = (samples[i] / peak) * 0.72;
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
  const s = Math.max(-1, Math.min(1, samples[i]));
  bytes.writeInt16LE(Math.round(s * 32767), 44 + i * 2);
}

const out = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "audio", "music", "background.wav");
writeFileSync(out, bytes);
console.log(`wrote ${out} (${(N / SAMPLE_RATE).toFixed(1)}s)`);
