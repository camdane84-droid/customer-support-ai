// Script to add archive_type column to conversations table
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('🚀 Applying archive_type migration...\n');

  try {
    // Step 1: Add the archive_type column
    console.log('📝 Step 1: Adding archive_type column...');
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE conversations ADD COLUMN IF NOT EXISTS archive_type TEXT DEFAULT 'archived';`
    });

    if (alterError && !alterError.message.includes('already exists')) {
      // Try alternative method using raw SQL
      const { error: rawError } = await supabase
        .from('conversations')
        .select('archive_type')
        .limit(1);

      if (rawError && rawError.message.includes('column') && rawError.message.includes('does not exist')) {
        console.log('⚠️  Column does not exist. You need to run this SQL in Supabase SQL Editor:');
        console.log('\n--- Copy the SQL below ---\n');
        const migrationSQL = fs.readFileSync(
          path.join(__dirname, '..', 'migrations', 'add_archive_type.sql'),
          'utf8'
        );
        console.log(migrationSQL);
        console.log('\n--- End of SQL ---\n');
        console.log('📋 Instructions:');
        console.log('1. Go to your Supabase Dashboard');
        console.log('2. Click on "SQL Editor" in the left sidebar');
        console.log('3. Click "New Query"');
        console.log('4. Paste the SQL above');
        console.log('5. Click "Run"');
        console.log('\n✅ After running, try resolving a conversation again!');
        return;
      }
    }

    console.log('✅ Column added successfully (or already exists)\n');

    // Step 2: Update existing archived conversations
    console.log('📝 Step 2: Updating existing archived conversations...');
    const { data: archivedConvos, error: selectError } = await supabase
      .from('conversations')
      .select('id, archive_type')
      .eq('status', 'archived');

    if (selectError) {
      console.error('❌ Error fetching archived conversations:', selectError.message);
      return;
    }

    const needsUpdate = archivedConvos.filter(c => !c.archive_type);

    if (needsUpdate.length > 0) {
      console.log(`   Found ${needsUpdate.length} conversations to update...`);

      const { error: updateError } = await supabase
        .from('conversations')
        .update({ archive_type: 'archived' })
        .eq('status', 'archived')
        .is('archive_type', null);

      if (updateError) {
        console.error('❌ Error updating conversations:', updateError.message);
        return;
      }

      console.log(`✅ Updated ${needsUpdate.length} conversations to archive_type='archived'\n`);
    } else {
      console.log('✅ No conversations need updating\n');
    }

    console.log('🎉 Migration completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('   1. Try resolving a conversation');
    console.log('   2. Go to Archives page');
    console.log('   3. You should see separate "Archived" and "Resolved" categories');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    console.log('\n⚠️  If the migration failed, please run the SQL manually:');
    console.log('   See: migrations/add_archive_type.sql');
  }
}

applyMigration();
