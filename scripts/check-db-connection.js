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

async function checkConnection() {
  console.log('🔍 Checking Instagram connection in database...\n');

  const { data, error } = await supabase
    .from('social_connections')
    .select('*')
    .eq('platform', 'instagram');

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  if (!data || data.length === 0) {
    console.log('❌ No Instagram connection found in database');
    console.log('   You need to connect Instagram through your app');
    return;
  }

  console.log(`Found ${data.length} Instagram connection(s):\n`);

  for (const conn of data) {
    console.log('━'.repeat(60));
    console.log(`Platform: ${conn.platform}`);
    console.log(`Username: @${conn.platform_username}`);
    console.log(`Platform User ID: ${conn.platform_user_id}`);
    console.log(`Active: ${conn.is_active}`);
    console.log(`Token Length: ${conn.access_token ? conn.access_token.length : 0} chars`);
    console.log(`Token Preview: ${conn.access_token ? conn.access_token.substring(0, 20) + '...' : 'None'}`);
    console.log(`Metadata:`, JSON.stringify(conn.metadata, null, 2));
    console.log(`Created: ${conn.created_at}`);
    console.log(`Updated: ${conn.updated_at}`);
  }

  console.log('\n' + '━'.repeat(60));
  console.log('\n💡 Token Status:');

  const conn = data[0];
  if (conn.access_token) {
    // Test the token
    console.log('Testing token from database...');
    const response = await fetch(
      `https://graph.facebook.com/v21.0/me?access_token=${conn.access_token}`
    );
    const testData = await response.json();

    if (testData.error) {
      console.log('❌ Token in database is INVALID');
      console.log(`   Error: ${testData.error.message}`);
      console.log('\n   You need to reconnect Instagram to get a fresh token!');
    } else {
      console.log('✅ Token in database is VALID');
      console.log(`   Token belongs to: ${testData.name || testData.id}`);

      // Check permissions
      const permsResponse = await fetch(
        `https://graph.facebook.com/v21.0/me/permissions?access_token=${conn.access_token}`
      );
      const permsData = await permsResponse.json();

      if (permsData.data) {
        console.log('\n📋 Token Permissions:');
        const critical = ['pages_messaging', 'instagram_manage_messages', 'business_management'];
        permsData.data.forEach(perm => {
          if (critical.includes(perm.permission)) {
            const icon = perm.status === 'granted' ? '✅' : '❌';
            console.log(`   ${icon} ${perm.permission}: ${perm.status}`);
          }
        });
      }
    }
  } else {
    console.log('❌ No token stored in database');
  }

  // Compare with env token
  console.log('\n🔄 Comparing with .env.local META_ACCESS_TOKEN:');
  if (env.META_ACCESS_TOKEN) {
    console.log(`   .env token: ${env.META_ACCESS_TOKEN.substring(0, 20)}...`);
    if (conn.access_token === env.META_ACCESS_TOKEN) {
      console.log('   ✅ Database token MATCHES .env token');
    } else {
      console.log('   ⚠️  Database token DIFFERENT from .env token');
      console.log('   The app will use the database token (which is correct)');
    }
  } else {
    console.log('   ❌ No META_ACCESS_TOKEN in .env.local');
  }
}

checkConnection().catch(console.error);
