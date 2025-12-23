const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addAutoNotesColumn() {
  console.log('🔧 Adding auto_generate_notes column to businesses table...');

  try {
    // Execute the SQL to add the column
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE businesses
        ADD COLUMN IF NOT EXISTS auto_generate_notes BOOLEAN DEFAULT FALSE;
      `
    });

    if (error) {
      console.error('❌ Error:', error);
      console.log('\n📝 Please run this SQL manually in Supabase Dashboard:');
      console.log('ALTER TABLE businesses ADD COLUMN IF NOT EXISTS auto_generate_notes BOOLEAN DEFAULT FALSE;');
      return;
    }

    console.log('✅ Column added successfully!');
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.log('\n📝 Please run this SQL manually in Supabase Dashboard:');
    console.log('ALTER TABLE businesses ADD COLUMN IF NOT EXISTS auto_generate_notes BOOLEAN DEFAULT FALSE;');
  }
}

addAutoNotesColumn();
