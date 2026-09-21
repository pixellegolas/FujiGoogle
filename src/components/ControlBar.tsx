import React, { useState } from 'react';
import { FilmRecipe } from '../types';
import { FILM_RECIPES } from '../constants/recipes';
import { ChevronDown, Check, Info, X, Sparkles } from 'lucide-react';

interface ControlBarProps {
  selectedRecipe: FilmRecipe;
  onSelectRecipe: (recipe: FilmRecipe) => void;
  postProcess: boolean;
  onTogglePostProcess: (val: boolean) => void;
  onTakePhoto: () => void;
  isProcessing: boolean;
  isLandscape?: boolean;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  selectedRecipe,
  onSelectRecipe,
  postProcess,
  onTogglePostProcess,
  onTakePhoto,
  isProcessing,
  isLandscape = false,
}) => {
  const [showRecipeInfo, setShowRecipeInfo] = useState(false);

  // Group recipes by category
  const featuredRecipes = FILM_RECIPES.filter((r) => r.category === 'featured');
  const kodakRecipes = FILM_RECIPES.filter((r) => r.category === 'kodak');
  const fujiRecipes = FILM_RECIPES.filter((r) => r.category === 'fuji');
  const cinemaMonoRecipes = FILM_RECIPES.filter((r) => r.category === 'cinema-mono');

  return (
    <>
      {isLandscape ? (
        /* Landscape Mode: Vertical control bar docked on the right side with shutter button centered */
        <div
          id="camera-control-bar"
          className="relative z-30 w-28 sm:w-32 md:w-36 h-full bg-black border-l border-white/10 px-2 sm:px-3 py-3 flex flex-col items-center justify-between shrink-0 select-none"
          style={{
            paddingRight: 'calc(0.75rem + env(safe-area-inset-right, 0px))',
            paddingTop: 'calc(0.5rem + env(safe-area-inset-top, 0px))',
            paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom, 0px))',
          }}
        >
          {/* Top of right bar: Minimalist Recipe selector */}
          <div className="w-full flex flex-col items-center pt-0.5">
            <div className="flex items-center justify-between w-full mb-1 px-0.5">
              <label
                htmlFor="recipe-select-dropdown"
                className="text-[9px] font-mono uppercase tracking-widest text-neutral-400 flex items-center gap-1"
              >
                <span>FILM</span>
                <span className="text-white font-bold text-[8px] bg-white/15 px-1 py-0.2 rounded">
                  {selectedRecipe.shortCode}
                </span>
              </label>
              <button
                onClick={() => setShowRecipeInfo(true)}
                className="text-neutral-400 hover:text-white transition p-0.5 cursor-pointer"
                title="Visa receptdetaljer & inställningar"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="relative w-full">
              <select
                id="recipe-select-dropdown"
                value={selectedRecipe.id}
                onChange={(e) => {
                  const found = FILM_RECIPES.find((r) => r.id === e.target.value);
                  if (found) onSelectRecipe(found);
                }}
                className="w-full appearance-none bg-neutral-900 hover:bg-neutral-800 text-white font-mono text-[11px] sm:text-xs font-medium py-1.5 pl-2 pr-6 rounded border border-white/30 focus:outline-none focus:border-white transition cursor-pointer truncate"
              >
                <optgroup label="⭐ TOPP 2025 & FAVORITER" className="bg-neutral-950 text-white font-bold">
                  {featuredRecipes.map((r) => (
                    <option key={r.id} value={r.id} className="bg-black text-white font-normal">
                      {r.name}
                    </option>
                  ))}
                </optgroup>

                <optgroup label="🎞️ KODAK EMULSIONER" className="bg-neutral-950 text-white font-bold">
                  {kodakRecipes.map((r) => (
                    <option key={r.id} value={r.id} className="bg-black text-white font-normal">
                      {r.name}
                    </option>
                  ))}
                </optgroup>

                <optgroup label="📷 FUJIFILM ORIGINAL & FÄRG" className="bg-neutral-950 text-white font-bold">
                  {fujiRecipes.map((r) => (
                    <option key={r.id} value={r.id} className="bg-black text-white font-normal">
                      {r.name}
                    </option>
                  ))}
                </optgroup>

                <optgroup label="🎬 CINEMA & SVARTVITT" className="bg-neutral-950 text-white font-bold">
                  {cinemaMonoRecipes.map((r) => (
                    <option key={r.id} value={r.id} className="bg-black text-white font-normal">
                      {r.name}
                    </option>
                  ))}
                </optgroup>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1 text-white/70">
                <ChevronDown className="w-3 h-3" />
              </div>
            </div>
          </div>

          {/* Center of right bar: White Shutter Button centered vertically */}
          <div className="flex-1 flex flex-col items-center justify-center my-auto">
            <div className="relative p-1 rounded-full border border-white/25">
              <button
                id="shutter-button"
                type="button"
                aria-label="Ta foto"
                disabled={isProcessing}
                onClick={onTakePhoto}
                className={`w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-white text-black flex items-center justify-center transition-all duration-100 shadow-md ${
                  isProcessing
                    ? 'opacity-40 scale-95 cursor-not-allowed'
                    : 'active:scale-92 active:bg-neutral-300 hover:bg-neutral-100 cursor-pointer'
                }`}
              >
                {/* Inner solid ring */}
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border border-black/10 bg-white" />
              </button>
            </div>
          </div>

          {/* Bottom of right bar: Post Process toggle */}
          <div className="w-full flex flex-col items-center pb-0.5">
            <label
              htmlFor="post-process-checkbox-landscape"
              className="flex flex-col items-center gap-1 cursor-pointer select-none group"
            >
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-[9px] font-mono font-bold text-white group-hover:text-neutral-200 uppercase tracking-widest text-center leading-tight">
                  POST<br />PROC
                </span>
                <div className="relative my-0.5">
                  <input
                    id="post-process-checkbox-landscape"
                    type="checkbox"
                    checked={postProcess}
                    onChange={(e) => onTogglePostProcess(e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    className={`w-4 h-4 rounded border transition-colors flex items-center justify-center ${
                      postProcess
                        ? 'bg-white border-white text-black'
                        : 'bg-black border-white/40 text-transparent group-hover:border-white'
                    }`}
                  >
                    {postProcess && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>
              </div>
              <span className="text-[9px] font-mono text-neutral-400">
                {postProcess ? 'PÅ' : 'AV'}
              </span>
            </label>
          </div>
        </div>
      ) : (
        /* Portrait Mode: Bottom control bar with horizontal layout */
        <div
          id="camera-control-bar"
          className="relative z-20 w-full bg-black border-t border-white/10 px-4 py-4 sm:py-5 flex items-center justify-between"
          style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
        >
          {/* Vänster sida: Minimalistisk rullista med alla olika film recipes */}
          <div className="flex-1 flex flex-col items-start justify-center pr-2">
            <div className="flex items-center gap-1.5 mb-1">
              <label
                htmlFor="recipe-select-dropdown"
                className="text-[9px] font-mono uppercase tracking-widest text-neutral-400 flex items-center gap-1"
              >
                <span>RECIPE</span>
                <span className="text-white font-bold text-[8px] bg-white/15 px-1 py-0.2 rounded">
                  {selectedRecipe.shortCode}
                </span>
              </label>
              <button
                onClick={() => setShowRecipeInfo(true)}
                className="text-neutral-400 hover:text-white transition p-0.5"
                title="Visa receptdetaljer & inställningar"
              >
                <Info className="w-3 h-3" />
              </button>
            </div>

            <div className="relative w-full max-w-[155px] sm:max-w-[200px]">
              <select
                id="recipe-select-dropdown"
                value={selectedRecipe.id}
                onChange={(e) => {
                  const found = FILM_RECIPES.find((r) => r.id === e.target.value);
                  if (found) onSelectRecipe(found);
                }}
                className="w-full appearance-none bg-neutral-900 hover:bg-neutral-800 text-white font-mono text-xs sm:text-sm font-medium py-2 pl-2.5 pr-7 rounded border border-white/30 focus:outline-none focus:border-white transition cursor-pointer truncate"
              >
                <optgroup label="⭐ TOPP 2025 & FAVORITER" className="bg-neutral-950 text-white font-bold">
                  {featuredRecipes.map((r) => (
                    <option key={r.id} value={r.id} className="bg-black text-white font-normal">
                      {r.name}
                    </option>
                  ))}
                </optgroup>

                <optgroup label="🎞️ KODAK EMULSIONER" className="bg-neutral-950 text-white font-bold">
                  {kodakRecipes.map((r) => (
                    <option key={r.id} value={r.id} className="bg-black text-white font-normal">
                      {r.name}
                    </option>
                  ))}
                </optgroup>

                <optgroup label="📷 FUJIFILM ORIGINAL & FÄRG" className="bg-neutral-950 text-white font-bold">
                  {fujiRecipes.map((r) => (
                    <option key={r.id} value={r.id} className="bg-black text-white font-normal">
                      {r.name}
                    </option>
                  ))}
                </optgroup>

                <optgroup label="🎬 CINEMA & SVARTVITT" className="bg-neutral-950 text-white font-bold">
                  {cinemaMonoRecipes.map((r) => (
                    <option key={r.id} value={r.id} className="bg-black text-white font-normal">
                      {r.name}
                    </option>
                  ))}
                </optgroup>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white/70">
                <ChevronDown className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* Mitten: Enkel solid rund foto-knapp */}
          <div className="flex flex-col items-center justify-center shrink-0 px-2">
            <div className="relative p-1 rounded-full border border-white/25">
              <button
                id="shutter-button"
                type="button"
                aria-label="Ta foto"
                disabled={isProcessing}
                onClick={onTakePhoto}
                className={`w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-white text-black flex items-center justify-center transition-all duration-100 shadow-md ${
                  isProcessing
                    ? 'opacity-40 scale-95 cursor-not-allowed'
                    : 'active:scale-92 active:bg-neutral-300 hover:bg-neutral-100 cursor-pointer'
                }`}
              >
                {/* Inner solid ring indication */}
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border border-black/10 bg-white" />
              </button>
            </div>
          </div>

          {/* Höger sida: Checkbox för att toggla Post Process av film recipes */}
          <div className="flex-1 flex flex-col items-end justify-center pl-2">
            <label
              htmlFor="post-process-checkbox-portrait"
              className="flex items-center gap-2 cursor-pointer select-none group"
            >
              <div className="flex flex-col items-end">
                <span className="text-[11px] sm:text-xs font-mono font-medium text-white group-hover:text-neutral-200 uppercase tracking-wider">
                  Post Process
                </span>
                <span className="text-[9px] font-mono text-neutral-400">
                  {postProcess ? 'PÅ' : 'AV'}
                </span>
              </div>

              <div className="relative">
                <input
                  id="post-process-checkbox-portrait"
                  type="checkbox"
                  checked={postProcess}
                  onChange={(e) => onTogglePostProcess(e.target.checked)}
                  className="sr-only"
                />
                {/* Svartvit minimalistisk checkbox */}
                <div
                  className={`w-5 h-5 rounded border transition-colors flex items-center justify-center ${
                    postProcess
                      ? 'bg-white border-white text-black'
                      : 'bg-black border-white/40 text-transparent group-hover:border-white'
                  }`}
                >
                  {postProcess && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* Recipe Info Modal Sheet */}
      {showRecipeInfo && (
        <div
          id="recipe-info-modal"
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 font-mono text-white animate-in fade-in duration-150"
          onClick={() => setShowRecipeInfo(false)}
        >
          <div
            className="w-full max-w-sm bg-neutral-950 border border-white/20 rounded-lg p-5 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-white/10 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-white text-black font-bold px-1.5 py-0.5 rounded">
                    {selectedRecipe.shortCode}
                  </span>
                  <h3 className="text-sm font-bold tracking-wider">{selectedRecipe.name}</h3>
                </div>
                {selectedRecipe.author && (
                  <p className="text-[10px] text-neutral-400 mt-1">
                    Källa/Skapare: <strong className="text-neutral-200">{selectedRecipe.author}</strong>
                  </p>
                )}
              </div>
              <button
                onClick={() => setShowRecipeInfo(false)}
                className="p-1 rounded border border-white/20 hover:border-white text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Description */}
            <p className="text-xs text-neutral-300 leading-relaxed">
              {selectedRecipe.description}
            </p>

            {/* Recipe Formula Parameters */}
            <div className="bg-neutral-900 border border-white/10 rounded p-3 space-y-2 text-[11px]">
              <div className="flex justify-between border-b border-white/10 pb-1.5">
                <span className="text-neutral-400">Bas-simulering:</span>
                <span className="text-white font-bold">{selectedRecipe.baseFilm}</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-1.5">
                <span className="text-neutral-400">Vitbalansskift (WB):</span>
                <span className="text-white font-bold">
                  {selectedRecipe.wbShift.r >= 0 ? `+${Math.round(selectedRecipe.wbShift.r * 25)}` : Math.round(selectedRecipe.wbShift.r * 25)} R / {selectedRecipe.wbShift.b >= 0 ? `+${Math.round(selectedRecipe.wbShift.b * 25)}` : Math.round(selectedRecipe.wbShift.b * 25)} B
                </span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-1.5">
                <span className="text-neutral-400">Högdagrar / Skuggor:</span>
                <span className="text-white font-bold">
                  {selectedRecipe.highlights > 0 ? `+${selectedRecipe.highlights.toFixed(1)}` : selectedRecipe.highlights.toFixed(1)} / {selectedRecipe.shadows > 0 ? `+${selectedRecipe.shadows.toFixed(1)}` : selectedRecipe.shadows.toFixed(1)}
                </span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-1.5">
                <span className="text-neutral-400">Färgmättnad:</span>
                <span className="text-white font-bold">{Math.round(selectedRecipe.saturation * 100)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Halation / Bloom / Korn:</span>
                <span className="text-white font-bold">
                  {Math.round(selectedRecipe.halationAmount * 100)}% / {Math.round(selectedRecipe.bloomAmount * 100)}% / {Math.round(selectedRecipe.grainAmount * 100)}%
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowRecipeInfo(false)}
              className="w-full py-2 bg-white text-black text-xs font-bold rounded hover:bg-neutral-200 transition cursor-pointer"
            >
              Stäng
            </button>
          </div>
        </div>
      )}
    </>
  );
};
