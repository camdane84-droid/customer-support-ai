const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debug() {
  const businessId = '97f8fc5d-bb5d-4314-9424-f28407265805';

  console.log('Checking business:', businessId);

  const { data: business } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', businessId)
    .single();

  console.log('Business:', business);

  const { data: members, error: membersError } = await supabase
    .from('business_members')
    .select('*')
    .eq('business_id', businessId);

  if (membersError) {
    console.error('Error fetching members:', membersError);
  }

  console.log('\nMembers of this business:');
  members?.forEach(m => {
    console.log(`- User ID: ${m.user_id}, Role: ${m.role}`);
  });

  // Get the user's email from auth
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const user = users.find(u => members?.some(m => m.user_id === u.id));
  if (user) {
    console.log('\nUser email:', user.email);
  }
}

debug().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
