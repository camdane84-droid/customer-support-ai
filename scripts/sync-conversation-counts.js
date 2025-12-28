require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function syncConversationCounts() {
  // Get all businesses
  const { data: businesses, error } = await supabase
    .from('businesses')
    .select('id, name, email');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('\n🔄 Syncing Conversation Counts...\n');

  for (const biz of businesses) {
    // Count actual conversations
    const { count } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', biz.id);

    // Update the tracked count to match actual count
    const { error: updateError } = await supabase
      .from('businesses')
      .update({ conversations_used_this_month: count })
      .eq('id', biz.id);

    if (updateError) {
      console.error(`❌ Error updating ${biz.name}:`, updateError);
    } else {
      console.log(`✅ ${biz.name}: Set conversations_used_this_month to ${count}`);
    }
  }

  console.log('\n✅ Sync complete!\n');
}

syncConversationCounts();
