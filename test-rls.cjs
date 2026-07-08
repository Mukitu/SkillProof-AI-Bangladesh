require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data: { user } } = await supabase.auth.signInWithPassword({
    email: "testuser_99@example.com",
    password: "password123"
  });

  const row = {
    id: "00000000-0000-0000-0000-000000000001",
    user_id: user.id
  };
  const { error } = await supabase.from('cv_resumes').upsert(row);
  console.log("Upsert error:", error ? error.message : "Success!");
}
check();
