import Hls from 'hls.js';

class StreamingService {
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
    if (this.hls) {
      this.hls.loadSource(url);
    } else if (this.audio && this.audio.canPlayType('application/vnd.apple.mpegurl')) {
      // Native support (Safari)
      this.audio.src = url;
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
