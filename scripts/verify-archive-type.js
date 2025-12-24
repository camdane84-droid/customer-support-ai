// Script to verify archive_type column and data
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verify() {
  console.log('🔍 Verifying archive_type setup...\n');

  try {
    // Test 1: Check if column exists by trying to select it
    console.log('📝 Test 1: Checking if archive_type column exists...');
    const { data: testData, error: testError } = await supabase
      .from('conversations')
      .select('id, status, archive_type')
      .limit(1);

    if (testError) {
      console.error('❌ Column does NOT exist!');
      console.error('   Error:', testError.message);
      console.log('\n⚠️  You need to run the SQL migration in Supabase SQL Editor');
      console.log('   File: migrations/add_archive_type.sql');
      return;
    }

    console.log('✅ Column exists!\n');

    // Test 2: Check archived conversations
    console.log('📝 Test 2: Checking archived conversations...');
    const { data: archived, error: archivedError } = await supabase
      .from('conversations')
      .select('id, customer_name, status, archive_type, updated_at')
      .eq('status', 'archived')
      .order('updated_at', { ascending: false });

    if (archivedError) {
      console.error('❌ Error fetching archived conversations:', archivedError.message);
      return;
    }

    console.log(`   Found ${archived.length} archived conversations:\n`);

    // Group by archive_type
    const archivedType = archived.filter(c => (c.archive_type || 'archived') === 'archived');
    const resolvedType = archived.filter(c => c.archive_type === 'resolved');

    console.log(`   📁 Archived: ${archivedType.length} conversations`);
    if (archivedType.length > 0) {
      archivedType.slice(0, 3).forEach(c => {
        console.log(`      - ${c.customer_name} (archive_type: ${c.archive_type || 'NULL'})`);
      });
    }

    console.log(`\n   ✅ Resolved: ${resolvedType.length} conversations`);
    if (resolvedType.length > 0) {
      resolvedType.slice(0, 3).forEach(c => {
        console.log(`      - ${c.customer_name} (archive_type: ${c.archive_type})`);
      });
    }

    // Test 3: Look for Sarah Johnson specifically
    console.log('\n📝 Test 3: Looking for Sarah Johnson...');
    const { data: sarah, error: sarahError } = await supabase
      .from('conversations')
      .select('id, customer_name, status, archive_type, updated_at')
      .ilike('customer_name', '%sarah%johnson%')
      .maybeSingle();

    if (sarahError) {
      console.log('   ⚠️  Sarah Johnson conversation not found');
    } else {
      console.log('   Found Sarah Johnson:');
      console.log(`      Status: ${sarah.status}`);
      console.log(`      Archive Type: ${sarah.archive_type || 'NULL'}`);
      console.log(`      Updated At: ${sarah.updated_at || 'NULL'}`);

      if (sarah.status === 'archived' && sarah.archive_type !== 'resolved') {
        console.log('\n   🔧 Issue found: Sarah should be resolved but is archived');
        console.log('   💡 Fixing now...');

        const { error: updateError } = await supabase
          .from('conversations')
          .update({ archive_type: 'resolved' })
          .eq('id', sarah.id);

        if (updateError) {
          console.error('   ❌ Failed to update:', updateError.message);
        } else {
          console.log('   ✅ Updated Sarah Johnson to archive_type="resolved"');
        }
      } else if (sarah.archive_type === 'resolved') {
        console.log('   ✅ Sarah is correctly marked as resolved!');
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   Total archived: ${archived.length}`);
    console.log(`   Type "archived": ${archivedType.length}`);
    console.log(`   Type "resolved": ${resolvedType.length}`);
    console.log(`   Missing type (NULL): ${archived.filter(c => !c.archive_type).length}`);

    if (archived.filter(c => !c.archive_type).length > 0) {
      console.log('\n💡 Tip: Some conversations have NULL archive_type.');
      console.log('   They will default to "archived" category in the UI.');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

verify();
