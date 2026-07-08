require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data: { user } } = await supabase.auth.signInWithPassword({
    email: "testuser_99@example.com",
    password: "password123"
  });
  
  const newProfile = {
    id: user.id,
    full_name: "Test User",
    email: "testuser_99@example.com",
    skills: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase.from('profiles').upsert(newProfile, { onConflict: 'id' });
  console.log("Upsert Profile Error:", error ? error.message : "Success!");
}
check();
