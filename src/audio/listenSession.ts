let hasPlayedListenInstruction = false;

export function hasListenInstructionPlayed(): boolean {
  return hasPlayedListenInstruction;
}

export function markListenInstructionPlayed(): void {
  hasPlayedListenInstruction = true;
}

export function resetListenInstruction(): void {
  hasPlayedListenInstruction = false;
}
