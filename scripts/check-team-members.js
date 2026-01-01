require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  try {
    // Get all businesses
    const { data: businesses } = await supabase
      .from('businesses')
      .select('id, name, email')
      .order('created_at', { ascending: false })
      .limit(5);

    console.log('📋 Recent Businesses:');
    businesses?.forEach(b => console.log(`  - ${b.name} (${b.email})`));

    if (businesses && businesses.length > 0) {
      console.log('\n👥 Checking members for each business:\n');

      for (const business of businesses) {
        const { data: members } = await supabase
          .from('business_members')
          .select('id, user_id, role, joined_at')
          .eq('business_id', business.id)
          .order('joined_at', { ascending: true });

        console.log(`${business.name}:`);
        if (members && members.length > 0) {
          for (const member of members) {
            const { data: { user } } = await supabase.auth.admin.getUserById(member.user_id);
            console.log(`  ✓ ${user?.email} - ${member.role} (joined: ${new Date(member.joined_at).toLocaleString()})`);
          }
        } else {
          console.log('  (no members)');
        }
        console.log('');
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
