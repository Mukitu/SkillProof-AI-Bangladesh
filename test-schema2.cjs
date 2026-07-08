require('dotenv').config({ path: '.env.local' }) || require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase.from('profiles').select('social_links').limit(1);
  if (error) console.error("ERROR:", error.message);
  else console.log("FOUND social_links!");
}
check();
