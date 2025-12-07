// Script to apply RLS policies to businesses table
// Run with: node apply-rls-fix.js

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  'https://znxzbykqudabqxbtfgtw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpueHpieWtxdWRhYnF4YnRmZ3R3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDg4ODgxNywiZXhwIjoyMDgwNDY0ODE3fQ.9kSUVagItFXZNPoJh3tPIy6KyWpX2yRIg-5Ok01KN2k'
);

async function applyRLS() {
  console.log('🔧 Applying RLS policies...\n');

  const sql = fs.readFileSync('fix_business_rls.sql', 'utf8');

  // Split by semicolons and execute each statement
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (const statement of statements) {
    console.log(`Executing: ${statement.substring(0, 50)}...`);

    try {
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement });

      if (error) {
        console.error(`❌ Error: ${error.message}`);
      } else {
        console.log('✅ Success\n');
      }
    } catch (err) {
      console.error(`❌ Error: ${err.message}\n`);
    }
  }

  console.log('\n✅ RLS policies applied!');
  console.log('\nNow testing business access...\n');

  // Test with a real user (using anon key to simulate client-side access)
  const clientSupabase = createClient(
    'https://znxzbykqudabqxbtfgtw.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpueHpieWtxdWRhYnF4YnRmZ3R3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4ODg4MTcsImV4cCI6MjA4MDQ2NDgxN30.F0Ccc3-9lEWM1jP7lBHzgz9uTJt6Ah2LUPOmmQCvQcA'
  );

  // Try to fetch all businesses without auth (should fail or return empty)
  const { data: anonData } = await clientSupabase
    .from('businesses')
    .select('*');

  console.log(`Anonymous access returned ${anonData?.length || 0} businesses (should be 0 or null)`);
}

applyRLS();
