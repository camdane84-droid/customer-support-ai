/**
 * Script to update existing Instagram conversations with proper usernames
 * Run with: node scripts/refresh-instagram-names.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function refreshInstagramNames() {
  console.log('🔄 Starting Instagram username refresh...\n');

  try {
    // Fetch all Instagram conversations
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('id, customer_instagram_id, customer_name, business_id')
      .eq('channel', 'instagram')
      .not('customer_instagram_id', 'is', null);

    if (error) {
      console.error('❌ Error fetching conversations:', error);
      return;
    }

    if (!conversations || conversations.length === 0) {
      console.log('ℹ️  No Instagram conversations found');
      return;
    }

    console.log(`📊 Found ${conversations.length} Instagram conversations\n`);

    let updated = 0;
    let failed = 0;
    let skipped = 0;

    for (const convo of conversations) {
      const instagramId = convo.customer_instagram_id;

      // Skip if already has @username format
      if (convo.customer_name.startsWith('@')) {
        console.log(`⏭️  Skipping ${convo.customer_name} (already has username)`);
        skipped++;
        continue;
      }

      try {
        console.log(`🔍 Fetching username for Instagram ID: ${instagramId}`);

        // Fetch username from Instagram Graph API
        const response = await fetch(
          `https://graph.instagram.com/${instagramId}?fields=username&access_token=${process.env.META_ACCESS_TOKEN}`
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.log(`⚠️  Failed to fetch username for ${instagramId}: ${response.status}`);
          console.log(`   Error details:`, JSON.stringify(errorData, null, 2));
          failed++;
          continue;
        }

        const data = await response.json();
        const username = data.username;

        if (!username) {
          console.log(`⚠️  No username found for ${instagramId}`);
          failed++;
          continue;
        }

        // Update conversation with username
        const { error: updateError } = await supabase
          .from('conversations')
          .update({ customer_name: `@${username}` })
          .eq('id', convo.id);

        if (updateError) {
          console.log(`❌ Error updating conversation ${convo.id}:`, updateError);
          failed++;
        } else {
          console.log(`✅ Updated: ${instagramId} → @${username}\n`);
          updated++;
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.log(`❌ Error processing ${instagramId}:`, error.message);
        failed++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   ✅ Updated: ${updated}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   📝 Total: ${conversations.length}`);

  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

refreshInstagramNames();
