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

const appId = env.META_APP_ID;
const accessToken = env.META_ACCESS_TOKEN;

async function checkAppStatus() {
  console.log('🔍 Checking Meta App Status...\n');
  console.log('App ID:', appId);
  console.log('');

  // Check app info
  console.log('📱 App Information:');
  const appResponse = await fetch(
    `https://graph.facebook.com/v21.0/${appId}?fields=name,link,category,restrictions&access_token=${accessToken}`
  );
  const appData = await appResponse.json();
  console.log(JSON.stringify(appData, null, 2));
  console.log('');

  // Check permissions status
  console.log('🔑 Your Token Permissions:');
  const permsResponse = await fetch(
    `https://graph.facebook.com/v21.0/me/permissions?access_token=${accessToken}`
  );
  const permsData = await permsResponse.json();

  const critical = ['pages_messaging', 'instagram_manage_messages', 'business_management'];
  console.log('\nCritical Permissions for Messaging:');
  permsData.data.forEach(perm => {
    if (critical.includes(perm.permission)) {
      const icon = perm.status === 'granted' ? '✅' : '❌';
      console.log(`${icon} ${perm.permission}: ${perm.status}`);
    }
  });

  console.log('\n📋 All Permissions:');
  console.log(JSON.stringify(permsData, null, 2));

  console.log('\n💡 Next Steps:');
  if (permsData.data.some(p => p.permission === 'pages_messaging' && p.status === 'declined')) {
    console.log('❌ pages_messaging is DECLINED - You need to re-authorize!');
    console.log('   1. Revoke app at: https://www.facebook.com/settings?tab=business_tools');
    console.log('   2. Re-connect Instagram and ACCEPT all permissions');
  }

  if (permsData.data.every(p => p.permission !== 'pages_messaging' || p.status === 'granted')) {
    console.log('⚠️  Permissions are granted, but you may need Advanced Access');
    console.log('   Go to: https://developers.facebook.com/apps/' + appId + '/app-review/permissions/');
    console.log('   Request Advanced Access for: pages_messaging, instagram_manage_messages');
  }
}

checkAppStatus().catch(console.error);
