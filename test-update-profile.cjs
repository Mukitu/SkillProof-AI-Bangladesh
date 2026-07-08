require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data: { user } } = await supabase.auth.signInWithPassword({
    email: "testuser_99@example.com",
    password: "password123"
  });

  const dbUpdates = {
    updated_at: new Date().toISOString(),
    full_name: "Test Update"
  };

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('email, social_links')
    .eq('id', user.id)
    .maybeSingle();

  if (!currentProfile) {
    dbUpdates.email = user.email || '';
  } else if (currentProfile.email) {
    dbUpdates.email = currentProfile.email;
  }

  const { error } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      ...dbUpdates
    });

  console.log("Upsert Error:", error ? error.message : "Success!");
}
check();
