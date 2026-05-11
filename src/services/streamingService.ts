import Hls from 'hls.js';

export class StreamingService {
  private hls: Hls | null = null;
  private audio: HTMLAudioElement | null = null;
  private onErrorCallback?: (error: string, url?: string) => void;

  setOnError(callback: (error: string, url?: string) => void) {
    this.onErrorCallback = callback;
  }

  initialize(audioElement: HTMLAudioElement) {
    if (this.audio === audioElement && this.hls) return;
    
    this.destroy();
    this.audio = audioElement;
    
    if (Hls.isSupported()) {
      console.log('Initializing HLS for audio element');
      this.hls = new Hls({
        debug: true,
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 60,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        fragLoadingMaxRetry: 6,
        manifestLoadingMaxRetry: 6,
        xhrSetup: (xhr, _url) => {
          xhr.withCredentials = false;
        }
      });
      
      this.hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          console.error('Fatal HLS Error:', data.type, data.details);
          if (data.response) {
            console.error('HTTP Status:', data.response.code, 'at', data.response.url);
            this.onErrorCallback?.(`${data.type}: ${data.details} (HTTP ${data.response.code})`, data.response.url);
          } else {
            this.onErrorCallback?.(`${data.type}: ${data.details}`);
          }
          
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error('Network error encountered. This is likely a CORS configuration issue on your bucket.');
              this.hls?.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              this.hls?.recoverMediaError();
              break;
            default:
              this.destroy();
              break;
          }
        }
      });

      this.hls.attachMedia(this.audio);
    } else if (audioElement.canPlayType('application/vnd.apple.mpegurl')) {
      console.log('Using native HLS support');
    }
  }

  loadSource(url: string) {
    if (!this.audio) {
      console.error('StreamingService: loadSource called before initialize');
      return;
    }

    console.log('StreamingService loading source:', url);
    const isLocal = url.startsWith('blob:') || url.startsWith('data:');
    
    if (isLocal) {
      if (this.hls) {
        this.hls.stopLoad();
        this.hls.detachMedia();
      }
      this.audio.src = url;
    } else {
      if (this.hls) {
        if (!this.hls.media) {
          this.hls.attachMedia(this.audio);
        }
        this.hls.loadSource(url);
      } else {
        this.audio.src = url;
      }
    }
  }

  play(): Promise<void> {
    if (!this.audio) return Promise.reject('No audio element');
    return this.audio.play();
  }

  pause() {
    this.audio?.pause();
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
