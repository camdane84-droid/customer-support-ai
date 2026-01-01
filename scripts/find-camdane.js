require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  try {
    console.log('🔍 Searching for all team members (non-owners)...\n');

    // Get all business members
    const { data: allMembers } = await supabase
      .from('business_members')
      .select('id, user_id, role, joined_at, business_id')
      .order('joined_at', { ascending: false });

    if (!allMembers || allMembers.length === 0) {
      console.log('No members found');
      return;
    }

    // Group by business
    const membersByBusiness = {};
    for (const member of allMembers) {
      if (!membersByBusiness[member.business_id]) {
        membersByBusiness[member.business_id] = [];
      }
      membersByBusiness[member.business_id].push(member);
    }

    // Check each business
    for (const [businessId, members] of Object.entries(membersByBusiness)) {
      const { data: business } = await supabase
        .from('businesses')
        .select('name, email')
        .eq('id', businessId)
        .single();

      if (members.length > 1 || members.some(m => m.role !== 'owner')) {
        console.log(`\n📦 ${business?.name || 'Unknown'} (${business?.email || businessId}):`);
        console.log(`   Members: ${members.length}`);

        for (const member of members) {
          const { data: { user } } = await supabase.auth.admin.getUserById(member.user_id);
          const isRecent = new Date(member.joined_at) > new Date(Date.now() - 3600000); // last hour
          const marker = isRecent ? '🆕' : '  ';
          console.log(`   ${marker} ${user?.email || 'unknown'} - ${member.role} (${new Date(member.joined_at).toLocaleString()})`);
        }
      }
    }

    // Also check recent invitations
    console.log('\n\n📨 Recent Invitations:\n');
    const { data: invitations } = await supabase
      .from('team_invitations')
      .select('email, role, status, created_at, business_id')
      .order('created_at', { ascending: false })
      .limit(10);

    for (const inv of invitations || []) {
      const { data: business } = await supabase
        .from('businesses')
        .select('name')
        .eq('id', inv.business_id)
        .single();

      console.log(`  ${inv.email} → ${business?.name} - ${inv.status} (${inv.role})`);
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
})();
