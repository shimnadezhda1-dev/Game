export const VOICE_FILES = {
  welcome: "/audio/voice/welcome.mp3",
  "try-again": "/audio/voice/try-again.mp3",
  "letter-a": "/audio/voice/letter-a.mp3",
  "letter-b": "/audio/voice/letter-b.mp3",
  "letter-v": "/audio/voice/letter-v.mp3",
  "letter-g": "/audio/voice/letter-g.mp3",
  "letter-d": "/audio/voice/letter-d.mp3",
  "find-a": "/audio/voice/find-a.mp3",
  "find-b": "/audio/voice/find-b.mp3",
  "find-v": "/audio/voice/find-v.mp3",
  "find-g": "/audio/voice/find-g.mp3",
  "find-d": "/audio/voice/find-d.mp3",
  "correct-a": "/audio/voice/correct-a.mp3",
  "correct-b": "/audio/voice/correct-b.mp3",
  "correct-v": "/audio/voice/correct-v.mp3",
  "correct-g": "/audio/voice/correct-g.mp3",
  "correct-d": "/audio/voice/correct-d.mp3",
  "listen-a": "/audio/voice/listen-a.mp3",
  "listen-b": "/audio/voice/listen-b.mp3",
  "listen-v": "/audio/voice/listen-v.mp3",
  "listen-g": "/audio/voice/listen-g.mp3",
  "listen-d": "/audio/voice/listen-d.mp3",
  "reward-a": "/audio/voice/reward-a.mp3",
  "reward-b": "/audio/voice/reward-b.mp3",
  "reward-v": "/audio/voice/reward-v.mp3",
  "reward-g": "/audio/voice/reward-g.mp3",
  "reward-d": "/audio/voice/reward-d.mp3"
} as const;

export type VoiceKey = keyof typeof VOICE_FILES;

export function letterVoiceKey(
  kind: "letter" | "find" | "correct" | "listen" | "reward",
  letterId: string
): VoiceKey {
  return `${kind}-${letterId.toLowerCase()}` as VoiceKey;
}
