const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkBusinessMembers() {
  console.log('Checking business_members table...\n');

  const { data: members, error: membersError } = await supabase
    .from('business_members')
    .select('*, businesses(name)');

  if (membersError) {
    console.error('Error fetching business_members:', membersError);
  } else {
    console.log('Business Members:', members?.length || 0);
    members?.forEach(m => {
      console.log(`- User: ${m.user_id.substring(0, 8)}..., Business: ${m.businesses?.name}, Role: ${m.role}`);
    });
  }

  console.log('\nChecking businesses table...\n');

  const { data: businesses, error: bizError } = await supabase
    .from('businesses')
    .select('id, name, email');

  if (bizError) {
    console.error('Error fetching businesses:', bizError);
  } else {
    console.log('Businesses:', businesses?.length || 0);
    businesses?.forEach(b => {
      console.log(`- ${b.name} (${b.email})`);
    });
  }

  console.log('\nChecking users...\n');

  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();

  if (usersError) {
    console.error('Error fetching users:', usersError);
  } else {
    console.log('Users:', users?.length || 0);
    users?.forEach(u => {
      console.log(`- ${u.email} (${u.id.substring(0, 8)}...)`);
    });
  }
}

checkBusinessMembers().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
