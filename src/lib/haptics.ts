/**
 * Utility for providing subtle haptic feedback.
 * Uses the Web Vibration API where supported.
 */

export const hapticFeedback = {
  /**
   * Light impact - perfect for button clicks and small interactions
   */
  light: () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10);
    }
  },

  /**
   * Medium impact - for meaningful transitions or state changes
   */
  medium: () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(20);
    }
  },

  /**
   * Selection - subtle bump when scrolling through items or moving sliders
   */
  selection: () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(5);
    }
  },

  /**
   * Error - for failed actions
   */
  error: () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([15, 30, 20]);
    }
  }
};
