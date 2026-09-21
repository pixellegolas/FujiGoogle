import React, { useRef, useEffect, useState } from 'react';
import { FilmRecipe, HistogramData } from '../types';
import { FilmWebGLRenderer } from '../utils/filmShader';
import { computeHistogram } from '../utils/histogram';
import { Histogram } from './Histogram';
import { SwitchCamera, Zap, ZapOff, Folder } from 'lucide-react';

interface ViewfinderProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  selectedRecipe: FilmRecipe;
  postProcess?: boolean;
  livePreview?: boolean;
  isSimulated: boolean;
  grainMultiplier: number;
  bloomMultiplier: number;
  halationMultiplier: number;
  aspectRatio: '3:2' | '4:3' | '1:1' | '16:9';
  orientationLock?: 'auto' | 'portrait' | 'landscape';
  onToggleOrientation?: () => void;
  gridOverlay: 'rule-of-thirds' | 'crosshair' | 'none';
  activeFolderName: string;
  hasTorch: boolean;
  isTorchOn: boolean;
  onToggleTorch: () => void;
  onSwitchCamera: () => void;
  onOpenGallery: () => void;
  shutterFlash: boolean;
}

export const Viewfinder: React.FC<ViewfinderProps> = ({
  videoRef,
  selectedRecipe,
  postProcess,
  livePreview,
  isSimulated,
  grainMultiplier,
  bloomMultiplier,
  halationMultiplier,
  aspectRatio,
  orientationLock = 'auto',
  onToggleOrientation,
  gridOverlay,
  activeFolderName,
  hasTorch,
  isTorchOn,
  onToggleTorch,
  onSwitchCamera,
  onOpenGallery,
  shutterFlash,
}) => {
  const isPostProcessActive = postProcess ?? livePreview ?? true;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<FilmWebGLRenderer | null>(null);
  const histCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [histogramData, setHistogramData] = useState<HistogramData | null>(null);
  const [focusPoint, setFocusPoint] = useState<{ x: number; y: number } | null>(null);

  // Dynamic orientation detection
  const [deviceIsPortrait, setDeviceIsPortrait] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerHeight > window.innerWidth;
  });

  useEffect(() => {
    const handleOrientation = () => {
      setDeviceIsPortrait(window.innerHeight > window.innerWidth);
    };
    window.addEventListener('resize', handleOrientation);
    window.addEventListener('orientationchange', handleOrientation);
    return () => {
      window.removeEventListener('resize', handleOrientation);
      window.removeEventListener('orientationchange', handleOrientation);
    };
  }, []);

  const isPortraitMode =
    orientationLock === 'portrait'
      ? true
      : orientationLock === 'landscape'
      ? false
      : deviceIsPortrait;

  const getTargetAspectRatio = () => {
    if (aspectRatio === '1:1') return '1 / 1';
    if (isPortraitMode) {
      switch (aspectRatio) {
        case '4:3':
          return '3 / 4';
        case '16:9':
          return '9 / 16';
        case '3:2':
        default:
          return '2 / 3';
      }
    } else {
      switch (aspectRatio) {
        case '4:3':
          return '4 / 3';
        case '16:9':
          return '16 / 9';
        case '3:2':
        default:
          return '3 / 2';
      }
    }
  };

  const getFormatLabel = () => {
    if (aspectRatio === '1:1') return '1:1';
    return isPortraitMode
      ? (aspectRatio === '3:2' ? '2:3' : aspectRatio === '4:3' ? '3:4' : '9:16')
      : aspectRatio;
  };

  // Initialize WebGL renderer for canvas
  useEffect(() => {
    if (!canvasRef.current) return;
    try {
      rendererRef.current = new FilmWebGLRenderer(canvasRef.current);
    } catch (e) {
      console.warn('Failed to init WebGL renderer:', e);
    }

    return () => {
      if (rendererRef.current) {
        rendererRef.current.destroy();
        rendererRef.current = null;
      }
    };
  }, []);

  // Frame rendering loop
  useEffect(() => {
    let animId: number;
    let histCounter = 0;

    // Small offscreen canvas to sample histogram without slowing down render
    if (!histCanvasRef.current) {
      histCanvasRef.current = document.createElement('canvas');
      histCanvasRef.current.width = 160;
      histCanvasRef.current.height = 90;
    }
    const hCanvas = histCanvasRef.current;
    const hCtx = hCanvas.getContext('2d', { willReadFrequently: true });

    const renderLoop = (time: number) => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState >= 2) {
        const vw = video.videoWidth || 1280;
        const vh = video.videoHeight || 720;

        if (canvas.width !== vw || canvas.height !== vh) {
          canvas.width = vw;
          canvas.height = vh;
        }

        if (isPostProcessActive && rendererRef.current) {
          // Render through WebGL film emulation pipeline
          rendererRef.current.render(
            video,
            selectedRecipe,
            grainMultiplier,
            bloomMultiplier,
            halationMultiplier,
            time * 0.001
          );
        } else {
          // Direct 2D feed (clean/fast preview)
          const ctx2d = canvas.getContext('2d');
          if (ctx2d) {
            ctx2d.drawImage(video, 0, 0, vw, vh);
          }
        }

        // Compute histogram ~15 times per second for smooth performance
        histCounter++;
        if (histCounter % 3 === 0 && hCtx) {
          hCtx.drawImage(video, 0, 0, hCanvas.width, hCanvas.height);
          const imgData = hCtx.getImageData(0, 0, hCanvas.width, hCanvas.height);
          const computed = computeHistogram(imgData, 48);
          setHistogramData(computed);
        }
      }

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, [videoRef, livePreview, selectedRecipe, grainMultiplier, bloomMultiplier, halationMultiplier]);

  // Handle tap-to-focus indicator
  const handleViewportClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setFocusPoint({ x, y });
    setTimeout(() => setFocusPoint(null), 1800);
  };

  return (
    <div
      id="camera-viewport-frame"
      className="relative flex-1 w-full h-full bg-black flex items-center justify-center overflow-hidden p-1.5 sm:p-3"
      onClick={handleViewportClick}
    >
      {/* Source video element (kept active in layout with opacity 0 for hardware decoders) */}
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className="absolute top-0 left-0 w-1 h-1 opacity-0 pointer-events-none -z-10"
      />

      {/* Frame container matching desired aspect ratio */}
      <div
        className="relative bg-neutral-950 flex items-center justify-center overflow-hidden border border-white/10 shadow-2xl transition-all duration-300"
        style={{
          aspectRatio: getTargetAspectRatio(),
          maxWidth: '100%',
          maxHeight: '100%',
          height: '100%',
          width: 'auto',
        }}
      >
        {/* Render Canvas */}
        <canvas
          ref={canvasRef}
          className="w-full h-full object-cover"
        />

        {/* Shutter blink flash effect */}
        {shutterFlash && (
          <div className="absolute inset-0 bg-white z-50 animate-out fade-out duration-150 pointer-events-none" />
        )}

        {/* Rule of Thirds / Framing Grids */}
        {gridOverlay === 'rule-of-thirds' && (
          <div className="absolute inset-0 pointer-events-none select-none">
            <div className="absolute top-1/3 left-0 right-0 h-px bg-white/20" />
            <div className="absolute top-2/3 left-0 right-0 h-px bg-white/20" />
            <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/20" />
            <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/20" />
          </div>
        )}

        {gridOverlay === 'crosshair' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-12 h-12 border border-white/30 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white/50 rounded-full" />
            </div>
          </div>
        )}

        {/* Tap to focus reticle */}
        {focusPoint && (
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 w-14 h-14 border border-white rounded-xs pointer-events-none animate-in zoom-in-75 duration-200"
            style={{ left: `${focusPoint.x}%`, top: `${focusPoint.y}%` }}
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-0.5 bg-white" />
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-0.5 bg-white" />
            <div className="absolute -left-1 top-1/2 -translate-y-1/2 h-2 w-0.5 bg-white" />
            <div className="absolute -right-1 top-1/2 -translate-y-1/2 h-2 w-0.5 bg-white" />
          </div>
        )}

        {/* Top Viewport HUD */}
        <div className="absolute top-2.5 left-3 right-3 flex items-start justify-between pointer-events-none z-10 text-white font-mono text-[10px] tracking-wider">
          {/* Active Recipe / Post-process Tag */}
          <div className="flex items-center gap-1.5 bg-black/70 backdrop-blur-xs border border-white/20 px-2 py-1 rounded max-w-[55%]">
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                isPostProcessActive ? 'bg-white animate-pulse' : 'bg-neutral-500'
              }`}
            />
            <span className="font-bold shrink-0">
              {isPostProcessActive ? selectedRecipe.shortCode : 'NATURAL'}
            </span>
            <span className="text-white/60 shrink-0">|</span>
            <span className="text-white/80 truncate">
              {isPostProcessActive ? selectedRecipe.name.toUpperCase() : 'NO POST-PROCESS'}
            </span>
          </div>

          {/* Top Right: Live White-Line Histogram */}
          <div className="pointer-events-auto flex flex-col items-end gap-1.5">
            <Histogram data={histogramData} width={105} height={36} />
          </div>
        </div>

        {/* Bottom Viewport HUD */}
        <div className="absolute bottom-2.5 left-3 right-3 flex items-end justify-between pointer-events-none z-10 text-white font-mono text-[10px]">
          {/* Exposure Data & Folder */}
          <div className="flex flex-col gap-1 items-start bg-black/70 backdrop-blur-xs border border-white/20 px-2 py-1 rounded">
            <div className="flex items-center gap-2">
              <span className="text-white font-bold">f/2.0</span>
              <span className="text-white/70">1/250</span>
              <span className="text-white/70">ISO 400</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenGallery();
              }}
              className="pointer-events-auto flex items-center gap-1 text-[9px] text-white/80 hover:text-white transition cursor-pointer"
            >
              <Folder className="w-2.5 h-2.5" />
              <span className="truncate max-w-[90px]">{activeFolderName}</span>
            </button>
          </div>

          {/* Quick HUD controls */}
          <div className="pointer-events-auto flex items-center gap-1.5">
            {onToggleOrientation && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleOrientation();
                }}
                className="p-1.5 px-2 rounded bg-black/70 border border-white/20 text-white hover:border-white transition cursor-pointer flex items-center gap-1 text-[10px]"
                title={`Växla format/orientering (${orientationLock || 'auto'})`}
              >
                <span className="font-bold">{getFormatLabel()}</span>
                <span className="text-[8px] text-neutral-400 uppercase">
                  {orientationLock === 'portrait' ? '↕' : orientationLock === 'landscape' ? '↔' : 'Auto'}
                </span>
              </button>
            )}

            {hasTorch && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleTorch();
                }}
                className={`p-2 rounded border transition ${
                  isTorchOn ? 'bg-white text-black border-white' : 'bg-black/70 border-white/20 text-white hover:border-white'
                }`}
                title="Ficklampa/Blixt"
              >
                {isTorchOn ? <Zap className="w-3.5 h-3.5 fill-black" /> : <ZapOff className="w-3.5 h-3.5" />}
              </button>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                onSwitchCamera();
              }}
              className="p-2 rounded bg-black/70 border border-white/20 text-white hover:border-white transition cursor-pointer"
              title="Växla fram/bakkamera"
            >
              <SwitchCamera className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Simulation Indicator banner if webcam isn't physically active */}
        {isSimulated && (
          <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-black/80 border border-white/20 px-2.5 py-0.5 rounded text-[9px] font-mono text-white/80 pointer-events-none">
            SIMULERAD SÖKARE • NORDISK GATA
          </div>
        )}
      </div>
    </div>
  );
};
