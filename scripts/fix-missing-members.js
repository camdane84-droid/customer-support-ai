const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixMissingMembers() {
  console.log('Finding businesses without members...\n');

  // Get all businesses
  const { data: businesses } = await supabase
    .from('businesses')
    .select('*')
    .not('user_id', 'is', null);

  console.log('Total businesses with user_id:', businesses?.length);

  // Check each business for members
  for (const biz of businesses || []) {
    const { data: members } = await supabase
      .from('business_members')
      .select('*')
      .eq('business_id', biz.id);

    if (!members || members.length === 0) {
      console.log(`\n❌ Business "${biz.name}" has NO members!`);
      console.log(`   Business ID: ${biz.id}`);
      console.log(`   User ID: ${biz.user_id}`);
      console.log(`   Creating member record...`);

      // Add the user as owner
      const { data: newMember, error } = await supabase
        .from('business_members')
        .insert({
          business_id: biz.id,
          user_id: biz.user_id,
          role: 'owner',
          joined_at: biz.created_at,
        })
        .select()
        .single();

      if (error) {
        console.log(`   ❌ Error:`, error.message);
      } else {
        console.log(`   ✅ Created member record`);
      }
    } else {
      console.log(`✅ Business "${biz.name}" has ${members.length} member(s)`);
    }
  }
}

fixMissingMembers().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
