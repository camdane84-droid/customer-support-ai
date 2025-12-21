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

async function updateInstagramToken() {
  const accessToken = env.META_ACCESS_TOKEN;

  if (!accessToken) {
    console.error('❌ META_ACCESS_TOKEN not found in .env.local');
    process.exit(1);
  }

  console.log('🔄 Updating Instagram access token in database...');
  console.log('Token:', accessToken.substring(0, 20) + '...');

  // Update all Instagram connections with the new access token
  const { data, error } = await supabase
    .from('social_connections')
    .update({ access_token: accessToken })
    .eq('platform', 'instagram')
    .select();

  if (error) {
    console.error('❌ Error updating token:', error);
    process.exit(1);
  }

  console.log('✅ Updated', data?.length || 0, 'Instagram connection(s)');
  console.log('Updated connections:', data);
}

updateInstagramToken();
