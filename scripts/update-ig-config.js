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

async function updateInstagramConfig() {
  console.log('🔄 Updating Instagram configuration in database...');
  console.log('Platform User ID: 17841479646382077');
  console.log('Access Token:', env.META_ACCESS_TOKEN.substring(0, 20) + '...');

  const { data, error } = await supabase
    .from('social_connections')
    .update({
      platform_user_id: '17841479646382077',
      access_token: env.META_ACCESS_TOKEN,
      updated_at: new Date().toISOString()
    })
    .eq('platform', 'instagram')
    .select();

  if (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }

  console.log('✅ Updated successfully!');
  console.log('Updated connection:', JSON.stringify(data, null, 2));
}

updateInstagramConfig();
