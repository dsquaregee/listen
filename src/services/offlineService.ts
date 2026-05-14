import localforage from 'localforage';
import CryptoJS from 'crypto-js';

// Simulation of secure encryption key
const CACHE_SECRET = 'natural-tones-secure-v1';

class OfflineService {
  private store = localforage.createInstance({
    name: 'NaturalTonesOffline',
    storeName: 'media_cache'
  });

  private metadataStore = localforage.createInstance({
    name: 'NaturalTonesOffline',
    storeName: 'metadata'
  });

  async downloadAlbum(albumId: string, manifestUrl: string, onProgress?: (progress: number, eta?: number) => void) {
    // In a real app, we would fetch segments and store them
    // For now, we simulate the "download" process with progress reporting
    console.log(`Downloading segments for ${albumId}...`);
    
    // Simulate a slow download with progress steps
    const totalSteps = 20;
    const startTime = Date.now();

    for (let i = 1; i <= totalSteps; i++) {
      await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
      const progress = i / totalSteps;
      
      if (onProgress) {
        const elapsed = Date.now() - startTime;
        const estimatedTotal = elapsed / progress;
        const eta = Math.round((estimatedTotal - elapsed) / 1000);
        onProgress(progress, eta);
      }
    }

    // Simulate encryption and storage
    const dummyBlob = new Blob(['encrypted-media-segments'], { type: 'audio/mpeg' });
    const encrypted = await this.encryptBlob(dummyBlob);
    
    await this.store.setItem(albumId, encrypted);
    await this.metadataStore.setItem(albumId, {
      downloadedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 day lease
      albumId
    });
    
    return true;
  }

  async getOfflineUrl(albumId: string): Promise<string | null> {
    const encryptedData = await this.store.getItem<string>(albumId);
    if (!encryptedData) return null;

    const decryptedBlob = await this.decryptToBlob(encryptedData);
    return URL.createObjectURL(decryptedBlob);
  }

  async isAlbumOffline(albumId: string): Promise<boolean> {
    const item = await this.metadataStore.getItem(albumId);
    return !!item;
  }

  async getOfflineAlbumIds(): Promise<string[]> {
    return await this.metadataStore.keys();
  }

  async deleteAlbum(albumId: string) {
    await this.store.removeItem(albumId);
    await this.metadataStore.removeItem(albumId);
    return true;
  }

  async getStorageUsage(): Promise<{ used: number; quota: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        quota: estimate.quota || 0
      };
    }
    
    // Fallback: estimate based on stores
    let total = 0;
    await this.store.iterate((value) => {
      if (typeof value === 'string') total += value.length * 2; // UCS-2 strings are 2 bytes per char
    });
    return { used: total, quota: 0 };
  }

  private async encryptBlob(blob: Blob): Promise<string> {
    const text = await blob.text();
    return CryptoJS.AES.encrypt(text, CACHE_SECRET).toString();
  }

  private async decryptToBlob(encryptedStr: string): Promise<Blob> {
    const bytes = CryptoJS.AES.decrypt(encryptedStr, CACHE_SECRET);
    const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
    return new Blob([decryptedText], { type: 'audio/mpeg' });
  }

  async clearAll() {
    await this.store.clear();
    await this.metadataStore.clear();
  }
}

export const offlineService = new OfflineService();
