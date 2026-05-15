import { loadStripe } from '@stripe/stripe-js';

interface ImportMetaEnv {
  readonly VITE_STRIPE_PUBLISHABLE_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

const stripePublishableKey = (import.meta as any).env?.VITE_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey) {
  console.warn("VITE_STRIPE_PUBLISHABLE_KEY is not set. Stripe functionality will be disabled.");
}

export const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;
