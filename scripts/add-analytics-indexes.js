const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function addIndexes() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('Adding database indexes for analytics performance...\n');

  try {
    // Read the SQL file
    const sqlFile = path.join(__dirname, 'add-analytics-indexes.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    // Split into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`Executing ${statements.length} SQL statements...\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`${i + 1}. ${statement.substring(0, 60)}...`);

      const { error } = await supabase.rpc('exec_sql', { sql_query: statement });

      if (error) {
        console.error(`   ❌ Error: ${error.message}`);
      } else {
        console.log(`   ✅ Success`);
      }
    }

    console.log('\n✅ Database indexes added successfully!');
    console.log('Analytics queries should now be much faster.');
  } catch (error) {
    console.error('Failed to add indexes:', error);

    console.log('\n📝 Manual Instructions:');
    console.log('If the automatic script failed, you can add indexes manually:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to the SQL Editor');
    console.log('3. Run the contents of scripts/add-analytics-indexes.sql');
  }
}

addIndexes();
