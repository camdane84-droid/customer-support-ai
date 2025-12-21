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

const pageId = '61585230171495';
const accessToken = env.META_ACCESS_TOKEN;

async function findInstagramAccount() {
  console.log('🔍 Searching for Instagram Business Account...\n');

  // Try method 1: Direct page query with app token
  console.log('Method 1: Using App Access Token');
  const appToken = `${env.INSTAGRAM_APP_ID}|${env.INSTAGRAM_APP_SECRET}`;

  let response = await fetch(
    `https://graph.facebook.com/v21.0/${pageId}?fields=instagram_business_account{id,username}&access_token=${appToken}`
  );
  let data = await response.json();
  console.log('App token result:', JSON.stringify(data, null, 2));
  console.log('');

  // Try method 2: With user token
  console.log('Method 2: Using User Access Token from .env');
  response = await fetch(
    `https://graph.facebook.com/v21.0/${pageId}?fields=instagram_business_account{id,username}&access_token=${accessToken}`
  );
  data = await response.json();
  console.log('User token result:', JSON.stringify(data, null, 2));
  console.log('');

  // Try method 3: Get page token first, then query
  console.log('Method 3: Try to get page access token');
  response = await fetch(
    `https://graph.facebook.com/v21.0/${pageId}?fields=access_token&access_token=${accessToken}`
  );
  data = await response.json();
  console.log('Page token result:', JSON.stringify(data, null, 2));
}

findInstagramAccount().catch(console.error);
