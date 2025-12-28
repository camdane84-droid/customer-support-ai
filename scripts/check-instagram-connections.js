require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkConnections() {
  // Get all Instagram connections
  const { data: connections, error } = await supabase
    .from('social_connections')
    .select('*')
    .eq('platform', 'instagram')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('\n📱 Instagram Connections in Database:\n');

  if (!connections || connections.length === 0) {
    console.log('No Instagram connections found.');
    return;
  }

  connections.forEach((conn, i) => {
    console.log(`\n${i + 1}. Connection:`);
    console.log(`   Business ID: ${conn.business_id}`);
    console.log(`   Instagram Username: ${conn.platform_username}`);
    console.log(`   Instagram User ID: ${conn.platform_user_id}`);
    console.log(`   Is Active: ${conn.is_active}`);
    console.log(`   Created: ${conn.created_at}`);
    console.log(`   Page: ${conn.metadata?.page_name || 'N/A'}`);
  });

  console.log('\n');
}

checkConnections();
