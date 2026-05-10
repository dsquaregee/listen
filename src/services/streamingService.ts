import Hls from 'hls.js';

export class StreamingService {
  private hls: Hls | null = null;
  private audio: HTMLAudioElement | null = null;

  initialize(audioElement: HTMLAudioElement) {
    this.audio = audioElement;
    if (Hls.isSupported()) {
      this.hls = new Hls({
        debug: false,
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 60,
        // Optimize for low cost / battery
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        fragLoadingMaxRetry: 3,
      });
      this.hls.attachMedia(this.audio);
    }
  }

  loadSource(url: string) {
    const isLocal = url.startsWith('blob:');
    
    if (isLocal) {
      // Detach HLS for local playback
      if (this.hls) {
        this.hls.detachMedia();
      }
      if (this.audio) {
        this.audio.src = url;
      }
    } else {
      // HLS playback
      if (this.hls) {
        if (!this.hls.media && this.audio) {
          this.hls.attachMedia(this.audio);
        }
        this.hls.loadSource(url);
      } else if (this.audio && this.audio.canPlayType('application/vnd.apple.mpegurl')) {
        // Native support (Safari)
        this.audio.src = url;
      }
    }
  }

  switchQuality(levelIndex: number) {
    if (this.hls) {
      this.hls.currentLevel = levelIndex; // -1 for auto
    }
  }

  getAvailableLevels() {
    return this.hls ? this.hls.levels : [];
  }

  destroy() {
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }
  }
}

export const streamingService = new StreamingService();
