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

async function checkAppCapabilities() {
  console.log('🔍 Checking your Meta app configuration...\n');

  const { data } = await supabase
    .from('social_connections')
    .select('access_token')
    .eq('platform', 'instagram')
    .single();

  if (!data?.access_token) {
    console.log('❌ No Instagram connection found');
    return;
  }

  const token = data.access_token;
  const appId = env.META_APP_ID;

  // Get app info
  console.log('📱 App Information:');
  const appResponse = await fetch(
    `https://graph.facebook.com/v21.0/${appId}?fields=name,namespace,category,link,app_domains,restriction_info&access_token=${token}`
  );
  const appData = await appResponse.json();

  if (appData.error) {
    console.log('❌ Could not fetch app info');
    console.log('   This is normal - page tokens can\'t access app info');
  } else {
    console.log(JSON.stringify(appData, null, 2));
  }

  console.log('\n📋 Quick Guide to Add Testers:\n');
  console.log('You need to add REAL people as Testers, not create test users.\n');
  console.log('Step 1: Go to App Roles');
  console.log('   URL: https://developers.facebook.com/apps/' + appId + '/roles/roles/');
  console.log('\nStep 2: Click "Add Testers"');
  console.log('   (NOT "Test Users" - that\'s different!)');
  console.log('\nStep 3: Enter a Facebook user\'s name or email');
  console.log('   - You can add yourself');
  console.log('   - Or add a friend/colleague');
  console.log('\nStep 4: Have them accept the tester invite');
  console.log('   - They\'ll get a notification on Facebook');
  console.log('   - They need to accept to become a tester');
  console.log('\nStep 5: Try messaging that person on Instagram');
  console.log('   - Once they\'re a tester, you can send them messages');
  console.log('\n' + '='.repeat(60));
  console.log('\n💡 Alternative: Message Yourself!');
  console.log('\nIf you\'re an Admin on the app, you can send messages to');
  console.log('your own Instagram account without adding yourself as a tester.');
  console.log('\n1. Send a message FROM your customer Instagram account TO your');
  console.log('   business Instagram (@test1234567892731)');
  console.log('2. Then try replying from your app');
  console.log('3. As an admin, this should work even in Development Mode');
  console.log('\n' + '='.repeat(60));
  console.log('\n🚀 Or: Request Advanced Access (Skip Testers Entirely)');
  console.log('\nIf you request and get approved for Advanced Access, you can');
  console.log('message ANYONE, not just testers.');
  console.log('\nGo to: https://developers.facebook.com/apps/' + appId + '/app-review/permissions/');
  console.log('Find "pages_messaging" and click "Request Advanced Access"');
}

checkAppCapabilities().catch(console.error);
