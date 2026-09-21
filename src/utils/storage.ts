import { CapturedPhoto, PhotoFolder } from '../types';

const DB_NAME = 'fujicam_db';
const DB_VERSION = 1;
const PHOTO_STORE = 'photos';
const FOLDER_STORE = 'folders';

export const DEFAULT_FOLDERS: PhotoFolder[] = [
  { id: 'roll-01', name: 'Rulle 01 (Standard)', createdAt: Date.now() },
  { id: 'street', name: 'Gatufoto', createdAt: Date.now() - 1000 },
  { id: 'portraits', name: 'Porträtt', createdAt: Date.now() - 2000 },
];

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(PHOTO_STORE)) {
        const photoStore = db.createObjectStore(PHOTO_STORE, { keyPath: 'id' });
        photoStore.createIndex('folderId', 'folderId', { unique: false });
        photoStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
      if (!db.objectStoreNames.contains(FOLDER_STORE)) {
        db.createObjectStore(FOLDER_STORE, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function initStorage(): Promise<{ folders: PhotoFolder[]; photos: CapturedPhoto[] }> {
  const db = await openDB();

  // Ensure default folders exist
  const existingFolders = await getFolders();
  if (existingFolders.length === 0) {
    for (const f of DEFAULT_FOLDERS) {
      await saveFolder(f);
    }
  }

  const folders = await getFolders();
  const photos = await getPhotos();
  return { folders, photos };
}

export async function getFolders(): Promise<PhotoFolder[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(FOLDER_STORE, 'readonly');
    const store = tx.objectStore(FOLDER_STORE);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function saveFolder(folder: PhotoFolder): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(FOLDER_STORE, 'readwrite');
    const store = tx.objectStore(FOLDER_STORE);
    const req = store.put(folder);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function deleteFolder(folderId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([FOLDER_STORE, PHOTO_STORE], 'readwrite');
    tx.objectStore(FOLDER_STORE).delete(folderId);

    // Also reassign or delete photos in that folder
    const photoStore = tx.objectStore(PHOTO_STORE);
    const index = photoStore.index('folderId');
    const req = index.openCursor(IDBKeyRange.only(folderId));

    req.onsuccess = (e) => {
      const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getPhotos(folderId?: string): Promise<CapturedPhoto[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTO_STORE, 'readonly');
    const store = tx.objectStore(PHOTO_STORE);
    let req: IDBRequest<CapturedPhoto[]>;

    if (folderId) {
      const index = store.index('folderId');
      req = index.getAll(IDBKeyRange.only(folderId));
    } else {
      req = store.getAll();
    }

    req.onsuccess = () => {
      const photos = req.result || [];
      // Sort newest first
      photos.sort((a, b) => b.timestamp - a.timestamp);
      resolve(photos);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function savePhoto(photo: CapturedPhoto): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTO_STORE, 'readwrite');
    const store = tx.objectStore(PHOTO_STORE);
    const req = store.put(photo);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function deletePhoto(photoId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTO_STORE, 'readwrite');
    const store = tx.objectStore(PHOTO_STORE);
    const req = store.delete(photoId);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function movePhotoToFolder(photoId: string, targetFolderId: string, targetFolderName: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTO_STORE, 'readwrite');
    const store = tx.objectStore(PHOTO_STORE);
    const getReq = store.get(photoId);

    getReq.onsuccess = () => {
      const photo = getReq.result as CapturedPhoto;
      if (photo) {
        photo.folderId = targetFolderId;
        photo.folderName = targetFolderName;
        store.put(photo);
      }
      resolve();
    };
    getReq.onerror = () => reject(getReq.error);
  });
}
