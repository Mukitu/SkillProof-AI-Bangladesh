import { createClient } from '@supabase/supabase-js';
async function check() {
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
  const { error } = await supabase.from('reports').insert([{ 
    id: '123e4567-e89b-12d3-a456-426614174000',
    type: 'career_progress',
    title_en: 'Career Progress',
    data: { score: 100 }
  }]);
  console.log(error ? error.message : "Inserted");
}
check();
