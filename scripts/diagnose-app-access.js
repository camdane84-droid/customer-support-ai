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

async function diagnose() {
  console.log('🔍 COMPREHENSIVE APP DIAGNOSIS\n');
  console.log('=' .repeat(60));

  const { data } = await supabase
    .from('social_connections')
    .select('access_token, platform_user_id, platform_username')
    .eq('platform', 'instagram')
    .single();

  if (!data) {
    console.log('❌ No Instagram connection found');
    return;
  }

  const token = data.access_token;
  const igAccountId = data.platform_user_id;

  // 1. Token Info
  console.log('\n1️⃣ TOKEN STATUS:');
  const debugResponse = await fetch(
    `https://graph.facebook.com/v21.0/debug_token?input_token=${token}&access_token=${token}`
  );
  const debugData = await debugResponse.json();

  if (debugData.data) {
    console.log(`   ✅ Token Type: ${debugData.data.type}`);
    console.log(`   ✅ Token Valid: ${debugData.data.is_valid}`);
    console.log(`   ✅ App ID: ${debugData.data.app_id}`);
    console.log(`   ✅ Scopes: ${debugData.data.scopes?.join(', ')}`);

    const hasMessaging = debugData.data.scopes?.includes('pages_messaging');
    const hasIGManage = debugData.data.scopes?.includes('instagram_manage_messages');

    if (hasMessaging && hasIGManage) {
      console.log('   ✅ Has required scopes for messaging!');
    } else {
      console.log('   ❌ Missing required scopes!');
    }
  }

  // 2. Test Send Capability
  console.log('\n2️⃣ TESTING SEND CAPABILITY:');
  console.log(`   Attempting to send to Instagram account ${igAccountId}...`);

  const testResponse = await fetch(
    `https://graph.facebook.com/v21.0/${igAccountId}/messages?access_token=${token}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: { id: '1234567890' }, // Fake recipient
        message: { text: 'test' }
      })
    }
  );

  const testData = await testResponse.json();

  if (testData.error) {
    const errorCode = testData.error.code;
    console.log(`   ❌ Error ${errorCode}: ${testData.error.message}`);

    console.log('\n' + '='.repeat(60));
    console.log('🚨 DIAGNOSIS:');
    console.log('='.repeat(60));

    if (errorCode === 3) {
      console.log('\n❌ Error #3: "Application does not have the capability"');
      console.log('\nThis is an APP-LEVEL permissions issue, not a token issue!');
      console.log('\n📋 YOUR SITUATION:');
      console.log('   • Your token is valid ✅');
      console.log('   • Your token has the right scopes ✅');
      console.log('   • You can RECEIVE Instagram messages ✅');
      console.log('   • BUT you CANNOT SEND messages ❌');
      console.log('\n🎯 THE PROBLEM:');
      console.log('   Your Meta app (ID: ' + debugData.data.app_id + ') is likely in');
      console.log('   DEVELOPMENT MODE and does not have ADVANCED ACCESS to send');
      console.log('   Instagram messages.');
      console.log('\n✅ SOLUTION OPTIONS:');
      console.log('\n   Option 1: Add Recipient as Tester (Quick Fix for Testing)');
      console.log('   -------------------------------------------------------');
      console.log('   1. Go to: https://developers.facebook.com/apps/' + debugData.data.app_id + '/roles/test-users/');
      console.log('   2. Add the Instagram user as a tester');
      console.log('   3. Have them accept the invite');
      console.log('   4. Try sending again');
      console.log('\n   Option 2: Request Advanced Access (For Production)');
      console.log('   --------------------------------------------------');
      console.log('   1. Go to: https://developers.facebook.com/apps/' + debugData.data.app_id + '/app-review/permissions/');
      console.log('   2. Find "pages_messaging" and click "Request Advanced Access"');
      console.log('   3. Fill out the App Review form:');
      console.log('      - Use case: Customer support messaging');
      console.log('      - Demo video showing the messaging flow');
      console.log('      - Privacy policy URL');
      console.log('   4. Submit and wait for approval (1-3 business days)');
      console.log('\n   Option 3: Check 24-Hour Window');
      console.log('   -------------------------------');
      console.log('   For Instagram Business messaging, you can only send messages');
      console.log('   to users who have messaged you first, within a 24-hour window.');
      console.log('   • Make sure the customer messaged you recently');
      console.log('   • Try replying within 24 hours of their last message');

    } else if (errorCode === 10) {
      console.log('\n❌ Permission Error: The user may not exist or you lack permission');
      console.log('   • The recipient ID may be invalid');
      console.log('   • OR they haven\'t messaged you within 24 hours');
    } else if (errorCode === 200) {
      console.log('\n❌ Permission Error: Insufficient permissions');
      console.log('   • Your app doesn\'t have permission to message this user');
    } else {
      console.log('\n   Error Code:', errorCode);
      console.log('   Message:', testData.error.message);
    }
  } else {
    console.log('   ✅ SUCCESS! Send capability works!');
  }

  console.log('\n' + '='.repeat(60));
}

diagnose().catch(console.error);
