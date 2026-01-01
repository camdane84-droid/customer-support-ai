require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  try {
    const camdaneUserId = '825bc99f-2a49-484b-962b-22a6e670436d';
    const businessId = '97f8fc5d-bb5d-4314-9424-f28407265805';

    console.log('🔧 Manually adding camdane84@gmail.com to business...');

    // Check if they already exist (shouldn't, but let's be safe)
    const { data: existing } = await supabase
      .from('business_members')
      .select('*')
      .eq('business_id', businessId)
      .eq('user_id', camdaneUserId)
      .single();

    if (existing) {
      console.log('✅ Member record already exists!');
      return;
    }

    // Get the most recent accepted invitation to get the role
    const { data: invitation } = await supabase
      .from('team_invitations')
      .select('*')
      .eq('email', 'camdane84@gmail.com')
      .eq('business_id', businessId)
      .eq('status', 'accepted')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const role = invitation?.role || 'admin';
    const invitedBy = invitation?.invited_by;

    console.log(`Adding as: ${role}`);

    // Create the member record
    const { data: newMember, error } = await supabase
      .from('business_members')
      .insert({
        business_id: businessId,
        user_id: camdaneUserId,
        role: role,
        invited_by: invitedBy
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    console.log('✅ Successfully added member!');
    console.log('Member details:', newMember);

  } catch (error) {
    console.error('Error:', error.message);
  }
})();
