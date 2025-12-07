// Quick script to update business email
// Run with: node update-business-email.js

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://znxzbykqudabqxbtfgtw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpueHpieWtxdWRhYnF4YnRmZ3R3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDg4ODgxNywiZXhwIjoyMDgwNDY0ODE3fQ.9kSUVagItFXZNPoJh3tPIy6KyWpX2yRIg-5Ok01KN2k'
);

async function updateBusinessEmail() {
  // First, let's see what businesses exist
  const { data: businesses } = await supabase
    .from('businesses')
    .select('*');

  console.log('Current businesses:', businesses);

  if (businesses && businesses.length > 0) {
    const businessId = businesses[0].id;

    // Update the first business to use your email
    const { data, error } = await supabase
      .from('businesses')
      .update({ email: 'cdallessandro@hotmail.com' })
      .eq('id', businessId)
      .select();

    if (error) {
      console.error('Error updating business:', error);
    } else {
      console.log('✅ Business email updated:', data);
    }
  } else {
    console.log('No businesses found. Please sign up first.');
  }
}

updateBusinessEmail();
