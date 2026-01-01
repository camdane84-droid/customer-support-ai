const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addUniqueIndex() {
  try {
    console.log('Adding unique index for Instagram message IDs...');

    // Create a unique partial index on metadata->>'instagram_message_id'
    // Only applies to rows where instagram_message_id is not null
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE UNIQUE INDEX IF NOT EXISTS idx_messages_instagram_message_id
        ON messages ((metadata->>'instagram_message_id'))
        WHERE metadata->>'instagram_message_id' IS NOT NULL;
      `
    });

    if (error) {
      // Try alternative method using direct SQL execution
      console.log('RPC method not available, trying direct query...');

      // Use the Supabase REST API to execute raw SQL
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
          },
          body: JSON.stringify({
            sql: `
              CREATE UNIQUE INDEX IF NOT EXISTS idx_messages_instagram_message_id
              ON messages ((metadata->>'instagram_message_id'))
              WHERE metadata->>'instagram_message_id' IS NOT NULL;
            `
          })
        }
      );

      if (!response.ok) {
        console.error('Failed to create index via REST API');
        console.log('\n📝 Please run this SQL manually in your Supabase SQL editor:');
        console.log('\n' + '-'.repeat(70));
        console.log(`
CREATE UNIQUE INDEX IF NOT EXISTS idx_messages_instagram_message_id
ON messages ((metadata->>'instagram_message_id'))
WHERE metadata->>'instagram_message_id' IS NOT NULL;
        `);
        console.log('-'.repeat(70));
        return;
      }
    }

    console.log('✅ Unique index created successfully!');
    console.log('   This will prevent duplicate Instagram messages from being inserted.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n📝 Please run this SQL manually in your Supabase SQL editor:');
    console.log('\n' + '-'.repeat(70));
    console.log(`
CREATE UNIQUE INDEX IF NOT EXISTS idx_messages_instagram_message_id
ON messages ((metadata->>'instagram_message_id'))
WHERE metadata->>'instagram_message_id' IS NOT NULL;
    `);
    console.log('-'.repeat(70));
  }
}

addUniqueIndex();
