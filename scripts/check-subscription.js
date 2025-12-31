const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSubscription() {
  // Get your business
  const { data: business, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('email', 'cdallessandro@hotmail.com')
    .single();

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('\n=== Your Business Subscription ===');
  console.log('Business Name:', business.name);
  console.log('Email:', business.email);
  console.log('Subscription Tier:', business.subscription_tier);
  console.log('Stripe Customer ID:', business.stripe_customer_id);
  console.log('Created:', business.created_at);
}

checkSubscription()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
