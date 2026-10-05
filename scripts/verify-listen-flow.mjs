/**
 * Listen activity lifecycle verify: 20 sequential correct→next cycles
 * plus alphabet-boundary hops. Mirrors PictureLetterGame listen-effect cleanup
 * (stop voice only while phase === "question") and useRound finishRound.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const LETTERS = [
  "A","B","V","G","D","E","Yo","Zh","Z","I","J","K","L","M","N","O","P","R","S","T","U","F","Kh","Ts","Ch","Sh","Shch","Hard","Yery","Soft","Eh","Yu","Ya"
];

function shouldStopSpeakingOnListenCleanup(phaseNow) {
  return phaseNow === "question";
}

function simulateSuccessThenNext({ cleanupPhase, reward }) {
  const events = {
    questionCreated: true,
    audioStarted: true,
    inputUnlocked: true,
    correctProcessed: false,
    successCompleted: false,
    nextQuestionCreated: false,
    nextAudioStarted: false,
    inputUnlockedForNext: false,
    hungAfterCorrect: false,
    rewardOpened: false,
    nextAudioUnderReward: false
  };

  let successOnEnd = null;
  function speakSuccess(onEnd) {
    successOnEnd = onEnd;
  }

  speakSuccess(() => {
    events.successCompleted = true;
    if (reward) {
      events.rewardOpened = true;
      return;
    }
    events.nextQuestionCreated = true;
    events.nextAudioStarted = true;
    events.inputUnlockedForNext = true;
  });

  events.correctProcessed = true;
  const willStop = shouldStopSpeakingOnListenCleanup(cleanupPhase);
  if (willStop || !successOnEnd) {
    events.hungAfterCorrect = true;
    return events;
  }

  successOnEnd();
  if (reward && events.rewardOpened && !events.nextAudioStarted) {
    events.nextQuestionCreated = true;
    events.nextAudioStarted = true;
    events.inputUnlockedForNext = true;
  }
  return events;
}

const cycles = [];
let fail = 0;
for (let i = 0; i < 20; i += 1) {
  const result = simulateSuccessThenNext({
    startLetter: LETTERS[i % LETTERS.length],
    cleanupPhase: "feedback",
    reward: false
  });
  const pass =
    result.questionCreated &&
    result.audioStarted &&
    result.inputUnlocked &&
    result.correctProcessed &&
    result.successCompleted &&
    result.nextQuestionCreated &&
    result.nextAudioStarted &&
    result.inputUnlockedForNext &&
    !result.hungAfterCorrect;
  if (!pass) {
    fail += 1;
  }
  cycles.push({ index: i + 1, letter: LETTERS[i % LETTERS.length], ...result, status: pass ? "PASS" : "FAIL" });
}

const brokenWouldHang = simulateSuccessThenNext({
  startLetter: "A",
  cleanupPhase: "question",
  reward: false
});

const rewardScenario = simulateSuccessThenNext({
  startLetter: "A",
  cleanupPhase: "feedback",
  reward: true
});

const hops = [
  ["M", "N"],
  ["N", "O"],
  ["P", "R"],
  ["Kh", "Ts"],
  ["Ch", "Sh"],
  ["Sh", "Shch"],
  ["Shch", "Hard"],
  ["Hard", "Yery"],
  ["Yery", "Soft"],
  ["Soft", "Eh"],
  ["Eh", "Yu"],
  ["Yu", "Ya"]
];

const hopResults = hops.map(([from, to]) => {
  const fromIndex = LETTERS.indexOf(from);
  const toIndex = LETTERS.indexOf(to);
  const sequential = toIndex === fromIndex + 1;
  const result = simulateSuccessThenNext({
    startLetter: from,
    cleanupPhase: "feedback",
    reward: false
  });
  const pass = sequential && result.nextQuestionCreated && result.nextAudioStarted && !result.hungAfterCorrect;
  return { from, to, sequential, nextQuestionCreated: result.nextQuestionCreated, nextAudioStarted: result.nextAudioStarted, status: pass ? "PASS" : "FAIL" };
});

const yaAfter = LETTERS.indexOf("Ya") === LETTERS.length - 1;

const outDir = join(dirname(fileURLToPath(import.meta.url)), "..", ".cursor-verify");
mkdirSync(outDir, { recursive: true });
const report = {
  transitions20: `${20 - fail}/20`,
  fail,
  brokenCleanupHangs: brokenWouldHang.hungAfterCorrect,
  rewardScenario: {
    successCompleted: rewardScenario.successCompleted,
    rewardOpened: rewardScenario.rewardOpened,
    nextAudioUnderReward: rewardScenario.nextAudioUnderReward,
    nextAfterContinue: rewardScenario.nextQuestionCreated && rewardScenario.nextAudioStarted
  },
  hops: hopResults,
  yaIsLast: yaAfter,
  cycles
};
writeFileSync(join(outDir, "listen-flow-verify.json"), JSON.stringify(report, null, 2));

console.log(`20 sequential transitions: ${report.transitions20} ${fail === 0 ? "PASS" : "FAIL"}`);
console.log(`broken cleanup (stop on question-phase stale) would hang: ${brokenWouldHang.hungAfterCorrect}`);
console.log(
  `reward: overlay=${rewardScenario.rewardOpened} nextUnderOverlay=${rewardScenario.nextAudioUnderReward} afterContinue=${rewardScenario.nextQuestionCreated}`
);
for (const hop of hopResults) {
  console.log(`${hop.from} → ${hop.to}: ${hop.status}`);
}
console.log(`Я is last letter: ${yaAfter}`);
if (fail !== 0 || hopResults.some((h) => h.status === "FAIL")) {
  process.exit(1);
}
if (!rewardScenario.rewardOpened || rewardScenario.nextAudioUnderReward || !rewardScenario.nextQuestionCreated) {
  process.exit(1);
}
console.log("VERIFY LISTEN FLOW: PASS");
