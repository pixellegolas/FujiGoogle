import React, { useState } from 'react';
import { CapturedPhoto, PhotoFolder } from '../types';
import {
  X,
  Folder,
  FolderPlus,
  Trash2,
  Download,
  Share2,
  Calendar,
  Layers,
  ChevronLeft,
  CheckCircle2,
  Camera
} from 'lucide-react';

interface GalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  photos: CapturedPhoto[];
  folders: PhotoFolder[];
  activeFolderId: string;
  onSelectActiveFolder: (folderId: string) => void;
  onCreateFolder: (name: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onDeletePhoto: (photoId: string) => void;
  onMovePhoto: (photoId: string, targetFolderId: string) => void;
}

export const GalleryModal: React.FC<GalleryModalProps> = ({
  isOpen,
  onClose,
  photos,
  folders,
  activeFolderId,
  onSelectActiveFolder,
  onCreateFolder,
  onDeleteFolder,
  onDeletePhoto,
  onMovePhoto,
}) => {
  const [selectedFolderId, setSelectedFolderId] = useState<string>(activeFolderId);
  const [selectedPhoto, setSelectedPhoto] = useState<CapturedPhoto | null>(null);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showMoveDropdown, setShowMoveDropdown] = useState(false);

  if (!isOpen) return null;

  const currentFolder = folders.find((f) => f.id === selectedFolderId) || folders[0];
  const filteredPhotos = photos.filter((p) => p.folderId === selectedFolderId);

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    onCreateFolder(newFolderName.trim());
    setNewFolderName('');
    setIsCreatingFolder(false);
  };

  const handleDownload = (photo: CapturedPhoto) => {
    const link = document.createElement('a');
    link.href = photo.dataUrl;
    const dateStr = new Date(photo.timestamp).toISOString().replace(/[:.]/g, '-');
    link.download = `FUJICAM_${photo.recipeName.replace(/[^a-zA-Z0-9]/g, '_')}_${dateStr}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async (photo: CapturedPhoto) => {
    if (navigator.share) {
      try {
        const res = await fetch(photo.dataUrl);
        const blob = await res.blob();
        const file = new File([blob], `FUJICAM_${photo.id}.jpg`, { type: 'image/jpeg' });
        await navigator.share({
          files: [file],
          title: 'FujiCam Photo',
          text: `Fångad med FujiCam • ${photo.recipeName}`,
        });
      } catch (err) {
        console.warn('Share error or cancelled:', err);
      }
    } else {
      handleDownload(photo);
    }
  };

  return (
    <div
      id="gallery-modal-overlay"
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md text-white flex flex-col animate-in fade-in duration-200"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <h2 className="font-mono text-sm font-bold tracking-wider">FUJICAM GALLERI</h2>
          <span className="text-xs font-mono text-neutral-400">
            ({photos.length} {photos.length === 1 ? 'bild' : 'bilder'})
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-full border border-white/20 hover:border-white hover:bg-neutral-900 transition cursor-pointer"
          aria-label="Stäng galleri"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Folders Bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 overflow-x-auto border-b border-white/10 shrink-0 scrollbar-none bg-neutral-950">
        <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
          <Layers className="w-3 h-3" /> Mappar:
        </span>

        {folders.map((folder) => {
          const count = photos.filter((p) => p.folderId === folder.id).length;
          const isSelected = folder.id === selectedFolderId;
          const isActive = folder.id === activeFolderId;

          return (
            <button
              key={folder.id}
              onClick={() => setSelectedFolderId(folder.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-mono text-xs whitespace-nowrap transition cursor-pointer ${
                isSelected
                  ? 'bg-white text-black font-bold'
                  : 'bg-neutral-900 text-neutral-300 hover:text-white border border-white/15'
              }`}
            >
              <Folder className="w-3 h-3" />
              <span>{folder.name}</span>
              <span className={`text-[10px] px-1 rounded ${isSelected ? 'bg-black/20 text-black' : 'text-neutral-400'}`}>
                {count}
              </span>
              {isActive && (
                <span className={`text-[8px] font-bold uppercase px-1 rounded ${isSelected ? 'bg-black text-white' : 'bg-white/20 text-white'}`}>
                  Aktiv
                </span>
              )}
            </button>
          );
        })}

        <button
          onClick={() => setIsCreatingFolder(true)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded border border-dashed border-white/30 text-neutral-400 hover:text-white hover:border-white font-mono text-xs whitespace-nowrap transition cursor-pointer"
        >
          <FolderPlus className="w-3 h-3" />
          <span>Ny mapp</span>
        </button>
      </div>

      {/* New Folder Inline Form */}
      {isCreatingFolder && (
        <form onSubmit={handleCreateFolder} className="flex items-center gap-2 px-4 py-2 bg-neutral-900 border-b border-white/10">
          <input
            type="text"
            placeholder="Mappnamn (t.ex. Rulle 02)..."
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            autoFocus
            className="flex-1 bg-black border border-white/30 px-3 py-1 rounded font-mono text-xs text-white focus:outline-none focus:border-white"
          />
          <button
            type="submit"
            className="px-3 py-1 rounded bg-white text-black font-mono text-xs font-bold hover:bg-neutral-200"
          >
            Skapa
          </button>
          <button
            type="button"
            onClick={() => setIsCreatingFolder(false)}
            className="px-2 py-1 rounded text-neutral-400 hover:text-white font-mono text-xs"
          >
            Avbryt
          </button>
        </form>
      )}

      {/* Current Folder Info / Actions */}
      <div className="flex items-center justify-between px-4 py-2 text-xs font-mono text-neutral-400 bg-black">
        <div className="flex items-center gap-2">
          <span>Visar: <strong className="text-white">{currentFolder?.name}</strong></span>
          {currentFolder?.id !== activeFolderId && (
            <button
              onClick={() => onSelectActiveFolder(currentFolder.id)}
              className="text-[10px] text-white underline hover:text-neutral-300 cursor-pointer"
            >
              (Sätt som fotomapp)
            </button>
          )}
        </div>

        {folders.length > 1 && currentFolder && (
          <button
            onClick={() => {
              if (confirm(`Vill du ta bort mappen "${currentFolder.name}" och alla bilder i den?`)) {
                onDeleteFolder(currentFolder.id);
                setSelectedFolderId(folders[0].id);
              }
            }}
            className="text-[10px] text-neutral-400 hover:text-white transition flex items-center gap-1 cursor-pointer"
          >
            <Trash2 className="w-3 h-3" />
            <span>Ta bort mapp</span>
          </button>
        )}
      </div>

      {/* Photos Grid or Empty State */}
      <div className="flex-1 overflow-y-auto p-3">
        {filteredPhotos.length === 0 ? (
          <div className="h-full min-h-[260px] flex flex-col items-center justify-center text-center text-neutral-500 font-mono">
            <Camera className="w-10 h-10 mb-2 stroke-[1.2] opacity-40 text-white" />
            <p className="text-sm text-neutral-300 mb-1">Inga bilder i denna mapp än</p>
            <p className="text-xs text-neutral-400 max-w-xs">
              Välj en film recipe i sökaren och tryck på avtryckaren för att ta bilder till {currentFolder?.name}.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {filteredPhotos.map((photo) => (
              <div
                key={photo.id}
                onClick={() => setSelectedPhoto(photo)}
                className="group relative aspect-square bg-neutral-900 rounded overflow-hidden border border-white/10 hover:border-white transition cursor-pointer"
              >
                <img
                  src={photo.dataUrl}
                  alt={photo.recipeName}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {/* Badge Overlay */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-2 flex items-end justify-between text-[9px] font-mono text-white">
                  <div className="flex items-center gap-1 max-w-[75%] truncate">
                    <span className="font-semibold truncate">{photo.recipeName}</span>
                    <span className="text-[8px] px-1 py-0.2 bg-white/20 rounded">
                      {photo.height > photo.width ? 'P' : photo.height === photo.width ? 'S' : 'L'}
                    </span>
                  </div>
                  <span className="text-white/60 text-[8px]">
                    {new Date(photo.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Photo Lightbox / Detail View */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-60 bg-black flex flex-col animate-in fade-in duration-150">
          {/* Lightbox Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0 bg-neutral-950">
            <button
              onClick={() => setSelectedPhoto(null)}
              className="flex items-center gap-1 text-xs font-mono text-neutral-300 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Tillbaka</span>
            </button>

            <div className="font-mono text-xs text-white font-bold">
              {selectedPhoto.recipeName}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleShare(selectedPhoto)}
                className="p-1.5 rounded border border-white/20 hover:border-white transition"
                title="Dela bild"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDownload(selectedPhoto)}
                className="p-1.5 rounded bg-white text-black font-mono text-xs font-bold hover:bg-neutral-200 flex items-center gap-1"
                title="Ladda ner bild"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Spara</span>
              </button>
              <button
                onClick={() => {
                  if (confirm('Vill du ta bort denna bild?')) {
                    onDeletePhoto(selectedPhoto.id);
                    setSelectedPhoto(null);
                  }
                }}
                className="p-1.5 rounded border border-white/20 text-neutral-400 hover:text-white hover:border-white transition"
                title="Radera bild"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Photo Display */}
          <div className="flex-1 flex items-center justify-center p-2 sm:p-4 overflow-hidden bg-black">
            <img
              src={selectedPhoto.dataUrl}
              alt={selectedPhoto.recipeName}
              className="max-w-full max-h-full object-contain rounded shadow-2xl border border-white/10"
            />
          </div>

          {/* Photo Metadata Bar */}
          <div className="p-3 bg-neutral-950 border-t border-white/10 font-mono text-xs flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-4 text-neutral-300">
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                <span>{new Date(selectedPhoto.timestamp).toLocaleString('sv-SE')}</span>
              </div>
              <div className="text-white font-semibold flex items-center gap-1">
                <span>{selectedPhoto.width} × {selectedPhoto.height} px</span>
                <span className="text-[10px] text-neutral-400 font-normal">
                  ({selectedPhoto.height > selectedPhoto.width ? 'Porträtt' : selectedPhoto.height === selectedPhoto.width ? 'Kvadrat' : 'Landskap'})
                </span>
              </div>
              <div className="text-neutral-400">
                {selectedPhoto.aperture} • {selectedPhoto.shutter} • ISO {selectedPhoto.iso}
              </div>
            </div>

            {/* Move to folder selector */}
            <div className="relative flex items-center gap-2">
              <span className="text-neutral-400 text-[11px]">Mapp:</span>
              <select
                value={selectedPhoto.folderId}
                onChange={(e) => {
                  const targetFolder = folders.find((f) => f.id === e.target.value);
                  if (targetFolder) {
                    onMovePhoto(selectedPhoto.id, targetFolder.id);
                    setSelectedPhoto({
                      ...selectedPhoto,
                      folderId: targetFolder.id,
                      folderName: targetFolder.name,
                    });
                  }
                }}
                className="bg-neutral-900 border border-white/30 text-white px-2 py-1 rounded text-xs focus:outline-none cursor-pointer"
              >
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
