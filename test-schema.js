import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function check() {
  const cols = ['username', 'dob', 'date_of_birth', 'gender', 'country', 'city', 'address', 'university', 'department', 'semester', 'linkedin', 'github', 'portfolio', 'bio'];
  for (let col of cols) {
    const { error } = await supabase.from('profiles').select(`${col}`).limit(1);
    if (!error) console.log(`FOUND profiles.${col}`);
    else console.log(`ERROR profiles.${col}: ${error.message}`);
  }
}
check();
