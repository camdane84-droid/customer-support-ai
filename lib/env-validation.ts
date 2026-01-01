/**
 * Environment variable validation
 * Validates required environment variables at startup
 */

const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_APP_URL',
  'SENDGRID_API_KEY',
  'META_APP_SECRET',
  'INSTAGRAM_APP_SECRET',
] as const;

const OPTIONAL_ENV_VARS = [
  'ANTHROPIC_API_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_STARTER_PRICE_ID',
  'STRIPE_PRO_PRICE_ID',
] as const;

export function validateEnv() {
  const missing: string[] = [];
  const warnings: string[] = [];

  // Check required variables
  for (const envVar of REQUIRED_ENV_VARS) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  // Check optional but recommended variables
  for (const envVar of OPTIONAL_ENV_VARS) {
    if (!process.env[envVar]) {
      warnings.push(envVar);
    }
  }

  // Report missing required variables
  if (missing.length > 0) {
    console.error('\n❌ CRITICAL: Missing required environment variables:');
    missing.forEach(v => console.error(`   - ${v}`));
    console.error('\nThe application may not function correctly.\n');

    // Only fail at runtime, not during build
    // This allows the build to complete so we can see the error in Vercel logs
    if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }

  // Report missing optional variables
  if (warnings.length > 0 && process.env.NODE_ENV !== 'test') {
    console.warn('\n⚠️  Optional environment variables not set:');
    warnings.forEach(v => console.warn(`   - ${v}`));
    console.warn('Some features may not be available.\n');
  }

  // Success message
  if (missing.length === 0 && process.env.NODE_ENV !== 'test') {
    console.log('✅ All required environment variables are set');
  }
}

// Run validation immediately when imported
if (process.env.NODE_ENV !== 'test') {
  validateEnv();
}
