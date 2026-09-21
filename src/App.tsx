import React, { useState, useEffect, useCallback, useRef } from 'react';
import { App as CapApp } from '@capacitor/app';
import { FilmRecipe, CapturedPhoto, PhotoFolder, CameraSettings } from './types';
import { FILM_RECIPES, DEFAULT_RECIPE } from './constants/recipes';
import { useCamera } from './hooks/useCamera';
import { initStorage, savePhoto, deletePhoto, saveFolder, deleteFolder, movePhotoToFolder } from './utils/storage';
import { processHighResPhoto, capturePhotoSource } from './utils/filmShader';
import { playShutterSound } from './utils/audio';
import { TopBar } from './components/TopBar';
import { Viewfinder } from './components/Viewfinder';
import { ControlBar } from './components/ControlBar';
import { GalleryModal } from './components/GalleryModal';
import { SettingsModal } from './components/SettingsModal';

export default function App() {
  const [selectedRecipe, setSelectedRecipe] = useState<FilmRecipe>(DEFAULT_RECIPE);
  const [livePreview, setLivePreview] = useState<boolean>(true);

  // Settings
  const [settings, setSettings] = useState<CameraSettings>({
    livePreviewRecipe: true,
    activeRecipeId: DEFAULT_RECIPE.id,
    activeFolderId: 'roll-01',
    grainMultiplier: 1.0,
    bloomMultiplier: 1.0,
    halationMultiplier: 1.0,
    showDateStamp: true,
    gridOverlay: 'rule-of-thirds',
    aspectRatio: '3:2',
    orientationLock: 'auto',
    shutterSound: true,
    cameraFacing: 'environment',
  });

  // Storage data
  const [folders, setFolders] = useState<PhotoFolder[]>([]);
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<string>('roll-01');

  // UI state
  const [isGalleryOpen, setIsGalleryOpen] = useState<boolean>(false);
  const [selectedGalleryPhoto, setSelectedGalleryPhoto] = useState<CapturedPhoto | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [shutterFlash, setShutterFlash] = useState<boolean>(false);
  const [recentCapture, setRecentCapture] = useState<string | null>(null);

  // Keep a ref to latest navigation state for hardware back button listener
  const navStateRef = useRef({
    selectedGalleryPhoto,
    isGalleryOpen,
    isSettingsOpen,
  });

  useEffect(() => {
    navStateRef.current = {
      selectedGalleryPhoto,
      isGalleryOpen,
      isSettingsOpen,
    };
  }, [selectedGalleryPhoto, isGalleryOpen, isSettingsOpen]);

  // Hardware back button navigation support (Android back gesture / button)
  useEffect(() => {
    let removeListener: (() => void) | null = null;

    try {
      const listenerPromise = CapApp.addListener('backButton', () => {
        const { selectedGalleryPhoto: photo, isGalleryOpen: gallery, isSettingsOpen: settingsOpen } = navStateRef.current;

        if (photo) {
          // If viewing a single photo in detail, step back to the gallery list
          setSelectedGalleryPhoto(null);
        } else if (gallery) {
          // If inside gallery list, step back to viewfinder live view
          setIsGalleryOpen(false);
        } else if (settingsOpen) {
          // If settings modal is open, close it
          setIsSettingsOpen(false);
        } else {
          // Already on viewfinder home screen, minimize / exit app
          CapApp.exitApp();
        }
      });

      listenerPromise.then((handle) => {
        removeListener = () => handle.remove();
      }).catch(() => {
        // Not running in Capacitor or plugin unsupported
      });
    } catch {
      // Browser environment fallback
    }

    return () => {
      if (removeListener) removeListener();
    };
  }, []);

  // Responsive device orientation tracking (portrait vs landscape)
  const [isLandscape, setIsLandscape] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth > window.innerHeight;
  });

  useEffect(() => {
    const handleOrientationChange = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };
    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('orientationchange', handleOrientationChange);
    const mql = window.matchMedia?.('(orientation: landscape)');
    if (mql?.addEventListener) {
      mql.addEventListener('change', handleOrientationChange);
    }
    return () => {
      window.removeEventListener('resize', handleOrientationChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
      if (mql?.removeEventListener) {
        mql.removeEventListener('change', handleOrientationChange);
      }
    };
  }, []);

  // Camera hook
  const {
    videoRef,
    stream,
    isSimulated,
    hasTorch,
    isTorchOn,
    switchCamera,
    toggleTorch,
  } = useCamera();

  // Initialize storage
  useEffect(() => {
    initStorage().then(({ folders: fList, photos: pList }) => {
      setFolders(fList);
      setPhotos(pList);
      if (fList.length > 0) {
        setActiveFolderId(fList[0].id);
      }
    });
  }, []);

  const activeFolder = folders.find((f) => f.id === activeFolderId) || folders[0] || { id: 'roll-01', name: 'Rulle 01' };

  // Orientation toggle handler
  const handleToggleOrientation = () => {
    setSettings((prev) => {
      const next =
        prev.orientationLock === 'auto' || !prev.orientationLock
          ? 'portrait'
          : prev.orientationLock === 'portrait'
          ? 'landscape'
          : 'auto';
      return { ...prev, orientationLock: next };
    });
  };

  // Shutter action: take picture with full film emulation
  const handleTakePhoto = useCallback(async () => {
    if (isProcessing) return;

    // Trigger shutter effects
    if (settings.shutterSound) {
      playShutterSound();
    }
    setShutterFlash(true);
    setTimeout(() => setShutterFlash(false), 120);

    setIsProcessing(true);

    try {
      const video = videoRef.current;
      if (!video) throw new Error('Ingen videokälla tillgänglig');

      // Capture photo source with maximum optical resolution (ImageCapture or Video stream)
      const photoSource = await capturePhotoSource(video, stream);

      // Process image using high-res film emulation pipeline
      const result = await processHighResPhoto(photoSource.source, selectedRecipe, {
        grainMultiplier: settings.grainMultiplier,
        bloomMultiplier: settings.bloomMultiplier,
        halationMultiplier: settings.halationMultiplier,
        showDateStamp: settings.showDateStamp,
        aspectRatio: settings.aspectRatio,
        orientation: settings.orientationLock || 'auto',
        iso: 400,
        shutter: '1/250s',
        fStop: 'f/2.0',
      });

      const newPhoto: CapturedPhoto = {
        id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        dataUrl: result.dataUrl,
        folderId: activeFolder.id,
        folderName: activeFolder.name,
        timestamp: Date.now(),
        recipeId: selectedRecipe.id,
        recipeName: selectedRecipe.name,
        width: result.width,
        height: result.height,
        sizeBytes: result.sizeBytes,
        aperture: 'f/2.0',
        shutter: '1/250s',
        iso: 400,
      };

      await savePhoto(newPhoto);
      setPhotos((prev) => [newPhoto, ...prev]);

      // Quick thumbnail preview flash in UI
      setRecentCapture(result.dataUrl);
      setTimeout(() => setRecentCapture(null), 2200);
    } catch (err) {
      console.error('Kunde inte ta foto:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [
    isProcessing,
    settings,
    selectedRecipe,
    activeFolder,
    videoRef,
    stream,
  ]);

  // Folder actions
  const handleCreateFolder = async (name: string) => {
    const newF: PhotoFolder = {
      id: `folder-${Date.now()}`,
      name,
      createdAt: Date.now(),
    };
    await saveFolder(newF);
    setFolders((prev) => [...prev, newF]);
    setActiveFolderId(newF.id);
  };

  const handleDeleteFolder = async (folderId: string) => {
    await deleteFolder(folderId);
    setFolders((prev) => prev.filter((f) => f.id !== folderId));
    setPhotos((prev) => prev.filter((p) => p.folderId !== folderId));
    if (activeFolderId === folderId && folders.length > 1) {
      const remaining = folders.filter((f) => f.id !== folderId);
      setActiveFolderId(remaining[0].id);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    await deletePhoto(photoId);
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
  };

  const handleMovePhoto = async (photoId: string, targetFolderId: string) => {
    const targetFolder = folders.find((f) => f.id === targetFolderId);
    if (!targetFolder) return;
    await movePhotoToFolder(photoId, targetFolderId, targetFolder.name);
    setPhotos((prev) =>
      prev.map((p) =>
        p.id === photoId
          ? { ...p, folderId: targetFolderId, folderName: targetFolder.name }
          : p
      )
    );
  };

  return (
    <main
      id="fujicam-app-root"
      className={`relative flex ${
        isLandscape ? 'flex-row' : 'flex-col'
      } h-full w-full bg-black text-white select-none overflow-hidden`}
    >
      {/* Viewport container (takes all remaining width/height) */}
      <div className="relative flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <TopBar
          photoCount={photos.length}
          activeFolderName={activeFolder.name}
          onOpenGallery={() => setIsGalleryOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          isProcessing={isProcessing}
          isLandscape={isLandscape}
        />

        {/* Main Viewport & Live Histogram */}
        <Viewfinder
          videoRef={videoRef}
          selectedRecipe={selectedRecipe}
          livePreview={livePreview}
          isSimulated={isSimulated}
          grainMultiplier={settings.grainMultiplier}
          bloomMultiplier={settings.bloomMultiplier}
          halationMultiplier={settings.halationMultiplier}
          aspectRatio={settings.aspectRatio}
          orientationLock={settings.orientationLock}
          onToggleOrientation={handleToggleOrientation}
          gridOverlay={settings.gridOverlay}
          activeFolderName={activeFolder.name}
          hasTorch={hasTorch}
          isTorchOn={isTorchOn}
          onToggleTorch={toggleTorch}
          onSwitchCamera={switchCamera}
          onOpenGallery={() => setIsGalleryOpen(true)}
          shutterFlash={shutterFlash}
        />
      </div>

      {/* Shutter & Controls:
          - In portrait: horizontal bar docked at bottom
          - In landscape: vertical bar docked on the RIGHT side with centered white shutter button!
      */}
      <ControlBar
        selectedRecipe={selectedRecipe}
        onSelectRecipe={setSelectedRecipe}
        livePreview={livePreview}
        onToggleLivePreview={setLivePreview}
        onTakePhoto={handleTakePhoto}
        isProcessing={isProcessing}
        isLandscape={isLandscape}
      />

      {/* Quick capture preview thumbnail floating above controls */}
      {recentCapture && (
        <div
          onClick={() => setIsGalleryOpen(true)}
          className={`absolute z-40 w-12 h-12 rounded border-2 border-white overflow-hidden shadow-2xl animate-in zoom-in-50 duration-200 cursor-pointer ${
            isLandscape ? 'bottom-3 left-3' : 'bottom-28 left-4'
          }`}
        >
          <img src={recentCapture} alt="Senaste bild" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Gallery Modal with Folders & Management */}
      <GalleryModal
        isOpen={isGalleryOpen}
        onClose={() => {
          setIsGalleryOpen(false);
          setSelectedGalleryPhoto(null);
        }}
        photos={photos}
        folders={folders}
        activeFolderId={activeFolderId}
        onSelectActiveFolder={setActiveFolderId}
        onCreateFolder={handleCreateFolder}
        onDeleteFolder={handleDeleteFolder}
        onDeletePhoto={handleDeletePhoto}
        onMovePhoto={handleMovePhoto}
        selectedPhoto={selectedGalleryPhoto}
        onSelectPhoto={setSelectedGalleryPhoto}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={(newVals) => setSettings((prev) => ({ ...prev, ...newVals }))}
      />
    </main>
  );
}
