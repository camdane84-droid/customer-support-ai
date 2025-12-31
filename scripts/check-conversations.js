const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkConversations() {
  const businessId = '97f8fc5d-bb5d-4314-9424-f28407265805'; // Acme's Coffee Shop

  const { data: conversations, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('business_id', businessId)
    .order('updated_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('\n=== Conversations for Acme\'s Coffee Shop ===');
  console.log(`Total: ${conversations?.length || 0} conversations`);

  if (conversations && conversations.length > 0) {
    conversations.forEach((c, i) => {
      console.log(`\n${i + 1}. ${c.customer_name || 'Unknown'}`);
      console.log(`   Platform: ${c.platform}`);
      console.log(`   Status: ${c.status}`);
      console.log(`   Last updated: ${c.updated_at}`);
    });
  } else {
    console.log('\nNo conversations found in this business.');
  }
}

checkConversations()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
