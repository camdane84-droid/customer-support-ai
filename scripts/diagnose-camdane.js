require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  try {
    // Find camdane user
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const camdaneUser = users.find(u => u.email?.includes('camdane'));

    if (!camdaneUser) {
      console.log('❌ No user found with email containing "camdane"');
      return;
    }

    console.log('✅ Found user:', camdaneUser.email, 'ID:', camdaneUser.id);

    // Check if they have any business_members records
    const { data: members, error: memberError } = await supabase
      .from('business_members')
      .select('*, businesses(name)')
      .eq('user_id', camdaneUser.id);

    console.log('\n📋 Business memberships for', camdaneUser.email + ':');
    if (members && members.length > 0) {
      members.forEach(m => {
        console.log(`  ✓ ${m.businesses?.name} - ${m.role} (joined: ${new Date(m.joined_at).toLocaleString()})`);
      });
    } else {
      console.log('  ❌ NO MEMBERSHIPS FOUND');
      if (memberError) console.log('  Error:', memberError.message);
    }

    // Check their accepted invitations
    const { data: acceptedInvites } = await supabase
      .from('team_invitations')
      .select('*, businesses(name, id)')
      .eq('email', camdaneUser.email)
      .eq('status', 'accepted');

    console.log('\n📨 Accepted invitations:');
    if (acceptedInvites && acceptedInvites.length > 0) {
      for (const inv of acceptedInvites) {
        console.log(`  ✓ ${inv.businesses?.name} (${inv.role}) - accepted at ${new Date(inv.created_at).toLocaleString()}`);
        console.log(`    Business ID: ${inv.business_id}`);

        // Check if member record exists for this business
        const { data: memberCheck } = await supabase
          .from('business_members')
          .select('*')
          .eq('business_id', inv.business_id)
          .eq('user_id', camdaneUser.id)
          .single();

        if (memberCheck) {
          console.log(`    ✅ Member record EXISTS`);
        } else {
          console.log(`    ❌ Member record MISSING - This is the bug!`);
        }
      }
    } else {
      console.log('  (none)');
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
})();
