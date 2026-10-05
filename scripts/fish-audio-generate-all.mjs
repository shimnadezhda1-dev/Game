import { mkdir, writeFile, stat } from "node:fs/promises";
import path from "node:path";
import { audioEntries } from "./audio-manifest.mjs";

const API_URL = "https://api.fish.audio/v1/tts";
const MODEL = "s2.1-pro-free";
const ROOT = path.resolve("public/assets/audio/ru");
const REPORT_PATH = path.resolve("scripts/audio-generation-report.json");
const VERIFY_DIR = path.resolve(".cursor-verify");
const VERIFY_PATH = path.join(VERIFY_DIR, "audio-bank.html");

const API_KEY = process.env.FISH_API_KEY;
const VOICE_ID = process.env.FISH_VOICE_ID;
const FORCE = process.argv.includes("--force");

if (!API_KEY) {
  console.error("FISH_API_KEY is missing. Run with: node --env-file=.env.local scripts/fish-audio-generate-all.mjs");
  process.exit(1);
}
if (!VOICE_ID) {
  console.error("FISH_VOICE_ID is missing.");
  process.exit(1);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fileIsNonEmpty(file) {
  try {
    const s = await stat(file);
    return s.isFile() && s.size > 0;
  } catch {
    return false;
  }
}

function safeErrorText(text) {
  return String(text || "")
    .replaceAll(API_KEY, "[REDACTED]")
    .slice(0, 800);
}

async function synthesize(entry) {
  const target = path.join(ROOT, entry.path);
  await mkdir(path.dirname(target), { recursive: true });

  if (!FORCE && await fileIsNonEmpty(target)) {
    return { status: "skipped", path: entry.path, text: entry.text };
  }

  let last = null;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
          model: MODEL,
        },
        body: JSON.stringify({
          text: entry.text,
          reference_id: VOICE_ID,
          format: "mp3",
        }),
      });

      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length < 1000) {
          throw new Error(`Suspiciously small audio response: ${buf.length} bytes`);
        }
        await writeFile(target, buf);
        return { status: "generated", path: entry.path, text: entry.text, bytes: buf.length };
      }

      const body = safeErrorText(await res.text());
      last = { httpStatus: res.status, message: body };

      if (res.status === 429 || res.status >= 500) {
        await sleep(1000 * attempt * attempt);
        continue;
      }
      break;
    } catch (err) {
      last = { httpStatus: null, message: safeErrorText(err?.message || err) };
      await sleep(1000 * attempt * attempt);
    }
  }

  return {
    status: "failed",
    path: entry.path,
    text: entry.text,
    httpStatus: last?.httpStatus ?? null,
    message: last?.message ?? "Unknown error",
  };
}

function esc(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function buildVerifyPage(results) {
  await mkdir(VERIFY_DIR, { recursive: true });

  const failed = new Set(results.filter(r => r.status === "failed").map(r => r.path));
  const grouped = new Map();

  for (const e of audioEntries) {
    const key = e.letter === "common" ? "Общие реплики" : e.letter;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(e);
  }

  const sections = [...grouped.entries()].map(([key, items]) => {
    const cards = items.map((e) => {
      const url = `../public/assets/audio/ru/${e.path}`;
      const bad = failed.has(e.path);
      return `
        <div class="card ${bad ? "bad" : ""}">
          <div class="meta">${esc(e.activity)}${e.word ? ` · ${esc(e.word)}` : ""}</div>
          <div class="text">${esc(e.text)}</div>
          <div class="path">${esc(e.path)}</div>
          <audio controls preload="none" src="${url}"></audio>
        </div>`;
    }).join("\n");

    return `<section><h2>${esc(key)}</h2><div class="grid">${cards}</div></section>`;
  }).join("\n");

  const html = `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Весёлый алфавит — проверка аудиобанка</title>
<style>
body{font-family:system-ui,Arial,sans-serif;margin:24px;background:#f7f7f7;color:#222}
h1{margin-bottom:6px}.note{margin-bottom:24px;color:#555}
section{margin:28px 0}h2{font-size:28px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px}
.card{background:white;border:1px solid #ddd;border-radius:14px;padding:14px}
.card.bad{border:2px solid #b00020;background:#fff4f5}
.meta{font-weight:700;margin-bottom:8px}.text{font-size:18px;margin-bottom:8px}
.path{font:12px ui-monospace,monospace;color:#666;margin-bottom:10px;word-break:break-all}
audio{width:100%}
</style>
<script>
document.addEventListener('play', e => {
  if (e.target.tagName === 'AUDIO') {
    document.querySelectorAll('audio').forEach(a => { if (a !== e.target) a.pause(); });
  }
}, true);
</script>
</head>
<body>
<h1>Весёлый алфавит — аудиобанк</h1>
<div class="note">Голос: Анастасия · Fish Audio · ${esc(MODEL)} · файлов: ${audioEntries.length}</div>
${sections}
</body>
</html>`;

  await writeFile(VERIFY_PATH, html, "utf8");
}

const results = [];

console.log(`Audio bank: ${audioEntries.length} files`);
console.log(`Voice ID: ${VOICE_ID}`);
console.log(`Model: ${MODEL}`);
console.log(`Force: ${FORCE ? "YES" : "NO"}`);
console.log("");

for (let i = 0; i < audioEntries.length; i++) {
  const e = audioEntries[i];
  process.stdout.write(`[${String(i + 1).padStart(3)}/${audioEntries.length}] ${e.path} ... `);

  const result = await synthesize(e);
  results.push(result);

  if (result.status === "generated") {
    console.log(`OK (${result.bytes} bytes)`);
  } else if (result.status === "skipped") {
    console.log("SKIP");
  } else {
    console.log(`FAIL${result.httpStatus ? ` HTTP ${result.httpStatus}` : ""}`);
  }

  // Gentle pacing for the API.
  if (result.status === "generated") await sleep(250);
}

const report = {
  generatedAt: new Date().toISOString(),
  model: MODEL,
  voiceId: VOICE_ID,
  total: results.length,
  generated: results.filter(r => r.status === "generated").length,
  skipped: results.filter(r => r.status === "skipped").length,
  failed: results.filter(r => r.status === "failed").length,
  failures: results.filter(r => r.status === "failed").map(r => ({
    path: r.path,
    text: r.text,
    httpStatus: r.httpStatus,
    message: r.message,
  })),
};

await writeFile(REPORT_PATH, JSON.stringify(report, null, 2), "utf8");
await buildVerifyPage(results);

console.log("");
console.log("AUDIO BANK GENERATION:", report.failed ? "PARTIAL" : "PASS");
console.log("Generated:", report.generated);
console.log("Skipped:", report.skipped);
console.log("Failed:", report.failed);
console.log("Total:", report.total);
console.log("Report:", path.relative(process.cwd(), REPORT_PATH));
console.log("Verify page:", path.relative(process.cwd(), VERIFY_PATH));
console.log("");
console.log("API KEY NOT PRINTED.");
console.log("No game logic was changed.");
console.log("No commit/push/deploy was performed.");

if (report.failed) process.exitCode = 2;
