const TELEMETRY_ENDPOINT = '/api/metrics/track';
const GUEST_ID_KEY = 'dsquaregee_guest_id';

class TelemetryService {
  private guestId: string;

  constructor() {
    this.guestId = this.getOrCreateGuestId();
  }

  private getOrCreateGuestId(): string {
    let id = localStorage.getItem(GUEST_ID_KEY);
    if (!id) {
      id = 'g_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem(GUEST_ID_KEY, id);
    }
    return id;
  }

  public trackPageView(path: string, authenticated: boolean = false) {
    this.send({
      type: 'page_view',
      path,
      authenticated,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      language: navigator.language,
    });
  }

  public trackEvent(eventName: string, properties: Record<string, any> = {}, authenticated: boolean = false) {
    this.send({
      type: 'event',
      eventName,
      properties,
      authenticated,
      timestamp: new Date().toISOString(),
    });
  }

  private send(payload: any) {
    const fullPayload = {
      ...payload,
      guestId: this.guestId,
    };

    // Use sendBeacon for reliability when closing pages, or fetch for standard events
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(fullPayload)], { type: 'application/json' });
      navigator.sendBeacon(TELEMETRY_ENDPOINT, blob);
    } else {
      fetch(TELEMETRY_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullPayload),
        keepalive: true, // Crucial for fire-and-forget reliability
      }).catch(() => {
        // Silently fail to not affect performance or UI
      });
    }
  }
}

export const telemetry = new TelemetryService();
