require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAllBusinesses() {
  // Get all businesses
  const { data: businesses, error } = await supabase
    .from('businesses')
    .select('id, name, email, ai_suggestions_used_today, conversations_used_this_month, subscription_tier')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('\n📊 All Businesses Usage:\n');

  for (const biz of businesses) {
    // Count actual conversations
    const { count } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', biz.id);

    console.log(`Business: ${biz.name} (${biz.email})`);
    console.log(`  Tier: ${biz.subscription_tier}`);
    console.log(`  AI Used: ${biz.ai_suggestions_used_today || 0}`);
    console.log(`  Conversations Tracked: ${biz.conversations_used_this_month || 0}`);
    console.log(`  Actual Conversations: ${count}`);
    console.log(`  Discrepancy: ${count - (biz.conversations_used_this_month || 0)}`);
    console.log('');
  }
}

checkAllBusinesses();
