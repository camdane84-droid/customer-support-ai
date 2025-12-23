const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugBusinessData() {
  console.log('🔍 Checking business data...\n');

  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.error('❌ Error getting user:', userError.message);
      return;
    }

    if (!user) {
      console.log('❌ No authenticated user found');
      return;
    }

    console.log('✅ User found:', user.email);
    console.log('   User ID:', user.id);

    // Check for business
    const { data: businesses, error: bizError } = await supabase
      .from('businesses')
      .select('*')
      .eq('email', user.email);

    if (bizError) {
      console.error('❌ Error fetching businesses:', bizError.message);
      console.error('   Error details:', bizError);
      return;
    }

    if (!businesses || businesses.length === 0) {
      console.log('\n⚠️  No business found for email:', user.email);
      console.log('   Creating business now...');

      const { data: newBiz, error: createError } = await supabase
        .from('businesses')
        .insert({
          email: user.email,
          name: `${user.email.split('@')[0]}'s Business`,
          auto_generate_notes: false
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Error creating business:', createError.message);
        return;
      }

      console.log('✅ Business created successfully!');
      console.log('   ID:', newBiz.id);
      console.log('   Name:', newBiz.name);
      console.log('   Auto-generate notes:', newBiz.auto_generate_notes);
    } else {
      console.log('\n✅ Business found!');
      console.log('   ID:', businesses[0].id);
      console.log('   Name:', businesses[0].name);
      console.log('   Email:', businesses[0].email);
      console.log('   Auto-generate notes:', businesses[0].auto_generate_notes);

      if (businesses.length > 1) {
        console.log('\n⚠️  WARNING: Multiple businesses found for this email:', businesses.length);
      }
    }

  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
    console.error(err);
  }
}

debugBusinessData();
