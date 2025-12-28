require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkConstraints() {
  // Try to get table info using a query
  const { data, error } = await supabase
    .from('social_connections')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error querying table:', error);
    return;
  }

  console.log('\nNote: To see table constraints, you need to check Supabase Dashboard:');
  console.log('1. Go to https://supabase.com/dashboard');
  console.log('2. Select your project');
  console.log('3. Go to Database → Tables');
  console.log('4. Click on "social_connections" table');
  console.log('5. Check the "Constraints" section');
  console.log('\nLook for any UNIQUE constraints that might prevent the same Instagram');
  console.log('account from being connected to multiple businesses.\n');
}

checkConstraints();
