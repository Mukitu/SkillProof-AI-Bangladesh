import { supabaseClient } from './supabase';
export const coachDb: any = new Proxy({}, {
  get: () => async (...args: any[]) => []
});
