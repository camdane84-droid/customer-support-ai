// Debug script to check business and user state
// Run with: node check-business.js

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://znxzbykqudabqxbtfgtw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpueHpieWtxdWRhYnF4YnRmZ3R3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDg4ODgxNywiZXhwIjoyMDgwNDY0ODE3fQ.9kSUVagItFXZNPoJh3tPIy6KyWpX2yRIg-5Ok01KN2k'
);

async function checkBusinessState() {
  console.log('🔍 Checking business state...\n');

  // Check all businesses (using service role, bypasses RLS)
  const { data: businesses, error } = await supabase
    .from('businesses')
    .select('*');

  if (error) {
    console.error('❌ Error fetching businesses:', error);
    return;
  }

  console.log(`📊 Total businesses in database: ${businesses?.length || 0}\n`);

  if (businesses && businesses.length > 0) {
    console.log('Businesses found:');
    businesses.forEach((biz, i) => {
      console.log(`\n${i + 1}. ${biz.name}`);
      console.log(`   ID: ${biz.id}`);
      console.log(`   Email: ${biz.email}`);
      console.log(`   Created: ${biz.created_at}`);
    });
  } else {
    console.log('⚠️ No businesses found in database!');
    console.log('\nYou need to sign up to create a business.');
  }

  // Check auth users
  console.log('\n\n🔐 Checking auth users...');
  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();

  if (usersError) {
    console.error('❌ Error fetching users:', usersError);
    return;
  }

  console.log(`👥 Total users: ${users?.length || 0}\n`);

  if (users && users.length > 0) {
    console.log('Users found:');
    users.forEach((user, i) => {
      console.log(`\n${i + 1}. ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Created: ${user.created_at}`);
      console.log(`   Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`);
    });
  }
}

checkBusinessState();
