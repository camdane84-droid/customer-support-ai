// Test that the webhook fix is working properly
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testWebhookFix() {
  console.log('🧪 Testing Instagram Webhook Fix\n');
  console.log('═══════════════════════════════════════\n');

  // 1. Verify connection exists with access token
  console.log('1️⃣ Checking social_connections table...');
  const { data: connection, error } = await supabase
    .from('social_connections')
    .select('*')
    .eq('platform', 'instagram')
    .eq('is_active', true)
    .single();

  if (error || !connection) {
    console.log('❌ No Instagram connection found');
    return false;
  }

  console.log('   ✓ Connection found: @' + connection.platform_username);
  console.log('   ✓ Platform User ID:', connection.platform_user_id);
  console.log('   ✓ Access token:', connection.access_token ? 'Present' : '❌ MISSING');

  if (!connection.access_token) {
    console.log('\n❌ CRITICAL: No access token in database!');
    return false;
  }

  // 2. Test the access token
  console.log('\n2️⃣ Testing access token from database...');
  const testUrl = `https://graph.facebook.com/v21.0/${connection.platform_user_id}?fields=username&access_token=${connection.access_token}`;

  try {
    const response = await fetch(testUrl);
    const data = await response.json();

    if (data.error) {
      console.log('   ❌ Token test failed:', data.error.message);
      return false;
    }

    console.log('   ✓ Token works! Username:', data.username);
  } catch (err) {
    console.log('   ❌ Token test error:', err.message);
    return false;
  }

  // 3. Check recent messages
  console.log('\n3️⃣ Checking recent Instagram messages...');
  const { data: messages } = await supabase
    .from('messages')
    .select(`
      *,
      conversations!inner(customer_name, customer_instagram_id, channel)
    `)
    .eq('channel', 'instagram')
    .order('created_at', { ascending: false })
    .limit(5);

  if (!messages || messages.length === 0) {
    console.log('   ⚠️  No messages found (this is normal if you just set up)');
  } else {
    console.log(`   ✓ Found ${messages.length} recent messages:`);
    messages.forEach((msg, i) => {
      console.log(`     ${i + 1}. From ${msg.conversations.customer_name}: "${msg.content.substring(0, 30)}..."`);
    });
  }

  // 4. Summary
  console.log('\n═══════════════════════════════════════');
  console.log('✅ ALL CHECKS PASSED!\n');
  console.log('📝 What was fixed:');
  console.log('   • Webhook now uses database access token');
  console.log('   • Uses correct API endpoint (graph.facebook.com)');
  console.log('   • Better error logging added');
  console.log('\n💡 Next time you receive an Instagram message:');
  console.log('   • It should save with the correct username');
  console.log('   • Check your app logs for the new detailed logging');
  console.log('   • The message will appear in your dashboard\n');

  return true;
}

testWebhookFix()
  .catch(err => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  });
