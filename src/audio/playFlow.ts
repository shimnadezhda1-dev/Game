let generation = 0;

export function playFlowGeneration(): number {
  return generation;
}

export function bumpPlayFlow(): number {
  generation += 1;
  return generation;
}

export function isPlayFlowCurrent(startedAt: number): boolean {
  return startedAt === generation;
}

export function flowLog(event: string, detail?: string): void {
  if (!import.meta.env.DEV) {
    return;
  }
  console.info(detail ? `${event} ${detail}` : event);
}
