import { useRef, useState } from "react";
import { isSupportedMusicFile } from "../audio/customMusicStore";
import { useMusicControl } from "./MusicControlContext";

export function MusicSettingsPanel() {
  const {
    settingsOpen,
    closeMusicSettings,
    musicMode,
    musicVolume,
    customFileName,
    persistWarning,
    formatError,
    setMusicMode,
    setMusicVolume,
    pickCustomMusic
  } = useMusicControl();
  const fileRef = useRef<HTMLInputElement>(null);
  const [unsupported, setUnsupported] = useState<string | null>(null);

  if (!settingsOpen) {
    return null;
  }

  function onPickFile(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) {
      return;
    }
    if (!isSupportedMusicFile(file)) {
      setUnsupported("Этот формат не подошёл. Попробуйте MP3, M4A, AAC или WAV.");
      return;
    }
    setUnsupported(null);
    void pickCustomMusic(file);
  }

  return (
    <div
      className="music-settings"
      role="dialog"
      aria-modal="true"
      aria-labelledby="music-settings-title"
      onClick={closeMusicSettings}
    >
      <div className="music-settings__card" onClick={(event) => event.stopPropagation()}>
        <h2 id="music-settings-title" className="music-settings__title">
          Фоновая музыка
        </h2>
        <p className="music-settings__hint">Настройка для родителя. Голос игры не меняется.</p>
        <div className="music-settings__modes">
          <button
            type="button"
            className={`music-settings__mode${musicMode === "builtin" ? " is-selected" : ""}`}
            aria-pressed={musicMode === "builtin"}
            onClick={() => setMusicMode("builtin")}
          >
            Музыка игры
          </button>
          <button
            type="button"
            className={`music-settings__mode${musicMode === "custom" ? " is-selected" : ""}`}
            aria-pressed={musicMode === "custom"}
            onClick={() => {
              if (!customFileName) {
                fileRef.current?.click();
                return;
              }
              setMusicMode("custom");
            }}
          >
            Своя музыка
          </button>
          <button
            type="button"
            className={`music-settings__mode${musicMode === "off" ? " is-selected" : ""}`}
            aria-pressed={musicMode === "off"}
            onClick={() => setMusicMode("off")}
          >
            Без музыки
          </button>
        </div>
        <label className="music-settings__volume">
          <span>Громкость музыки</span>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={Math.round(musicVolume * 100)}
            onChange={(event) => setMusicVolume(Number(event.target.value) / 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(musicVolume * 100)}
            aria-label="Громкость музыки"
          />
          <span className="music-settings__percent">{Math.round(musicVolume * 100)}%</span>
        </label>
        {musicMode === "custom" ? (
          <div className="music-settings__custom">
            <p className="music-settings__file">
              {customFileName ? `Выбрано: ${customFileName}` : "Файл ещё не выбран"}
            </p>
            <button
              type="button"
              className="music-settings__pick"
              onClick={() => fileRef.current?.click()}
            >
              {customFileName ? "Выбрать другую" : "Выбрать файл"}
            </button>
            <p className="music-settings__formats">Поддерживаются MP3, M4A, AAC и WAV. Файл остаётся на устройстве.</p>
          </div>
        ) : null}
        {unsupported ? <p className="music-settings__warn">{unsupported}</p> : null}
        {persistWarning ? <p className="music-settings__warn">{persistWarning}</p> : null}
        {formatError ? <p className="music-settings__warn">{formatError}</p> : null}
        <button type="button" className="music-settings__done" onClick={closeMusicSettings}>
          Готово
        </button>
        <input
          ref={fileRef}
          className="music-settings__input"
          type="file"
          accept="audio/mpeg,audio/mp4,audio/aac,audio/wav,audio/x-wav,.mp3,.m4a,.aac,.wav"
          onChange={(event) => {
            onPickFile(event.target.files);
            event.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
