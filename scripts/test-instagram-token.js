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

const accessToken = env.META_ACCESS_TOKEN;

async function testToken() {
  console.log('🔍 Testing Instagram access token...\n');

  // Test 1: Get token info
  console.log('📋 Getting token info...');
  const debugResponse = await fetch(
    `https://graph.facebook.com/v21.0/debug_token?input_token=${accessToken}&access_token=${accessToken}`
  );
  const debugData = await debugResponse.json();
  console.log('Token info:', JSON.stringify(debugData, null, 2));
  console.log('');

  // Test 2: Get user info
  console.log('👤 Getting user accounts...');
  const meResponse = await fetch(
    `https://graph.facebook.com/v21.0/me?fields=id,name,accounts{id,name,instagram_business_account{id,username}}&access_token=${accessToken}`
  );
  const meData = await meResponse.json();
  console.log('User data:', JSON.stringify(meData, null, 2));
  console.log('');

  // Test 3: Try to get Instagram Business Account directly
  console.log('📸 Looking for Instagram Business Account...');
  if (meData.accounts && meData.accounts.data) {
    for (const account of meData.accounts.data) {
      if (account.instagram_business_account) {
        console.log('✅ Found Instagram Business Account!');
        console.log('   Page ID:', account.id);
        console.log('   Page Name:', account.name);
        console.log('   IGBA ID:', account.instagram_business_account.id);
        console.log('   Username:', account.instagram_business_account.username);
        console.log('');
        console.log('👉 Update your database with this IGBA ID:', account.instagram_business_account.id);
      }
    }
  }
}

testToken().catch(console.error);
