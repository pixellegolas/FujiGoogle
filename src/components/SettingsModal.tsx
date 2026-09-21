import React from 'react';
import { CameraSettings } from '../types';
import { X, Sliders, Info, Check, Shield } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: CameraSettings;
  onUpdateSettings: (newSettings: Partial<CameraSettings>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="settings-modal-overlay"
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md text-white flex flex-col justify-center items-center p-4 animate-in fade-in duration-150"
    >
      <div className="w-full max-w-md bg-neutral-950 border border-white/20 rounded-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black">
          <div className="flex items-center gap-2 font-mono text-sm font-bold tracking-wider">
            <Sliders className="w-4 h-4" />
            <span>INSTÄLLNINGAR & EMULERING</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded border border-white/20 hover:border-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-5 font-mono text-xs">
          {/* Halation & Bloom sliders */}
          <div className="space-y-3 pb-3 border-b border-white/10">
            <h3 className="text-neutral-400 font-bold uppercase tracking-wider text-[10px]">
              Analog Optik & Halation (Facebook Fujifilm-look)
            </h3>

            <div>
              <div className="flex justify-between text-neutral-300 mb-1">
                <span>Halation (Rött sken vid starkt ljus):</span>
                <span className="text-white font-bold">{Math.round(settings.halationMultiplier * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="2"
                step="0.25"
                value={settings.halationMultiplier}
                onChange={(e) => onUpdateSettings({ halationMultiplier: parseFloat(e.target.value) })}
                className="w-full accent-white cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-neutral-300 mb-1">
                <span>Bloom (Black Pro-Mist diffusion):</span>
                <span className="text-white font-bold">{Math.round(settings.bloomMultiplier * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="2"
                step="0.25"
                value={settings.bloomMultiplier}
                onChange={(e) => onUpdateSettings({ bloomMultiplier: parseFloat(e.target.value) })}
                className="w-full accent-white cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-neutral-300 mb-1">
                <span>Filmkorn (Organisk Silver Halide):</span>
                <span className="text-white font-bold">{Math.round(settings.grainMultiplier * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="2"
                step="0.25"
                value={settings.grainMultiplier}
                onChange={(e) => onUpdateSettings({ grainMultiplier: parseFloat(e.target.value) })}
                className="w-full accent-white cursor-pointer"
              />
            </div>
          </div>

          {/* Framing & Aspect Ratio */}
          <div className="space-y-3 pb-3 border-b border-white/10">
            <h3 className="text-neutral-400 font-bold uppercase tracking-wider text-[10px]">
              Sökare & Format
            </h3>

            <div className="flex items-center justify-between">
              <span className="text-neutral-300">Format / Aspect:</span>
              <div className="flex gap-1">
                {(['3:2', '4:3', '1:1', '16:9'] as const).map((ratio) => (
                  <button
                    key={ratio}
                    onClick={() => onUpdateSettings({ aspectRatio: ratio })}
                    className={`px-2 py-1 rounded border text-[11px] transition ${
                      settings.aspectRatio === ratio
                        ? 'bg-white text-black border-white font-bold'
                        : 'bg-black text-neutral-400 border-white/20 hover:border-white'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-neutral-300">Hjälplinjer / Raster:</span>
              <div className="flex gap-1">
                {[
                  { id: 'rule-of-thirds', label: '3x3' },
                  { id: 'crosshair', label: '+' },
                  { id: 'none', label: 'Av' },
                ].map((g) => (
                  <button
                    key={g.id}
                    onClick={() => onUpdateSettings({ gridOverlay: g.id as any })}
                    className={`px-2 py-1 rounded border text-[11px] transition ${
                      settings.gridOverlay === g.id
                        ? 'bg-white text-black border-white font-bold'
                        : 'bg-black text-neutral-400 border-white/20 hover:border-white'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Stamping & Sound */}
          <div className="space-y-2 pb-2">
            <h3 className="text-neutral-400 font-bold uppercase tracking-wider text-[10px]">
              Exponering & Data
            </h3>

            <label className="flex items-center justify-between cursor-pointer py-1">
              <span className="text-neutral-300">Fujifilm Datum- & Recipestämpel:</span>
              <input
                type="checkbox"
                checked={settings.showDateStamp}
                onChange={(e) => onUpdateSettings({ showDateStamp: e.target.checked })}
                className="w-4 h-4 accent-white rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer py-1">
              <span className="text-neutral-300">Mekaniskt Slutarljud:</span>
              <input
                type="checkbox"
                checked={settings.shutterSound}
                onChange={(e) => onUpdateSettings({ shutterSound: e.target.checked })}
                className="w-4 h-4 accent-white rounded cursor-pointer"
              />
            </label>
          </div>

          <div className="bg-neutral-900 p-2.5 rounded border border-white/15 text-[10px] text-neutral-400 flex items-start gap-2">
            <Info className="w-4 h-4 text-white shrink-0 mt-0.5" />
            <p>
              Alla film recipes är kalibrerade för att återge de klassiska Fujifilm-färgprofilerna (Classic Chrome, Classic Negative, Velvia, Acros etc.).
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-black border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-white text-black font-mono font-bold text-xs hover:bg-neutral-200 transition cursor-pointer"
          >
            Klar
          </button>
        </div>
      </div>
    </div>
  );
};
