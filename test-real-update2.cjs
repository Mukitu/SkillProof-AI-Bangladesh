require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data: { user } } = await supabase.auth.signInWithPassword({
    email: "testuser_99@example.com",
    password: "password123"
  });

  const updates = { avatarUrl: 'https://example.com/avatar4.jpg' };
  
  const dbUpdates = {};
  if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('email, full_name, social_links')
    .eq('id', user.id)
    .maybeSingle();

  if (!currentProfile) {
    dbUpdates.email = user.email || '';
  } else if (currentProfile.email) {
    dbUpdates.email = currentProfile.email;
  }

  if (dbUpdates.full_name === undefined) {
    if (currentProfile && currentProfile.full_name) {
      dbUpdates.full_name = currentProfile.full_name;
    } else {
      dbUpdates.full_name = updates.fullName || 'User';
    }
  }

  // Merge social links...
  const currentSocial = currentProfile?.social_links || {};
  dbUpdates.social_links = {
    ...currentSocial
  };

  const { error, data } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      ...dbUpdates
    })
    .select()
    .single();

  console.log("Upsert Error:", error ? error.message : "Success!");
}
check();
