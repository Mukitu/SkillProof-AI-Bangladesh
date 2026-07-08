require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const email = "testuser_99@example.com";
  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: "password123",
    options: {
      data: {
        full_name: "Test User"
      }
    }
  });
  console.log("Signup error:", error ? error.message : "Success!");
  if (data?.session === null) {
      console.log("Session is null! Email confirmation required!");
  } else {
      console.log("Session exists! Auto-login works!");
  }
}
check();
