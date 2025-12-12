// Quick script to check if social_connections table exists
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Manually load .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim();
  }
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTable() {
  console.log('Checking social_connections table...');

  try {
    const { data, error } = await supabase
      .from('social_connections')
      .select('*')
      .limit(1);

    if (error) {
      console.log('❌ Table does not exist or has issues:', error.message);
      console.log('\n📝 You need to create the table. Run this SQL in your Supabase SQL Editor:');
      console.log('\nGo to: https://znxzbykqudabqxbtfgtw.supabase.co/project/znxzbykqudabqxbtfgtw/sql');
      console.log('\nCopy and paste the contents of create_social_connections_simple.sql\n');
      return false;
    }

    console.log('✅ Table exists and is accessible!');
    console.log('Data:', data);
    return true;
  } catch (err) {
    console.error('Error:', err);
    return false;
  }
}

checkTable();
