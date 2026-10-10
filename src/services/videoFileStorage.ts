/**
 * IndexedDB storage for local video files browsed from the user's PC.
 * Keeps video blobs persistent across page refreshes and browser sessions.
 */

const DB_NAME = 'CommunityVA_VideoDB';
const DB_VERSION = 1;
const STORE_NAME = 'videos';

interface StoredVideoRecord {
  key: string;
  blob: Blob;
  fileName: string;
  fileSize: number;
  fileType: string;
  updatedAt: string;
}

class VideoFileStorage {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private objectUrlCache: Map<string, string> = new Map();

  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB not supported in this environment'));
        return;
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  /**
   * Save a video file to IndexedDB for a team stage (e.g., 'teamId_video1')
   */
  public async saveVideo(
    teamId: string,
    stageNumber: 1 | 2 | 3 | 4,
    file: File | Blob,
    fileName?: string
  ): Promise<string> {
    const key = `${teamId}_video${stageNumber}`;
    const db = await this.getDB();

    const actualName = fileName || (file instanceof File ? file.name : `video_${stageNumber}.mp4`);
    const record: StoredVideoRecord = {
      key,
      blob: file,
      fileName: actualName,
      fileSize: file.size,
      fileType: file.type || 'video/mp4',
      updatedAt: new Date().toISOString(),
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const req = store.put(record);

      req.onsuccess = () => {
        // Create or update object URL
        if (this.objectUrlCache.has(key)) {
          URL.revokeObjectURL(this.objectUrlCache.get(key)!);
        }
        const objUrl = URL.createObjectURL(file);
        this.objectUrlCache.set(key, objUrl);
        resolve(objUrl);
      };

      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Retrieve video record from IndexedDB
   */
  public async getVideo(
    teamId: string,
    stageNumber: 1 | 2 | 3 | 4
  ): Promise<StoredVideoRecord | null> {
    const key = `${teamId}_video${stageNumber}`;
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const req = store.get(key);

        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return null;
    }
  }

  /**
   * Get an active Object URL for playback
   */
  public async getVideoObjectUrl(
    teamId: string,
    stageNumber: 1 | 2 | 3 | 4
  ): Promise<string | null> {
    const key = `${teamId}_video${stageNumber}`;
    if (this.objectUrlCache.has(key)) {
      return this.objectUrlCache.get(key)!;
    }

    const record = await this.getVideo(teamId, stageNumber);
    if (!record || !record.blob) return null;

    const objUrl = URL.createObjectURL(record.blob);
    this.objectUrlCache.set(key, objUrl);
    return objUrl;
  }

  /**
   * Delete stored video
   */
  public async deleteVideo(teamId: string, stageNumber: 1 | 2 | 3 | 4): Promise<void> {
    const key = `${teamId}_video${stageNumber}`;
    if (this.objectUrlCache.has(key)) {
      URL.revokeObjectURL(this.objectUrlCache.get(key)!);
      this.objectUrlCache.delete(key);
    }

    try {
      const db = await this.getDB();
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).delete(key);
    } catch (e) {
      console.warn('Failed to delete video from IndexedDB:', e);
    }
  }
}

export const videoFileStorage = new VideoFileStorage();
