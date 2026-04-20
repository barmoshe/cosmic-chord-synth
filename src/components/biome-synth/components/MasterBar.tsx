import { useCallback, useEffect, useState } from "react";
import * as Tone from "tone";
import type { AudioEngine } from "../shared/types";
import type { RecorderController } from "../hooks/useRecorder";
import {
  listPresets,
  savePreset,
  deletePreset,
  encodePresetToHash,
  type Preset,
} from "../shared/presets";
import type { BiomeTheme } from "./ThemeChooser";

interface MasterBarProps {
  audioEngine: React.MutableRefObject<AudioEngine | null>;
  recorder: RecorderController;
  bpm: number;
  onBpmChange: (bpm: number) => void;
  scale: string;
  theme: BiomeTheme;
  midiStatus: string;
  onSnapshotApply: (p: Partial<Preset>) => void;
}

/* MasterBar — the producer deck.
   Hosts BPM, master volume, recording, 3-band EQ toggle, MIDI status, and
   preset save/load + URL share. Sits at the bottom-left of the viewport
   (above the DJ panel on desktop, stacks above it on mobile). */
export default function MasterBar({
  audioEngine,
  recorder,
  bpm,
  onBpmChange,
  scale,
  theme,
  midiStatus,
  onSnapshotApply,
}: MasterBarProps) {
  const [volumeDb, setVolumeDb] = useState(0);
  const [eq, setEq] = useState<{ low: number; mid: number; high: number }>({ low: 0, mid: 0, high: 0 });
  const [eqOpen, setEqOpen] = useState(false);
  const [presetOpen, setPresetOpen] = useState(false);
  const [presets, setPresets] = useState<Preset[]>(() => listPresets());
  const [shareCopied, setShareCopied] = useState(false);

  // Apply EQ and volume to the engine whenever state changes.
  useEffect(() => {
    audioEngine.current?.setMasterVolume(volumeDb, 0.05);
  }, [volumeDb, audioEngine]);

  useEffect(() => {
    audioEngine.current?.setMasterEQ(eq.low, eq.mid, eq.high);
  }, [eq, audioEngine]);

  const handleBpm = useCallback(
    (v: number) => {
      onBpmChange(v);
      try {
        Tone.getTransport().bpm.rampTo(v, 0.1);
      } catch {
        /* context gone */
      }
    },
    [onBpmChange],
  );

  const handleRecord = useCallback(() => {
    if (recorder.isRecording) recorder.stop();
    else recorder.start();
  }, [recorder]);

  const handleSavePreset = useCallback(() => {
    const name = prompt("Preset name?", `Biome ${presets.length + 1}`);
    if (!name) return;
    const p: Preset = {
      name,
      scale,
      theme,
      bpm,
      masterVolumeDb: volumeDb,
      reverbWet: 0.3,
      delayWet: 0.14,
      eq: { ...eq },
      savedAt: Date.now(),
    };
    savePreset(p);
    setPresets(listPresets());
  }, [scale, theme, bpm, volumeDb, eq, presets.length]);

  const handleLoadPreset = useCallback(
    (p: Preset) => {
      setVolumeDb(p.masterVolumeDb);
      setEq(p.eq);
      handleBpm(p.bpm);
      onSnapshotApply(p);
      setPresetOpen(false);
    },
    [handleBpm, onSnapshotApply],
  );

  const handleDeletePreset = useCallback(
    (name: string) => {
      deletePreset(name);
      setPresets(listPresets());
    },
    [],
  );

  const handleShare = useCallback(() => {
    const hash = encodePresetToHash({
      scale,
      theme,
      bpm,
      masterVolumeDb: volumeDb,
      reverbWet: 0.3,
      delayWet: 0.14,
      eq,
    });
    if (!hash) return;
    const url = `${window.location.origin}${window.location.pathname}#${hash}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 1800);
      });
    } else {
      window.prompt("Copy this URL:", url);
    }
  }, [scale, theme, bpm, volumeDb, eq]);

  const elapsedStr = (() => {
    const s = Math.floor(recorder.elapsed);
    const m = Math.floor(s / 60);
    return `${m}:${(s % 60).toString().padStart(2, "0")}`;
  })();

  return (
    <div className="biome-master-bar" role="toolbar" aria-label="Master controls">
      <button
        type="button"
        className={`biome-mb-btn biome-mb-record${recorder.isRecording ? " is-rec" : ""}`}
        onClick={handleRecord}
        aria-pressed={recorder.isRecording}
        aria-label={recorder.isRecording ? `Stop recording (${elapsedStr})` : "Start recording"}
        title={recorder.isRecording ? `Recording ${elapsedStr}` : "Record session"}
      >
        <span className="biome-mb-rec-dot" aria-hidden="true" />
        {recorder.isRecording ? elapsedStr : "REC"}
      </button>

      <div className="biome-mb-group" aria-label="BPM">
        <label className="biome-mb-label" htmlFor="biome-mb-bpm">BPM</label>
        <input
          id="biome-mb-bpm"
          className="biome-mb-slider"
          type="range"
          min={60}
          max={180}
          step={1}
          value={bpm}
          onChange={(e) => handleBpm(Number(e.currentTarget.value))}
          aria-valuemin={60}
          aria-valuemax={180}
          aria-valuenow={bpm}
        />
        <span className="biome-mb-value">{bpm}</span>
      </div>

      <div className="biome-mb-group" aria-label="Master volume">
        <label className="biome-mb-label" htmlFor="biome-mb-vol">VOL</label>
        <input
          id="biome-mb-vol"
          className="biome-mb-slider"
          type="range"
          min={-30}
          max={6}
          step={0.5}
          value={volumeDb}
          onChange={(e) => setVolumeDb(Number(e.currentTarget.value))}
          aria-valuemin={-30}
          aria-valuemax={6}
          aria-valuenow={volumeDb}
        />
        <span className="biome-mb-value">{volumeDb > 0 ? `+${volumeDb}` : volumeDb}dB</span>
      </div>

      <button
        type="button"
        className={`biome-mb-btn${eqOpen ? " is-open" : ""}`}
        onClick={() => setEqOpen((v) => !v)}
        aria-expanded={eqOpen}
        aria-label="Master EQ"
      >
        EQ
      </button>

      <button
        type="button"
        className={`biome-mb-btn${presetOpen ? " is-open" : ""}`}
        onClick={() => setPresetOpen((v) => !v)}
        aria-expanded={presetOpen}
        aria-label="Presets"
      >
        PRESETS
      </button>

      <button
        type="button"
        className="biome-mb-btn"
        onClick={handleShare}
        aria-label="Share session URL"
        title="Copy shareable link"
      >
        {shareCopied ? "COPIED ✓" : "SHARE"}
      </button>

      {midiStatus === "connected" && (
        <span className="biome-mb-midi" aria-live="polite" title="MIDI device connected">
          <span className="biome-mb-midi-dot" aria-hidden="true" />
          MIDI
        </span>
      )}

      {eqOpen && (
        <div className="biome-mb-eq-pop" role="group" aria-label="3-band EQ">
          {(["low", "mid", "high"] as const).map((band) => (
            <div key={band} className="biome-mb-eq-col">
              <span className="biome-mb-eq-label">{band.toUpperCase()}</span>
              <input
                className="biome-mb-eq-fader"
                type="range"
                min={-12}
                max={12}
                step={0.5}
                value={eq[band]}
                onChange={(e) => setEq((prev) => ({ ...prev, [band]: Number(e.currentTarget.value) }))}
                aria-label={`EQ ${band}`}
              />
              <span className="biome-mb-eq-val">{eq[band] > 0 ? `+${eq[band]}` : eq[band]}</span>
            </div>
          ))}
        </div>
      )}

      {presetOpen && (
        <div className="biome-mb-preset-pop" role="dialog" aria-label="Preset manager">
          <div className="biome-mb-preset-head">
            <span>Presets</span>
            <button type="button" className="biome-mb-preset-save" onClick={handleSavePreset}>
              SAVE CURRENT
            </button>
          </div>
          {presets.length === 0 ? (
            <div className="biome-mb-preset-empty">No presets yet.</div>
          ) : (
            <ul className="biome-mb-preset-list">
              {presets.map((p) => (
                <li key={p.name} className="biome-mb-preset-item">
                  <button
                    type="button"
                    className="biome-mb-preset-load"
                    onClick={() => handleLoadPreset(p)}
                    title={`${p.theme} · ${p.scale} · ${p.bpm} BPM`}
                  >
                    {p.name}
                  </button>
                  <button
                    type="button"
                    className="biome-mb-preset-del"
                    onClick={() => handleDeletePreset(p.name)}
                    aria-label={`Delete ${p.name}`}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
