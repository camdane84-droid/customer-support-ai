require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUsage() {
  // Get the user's business (Test Coffee Shop 2)
  const { data: business, error: bizError } = await supabase
    .from('businesses')
    .select('id, name, email, ai_suggestions_used_today, conversations_used_this_month, ai_suggestions_reset_at, conversations_reset_at, subscription_tier')
    .eq('email', 'test2@gmail.com')
    .single();

  if (bizError) {
    console.error('Error fetching business:', bizError);
    return;
  }

  console.log('\n📊 Business Usage Data:');
  console.log('Business:', business.name);
  console.log('Email:', business.email);
  console.log('Tier:', business.subscription_tier);
  console.log('\nAI Suggestions:');
  console.log('  Used Today:', business.ai_suggestions_used_today);
  console.log('  Reset At:', business.ai_suggestions_reset_at);
  console.log('\nConversations:');
  console.log('  Used This Month:', business.conversations_used_this_month);
  console.log('  Reset At:', business.conversations_reset_at);

  // Count actual conversations
  const { count, error: countError } = await supabase
    .from('conversations')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', business.id);

  if (!countError) {
    console.log('\n  Actual Conversation Count in DB:', count);
    console.log('  Discrepancy:', count - (business.conversations_used_this_month || 0));
  }

  console.log('\n');
}

checkUsage();
