require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data: { user } } = await supabase.auth.signInWithPassword({
    email: "testuser_99@example.com",
    password: "password123"
  });

  const base64 = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/"; // a fake base64 string
  
  const { error } = await supabase
    .from('profiles')
    .update({ avatar_url: base64 })
    .eq('id', user.id);

  console.log("Update Error:", error ? error.message : "Success!");
}
check();
