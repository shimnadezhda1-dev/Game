import { audioManager } from "../audio/AudioManager";
import { backgroundMusic } from "../audio/BackgroundMusicManager";

export type AppLifecycleState = "foreground" | "background";
type AppLifecycleListener = (state: AppLifecycleState) => void;

const listeners = new Set<AppLifecycleListener>();
let state: AppLifecycleState = "foreground";
let installed = false;

function lifecycleLog(event: string): void {
  if (!import.meta.env.DEV) {
    return;
  }
  console.info(`APP ${event}`);
}

function notify(): void {
  listeners.forEach((listener) => listener(state));
}

function enterBackground(): void {
  if (state === "background") {
    return;
  }
  state = "background";
  lifecycleLog("BACKGROUND");
  backgroundMusic.pauseForBackground();
  audioManager.pauseForBackground();
  notify();
}

function enterForeground(): void {
  if (state === "foreground") {
    return;
  }
  state = "foreground";
  lifecycleLog("FOREGROUND");
  audioManager.resumeAfterBackground();
  backgroundMusic.resumeAfterBackground();
  notify();
}

function syncWithVisibility(): void {
  if (document.visibilityState === "hidden") {
    enterBackground();
  } else {
    enterForeground();
  }
}

/**
 * Single owner of page lifecycle. window blur/focus is not used on purpose:
 * the music file picker and DevTools blur a still-visible page.
 */
export function installAppLifecycle(): void {
  if (installed) {
    return;
  }
  installed = true;
  document.addEventListener("visibilitychange", syncWithVisibility);
  window.addEventListener("pagehide", enterBackground);
  window.addEventListener("pageshow", syncWithVisibility);
  // Cordova-style native shells dispatch pause/resume on document; browsers never do.
  document.addEventListener("pause", enterBackground);
  document.addEventListener("resume", syncWithVisibility);
  syncWithVisibility();
}

export function isAppInBackground(): boolean {
  return state === "background";
}

export function subscribeAppLifecycle(listener: AppLifecycleListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
