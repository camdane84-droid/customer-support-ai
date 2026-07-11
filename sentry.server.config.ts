import * as Sentry from '@sentry/nextjs';

// No DSN → SDK stays disabled (local dev, preview envs without the var set)
Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
  // Error tracking only — no performance tracing, keeps us inside the free quota
  tracesSampleRate: 0,
});
