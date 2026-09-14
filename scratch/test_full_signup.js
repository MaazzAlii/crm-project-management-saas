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
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

const anonClient = createClient(supabaseUrl, anonKey);
const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  const testEmail = `newuser_${Date.now()}@example.com`;
  const testPassword = 'Password123!';

  console.log('1. Signing up user:', testEmail);
  const { data: authData, error: signUpError } = await anonClient.auth.signUp({
    email: testEmail,
    password: testPassword,
    options: {
      data: { full_name: 'New Test User' }
    }
  });

  if (signUpError) {
    console.error('SIGNUP ERROR:', signUpError);
    return;
  }

  const userId = authData.user.id;
  console.log('User created in GoTrue auth.users! ID:', userId);

  console.log('2. Provisioning profile via admin client...');
  const { data: profileData, error: profileError } = await adminClient.from('profiles').upsert({
    id: userId,
    email: testEmail,
    full_name: 'New Test User'
  }).select();

  if (profileError) {
    console.error('PROFILE CREATION ERROR:', profileError);
    return;
  }

  console.log('3. Profile created successfully! Profile Data:', profileData);
}

run();
