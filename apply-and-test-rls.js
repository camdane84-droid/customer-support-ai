// Apply RLS policies and test business access
// Run with: node apply-and-test-rls.js

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = 'https://znxzbykqudabqxbtfgtw.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpueHpieWtxdWRhYnF4YnRmZ3R3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDg4ODgxNywiZXhwIjoyMDgwNDY0ODE3fQ.9kSUVagItFXZNPoJh3tPIy6KyWpX2yRIg-5Ok01KN2k';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpueHpieWtxdWRhYnF4YnRmZ3R3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4ODg4MTcsImV4cCI6MjA4MDQ2NDgxN30.F0Ccc3-9lEWM1jP7lBHzgz9uTJt6Ah2LUPOmmQCvQcA';

const adminClient = createClient(SUPABASE_URL, SERVICE_KEY);

async function applyRLS() {
  console.log('🔧 Applying improved RLS policies...\n');

  const sql = fs.readFileSync('fix_business_rls_v2.sql', 'utf8');

  // Execute the SQL
  const { error } = await adminClient.rpc('exec_sql', { sql_query: sql });

  if (error) {
    console.error('❌ Error applying RLS:', error.message);
    console.log('\n⚠️  The exec_sql function might not exist. You need to apply this SQL manually in Supabase dashboard.');
    console.log('📋 Go to: https://supabase.com/dashboard/project/znxzbykqudabqxbtfgtw/sql/new');
    console.log('\nCopy and paste the contents of fix_business_rls_v2.sql\n');
    return false;
  }

  console.log('✅ RLS policies applied successfully!\n');
  return true;
}

async function testBusinessAccess() {
  console.log('🧪 Testing business access...\n');

  // Test 1: Service role should see all businesses
  console.log('Test 1: Service role access (should see all businesses)');
  const { data: allBusinesses } = await adminClient
    .from('businesses')
    .select('*');

  console.log(`✅ Service role sees ${allBusinesses?.length || 0} businesses\n`);

  // Test 2: Try to authenticate and fetch business
  console.log('Test 2: User authentication test');
  console.log('Enter credentials for one of these users:');
  console.log('  - cdallessandro@hotmail.com');
  console.log('  - cdallessandro1@hotmail.com');
  console.log('  - testes3@gmail.com\n');

  const testEmail = 'cdallessandro@hotmail.com';
  const testPassword = 'test123'; // You'll need to know the password

  const clientSupabase = createClient(SUPABASE_URL, ANON_KEY);

  console.log(`Attempting to sign in as ${testEmail}...`);

  const { data: authData, error: authError } = await clientSupabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });

  if (authError) {
    console.log(`⚠️  Could not sign in (wrong password?): ${authError.message}`);
    console.log('This is OK - just showing you how to test.\n');
    return;
  }

  console.log('✅ Signed in successfully!\n');

  // Test 3: Fetch business for authenticated user
  console.log('Test 3: Fetching business for authenticated user');
  const { data: userBusiness, error: bizError } = await clientSupabase
    .from('businesses')
    .select('*')
    .eq('email', testEmail)
    .maybeSingle();

  if (bizError) {
    console.error(`❌ Error fetching business: ${bizError.message}`);
  } else if (userBusiness) {
    console.log(`✅ Found business: ${userBusiness.name}`);
  } else {
    console.log('⚠️  No business found for this user');
  }

  await clientSupabase.auth.signOut();
}

async function main() {
  const rlsApplied = await applyRLS();

  if (!rlsApplied) {
    console.log('\n📝 Manual steps required:');
    console.log('1. Go to Supabase SQL Editor');
    console.log('2. Copy contents of fix_business_rls_v2.sql');
    console.log('3. Run the SQL');
    console.log('4. Come back and sign in again\n');
  }

  await testBusinessAccess();
}

main();
