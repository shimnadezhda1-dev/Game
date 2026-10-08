const DB_NAME = "happy-alphabet-music";
const STORE = "tracks";
const KEY = "custom";

export interface CustomTrack {
  name: string;
  type: string;
  blob: Blob;
}

let sessionTrack: CustomTrack | null = null;

const ALLOWED_EXT = [".mp3", ".m4a", ".aac", ".wav"];
const ALLOWED_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/aac",
  "audio/wav",
  "audio/x-wav",
  "audio/wave",
  "audio/vnd.wave"
];

function extensionOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot).toLowerCase() : "";
}

export function canPlayOgg(): boolean {
  try {
    const audio = document.createElement("audio");
    return audio.canPlayType("audio/ogg; codecs=vorbis") !== "";
  } catch {
    return false;
  }
}

export function isSupportedMusicFile(file: File): boolean {
  const ext = extensionOf(file.name);
  if (ALLOWED_EXT.includes(ext)) {
    return true;
  }
  if (ALLOWED_TYPES.includes(file.type)) {
    return true;
  }
  if ((ext === ".ogg" || file.type === "audio/ogg") && canPlayOgg()) {
    return true;
  }
  return false;
}

export function displayMusicName(name: string | null): string {
  if (!name) {
    return "";
  }
  const slash = Math.max(name.lastIndexOf("/"), name.lastIndexOf("\\"));
  return (slash >= 0 ? name.slice(slash + 1) : name).trim();
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveCustomTrack(track: CustomTrack): Promise<"indexeddb" | "session"> {
  sessionTrack = track;
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.objectStore(STORE).put(track, KEY);
    });
    db.close();
    return "indexeddb";
  } catch {
    return "session";
  }
}

export async function loadCustomTrack(): Promise<CustomTrack | null> {
  try {
    const db = await openDb();
    const track = await new Promise<CustomTrack | null>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const request = tx.objectStore(STORE).get(KEY);
      request.onsuccess = () => resolve((request.result as CustomTrack | undefined) ?? null);
      request.onerror = () => reject(request.error);
    });
    db.close();
    if (track?.blob) {
      sessionTrack = track;
      return track;
    }
  } catch {
    // Fall through to session copy.
  }
  return sessionTrack;
}

export async function clearCustomTrack(): Promise<void> {
  sessionTrack = null;
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.objectStore(STORE).delete(KEY);
    });
    db.close();
  } catch {
    // Ignore.
  }
}
