const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkLatestInvite() {
  const { data: invites } = await supabase
    .from('team_invitations')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1);

  if (invites && invites.length > 0) {
    const invite = invites[0];
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${invite.token}`;

    console.log('Latest invitation:');
    console.log('- Email:', invite.email);
    console.log('- Token:', invite.token);
    console.log('- Invite URL:', inviteUrl);
    console.log('\nNEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL);
  } else {
    console.log('No pending invitations found');
  }
}

checkLatestInvite().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
