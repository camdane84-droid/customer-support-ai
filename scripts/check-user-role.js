const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUserRole() {
  // Get the most recent user (assuming that's the one who just signed up)
  const { data: users } = await supabase.auth.admin.listUsers();
  const latestUser = users.users[users.users.length - 1];

  console.log('\n=== Latest User ===');
  console.log('Email:', latestUser.email);
  console.log('User ID:', latestUser.id);
  console.log('Created:', latestUser.created_at);

  // Check their business memberships
  const { data: memberships, error } = await supabase
    .from('business_members')
    .select(`
      id,
      role,
      joined_at,
      businesses:business_id (
        id,
        name,
        email
      )
    `)
    .eq('user_id', latestUser.id);

  if (error) {
    console.error('\nError fetching memberships:', error);
    return;
  }

  console.log('\n=== Business Memberships ===');
  if (memberships && memberships.length > 0) {
    memberships.forEach((m, i) => {
      console.log(`\n${i + 1}. Business: ${m.businesses.name}`);
      console.log(`   Business ID: ${m.businesses.id}`);
      console.log(`   Role: ${m.role}`);
      console.log(`   Joined: ${m.joined_at}`);
    });
  } else {
    console.log('No memberships found!');
  }

  // Check if there are any Acme businesses
  const { data: acmeBusinesses } = await supabase
    .from('businesses')
    .select('*')
    .ilike('name', '%acme%');

  console.log('\n=== Acme Businesses ===');
  if (acmeBusinesses && acmeBusinesses.length > 0) {
    acmeBusinesses.forEach((b) => {
      console.log(`\n- ${b.name}`);
      console.log(`  ID: ${b.id}`);
      console.log(`  Email: ${b.email}`);
      console.log(`  Slug: ${b.name_slug}`);
    });
  } else {
    console.log('No Acme businesses found');
  }
}

checkUserRole()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
