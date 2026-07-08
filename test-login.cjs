require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const email = "nishat.af27@gmail.com";
  // The user probably hasn't signed up with this email via the auth UI if we are just testing, but let's try a fake login to see the error.
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: "password123"
  });
  console.log("Login error:", error ? error.message : "Success!");
  
  if (data.user) {
    const { data: profile, error: profErr } = await supabase.from('profiles').select('*').eq('id', data.user.id).maybeSingle();
    console.log("Profile check:", profErr ? profErr.message : (profile ? "Found Profile" : "No Profile"));
  }
}
check();
