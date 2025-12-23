// Check Instagram message flow and connections
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkInstagramSetup() {
  console.log('🔍 Checking Instagram integration setup...\n');

  // 1. Check social connections
  console.log('1️⃣ Checking Instagram social connections:');
  const { data: connections, error: connError } = await supabase
    .from('social_connections')
    .select('*')
    .eq('platform', 'instagram')
    .order('created_at', { ascending: false });

  if (connError) {
    console.error('❌ Error fetching connections:', connError);
  } else if (connections.length === 0) {
    console.log('⚠️  No Instagram connections found!');
  } else {
    connections.forEach(conn => {
      console.log(`   ✓ Connected: @${conn.platform_username}`);
      console.log(`     - Platform User ID: ${conn.platform_user_id}`);
      console.log(`     - Business ID: ${conn.business_id}`);
      console.log(`     - Active: ${conn.is_active}`);
      console.log(`     - Token expires: ${conn.token_expires_at || 'Never'}`);
      console.log('');
    });
  }

  // 2. Check recent conversations
  console.log('\n2️⃣ Checking Instagram conversations:');
  const { data: conversations, error: convError } = await supabase
    .from('conversations')
    .select('*')
    .eq('channel', 'instagram')
    .order('last_message_at', { ascending: false })
    .limit(10);

  if (convError) {
    console.error('❌ Error fetching conversations:', convError);
  } else if (conversations.length === 0) {
    console.log('⚠️  No Instagram conversations found!');
  } else {
    console.log(`   Found ${conversations.length} conversations:\n`);
    conversations.forEach(conv => {
      console.log(`   📱 ${conv.customer_name} (${conv.status})`);
      console.log(`      - Instagram ID: ${conv.customer_instagram_id}`);
      console.log(`      - Unread: ${conv.unread_count}`);
      console.log(`      - Last message: ${conv.last_message_at}`);
      console.log('');
    });
  }

  // 3. Check recent messages
  console.log('\n3️⃣ Checking recent Instagram messages:');
  const { data: messages, error: msgError } = await supabase
    .from('messages')
    .select(`
      *,
      conversations!inner(customer_name, channel)
    `)
    .eq('channel', 'instagram')
    .order('created_at', { ascending: false })
    .limit(10);

  if (msgError) {
    console.error('❌ Error fetching messages:', msgError);
  } else if (messages.length === 0) {
    console.log('⚠️  No Instagram messages found in database!');
  } else {
    console.log(`   Found ${messages.length} recent messages:\n`);
    messages.forEach(msg => {
      console.log(`   💬 ${msg.sender_type}: "${msg.content.substring(0, 50)}${msg.content.length > 50 ? '...' : ''}"`);
      console.log(`      - Created: ${msg.created_at}`);
      console.log(`      - Conversation: ${msg.conversations?.customer_name}`);
      console.log('');
    });
  }

  // 4. Check environment variables
  console.log('\n4️⃣ Checking environment variables:');
  console.log(`   META_ACCESS_TOKEN: ${process.env.META_ACCESS_TOKEN ? '✓ Set' : '❌ Missing'}`);
  console.log(`   META_APP_SECRET: ${process.env.META_APP_SECRET ? '✓ Set' : '❌ Missing'}`);
  console.log(`   INSTAGRAM_WEBHOOK_VERIFY_TOKEN: ${process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN ? '✓ Set' : '❌ Missing'}`);

  // 5. Test access token
  if (process.env.META_ACCESS_TOKEN) {
    console.log('\n5️⃣ Testing Meta access token:');
    try {
      const response = await fetch(
        `https://graph.facebook.com/v21.0/me?access_token=${process.env.META_ACCESS_TOKEN}`
      );
      const data = await response.json();

      if (data.error) {
        console.log('   ❌ Token error:', data.error.message);
        console.log('   ⚠️  Your META_ACCESS_TOKEN may be expired or invalid!');
      } else {
        console.log('   ✓ Token is valid');
        console.log('   Account:', data.name || data.id);
      }
    } catch (error) {
      console.error('   ❌ Error testing token:', error.message);
    }
  }
}

checkInstagramSetup()
  .then(() => console.log('\n✅ Check complete'))
  .catch(err => console.error('\n❌ Fatal error:', err));
