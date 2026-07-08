require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data: { user } } = await supabase.auth.signInWithPassword({
    email: "testuser_99@example.com",
    password: "password123"
  });
  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
  console.log("Profile:", data ? "Exists" : "MISSING!");
}
check();
