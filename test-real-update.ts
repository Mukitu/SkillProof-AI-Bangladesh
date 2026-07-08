import { mockDb } from './src/lib/supabase';

async function check() {
  const { data: user } = await mockDb.getCurrentUser();
  if (!user) { console.log("Not logged in"); return; }
  const res = await mockDb.updateProfile(user.id, { avatarUrl: 'https://example.com/avatar3.jpg' });
  console.log("Update result:", res);
}
check();
