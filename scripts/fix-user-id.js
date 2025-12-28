// Fix user_id for legacy business account
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixUserId() {
  // Update the business record to set the correct user_id
  const { data, error } = await supabase
    .from('businesses')
    .update({ user_id: '6f3a4648-615c-484b-b236-a2b19f8818c6' })
    .eq('id', '2874da27-a9ea-46d0-9416-ed85f9e8af4d')
    .select();

  if (error) {
    console.error('Error updating business:', error);
    process.exit(1);
  }

  console.log('✅ Successfully updated business user_id:');
  console.log(data);
}

fixUserId();
