// Test if the Instagram access token in the database is valid
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testDatabaseToken() {
  console.log('🔍 Testing Instagram access token from database...\n');

  // Get the Instagram connection from database
  const { data: connection, error } = await supabase
    .from('social_connections')
    .select('*')
    .eq('platform', 'instagram')
    .eq('is_active', true)
    .single();

  if (error || !connection) {
    console.error('❌ No active Instagram connection found:', error);
    return;
  }

  console.log(`Found connection: @${connection.platform_username}`);
  console.log(`Platform User ID: ${connection.platform_user_id}\n`);

  // Test the access token
  console.log('Testing access token...');

  try {
    // Test 1: Verify the token is valid
    const meResponse = await fetch(
      `https://graph.facebook.com/v21.0/me?access_token=${connection.access_token}`
    );
    const meData = await meResponse.json();

    if (meData.error) {
      console.log('❌ Token validation failed:', meData.error.message);
      console.log('Error code:', meData.error.code);
      console.log('\n⚠️  YOU NEED A NEW ACCESS TOKEN!\n');
      return false;
    } else {
      console.log('✅ Token is valid!');
      console.log('   Account ID:', meData.id);
      console.log('   Account Name:', meData.name || 'N/A');
    }

    // Test 2: Try to fetch Instagram account info (use Facebook Graph API for Instagram Business)
    console.log('\nTesting Instagram API access...');
    const igResponse = await fetch(
      `https://graph.facebook.com/v21.0/${connection.platform_user_id}?fields=username,name,profile_picture_url&access_token=${connection.access_token}`
    );
    const igData = await igResponse.json();

    if (igData.error) {
      console.log('❌ Instagram API failed:', igData.error.message);
      console.log('\n⚠️  Token may not have Instagram permissions!\n');
      return false;
    } else {
      console.log('✅ Instagram API access works!');
      console.log('   Username:', igData.username);
      console.log('   Name:', igData.name || 'N/A');
    }

    // Test 3: Test fetching a random user (to simulate fetching sender info)
    console.log('\nTesting ability to fetch other users...');
    const testUserId = '17841400008460056'; // Instagram Business Account ID example
    const userResponse = await fetch(
      `https://graph.facebook.com/v21.0/${testUserId}?fields=username&access_token=${connection.access_token}`
    );
    const userData = await userResponse.json();

    if (userData.error) {
      console.log('⚠️  Cannot fetch other users:', userData.error.message);
      console.log('   This is normal - you can only fetch users who message you');
    } else {
      console.log('✅ Can fetch user info:', userData.username);
    }

    console.log('\n✅ DATABASE TOKEN IS VALID AND WORKING!\n');
    console.log('The webhook should work correctly now.');
    return true;

  } catch (error) {
    console.error('❌ Error testing token:', error.message);
    return false;
  }
}

testDatabaseToken()
  .then(valid => {
    if (!valid) {
      console.log('\n📝 TO GET A NEW TOKEN:');
      console.log('   1. Go to your app settings page');
      console.log('   2. Disconnect and reconnect Instagram');
      console.log('   3. This will refresh your access token\n');
    }
  })
  .catch(err => console.error('Fatal error:', err));
