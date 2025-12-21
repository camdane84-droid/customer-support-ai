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

async function checkAccess() {
  console.log('🔍 Checking what this token can access...\n');

  // Check me/accounts
  console.log('1. Checking me/accounts:');
  let response = await fetch(
    `https://graph.facebook.com/v21.0/me/accounts?access_token=${accessToken}`
  );
  let data = await response.json();
  console.log(JSON.stringify(data, null, 2));
  console.log('');

  // Check me info
  console.log('2. Checking me?fields=id,name:');
  response = await fetch(
    `https://graph.facebook.com/v21.0/me?fields=id,name&access_token=${accessToken}`
  );
  data = await response.json();
  console.log(JSON.stringify(data, null, 2));
  console.log('');

  // Check permissions
  console.log('3. Checking token permissions:');
  response = await fetch(
    `https://graph.facebook.com/v21.0/me/permissions?access_token=${accessToken}`
  );
  data = await response.json();
  console.log(JSON.stringify(data, null, 2));
}

checkAccess().catch(console.error);
