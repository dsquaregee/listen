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

  async downloadAlbum(albumId: string, manifestUrl: string) {
    // In a real app, we would fetch segments and store them
    // For now, we simulate the "download" process
    console.log(`Downloading segments for ${albumId}...`);
    
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
