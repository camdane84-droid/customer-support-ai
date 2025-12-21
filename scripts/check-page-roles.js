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

async function checkPageRoles() {
  console.log('🔍 Checking your Facebook Pages and roles...\n');

  try {
    // Get user's pages
    const response = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token,tasks,instagram_business_account&access_token=${accessToken}`
    );

    const data = await response.json();

    if (data.error) {
      console.error('❌ Error:', data.error.message);
      console.log('\n💡 Your token is invalid. You need to re-authorize!');
      return;
    }

    if (!data.data || data.data.length === 0) {
      console.log('❌ No Facebook Pages found!');
      console.log('\n💡 You need to:');
      console.log('   1. Create a Facebook Page (or get admin access to one)');
      console.log('   2. Connect your Instagram Business account to that Page');
      console.log('   3. Then re-authorize the app');
      return;
    }

    console.log(`✅ Found ${data.data.length} Facebook Page(s):\n`);

    for (const page of data.data) {
      console.log('━'.repeat(60));
      console.log(`📄 Page: ${page.name}`);
      console.log(`   ID: ${page.id}`);

      // Check roles/tasks
      if (page.tasks && page.tasks.length > 0) {
        console.log(`   📋 Your roles: ${page.tasks.join(', ')}`);

        const isAdmin = page.tasks.includes('ADMIN') || page.tasks.includes('MANAGE');
        if (isAdmin) {
          console.log('   ✅ You are an ADMIN on this page!');
        } else {
          console.log('   ⚠️  You have limited permissions (not admin)');
        }
      } else {
        console.log('   ⚠️  No role information available');
      }

      // Check Instagram connection
      if (page.instagram_business_account) {
        console.log(`   📸 Instagram Business Account: ${page.instagram_business_account.id}`);

        // Get more details about the IG account
        const igResponse = await fetch(
          `https://graph.facebook.com/v21.0/${page.instagram_business_account.id}?fields=username,id,profile_picture_url&access_token=${page.access_token}`
        );
        const igData = await igResponse.json();

        if (igData.username) {
          console.log(`   📸 Instagram Username: @${igData.username}`);
        }
      } else {
        console.log('   ❌ No Instagram Business Account connected to this page');
      }

      console.log('');
    }

    console.log('━'.repeat(60));
    console.log('\n💡 Summary:');

    const pagesWithIG = data.data.filter(p => p.instagram_business_account);
    const adminPages = data.data.filter(p =>
      p.tasks && (p.tasks.includes('ADMIN') || p.tasks.includes('MANAGE'))
    );
    const adminPagesWithIG = data.data.filter(p =>
      p.instagram_business_account &&
      p.tasks &&
      (p.tasks.includes('ADMIN') || p.tasks.includes('MANAGE'))
    );

    if (adminPagesWithIG.length > 0) {
      console.log('✅ You have admin access to page(s) with Instagram connected!');
      console.log('✅ You should be able to use Instagram messaging.');
    } else if (pagesWithIG.length > 0 && adminPages.length === 0) {
      console.log('⚠️  You have pages with Instagram, but you\'re not an admin.');
      console.log('   Ask the page owner to make you an admin.');
    } else if (pagesWithIG.length === 0) {
      console.log('❌ None of your pages have Instagram Business connected.');
      console.log('\n📝 To fix this:');
      console.log('   1. Go to your Facebook Page settings');
      console.log('   2. Go to Instagram > Connect Account');
      console.log('   3. Connect your Instagram Business account');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkPageRoles().catch(console.error);
