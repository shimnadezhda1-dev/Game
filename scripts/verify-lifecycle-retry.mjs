import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

const useRound = read("src/utils/useRound.ts");
const audio = read("src/audio/AudioManager.ts");
const music = read("src/audio/BackgroundMusicManager.ts");
const lifecycle = read("src/utils/appLifecycle.ts");
const main = read("src/main.tsx");
const find = read("src/components/FindLetterGame.tsx");
const picture = read("src/components/PictureLetterGame.tsx");
const learn = read("src/components/LearnLetters.tsx");

// --- Wrong answer: support line -> pause -> same question ---
const pauseMatch = useRound.match(/RETRY_QUESTION_PAUSE_MS = (\d+)/);
assert.ok(pauseMatch, "RETRY_QUESTION_PAUSE_MS missing");
const pause = Number(pauseMatch[1]);
assert.ok(pause >= 300 && pause <= 600, `retry pause ${pause}ms outside 300–600`);
assert.match(useRound, /takeRetryLine\(\)/);
assert.match(useRound, /onEnd: \(\) => \{\s*if \(token !== retryTokenRef\.current/);
assert.match(useRound, /window\.setTimeout\(\(\) => \{[\s\S]*?playCurrentQuestion\(\);[\s\S]*?RETRY_QUESTION_PAUSE_MS\)/);
assert.match(useRound, /if \(retrySequenceBusy\(\)\) \{/);
assert.match(useRound, /stopQuestionRef\.current\?\.\(\);\s*const token = retryTokenRef\.current;/);
assert.ok(
  useRound.indexOf("setTarget(lockTarget)") > useRound.indexOf("cancelRetrySequence();"),
  "target change must cancel the retry sequence"
);

assert.match(find, /playQuestion: \(\) => playFindLetterPromptForCurrent\(\)/);
assert.match(find, /stopQuestion: \(\) => \{\s*findGenRef\.current \+= 1;\s*clearFindPause\(\);/);
assert.match(find, /onClick=\{round\.replay\}/);
assert.match(picture, /playQuestion: voiceMode === "listen" \? \(\) => void playListenRound\(\) : undefined/);
assert.match(picture, /listenGenRef\.current \+= 1;\s*clearListenPause\(\);\s*setInstructionBusy\(false\);/);
assert.doesNotMatch(picture, /playListenVoice/);

// --- Background pause ---
assert.match(main, /installAppLifecycle\(\);/);
assert.match(lifecycle, /addEventListener\("visibilitychange", syncWithVisibility\)/);
assert.doesNotMatch(lifecycle, /addEventListener\("(blur|focus)"/);
assert.match(lifecycle, /if \(installed\) \{\s*return;/);
assert.match(lifecycle, /backgroundMusic\.pauseForBackground\(\);\s*audioManager\.pauseForBackground\(\);/);
assert.match(lifecycle, /audioManager\.resumeAfterBackground\(\);\s*backgroundMusic\.resumeAfterBackground\(\);/);
assert.match(audio, /if \(this\.backgroundPaused\) \{\s*voiceLog\("VOICE DEFERRED/);
assert.match(music, /resumeAfterBackgroundWanted = Boolean\(audio && !audio\.paused && !audio\.ended\)/);
assert.match(music, /if \(!wanted \|\| !this\.started \|\| this\.settings\.mode === "off"\) \{?\s*return/);
assert.match(useRound, /subscribeAppLifecycle\(\(state\) => \{\s*cancelRetrySequence\(\);\s*cancelResumeReplay\(\);/);
assert.match(useRound, /audioManager\.discardBackgroundDebt\(\);\s*resumeTimerRef\.current = window\.setTimeout/);
assert.match(learn, /subscribeAppLifecycle\(\(state\) => \{/);
assert.match(learn, /speakGenRef\.current \+= 1;\s*clearWaitTimer\(\);/);

// --- Simulated sequence: single clip player with token-guarded onEnd ---
function createSim() {
  const timers = new Map();
  let now = 0;
  let nextId = 1;
  const log = [];
  const sim = {
    log,
    setTimeout(fn, ms) {
      const id = nextId++;
      timers.set(id, { at: now + ms, fn });
      return id;
    },
    clearTimeout(id) {
      timers.delete(id);
    },
    advance(ms) {
      const end = now + ms;
      for (;;) {
        const due = [...timers.entries()]
          .filter(([, t]) => t.at <= end)
          .sort((a, b) => a[1].at - b[1].at)[0];
        if (!due) break;
        timers.delete(due[0]);
        now = due[1].at;
        due[1].fn();
      }
      now = end;
    }
  };
  let token = 0;
  let busy = false;
  let endTimer = null;
  let activeOnEnd;
  let paused = false;
  let debt = null;
  const audioSim = {
    isBusy: () => busy,
    speak(name, onEnd, duration = 1000) {
      if (paused) {
        debt = { kind: "requested", name, onEnd, duration };
        return;
      }
      debt = null;
      audioSim.stop();
      const my = ++token;
      busy = true;
      activeOnEnd = onEnd;
      log.push(`start:${name}`);
      endTimer = sim.setTimeout(() => {
        if (my !== token) return;
        busy = false;
        activeOnEnd = undefined;
        log.push(`end:${name}`);
        onEnd?.();
      }, duration);
    },
    stop() {
      token += 1;
      busy = false;
      activeOnEnd = undefined;
      if (endTimer !== null) sim.clearTimeout(endTimer);
      endTimer = null;
    },
    pause() {
      const onEnd = busy ? activeOnEnd : undefined;
      const had = busy;
      audioSim.stop();
      paused = true;
      debt = had ? { kind: "interrupted", onEnd } : null;
    },
    resume() {
      paused = false;
      return debt;
    },
    discard() {
      debt = null;
    }
  };
  return { sim, audioSim };
}

function createRound(sim, audioSim) {
  const round = {
    phase: "question",
    locked: false,
    background: false,
    retryToken: 0,
    retryActive: false,
    retryTimer: null,
    open() {
      return !round.locked && round.phase === "question" && !round.background;
    },
    playQuestion() {
      audioSim.speak("question", undefined, 1200);
    },
    cancelRetry() {
      round.retryToken += 1;
      round.retryActive = false;
      if (round.retryTimer !== null) sim.clearTimeout(round.retryTimer);
      round.retryTimer = null;
    },
    busy() {
      return round.retryTimer !== null || (round.retryActive && audioSim.isBusy());
    },
    wrong() {
      if (round.busy()) {
        sim.log.push("skip");
        return;
      }
      round.cancelRetry();
      const token = round.retryToken;
      round.retryActive = true;
      audioSim.speak("support", () => {
        if (token !== round.retryToken || !round.open()) return;
        round.retryTimer = sim.setTimeout(() => {
          round.retryTimer = null;
          if (token !== round.retryToken || !round.open()) return;
          round.playQuestion();
        }, pause);
      }, 900);
    },
    resumeTimer: null,
    cancelResume() {
      if (round.resumeTimer !== null) sim.clearTimeout(round.resumeTimer);
      round.resumeTimer = null;
    },
    toBackground() {
      audioSim.pause();
      round.background = true;
      round.cancelRetry();
      round.cancelResume();
    },
    toForeground() {
      const debt = audioSim.resume();
      round.background = false;
      round.cancelRetry();
      round.cancelResume();
      if (round.phase === "question" && !round.locked) {
        audioSim.discard();
        round.resumeTimer = sim.setTimeout(() => {
          round.resumeTimer = null;
          if (round.open()) round.playQuestion();
        }, 500);
        return;
      }
      if (debt?.kind === "interrupted") {
        sim.setTimeout(() => debt.onEnd?.(), 500);
      }
    }
  };
  return round;
}

{
  const { sim, audioSim } = createSim();
  const round = createRound(sim, audioSim);
  round.wrong();
  sim.advance(500);
  round.wrong();
  round.wrong();
  sim.advance(400 + pause - 1);
  assert.deepEqual(sim.log, ["start:support", "skip", "skip", "end:support"]);
  sim.advance(1);
  assert.deepEqual(sim.log.slice(-1), ["start:question"], "question starts after pause");
  round.wrong();
  assert.equal(sim.log.at(-1), "skip", "no new support while question replays");
  sim.advance(1200);
  round.wrong();
  assert.equal(sim.log.at(-1), "start:support", "new cycle after question finished");
}

{
  const { sim, audioSim } = createSim();
  const round = createRound(sim, audioSim);
  round.wrong();
  sim.advance(300);
  round.toBackground();
  sim.advance(10_000);
  assert.deepEqual(sim.log, ["start:support"], "silence while hidden");
  round.toForeground();
  sim.advance(499);
  assert.equal(sim.log.length, 1);
  sim.advance(1);
  assert.deepEqual(sim.log, ["start:support", "start:question"], "question replays from the start");
}

{
  const { sim, audioSim } = createSim();
  const round = createRound(sim, audioSim);
  round.playQuestion();
  sim.advance(200);
  for (let i = 0; i < 5; i += 1) {
    round.toBackground();
    round.toForeground();
  }
  sim.advance(2000);
  assert.equal(sim.log.filter((line) => line === "start:question").length, 2, "rapid toggles replay once");
}

{
  const { sim, audioSim } = createSim();
  const round = createRound(sim, audioSim);
  let afterPraise = 0;
  round.locked = true;
  round.phase = "feedback";
  audioSim.speak("praise", () => {
    afterPraise += 1;
  });
  sim.advance(300);
  round.toBackground();
  sim.advance(5000);
  assert.equal(afterPraise, 0, "no reward flow while hidden");
  round.toForeground();
  sim.advance(600);
  assert.equal(afterPraise, 1, "interrupted praise continues once");
  assert.equal(sim.log.filter((line) => line === "start:praise").length, 1, "praise not repeated");
}

console.log("verify-lifecycle-retry: ok");
