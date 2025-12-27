const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function migrate() {
  console.log('🚀 Starting usage tracking migration...');
  
  const sql = `
    -- Add usage tracking columns to businesses table
    ALTER TABLE businesses
    ADD COLUMN IF NOT EXISTS ai_suggestions_used_today INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS ai_suggestions_reset_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS conversations_used_this_month INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS conversations_reset_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free',
    ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
    ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

    -- Create index for faster queries
    CREATE INDEX IF NOT EXISTS idx_businesses_subscription_tier ON businesses(subscription_tier);
  `;

  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
  
  if (error) {
    console.error('❌ Migration failed:', error);
    
    // Try alternative method using raw query
    console.log('Trying alternative migration method...');
    
    try {
      // Update existing businesses to have default values
      const { error: updateError } = await supabase
        .from('businesses')
        .update({
          ai_suggestions_used_today: 0,
          ai_suggestions_reset_at: new Date().toISOString(),
          conversations_used_this_month: 0,
          conversations_reset_at: new Date().toISOString(),
          subscription_tier: 'free'
        })
        .is('subscription_tier', null);
      
      if (updateError) {
        console.error('❌ Alternative migration also failed:', updateError);
        console.log('\n⚠️  Please run this SQL manually in Supabase dashboard:');
        console.log(sql);
      } else {
        console.log('✅ Migration completed via alternative method!');
      }
    } catch (e) {
      console.error('❌ Error:', e);
      console.log('\n⚠️  Please run this SQL manually in Supabase dashboard:');
      console.log(sql);
    }
  } else {
    console.log('✅ Migration completed successfully!');
  }
}

migrate().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
