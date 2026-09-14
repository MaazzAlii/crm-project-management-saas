const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envFile = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Testing Admin Client with URL:', supabaseUrl);
console.log('Service Key:', serviceRoleKey ? serviceRoleKey.substring(0, 40) + '...' : 'NONE');

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  const testId = '11111111-2222-3333-4444-555555555555';
  const { data, error } = await adminClient.from('profiles').upsert({
    id: testId,
    email: 'admin_test@example.com',
    full_name: 'Admin Test User'
  }).select();

  if (error) {
    console.error('UPSERT ERROR:', error);
  } else {
    console.log('UPSERT SUCCESS! Profile Data:', data);
  }
}

run();
