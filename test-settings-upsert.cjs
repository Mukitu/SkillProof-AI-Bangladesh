require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data: { user }, error: authErr } = await supabase.auth.signInWithPassword({
    email: "testuser_99@example.com",
    password: "password123"
  });
  if (authErr) {
    console.error("Auth error:", authErr.message);
    return;
  }
  
  const { error } = await supabase.from('user_settings').upsert({
    user_id: user.id,
    language: 'bn',
    theme: 'dark'
  });
  console.log("Upsert check:", error ? error.message : "Success!");
}
check();
