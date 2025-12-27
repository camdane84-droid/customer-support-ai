import Stripe from 'stripe';

// Initialize Stripe with secret key (server-side only)
// Use placeholder during build if env vars not set
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2025-12-15.clover',
  typescript: true,
});

// Stripe Price IDs for each tier
// You'll need to create these in your Stripe dashboard and add them to .env.local
export const STRIPE_PRICE_IDS = {
  starter: process.env.STRIPE_STARTER_PRICE_ID || 'price_placeholder_starter',
  pro: process.env.STRIPE_PRO_PRICE_ID || 'price_placeholder_pro',
} as const;

// Stripe publishable key for client-side (exposed to browser)
export const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder';

// Map tier names to Stripe price IDs
export function getPriceIdForTier(tier: 'starter' | 'pro'): string {
  return STRIPE_PRICE_IDS[tier];
}

// Map Stripe price ID back to tier name
export function getTierForPriceId(priceId: string): 'starter' | 'pro' | null {
  if (priceId === STRIPE_PRICE_IDS.starter) return 'starter';
  if (priceId === STRIPE_PRICE_IDS.pro) return 'pro';
  return null;
}
