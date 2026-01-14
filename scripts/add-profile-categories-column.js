const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addProfileCategoriesColumn() {
  console.log('🔧 Adding profile_categories column to businesses table\n');

  try {
    // Note: We can't ALTER TABLE via the JS client, so we'll use the SQL Editor
    // For now, let's just check if we can update existing businesses

    const defaultCategories = {
      allergies: true,
      favorite_category: true,
      past_orders: true,
      issues: true,
      sizes_dimensions: true,
      preferences: true,
      best_times: true
    };

    console.log('📝 SQL to run in Supabase SQL Editor:\n');
    console.log('─'.repeat(80));
    console.log(`
-- Add profile_categories column to businesses table
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS profile_categories JSONB DEFAULT '{
  "allergies": true,
  "favorite_category": true,
  "past_orders": true,
  "issues": true,
  "sizes_dimensions": true,
  "preferences": true,
  "best_times": true
}'::jsonb;

-- Set default for existing businesses
UPDATE businesses
SET profile_categories = '{
  "allergies": true,
  "favorite_category": true,
  "past_orders": true,
  "issues": true,
  "sizes_dimensions": true,
  "preferences": true,
  "best_times": true
}'::jsonb
WHERE profile_categories IS NULL;
    `.trim());
    console.log('─'.repeat(80));
    console.log('\n✅ Please run the SQL above in your Supabase SQL Editor');
    console.log('   Dashboard → SQL Editor → New Query → Paste & Run\n');

  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

addProfileCategoriesColumn();
