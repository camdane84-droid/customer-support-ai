const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local file
const envPath = path.join(__dirname, '..', '.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');

// Parse environment variables
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=:#]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim();
    env[key] = value;
  }
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTokenPermissions() {
  const { data } = await supabase
    .from('social_connections')
    .select('access_token, platform_user_id, platform_username')
    .eq('platform', 'instagram')
    .single();

  if (!data || !data.access_token) {
    console.log('❌ No Instagram connection or token found');
    return;
  }

  const token = data.access_token;

  console.log('🔍 Checking permissions for database token...');
  console.log(`Instagram Account: @${data.platform_username}`);
  console.log(`Instagram ID: ${data.platform_user_id}\n`);

  // Check token debug info
  console.log('📊 Token Debug Info:');
  const debugResponse = await fetch(
    `https://graph.facebook.com/v21.0/debug_token?input_token=${token}&access_token=${token}`
  );
  const debugData = await debugResponse.json();

  if (debugData.data) {
    console.log(`   Type: ${debugData.data.type}`);
    console.log(`   App ID: ${debugData.data.app_id}`);
    console.log(`   Valid: ${debugData.data.is_valid}`);
    console.log(`   Expires: ${debugData.data.expires_at === 0 ? 'Never (Page token)' : new Date(debugData.data.expires_at * 1000).toLocaleString()}`);

    if (debugData.data.scopes) {
      console.log(`   Scopes: ${debugData.data.scopes.join(', ')}`);
    }
  }
  console.log('');

  // Check permissions
  console.log('🔑 Token Permissions:');
  const permsResponse = await fetch(
    `https://graph.facebook.com/v21.0/me/permissions?access_token=${token}`
  );
  const permsData = await permsResponse.json();

  if (permsData.error) {
    console.log('❌ Error checking permissions:', permsData.error.message);
    return;
  }

  const critical = ['pages_messaging', 'instagram_manage_messages', 'business_management'];

  console.log('\nCritical for Messaging:');
  permsData.data.forEach(perm => {
    if (critical.includes(perm.permission)) {
      const icon = perm.status === 'granted' ? '✅' : '❌';
      console.log(`   ${icon} ${perm.permission}: ${perm.status}`);
    }
  });

  console.log('\nAll Permissions:');
  permsData.data.forEach(perm => {
    const icon = perm.status === 'granted' ? '✅' : '❌';
    console.log(`   ${icon} ${perm.permission}: ${perm.status}`);
  });

  // Check if this is a Page token
  console.log('\n📄 Checking if this is a Page Access Token...');
  const meResponse = await fetch(
    `https://graph.facebook.com/v21.0/me?access_token=${token}`
  );
  const meData = await meResponse.json();
  console.log(`   Token belongs to: ${meData.name} (ID: ${meData.id})`);

  // Try to test sending capability
  console.log('\n🧪 Testing Send Capability...');
  console.log('   Attempting a test API call to check if app can send messages...');

  const testResponse = await fetch(
    `https://graph.facebook.com/v21.0/${data.platform_user_id}/messages`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: { id: '0000000000' }, // Fake ID to test
        message: { text: 'test' }
      })
    }
  );

  const testData = await testResponse.json();

  if (testData.error) {
    console.log(`   ❌ Error Code ${testData.error.code}: ${testData.error.message}`);

    if (testData.error.code === 3) {
      console.log('\n🚨 DIAGNOSIS: Error #3 - Application does not have the capability');
      console.log('\n   This is NOT a token issue, it\'s an APP-level issue!');
      console.log('\n   Your Meta app (ID: ' + debugData.data?.app_id + ') needs:');
      console.log('   1. To be in Live Mode (not Development Mode)');
      console.log('   2. OR have Advanced Access to pages_messaging');
      console.log('   3. OR the recipient must be a tester on your app');
    }
  } else {
    console.log('   ✅ Send capability works!');
  }
}

checkTokenPermissions().catch(console.error);
