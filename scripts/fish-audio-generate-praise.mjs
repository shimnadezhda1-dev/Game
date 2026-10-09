/**
 * Generate missing praise/retry clips with the existing Anastasia / Fish Audio setup.
 * Same endpoint, model, voice ID, and .env.local keys as scripts/fish-audio-*.mjs
 */
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ENV_PATH = path.resolve(ROOT, ".env.local");
const AUDIO_DIR = path.resolve(ROOT, "public/assets/audio/ru/common");
const PHRASES_PATH = path.resolve(ROOT, "src/audio/voicePhrases.ts");
const ENDPOINT = "https://api.fish.audio/v1/tts";
const MODEL = "s2.1-pro-free";
const EXPECTED_VOICE_ID = "ef7303ce0aaa4ffeb518b86afb6c5c9c";

const PREFIX = {
  standard: "praise-standard",
  streak: "praise-streak",
  recovery: "praise-recovery",
  retry: "retry-support"
};

const NEVER_REGENERATE = new Set([
  "correct.mp3",
  "next.mp3",
  "almost.mp3",
  "hint.mp3",
  "try-again.mp3"
]);

function parseEnv(source) {
  const values = {};
  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }
    const separator = line.indexOf("=");
    if (separator <= 0) {
      continue;
    }
    values[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
  }
  return values;
}

function safeErrorText(text) {
  return String(text || "")
    .replace(/Bearer\s+\S+/gi, "Bearer [redacted]")
    .replace(/sk-[A-Za-z0-9._-]+/g, "[redacted]")
    .slice(0, 400);
}

function parseMissing() {
  const source = readFileSync(PHRASES_PATH, "utf8");
  const rx =
    /phrase\("(standard|streak|recovery|retry)",\s*(\d+),\s*"([^"]+)",\s*"(short|long)"(?:,\s*"([^"]+)")?\)/g;
  const missing = [];
  let match;
  while ((match = rx.exec(source))) {
    const pool = match[1];
    const n = String(Number(match[2])).padStart(2, "0");
    const filename = `${PREFIX[pool]}-${n}.mp3`;
    const sourceFile = match[5];
    if (sourceFile) {
      continue;
    }
    if (NEVER_REGENERATE.has(filename)) {
      continue;
    }
    missing.push({
      id: `${PREFIX[pool].split("-").join("_")}_${n}`,
      text: match[3],
      filename
    });
  }
  return missing;
}

function parseGirlJobs() {
  const source = readFileSync(PHRASES_PATH, "utf8");
  const rx =
    /withGirl\(\s*phrase\("[^"]+",\s*\d+,\s*"[^"]+",\s*"[^"]+"(?:,\s*"[^"]+")?\),\s*"([^"]+)",\s*"([^"]+)"\s*\)/g;
  const jobs = [];
  let match;
  while ((match = rx.exec(source))) {
    jobs.push({
      id: match[2].replace(/\.mp3$/, ""),
      text: match[1],
      filename: match[2]
    });
  }
  return jobs;
}

async function fileOk(file) {
  try {
    const info = await stat(file);
    return info.isFile() && info.size > 1000;
  } catch {
    return false;
  }
}

const env = parseEnv(await readFile(ENV_PATH, "utf8"));
const apiKey = env.FISH_API_KEY ?? "";
const voiceId = env.FISH_VOICE_ID ?? "";

if (!apiKey || apiKey === "PASTE_KEY_HERE") {
  console.error("FISH_API_KEY is missing.");
  process.exit(1);
}
if (!voiceId) {
  console.error("FISH_VOICE_ID is missing.");
  process.exit(1);
}
if (voiceId !== EXPECTED_VOICE_ID) {
  console.error("FISH_VOICE_ID does not match the approved Anastasia voice.");
  process.exit(1);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
await mkdir(AUDIO_DIR, { recursive: true });

const candidates = [...parseMissing(), ...parseGirlJobs()];
const jobs = [];
for (const job of candidates) {
  if (!(await fileOk(path.join(AUDIO_DIR, job.filename)))) {
    jobs.push(job);
  }
}
console.log(`Praise clips to generate: ${jobs.length}`);
console.log(`Model: ${MODEL}`);
console.log("Voice: Anastasia (approved FISH_VOICE_ID)");
console.log("API KEY NOT PRINTED.");
console.log("");

const results = [];

for (let i = 0; i < jobs.length; i += 1) {
  const job = jobs[i];
  const target = path.join(AUDIO_DIR, job.filename);
  process.stdout.write(`[${String(i + 1).padStart(2)}/${jobs.length}] ${job.filename} ... `);

  if (existsSync(target) && (await fileOk(target))) {
    console.log("SKIP (already on disk)");
    results.push({ ...job, status: "skipped", bytes: (await stat(target)).size });
    continue;
  }

  let lastError = "";
  let ok = false;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          model: MODEL
        },
        body: JSON.stringify({
          text: job.text,
          reference_id: voiceId,
          format: "mp3"
        })
      });

      if (response.ok) {
        const audio = Buffer.from(await response.arrayBuffer());
        if (audio.length < 1000) {
          lastError = `audio too small: ${audio.length}`;
          await sleep(1000 * attempt * attempt);
          continue;
        }
        await writeFile(target, audio);
        if (!(await fileOk(target))) {
          lastError = "wrote file but size check failed";
          continue;
        }
        console.log(`OK (${audio.length} bytes)`);
        results.push({ ...job, status: "generated", bytes: audio.length });
        ok = true;
        break;
      }

      lastError = `HTTP ${response.status}: ${safeErrorText(await response.text())}`;
      if (response.status === 429 || response.status >= 500) {
        await sleep(1000 * attempt * attempt);
        continue;
      }
      break;
    } catch (err) {
      lastError = safeErrorText(err?.message || err);
      await sleep(1000 * attempt * attempt);
    }
  }

  if (!ok) {
    console.log("FAIL");
    results.push({ ...job, status: "failed", message: lastError });
  }

  await sleep(800);
}

const generated = results.filter((item) => item.status === "generated");
const skipped = results.filter((item) => item.status === "skipped");
const failed = results.filter((item) => item.status === "failed");

console.log("");
console.log(`Generated: ${generated.length}`);
console.log(`Skipped: ${skipped.length}`);
console.log(`Failed: ${failed.length}`);
if (failed.length) {
  for (const item of failed) {
    console.log(`FAIL ${item.filename}: ${item.message ?? ""}`);
  }
  process.exitCode = 2;
} else {
  console.log("PRAISE AUDIO: PASS");
}
console.log("API KEY NOT PRINTED.");
